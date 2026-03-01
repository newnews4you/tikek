import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Settings, Sun, Moon, Download, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { InstallInstructions } from '../UI/InstallInstructions';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileMenuProps {
    onOpenSources: () => void;
    onLogin: () => void;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({ onOpenSources, onLogin }) => {
    const { user, signOut } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const { isInstallable, installPWA, isIOS, supportsNativeInstall } = usePWAInstall();
    const [isOpen, setIsOpen] = useState(false);
    const [showInstallInstructions, setShowInstallInstructions] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInstall = () => {
        if (supportsNativeInstall) {
            installPWA();
        } else {
            setShowInstallInstructions(true);
        }
        setIsOpen(false);
    };

    const emailInitial = user?.email ? user.email[0].toUpperCase() : null;

    const menuItemClass = `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-stone-600 hover:bg-stone-50'
        }`;

    return (
        <>
            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center justify-center p-1.5 rounded-xl transition-all border ${isDark
                        ? 'bg-slate-800 border-slate-700 hover:border-amber-500/50'
                        : 'bg-white border-stone-200 hover:border-amber-300'
                        }`}
                >
                    {emailInitial ? (
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-cinzel font-bold text-xs ${isDark
                            ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white'
                            : 'bg-gradient-to-br from-amber-400 to-amber-600 text-white'
                            }`}>
                            {emailInitial}
                        </div>
                    ) : (
                        <User size={18} className={isDark ? 'text-slate-400' : 'text-stone-500'} />
                    )}
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className={`absolute right-0 mt-2 w-56 rounded-xl shadow-2xl border overflow-hidden z-50 ${isDark
                                ? 'bg-slate-900 border-slate-700'
                                : 'bg-white border-stone-100'
                                }`}
                        >
                            {/* User info (if logged in) */}
                            {user && (
                                <div className={`p-3 border-b ${isDark ? 'border-slate-800' : 'border-stone-100'}`}>
                                    <p className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${isDark ? 'text-slate-500' : 'text-stone-400'}`}>
                                        Prisijungęs kaip
                                    </p>
                                    <p className={`text-sm truncate font-medium ${isDark ? 'text-slate-300' : 'text-stone-700'}`}>
                                        {user.email}
                                    </p>
                                </div>
                            )}

                            {/* Settings section */}
                            <div className="p-1.5 space-y-0.5">
                                {/* Theme toggle */}
                                <button onClick={() => { toggleTheme(); setIsOpen(false); }} className={menuItemClass}>
                                    {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
                                    {isDark ? 'Šviesus režimas' : 'Tamsus režimas'}
                                </button>

                                {/* PWA Install */}
                                {isInstallable && (
                                    <button onClick={handleInstall} className={menuItemClass}>
                                        <Download size={16} className="text-green-500" />
                                        Įsidiegti programėlę
                                    </button>
                                )}

                                {/* About sources */}
                                <button onClick={() => { onOpenSources(); setIsOpen(false); }} className={menuItemClass}>
                                    <Info size={16} />
                                    Apie šaltinius
                                </button>
                            </div>

                            {/* Auth section */}
                            <div className={`border-t p-1.5 ${isDark ? 'border-slate-800' : 'border-stone-100'}`}>
                                {user ? (
                                    <button
                                        onClick={() => { signOut(); setIsOpen(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                    >
                                        <LogOut size={16} />
                                        Atsijungti
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => { onLogin(); setIsOpen(false); }}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isDark
                                            ? 'text-amber-400 hover:bg-slate-800'
                                            : 'text-red-900 hover:bg-stone-50'
                                            }`}
                                        id="profile-menu-login"
                                    >
                                        <User size={16} />
                                        Prisijungti
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <InstallInstructions
                isOpen={showInstallInstructions}
                onClose={() => setShowInstallInstructions(false)}
                isIOS={isIOS}
            />
        </>
    );
};
