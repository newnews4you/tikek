import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';
import { semanticSearch, SearchResult } from './semanticSearch';
import { getKnowledgeBase } from '../data/knowledgeBase';
import { recordTokenUsage } from './tokenTracking';
import { LiturgyData } from './liturgyService';

const EMBEDDING_CACHE_KEY = 'gemini_embedding_cache';
interface EmbeddingCache {
  [query: string]: number[];
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

export const sendMessageStream = async (
  history: { role: string; parts: { text?: string; inlineData?: any }[] }[],
  currentMessage: string,
  imageData?: string,
  mimeType: string = 'image/jpeg',
  liturgyContext?: LiturgyData | null
) => {
  const ai = getClient();

  // 0. OPTIMIZATION: Try Keyword Search First (No Cost)
  const knowledgeBase = getKnowledgeBase();

  // First pass: Plain keyword search (fuzzy matching)
  let searchResults = semanticSearch(knowledgeBase, {
    query: currentMessage,
    limit: 10,
    fuzzyMatch: true,
    includeContext: true
  });

  // Check if we have good matches without embeddings
  // We look at the top score. Max score is usually around 200-300 for good keyword matches.
  const bestScore = searchResults.length > 0 ? searchResults[0].score : 0;
  const isGoodMatch = bestScore > 60; // Threshold for "good enough" keyword match

  // 1. CONDITIONAL EMBEDDING GENERATION
  let queryEmbedding: number[] | null = null;

  if (!isGoodMatch) {
    console.log(`Low keyword match score (${bestScore}), attempting vector search...`);

    // Check Cache first
    queryEmbedding = getCachedEmbedding(currentMessage);

    if (!queryEmbedding) {
      // Generate new embedding only if not in cache
      queryEmbedding = await getEmbeddings(currentMessage);
      if (queryEmbedding) {
        cacheEmbedding(currentMessage, queryEmbedding);
      }
    } else {
      console.log('Using cached embedding');
      recordTokenUsage(0, 0, 'CACHE HIT: ' + currentMessage, 'embedding-cache');
    }

    // Re-run search with embedding if we have it
    if (queryEmbedding) {
      searchResults = semanticSearch(knowledgeBase, {
        query: currentMessage,
        limit: 10,
        fuzzyMatch: true,
        includeContext: true,
        queryEmbedding: queryEmbedding
      });
    }
  } else {
    console.log(`Good keyword match (${bestScore}), skipping vector search.`);
  }

  let retrievedContext = "";
  if (searchResults.length > 0) {
    retrievedContext = "### AUTENTIŠKI ŠALTINIAI ATSAKYMUI (NAUDOTI ŠIUOS TEKSTUS) ###\n";
    // Deduplicate results by content
    const uniqueResults = searchResults.filter((value, index, self) =>
      index === self.findIndex((t) => (
        t.content === value.content
      ))
    ).slice(0, 3); // Keep top 3 unique (Optimization: Balanced source count)

    uniqueResults.forEach(result => {
      retrievedContext += `--- ŠALTINIS: ${result.bookOrSection} (${result.chapterOrRef}) ---\n${result.content}\n\n`;
    });
    retrievedContext += "### ŠALTINIŲ PABAIGA ###\n";
  }

  let finalSystemInstruction = SYSTEM_INSTRUCTION;

  // Add liturgy context so AI knows current date and liturgical season
  if (liturgyContext) {
    const liturgyPrompt = `

**ŠIANDIENOS LITURGINĖ INFORMACIJA (${liturgyContext.date}):**
- Savaitės diena: ${liturgyContext.weekday}
- Data: ${liturgyContext.dateFormatted}
- Liturginis laikas: ${liturgyContext.seasonLt}
- Liturginė spalva: ${liturgyContext.colorLt}
${liturgyContext.saintOfTheDay ? `- Šventasis/Šventė: ${liturgyContext.saintOfTheDay}` : ''}
${liturgyContext.gospelReference ? `- DIENOS EVANGELIJA: ${liturgyContext.gospelTitle} (${liturgyContext.gospelReference})` : ''}

SVARBU: Tu ŽINAI šią Evangelijos ištrauką (${liturgyContext.gospelReference || ''}) iš savo apmokymo duomenų (Biblijos). 

INSTRUKCIJA DĖL LITURGIJOS:
1. Šią informaciją naudok TIK tada, jei vartotojas:
   - Klausia apie "šiandieną", "dienos evangeliją", "skaitinius" ar "šventąjį".
   - Arba jei tema tiesiogiai susijusi su dienos liturgija.
2. JEI VARTOTOJAS KLAUSIA KITA TEMA (pvz. teologinio klausimo, maldos):
   - NEPRADĖK atsakymo nuo liturginės informacijos.
   - NEĮTERPK Evangelijos teksto, nebent tai padeda atsakyti į konkretų klausimą.
   - Atsakyk tiesiai į užduotą klausimą.`;
    finalSystemInstruction += liturgyPrompt;
  }

  // OPTIMIZACIJA: Sutrumpinta RAG instrukcija taupanti tokenus
  // SVARBU: Pridedame formatavimo priminimą PABAIGOJE, kad modelis nepamirštų taisyklių gavęs daug teksto.
  if (retrievedContext) {
    finalSystemInstruction += `\n\n` +
      `SVARBU: Naudok žemiau pateiktą VARTOTOJO INFORMACIJĄ kaip pagrindinį tiesos šaltinį atsakymui.\n` +
      `Jei informacijos šaltiniuose trūksta, naudok savo bendrąsias žinias apie Katalikų Bažnyčios mokymą, tačiau **NIEKADA nesakyk "pateiktuose šaltiniuose nėra informacijos"**.\n` +
      `Tiesiog atsakyk į klausimą geriausiai kaip gali.\n` +
      `\n` +
      `${retrievedContext}` +
      `\n\nINSTRUKCIJA: Atsakyk išsamiai, bet venk nereikalingo pilstymo. Cituok tik esminius šaltinius.`;
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

  const textOnlyHistory = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: msg.parts.filter(p => p.text).map(p => ({ text: p.text as string })),
  }));

  const chat = ai.chats.create({
    model: GEMINI_MODEL,
    config: {
      systemInstruction: finalSystemInstruction,
      temperature: 0.3, // Žema temperatūra užtikrina greitesnį ir tikslesnį faktų ištraukimą
    },
    history: textOnlyHistory,
  });

  const stream = await chat.sendMessageStream({
    message: newParts.length > 1 ? newParts : currentMessage
  });

  // Track token usage from response metadata
  const originalNext = stream.next.bind(stream);
  let totalOutputTokens = 0;

  const trackedStream = {
    ...stream,
    next: async () => {
      const result = await originalNext();
      if (result.done) {
        // Record token usage when stream ends
        // Estimate input tokens based on message length (approximate)
        const estimatedInputTokens = Math.ceil(
          (finalSystemInstruction.length + currentMessage.length) / 4
        );
        recordTokenUsage(estimatedInputTokens, totalOutputTokens, currentMessage, GEMINI_MODEL);
      } else {
        // Accumulate output tokens from chunks
        const chunk = result.value;
        if (chunk && typeof chunk === 'object') {
          const text = (chunk as any).text || '';
          totalOutputTokens += Math.ceil(text.length / 4);
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
  try {
    const ai = getClient();
    const result = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: {
        parts: [{ text }]
      }
    });

    // Calculate estimated tokens (approx 4 chars per token)
    const estimatedTokens = Math.ceil(text.length / 4);
    recordTokenUsage(estimatedTokens, 0, 'Embedding: ' + text.slice(0, 30), 'text-embedding-004');

    return result.embeddings?.[0]?.values || null;
  } catch (e) {
    console.warn("Embedding failed:", e);
    return null;
  }
};