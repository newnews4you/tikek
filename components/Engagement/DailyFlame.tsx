import React, { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { getBestStreak, hasActivePlan } from '../../services/plansService';

/**
 * DailyFlame — Best streak across all active plans.
 */
export const DailyFlame: React.FC = () => {
    const [streak, setStreak] = useState(0);
    const [hasReadToday, setHasReadToday] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    const refresh = () => {
        const active = hasActivePlan();
        setIsActive(active);
        if (active) {
            const best = getBestStreak();
            setStreak(best.streak);
            setHasReadToday(best.isTodayComplete);
        }
    };

    useEffect(() => { refresh(); }, []);

    useEffect(() => {
        const handleProgress = () => {
            refresh();
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 1500);
        };
        window.addEventListener('bible-progress-update', handleProgress);
        return () => window.removeEventListener('bible-progress-update', handleProgress);
    }, []);

    if (!isActive) return null;

    return (
        <div
            className="relative flex items-center gap-1.5 group cursor-default select-none"
            title={streak > 0 ? `${streak} d. be pertraukos` : 'Perskaitykite šiandienos skaitinį'}
        >
            <div className={`relative transition-all duration-500 ${hasReadToday ? 'text-amber-500' : 'text-stone-300'} ${isAnimating ? 'scale-125' : 'scale-100'}`}>
                {hasReadToday && (
                    <div className="absolute inset-0 blur-md bg-amber-400/40 rounded-full animate-pulse" />
                )}
                <Flame
                    size={20}
                    className={`relative z-10 transition-colors duration-500 ${hasReadToday
                        ? 'fill-amber-400 stroke-amber-600 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]'
                        : 'fill-none stroke-stone-400'
                        }`}
                    strokeWidth={2}
                />
            </div>

            {streak > 0 && (
                <span className={`text-xs font-bold tabular-nums transition-all duration-500 ${hasReadToday ? 'text-amber-700' : 'text-stone-400'} ${isAnimating ? 'scale-110' : 'scale-100'}`}>
                    {streak}
                </span>
            )}

            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-stone-900 text-amber-50 text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-xl z-50">
                {streak > 0 ? (
                    <>
                        <span className="font-bold">{streak} {streak === 1 ? 'diena' : streak < 10 ? 'dienos' : 'dienų'}</span>
                        <span className="text-stone-400 ml-1">be pertraukos</span>
                    </>
                ) : (
                    <span>Perskaitykite šiandienos skaitinį</span>
                )}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-stone-900 transform rotate-45 -mt-1" />
            </div>
        </div>
    );
};
