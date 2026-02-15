import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Book, Sparkles, BookHeart, Database } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

type ViewType = 'chat' | 'prayer' | 'bible' | 'data' | 'plans';

interface MobileNavProps {
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
    isAdminVisible: boolean;
}

const NAV_ITEMS: { id: ViewType; icon: React.ReactNode; label: string }[] = [
    { id: 'chat', icon: <MessageCircle size={18} />, label: 'Pokalbis' },
    { id: 'bible', icon: <Book size={18} />, label: 'Biblija' },
    { id: 'plans', icon: <Sparkles size={18} />, label: 'Planai' },
    { id: 'prayer', icon: <BookHeart size={18} />, label: 'Maldynas' },
];

export const MobileNav: React.FC<MobileNavProps> = ({ currentView, onViewChange, isAdminVisible }) => {
    const { isDark } = useTheme();

    return (
        <nav className={`md:hidden w-full backdrop-blur-xl border-t shadow-[0_-2px_10px_rgba(0,0,0,0.05)] transition-colors duration-500
      ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-stone-200'}`}>
            <div className="flex items-center justify-around px-2 py-1.5">
                {NAV_ITEMS.map((item) => {
                    const isActive = currentView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onViewChange(item.id)}
                            className={`relative flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all duration-200 min-w-[60px] ${isActive
                                ? (isDark ? 'text-amber-400' : 'text-red-900')
                                : (isDark ? 'text-slate-500 active:text-slate-300' : 'text-stone-400 active:text-stone-600')
                                }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="mobile-nav-dot"
                                    className={`absolute -top-1.5 w-5 h-0.5 rounded-full ${isDark ? 'bg-amber-400' : 'bg-red-900'}`}
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                                />
                            )}
                            <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                                {item.icon}
                            </span>
                            <span className={`text-[10px] font-medium transition-all ${isActive ? (isDark ? 'text-amber-100' : 'text-red-900') : (isDark ? 'text-slate-600' : 'text-stone-400')
                                }`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}

                {isAdminVisible && (
                    <button
                        onClick={() => onViewChange('data')}
                        className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all ${currentView === 'data' ? 'text-red-700' : 'text-stone-300'
                            }`}
                    >
                        <Database size={18} />
                        <span className="text-[10px] font-medium">Admin</span>
                    </button>
                )}
            </div>
        </nav>
    );
};
