import { recordTokenUsage } from './tokenTracking';
import { SEED_MEMORY } from '../data/seedMemory';

export interface QAPair {
    id: string;
    question: string;
    answer: string;
    embedding: number[];
    timestamp: number;
    source: 'user' | 'system'; // 'user' = learned from interaction, 'system' = pre-loaded
}

const MEMORY_KEY = 'gemini_vector_memory';
const SIMILARITY_THRESHOLD = 0.85; // High confidence required

// Simple cosine similarity calculator
const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
    if (vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const getVectorMemory = (): QAPair[] => {
    try {
        const stored = localStorage.getItem(MEMORY_KEY);
        let memory: QAPair[] = stored ? JSON.parse(stored) : [];

        // Simple merge of SEED_MEMORY if localStorage is empty or just to ensure we have them
        // For efficiency, we only check if memory is empty for now
        if (memory.length === 0 && SEED_MEMORY.length > 0) {
            console.log('🌱 Loading Seed Memory...', SEED_MEMORY.length);
            // Unique merge
            const existingIds = new Set(memory.map(m => m.id));
            const newSeeds = SEED_MEMORY.filter(s => !existingIds.has(s.id));
            memory = [...newSeeds, ...memory];
        }

        return memory;
    } catch (e) {
        console.error('Failed to load vector memory', e);
        return [];
    }
};

export const saveToMemory = (question: string, answer: string, embedding: number[]) => {
    try {
        const memory = getVectorMemory();

        // Check if similar question already exists to avoid duplicates
        const existing = findSimilarAnswer(embedding);
        if (existing && existing.similarity > 0.95) {
            console.log('Skipping duplicate memory save');
            return;
        }

        const newEntry: QAPair = {
            id: crypto.randomUUID(),
            question,
            answer,
            embedding,
            timestamp: Date.now(),
            source: 'user'
        };

        // Limit memory size (e.g., 500 entries)
        if (memory.length >= 500) {
            // Remove oldest 'user' entry, keep 'system' entries
            const userEntries = memory.filter(m => m.source === 'user').sort((a, b) => a.timestamp - b.timestamp);
            if (userEntries.length > 0) {
                const toRemove = userEntries[0];
                const index = memory.findIndex(m => m.id === toRemove.id);
                if (index > -1) memory.splice(index, 1);
            }
        }

        memory.push(newEntry);
        localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
        console.log('Saved to Smart Memory:', question);
    } catch (e) {
        console.error('Failed to save to memory', e);
    }
};

export const findSimilarAnswer = (queryEmbedding: number[]): { answer: string; similarity: number; question: string } | null => {
    const memory = getVectorMemory();
    if (memory.length === 0) return null;

    let bestMatch: QAPair | null = null;
    let maxSimilarity = -1;

    for (const entry of memory) {
        const similarity = cosineSimilarity(queryEmbedding, entry.embedding);
        if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
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

// Export memory for sharing
export const exportMemoryJSON = (): string => {
    const memory = getVectorMemory();
    return JSON.stringify(memory, null, 2);
};

// Import shared memory (merges with existing)
export const importMemoryJSON = (jsonString: string): number => {
    try {
        const imported: QAPair[] = JSON.parse(jsonString);
        const current = getVectorMemory();
        let addedCount = 0;

        for (const item of imported) {
            // Simple check by ID or Question text to avoid duplicates
            if (!current.some(c => c.question === item.question)) {
                current.push({ ...item, source: 'system' }); // Mark imported as system
                addedCount++;
            }
        }

        localStorage.setItem(MEMORY_KEY, JSON.stringify(current));
        return addedCount;
    } catch (e) {
        console.error('Failed to import memory', e);
        return 0;
    }
};
