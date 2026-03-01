import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Mail, Lock, Loader2, AlertCircle, ArrowRight, Chrome } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type AuthMode = 'login' | 'register';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const { isDark } = useTheme();
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            if (!supabase) throw new Error('Supabase client not initialized');

            if (mode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                onClose();
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName.trim(),
                        }
                    }
                });
                if (error) throw error;
                setSuccessMessage('Registracija sėkminga! Patikrinkite el. paštą.');
                // Don't close immediately on sign up, let them see the message
            }
        } catch (err: any) {
            setError(err.message || 'Įvyko klaida');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            if (!supabase) throw new Error('Supabase client not initialized');
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || 'Įvyko klaida su Google prisijungimu');
        }
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className={`relative w-full max-w-md rounded-2xl shadow-xl overflow-hidden border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-white'
                    }`}
            >
                {/* Header Gradient */}
                <div className="h-2 w-full bg-gradient-to-r from-amber-500 to-amber-700" />

                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className={`text-2xl font-cinzel font-bold ${isDark ? 'text-slate-100' : 'text-stone-900'}`}>
                            {mode === 'login' ? 'Prisijungti' : 'Registruotis'}
                        </h2>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-stone-100 text-stone-500'
                                }`}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-start gap-2 border border-red-100">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {successMessage && (
                            <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm flex items-start gap-2 border border-green-100">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                <span>{successMessage}</span>
                            </div>
                        )}

                        {mode === 'register' && (
                            <div className="space-y-1">
                                <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                                    Vardas
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${isDark
                                            ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-amber-500/50'
                                            : 'bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400 focus:border-amber-500'
                                            }`}
                                        placeholder="Jonas"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                                El. paštas
                            </label>
                            <div className="relative">
                                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-stone-400'}`} size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${isDark
                                        ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-amber-500/50'
                                        : 'bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400 focus:border-amber-500'
                                        }`}
                                    placeholder="vardas@pavyzdys.lt"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                                Slaptažodis
                            </label>
                            <div className="relative">
                                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-stone-400'}`} size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${isDark
                                        ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-amber-500/50'
                                        : 'bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400 focus:border-amber-500'
                                        }`}
                                    placeholder="••••••••"
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 mt-2 ${isDark
                                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-amber-900/20'
                                : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-amber-500/30'
                                } disabled:opacity-70 disabled:cursor-not-allowed`}
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    {mode === 'login' ? 'Prisijungti' : 'Registruotis'}
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className={`w-full border-t ${isDark ? 'border-slate-700' : 'border-stone-200'}`}></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className={`px-2 ${isDark ? 'bg-slate-900 text-slate-500' : 'bg-white text-stone-400'}`}>
                                Arba
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all border ${isDark
                            ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                            : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                            }`}
                    >
                        <Chrome size={20} />
                        <span>Tęsti su Google</span>
                    </button>

                    <div className="mt-6 text-center">
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-stone-600'}`}>
                            {mode === 'login' ? 'Neturite paskyros?' : 'Jau turite paskyrą?'}
                            <button
                                onClick={() => {
                                    setMode(mode === 'login' ? 'register' : 'login');
                                    setError(null);
                                    setSuccessMessage(null);
                                }}
                                className={`ml-2 font-bold hover:underline ${isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-700 hover:text-amber-800'
                                    }`}
                            >
                                {mode === 'login' ? 'Registruotis' : 'Prisijungti'}
                            </button>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};
