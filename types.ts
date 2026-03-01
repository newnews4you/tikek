export enum Sender {
  USER = 'USER',
  AI = 'AI'
}

export enum RagState {
  IDLE = 'IDLE',
  RETRIEVING = 'RETRIEVING',
  ANALYZING = 'ANALYZING',
  GENERATING = 'GENERATING'
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Citation {
  source: string;
  reference: string;
  snippet?: string;
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
  citations?: Citation[];
  isStreaming?: boolean;
  image?: string;
  suggestions?: string[];
  groundingSources?: GroundingSource[]; // New field for Real RAG links
}

export interface RagDocument {
  title: string;
  type: 'BIBLE' | 'CATECHISM' | 'ENCYCLICAL' | 'SAINT';
  icon: string;
}

export type GroupMemberRole = 'owner' | 'moderator' | 'member';
export type JoinRequestStatus = 'pending' | 'approved' | 'rejected';
export type GroupPostSource = 'bible_reader' | 'manual';
export type ReactionEmoji = '🙏' | '❤️' | '🔥' | '🕊️' | '📖';

export interface SharedScripturePayload {
  book: string;
  chapter: number;
  verses: number[];
  text: string;
  reference: string;
}

export interface UserProfile {
  id?: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

export interface PrayerGroup {
  id: string;
  name: string;
  description: string;
  invite_code: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  my_role?: GroupMemberRole;
}

export interface PrayerGroupMember {
  group_id: string;
  user_id: string;
  role: GroupMemberRole;
  created_at: string;
}

export interface PrayerGroupJoinRequest {
  id: string;
  group_id: string;
  requester_id: string;
  status: JoinRequestStatus;
  message: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface PrayerGroupPost {
  id: string;
  group_id: string;
  author_id: string;
  source: GroupPostSource;
  scripture_book: string;
  scripture_chapter: number;
  scripture_verses: number[];
  scripture_text: string;
  comment: string;
  created_at: string;
  updated_at: string;
  profiles?: UserProfile;
}

export interface PrayerGroupPostReaction {
  post_id: string;
  user_id: string;
  emoji: ReactionEmoji;
  updated_at: string;
}

export interface PrayerGroupComment {
  id: string;
  post_id: string;
  author_id: string;
  parent_comment_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  profiles?: UserProfile;
}
