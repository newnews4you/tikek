import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Cross, MessageCircle, BookHeart, Book, RefreshCw, Database, Sparkles, Clock, Users } from 'lucide-react';
import { DailyFlame } from '../Engagement/DailyFlame';
import { LiturgyData, getLiturgicalColorCSS } from '../../services/liturgyService';
import { useTheme } from '../../context/ThemeContext';
import { AuthModal } from '../Auth/AuthModal';
import { ProfileMenu } from '../Auth/ProfileMenu';

type ViewType = 'chat' | 'prayer' | 'bible' | 'data' | 'plans' | 'groups';

interface HeaderProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onNewChat: () => void;
  onOpenSources: () => void;
  onOpenSearch: () => void;
  onOpenHistory: () => void;
  liturgyData: LiturgyData | null;
  onOpenLiturgyModal: () => void;
  onLogoClick: () => void;
  isAdminVisible: boolean;
}

const NAV_ITEMS: { id: ViewType; icon: React.ReactNode; label: string }[] = [
  { id: 'chat', icon: <MessageCircle size={18} />, label: 'Pokalbis' },
  { id: 'bible', icon: <Book size={18} />, label: 'Biblija' },
  { id: 'plans', icon: <Sparkles size={18} />, label: 'Planai' },
  { id: 'groups', icon: <Users size={18} />, label: 'Grupelės' },
  { id: 'prayer', icon: <BookHeart size={18} />, label: 'Maldynas' },
];

export const Header: React.FC<HeaderProps> = ({
  currentView, onViewChange, onNewChat, onOpenSources,
  onOpenSearch, onOpenHistory, liturgyData, onOpenLiturgyModal, onLogoClick, isAdminVisible
}) => {
  const { isDark } = useTheme();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <>
      {/* =================== TOP HEADER =================== */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-colors duration-500
        ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-stone-200/60'}`}>
        <div className="max-w-6xl mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between">

            {/* Logo */}
            <div
              className="flex items-center gap-3 cursor-pointer select-none active:scale-[0.97] transition-transform"
              onClick={onLogoClick}
              title="Tikėjimo Šviesa"
            >
              <div className="relative">
                <div className="bg-gradient-to-br from-red-900 to-red-800 p-2 rounded-xl text-amber-50 shadow-md shadow-red-900/20">
                  <Cross size={18} strokeWidth={2.5} />
                </div>

              </div>
              <div>
                <h1 className={`font-cinzel font-bold text-lg tracking-wide leading-none transition-colors ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                  Tikėjimo Šviesa
                </h1>
                {/* Liturgy Badge */}
                {liturgyData ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenLiturgyModal(); }}
                    className="flex items-center gap-1.5 mt-0.5 hover:opacity-70 transition-opacity"
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: getLiturgicalColorCSS(liturgyData.color) }}
                    />
                    <span className={`text-[10px] font-medium transition-colors ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                      {liturgyData.dateFormatted} • {liturgyData.seasonLt}
                    </span>
                  </button>
                ) : (
                  <p className={`text-[10px] font-serif italic mt-0.5 transition-colors ${isDark ? 'text-slate-500' : 'text-stone-400'}`}>
                    Ad Majorem Dei Gloriam
                  </p>
                )}
              </div>
            </div>

            {/* Desktop Navigation (hidden on mobile) */}
            <nav className="hidden md:flex items-center">
              <div className={`flex p-1 rounded-2xl backdrop-blur-sm border transition-colors ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-stone-100/70 border-stone-200/50'}`}>
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onViewChange(item.id)}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${currentView === item.id
                      ? 'text-red-900' // Text color for active item (will be overridden by pill usually)
                      : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-stone-400 hover:text-stone-700')
                      }`}
                  >
                    {currentView === item.id && (
                      <motion.div
                        layoutId="nav-pill"
                        className={`absolute inset-0 rounded-xl shadow-sm border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-stone-200/70'}`}
                        transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                      />
                    )}
                    <span className={`relative z-10 flex items-center gap-2 ${currentView === item.id ? (isDark ? 'text-amber-50' : 'text-red-900') : ''}`}>
                      {item.icon}
                      {item.label}
                    </span>
                  </button>
                ))}

                {/* Admin (Data) — always in nav but subtle */}
                {isAdminVisible && (
                  <button
                    onClick={() => onViewChange('data')}
                    className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${currentView === 'data'
                      ? 'text-red-700'
                      : 'text-stone-300 hover:text-red-500'
                      }`}
                  >
                    {currentView === 'data' && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-red-50 rounded-xl shadow-sm border border-red-200/70"
                        transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Database size={16} />
                    </span>
                  </button>
                )}
              </div>
            </nav>

            {/* Right side: Streak + Actions + Profile */}
            <div className="flex items-center gap-1 md:gap-1.5">
              <DailyFlame />

              {currentView === 'chat' && (
                <>
                  <motion.button
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    onClick={onOpenHistory}
                    className={`p-1.5 md:p-2 rounded-xl border transition-all shadow-sm ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-amber-400' : 'bg-stone-100 border-stone-200 text-stone-500 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200'}`}
                    title="Pokalbių istorija"
                  >
                    <Clock size={16} />
                  </motion.button>
                  <motion.button
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    onClick={onNewChat}
                    className={`p-1.5 md:p-2 rounded-xl border transition-all shadow-sm ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-amber-400' : 'bg-stone-100 border-stone-200 text-stone-500 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200'}`}
                    title="Naujas pokalbis"
                  >
                    <RefreshCw size={16} />
                  </motion.button>
                </>
              )}

              <ProfileMenu
                onOpenSources={onOpenSources}
                onLogin={() => setIsAuthModalOpen(true)}
              />
            </div>
          </div>
        </div>
        {/* Auth Modal */}
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </header>
    </>
  );
};
