import { supabase } from './supabaseClient';

// Liturgy-related keywords — Q&A containing these should NOT be saved to shared memory
const LITURGY_KEYWORDS = ['šiandien', 'šiandieną', 'evangelij', 'skaitin', 'liturgi', 'dienos', 'sekmadienis', 'sekmadienio'];

// Simple cosine similarity
const cosineSimilarity = (a: number[], b: number[]): number => {
    if (a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const SIMILARITY_THRESHOLD = 0.85;

// In-memory cache of shared entries (loaded once per session)
let cachedEntries: { question: string; answer: string; embedding: number[] }[] | null = null;

/**
 * Load all shared memory entries from Supabase (cached per session)
 */
export const loadSharedMemory = async (): Promise<typeof cachedEntries> => {
    if (cachedEntries !== null) return cachedEntries;
    if (!supabase) { cachedEntries = []; return cachedEntries; }

    try {
        const { data, error } = await supabase
            .from('shared_memory')
            .select('question, answer, embedding')
            .order('usage_count', { ascending: false })
            .limit(500);

        if (error) {
            console.warn('Supabase load error:', error.message);
            cachedEntries = [];
        } else {
            cachedEntries = data || [];
            console.log(`☁️ Loaded ${cachedEntries.length} shared memory entries`);
        }
    } catch (e) {
        console.warn('Supabase load failed:', e);
        cachedEntries = [];
    }

    return cachedEntries;
};

/**
 * Find a similar answer in shared memory
 */
export const findSharedAnswer = async (queryEmbedding: number[]): Promise<{ answer: string; similarity: number; question: string } | null> => {
    const entries = await loadSharedMemory();
    if (!entries || entries.length === 0) return null;

    let bestMatch: typeof entries[0] | null = null;
    let maxSimilarity = -1;

    for (const entry of entries) {
        if (!entry.embedding || entry.embedding.length === 0) continue;
        const sim = cosineSimilarity(queryEmbedding, entry.embedding);
        if (sim > maxSimilarity) {
            maxSimilarity = sim;
            bestMatch = entry;
        }
    }

    if (bestMatch && maxSimilarity >= SIMILARITY_THRESHOLD) {
        return {
            answer: bestMatch.answer,
            similarity: maxSimilarity,
            question: bestMatch.question
        };
    }

    return null;
};

/**
 * Check if question is liturgy-related (should not be saved to shared memory)
 */
const isLiturgyRelated = (question: string): boolean => {
    const lower = question.toLowerCase();
    return LITURGY_KEYWORDS.some(kw => lower.includes(kw));
};

/**
 * Save a Q&A pair to shared Supabase memory
 */
export const saveToSharedMemory = async (question: string, answer: string, embedding: number[]) => {
    if (!supabase) return;

    // Don't save liturgy-related answers (they change daily)
    if (isLiturgyRelated(question)) {
        return;
    }

    // Don't save very short answers (probably errors)
    if (answer.length < 100) return;



    try {
        // Check for duplicate first
        const existing = await findSharedAnswer(embedding);
        if (existing && existing.similarity > 0.95) {
            return;
        }

        const { error } = await supabase
            .from('shared_memory')
            .insert({
                question,
                answer,
                embedding
            });

        if (error) {
            console.warn('Supabase save error:', error.message);
        } else {
            console.log('☁️ Saved to shared memory:', question.slice(0, 50));
            // Update local cache
            if (cachedEntries) {
                cachedEntries.push({ question, answer, embedding });
            }
        }
    } catch (e) {
        console.warn('Supabase save failed:', e);
    }
};
