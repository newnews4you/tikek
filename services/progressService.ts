/**
 * Progress Service — "Spiritual Discipline"
 * Tracks Bible reading consistency (streaks), completed chapters,
 * and provides statistics for the engagement UI.
 *
 * All data persisted in localStorage (device-only).
 */

export interface ReadingEntry {
    book: string;
    chapter: number;
    date: string; // ISO date string (YYYY-MM-DD)
    timestamp: number;
}

export interface ProgressStats {
    streak: number;
    longestStreak: number;
    totalChaptersRead: number;
    todayChaptersRead: number;
    hasReadToday: boolean;
    completedBooks: string[];
    recentReadings: ReadingEntry[];
    consistency7Days: number; // 0-7, days read in last 7
}

const STORAGE_KEY = 'bible_reading_progress';
const STREAK_KEY = 'bible_reading_streak';

// --- Helpers ---

const getToday = (): string => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getYesterday = (): string => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getDateNDaysAgo = (n: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// --- Storage ---

const getReadingLog = (): ReadingEntry[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const saveReadingLog = (log: ReadingEntry[]): void => {
    try {
        // Keep last 500 entries max
        const trimmed = log.slice(-500);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
        console.error('Failed to save reading log:', e);
    }
};

interface StreakData {
    current: number;
    longest: number;
    lastDate: string;
}

const getStreakData = (): StreakData => {
    try {
        const raw = localStorage.getItem(STREAK_KEY);
        return raw ? JSON.parse(raw) : { current: 0, longest: 0, lastDate: '' };
    } catch {
        return { current: 0, longest: 0, lastDate: '' };
    }
};

const saveStreakData = (data: StreakData): void => {
    try {
        localStorage.setItem(STREAK_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save streak data:', e);
    }
};

// --- Core Functions ---

/**
 * Mark a chapter as read. Updates streak automatically.
 * Returns true if this is a NEW completion (not a duplicate).
 */
export const markChapterComplete = (book: string, chapter: number): boolean => {
    const log = getReadingLog();
    const today = getToday();

    // Check for duplicate (same book + chapter + date)
    const alreadyRead = log.some(
        e => e.book === book && e.chapter === chapter && e.date === today
    );

    if (alreadyRead) return false;

    // Record the reading
    log.push({
        book,
        chapter,
        date: today,
        timestamp: Date.now()
    });
    saveReadingLog(log);

    // Update streak
    updateStreak(today);

    return true;
};

/**
 * Update the daily streak.
 */
const updateStreak = (today: string): void => {
    const streak = getStreakData();
    const yesterday = getYesterday();

    if (streak.lastDate === today) {
        // Already counted today, no change
        return;
    }

    if (streak.lastDate === yesterday) {
        // Consecutive day — extend streak
        streak.current += 1;
    } else if (streak.lastDate === '') {
        // First ever reading
        streak.current = 1;
    } else {
        // Streak broken — start over
        streak.current = 1;
    }

    // Track longest
    if (streak.current > streak.longest) {
        streak.longest = streak.current;
    }

    streak.lastDate = today;
    saveStreakData(streak);
};

/**
 * Check streak on app load — silently resets if broken.
 */
export const checkStreak = (): void => {
    const streak = getStreakData();
    const today = getToday();
    const yesterday = getYesterday();

    // If last read was NOT today or yesterday, streak is broken
    if (streak.lastDate !== today && streak.lastDate !== yesterday) {
        if (streak.current > 0) {
            streak.current = 0;
            saveStreakData(streak);
        }
    }
};

/**
 * Get comprehensive reading statistics.
 */
export const getProgressStats = (): ProgressStats => {
    const log = getReadingLog();
    const streak = getStreakData();
    const today = getToday();

    // Today's readings
    const todayReadings = log.filter(e => e.date === today);

    // Completed books (all chapters read — simplified: just count unique books)
    const bookChapters: Record<string, Set<number>> = {};
    log.forEach(e => {
        if (!bookChapters[e.book]) bookChapters[e.book] = new Set();
        bookChapters[e.book].add(e.chapter);
    });

    // 7-day consistency
    const last7Days = new Set<string>();
    for (let i = 0; i < 7; i++) {
        const date = getDateNDaysAgo(i);
        if (log.some(e => e.date === date)) {
            last7Days.add(date);
        }
    }

    // Unique chapters total (deduplicated by book+chapter)
    const uniqueChapters = new Set(log.map(e => `${e.book}:${e.chapter}`));

    return {
        streak: streak.current,
        longestStreak: streak.longest,
        totalChaptersRead: uniqueChapters.size,
        todayChaptersRead: todayReadings.length,
        hasReadToday: todayReadings.length > 0,
        completedBooks: Object.keys(bookChapters),
        recentReadings: log.slice(-5).reverse(),
        consistency7Days: last7Days.size
    };
};

/**
 * Check if a specific chapter has been read.
 */
export const isChapterRead = (book: string, chapter: number): boolean => {
    const log = getReadingLog();
    return log.some(e => e.book === book && e.chapter === chapter);
};

/**
 * Get the daily streak count.
 */
export const getDailyStreak = (): number => {
    checkStreak(); // Ensure it's up to date
    return getStreakData().current;
};

/**
 * Clear all progress (for debugging/reset).
 */
export const clearProgress = (): void => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STREAK_KEY);
};
