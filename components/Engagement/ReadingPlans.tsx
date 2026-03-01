import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Flame, Play, Square,
    CheckCircle, Circle, Clock, Target,
    Sparkles, Award, ArrowLeft, Star, ChevronRight, Moon, Sun, User
} from 'lucide-react';
import {
    READING_PLANS, ReadingPlanDefinition, PlanProgress, DailyReading,
    startPlan, stopPlan, getAllPlanProgress, getPlanProgressById,
    isPlanActive, markPlanReadingComplete, isPlanReadingComplete,
    getReadingsForDay
} from '../../services/plansService';
import { generateSimpleContent } from '../../services/geminiService';
import { useBibleContent } from '../../hooks/useBibleContent';
import { markChapterComplete } from '../../services/progressService';
import { useTheme } from '../../context/ThemeContext';

// ========================
// THEME HOOK
// ========================
// Theme hook removed - using Global Context

// ========================
// RESPONSIVE CONTAINER HOOK
// ========================
function useContainerWidth(ref: React.RefObject<HTMLDivElement | null>) {
    const [width, setWidth] = useState(320);
    useEffect(() => {
        if (!ref.current) return;
        const obs = new ResizeObserver(entries => {
            for (const e of entries) setWidth(e.contentRect.width);
        });
        obs.observe(ref.current);
        setWidth(ref.current.offsetWidth);
        return () => obs.disconnect();
    }, [ref]);
    return width;
}

interface ReadingPlansProps {
    onNavigateToChapter: (book: string, chapter: number) => void;
}

// ========================
// FLOATING SAINTS
// ========================
const SAINT_SYMBOLS = ['✝', '⛪', '🕊', '🙏', '✞', '☧', '🔔', '⚜', '🕯', '✨'];

const FloatingSaints: React.FC<{ isDark: boolean }> = ({ isDark }) => {
    const saints = useMemo(() =>
        Array.from({ length: 12 }, (_, i) => ({
            id: i,
            symbol: SAINT_SYMBOLS[i % SAINT_SYMBOLS.length],
            left: `${5 + (i * 7.3) % 90}%`,
            top: `${3 + (i * 13.7) % 85}%`,
            size: 14 + (i % 4) * 6,
            delay: i * 1.2,
            duration: 14 + (i % 5) * 3,
            opacity: isDark ? 0.04 + (i % 3) * 0.02 : 0.06 + (i % 3) * 0.03,
        })), [isDark]);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {saints.map(s => (
                <motion.div
                    key={s.id}
                    className="absolute select-none"
                    style={{ left: s.left, top: s.top, fontSize: s.size, opacity: s.opacity, filter: 'blur(0.5px)' }}
                    animate={{
                        y: [0, -15, 5, -10, 0],
                        x: [0, 6, -4, 8, 0],
                        opacity: [s.opacity, s.opacity * 1.8, s.opacity * 0.6, s.opacity * 1.5, s.opacity],
                    }}
                    transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
                >
                    {s.symbol}
                </motion.div>
            ))}
        </div>
    );
};

// ========================
// INLINE CHAPTER READER (unchanged, always light)
// ========================
const InlineReader: React.FC<{
    planId: string; book: string; chapter: number;
    onBack: () => void; onComplete: () => void; isComplete: boolean;
}> = ({ planId, book, chapter, onBack, onComplete, isComplete }) => {
    const { isDark } = useTheme();
    const { getChapterContent, isReady } = useBibleContent();
    const scrollRef = useRef<HTMLDivElement>(null);
    const content = isReady ? getChapterContent(book, chapter) : null;

    // AI Commentary State
    const [commentary, setCommentary] = useState<string | null>(null);
    const [loadingCommentary, setLoadingCommentary] = useState(false);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: 0 });
        setCommentary(null); // Reset explanation on change
    }, [book, chapter]);

    const handleGetCommentary = async () => {
        setLoadingCommentary(true);
        try {
            const prompt = `Pateik trumpą, gilią katalikišką dvasinį komentarą (refleksiją) apie: ${book} ${chapter + 1} skyrius. \nTikslas: Padėti skaitytojui pritaikyti tai savo gyvenime šiandien. \nApimtis: 2-3 sakiniai. \nStilius: Įkvepiantis, rimtas. \nSVARBU: Nenaudok jokių pasisveikinimų ("Sveiki", "Labas"). Pradėk iš karto nuo minties.`;
            const text = await generateSimpleContent(prompt);
            setCommentary(text);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingCommentary(false);
        }
    };

    // Reflection State
    const [reflection, setReflection] = useState('');
    const [savedStatus, setSavedStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load reflection
    useEffect(() => {
        const key = `reflection-${planId}-${book}-${chapter}`; // Unique key per plan/chapter
        const saved = localStorage.getItem(key);
        setReflection(saved || '');
        setSavedStatus('idle');
    }, [planId, book, chapter]);

    // Handle change with debounce
    const handleReflectionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setReflection(val);
        setSavedStatus('saving');

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = setTimeout(() => {
            const key = `reflection-${planId}-${book}-${chapter}`;
            localStorage.setItem(key, val);
            setSavedStatus('saved');
            setTimeout(() => setSavedStatus('idle'), 2000);
        }, 1000);
    };

    // AI Feedback State
    const [feedback, setFeedback] = useState<string | null>(null);
    const [loadingFeedback, setLoadingFeedback] = useState(false);

    // Save/Load Feedback
    useEffect(() => {
        const key = `feedback-${planId}-${book}-${chapter}`;
        const saved = localStorage.getItem(key);
        if (saved) setFeedback(saved);
        else setFeedback(null);
    }, [planId, book, chapter]);

    const handleGetFeedback = async () => {
        if (!reflection || reflection.length < 5) return;
        setLoadingFeedback(true);
        try {
            const prompt = `
            Vartotojas skaito: ${book} ${chapter + 1} skyrius.
            Vartotojo asmeninė refleksija: "${reflection}".
            
            KAIP DVASINIS PALYDĖTOJAS (TIKĖJIMO BROLIS):
            1. Padrąsink vartotoją dėl jo įžvalgos.
            2. Jei tinka, užduok vieną gilinantį klausimą arba pasiūlyk trumpą, taiklią mintį iš šventųjų ar Bažnyčios mokymo, kuri siejasi su tuo, ką jis parašė.
            3. Būk šiltas, bet ne "saldus". Būk konkretus.
            4. Apimtis: 2-3 sakiniai.
            `;
            const text = await generateSimpleContent(prompt);
            setFeedback(text);
            localStorage.setItem(`feedback-${planId}-${book}-${chapter}`, text);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingFeedback(false);
        }
    };

    // Verse Selection State
    const [selectedVerses, setSelectedVerses] = useState<number[]>([]);

    const toggleVerse = (verseNum: number) => {
        setSelectedVerses(prev =>
            prev.includes(verseNum)
                ? prev.filter(v => v !== verseNum)
                : [...prev, verseNum].sort((a, b) => a - b)
        );
    };

    const handleCopyVerses = () => {
        if (!content) return;
        const selectedText = selectedVerses.map(vNum => {
            const v = content.verses.find(cv => cv.number === vNum);
            return v ? `${v.number}. ${v.content}` : '';
        }).join('\n');

        const reference = `${book} ${chapter + 1}:${selectedVerses.join(',')}`;
        const clipboardText = `${selectedText}\n\n(${reference})`;

        navigator.clipboard.writeText(clipboardText);
        setSelectedVerses([]);
    };

    // AI Verse Analysis (Komentuoti)
    const [verseAnalysis, setVerseAnalysis] = useState<string | null>(null);
    const [loadingVerseAnalysis, setLoadingVerseAnalysis] = useState(false);

    const handleAnalyzeVerses = async () => {
        if (!content || selectedVerses.length === 0) return;
        const selectedText = selectedVerses.map(vNum => {
            const v = content.verses.find(cv => cv.number === vNum);
            return v ? v.content : '';
        }).join(' ');
        const reference = `${book} ${chapter + 1}:${selectedVerses.join(',')}`;
        setSelectedVerses([]);
        setLoadingVerseAnalysis(true);
        setVerseAnalysis(null);
        try {
            const prompt = `Esu katalikas ir skaitau šią Šventojo Rašto ištrauką: "${selectedText}" (${reference}). Prašau pateikti gilų teologinį komentarą (ekzegezę) iš Katalikų Bažnyčios perspektyvos lietuvių kalba.`;
            const text = await generateSimpleContent(prompt);
            setVerseAnalysis(text);
        } catch (e) {
            console.error(e);
            setVerseAnalysis('Atsiprašau, įvyko ryšio klaida.');
        } finally {
            setLoadingVerseAnalysis(false);
        }
    };

    // Reset on chapter change
    useEffect(() => {
        setVerseAnalysis(null);
    }, [book, chapter]);

    // Close selection when changing chapters
    useEffect(() => {
        setSelectedVerses([]);
    }, [book, chapter]);

    return (
        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }} className={`flex flex-col h-full ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
            <div className={`${selectedVerses.length > 0 ? 'fixed top-0 left-0 right-0 z-[200]' : 'sticky top-0 z-20'} backdrop-blur-xl border-b px-3 sm:px-4 py-3 ${isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-stone-200/60'}`}>
                <div className="flex items-center justify-between max-w-2xl mx-auto">
                    {selectedVerses.length > 0 ? (
                        <div className="flex items-center justify-between w-full">
                            <span className={`text-sm font-medium ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>
                                Pasirinkta: {selectedVerses.length}
                            </span>
                            <div className="flex gap-2">
                                <button onClick={() => setSelectedVerses([])} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-stone-500 hover:bg-stone-100'}`}>
                                    Atšaukti
                                </button>
                                <button onClick={handleCopyVerses} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${isDark ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}>
                                    <BookOpen size={14} /> Kopijuoti
                                </button>
                                <button onClick={handleAnalyzeVerses} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-900 text-amber-50 shadow-lg hover:bg-red-800">
                                    <Sparkles size={14} /> Komentuoti
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <button onClick={onBack} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'}`}>
                                <ArrowLeft size={18} /><span className="text-sm font-medium hidden sm:inline">Grįžti</span>
                            </button>
                            <div className="text-center">
                                <h3 className={`font-cinzel font-bold text-sm ${isDark ? 'text-white' : 'text-stone-900'}`}>{book}</h3>
                                <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-stone-400'}`}>{chapter + 1} skyrius</p>
                            </div>
                            {!isComplete ? (
                                <button onClick={onComplete} className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 sm:px-3 py-2 rounded-xl border border-amber-200/60">
                                    <CheckCircle size={14} /> <span className="hidden sm:inline">Atlikta</span><span className="sm:hidden">✓</span>
                                </button>
                            ) : (
                                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200/60">
                                    <CheckCircle size={14} /> ✓
                                </span>
                            )}
                        </>
                    )}
                </div>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto w-full">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                    {!isReady || !content ? (
                        <div className="text-center py-20">
                            <div className={`w-8 h-8 border-2 border-t-amber-500 rounded-full animate-spin mx-auto mb-4 ${isDark ? 'border-slate-800' : 'border-stone-300'}`} />
                            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-stone-400'}`}>Kraunamas tekstas...</p>
                        </div>
                    ) : content.verses.length === 0 ? (
                        <div className="text-center py-20">
                            <BookOpen size={32} className={`${isDark ? 'text-slate-700' : 'text-stone-300'} mx-auto mb-3`} />
                            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-stone-400'}`}>Šiam skyriui tekstas nerastas.</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {content.verses.map(v => {
                                const isSelected = selectedVerses.includes(v.number);
                                return (
                                    <div
                                        key={v.number}
                                        onClick={() => toggleVerse(v.number)}
                                        className={`relative px-2 -mx-2 rounded-lg transition-colors cursor-pointer select-none ${isSelected
                                            ? (isDark ? 'bg-amber-900/40 text-amber-100' : 'bg-amber-100/50 text-stone-900')
                                            : (isDark ? 'text-slate-200 hover:bg-white/5' : 'text-stone-800 hover:bg-stone-50')
                                            }`}
                                    >
                                        <sup className={`text-[10px] font-bold mr-1.5 select-none ${isSelected
                                            ? (isDark ? 'text-amber-400' : 'text-amber-700')
                                            : (isDark ? 'text-amber-500/70' : 'text-amber-600/70')
                                            }`}>{v.number}</sup>
                                        <span className="text-[15px] leading-[1.9] font-serif">{v.content}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {content && content.verses.length > 0 && (
                        <div className="mt-8 mb-6">
                            <AnimatePresence>
                                {!commentary && !loadingCommentary && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <button
                                            onClick={handleGetCommentary}
                                            className={`w-full py-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all group ${isDark ? 'border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/5' : 'border-amber-200 hover:border-amber-300 hover:bg-amber-50'
                                                }`}
                                        >
                                            <Sparkles size={18} className={isDark ? 'text-amber-400' : 'text-amber-600'} />
                                            <span className={`font-cinzel font-bold text-sm ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                                                Gauti dvasinį komentarą
                                            </span>
                                        </button>
                                    </motion.div>
                                )}

                                {loadingCommentary && (
                                    <motion.div
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className={`w-full py-6 rounded-xl flex flex-col items-center justify-center gap-3 ${isDark ? 'bg-slate-900/50' : 'bg-stone-50'
                                            }`}
                                    >
                                        <div className={`w-6 h-6 border-2 border-t-transparent rounded-full animate-spin ${isDark ? 'border-amber-400' : 'border-amber-600'
                                            }`} />
                                        <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                                            Generuojama įžvalga...
                                        </span>
                                    </motion.div>
                                )}

                                {commentary && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        className={`relative overflow-hidden rounded-xl p-5 border shadow-lg ${isDark
                                            ? 'bg-gradient-to-br from-slate-900 to-slate-900 border-amber-500/30'
                                            : 'bg-gradient-to-br from-white to-amber-50/50 border-amber-200'
                                            }`}
                                    >
                                        <div className={`absolute top-0 left-0 w-1 h-full ${isDark ? 'bg-gradient-to-b from-amber-500 to-amber-700' : 'bg-gradient-to-b from-amber-400 to-amber-600'
                                            }`} />

                                        <div className="flex items-start gap-3">
                                            <Sparkles size={20} className={`mt-1 flex-shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`font-cinzel font-bold text-sm mb-3 ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                                                    Dvasinė Įžvalga
                                                </h4>

                                                <div className={`text-sm leading-relaxed font-serif ${isDark ? 'text-slate-300' : 'text-stone-700'}`}>
                                                    {(() => {
                                                        // 1. Split Text parts
                                                        const raw = commentary || '';
                                                        let mainText = raw;
                                                        let suggestions: string[] = [];

                                                        // Extract SUGGESTIONS
                                                        if (mainText.includes('|||SUGGESTIONS:')) {
                                                            const parts = mainText.split('|||SUGGESTIONS:');
                                                            mainText = parts[0];
                                                            const suggRaw = parts[1].split('|||')[0]; // Handle if trailing ||| exists
                                                            suggestions = suggRaw.split('|').map(s => s.trim()).filter(s => s.length > 0);
                                                        }

                                                        // Extract SOURCES (if any, usually mostly for Chat, but good to handle)
                                                        if (mainText.includes('|||SOURCES:')) {
                                                            mainText = mainText.split('|||SOURCES:')[0];
                                                        }

                                                        // 2. Parse Markdown-ish text
                                                        const lines = mainText.split('\n').filter(l => l.trim() !== '');

                                                        return (
                                                            <div className="space-y-3">
                                                                {lines.map((line, i) => {
                                                                    const trimmed = line.trim();

                                                                    // Headers
                                                                    if (trimmed.startsWith('###')) {
                                                                        return <h5 key={i} className={`font-cinzel font-bold mt-2 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>{trimmed.replace(/^###\s*/, '')}</h5>;
                                                                    }
                                                                    if (trimmed.startsWith('##')) {
                                                                        return <h5 key={i} className={`font-cinzel font-bold text-base mt-2 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>{trimmed.replace(/^##\s*/, '')}</h5>;
                                                                    }

                                                                    // Bold parsing helper
                                                                    const parseBold = (text: string) => {
                                                                        const parts = text.split(/(\*\*.*?\*\*)/g);
                                                                        return parts.map((part, j) => {
                                                                            if (part.startsWith('**') && part.endsWith('**')) {
                                                                                return <strong key={j} className={isDark ? 'text-amber-200' : 'text-amber-900'}>{part.slice(2, -2)}</strong>;
                                                                            }
                                                                            return part;
                                                                        });
                                                                    };

                                                                    return <p key={i}>{parseBold(trimmed)}</p>;
                                                                })}

                                                                {/* Render Suggestions as Reflection Questions */}
                                                                {suggestions.length > 0 && (
                                                                    <div className={`mt-4 pt-3 border-t ${isDark ? 'border-amber-500/20' : 'border-amber-200'}`}>
                                                                        <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-stone-400'}`}>
                                                                            Pamąstymui
                                                                        </p>
                                                                        <ul className="space-y-2">
                                                                            {suggestions.map((sug, idx) => (
                                                                                <li key={idx} className="flex gap-2 text-xs italic opacity-90">
                                                                                    <span className={isDark ? 'text-amber-500' : 'text-amber-600'}>•</span>
                                                                                    <span>{sug}</span>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Verse Analysis (Komentuoti) */}
                    {(loadingVerseAnalysis || verseAnalysis) && (
                        <div className="mt-6 mb-6">
                            {loadingVerseAnalysis && (
                                <div className={`w-full py-6 rounded-xl flex flex-col items-center justify-center gap-3 ${isDark ? 'bg-slate-900/50' : 'bg-stone-50'}`}>
                                    <div className={`w-6 h-6 border-2 border-t-transparent rounded-full animate-spin ${isDark ? 'border-red-400' : 'border-red-600'}`} />
                                    <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>Analizuojama...</span>
                                </div>
                            )}
                            {verseAnalysis && !loadingVerseAnalysis && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className={`relative overflow-hidden rounded-xl p-5 border shadow-lg ${isDark
                                        ? 'bg-gradient-to-br from-slate-900 to-slate-900 border-red-500/30'
                                        : 'bg-gradient-to-br from-white to-red-50/50 border-red-200'
                                        }`}
                                >
                                    <div className={`absolute top-0 left-0 w-1 h-full ${isDark ? 'bg-gradient-to-b from-red-500 to-red-700' : 'bg-gradient-to-b from-red-400 to-red-600'}`} />
                                    <div className="flex items-start gap-3">
                                        <Sparkles size={20} className={`mt-1 flex-shrink-0 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                                        <div className="flex-1 min-w-0">
                                            <h4 className={`font-cinzel font-bold text-sm mb-3 ${isDark ? 'text-red-200' : 'text-red-800'}`}>
                                                Eilutų Komentaras
                                            </h4>
                                            <div className={`text-sm leading-relaxed font-serif ${isDark ? 'text-slate-300' : 'text-stone-700'}`}>
                                                {(() => {
                                                    let mainText = verseAnalysis.split('|||SUGGESTIONS')[0].split('|||SOURCES')[0];
                                                    const lines = mainText.split('\n').filter(l => l.trim() !== '');
                                                    const parseBold = (text: string) => {
                                                        const parts = text.split(/(\*\*.*?\*\*)/g);
                                                        return parts.map((part, j) => {
                                                            if (part.startsWith('**') && part.endsWith('**')) {
                                                                return <strong key={j} className={isDark ? 'text-red-200' : 'text-red-900'}>{part.slice(2, -2)}</strong>;
                                                            }
                                                            return part;
                                                        });
                                                    };
                                                    return (
                                                        <div className="space-y-3">
                                                            {lines.map((line, i) => {
                                                                const trimmed = line.trim();
                                                                if (trimmed.startsWith('###')) return <h5 key={i} className={`font-cinzel font-bold mt-2 ${isDark ? 'text-red-400' : 'text-red-700'}`}>{trimmed.replace(/^###\s*/, '')}</h5>;
                                                                if (trimmed.startsWith('##')) return <h5 key={i} className={`font-cinzel font-bold text-base mt-2 ${isDark ? 'text-red-400' : 'text-red-700'}`}>{trimmed.replace(/^##\s*/, '')}</h5>;
                                                                return <p key={i}>{parseBold(trimmed)}</p>;
                                                            })}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}

                    {/* === USER REFLECTION / JOURNAL === */}
                    <div className={`mt-8 mb-6 p-5 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-stone-200 shadow-sm'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className={`font-cinzel font-bold text-sm flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-stone-700'}`}>
                                <BookOpen size={16} className={isDark ? 'text-amber-500' : 'text-amber-600'} />
                                Mano Įžvalgos
                            </h4>
                            <span className={`text-[10px] font-medium transition-opacity duration-300 ${savedStatus === 'idle' ? 'opacity-0' : 'opacity-100'} ${savedStatus === 'saved' ? 'text-emerald-500' : 'text-amber-500'
                                }`}>
                                {savedStatus === 'saved' ? 'Išsaugota' : 'Saugoma...'}
                            </span>
                        </div>
                        <textarea
                            value={reflection}
                            onChange={handleReflectionChange}
                            placeholder="Ką Dievas tau kalbėjo per šį tekstą? Kas palietė tavo širdį?"
                            className={`w-full h-32 p-3 rounded-lg resize-none font-serif text-base leading-relaxed focus:outline-none focus:ring-1 transition-all
                                ${isDark
                                    ? 'bg-slate-950 text-slate-200 placeholder-slate-600 border-slate-800 focus:border-amber-500/50 focus:ring-amber-500/20'
                                    : 'bg-stone-50 text-stone-800 placeholder-stone-400 border-stone-200 focus:border-amber-400 focus:ring-amber-200'
                                }`}
                        />
                    </div>

                    {/* Feedback Button & Response */}
                    <div className="mt-3 mb-8 flex flex-col gap-4">
                        {!feedback && !loadingFeedback && reflection.length > 5 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end">
                                <button
                                    onClick={handleGetFeedback}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm
                                                ${isDark
                                            ? 'bg-indigo-900/30 text-indigo-300 hover:bg-indigo-900/50 border border-indigo-500/30'
                                            : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
                                        }`}
                                >
                                    <Sparkles size={14} /> Gauti dvasinį palydėjimą
                                </button>
                            </motion.div>
                        )}

                        {loadingFeedback && (
                            <div className="flex items-center justify-center gap-2 text-xs text-indigo-500 animate-pulse py-4">
                                <Sparkles size={14} />
                                <span>Dvasinis palydėtojas mąsto...</span>
                            </div>
                        )}

                        {feedback && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className={`p-4 rounded-xl border relative overflow-hidden shadow-sm ${isDark
                                    ? 'bg-gradient-to-br from-indigo-950/50 to-slate-900 border-indigo-500/30'
                                    : 'bg-gradient-to-br from-indigo-50 to-white border-indigo-100'
                                    }`}
                            >
                                <div className={`absolute top-0 left-0 w-1 h-full ${isDark ? 'bg-indigo-500' : 'bg-indigo-400'}`} />
                                <div className="flex gap-3">
                                    <div className={`mt-0.5 p-1.5 rounded-full flex-shrink-0 h-fit ${isDark ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                                        <User size={14} />
                                    </div>
                                    <div>
                                        <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-indigo-300' : 'text-indigo-800'}`}>
                                            Palydėtojo Atsakas
                                        </h5>
                                        <div className={`text-sm font-serif leading-relaxed ${isDark ? 'text-indigo-100' : 'text-indigo-900'}`}>
                                            {(() => {
                                                let mainText = feedback || '';
                                                let suggestions: string[] = [];

                                                if (mainText.includes('|||SUGGESTIONS:')) {
                                                    const parts = mainText.split('|||SUGGESTIONS:');
                                                    mainText = parts[0];
                                                    const suggRaw = parts[1].split('|||')[0];
                                                    suggestions = suggRaw.split('|').map(s => s.trim()).filter(s => s.length > 0);
                                                }

                                                if (mainText.includes('|||SOURCES:')) {
                                                    mainText = mainText.split('|||SOURCES:')[0];
                                                }

                                                const parseBold = (text: string) => {
                                                    const parts = text.split(/(\*\*.*?\*\*)/g);
                                                    return parts.map((part, j) => {
                                                        if (part.startsWith('**') && part.endsWith('**')) {
                                                            return <strong key={j} className={isDark ? 'text-indigo-200' : 'text-indigo-900'}>{part.slice(2, -2)}</strong>;
                                                        }
                                                        return part;
                                                    });
                                                };

                                                return (
                                                    <div className="space-y-2">
                                                        {mainText.split('\n').filter(l => l.trim()).map((line, i) => (
                                                            <p key={i}>{parseBold(line.trim())}</p>
                                                        ))}

                                                        {suggestions.length > 0 && (
                                                            <div className={`mt-3 pt-2 border-t ${isDark ? 'border-indigo-500/30' : 'border-indigo-200'}`}>
                                                                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70`}>Klausimas tau:</p>
                                                                <ul className="space-y-1">
                                                                    {suggestions.map((s, idx) => (
                                                                        <li key={idx} className="flex gap-2 text-xs italic opacity-90">
                                                                            <span className="text-indigo-400">•</span>
                                                                            <span>{s}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {content && content.verses.length > 0 && !isComplete && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-12 text-center pb-8">
                            <button onClick={onComplete} className="inline-flex items-center gap-2.5 px-6 sm:px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold text-sm rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                                <CheckCircle size={18} /> Pažymėti kaip perskaitytą
                            </button>
                        </motion.div>
                    )}
                    {isComplete && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-12 text-center pb-8">
                            <div className="inline-flex items-center gap-2 text-emerald-600 bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-200/60">
                                <CheckCircle size={18} /><span className="font-bold text-sm">Skyrius perskaitytas</span>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div >
    );
};

// ========================
// PLAN CARD (Gallery) — supports light/dark
// ========================
const PlanCard: React.FC<{
    plan: ReadingPlanDefinition; progress: PlanProgress | null;
    onStart: (id: string) => void; onOpen: (id: string) => void;
    index: number;
}> = ({ plan, progress, onStart, onOpen, index }) => {
    const { isDark } = useTheme();
    const isActive = progress !== null;
    const themes: Record<string, { gradient: string; iconBg: string; border: string; button: string; statsBg: string; accent: string }> = {
        red: { gradient: 'from-red-900 via-red-800 to-rose-900', iconBg: 'bg-red-700/30', border: 'border-red-700/20', button: 'bg-amber-50 text-red-900 hover:bg-white', statsBg: 'bg-red-950/40', accent: 'text-amber-300' },
        indigo: { gradient: 'from-indigo-900 via-indigo-800 to-violet-900', iconBg: 'bg-indigo-700/30', border: 'border-indigo-700/20', button: 'bg-amber-50 text-indigo-900 hover:bg-white', statsBg: 'bg-indigo-950/40', accent: 'text-indigo-200' },
        emerald: { gradient: 'from-emerald-900 via-emerald-800 to-teal-900', iconBg: 'bg-emerald-700/30', border: 'border-emerald-700/20', button: 'bg-amber-50 text-emerald-900 hover:bg-white', statsBg: 'bg-emerald-950/40', accent: 'text-emerald-200' },
        amber: { gradient: 'from-amber-900 via-amber-800 to-yellow-900', iconBg: 'bg-amber-700/30', border: 'border-amber-700/20', button: 'bg-amber-50 text-amber-900 hover:bg-white', statsBg: 'bg-amber-950/40', accent: 'text-amber-200' },
    };
    const t = themes[plan.color] || themes.red;

    return (
        <div
            className={`relative overflow-hidden rounded-2xl shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${isActive ? 'ring-2 ring-amber-400/50' : ''}`}
            onClick={isActive ? () => onOpen(plan.id) : undefined}
            style={isActive ? { cursor: 'pointer' } : {}}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${t.gradient}`} />
            <div className="relative z-10 p-4 sm:p-5">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 ${t.iconBg} rounded-xl flex items-center justify-center text-xl sm:text-2xl backdrop-blur-sm border ${t.border}`}>
                        {plan.icon}
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {isActive && progress!.streak > 0 && (
                            <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/30 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                                <Flame size={11} className="text-amber-400 fill-amber-400" />
                                <span className="text-[10px] sm:text-[11px] font-bold text-amber-300 tabular-nums">{progress!.streak}</span>
                            </div>
                        )}
                        <div className={`${t.statsBg} backdrop-blur-sm px-2 py-0.5 sm:py-1 rounded-full border ${t.border}`}>
                            <span className="text-[9px] sm:text-[10px] font-bold text-white/90 tracking-wide">{plan.durationDays} D.</span>
                        </div>
                    </div>
                </div>
                <h3 className="font-cinzel font-bold text-base sm:text-lg text-white leading-tight mb-1">{plan.name}</h3>
                <p className="text-[11px] sm:text-xs text-white/50 font-serif leading-relaxed mb-3 sm:mb-4 line-clamp-1">{plan.description}</p>
                {isActive && progress ? (
                    <div className="space-y-2.5 sm:space-y-3">
                        <div>
                            <div className="flex items-center justify-between text-[10px] mb-1.5">
                                <span className="text-white/40">Progresas</span>
                                <span className="font-bold text-amber-400 tabular-nums">{progress.percentComplete}%</span>
                            </div>
                            <div className="h-1.5 sm:h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full transition-all duration-700" style={{ width: `${Math.max(progress.percentComplete, 3)}%` }} />
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-[9px] sm:text-[10px]">
                            <span className="text-white/50"><span className="font-bold text-white/80 tabular-nums">{progress.remainingCount}</span> liko</span>
                            <span className="text-white/50">D. <span className="font-bold text-white/80 tabular-nums">{progress.currentDay}</span>/{progress.totalDays}</span>
                            {progress.isTodayComplete
                                ? <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle size={11} /> ✓</span>
                                : <span className="text-amber-300/70 font-bold">Skaityti →</span>}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                            <div className="flex items-center gap-1.5"><BookOpen size={12} className={t.accent} /><span className="text-[10px] text-white/60">{plan.readings.length} sk.</span></div>
                            <div className="flex items-center gap-1.5"><Target size={12} className={t.accent} /><span className="text-[10px] text-white/60">~{Math.ceil(plan.readings.length / plan.durationDays)}/d.</span></div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onStart(plan.id); }} className={`w-full ${t.button} py-2.5 sm:py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg`}>
                            <Play size={14} /> Pradėti
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

// ========================
// PLAN DETAIL — THE GOLDEN PATH (Responsive + Light/Dark)
// ========================

// Theme color tokens
const T = {
    dark: {
        bg: 'linear-gradient(180deg, #0c0a14 0%, #0f172a 30%, #020617 100%)',
        spotlight: 'radial-gradient(ellipse 60% 40% at 50% 5%, rgba(251,191,36,0.12) 0%, transparent 70%)',
        headerBg: 'bg-slate-950/70',
        headerBorder: 'border-amber-500/10',
        textPrimary: 'text-white',
        textSecondary: 'text-slate-400',
        textMuted: 'text-slate-500',
        textGold: 'text-amber-400',
        progressBg: 'bg-slate-800',
        pathColorBg: '#1e293b',
        pathColorLit: '#f59e0b',
        nodeCurrent: 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700',
        nodeDone: 'bg-gradient-to-br from-amber-600 to-amber-800',
        nodeFuture: 'bg-slate-800/80 border border-slate-700/60',
        nodeMilestone: 'bg-slate-800 border-2 border-slate-600',
        cardBg: 'bg-slate-900/95 border-amber-500/20',
        badgeCurrent: 'bg-amber-500 text-white',
        badgeDone: 'bg-amber-900/60 text-amber-300 border border-amber-800/50',
        badgeFuture: 'bg-slate-800/80 text-slate-500 border border-slate-700/40',
        labelCurrent: 'text-amber-300',
        labelDone: 'text-amber-600/70',
        labelFuture: 'text-slate-600/50',
        stopBtn: 'bg-slate-900/80 border-white/5 text-red-400/60 hover:text-red-400 hover:bg-red-950/30',
        overdueBg: 'bg-red-950/40 border-red-500/20',
        overdueText: 'text-red-300',
    },
    light: {
        bg: 'linear-gradient(180deg, #fffbeb 0%, #fef3c7 30%, #f5f0e6 100%)',
        spotlight: 'radial-gradient(ellipse 60% 40% at 50% 5%, rgba(180,130,40,0.08) 0%, transparent 70%)',
        headerBg: 'bg-white/80',
        headerBorder: 'border-amber-200/40',
        textPrimary: 'text-stone-900',
        textSecondary: 'text-stone-500',
        textMuted: 'text-stone-400',
        textGold: 'text-amber-700',
        progressBg: 'bg-amber-200/40',
        pathColorBg: '#d6d3d1',
        pathColorLit: '#b45309',
        nodeCurrent: 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800',
        nodeDone: 'bg-gradient-to-br from-amber-500 to-amber-700',
        nodeFuture: 'bg-stone-200 border border-stone-300',
        nodeMilestone: 'bg-stone-300 border-2 border-stone-400',
        cardBg: 'bg-white/95 border-amber-300/30',
        badgeCurrent: 'bg-amber-600 text-white',
        badgeDone: 'bg-amber-100 text-amber-800 border border-amber-200',
        badgeFuture: 'bg-stone-100 text-stone-400 border border-stone-200',
        labelCurrent: 'text-amber-800',
        labelDone: 'text-amber-700/60',
        labelFuture: 'text-stone-400/60',
        stopBtn: 'bg-white/80 border-stone-200 text-red-400 hover:text-red-500 hover:bg-red-50',
        overdueBg: 'bg-red-50 border-red-200',
        overdueText: 'text-red-600',
    },
};

const PlanDetail: React.FC<{
    progress: PlanProgress;
    onBack: () => void;
    onStop: () => void;
    onReadChapter: (book: string, chapter: number) => void;
}> = ({ progress, onBack, onStop, onReadChapter }) => {
    const { isDark, toggleTheme } = useTheme();
    const toggleMode = toggleTheme;
    const { plan, currentDay, totalDays, percentComplete, isTodayComplete, streak, isOverdue } = progress;
    const t = isDark ? T.dark : T.light;

    const currentDayRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const containerWidth = useContainerWidth(containerRef);

    // Responsive dimensions
    const isMobile = containerWidth < 400;
    const NODE_SPACING = isMobile ? 72 : 90;
    const WAVE_AMP = Math.min(containerWidth * 0.18, 70);
    const svgWidth = Math.min(containerWidth, 480);
    const centerX = svgWidth / 2;
    const totalHeight = (totalDays + 2) * NODE_SPACING;

    const dayNodes = useMemo(() => {
        const nodes = [];
        for (let d = 1; d <= totalDays; d++) {
            const readings = getReadingsForDay(plan, d);
            const allDone = readings.length > 0 && readings.every(r => isPlanReadingComplete(plan.id, r.book, r.chapter));
            nodes.push({ day: d, readings, isComplete: allDone, isCurrent: d === currentDay, isPast: d < currentDay, isMilestone: d === 1 || d === totalDays || d % 7 === 0 });
        }
        return nodes;
    }, [plan, currentDay, totalDays, progress]);

    useEffect(() => {
        setTimeout(() => { currentDayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 500);
    }, []);

    const formatDayLabel = (readings: DailyReading[]) => {
        if (readings.length === 0) return 'Poilsis';
        const books = [...new Set(readings.map(r => r.book))];
        if (books.length === 1) {
            const chs = readings.map(r => r.chapter + 1);
            return chs.length === 1 ? `${books[0]} ${chs[0]}` : `${books[0]} ${Math.min(...chs)}–${Math.max(...chs)}`;
        }
        return books[0];
    };

    const getPos = useCallback((idx: number) => ({
        y: (idx + 1) * NODE_SPACING,
        x: centerX + Math.sin(idx * 0.45 + 0.5) * WAVE_AMP,
    }), [NODE_SPACING, WAVE_AMP, centerX]);

    const pathD = useMemo(() => {
        if (totalDays === 0) return '';
        const pts = Array.from({ length: totalDays }, (_, i) => getPos(i));
        let d = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 1; i < pts.length; i++) {
            const prev = pts[i - 1]; const curr = pts[i];
            d += ` C ${prev.x} ${prev.y + NODE_SPACING * 0.5}, ${curr.x} ${curr.y - NODE_SPACING * 0.5}, ${curr.x} ${curr.y}`;
        }
        const last = pts[pts.length - 1];
        const trophyY = last.y + NODE_SPACING;
        d += ` C ${last.x} ${last.y + NODE_SPACING * 0.5}, ${centerX} ${trophyY - NODE_SPACING * 0.5}, ${centerX} ${trophyY}`;
        return d;
    }, [totalDays, getPos, NODE_SPACING, centerX]);

    const progressFraction = Math.min(currentDay / totalDays, 1);

    // Node sizes responsive
    const nodeSize = (node: typeof dayNodes[0]) => {
        if (node.isCurrent) return isMobile ? 60 : 72;
        if (node.isMilestone) return isMobile ? 40 : 48;
        if (node.isComplete) return isMobile ? 36 : 44;
        return isMobile ? 28 : 36;
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
            className="relative min-h-screen overflow-hidden" style={{ background: t.bg }}>

            {/* BG: Spotlight */}
            <div className="absolute inset-0" style={{ background: t.spotlight }} />

            {/* BG: Floating Saints */}
            <FloatingSaints isDark={isDark} />

            {/* BG: Optional User Image */}
            <div className={`absolute inset-0 z-0 ${isDark ? 'opacity-15 mix-blend-soft-light' : 'opacity-10 mix-blend-multiply'}`}>
                <img src="/images/jesus_bg.jpg" alt="" className="w-full h-full object-cover grayscale"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>

            {/* BG: Cross Watermark */}
            <div className={`absolute top-28 left-1/2 -translate-x-1/2 ${isDark ? 'opacity-[0.03]' : 'opacity-[0.04]'} pointer-events-none select-none z-0`}>
                <svg width="250" height="380" viewBox="0 0 100 150">
                    <path d="M50 10 L50 140 M20 45 L80 45" stroke={isDark ? 'white' : '#78350f'} strokeWidth="1.5" fill="none" />
                </svg>
            </div>

            {/* === HEADER === */}
            <div className={`relative z-30 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 backdrop-blur-xl ${t.headerBg} border-b ${t.headerBorder} sticky top-0`}>
                <button onClick={onBack} className={`p-1.5 sm:p-2 rounded-xl ${t.textSecondary} hover:${t.textPrimary} hover:bg-white/10 active:scale-95 transition-all`}>
                    <ArrowLeft size={isMobile ? 18 : 20} />
                </button>
                <span className="text-xl sm:text-2xl flex-shrink-0">{plan.icon}</span>
                <div className="flex-1 min-w-0">
                    <h2 className={`font-cinzel font-bold text-sm sm:text-base ${t.textPrimary} truncate tracking-wide`}>{plan.name}</h2>
                    <div className={`flex items-center gap-1.5 text-[10px] sm:text-[11px] ${t.textMuted}`}>
                        <span className={`${t.textGold} font-bold tabular-nums`}>{currentDay}</span>
                        <span>/</span><span>{totalDays} d.</span>
                        <span className="mx-0.5 opacity-30">|</span>
                        <span className={`${t.textGold} font-bold tabular-nums`}>{percentComplete}%</span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    {/* Theme Toggle */}
                    <button onClick={toggleMode}
                        className={`p-1.5 sm:p-2 rounded-full transition-all ${isDark ? 'text-amber-400 hover:bg-amber-500/10' : 'text-amber-700 hover:bg-amber-100'}`}
                        title={isDark ? 'Šviesus režimas' : 'Tamsus režimas'}>
                        {isDark ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                    {streak > 0 && (
                        <div className={`flex items-center gap-1 ${isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-100 border-amber-200'} border px-2 py-1 rounded-full`}>
                            <Flame size={13} className="text-amber-500 fill-amber-400" />
                            <span className={`text-[11px] font-bold tabular-nums ${t.textGold}`}>{streak}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* === PROGRESS BAR === */}
            <div className="relative z-20 px-3 sm:px-4 py-2.5">
                <div className={`h-1.5 ${t.progressBg} rounded-full overflow-hidden`}>
                    <motion.div className="h-full rounded-full"
                        style={{ background: isDark ? 'linear-gradient(90deg, #f59e0b, #fbbf24, #fde68a)' : 'linear-gradient(90deg, #92400e, #b45309, #d97706)' }}
                        initial={{ width: 0 }} animate={{ width: `${Math.max(percentComplete, 2)}%` }} transition={{ duration: 1.5, ease: 'easeOut' }} />
                </div>
            </div>

            {isOverdue && (
                <div className={`relative z-20 mx-3 sm:mx-4 mt-1 ${t.overdueBg} border rounded-xl p-2.5 sm:p-3 flex items-center gap-2.5 backdrop-blur-sm`}>
                    <Clock size={14} className="text-red-400 flex-shrink-0" />
                    <p className={`text-xs ${t.overdueText}`}>Ugnis užgeso. Skaitykite šiandien!</p>
                </div>
            )}

            {/* ====== THE GOLDEN PATH ====== */}
            <div className="relative z-10 w-full py-4 sm:py-6" ref={containerRef}>
                <div className="relative mx-auto" style={{ width: svgWidth, height: totalHeight }}>

                    <svg className="absolute top-0 left-0" width={svgWidth} height={totalHeight} style={{ pointerEvents: 'none' }}>
                        <defs>
                            <filter id="goldGlow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation={isDark ? '6' : '3'} result="blur" />
                                <feFlood floodColor={t.pathColorLit} floodOpacity={isDark ? '0.4' : '0.25'} result="color" />
                                <feComposite in="color" in2="blur" operator="in" result="glow" />
                                <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                            <linearGradient id="pathLit" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset={`${progressFraction * 100}%`} stopColor={t.pathColorLit} />
                                <stop offset={`${progressFraction * 100 + 2}%`} stopColor={t.pathColorBg} />
                            </linearGradient>
                        </defs>
                        {/* Background path */}
                        <path d={pathD} fill="none" stroke={t.pathColorBg} strokeWidth={isMobile ? 5 : 6} strokeLinecap="round" />
                        {/* Lit path */}
                        <path d={pathD} fill="none" stroke="url(#pathLit)" strokeWidth={isMobile ? 3 : 4} strokeLinecap="round" filter="url(#goldGlow)" />
                    </svg>

                    {/* === NODES === */}
                    {dayNodes.map((node, i) => {
                        const pos = getPos(i);
                        const isLeft = pos.x < centerX;
                        const sz = nodeSize(node);

                        return (
                            <div key={node.day} ref={node.isCurrent ? currentDayRef : undefined}
                                className="absolute" style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)', zIndex: node.isCurrent ? 25 : 10 }}>
                                <motion.button
                                    onClick={() => { if (node.readings.length > 0 && (node.isComplete || node.isPast || node.isCurrent)) onReadChapter(node.readings[0].book, node.readings[0].chapter); }}
                                    whileHover={(node.isCurrent || node.isComplete || node.isPast) ? { scale: 1.12 } : {}}
                                    whileTap={(node.isCurrent || node.isComplete || node.isPast) ? { scale: 0.95 } : {}}
                                    className="relative flex items-center justify-center rounded-full"
                                    style={{ width: sz, height: sz }}>

                                    {node.isCurrent && (
                                        <>
                                            <motion.div className="absolute inset-[-6px] sm:inset-[-8px] rounded-full"
                                                style={{ background: `radial-gradient(circle, ${isDark ? 'rgba(251,191,36,0.3)' : 'rgba(180,83,9,0.15)'} 0%, transparent 70%)` }}
                                                animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.2, 0.6] }}
                                                transition={{ duration: 2.5, repeat: Infinity }} />
                                            <motion.div className={`absolute inset-[-3px] sm:inset-[-4px] rounded-full border-2 ${isDark ? 'border-amber-400/40' : 'border-amber-600/30'}`}
                                                animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 3, repeat: Infinity }} />
                                        </>
                                    )}

                                    <div className={`w-full h-full rounded-full flex items-center justify-center ${node.isCurrent ? `${t.nodeCurrent} shadow-[0_0_25px_rgba(251,191,36,${isDark ? '0.5' : '0.3'})]`
                                        : node.isComplete ? `${t.nodeDone} shadow-[0_0_10px_rgba(251,191,36,${isDark ? '0.15' : '0.1'})]`
                                            : node.isMilestone ? t.nodeMilestone
                                                : t.nodeFuture
                                        }`}>
                                        {node.isCurrent ? <Sparkles size={isMobile ? 18 : 22} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                            : node.isComplete ? <CheckCircle size={node.isMilestone ? (isMobile ? 16 : 20) : (isMobile ? 14 : 16)} className={isDark ? 'text-amber-200/90' : 'text-amber-100'} />
                                                : node.isMilestone ? <Star size={isMobile ? 12 : 14} className={isDark ? 'text-slate-500' : 'text-stone-400'} />
                                                    : <div className={`w-1.5 h-1.5 ${isDark ? 'bg-slate-600' : 'bg-stone-400'} rounded-full`} />}
                                    </div>

                                    <div className={`absolute -bottom-2.5 sm:-bottom-3 left-1/2 -translate-x-1/2 px-1 sm:px-1.5 py-0.5 rounded text-[7px] sm:text-[8px] font-bold tabular-nums whitespace-nowrap ${node.isCurrent ? t.badgeCurrent : node.isComplete ? t.badgeDone : t.badgeFuture
                                        }`}>
                                        {node.isCurrent ? (isMobile ? '★' : 'ŠIANDIEN') : node.day}
                                    </div>
                                </motion.button>

                                {/* Label */}
                                <div className={`absolute top-1/2 -translate-y-1/2 ${isMobile ? 'w-20' : 'w-28'} pointer-events-none ${isLeft ? 'right-full mr-2 sm:mr-3 text-right' : 'left-full ml-2 sm:ml-3 text-left'}`}>
                                    <div className={`font-cinzel font-bold ${isMobile ? 'text-[9px]' : 'text-[11px]'} leading-tight tracking-wide ${node.isCurrent ? t.labelCurrent : node.isComplete ? t.labelDone : t.labelFuture
                                        }`}>
                                        {formatDayLabel(node.readings)}
                                    </div>
                                </div>

                                {/* Current day: readings card */}
                                {node.isCurrent && !isTodayComplete && node.readings.length > 0 && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                                        className={`absolute top-full mt-5 sm:mt-8 z-30 ${isMobile ? 'w-52 -translate-x-1/2 left-1/2' : 'w-60 -translate-x-1/2 left-1/2'}`}>
                                        <div className={`${t.cardBg} backdrop-blur-2xl border rounded-2xl p-3 sm:p-4 shadow-[0_15px_50px_rgba(0,0,0,${isDark ? '0.6' : '0.15'})]`}>
                                            <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 ${isDark ? 'bg-slate-900' : 'bg-white'} border-t border-l ${isDark ? 'border-amber-500/20' : 'border-amber-300/30'} transform rotate-45`} />
                                            <div className="relative z-10">
                                                <div className={`flex items-center justify-between mb-2.5 pb-2 border-b ${isDark ? 'border-white/5' : 'border-stone-200/50'}`}>
                                                    <span className={`text-[9px] uppercase font-bold ${t.textGold} tracking-[0.15em]`}>Šiandienos skaitiniai</span>
                                                    <Play size={10} className={t.textGold} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    {node.readings.map((r, ri) => {
                                                        const done = isPlanReadingComplete(plan.id, r.book, r.chapter);
                                                        return (
                                                            <button key={ri} onClick={(e) => { e.stopPropagation(); onReadChapter(r.book, r.chapter); }}
                                                                className={`w-full flex items-center gap-2 text-xs text-left rounded-lg px-2 py-1.5 ${isDark ? 'hover:bg-white/5' : 'hover:bg-amber-50'} transition-colors`}>
                                                                {done ? <CheckCircle size={13} className="text-emerald-400 flex-shrink-0" />
                                                                    : <Circle size={13} className={`${isDark ? 'text-amber-500/60' : 'text-amber-600/50'} flex-shrink-0`} />}
                                                                <span className={`truncate font-serif ${done ? `${isDark ? 'text-slate-500' : 'text-stone-400'} line-through` : isDark ? 'text-slate-200' : 'text-stone-700'}`}>
                                                                    {r.book} <span className={isDark ? 'text-slate-500' : 'text-stone-400'}>{r.chapter + 1}</span>
                                                                </span>
                                                                {!done && <ChevronRight size={12} className={`${isDark ? 'text-amber-500/40' : 'text-amber-600/30'} ml-auto flex-shrink-0`} />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        );
                    })}

                    {/* Trophy */}
                    <div className="absolute left-1/2 -translate-x-1/2" style={{ top: (totalDays + 1) * NODE_SPACING }}>
                        <motion.div className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} rounded-full flex items-center justify-center relative`}
                            style={{ background: `radial-gradient(circle, ${isDark ? 'rgba(251,191,36,0.15)' : 'rgba(180,83,9,0.08)'} 0%, transparent 70%)`, border: `1px solid ${isDark ? 'rgba(251,191,36,0.2)' : 'rgba(180,83,9,0.15)'}` }}
                            animate={{ boxShadow: isDark ? ['0 0 20px rgba(251,191,36,0.1)', '0 0 40px rgba(251,191,36,0.2)', '0 0 20px rgba(251,191,36,0.1)'] : ['0 0 15px rgba(180,83,9,0.05)', '0 0 30px rgba(180,83,9,0.1)', '0 0 15px rgba(180,83,9,0.05)'] }}
                            transition={{ duration: 4, repeat: Infinity }}>
                            <Award size={isMobile ? 26 : 32} className={isDark ? 'text-amber-500/70' : 'text-amber-700/60'} />
                        </motion.div>
                        <div className={`text-center mt-2 font-cinzel font-bold ${isDark ? 'text-amber-700/40' : 'text-amber-800/30'} text-[10px] tracking-[0.3em]`}>AMEN</div>
                    </div>
                </div>
            </div>

            <div className="h-24 sm:h-28" />

            {/* Stop Button (fixed bottom) */}
            <div className="fixed bottom-4 sm:bottom-6 left-0 right-0 flex justify-center z-40 pointer-events-none">
                <button onClick={() => { if (window.confirm('Nutraukti šį planą?')) onStop(); }}
                    className={`pointer-events-auto ${t.stopBtn} backdrop-blur-xl border px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-2xl text-[10px] sm:text-[11px] font-bold flex items-center gap-2 transition-all active:scale-95`}>
                    <Square size={9} className="fill-current" /> Nutraukti
                </button>
            </div>
        </motion.div>
    );
};

// ========================
// MAIN COMPONENT
// ========================
export const ReadingPlans: React.FC<ReadingPlansProps> = ({ onNavigateToChapter }) => {
    const [allProgress, setAllProgress] = useState<PlanProgress[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [readingChapter, setReadingChapter] = useState<{ planId: string; book: string; chapter: number } | null>(null);

    // Lifted Theme State
    const { isDark, toggleTheme } = useTheme();
    const toggleMode = toggleTheme;

    const refresh = useCallback(() => { setAllProgress(getAllPlanProgress()); }, []);
    useEffect(() => { refresh(); }, [refresh]);

    const handleStart = (planId: string) => { startPlan(planId); refresh(); window.dispatchEvent(new Event('bible-progress-update')); };
    const handleStop = (planId: string) => { stopPlan(planId); setSelectedPlanId(null); refresh(); window.dispatchEvent(new Event('bible-progress-update')); };
    const handleMarkComplete = (planId: string, book: string, chapter: number) => {
        markPlanReadingComplete(planId, book, chapter); markChapterComplete(book, chapter);
        refresh(); window.dispatchEvent(new Event('bible-progress-update'));
    };

    if (readingChapter) {
        const rc = readingChapter;
        return (
            <div className="max-w-3xl mx-auto h-full overflow-hidden">
                <AnimatePresence mode="wait">
                    <InlineReader key={`${rc.book}:${rc.chapter}`} planId={rc.planId} book={rc.book} chapter={rc.chapter}
                        isComplete={isPlanReadingComplete(rc.planId, rc.book, rc.chapter)}
                        onBack={() => { setReadingChapter(null); refresh(); }}
                        onComplete={() => handleMarkComplete(rc.planId, rc.book, rc.chapter)} />
                </AnimatePresence>
            </div>
        );
    }

    if (selectedPlanId) {
        const progress = getPlanProgressById(selectedPlanId);
        if (!progress) { setSelectedPlanId(null); return null; }
        return (
            <div className="w-full">
                <AnimatePresence mode="wait">
                    <PlanDetail key={selectedPlanId} progress={progress}
                        onBack={() => setSelectedPlanId(null)} onStop={() => handleStop(selectedPlanId)}
                        onReadChapter={(book, ch) => setReadingChapter({ planId: selectedPlanId, book, chapter: ch })}
                    />
                </AnimatePresence>
            </div>
        );
    }

    const activeProgressMap: Record<string, PlanProgress> = {};
    allProgress.forEach(p => { activeProgressMap[p.plan.id] = p; });

    return (
        <div className={`min-h-screen transition-colors duration-500 ${isDark ? 'bg-slate-950' : 'bg-stone-50'}`}>
            <div className="max-w-3xl mx-auto px-3 sm:px-4 py-6 sm:py-8 md:px-8 md:py-12">

                {/* Header with Toggle */}
                <div className="flex items-start justify-between mb-6 sm:mb-8">
                    <div className="flex-1 text-center pl-10"> {/* Center with offset for toggle */}
                        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl mb-3 shadow-sm border border-amber-200/50">
                            <Sparkles size={22} className="text-amber-700" />
                        </div>
                        <h2 className={`font-cinzel font-bold text-xl sm:text-2xl md:text-3xl mb-2 ${isDark ? 'text-white' : 'text-stone-900'}`}>Skaitymo Planai</h2>
                        <p className={`font-serif text-xs sm:text-sm max-w-sm mx-auto ${isDark ? 'text-slate-400' : 'text-stone-400'}`}>
                            Pasirinkite vieną ar kelis planus. Ugnis dega tik tiems, kas eina.
                        </p>
                    </div>

                    {/* Theme Toggle Button */}
                    <button onClick={toggleMode}
                        className={`p-2 rounded-full transition-all flex-shrink-0 ${isDark ? 'text-amber-400 hover:bg-white/10' : 'text-amber-700 hover:bg-amber-100'}`}
                        title={isDark ? 'Šviesus režimas' : 'Tamsus režimas'}>
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>

                {allProgress.length > 0 && (
                    <div className={`mb-4 sm:mb-6 rounded-xl p-3 sm:p-4 flex items-center justify-between border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gradient-to-r from-amber-50 to-stone-50 border-amber-200/50'}`}>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <Flame size={18} className="text-amber-500 fill-amber-400" />
                            <div>
                                <span className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-stone-800'}`}>
                                    {allProgress.length} {allProgress.length === 1 ? 'aktyvus planas' : 'aktyvūs planai'}
                                </span>
                                <span className={`text-[10px] sm:text-xs ml-1.5 sm:ml-2 ${isDark ? 'text-slate-400' : 'text-stone-400'}`}>
                                    {allProgress.reduce((sum, p) => sum + p.completedCount, 0)} sk.
                                </span>
                            </div>
                        </div>
                        {Math.max(...allProgress.map(p => p.streak)) > 0 && (
                            <div className="flex items-center gap-1 text-amber-600">
                                <Flame size={14} className="fill-amber-400" />
                                <span className="text-sm font-bold tabular-nums">{Math.max(...allProgress.map(p => p.streak))}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {READING_PLANS.map((plan, i) => (
                        <PlanCard key={plan.id} plan={plan} progress={activeProgressMap[plan.id] || null}
                            onStart={handleStart} onOpen={setSelectedPlanId} index={i} />
                    ))}
                </div>
            </div>
        </div>
    );
};
