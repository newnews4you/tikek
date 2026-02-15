import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Trash2, X, MessageCircle } from 'lucide-react';
import { ChatConversation, deleteConversation } from '../../services/chatHistoryService';
import { useTheme } from '../../context/ThemeContext';

interface ChatHistoryProps {
    isOpen: boolean;
    onClose: () => void;
    conversations: ChatConversation[];
    currentConvoId: string | null;
    onSelectConversation: (id: string) => void;
    onRefresh: () => void;
}

function timeAgo(ts: number): string {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ką tik';
    if (mins < 60) return `prieš ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `prieš ${hrs} val`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'vakar';
    return `prieš ${days} d.`;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({
    isOpen, onClose, conversations, currentConvoId, onSelectConversation, onRefresh
}) => {
    const { isDark } = useTheme();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeletingId(id);
        setTimeout(() => {
            deleteConversation(id);
            onRefresh();
            setDeletingId(null);
        }, 200);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 z-50"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] flex flex-col shadow-2xl border-r ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-stone-200'
                            }`}
                    >
                        {/* Header */}
                        <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-slate-800' : 'border-stone-200'}`}>
                            <h2 className={`font-cinzel font-bold flex items-center gap-2 ${isDark ? 'text-amber-100' : 'text-stone-900'}`}>
                                <Clock size={18} className={isDark ? 'text-amber-400' : 'text-red-900'} />
                                Pokalbių istorija
                            </h2>
                            <button
                                onClick={onClose}
                                className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-stone-400 hover:bg-stone-100 hover:text-stone-600'}`}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {conversations.length === 0 ? (
                                <div className="text-center py-12">
                                    <MessageCircle size={40} className={`mx-auto mb-3 ${isDark ? 'text-slate-700' : 'text-stone-300'}`} />
                                    <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-stone-400'}`}>
                                        Dar nėra pokalbių
                                    </p>
                                </div>
                            ) : (
                                conversations.map((convo) => (
                                    <motion.button
                                        key={convo.id}
                                        layout
                                        onClick={() => { onSelectConversation(convo.id); onClose(); }}
                                        className={`w-full text-left p-3 rounded-xl transition-all group flex items-start gap-3 ${deletingId === convo.id ? 'opacity-0 scale-95' : ''
                                            } ${currentConvoId === convo.id
                                                ? (isDark ? 'bg-amber-900/20 border border-amber-700/30' : 'bg-red-50 border border-red-200')
                                                : (isDark ? 'hover:bg-slate-800 border border-transparent' : 'hover:bg-stone-50 border border-transparent')
                                            }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate ${currentConvoId === convo.id
                                                    ? (isDark ? 'text-amber-200' : 'text-red-900')
                                                    : (isDark ? 'text-slate-200' : 'text-stone-800')
                                                }`}>
                                                {convo.title}
                                            </p>
                                            <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-stone-400'}`}>
                                                {timeAgo(convo.updatedAt)} • {convo.messages.length - 1} žin.
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(e, convo.id)}
                                            className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all ${isDark ? 'hover:bg-red-900/30 text-slate-500 hover:text-red-400' : 'hover:bg-red-50 text-stone-300 hover:text-red-500'
                                                }`}
                                            title="Ištrinti"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </motion.button>
                                ))
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
