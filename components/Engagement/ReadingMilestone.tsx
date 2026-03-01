import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Flame, CheckCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface MilestoneProps {
    bookName: string;
    chapter: number;
    streak: number;
    todayCount: number;
    onDismiss: () => void;
}

/**
 * ReadingMilestone — "Golden Ray" completion effect.
 * Full-screen backdrop w/ luminous confirmation.
 */
export const ReadingMilestone: React.FC<MilestoneProps> = ({
    bookName,
    chapter,
    streak,
    todayCount,
    onDismiss
}) => {
    const { isDark } = useTheme();

    useEffect(() => {
        const timer = setTimeout(onDismiss, 3500);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center cursor-pointer"
                onClick={onDismiss}
            >
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
                />

                {/* Golden rays */}
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 3, opacity: 0.15 }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    className="absolute w-48 h-48 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(251,191,36,1) 0%, rgba(251,191,36,0) 70%)' }}
                />

                {/* Card */}
                <motion.div
                    initial={{ scale: 0.7, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: -10 }}
                    transition={{ type: 'spring', bounce: 0.3, duration: 0.6, delay: 0.1 }}
                    className={`relative backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-xs mx-4 text-center border ${isDark ? 'bg-slate-900/95 border-amber-900/50 shadow-amber-900/10' : 'bg-white/95 border-amber-100 shadow-amber-900/20'}`}
                >
                    {/* Top golden line */}
                    <div className="absolute top-0 left-8 right-8 h-[3px] bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-full" />

                    {/* Animated check icon */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', bounce: 0.4, delay: 0.3 }}
                        className={`w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center border-2 border-amber-200/80 shadow-lg shadow-amber-200/40 ${isDark ? 'bg-gradient-to-br from-amber-900/40 to-amber-800/40' : 'bg-gradient-to-br from-amber-50 to-amber-100'}`}
                    >
                        <CheckCircle size={36} className="text-amber-700" strokeWidth={2} />
                    </motion.div>

                    {/* Title */}
                    <motion.h3
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className={`font-cinzel font-bold text-xl mb-1 ${isDark ? 'text-amber-100' : 'text-stone-900'}`}
                    >
                        Skyrius užbaigtas
                    </motion.h3>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className={`text-sm font-serif mb-6 ${isDark ? 'text-amber-200/70' : 'text-stone-500'}`}
                    >
                        {bookName}, {chapter + 1} skyrius
                    </motion.p>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex items-center justify-center gap-6"
                    >
                        {streak > 0 && (
                            <div className="flex items-center gap-1.5">
                                <Flame size={16} className="text-amber-500 fill-amber-400" />
                                <span className="text-sm font-bold text-amber-700 tabular-nums">{streak} d.</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5">
                            <BookOpen size={16} className={isDark ? 'text-slate-500' : 'text-stone-400'} />
                            <span className={`text-sm font-bold tabular-nums ${isDark ? 'text-slate-400' : 'text-stone-600'}`}>{todayCount} šiandien</span>
                        </div>
                    </motion.div>

                    {/* Tap to dismiss hint */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        transition={{ delay: 1.5 }}
                        className="text-[10px] text-stone-400 mt-5"
                    >
                        Paspauskite, kad tęstumėte
                    </motion.p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
