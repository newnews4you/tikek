import React, { useState } from 'react';
import { Cross, MessageCircle, BookHeart, Book, RefreshCw, Info, Database, Lock } from 'lucide-react';

interface HeaderProps {
  currentView: 'chat' | 'prayer' | 'bible' | 'data';
  onViewChange: (view: 'chat' | 'prayer' | 'bible' | 'data') => void;
  onNewChat: () => void;
  onOpenSources: () => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, onNewChat, onOpenSources, onOpenSearch }) => {
  const [adminClicks, setAdminClicks] = useState(0);
  const [isAdminVisible, setIsAdminVisible] = useState(false);

  const handleLogoClick = () => {
    const newCount = adminClicks + 1;
    setAdminClicks(newCount);
    
    if (newCount === 5) {
      setIsAdminVisible(true);
      alert("Administratoriaus režimas aktyvuotas.");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-stone-50/90 backdrop-blur-md border-b border-stone-200 shadow-sm transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Section - SECRET TRIGGER */}
          <div 
            className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start cursor-pointer select-none active:scale-95 transition-transform"
            onClick={handleLogoClick}
            title="Tikėjimo Šviesa"
          >
            <div className="bg-red-900 p-2 rounded-lg text-amber-50 shadow-inner relative overflow-hidden">
              <Cross size={20} strokeWidth={2.5} />
              {/* Visual feedback for clicks */}
              {adminClicks > 0 && adminClicks < 5 && (
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              )}
            </div>
            <div>
              <h1 className="font-cinzel font-bold text-xl sm:text-2xl text-stone-900 tracking-wide leading-none">
                Tikėjimo Šviesa
              </h1>
              <p className="text-[10px] sm:text-xs text-amber-700 font-serif italic tracking-wider">
                Ad Majorem Dei Gloriam
              </p>
            </div>
          </div>

          {/* Navigation & Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
            
            <div className="flex bg-stone-200/50 p-1 rounded-xl">
              <button
                onClick={() => onViewChange('chat')}
                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                  currentView === 'chat'
                    ? 'bg-white text-red-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700 hover:bg-stone-200/50'
                }`}
              >
                <MessageCircle size={16} />
                <span className="hidden md:inline">Pokalbis</span>
              </button>
              <button
                onClick={() => onViewChange('bible')}
                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                  currentView === 'bible'
                    ? 'bg-white text-red-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700 hover:bg-stone-200/50'
                }`}
              >
                <Book size={16} />
                <span className="hidden md:inline">Biblija</span>
              </button>
              <button
                onClick={() => onViewChange('prayer')}
                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                  currentView === 'prayer'
                    ? 'bg-white text-red-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700 hover:bg-stone-200/50'
                }`}
              >
                <BookHeart size={16} />
                <span className="hidden md:inline">Maldynas</span>
              </button>
              
              {/* HIDDEN ADMIN BUTTON */}
              {isAdminVisible && (
                <button
                  onClick={() => onViewChange('data')}
                  className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                    currentView === 'data'
                      ? 'bg-red-100 text-red-900 shadow-sm border border-red-200'
                      : 'text-stone-500 hover:text-red-700 hover:bg-red-50'
                  }`}
                >
                  <Database size={16} />
                  <span className="hidden md:inline">Duomenys</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 ml-1 pl-2 border-l border-stone-200">
               <button
                  onClick={onOpenSources}
                  className="p-2.5 rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-all"
                  title="Apie šaltinius"
               >
                  <Info size={18} />
               </button>
               
               {currentView === 'chat' && (
                  <button
                  onClick={onNewChat}
                  className="p-2.5 rounded-xl bg-stone-100 text-stone-600 border border-stone-200 hover:bg-white hover:border-amber-300 hover:text-amber-700 transition-all shadow-sm"
                  title="Naujas pokalbis"
                  >
                  <RefreshCw size={18} />
                  </button>
               )}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};