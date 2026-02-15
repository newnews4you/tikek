import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, User as UserIcon, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

export const UserMenu: React.FC = () => {
    const { user, signOut } = useAuth();
    const { isDark } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!user) return null;

    const emailInitial = user.email ? user.email[0].toUpperCase() : 'U';

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 p-1.5 rounded-xl transition-all border ${isDark
                        ? 'bg-slate-800 border-slate-700 hover:border-amber-500/50'
                        : 'bg-white border-stone-200 hover:border-amber-300'
                    }`}
            >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-cinzel font-bold text-sm ${isDark
                        ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-lg shadow-amber-900/20'
                        : 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/20'
                    }`}>
                    {emailInitial}
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className={`absolute right-0 mt-2 w-56 rounded-xl shadow-2xl border overflow-hidden z-50 ${isDark
                                ? 'bg-slate-900 border-slate-700'
                                : 'bg-white border-stone-100'
                            }`}
                    >
                        <div className="p-4 border-b border-opacity-10 opacity-70">
                            <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-stone-400'}`}>
                                Prisijungęs kaip
                            </p>
                            <p className={`text-sm truncate font-medium ${isDark ? 'text-slate-300' : 'text-stone-700'}`}>
                                {user.email}
                            </p>
                        </div>

                        <div className="p-2 space-y-1">
                            <button
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isDark
                                        ? 'text-slate-300 hover:bg-slate-800'
                                        : 'text-stone-600 hover:bg-stone-50'
                                    }`}
                            >
                                <UserIcon size={16} />
                                Profilis
                            </button>
                            <button
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isDark
                                        ? 'text-slate-300 hover:bg-slate-800'
                                        : 'text-stone-600 hover:bg-stone-50'
                                    }`}
                            >
                                <Settings size={16} />
                                Nustatymai
                            </button>
                        </div>

                        <div className={`border-t p-2 ${isDark ? 'border-slate-800' : 'border-stone-100'}`}>
                            <button
                                onClick={() => {
                                    signOut();
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                            >
                                <LogOut size={16} />
                                Atsijungti
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
