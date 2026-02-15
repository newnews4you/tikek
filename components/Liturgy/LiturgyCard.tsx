import React from 'react';
import { LiturgyData, getLiturgicalColorCSS, getLiturgicalGradient } from '../../services/liturgyService';
import { Calendar, BookOpen, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface LiturgyCardProps {
    data: LiturgyData | null;
    onAskAboutGospel?: () => void;
    loading?: boolean;
    className?: string;
}

export const LiturgyCard: React.FC<LiturgyCardProps> = ({ data, onAskAboutGospel, loading, className = 'mb-6' }) => {
    const { isDark } = useTheme();

    if (loading) {
        return (
            <div className={`p-4 rounded-2xl border animate-pulse ${className} ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white/50 border-stone-200'}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-stone-200'}`}></div>
                    <div className="flex-1 space-y-2">
                        <div className={`h-4 rounded w-2/3 ${isDark ? 'bg-slate-800' : 'bg-stone-200'}`}></div>
                        <div className={`h-3 rounded w-1/2 ${isDark ? 'bg-slate-800' : 'bg-stone-200'}`}></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const borderColor = getLiturgicalColorCSS(data.color);
    const gradient = getLiturgicalGradient(data.color);

    return (
        <div
            className={`rounded-2xl backdrop-blur-sm shadow-lg overflow-hidden transition-all hover:shadow-xl hover:scale-[1.01] cursor-pointer group ${className}
                ${isDark ? 'bg-slate-900/90 border border-slate-800' : 'bg-white/80'}`}
            style={{
                borderLeft: `4px solid ${borderColor}`,
            }}
            onClick={onAskAboutGospel}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onAskAboutGospel?.()}
        >
            {/* Gradient accent bar */}
            <div
                className="h-1 w-full"
                style={{ background: gradient }}
            />

            <div className="p-4">
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
                            style={{ background: gradient }}
                        >
                            <Calendar size={20} />
                        </div>
                        <div>
                            <p className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-stone-800'}`}>
                                {data.weekday}, {data.dateFormatted}
                            </p>
                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                                {data.seasonLt} • <span style={{ color: borderColor }} className="font-medium">{data.colorLt}</span>
                            </p>
                        </div>
                    </div>

                    {/* Ask button hint */}
                    <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs px-2 py-1 rounded-full
                        ${isDark ? 'text-amber-400 bg-amber-900/30' : 'text-amber-700 bg-amber-50'}`}>
                        <BookOpen size={12} />
                        <span>Klausti</span>
                    </div>
                </div>

                {/* Saint or note */}
                {data.saintOfTheDay ? (
                    <div className={`flex items-start gap-2 p-2 rounded-lg border ${isDark ? 'bg-amber-900/10 border-amber-800/30' : 'bg-amber-50/50 border-amber-100'}`}>
                        <Sun size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className={`text-sm font-medium leading-snug ${isDark ? 'text-amber-500' : 'text-amber-900'}`}>
                            {data.saintOfTheDay}
                        </p>
                    </div>
                ) : data.note ? (
                    <p className={`text-xs italic pl-1 ${isDark ? 'text-slate-500' : 'text-stone-500'}`}>
                        {data.note}
                    </p>
                ) : null}

                {/* Gospel reference if available */}
                {data.gospelReference && (
                    <div className={`mt-2 flex items-center gap-2 text-xs ${isDark ? 'text-slate-500' : 'text-stone-600'}`}>
                        <BookOpen size={14} />
                        <span>{data.gospelTitle}: <strong>{data.gospelReference}</strong></span>
                    </div>
                )}
            </div>
        </div>
    );
};
