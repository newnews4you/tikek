
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check, Loader2, Lock, MessageCircle, RefreshCw, RotateCw, Send, Shield, Users, UserPlus, X, Plus, Hash, BookOpen, Info, ChevronLeft, LogIn, User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { AuthModal } from '../Auth/AuthModal';
import {
  createComment,
  createGroup,
  createPost,
  deleteComment,
  deletePost,
  isPrayerGroupsConfigured,
  listComments,
  listGroupMembers,
  listMyGroups,
  listPendingRequests,
  listPostReactions,
  listPosts,
  removeMember,
  requestJoinByCode,
  reviewJoinRequest,
  rotateInviteCode,
  setMemberRole,
  toggleReaction,
  updateComment,
  updatePost,
  subscribeToGroupPosts,
  subscribeToPostReactions,
  subscribeToPostComments
} from '../../services/prayerGroupsService';
import {
  GroupMemberRole,
  PrayerGroup,
  PrayerGroupComment,
  PrayerGroupJoinRequest,
  PrayerGroupMember,
  PrayerGroupPost,
  ReactionEmoji,
  SharedScripturePayload
} from '../../types';

interface PrayerGroupsViewProps {
  pendingSharedExcerpt: SharedScripturePayload | null;
  onConsumePendingExcerpt: () => void;
}

type ReactionSummary = { counts: Record<ReactionEmoji, number>; userReaction?: ReactionEmoji };

const REACTIONS = [
  '\u{1F64F}',
  '\u2764\uFE0F',
  '\u{1F525}',
  '\u{1F54A}\uFE0F',
  '\u{1F4D6}'
] as ReactionEmoji[];
const ROLE_LABELS: Record<GroupMemberRole, string> = {
  owner: 'Savininkas',
  moderator: 'Moderatorius',
  member: 'Narys'
};

const formatMessageTime = (timestamp: string): string =>
  new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const createEmptyReactionCounts = (): Record<ReactionEmoji, number> =>
  REACTIONS.reduce((acc, emoji) => {
    acc[emoji] = 0;
    return acc;
  }, {} as Record<ReactionEmoji, number>);

export const PrayerGroupsView: React.FC<PrayerGroupsViewProps> = ({
  pendingSharedExcerpt,
  onConsumePendingExcerpt
}) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const supabaseReady = isPrayerGroupsConfigured();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [groups, setGroups] = useState<PrayerGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const [posts, setPosts] = useState<PrayerGroupPost[]>([]);
  const [reactionsByPost, setReactionsByPost] = useState<Record<string, ReactionSummary>>({});

  const [pendingRequests, setPendingRequests] = useState<PrayerGroupJoinRequest[]>([]);
  const [members, setMembers] = useState<PrayerGroupMember[]>([]);

  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinMessage, setJoinMessage] = useState('');

  const [source, setSource] = useState<'bible_reader' | 'manual'>('manual');
  const [book, setBook] = useState('');
  const [chapter, setChapter] = useState(1);
  const [verses, setVerses] = useState('');
  const [scriptureText, setScriptureText] = useState('');
  const [comment, setComment] = useState('');

  const [drawerPost, setDrawerPost] = useState<PrayerGroupPost | null>(null);
  const [comments, setComments] = useState<PrayerGroupComment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showBibleAttachment, setShowBibleAttachment] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [posts]);

  const selectedGroup = useMemo(
    () => groups.find(group => group.id === selectedGroupId) || null,
    [groups, selectedGroupId]
  );
  const selectedRole: GroupMemberRole | null = selectedGroup?.my_role || null;
  const isOwner = selectedRole === 'owner';
  const canModerate = selectedRole === 'owner' || selectedRole === 'moderator';
  const orderedPosts = useMemo(
    () =>
      [...posts].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    [posts]
  );

  const commentsByParent = useMemo(() => {
    const map: Record<string, PrayerGroupComment[]> = {};
    comments.forEach(commentRow => {
      const key = commentRow.parent_comment_id || 'root';
      if (!map[key]) map[key] = [];
      map[key].push(commentRow);
    });
    return map;
  }, [comments]);

  const setNotice = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccess(message);
      setError(null);
    } else {
      setError(message);
      setSuccess(null);
    }

    window.setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 3500);
  };

  const loadGroups = useCallback(async () => {
    if (!supabaseReady || !user) return;

    const fetched = await listMyGroups();
    setGroups(fetched);

    // If the currently selected group no longer exists (e.g., deleted or kicked), clear it
    if (selectedGroupId && !fetched.some(group => group.id === selectedGroupId)) {
      setSelectedGroupId(null);
    }
  }, [selectedGroupId, supabaseReady, user]);

  const loadPosts = useCallback(async () => {
    if (!selectedGroupId) return;

    const fetched = await listPosts(selectedGroupId, 1, 50);
    setPosts(fetched);

    const reactionRows = await listPostReactions(fetched.map(post => post.id));
    const summary: Record<string, ReactionSummary> = {};

    fetched.forEach(post => {
      summary[post.id] = { counts: createEmptyReactionCounts() };
    });

    reactionRows.forEach(row => {
      if (!summary[row.post_id]) {
        summary[row.post_id] = { counts: createEmptyReactionCounts() };
      }

      summary[row.post_id].counts[row.emoji] += 1;
      if (user && row.user_id === user.id) summary[row.post_id].userReaction = row.emoji;
    });

    setReactionsByPost(summary);
  }, [selectedGroupId, user]);

  const loadManagement = useCallback(async () => {
    if (!selectedGroupId || !canModerate) {
      setPendingRequests([]);
      setMembers([]);
      return;
    }

    const [requests, groupMembers] = await Promise.all([
      listPendingRequests(selectedGroupId),
      listGroupMembers(selectedGroupId)
    ]);

    setPendingRequests(requests);
    setMembers(groupMembers);
  }, [canModerate, selectedGroupId]);

  const loadComments = useCallback(async (post: PrayerGroupPost) => {
    const loadedComments = await listComments(post.id);
    setDrawerPost(post);
    setComments(loadedComments);
    setCommentInput('');
    setReplyToId(null);
  }, []);

  useEffect(() => {
    if (!supabaseReady || !user) return;
    loadGroups().catch((e: any) => setNotice(e.message || 'Nepavyko ikelti grupiu.', 'error'));
  }, [supabaseReady, user, loadGroups]);

  useEffect(() => {
    if (!selectedGroupId) return;
    loadPosts().catch((e: any) => setNotice(e.message || 'Nepavyko ikelti pokalbio.', 'error'));

    // Set up real-time subscriptions for posts and reactions
    const unsubscribePosts = subscribeToGroupPosts(selectedGroupId, (payload) => {
      // In a more robust implementation, we would directly apply the INSERT/UPDATE/DELETE. 
      // Refreshing the list ensures reaction stats and joining stays perfectly synced for now.
      loadPosts();
    });

    const unsubscribeReactions = subscribeToPostReactions(selectedGroupId, (payload) => {
      loadPosts();
    });

    return () => {
      unsubscribePosts();
      unsubscribeReactions();
    };
  }, [selectedGroupId, loadPosts]);

  useEffect(() => {
    loadManagement().catch((e: any) =>
      setNotice(e.message || 'Nepavyko ikelti valdymo duomenu.', 'error')
    );
  }, [loadManagement]);

  // Handle realtime comments individually when drawer is open
  useEffect(() => {
    if (!drawerPost) return;

    const unsubscribeComments = subscribeToPostComments(drawerPost.id, (payload) => {
      // Refresh comments when one is added/updated/deleted
      listComments(drawerPost.id).then(setComments).catch(console.error);
    });

    return () => {
      unsubscribeComments();
    };
  }, [drawerPost]);

  useEffect(() => {
    if (!pendingSharedExcerpt) return;

    setSource('bible_reader');
    setBook(pendingSharedExcerpt.book);
    setChapter(pendingSharedExcerpt.chapter);
    setVerses(pendingSharedExcerpt.verses.join(','));
    setScriptureText(pendingSharedExcerpt.text);
    setComment('');
    setShowBibleAttachment(true);
    onConsumePendingExcerpt();
  }, [onConsumePendingExcerpt, pendingSharedExcerpt]);

  if (!supabaseReady) {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-10 h-[calc(100vh-6rem)] flex items-center justify-center">
        <div className={`w-full max-w-md rounded-2xl border p-8 shadow-xl text-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-stone-200'}`}>
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDark ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-50 text-amber-600'}`}>
              <Lock size={32} />
            </div>
          </div>
          <h2 className="font-cinzel font-bold text-2xl mb-2">Maldos ratai išjungti</h2>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
            Šiai funkcijai reikia <code>VITE_SUPABASE_URL</code> ir <code>VITE_SUPABASE_ANON_KEY</code> konfigūracijoje.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-10 h-[calc(100vh-6rem)] flex items-center justify-center">
        <div className={`w-full max-w-md rounded-2xl border p-8 shadow-xl text-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-stone-200'}`}>
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDark ? 'bg-red-900/10 text-red-500' : 'bg-red-50 text-red-700'}`}>
              <Users size={32} />
            </div>
          </div>
          <h2 className="font-cinzel font-bold text-2xl mb-2">Prisijunkite</h2>
          <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
            Maldos ratai pasiekiami tik prisijungusiems broliams ir sesėms.
          </p>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className={`px-8 py-3 rounded-full font-medium shadow-sm transition-all focus:ring-4 focus:ring-red-900/20 active:scale-95 flex items-center gap-2 mx-auto ${isDark ? 'bg-red-800 hover:bg-red-700 text-white' : 'bg-red-900 hover:bg-red-800 text-white'}`}
          >
            <LogIn size={18} />
            Prisijungti
          </button>
        </div>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </div>
    );
  }

  const submitCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = createName.trim();

    if (!trimmedName) {
      setNotice('Įveskite maldos rato pavadinimą.', 'error');
      return;
    }
    if (trimmedName.length < 3 || trimmedName.length > 80) {
      setNotice('Maldos rato pavadinimas turi būti 3–80 simbolių.', 'error');
      return;
    }

    setLoading(true);
    try {
      const group = await createGroup(trimmedName, createDescription.trim());
      setCreateName('');
      setCreateDescription('');
      await loadGroups();
      setSelectedGroupId(group.id);
      setNotice('Maldos ratas sukurtas.', 'success');
      setShowCreateGroup(false);
    } catch (e: any) {
      const message = String(e?.message || '');
      if (message.includes('create_prayer_group')) {
        setNotice('Trūksta Supabase RPC funkcijos. Paleiskite SQL skriptą.', 'error');
      } else if (message.includes('prayer_groups_name_check')) {
        setNotice('Pavadinimas turi būti 3–80 simbolių.', 'error');
      } else {
        setNotice('Nepavyko sukurti rato.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const submitJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setLoading(true);
    try {
      await requestJoinByCode(joinCode.trim(), joinMessage.trim());
      setJoinCode('');
      setJoinMessage('');
      setNotice('Prašymas išsiųstas.', 'success');
      setShowJoinGroup(false);
    } catch (e: any) {
      setNotice(e.message || 'Nepavyko išsiųsti prašymo.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const submitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || (!comment.trim() && !scriptureText.trim())) return;

    const parsedVerses = verses
      .split(',')
      .map(value => Number(value.trim()))
      .filter(value => !Number.isNaN(value) && value > 0);

    setLoading(true);
    try {
      await createPost({
        groupId: selectedGroupId,
        source: showBibleAttachment ? source : 'manual',
        scriptureBook: showBibleAttachment ? book.trim() : '',
        scriptureChapter: showBibleAttachment ? Math.max(1, chapter) : 1,
        scriptureVerses: showBibleAttachment ? parsedVerses : [],
        scriptureText: showBibleAttachment ? scriptureText.trim() : '',
        comment: comment.trim()
      });

      setComment('');
      setScriptureText('');
      setVerses('');
      setShowBibleAttachment(false);
      await loadPosts();
    } catch (e: any) {
      setNotice(e.message || 'Nepavyko išsiųsti intencijos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const trimmedCreateName = createName.trim();
  const isCreateNameValid = trimmedCreateName.length >= 3 && trimmedCreateName.length <= 80;

  return (
    <div className="flex flex-col md:flex-row h-full w-full overflow-hidden bg-white dark:bg-slate-950">

      {/* LEFT SIDEBAR - GROUPS LIST (WhatsApp/Telegram style) */}
      <aside className={`w-full sm:w-80 md:w-96 flex-col border-r transition-all ${!selectedGroupId ? 'flex flex-1 min-h-0' : 'hidden md:flex md:flex-none md:h-full'} ${isDark ? 'border-slate-800 bg-slate-950' : 'border-stone-200 bg-white'}`}>

        {/* Sidebar Header */}
        <div className={`p-3 flex items-center justify-between shrink-0 ${isDark ? 'bg-slate-900/50' : 'bg-stone-50/50'}`}>
          <h1 className="font-semibold text-lg flex items-center gap-2 px-2">
            Maldos ratai
          </h1>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowJoinGroup(true)} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-stone-200 text-stone-600'}`} title="Prisijungti su kodu">
              <Hash size={18} />
            </button>
            <button onClick={() => setShowCreateGroup(true)} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-stone-200 text-stone-600'}`} title="Kurti naują">
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Global actions/search area equivalent */}
        <div className="px-3 pb-2 pt-1">
          <button onClick={() => { loadGroups(); if (selectedGroupId) loadPosts(); }} className={`w-full flex justify-center py-1.5 rounded-full text-[11px] font-medium uppercase tracking-wider transition-colors ${isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-400' : 'bg-stone-100 hover:bg-stone-200 text-stone-500'}`}>
            Atnaujinti
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {groups.length === 0 ? (
            <div className="text-center py-10 opacity-50 text-sm">Nėra pokalbių</div>
          ) : (
            groups.map(group => (
              <button
                key={group.id}
                onClick={() => { setSelectedGroupId(group.id); setShowGroupInfo(false); }}
                className={`w-full text-left p-3 flex items-center gap-3 transition-colors border-b last:border-0 ${selectedGroupId === group.id
                  ? isDark ? 'bg-slate-800/80' : 'bg-stone-100'
                  : isDark ? 'hover:bg-slate-900 border-slate-800/50' : 'hover:bg-stone-50 border-stone-100'
                  }`}
              >
                <div className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shrink-0 ${selectedGroupId === group.id ? 'bg-red-900 text-white' : isDark ? 'bg-slate-800 text-slate-400' : 'bg-stone-200 text-stone-500'}`}>
                  <Users size={22} />
                </div>
                <div className="flex-1 min-w-0 py-1">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p className="font-medium text-[15px] truncate">{group.name}</p>
                    <span className="text-[11px] opacity-50 whitespace-nowrap">12:00</span> {/* Hardcoded time placeholder for true messenger look */}
                  </div>
                  <p className={`text-[13px] truncate ${selectedGroupId === group.id ? 'opacity-80' : 'opacity-60'}`}>
                    {group.description || '...'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <section className={`flex-1 flex flex-col min-h-0 relative ${selectedGroupId ? 'flex' : 'hidden md:flex'} ${isDark ? 'bg-[#0f172a]' : 'bg-[#f0f2f5]'}`}>
        {!selectedGroupId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
            {/* Atmospheric Empty State (Kept but simplified for edge-to-edge) */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center max-w-sm">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isDark ? 'bg-slate-800/50 text-slate-600' : 'bg-white shadow-sm text-stone-300'}`}>
                <MessageCircle size={32} strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-lg mb-2">Maldos ratai</h3>
              <p className={`text-[15px] leading-relaxed ${isDark ? 'text-slate-500' : 'text-stone-500'}`}>
                Pasirinkite pokalbį iš sąrašo kairėje ir pradėkite bendrauti.
              </p>
            </div>
          </div>
        ) : !selectedGroup ? null : (
          <>
            {/* Chat Header */}
            <header className={`px-4 py-2 border-b flex items-center justify-between shrink-0 z-10 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-stone-200'}`}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button onClick={() => { setSelectedGroupId(null); setShowGroupInfo(false); }} className="md:hidden p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 shrink-0">
                  <ChevronLeft size={24} />
                </button>
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-900 text-white shrink-0">
                  <Users size={20} />
                </div>
                <div className="flex flex-col justify-center cursor-pointer min-w-0 pr-2" onClick={() => setShowGroupInfo(!showGroupInfo)}>
                  <h2 className="font-semibold text-[15px] leading-tight truncate">{selectedGroup.name}</h2>
                  <p className="text-[13px] opacity-60 flex items-center gap-1 truncate">
                    {members.length} broliai ir sesės
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <button onClick={() => setShowGroupInfo(!showGroupInfo)} className={`p-2.5 rounded-full transition-colors ${showGroupInfo ? (isDark ? 'bg-slate-800 text-white' : 'bg-stone-200 text-stone-900') : (isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-stone-500 hover:bg-stone-100')}`}>
                  <Info size={20} />
                </button>
              </div>
            </header>

            {/* Chat Messages Area (Authentic Messenger styling) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-4">
              {orderedPosts.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className={`px-4 py-2 rounded-xl text-sm shadow-sm ${isDark ? 'bg-slate-800/80 text-slate-300' : 'bg-white text-stone-600'}`}>
                    Pradėkite pokalbį – pasidalinkite pirmuoju žodžiu.
                  </div>
                </div>
              ) : (
                orderedPosts.map((post, i) => {
                  const isOwnPost = post.author_id === user.id;
                  const prevPost = i > 0 ? orderedPosts[i - 1] : null;
                  const isConsecutive = prevPost && prevPost.author_id === post.author_id;

                  const summary = reactionsByPost[post.id];
                  const canManagePost = isOwnPost || canModerate;
                  const hasPrayerReaction = summary?.counts?.['🙏'] > 0 || summary?.userReaction === '🙏';

                  return (
                    <div key={post.id} className={`flex flex-col ${isOwnPost ? 'items-end' : 'items-start'} ${isConsecutive ? 'mt-1' : 'mt-4'}`}>

                      {/* Only show name if it's the first message in a block from someone else */}
                      {!isOwnPost && !isConsecutive && (
                        <span className="text-[12px] font-medium opacity-60 ml-12 mb-1">{post.profiles?.full_name || post.profiles?.email?.split('@')[0] || 'Nežinomas'}</span>
                      )}

                      <div className={`flex items-end gap-2 max-w-[85%] md:max-w-[65%]`}>
                        {/* Avatar only for others, only on their last consecutive message (simulated by showing on first here for simplicity, real chat shows on last) */}
                        {!isOwnPost && !isConsecutive ? (
                          <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 flex-shrink-0 mb-1 overflow-hidden flex items-center justify-center">
                            {post.profiles?.avatar_url ? (
                              <img src={post.profiles.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            )}
                          </div>
                        ) : !isOwnPost ? (
                          <div className="w-8 flex-shrink-0"></div>
                        ) : null}

                        <div className="flex flex-col items-start relative group">

                          {/* Main Bubble */}
                          <div className={`relative px-3 pt-2 pb-1.5 shadow-sm text-[15px] whitespace-pre-line leading-relaxed z-10 ${hasPrayerReaction
                            ? isDark ? 'shadow-[0_0_10px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30' : 'shadow-[0_0_10px_rgba(245,158,11,0.2)] ring-1 ring-amber-300'
                            : ''
                            } ${isOwnPost
                              ? `bg-[#dcf8c6] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-2xl ${!isConsecutive ? 'rounded-tr-none' : ''}`
                              : `bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-2xl ${!isConsecutive ? 'rounded-tl-none' : ''}`
                            }`}>

                            {/* Scripture Content */}
                            {post.scripture_text && (
                              <div className={`mb-2 mt-1 rounded-xl p-3 relative overflow-hidden ${isDark
                                ? 'bg-black/20 border border-amber-500/20 shadow-inner'
                                : isOwnPost ? 'bg-white/60 border border-green-900/10' : 'bg-[#fdfbf7] border border-amber-900/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]'
                                }`}>
                                <div className="absolute -top-2 -right-2 p-2 opacity-5 pointer-events-none">
                                  <BookOpen size={80} />
                                </div>
                                <div className={`text-[10px] font-bold tracking-widest uppercase mb-2 flex items-center gap-1.5 ${isDark ? 'text-amber-500/80' : isOwnPost ? 'text-emerald-800/70' : 'text-amber-800/70'}`}>
                                  <BookOpen size={12} />
                                  Šv. Raštas • {post.scripture_book} {post.scripture_chapter}:{post.scripture_verses.join(',')}
                                </div>
                                <div className="relative">
                                  <span className={`absolute -top-3 -left-1 text-5xl opacity-10 font-serif ${isDark ? 'text-amber-500' : isOwnPost ? 'text-green-900' : 'text-amber-900'}`}>"</span>
                                  <div className={`font-cinzel text-[17px] leading-relaxed pt-1 pb-1 px-4 relative z-10 ${isDark ? 'text-amber-50/90' : 'text-stone-800'}`}>
                                    {post.scripture_text}
                                  </div>
                                  <span className={`absolute -bottom-7 right-0 text-5xl opacity-10 font-serif ${isDark ? 'text-amber-500' : isOwnPost ? 'text-green-900' : 'text-amber-900'}`}>"</span>
                                </div>
                              </div>
                            )}

                            {/* Text Content */}
                            {post.comment && (
                              <span className="break-words">
                                {post.comment}
                                {/* Spacer for inline time */}
                                <span className="inline-block w-12 invisible"></span>
                              </span>
                            )}
                            {/* If no comment, just add spacer */}
                            {!post.comment && <div className="h-2 w-12"></div>}

                            {/* Inline Time & Read Receipts */}
                            <div className={`absolute bottom-1 right-2 flex items-center gap-1 text-[10px] leading-none ${isOwnPost ? 'text-[#111b21]/60 dark:text-white/60' : 'text-black/40 dark:text-white/40'}`}>
                              {formatMessageTime(post.created_at)}
                              {isOwnPost && <Check size={12} className="opacity-80" />}
                            </div>
                          </div>

                          {/* Messenger-style Reaction Bar (Below bubble) */}
                          <div className={`flex items-center gap-1 mt-1 z-0 ml-1 ${isOwnPost ? 'self-end mr-1' : 'self-start'}`}>

                            {/* Active Reactions */}
                            <div className="flex gap-1">
                              {/* Prayer Special Reaction */}
                              {(summary?.counts?.['🙏'] > 0 || summary?.userReaction === '🙏') && (
                                <button
                                  onClick={() => toggleReaction(post.id, '🙏').then(loadPosts)}
                                  className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border shadow-sm transition-all focus:outline-none ${summary?.userReaction === '🙏'
                                    ? 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-[#202c33] dark:border-amber-500/50 dark:text-amber-400'
                                    : isDark ? 'bg-[#202c33] border-slate-700 text-slate-300' : 'bg-white border-stone-200 text-stone-600'
                                    }`}
                                >
                                  <span>🙏</span>
                                  <span className="font-semibold">{summary.counts['🙏']}</span>
                                </button>
                              )}

                              {/* Other Active Reactions */}
                              {REACTIONS.filter(emoji => emoji !== '🙏').map(emoji => {
                                const count = summary?.counts?.[emoji] || 0;
                                if (count === 0 && summary?.userReaction !== emoji) return null;
                                return (
                                  <button
                                    key={emoji}
                                    onClick={() => toggleReaction(post.id, emoji).then(loadPosts)}
                                    className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full border shadow-sm focus:outline-none ${summary?.userReaction === emoji
                                      ? isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-stone-200 border-stone-300 text-black'
                                      : isDark ? 'bg-[#202c33] border-slate-700 text-slate-300' : 'bg-white border-stone-200 text-stone-600'
                                      }`}
                                  >
                                    <span>{emoji}</span>
                                    {count > 1 && <span className="font-medium">{count}</span>}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Hover Actions */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex bg-white dark:bg-slate-800 rounded-full shadow-md ml-2 border dark:border-slate-700">
                              <button onClick={() => toggleReaction(post.id, '🙏').then(loadPosts)} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-l-full" title="Palaikau">🙏</button>
                              <button onClick={() => loadComments(post)} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 text-stone-500 dark:text-slate-400" title="Atsakyti">
                                <MessageCircle size={14} />
                              </button>
                              {canManagePost && (
                                <button
                                  onClick={async () => {
                                    if (!window.confirm('Ištrinti žinutę?')) return;
                                    await deletePost(post.id);
                                    await loadPosts();
                                  }}
                                  className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-r-full text-red-500" title="Ištrinti"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Unified Pill-Shaped Input Area */}
            <div className={`relative p-2 shrink-0 border-t ${isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-[#f0f2f5] border-stone-200'}`}>

              {/* Scripture Form Popover */}
              {showBibleAttachment && (
                <div className={`mb-3 p-3 rounded-2xl shadow-sm border max-w-4xl mx-auto w-full ${isDark ? 'bg-[#202c33] border-slate-700' : 'bg-[#fdfbf7] border-amber-900/10'} animate-in slide-in-from-bottom-2`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase flex items-center gap-1"><BookOpen size={14} /> Šv. Raštas</span>
                    <button onClick={() => setShowBibleAttachment(false)} className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5"><X size={16} /></button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input value={book} onChange={e => setBook(e.target.value)} placeholder="Jn" className={`w-1/3 text-sm rounded-xl px-3 py-2 outline-none ${isDark ? 'bg-[#2a3942]' : 'bg-[#f0f2f5]'}`} />
                      <input type="number" min={1} value={chapter} onChange={e => setChapter(Number(e.target.value) || 1)} placeholder="3" className={`w-1/3 text-sm rounded-xl px-3 py-2 outline-none ${isDark ? 'bg-[#2a3942]' : 'bg-[#f0f2f5]'}`} />
                      <input value={verses} onChange={e => setVerses(e.target.value)} placeholder="16" className={`w-1/3 text-sm rounded-xl px-3 py-2 outline-none ${isDark ? 'bg-[#2a3942]' : 'bg-[#f0f2f5]'}`} />
                    </div>
                    <textarea
                      rows={2}
                      value={scriptureText}
                      onChange={e => setScriptureText(e.target.value)}
                      placeholder="Tekstas..."
                      className={`w-full text-sm font-cinzel rounded-xl px-3 py-2 outline-none resize-none ${isDark ? 'bg-[#2a3942]' : 'bg-[#f0f2f5]'}`}
                    />
                  </div>
                </div>
              )}

              <form onSubmit={submitPost} className="flex items-end gap-2 max-w-4xl mx-auto relative">

                {/* Unified Pill Container */}
                <div className={`flex-1 flex items-end rounded-3xl overflow-hidden shadow-sm transition-all focus-within:shadow-md ${isDark ? 'bg-[#202c33]' : 'bg-white'}`}>

                  {/* Attachment Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowBibleAttachment(!showBibleAttachment)}
                    className={`p-3.5 pl-4 shrink-0 transition-colors focus:outline-none ${showBibleAttachment ? 'text-amber-500' : 'text-[#8696a0]'}`}
                  >
                    <BookOpen size={24} strokeWidth={1.5} />
                  </button>

                  <textarea
                    rows={Math.min(5, Math.max(1, comment.split('\n').length))}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Įveskite žinutę"
                    className={`w-full bg-transparent py-3.5 pr-4 text-[15px] outline-none resize-none max-h-32 ${isDark ? 'text-white placeholder-[#8696a0]' : 'text-stone-800 placeholder-stone-400'}`}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        e.currentTarget.form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                      }
                    }}
                  />
                </div>

                {/* Send Button */}
                {/* Only visible when text exists, imitating modern messengers */}
                <div className={`transition-all duration-200 overflow-hidden ${(comment.trim() || scriptureText.trim()) ? 'w-12 opacity-100' : 'w-0 opacity-0'}`}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-12 h-12 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white flex items-center justify-center shrink-0 shadow-sm transition-colors"
                  >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-1" />}
                  </button>
                </div>

              </form>
            </div>
          </>
        )}
      </section>

      {/* RIGHT INFO SIDEBAR (OVERLAY ON SMALL, SIDE-BY-SIDE ON LARGE) */}
      {selectedGroup && showGroupInfo && (
        <>
          {/* Backdrop for mobile */}
          <div className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] transition-opacity" onClick={() => setShowGroupInfo(false)} />
          <aside className={`fixed md:relative inset-y-0 right-0 w-[85vw] max-w-sm md:w-80 md:max-w-none flex flex-col shrink-0 border-l z-[100] shadow-2xl md:shadow-none transition-transform transform ${isDark ? 'border-slate-800 bg-slate-950' : 'border-stone-200 bg-white'}`}>
            <div className={`p-4 flex items-center gap-4 border-b shrink-0 ${isDark ? 'bg-slate-900/50' : 'bg-stone-50/50'}`}>
              <button onClick={() => setShowGroupInfo(false)} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5">
                <X size={20} />
              </button>
              <h3 className="font-semibold text-lg">Informacija</h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Group Hero Info */}
              <div className="flex flex-col items-center py-6 px-4 bg-black/5 dark:bg-white/5 border-b dark:border-white/10">
                <div className="w-24 h-24 rounded-full bg-red-900 flex items-center justify-center text-white mb-4 shadow-lg">
                  <Users size={40} />
                </div>
                <h2 className="text-xl font-semibold text-center mb-1">{selectedGroup.name}</h2>
                <p className="text-sm opacity-60">Sukurta maldai ir bendrystei</p>
              </div>

              <div className="px-6 space-y-6 pb-6">
                {/* Description */}
                <div>
                  <p className="text-sm text-amber-700 dark:text-amber-500 font-semibold mb-1 uppercase tracking-wider text-[11px]">Intencija</p>
                  <p className="text-[15px] leading-relaxed">{selectedGroup.description || 'Nėra aprašymo.'}</p>
                </div>

                {canModerate && (
                  <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5">
                    <p className="text-xs font-semibold mb-2 opacity-60 uppercase tracking-wider">Kvietimo Kodas</p>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-lg font-mono tracking-widest">{selectedGroup.invite_code}</code>
                      {isOwner && (
                        <button onClick={async () => {
                          try {
                            const code = await rotateInviteCode(selectedGroup.id);
                            setGroups(prev => prev.map(group => group.id === selectedGroup.id ? { ...group, invite_code: code } : group));
                            setNotice('Kodas pakeistas.', 'success');
                          } catch (e: any) { setNotice('Klaida keičiant kodą.', 'error'); }
                        }} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-stone-600 dark:text-slate-300">
                          <RotateCw size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {canModerate && pendingRequests.length > 0 && (
                  <div>
                    <h4 className="text-xs uppercase font-bold tracking-wider mb-3 flex items-center gap-2 opacity-60 text-amber-600 dark:text-amber-500">
                      <Shield size={14} /> Laukiantys prašymai
                    </h4>
                    <div className="space-y-3">
                      {pendingRequests.map(request => (
                        <div key={request.id} className="p-3 rounded-2xl border bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm">
                          <p className="text-sm font-medium mb-1">{request.requester_id}</p>
                          {request.message && <p className="text-sm mb-3 italic opacity-80">{request.message}</p>}
                          <div className="flex gap-2">
                            <button onClick={async () => {
                              try { await reviewJoinRequest(request.id, 'approved'); await loadManagement(); await loadGroups(); }
                              catch (e) { setNotice('Klaida tvirtinant', 'error'); }
                            }} className="flex-1 py-1.5 bg-[#00a884] text-white rounded-full font-semibold text-sm hover:bg-[#008f6f] transition">Tvirtinti</button>
                            <button onClick={async () => {
                              try { await reviewJoinRequest(request.id, 'rejected'); await loadManagement(); }
                              catch (e) { setNotice('Klaida atmetant', 'error'); }
                            }} className="flex-1 py-1.5 bg-black/10 dark:bg-white/10 rounded-full font-semibold text-sm hover:bg-black/20 transition">Atmesti</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-xs uppercase font-bold tracking-wider mb-2 opacity-60 text-amber-700 dark:text-amber-500">Broliai ir sesės ({members.length})</h4>
                  <div className="space-y-1 -mx-2">
                    {members.map(member => {
                      const isCurrent = member.user_id === user.id;
                      const canRemove = !isCurrent && (isOwner || (selectedRole === 'moderator' && member.role === 'member')) && member.role !== 'owner';

                      return (
                        <div key={member.user_id} className="flex items-center justify-between p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0 flex items-center justify-center text-slate-500 overflow-hidden">
                              {(member as any).profiles?.avatar_url ? (
                                <img src={(member as any).profiles.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                              ) : (
                                <User size={18} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[15px] font-medium truncate">{(member as any).profiles?.full_name || (member as any).profiles?.email?.split('@')[0] || member.user_id.slice(0, 12) + '...'}</p>
                              <p className="text-[12px] opacity-60">
                                {isCurrent ? '(Jūs) ' : ''}{ROLE_LABELS[member.role]}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center">
                            {isOwner && !isCurrent && member.role !== 'owner' && (
                              <select value={member.role} onChange={e => handleSetRole(member.user_id, e.target.value as GroupMemberRole)} className="mr-2 text-xs py-1 px-2 rounded-lg bg-black/5 dark:bg-white/5 border-0 outline-none opacity-0 group-hover:opacity-100 transition-opacity">
                                <option value="member">Narys</option>
                                <option value="moderator">Admin</option>
                              </select>
                            )}
                            {canRemove && (
                              <button onClick={() => handleRemoveMember(member.user_id)} className="p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-red-500/10">
                                <X size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Floating Notices */}
      {(error || success) && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-full shadow-2xl text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-4 ${error ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {error || success}
        </div>
      )}

      {/* OVERLAY MODALS */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowCreateGroup(false)} />
          <div className={`relative w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
            <h3 className="font-semibold text-xl mb-1">Kurti Erdvę</h3>
            <p className="text-sm opacity-60 mb-6">Sukurkite naują maldos ratą.</p>
            <form onSubmit={e => { submitCreateGroup(e); if (isCreateNameValid) setShowCreateGroup(false); }} className="space-y-4">
              <input value={createName} onChange={e => setCreateName(e.target.value)} placeholder="Pavadinimas" className={`w-full rounded-2xl border-0 px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#00a884]/50 ${isDark ? 'bg-slate-800' : 'bg-stone-100'}`} autoFocus />
              <textarea value={createDescription} onChange={e => setCreateDescription(e.target.value)} placeholder="Intencija, aprašymas (nebūtina)" rows={3} className={`w-full rounded-2xl border-0 px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#00a884]/50 resize-none ${isDark ? 'bg-slate-800' : 'bg-stone-100'}`} />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateGroup(false)} className="flex-1 py-3 rounded-full text-[15px] font-medium hover:bg-black/5 dark:hover:bg-white/5 transition">Atšaukti</button>
                <button type="submit" disabled={!isCreateNameValid || loading} className="flex-1 py-3 rounded-full text-[15px] font-semibold bg-[#00a884] text-white hover:bg-[#008f6f] disabled:opacity-50 transition-colors">Kurti</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showJoinGroup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowJoinGroup(false)} />
          <div className={`relative w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
            <h3 className="font-semibold text-xl mb-1">Prisijungti</h3>
            <p className="text-sm opacity-60 mb-6">Įveskite pakvietimo kodą iš esamo maldos rato.</p>
            <form onSubmit={e => { submitJoin(e); if (joinCode.trim()) setShowJoinGroup(false); }} className="space-y-4">
              <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="KODAS" className={`w-full rounded-2xl border-0 px-4 py-4 text-center text-xl font-mono tracking-widest uppercase font-bold focus:ring-2 focus:ring-[#00a884]/50 outline-none ${isDark ? 'bg-slate-800' : 'bg-stone-100'}`} autoFocus />
              <textarea value={joinMessage} onChange={e => setJoinMessage(e.target.value)} placeholder="Trumpas prisistatymas (nebūtina)" rows={2} className={`w-full rounded-2xl border-0 px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#00a884]/50 resize-none ${isDark ? 'bg-slate-800' : 'bg-stone-100'}`} />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowJoinGroup(false)} className="flex-1 py-3 rounded-full text-[15px] font-medium hover:bg-black/5 dark:hover:bg-white/5 transition">Atšaukti</button>
                <button type="submit" disabled={!joinCode.trim() || loading} className="flex-1 py-3 rounded-full text-[15px] font-semibold bg-[#00a884] text-white hover:bg-[#008f6f] disabled:opacity-50 flex justify-center items-center transition-colors">
                  {loading ? <Loader2 size={20} className="animate-spin" /> : 'Prisijungti'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPLIES / COMMENTS DRAWER (Messenger styled side-panel) */}
      {drawerPost && (
        <div className="fixed inset-0 z-[250] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity md:hidden" onClick={() => setDrawerPost(null)} />
          <aside className={`relative w-full md:w-[400px] h-full flex flex-col shadow-2xl animate-in slide-in-from-right-8 ${isDark ? 'bg-[#0f172a] border-l border-slate-700' : 'bg-[#f0f2f5] border-l border-stone-300'}`}>

            <header className={`px-4 py-3 flex items-center gap-4 shrink-0 shadow-sm z-10 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
              <button onClick={() => setDrawerPost(null)} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5">
                <X size={20} />
              </button>
              <h3 className="font-semibold text-[16px]">Atsakymai</h3>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Original Message Context */}
              <div className={`p-4 rounded-2xl shadow-sm relative ${isDark ? 'bg-[#202c33]' : 'bg-white'}`}>
                <p className="text-xs font-medium opacity-60 mb-2">{drawerPost.profiles?.full_name || drawerPost.profiles?.email?.split('@')[0] || drawerPost.author_id.slice(0, 10)}</p>
                <div className="text-[15px] leading-relaxed whitespace-pre-line opacity-90 border-l-2 border-red-900/50 pl-2">
                  {drawerPost.comment || "Šventojo rašto ištrauka"}
                </div>
              </div>
              <p className="text-[15px] leading-relaxed whitespace-pre-line">{drawerPost.comment || drawerPost.scripture_text}</p>
            </div>

            {/* Replies List */}
            <div className="space-y-4 mt-6">
              {comments.length === 0 ? (
                <p className="text-center opacity-50 text-sm italic">Nėra atsakymų</p>
              ) : (
                comments.map((reply, index) => (
                  <div key={reply.id} className="group relative">
                    {/* Connecting Line */}
                    {index < comments.length - 1 && (
                      <div className={`absolute left-3 top-8 bottom-[-24px] w-px ${isDark ? 'bg-white/10' : 'bg-black/10'}`}></div>
                    )}

                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0 mt-1 overflow-hidden flex items-center justify-center">
                        {reply.profiles?.avatar_url ? (
                          <img src={reply.profiles.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className={`inline-block px-3 py-2 rounded-2xl rounded-tl-sm text-[14px] shadow-sm ${isDark ? 'bg-[#202c33]' : 'bg-white'}`}>
                          <p className="text-[11px] font-semibold opacity-70 mb-0.5">{reply.profiles?.full_name || reply.profiles?.email?.split('@')[0] || reply.author_id.slice(0, 10)}</p>
                          <p className="leading-relaxed whitespace-pre-line">{reply.body}</p>
                        </div>
                        {(reply.author_id === user.id || canModerate) && (
                          <button onClick={async () => {
                            if (!window.confirm('Trinti?')) return;
                            await deleteComment(reply.id);
                            await loadComments(drawerPost);
                          }} className="block text-[10px] mt-1 ml-1 text-red-500 opacity-60 hover:underline">Trinti</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input for Replies */}
            <form onSubmit={async e => {
              e.preventDefault();
              if (!commentInput.trim()) return;
              await createComment(drawerPost.id, commentInput.trim());
              setCommentInput('');
              await loadComments(drawerPost);
            }} className={`p-3 shrink-0 ${isDark ? 'bg-[#202c33]' : 'bg-[#f0f2f5]'}`}>
              <div className={`flex items-end rounded-full overflow-hidden ${isDark ? 'bg-[#2a3942]' : 'bg-white'}`}>
                <textarea
                  rows={1}
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  placeholder="Rašyti atsakymą..."
                  className="flex-1 bg-transparent px-4 py-3 text-[15px] outline-none resize-none min-h-[44px] max-h-24"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); }
                  }}
                />
                {(commentInput.trim()) && (
                  <button type="submit" disabled={loading} className={`p-3 m-1 rounded-full bg-[#00a884] text-white shrink-0`}>
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                )}
              </div>
            </form>
          </aside>
        </div>
      )}
    </div>
  );

  async function handleSetRole(targetUserId: string, role: GroupMemberRole) {
    if (!selectedGroupId || !isOwner) return;
    await setMemberRole(selectedGroupId, targetUserId, role);
    await loadManagement();
    await loadGroups();
  }

  async function handleRemoveMember(targetUserId: string) {
    if (!selectedGroupId || !window.confirm('Ar tikrai šalinti nari?')) return;
    await removeMember(selectedGroupId, targetUserId);
    await loadManagement();
    await loadGroups();
  }
};
