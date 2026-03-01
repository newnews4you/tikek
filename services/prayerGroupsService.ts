import { supabase } from './supabaseClient';
import {
  GroupMemberRole,
  PrayerGroup,
  PrayerGroupComment,
  PrayerGroupJoinRequest,
  PrayerGroupMember,
  PrayerGroupPost,
  PrayerGroupPostReaction,
  ReactionEmoji
} from '../types';

interface CreatePostInput {
  groupId: string;
  source: 'bible_reader' | 'manual';
  scriptureBook: string;
  scriptureChapter: number;
  scriptureVerses: number[];
  scriptureText: string;
  comment: string;
}

interface UpdatePostInput {
  comment: string;
}

interface UpdateCommentInput {
  body: string;
}

const ensureClient = () => {
  if (!supabase) {
    throw new Error('Supabase client is not configured');
  }
  return supabase;
};

const getCurrentUserId = async (): Promise<string> => {
  const client = ensureClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data?.user) {
    throw new Error('User is not authenticated');
  }
  return data.user.id;
};

// Fetch profiles separately to avoid PostgREST join/schema-cache issues
const fetchProfilesByIds = async (userIds: string[]): Promise<Record<string, { full_name: string | null; email: string | null; avatar_url: string | null }>> => {
  if (userIds.length === 0) return {};
  const client = ensureClient();
  const unique = [...new Set(userIds)];
  const { data, error } = await client
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .in('id', unique);

  if (error) {
    console.warn('Could not fetch profiles:', error.message);
    return {};
  }

  const map: Record<string, { full_name: string | null; email: string | null; avatar_url: string | null }> = {};
  (data || []).forEach((p: any) => { map[p.id] = { full_name: p.full_name, email: p.email, avatar_url: p.avatar_url }; });
  return map;
};

const normalizeGroup = (row: any): PrayerGroup => ({
  id: row.id,
  name: row.name,
  description: row.description || '',
  invite_code: row.invite_code || '',
  created_by: row.created_by,
  created_at: row.created_at,
  updated_at: row.updated_at,
  my_role: row.my_role
});

export const isPrayerGroupsConfigured = (): boolean => !!supabase;

export const createGroup = async (name: string, description: string): Promise<PrayerGroup> => {
  const client = ensureClient();
  const { data, error } = await client.rpc('create_prayer_group', {
    p_description: description,
    p_name: name
  });
  if (error) throw error;

  const group = Array.isArray(data) ? data[0] : data;
  if (!group) throw new Error('Group creation returned empty response');

  return normalizeGroup({
    ...group,
    my_role: 'owner'
  });
};

export const listMyGroups = async (): Promise<PrayerGroup[]> => {
  const client = ensureClient();
  const { data, error } = await client
    .from('prayer_group_members')
    .select('role, prayer_groups(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const mapped = (data || [])
    .map((row: any) => {
      if (!row?.prayer_groups) return null;
      return normalizeGroup({
        ...(row.prayer_groups as any),
        my_role: row.role as GroupMemberRole
      });
    })
    .filter((row: PrayerGroup | null): row is PrayerGroup => !!row);

  // Deduplicate by group ID in case of multiple membership row anomalies
  const uniqueGroups = Array.from(new Map(mapped.map(g => [g.id, g])).values());

  return uniqueGroups.sort((a, b) => {
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
};

export const requestJoinByCode = async (code: string, message: string): Promise<PrayerGroupJoinRequest> => {
  const client = ensureClient();
  const { data, error } = await client.rpc('request_group_join_by_code', {
    p_invite_code: code.trim(),
    p_message: message || ''
  });

  if (error) throw error;
  const request = Array.isArray(data) ? data[0] : data;
  if (!request) throw new Error('Join request returned empty response');
  return request as PrayerGroupJoinRequest;
};

export const listPendingRequests = async (groupId: string): Promise<PrayerGroupJoinRequest[]> => {
  const client = ensureClient();
  const { data, error } = await client
    .from('prayer_group_join_requests')
    .select('*')
    .eq('group_id', groupId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []) as PrayerGroupJoinRequest[];
};

export const reviewJoinRequest = async (
  requestId: string,
  decision: 'approved' | 'rejected'
): Promise<PrayerGroupJoinRequest> => {
  const client = ensureClient();
  const { data, error } = await client.rpc('review_group_join_request', {
    p_request_id: requestId,
    p_decision: decision
  });
  if (error) throw error;

  const request = Array.isArray(data) ? data[0] : data;
  if (!request) throw new Error('Request review returned empty response');
  return request as PrayerGroupJoinRequest;
};

export const rotateInviteCode = async (groupId: string): Promise<string> => {
  const client = ensureClient();
  const { data, error } = await client.rpc('rotate_group_invite_code', {
    p_group_id: groupId
  });
  if (error) throw error;

  if (typeof data === 'string') return data;
  if (Array.isArray(data) && data.length > 0) {
    const maybeRow = data[0];
    if (typeof maybeRow === 'string') return maybeRow;
    if (maybeRow?.invite_code) return maybeRow.invite_code;
  }
  if ((data as any)?.invite_code) return (data as any).invite_code;

  throw new Error('Invite code rotation returned empty response');
};

export const listGroupMembers = async (groupId: string): Promise<PrayerGroupMember[]> => {
  const client = ensureClient();
  const { data, error } = await client
    .from('prayer_group_members')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  const members = (data || []) as PrayerGroupMember[];

  // Fetch profiles separately and attach
  const profileMap = await fetchProfilesByIds(members.map(m => m.user_id));
  return members.map(m => ({ ...m, profiles: profileMap[m.user_id] || null } as any));
};

export const setMemberRole = async (
  groupId: string,
  userId: string,
  role: GroupMemberRole
): Promise<PrayerGroupMember> => {
  const client = ensureClient();
  const { data, error } = await client.rpc('set_group_member_role', {
    p_group_id: groupId,
    p_user_id: userId,
    p_role: role
  });

  if (error) throw error;
  const member = Array.isArray(data) ? data[0] : data;
  if (!member) throw new Error('Set role returned empty response');
  return member as PrayerGroupMember;
};

export const removeMember = async (groupId: string, userId: string): Promise<void> => {
  const client = ensureClient();
  const { error } = await client.rpc('remove_group_member', {
    p_group_id: groupId,
    p_user_id: userId
  });
  if (error) throw error;
};

export const createPost = async (input: CreatePostInput): Promise<PrayerGroupPost> => {
  const client = ensureClient();
  const userId = await getCurrentUserId();

  const { data, error } = await client
    .from('prayer_group_posts')
    .insert({
      group_id: input.groupId,
      author_id: userId,
      source: input.source,
      scripture_book: input.scriptureBook,
      scripture_chapter: input.scriptureChapter,
      scripture_verses: input.scriptureVerses,
      scripture_text: input.scriptureText,
      comment: input.comment || ''
    })
    .select('*')
    .single();

  if (error) throw error;

  // Attach profile
  const profileMap = await fetchProfilesByIds([userId]);
  return { ...data, profiles: profileMap[userId] || null } as PrayerGroupPost;
};

export const listPosts = async (
  groupId: string,
  page: number = 1,
  limit: number = 20
): Promise<PrayerGroupPost[]> => {
  const client = ensureClient();
  const from = (Math.max(page, 1) - 1) * limit;
  const to = from + limit - 1;

  const { data, error } = await client
    .from('prayer_group_posts')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  const posts = (data || []) as PrayerGroupPost[];

  // Fetch profiles separately and attach
  const profileMap = await fetchProfilesByIds(posts.map(p => p.author_id));
  return posts.map(p => ({ ...p, profiles: profileMap[p.author_id] || null }));
};

export const updatePost = async (postId: string, input: UpdatePostInput): Promise<PrayerGroupPost> => {
  const client = ensureClient();
  const { data, error } = await client
    .from('prayer_group_posts')
    .update({
      comment: input.comment,
      updated_at: new Date().toISOString()
    })
    .eq('id', postId)
    .select('*')
    .single();

  if (error) throw error;
  return data as PrayerGroupPost;
};

export const deletePost = async (postId: string): Promise<void> => {
  const client = ensureClient();
  const { error } = await client.from('prayer_group_posts').delete().eq('id', postId);
  if (error) throw error;
};

export const listPostReactions = async (postIds: string[]): Promise<PrayerGroupPostReaction[]> => {
  if (postIds.length === 0) return [];
  const client = ensureClient();

  const { data, error } = await client
    .from('prayer_group_post_reactions')
    .select('*')
    .in('post_id', postIds);

  if (error) throw error;
  return (data || []) as PrayerGroupPostReaction[];
};

export const toggleReaction = async (
  postId: string,
  emoji: ReactionEmoji
): Promise<PrayerGroupPostReaction | null> => {
  const client = ensureClient();
  const userId = await getCurrentUserId();

  const { data: existing, error: existingError } = await client
    .from('prayer_group_post_reactions')
    .select('emoji')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing?.emoji === emoji) {
    const { error } = await client
      .from('prayer_group_post_reactions')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
    if (error) throw error;
    return null;
  }

  const { data, error } = await client
    .from('prayer_group_post_reactions')
    .upsert(
      {
        post_id: postId,
        user_id: userId,
        emoji,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'post_id,user_id' }
    )
    .select('*')
    .single();

  if (error) throw error;
  return data as PrayerGroupPostReaction;
};

export const listComments = async (postId: string): Promise<PrayerGroupComment[]> => {
  const client = ensureClient();
  const { data, error } = await client
    .from('prayer_group_post_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  const comments = (data || []) as PrayerGroupComment[];

  const profileMap = await fetchProfilesByIds(comments.map(c => c.author_id));
  return comments.map(c => ({ ...c, profiles: profileMap[c.author_id] || null }));
};

export const createComment = async (
  postId: string,
  body: string,
  parentCommentId?: string | null
): Promise<PrayerGroupComment> => {
  const client = ensureClient();
  const userId = await getCurrentUserId();

  const { data, error } = await client
    .from('prayer_group_post_comments')
    .insert({
      post_id: postId,
      author_id: userId,
      parent_comment_id: parentCommentId || null,
      body: body.trim()
    })
    .select('*')
    .single();

  if (error) throw error;

  const profileMap = await fetchProfilesByIds([userId]);
  return { ...data, profiles: profileMap[userId] || null } as PrayerGroupComment;
};

export const updateComment = async (
  commentId: string,
  input: UpdateCommentInput
): Promise<PrayerGroupComment> => {
  const client = ensureClient();
  const { data, error } = await client
    .from('prayer_group_post_comments')
    .update({
      body: input.body.trim(),
      updated_at: new Date().toISOString()
    })
    .eq('id', commentId)
    .select('*')
    .single();

  if (error) throw error;

  const profileMap = await fetchProfilesByIds([data.author_id]);
  return { ...data, profiles: profileMap[data.author_id] || null } as PrayerGroupComment;
};

export const deleteComment = async (commentId: string): Promise<void> => {
  const client = ensureClient();
  const { error } = await client
    .from('prayer_group_post_comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
};

// --- REAL-TIME SUBSCRIPTIONS ---

type RealtimeCallback<T> = (payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T | null;
  old: Partial<T> | null;
}) => void;

export const subscribeToGroupPosts = (
  groupId: string,
  callback: RealtimeCallback<PrayerGroupPost>
) => {
  const client = ensureClient();
  const channel = client.channel(`public:prayer_group_posts:group_id=eq.${groupId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'prayer_group_posts',
        filter: `group_id=eq.${groupId}`
      },
      (payload) => callback({
        eventType: payload.eventType as any,
        new: payload.new as PrayerGroupPost,
        old: payload.old as Partial<PrayerGroupPost>
      })
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
};

export const subscribeToPostReactions = (
  groupId: string, // For filtering context visually, although supabase doesn't support complex join filters here, we subscribe to all and filter on the client or let the UI handle finding the post via ID. 
  callback: RealtimeCallback<PrayerGroupPostReaction>
) => {
  const client = ensureClient();
  const channel = client.channel(`public:prayer_group_post_reactions`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'prayer_group_post_reactions'
      },
      (payload) => callback({
        eventType: payload.eventType as any,
        new: payload.new as PrayerGroupPostReaction,
        old: payload.old as Partial<PrayerGroupPostReaction>
      })
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
};

export const subscribeToPostComments = (
  postId: string,
  callback: RealtimeCallback<PrayerGroupComment>
) => {
  const client = ensureClient();
  const channel = client.channel(`public:prayer_group_post_comments:post_id=eq.${postId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'prayer_group_post_comments',
        filter: `post_id=eq.${postId}`
      },
      (payload) => callback({
        eventType: payload.eventType as any,
        new: payload.new as PrayerGroupComment,
        old: payload.old as Partial<PrayerGroupComment>
      })
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
};
