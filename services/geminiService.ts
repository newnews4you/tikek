import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';
import { semanticSearch, SearchResult } from './semanticSearch';
import { getKnowledgeBase } from '../data/knowledgeBase';
import { recordTokenUsage } from './tokenTracking';
import { LiturgyData } from './liturgyService';
import { findSimilarAnswer, saveToMemory } from './vectorMemory';
import { findSharedAnswer, saveToSharedMemory } from './supabaseMemory';

const EMBEDDING_CACHE_KEY = 'gemini_embedding_cache';
const RESPONSE_CACHE_KEY = 'gemini_response_cache';
const RESPONSE_CACHE_TTL = 1000 * 60 * 60; // 1 hour TTL
const MAX_RESPONSE_CACHE_ENTRIES = 100;
const MAX_HISTORY_TURNS = 8; // Keep last 8 messages to reduce input tokens

interface EmbeddingCache {
  [query: string]: number[];
}

interface ResponseCacheEntry {
  response: string;
  timestamp: number;
}
interface ResponseCache {
  [key: string]: ResponseCacheEntry;
}

const getCachedEmbedding = (text: string): number[] | null => {
  try {
    const cache: EmbeddingCache = JSON.parse(localStorage.getItem(EMBEDDING_CACHE_KEY) || '{}');
    return cache[text] || null;
  } catch (e) {
    return null;
  }
};

const cacheEmbedding = (text: string, embedding: number[]) => {
  try {
    const cache: EmbeddingCache = JSON.parse(localStorage.getItem(EMBEDDING_CACHE_KEY) || '{}');
    // Limit cache size to prevent localStorage overflow (approx 500 entries)
    const keys = Object.keys(cache);
    if (keys.length > 500) {
      delete cache[keys[0]]; // Remove oldest (not essentially LRU but simple FIFO-ish by key order)
    }
    cache[text] = embedding;
    localStorage.setItem(EMBEDDING_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('Failed to cache embedding', e);
  }
};

let client: GoogleGenAI | null = null;

const getClient = (): GoogleGenAI => {
  if (!client) {
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("API_KEY environment variable is not set");
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
};

const GEMINI_MODEL = 'gemini-2.5-flash';

/**
 * Simple hash for cache keys
 */
const hashString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
};

/**
 * Get cached response if available and not expired
 */
const getCachedResponse = (query: string, liturgyDate?: string): string | null => {
  try {
    const cache: ResponseCache = JSON.parse(localStorage.getItem(RESPONSE_CACHE_KEY) || '{}');
    const key = hashString(query + (liturgyDate || ''));
    const entry = cache[key];
    if (entry && (Date.now() - entry.timestamp) < RESPONSE_CACHE_TTL) {
      console.log('✅ Response cache HIT');
      recordTokenUsage(0, 0, 'RESPONSE CACHE HIT: ' + query.slice(0, 30), 'cache');
      return entry.response;
    }
  } catch (e) { /* ignore */ }
  return null;
};

/**
 * Store response in cache
 */
const cacheResponse = (query: string, response: string, liturgyDate?: string): void => {
  try {
    const cache: ResponseCache = JSON.parse(localStorage.getItem(RESPONSE_CACHE_KEY) || '{}');
    const key = hashString(query + (liturgyDate || ''));
    // Evict oldest entries if cache is full
    const keys = Object.keys(cache);
    if (keys.length >= MAX_RESPONSE_CACHE_ENTRIES) {
      // Remove oldest entry
      let oldestKey = keys[0];
      let oldestTime = cache[keys[0]].timestamp;
      for (const k of keys) {
        if (cache[k].timestamp < oldestTime) {
          oldestTime = cache[k].timestamp;
          oldestKey = k;
        }
      }
      delete cache[oldestKey];
    }
    cache[key] = { response, timestamp: Date.now() };
    localStorage.setItem(RESPONSE_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('Failed to cache response', e);
  }
};

export const sendMessageStream = async (
  history: { role: string; parts: { text?: string; inlineData?: any }[] }[],
  currentMessage: string,
  imageData?: string,
  mimeType: string = 'image/jpeg',
  liturgyContext?: LiturgyData | null
) => {
  // 1. Static Greeting (Zero Cost)
  const GREETING_RESPONSES: Record<string, string> = {
    'labas': 'Šlovė Jėzui Kristui! 🙏 Kuo galiu padėti?\n\n|||SUGGESTIONS: Kas yra Rožinis?|Kokia šiandien Evangelija?|Papasakok apie Mergelę Mariją|||',
    'sveikas': 'Šlovė Jėzui Kristui! 🙏 Kuo galiu padėti?\n\n|||SUGGESTIONS: Kas yra Rožinis?|Kokia šiandien Evangelija?|Papasakok apie Mergelę Mariją|||',
    'sveiki': 'Šlovė Jėzui Kristui! 🙏 Kuo galiu padėti?\n\n|||SUGGESTIONS: Kas yra Rožinis?|Kokia šiandien Evangelija?|Papasakok apie Mergelę Mariją|||',
    'ačiū': 'Prašom! Tegul Dievas laimina! 🙏 Jei turite daugiau klausimų, drąsiai klauskite.',
    'aciu': 'Prašom! Tegul Dievas laimina! 🙏 Jei turite daugiau klausimų, drąsiai klauskite.',
    'dekui': 'Prašom! Tegul Dievas laimina! 🙏 Jei turite daugiau klausimų, drąsiai klauskite.',
    'dėkui': 'Prašom! Tegul Dievas laimina! 🙏 Jei turite daugiau klausimų, drąsiai klauskite.',
  };

  const normalizedMsg = currentMessage.trim().toLowerCase().replace(/[!?.,:;]+$/g, '');
  const msgLower = currentMessage.toLowerCase();
  const greetingResponse = GREETING_RESPONSES[normalizedMsg];

  if (greetingResponse && !imageData) {
    recordTokenUsage(0, 0, 'STATIC: ' + currentMessage, 'static');
    let done = false;
    return {
      next: async () => {
        if (!done) { done = true; return { value: { text: greetingResponse }, done: false }; }
        return { value: undefined, done: true };
      },
      [Symbol.asyncIterator]() { return this; }
    };
  }

  // 2. Generate Embedding (Low Cost) - Needed for Smart Memory & RAG
  let queryEmbedding: number[] | null = null;
  if (!imageData) {
    try {
      // Check embedding cache first
      const cachedEmb = getCachedEmbedding(currentMessage);
      if (cachedEmb) {
        queryEmbedding = cachedEmb;
        recordTokenUsage(0, 0, 'CACHE HIT: ' + currentMessage, 'embedding-cache');
      } else {
        queryEmbedding = await getEmbeddings(currentMessage);
        if (queryEmbedding) cacheEmbedding(currentMessage, queryEmbedding);
      }
    } catch (e) {
      console.warn('Embedding generation failed', e);
    }
  }

  // 3. Smart Memory & Cache Retrieval (Context Injection)
  let retrievedContext = '';

  // 3a. Supabase Shared Memory
  if (queryEmbedding && !imageData) {
    try {
      const sharedMatch = await findSharedAnswer(queryEmbedding);
      if (sharedMatch && sharedMatch.similarity > 0.85) {
        retrievedContext = `FOUND VALUABLE MEMORY (Shared): "${sharedMatch.answer}"`;
      }
    } catch (e) {
      console.warn('Shared memory check failed', e);
    }
  }

  // 3b. Local Vector Memory (only if no shared context or to augment)
  if (queryEmbedding && !imageData && !retrievedContext) {
    const memoryMatch = findSimilarAnswer(queryEmbedding);
    if (memoryMatch && memoryMatch.similarity > 0.85) {
      retrievedContext = `FOUND VALUABLE MEMORY (Local): "${memoryMatch.answer}"`;

      // Sync to Supabase if missing (Background)
      saveToSharedMemory(currentMessage, memoryMatch.answer, queryEmbedding).catch(() => { });
    }
  }

  // 4. Exact Match Cache (Context)
  const cachedResponse = getCachedResponse(currentMessage, liturgyContext?.date);
  if (!imageData && cachedResponse && !retrievedContext) {
    retrievedContext = `FOUND PREVIOUS ANSWER: "${cachedResponse}"`;
  }

  if (retrievedContext) {
    // Inject instruction to use this context but rephrase
    retrievedContext = `\n[SYSTEM: I found a relevant answer in my memory. Use it as the primary source of truth, but REPHRASE it slightly to sound fresh and natural. Do not say "I found this in memory". Just answer.]\n${retrievedContext}\n`;
  }

  const ai = getClient();

  // 5. Dynamic RAG — Query Classification & Semantic Search
  // 5a. Classify query: skip RAG for casual/short messages (saves embedding + search tokens)
  const CASUAL_WORDS = ['labas', 'sveikas', 'sveiki', 'ačiū', 'aciu', 'dekui', 'dėkui', 'kaip sekasi',
    'kaip laikaisi', 'taip', 'ne', 'gerai', 'ok', 'supratau', 'aisku', 'aišku', 'jo', 'nu'];
  const THEOLOGICAL_KEYWORDS = ['bibli', 'diev', 'jėzu', 'jezu', 'kristus', 'bažnyči', 'baznyci',
    'nuodėm', 'nuodem', 'sakrament', 'malda', 'mald', 'rožin', 'rozin', 'švent', 'svent',
    'katekizm', 'enciklik', 'popiežiu', 'popieziu', 'evangeli', 'psalm', 'apaštal', 'apasal',
    'tikėjim', 'tikejim', 'išpažint', 'ispazint', 'komunij', 'krikšt', 'krikst', 'sutvirtini',
    'santuok', 'kunig', 'vyskup', 'marij', 'trejyb', 'prisikėli', 'prisikeli', 'dangus',
    'pragaras', 'skaistykl', 'angelai', 'angel', 'velnias', 'velni'];

  const isCasualQuery = currentMessage.trim().length < 15 ||
    CASUAL_WORDS.some(w => normalizedMsg === w) ||
    (!currentMessage.includes('?') && currentMessage.trim().length < 25 &&
      !THEOLOGICAL_KEYWORDS.some(kw => msgLower.includes(kw)));

  // 5b. Context Discounting: skip RAG if memory already has a good answer
  const hasMemoryContext = !!retrievedContext;

  const shouldRunRAG = !isCasualQuery && !hasMemoryContext && !imageData;

  let retrievedContextFromRAG = "";

  if (shouldRunRAG) {
    const knowledgeBase = getKnowledgeBase();
    let searchResults = semanticSearch(knowledgeBase, {
      query: currentMessage,
      limit: 5,
      fuzzyMatch: true,
      includeContext: false,
      queryEmbedding: queryEmbedding || undefined
    });

    // 5c. Score Threshold: only inject context if results are actually relevant
    const relevantResults = searchResults.filter(r => r.score > 50);

    if (relevantResults.length > 0) {
      retrievedContextFromRAG = "### AUTENTIŠKI ŠALTINIAI ATSAKYMUI (NAUDOTI ŠIUOS TEKSTUS) ###\n";
      // Prioritize Bible AND Catechism: try to get one of each for balanced view
      const bibleChunk = relevantResults.find(r => r.source === 'Biblija' || r.source === 'Šventasis Raštas');
      const catechismChunk = relevantResults.find(r => r.source.includes('Katekizmas') || r.source.includes('KBK'));

      let topChunks = [];

      // Logic: 
      // 1. If we have both, take 1 Bible + 1 Catechism
      // 2. If we have only Bible, take 2 Bible (or 1 Bible + 1 other)
      // 3. If we have only Catechism, take 2 Catechism (or 1 Catechism + 1 other)

      if (bibleChunk && catechismChunk) {
        topChunks.push(bibleChunk);
        topChunks.push(catechismChunk);
      } else if (bibleChunk) {
        topChunks.push(bibleChunk);
        // Fill second slot with next best non-duplicate
        const nextBest = relevantResults.find(r => r !== bibleChunk);
        if (nextBest) topChunks.push(nextBest);
      } else if (catechismChunk) {
        topChunks.push(catechismChunk);
        // Fill second slot with next best non-duplicate
        const nextBest = relevantResults.find(r => r !== catechismChunk);
        if (nextBest) topChunks.push(nextBest);
      } else {
        // Fallback: just top 2
        topChunks = relevantResults.slice(0, 2);
      }

      const uniqueResults = topChunks.filter((value, index, self) =>
        index === self.findIndex((t) => t.content === value.content)
      );

      uniqueResults.forEach(result => {
        const text = result.content.length > 600 ? result.content.slice(0, 600) + '...' : result.content;
        retrievedContextFromRAG += `--- ŠALTINIS: ${result.bookOrSection} (${result.chapterOrRef}) ---\n${text}\n\n`;
      });
      retrievedContextFromRAG += "### ŠALTINIŲ PABAIGA ###\n";
    } else {
      console.log('🔇 Dynamic RAG: No relevant results (all scores < 50), skipping context injection');
    }
  } else {
    console.log(`🔇 Dynamic RAG: Skipped (casual=${isCasualQuery}, hasMemory=${hasMemoryContext}, image=${!!imageData})`);
  }

  let finalSystemInstruction = SYSTEM_INSTRUCTION;

  // Add Liturgy Context (Conditional)
  const LITURGY_KEYWORDS = ['šiandien', 'šiandieną', 'evangelij', 'skaitin', 'švent', 'liturgi', 'dienos', 'sekmadienis', 'sekmadienio'];
  const isLiturgyRelevant = LITURGY_KEYWORDS.some(kw => msgLower.includes(kw));

  if (retrievedContext) {
    finalSystemInstruction += retrievedContext;
  }

  if (liturgyContext && isLiturgyRelevant) {
    const liturgyPrompt = `\nLITURGIJA (${liturgyContext.date}): ${liturgyContext.seasonLt}, ${liturgyContext.colorLt}${liturgyContext.saintOfTheDay ? ', ' + liturgyContext.saintOfTheDay : ''}${liturgyContext.gospelReference ? ', Evangelija: ' + liturgyContext.gospelReference : ''}.`;
    finalSystemInstruction += liturgyPrompt;
  }

  if (retrievedContextFromRAG) {
    finalSystemInstruction += `\n\nNaudok šiuos šaltinius kaip tiesos pagrindą. Jei trūksta – naudok bendrąsias žinias, bet NESAKYK "šaltiniuose nėra".\n${retrievedContextFromRAG}\nAtsakyk glaustai ir konkrečiai.`;
  }

  const newParts: any[] = [{ text: currentMessage }];
  if (imageData) {
    const cleanBase64 = imageData.split(',')[1] || imageData;
    newParts.unshift({
      inlineData: {
        mimeType: mimeType,
        data: cleanBase64
      }
    });
  }

  // History Truncation
  const truncatedHistory = history.slice(-MAX_HISTORY_TURNS);
  const textOnlyHistory = truncatedHistory.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: msg.parts.filter(p => p.text).map(p => ({ text: p.text as string })),
  }));

  // 6. Generate Response
  const chat = ai.chats.create({
    model: GEMINI_MODEL,
    config: {
      systemInstruction: finalSystemInstruction,
      temperature: 0.2,
    },
    history: textOnlyHistory,
  });

  const stream = await chat.sendMessageStream({
    message: newParts.length > 1 ? newParts : currentMessage
  });

  // Track & Save
  const originalNext = stream.next.bind(stream);
  let totalOutputTokens = 0;
  let fullResponseText = '';

  const trackedStream = {
    ...stream,
    next: async () => {
      const result = await originalNext();
      if (result.done) {
        const estimatedInputTokens = Math.ceil(
          (finalSystemInstruction.length + currentMessage.length) / 4
        );
        recordTokenUsage(estimatedInputTokens, totalOutputTokens, currentMessage, GEMINI_MODEL);

        // Save to Smart Vector Memory & Cache
        if (!imageData && fullResponseText) {
          cacheResponse(currentMessage, fullResponseText, liturgyContext?.date);
          if (queryEmbedding) {
            saveToMemory(currentMessage, fullResponseText, queryEmbedding);
            // Save to Supabase shared memory (async, non-blocking)
            saveToSharedMemory(currentMessage, fullResponseText, queryEmbedding).catch(() => { });
          }
        }
      } else {
        const chunk = result.value;
        if (chunk && typeof chunk === 'object') {
          const text = (chunk as any).text || '';
          totalOutputTokens += Math.ceil(text.length / 4);
          fullResponseText += text;
        }
      }
      return result;
    },
    [Symbol.asyncIterator]() {
      return this;
    }
  };

  return trackedStream;
};

export const generateSimpleContent = async (prompt: string) => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.5,
    }
  });

  // Track usage for simple content too
  if (response.usageMetadata) {
    recordTokenUsage(
      response.usageMetadata.promptTokenCount || 0,
      response.usageMetadata.candidatesTokenCount || 0,
      'Simple Content: ' + prompt.slice(0, 30),
      GEMINI_MODEL
    );
  }

  return response.text;
};

export const getEmbeddings = async (text: string): Promise<number[] | null> => {
  const ai = getClient();

  const attemptEmbedding = async (model: string) => {
    const result = await ai.models.embedContent({
      model: model,
      contents: {
        parts: [{ text }]
      }
    });
    return result.embeddings?.[0]?.values || null;
  };

  try {
    // Use the model available to this API key
    return await attemptEmbedding('gemini-embedding-001');
  } catch (e: any) {
    console.warn(`gemini-embedding-001 failed (${e?.message}), attempting text-embedding-004...`);
    try {
      // Fallback
      return await attemptEmbedding('text-embedding-004');
    } catch (e2) {
      console.error("All embedding attempts failed:", e2);
      return null;
    }
  }
};