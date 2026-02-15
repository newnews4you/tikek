/**
 * Plans Service — "Skaitymo Planai"
 * Supports MULTIPLE simultaneous reading plans.
 * Each plan has its own progress, streak, and completion state.
 */

// ========================
// TYPES
// ========================

export interface DailyReading {
    book: string;
    chapter: number; // 0-indexed
}

export interface ReadingPlanDefinition {
    id: string;
    name: string;
    description: string;
    durationDays: number;
    icon: string;
    color: string;
    readings: DailyReading[];
}

export interface ActivePlan {
    planId: string;
    startDate: string; // ISO YYYY-MM-DD
    completedReadings: string[]; // "book:chapter" keys
    streak: number;
    longestStreak: number;
    lastReadDate: string;
}

export interface PlanProgress {
    plan: ReadingPlanDefinition;
    active: ActivePlan;
    currentDay: number;
    totalDays: number;
    completedCount: number;
    totalReadings: number;
    remainingCount: number;
    percentComplete: number;
    todaysReadings: DailyReading[];
    isTodayComplete: boolean;
    streak: number;
    isOverdue: boolean;
}

// ========================
// PLAN DEFINITIONS
// ========================

function chaptersFor(book: string, count: number): DailyReading[] {
    return Array.from({ length: count }, (_, i) => ({ book, chapter: i }));
}

const gospelReadings: DailyReading[] = [
    ...chaptersFor('Evangelija pagal Matą', 28),
    ...chaptersFor('Evangelija pagal Morkų', 16),
    ...chaptersFor('Evangelija pagal Luką', 24),
    ...chaptersFor('Evangelija pagal Joną', 21),
];

const ntReadings: DailyReading[] = [
    ...chaptersFor('Evangelija pagal Matą', 28),
    ...chaptersFor('Evangelija pagal Morkų', 16),
    ...chaptersFor('Evangelija pagal Luką', 24),
    ...chaptersFor('Evangelija pagal Joną', 21),
    ...chaptersFor('Apaštalų darbai', 28),
    ...chaptersFor('Laiškas romiečiams', 16),
    ...chaptersFor('Pirmasis laiškas korintiečiams', 16),
    ...chaptersFor('Antrasis laiškas korintiečiams', 13),
    ...chaptersFor('Laiškas galatams', 6),
    ...chaptersFor('Laiškas efeziečiams', 6),
    ...chaptersFor('Laiškas filipiečiams', 4),
    ...chaptersFor('Laiškas kolosiečiams', 4),
    ...chaptersFor('Pirmasis laiškas tesalonikiečiams', 5),
    ...chaptersFor('Antrasis laiškas tesalonikiečiams', 3),
    ...chaptersFor('Pirmasis laiškas Timotiejui', 6),
    ...chaptersFor('Antrasis laiškas Timotiejui', 4),
    ...chaptersFor('Laiškas Titui', 3),
    ...chaptersFor('Laiškas Filemonui', 1),
    ...chaptersFor('Laiškas hebrajams', 13),
    ...chaptersFor('Jokūbo laiškas', 5),
    ...chaptersFor('Pirmasis Petro laiškas', 5),
    ...chaptersFor('Antrasis Petro laiškas', 3),
    ...chaptersFor('Pirmasis Jono laiškas', 5),
    ...chaptersFor('Antrasis Jono laiškas', 1),
    ...chaptersFor('Trečiasis Jono laiškas', 1),
    ...chaptersFor('Judo laiškas', 1),
    ...chaptersFor('Apreiškimas Jonui', 22),
];

const wisdomReadings: DailyReading[] = [
    ...chaptersFor('Patarlės', 31),
    ...chaptersFor('Ekleziasto knyga', 12),
    ...chaptersFor('Giesmių giesmė', 8),
];

const psalmReadings: DailyReading[] = [
    ...chaptersFor('Psalmės', 150),
];

export const READING_PLANS: ReadingPlanDefinition[] = [
    {
        id: 'gospels-40',
        name: 'Evangelijos Šviesa',
        description: 'Keturios Evangelijos per 40 dienų.',
        durationDays: 40,
        icon: '✝️',
        color: 'red',
        readings: gospelReadings,
    },
    {
        id: 'nt-90',
        name: 'Naujojo Testamento Kelionė',
        description: 'Visas Naujasis Testamentas per 90 dienų.',
        durationDays: 90,
        icon: '📖',
        color: 'indigo',
        readings: ntReadings,
    },
    {
        id: 'wisdom-30',
        name: 'Išminties Šaltiniai',
        description: 'Patarlės, Ekleziastas ir Giesmių Giesmė per 30 dienų.',
        durationDays: 30,
        icon: '🕊️',
        color: 'emerald',
        readings: wisdomReadings,
    },
    {
        id: 'psalms-60',
        name: 'Psalmyno Malda',
        description: '150 psalmių per 60 dienų.',
        durationDays: 60,
        icon: '🎵',
        color: 'amber',
        readings: psalmReadings,
    },
];

// ========================
// STORAGE (Multi-plan)
// ========================

const PLANS_KEY = 'bible_active_plans';

const getAllActivePlans = (): ActivePlan[] => {
    try {
        const raw = localStorage.getItem(PLANS_KEY);
        if (!raw) {
            // Migration: check old single-plan key
            const old = localStorage.getItem('bible_active_plan');
            if (old) {
                const parsed = JSON.parse(old);
                localStorage.setItem(PLANS_KEY, JSON.stringify([parsed]));
                localStorage.removeItem('bible_active_plan');
                return [parsed];
            }
            return [];
        }
        return JSON.parse(raw);
    } catch {
        return [];
    }
};

const saveAllActivePlans = (plans: ActivePlan[]): void => {
    try {
        localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
    } catch (e) {
        console.error('Failed to save plans:', e);
    }
};

// ========================
// HELPERS
// ========================

const getToday = (): string => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getYesterday = (): string => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const daysBetween = (dateA: string, dateB: string): number => {
    const a = new Date(dateA);
    const b = new Date(dateB);
    return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
};

export const getReadingsForDay = (plan: ReadingPlanDefinition, dayNumber: number): DailyReading[] => {
    const totalReadings = plan.readings.length;
    const totalDays = plan.durationDays;
    const perDay = totalReadings / totalDays;
    const startIdx = Math.floor((dayNumber - 1) * perDay);
    const endIdx = Math.floor(dayNumber * perDay);
    return plan.readings.slice(startIdx, endIdx);
};

// ========================
// PUBLIC API
// ========================

/** Start a new plan (can have multiple). */
export const startPlan = (planId: string): void => {
    const plans = getAllActivePlans();
    // Don't allow duplicate
    if (plans.some(p => p.planId === planId)) return;

    plans.push({
        planId,
        startDate: getToday(),
        completedReadings: [],
        streak: 0,
        longestStreak: 0,
        lastReadDate: '',
    });
    saveAllActivePlans(plans);
};

/** Stop a specific plan by ID. */
export const stopPlan = (planId?: string): void => {
    if (!planId) {
        // Legacy: stop all
        saveAllActivePlans([]);
        return;
    }
    const plans = getAllActivePlans().filter(p => p.planId !== planId);
    saveAllActivePlans(plans);
};

/** Check if any plan is active. */
export const hasActivePlan = (): boolean => {
    return getAllActivePlans().length > 0;
};

/** Check if a specific plan is active. */
export const isPlanActive = (planId: string): boolean => {
    return getAllActivePlans().some(p => p.planId === planId);
};

/** Get IDs of all active plans. */
export const getActivePlanIds = (): string[] => {
    return getAllActivePlans().map(p => p.planId);
};

/** Mark a reading complete for a specific plan. */
export const markPlanReadingComplete = (planId: string, book: string, chapter: number): boolean => {
    const plans = getAllActivePlans();
    const plan = plans.find(p => p.planId === planId);
    if (!plan) return false;

    const key = `${book}:${chapter}`;
    if (plan.completedReadings.includes(key)) return false;

    plan.completedReadings.push(key);

    const today = getToday();
    const yesterday = getYesterday();

    if (plan.lastReadDate !== today) {
        if (plan.lastReadDate === yesterday || plan.lastReadDate === '') {
            plan.streak = (plan.streak || 0) + 1;
        } else {
            plan.streak = 1;
        }
        plan.lastReadDate = today;
    }

    if (plan.streak > (plan.longestStreak || 0)) {
        plan.longestStreak = plan.streak;
    }

    saveAllActivePlans(plans);
    return true;
};

/** Check if a reading is complete in a specific plan. */
export const isPlanReadingComplete = (planId: string, book: string, chapter: number): boolean => {
    const plan = getAllActivePlans().find(p => p.planId === planId);
    if (!plan) return false;
    return plan.completedReadings.includes(`${book}:${chapter}`);
};

/** Get progress for a specific plan. */
export const getPlanProgressById = (planId: string): PlanProgress | null => {
    const active = getAllActivePlans().find(p => p.planId === planId);
    if (!active) return null;

    const planDef = READING_PLANS.find(p => p.id === planId);
    if (!planDef) return null;

    const today = getToday();
    const currentDay = Math.max(1, daysBetween(active.startDate, today) + 1);
    const clampedDay = Math.min(currentDay, planDef.durationDays);

    const todaysReadings = getReadingsForDay(planDef, clampedDay);
    const todayKeys = todaysReadings.map(r => `${r.book}:${r.chapter}`);
    const isTodayComplete = todayKeys.every(k => active.completedReadings.includes(k));

    const yesterday = getYesterday();
    const isOverdue = active.lastReadDate !== today && active.lastReadDate !== yesterday && active.lastReadDate !== '';

    if (isOverdue && active.streak > 0) {
        const plans = getAllActivePlans();
        const p = plans.find(pp => pp.planId === planId);
        if (p) {
            p.streak = 0;
            saveAllActivePlans(plans);
        }
    }

    const completedCount = active.completedReadings.length;

    return {
        plan: planDef,
        active,
        currentDay: clampedDay,
        totalDays: planDef.durationDays,
        completedCount,
        totalReadings: planDef.readings.length,
        remainingCount: planDef.readings.length - completedCount,
        percentComplete: Math.round((completedCount / planDef.readings.length) * 100),
        todaysReadings,
        isTodayComplete,
        streak: isOverdue ? 0 : active.streak,
        isOverdue,
    };
};

/** Get progress for ALL active plans. */
export const getAllPlanProgress = (): PlanProgress[] => {
    return getAllActivePlans()
        .map(a => getPlanProgressById(a.planId))
        .filter((p): p is PlanProgress => p !== null);
};

/** Get the best streak across all plans (for DailyFlame). */
export const getBestStreak = (): { streak: number; isTodayComplete: boolean } => {
    const all = getAllPlanProgress();
    if (all.length === 0) return { streak: 0, isTodayComplete: false };

    const bestStreak = Math.max(...all.map(p => p.streak));
    const anyTodayComplete = all.some(p => p.isTodayComplete);
    return { streak: bestStreak, isTodayComplete: anyTodayComplete };
};

// Legacy compat
export const getPlanProgress = (): PlanProgress | null => {
    const all = getAllPlanProgress();
    return all.length > 0 ? all[0] : null;
};
