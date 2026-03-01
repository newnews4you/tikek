-- Prayer groups + scripture sharing schema
-- Date: 2026-03-01

create extension if not exists pgcrypto with schema extensions;

-- Create a secure public profiles table
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text
);

alter table public.profiles enable row level security;
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
drop policy if exists "Users can update own profile." on public.profiles;
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- Insert existing users
insert into public.profiles (id, email, full_name, avatar_url)
select id, email, raw_user_meta_data->>'full_name', raw_user_meta_data->>'avatar_url'
from auth.users
on conflict (id) do nothing;

-- Trigger for new users
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();



create table if not exists public.prayer_groups (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 80),
  description text not null default '',
  invite_code text not null unique,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prayer_group_members (
  group_id uuid not null references public.prayer_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'moderator', 'member')),
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.prayer_group_join_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  group_id uuid not null references public.prayer_groups(id) on delete cascade,
  requester_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  message text not null default '',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  unique (group_id, requester_id, status)
);

create table if not exists public.prayer_group_posts (
  id uuid primary key default extensions.gen_random_uuid(),
  group_id uuid not null references public.prayer_groups(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('bible_reader', 'manual')),
  scripture_book text not null,
  scripture_chapter int not null check (scripture_chapter > 0),
  scripture_verses int[] not null,
  scripture_text text not null,
  comment text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prayer_group_post_reactions (
  post_id uuid not null references public.prayer_group_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null check (emoji in ('🙏', '❤️', '🔥', '🕊️', '📖')),
  updated_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.prayer_group_post_comments (
  id uuid primary key default extensions.gen_random_uuid(),
  post_id uuid not null references public.prayer_group_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  parent_comment_id uuid references public.prayer_group_post_comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Fix author_id FK: replace auth.users reference with profiles reference
-- so PostgREST can infer the join unambiguously.
-- Drop the original auth.users FK first
alter table public.prayer_group_posts
  drop constraint if exists prayer_group_posts_author_id_fkey;
alter table public.prayer_group_posts
  drop constraint if exists prayer_group_posts_author_id_profile_fkey;
alter table public.prayer_group_posts
  add constraint prayer_group_posts_author_id_profile_fkey 
  foreign key (author_id) references public.profiles(id) on delete cascade;

alter table public.prayer_group_post_comments
  drop constraint if exists prayer_group_post_comments_author_id_fkey;
alter table public.prayer_group_post_comments
  drop constraint if exists prayer_group_post_comments_author_id_profile_fkey;
alter table public.prayer_group_post_comments
  add constraint prayer_group_post_comments_author_id_profile_fkey 
  foreign key (author_id) references public.profiles(id) on delete cascade;

create index if not exists idx_prayer_group_posts_group_created_desc
  on public.prayer_group_posts(group_id, created_at desc);

create index if not exists idx_prayer_group_join_requests_group_status_created_desc
  on public.prayer_group_join_requests(group_id, status, created_at desc);

create index if not exists idx_prayer_group_post_comments_post_created_asc
  on public.prayer_group_post_comments(post_id, created_at asc);

create index if not exists idx_prayer_group_members_user_created_desc
  on public.prayer_group_members(user_id, created_at desc);

create unique index if not exists idx_prayer_group_join_requests_pending_unique
  on public.prayer_group_join_requests(group_id, requester_id)
  where status = 'pending';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_prayer_groups_updated_at on public.prayer_groups;
create trigger trg_prayer_groups_updated_at
before update on public.prayer_groups
for each row
execute procedure public.set_updated_at();

drop trigger if exists trg_prayer_group_posts_updated_at on public.prayer_group_posts;
create trigger trg_prayer_group_posts_updated_at
before update on public.prayer_group_posts
for each row
execute procedure public.set_updated_at();

drop trigger if exists trg_prayer_group_post_comments_updated_at on public.prayer_group_post_comments;
create trigger trg_prayer_group_post_comments_updated_at
before update on public.prayer_group_post_comments
for each row
execute procedure public.set_updated_at();

create or replace function public.ensure_parent_comment_same_post()
returns trigger
language plpgsql
as $$
declare
  v_parent_post_id uuid;
begin
  if new.parent_comment_id is null then
    return new;
  end if;

  select post_id
  into v_parent_post_id
  from public.prayer_group_post_comments
  where id = new.parent_comment_id;

  if v_parent_post_id is null then
    raise exception 'Parent comment not found';
  end if;

  if v_parent_post_id <> new.post_id then
    raise exception 'Parent comment must belong to the same post';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_ensure_parent_comment_same_post on public.prayer_group_post_comments;
create trigger trg_ensure_parent_comment_same_post
before insert or update on public.prayer_group_post_comments
for each row
execute procedure public.ensure_parent_comment_same_post();

create or replace function public.generate_invite_code(p_length int default 10)
returns text
language plpgsql
as $$
declare
  v_raw text;
begin
  v_raw := upper(replace(encode(extensions.gen_random_bytes(16), 'base64'), '=', ''));
  v_raw := replace(replace(v_raw, '/', ''), '+', '');
  return substring(v_raw from 1 for greatest(6, p_length));
end;
$$;

create or replace function public.is_group_member(
  p_group_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.prayer_group_members m
    where m.group_id = p_group_id
      and m.user_id = p_user_id
  );
$$;

create or replace function public.has_group_role(
  p_group_id uuid,
  p_roles text[],
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.prayer_group_members m
    where m.group_id = p_group_id
      and m.user_id = p_user_id
      and m.role = any (p_roles)
  );
$$;

create or replace function public.create_prayer_group(
  p_description text,
  p_name text
)
returns public.prayer_groups
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_group public.prayer_groups;
  v_invite_code text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  v_invite_code := public.generate_invite_code(10);

  insert into public.prayer_groups (name, description, invite_code, created_by)
  values (trim(p_name), coalesce(p_description, ''), v_invite_code, v_user_id)
  returning * into v_group;

  insert into public.prayer_group_members (group_id, user_id, role)
  values (v_group.id, v_user_id, 'owner');

  return v_group;
end;
$$;

create or replace function public.request_group_join_by_code(
  p_invite_code text,
  p_message text default ''
)
returns public.prayer_group_join_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_group public.prayer_groups;
  v_existing_pending public.prayer_group_join_requests;
  v_request public.prayer_group_join_requests;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_group
  from public.prayer_groups
  where upper(invite_code) = upper(trim(p_invite_code));

  if v_group.id is null then
    raise exception 'Group with this invite code was not found';
  end if;

  if public.is_group_member(v_group.id, v_user_id) then
    raise exception 'You are already a member of this group';
  end if;

  select *
  into v_existing_pending
  from public.prayer_group_join_requests
  where group_id = v_group.id
    and requester_id = v_user_id
    and status = 'pending'
  limit 1;

  if v_existing_pending.id is not null then
    return v_existing_pending;
  end if;

  insert into public.prayer_group_join_requests (group_id, requester_id, status, message)
  values (v_group.id, v_user_id, 'pending', coalesce(p_message, ''))
  returning * into v_request;

  return v_request;
end;
$$;

create or replace function public.review_group_join_request(
  p_request_id uuid,
  p_decision text
)
returns public.prayer_group_join_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_request public.prayer_group_join_requests;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected';
  end if;

  select *
  into v_request
  from public.prayer_group_join_requests
  where id = p_request_id
  for update;

  if v_request.id is null then
    raise exception 'Join request not found';
  end if;

  if not public.has_group_role(v_request.group_id, array['owner', 'moderator'], v_user_id) then
    raise exception 'Not enough permissions';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'Join request is already reviewed';
  end if;

  update public.prayer_group_join_requests
  set status = p_decision,
      reviewed_at = now(),
      reviewed_by = v_user_id
  where id = p_request_id
  returning * into v_request;

  if p_decision = 'approved' then
    insert into public.prayer_group_members (group_id, user_id, role)
    values (v_request.group_id, v_request.requester_id, 'member')
    on conflict (group_id, user_id) do nothing;
  end if;

  return v_request;
end;
$$;

create or replace function public.rotate_group_invite_code(
  p_group_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_new_code text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not public.has_group_role(p_group_id, array['owner'], v_user_id) then
    raise exception 'Only owner can rotate invite code';
  end if;

  v_new_code := public.generate_invite_code(10);

  update public.prayer_groups
  set invite_code = v_new_code,
      updated_at = now()
  where id = p_group_id;

  return v_new_code;
end;
$$;

create or replace function public.set_group_member_role(
  p_group_id uuid,
  p_user_id uuid,
  p_role text
)
returns public.prayer_group_members
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_target public.prayer_group_members;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_role not in ('owner', 'moderator', 'member') then
    raise exception 'Invalid role';
  end if;

  if not public.has_group_role(p_group_id, array['owner'], v_user_id) then
    raise exception 'Only owner can change roles';
  end if;

  select *
  into v_target
  from public.prayer_group_members
  where group_id = p_group_id
    and user_id = p_user_id
  for update;

  if v_target.user_id is null then
    raise exception 'Target member not found';
  end if;

  if v_target.role = 'owner' then
    raise exception 'Changing owner role is not allowed in this version';
  end if;

  if p_role = 'owner' then
    raise exception 'Promoting to owner is not allowed in this version';
  end if;

  update public.prayer_group_members
  set role = p_role
  where group_id = p_group_id
    and user_id = p_user_id
  returning * into v_target;

  return v_target;
end;
$$;

create or replace function public.remove_group_member(
  p_group_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_actor_role text;
  v_target_role text;
begin
  v_actor_id := auth.uid();
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  select role
  into v_actor_role
  from public.prayer_group_members
  where group_id = p_group_id
    and user_id = v_actor_id;

  if v_actor_role is null then
    raise exception 'Only group members can manage members';
  end if;

  if v_actor_id = p_user_id then
    raise exception 'Self-removal is not allowed in this version';
  end if;

  select role
  into v_target_role
  from public.prayer_group_members
  where group_id = p_group_id
    and user_id = p_user_id
  for update;

  if v_target_role is null then
    raise exception 'Target member not found';
  end if;

  if v_target_role = 'owner' then
    raise exception 'Owner cannot be removed';
  end if;

  if v_actor_role = 'member' then
    raise exception 'Members cannot remove other members';
  end if;

  if v_actor_role = 'moderator' and v_target_role <> 'member' then
    raise exception 'Moderator can remove only members';
  end if;

  delete from public.prayer_group_members
  where group_id = p_group_id
    and user_id = p_user_id;
end;
$$;

alter table public.prayer_groups enable row level security;
alter table public.prayer_group_members enable row level security;
alter table public.prayer_group_join_requests enable row level security;
alter table public.prayer_group_posts enable row level security;
alter table public.prayer_group_post_reactions enable row level security;
alter table public.prayer_group_post_comments enable row level security;

drop policy if exists prayer_groups_select_members on public.prayer_groups;
create policy prayer_groups_select_members
on public.prayer_groups
for select
to authenticated
using (public.is_group_member(id, auth.uid()));

drop policy if exists prayer_groups_update_owner on public.prayer_groups;
create policy prayer_groups_update_owner
on public.prayer_groups
for update
to authenticated
using (public.has_group_role(id, array['owner'], auth.uid()))
with check (public.has_group_role(id, array['owner'], auth.uid()));

drop policy if exists prayer_groups_delete_owner on public.prayer_groups;
create policy prayer_groups_delete_owner
on public.prayer_groups
for delete
to authenticated
using (public.has_group_role(id, array['owner'], auth.uid()));

drop policy if exists prayer_group_members_select_members on public.prayer_group_members;
create policy prayer_group_members_select_members
on public.prayer_group_members
for select
to authenticated
using (public.is_group_member(group_id, auth.uid()));

drop policy if exists prayer_group_join_requests_select on public.prayer_group_join_requests;
create policy prayer_group_join_requests_select
on public.prayer_group_join_requests
for select
to authenticated
using (
  requester_id = auth.uid()
  or public.has_group_role(group_id, array['owner', 'moderator'], auth.uid())
);

drop policy if exists prayer_group_posts_select_members on public.prayer_group_posts;
create policy prayer_group_posts_select_members
on public.prayer_group_posts
for select
to authenticated
using (public.is_group_member(group_id, auth.uid()));

drop policy if exists prayer_group_posts_insert_members on public.prayer_group_posts;
create policy prayer_group_posts_insert_members
on public.prayer_group_posts
for insert
to authenticated
with check (
  author_id = auth.uid()
  and public.is_group_member(group_id, auth.uid())
);

drop policy if exists prayer_group_posts_update_author_or_mod on public.prayer_group_posts;
create policy prayer_group_posts_update_author_or_mod
on public.prayer_group_posts
for update
to authenticated
using (
  author_id = auth.uid()
  or public.has_group_role(group_id, array['owner', 'moderator'], auth.uid())
)
with check (
  author_id = auth.uid()
  or public.has_group_role(group_id, array['owner', 'moderator'], auth.uid())
);

drop policy if exists prayer_group_posts_delete_author_or_mod on public.prayer_group_posts;
create policy prayer_group_posts_delete_author_or_mod
on public.prayer_group_posts
for delete
to authenticated
using (
  author_id = auth.uid()
  or public.has_group_role(group_id, array['owner', 'moderator'], auth.uid())
);

drop policy if exists prayer_group_post_reactions_select_members on public.prayer_group_post_reactions;
create policy prayer_group_post_reactions_select_members
on public.prayer_group_post_reactions
for select
to authenticated
using (
  public.is_group_member(
    (select p.group_id from public.prayer_group_posts p where p.id = post_id),
    auth.uid()
  )
);

drop policy if exists prayer_group_post_reactions_insert_members on public.prayer_group_post_reactions;
create policy prayer_group_post_reactions_insert_members
on public.prayer_group_post_reactions
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_group_member(
    (select p.group_id from public.prayer_group_posts p where p.id = post_id),
    auth.uid()
  )
);

drop policy if exists prayer_group_post_reactions_update_own on public.prayer_group_post_reactions;
create policy prayer_group_post_reactions_update_own
on public.prayer_group_post_reactions
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists prayer_group_post_reactions_delete_own_or_mod on public.prayer_group_post_reactions;
create policy prayer_group_post_reactions_delete_own_or_mod
on public.prayer_group_post_reactions
for delete
to authenticated
using (
  user_id = auth.uid()
  or public.has_group_role(
    (select p.group_id from public.prayer_group_posts p where p.id = post_id),
    array['owner', 'moderator'],
    auth.uid()
  )
);

drop policy if exists prayer_group_post_comments_select_members on public.prayer_group_post_comments;
create policy prayer_group_post_comments_select_members
on public.prayer_group_post_comments
for select
to authenticated
using (
  public.is_group_member(
    (select p.group_id from public.prayer_group_posts p where p.id = post_id),
    auth.uid()
  )
);

drop policy if exists prayer_group_post_comments_insert_members on public.prayer_group_post_comments;
create policy prayer_group_post_comments_insert_members
on public.prayer_group_post_comments
for insert
to authenticated
with check (
  author_id = auth.uid()
  and public.is_group_member(
    (select p.group_id from public.prayer_group_posts p where p.id = post_id),
    auth.uid()
  )
);

drop policy if exists prayer_group_post_comments_update_author_or_mod on public.prayer_group_post_comments;
create policy prayer_group_post_comments_update_author_or_mod
on public.prayer_group_post_comments
for update
to authenticated
using (
  author_id = auth.uid()
  or public.has_group_role(
    (select p.group_id from public.prayer_group_posts p where p.id = post_id),
    array['owner', 'moderator'],
    auth.uid()
  )
)
with check (
  author_id = auth.uid()
  or public.has_group_role(
    (select p.group_id from public.prayer_group_posts p where p.id = post_id),
    array['owner', 'moderator'],
    auth.uid()
  )
);

drop policy if exists prayer_group_post_comments_delete_author_or_mod on public.prayer_group_post_comments;
create policy prayer_group_post_comments_delete_author_or_mod
on public.prayer_group_post_comments
for delete
to authenticated
using (
  author_id = auth.uid()
  or public.has_group_role(
    (select p.group_id from public.prayer_group_posts p where p.id = post_id),
    array['owner', 'moderator'],
    auth.uid()
  )
);

grant execute on function public.create_prayer_group(text, text) to authenticated;
grant execute on function public.request_group_join_by_code(text, text) to authenticated;
grant execute on function public.review_group_join_request(uuid, text) to authenticated;
grant execute on function public.rotate_group_invite_code(uuid) to authenticated;
grant execute on function public.set_group_member_role(uuid, uuid, text) to authenticated;
grant execute on function public.remove_group_member(uuid, uuid) to authenticated;

-- Enable Supabase Realtime for these tables idempotently
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'prayer_group_posts') then
    alter publication supabase_realtime add table public.prayer_group_posts;
  end if;

  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'prayer_group_post_comments') then
    alter publication supabase_realtime add table public.prayer_group_post_comments;
  end if;

  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'prayer_group_post_reactions') then
    alter publication supabase_realtime add table public.prayer_group_post_reactions;
  end if;
end $$;

notify pgrst, 'reload schema';
