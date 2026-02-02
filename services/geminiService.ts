import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';
import { semanticSearch } from './semanticSearch';
import { getKnowledgeBase } from '../data/knowledgeBase';
import { recordTokenUsage } from './tokenTracking';

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

export const sendMessageStream = async (
  history: { role: string; parts: { text?: string; inlineData?: any }[] }[],
  currentMessage: string,
  imageData?: string,
  mimeType: string = 'image/jpeg'
) => {
  const ai = getClient();

  // 0. GENERATE QUERY EMBEDDING
  const queryEmbedding = await getEmbeddings(currentMessage);

  // 1. LOCAL RAG STEP (Advanced Semantic Search)
  const knowledgeBase = getKnowledgeBase();
  const searchResults = semanticSearch(knowledgeBase, {
    query: currentMessage,
    limit: 8, // Tiksl nustatome 8 geriausius
    fuzzyMatch: true,
    includeContext: true,
    queryEmbedding: queryEmbedding || undefined
  });

  let retrievedContext = "";
  if (searchResults.length > 0) {
    retrievedContext = "### AUTENTIŠKI ŠALTINIAI ATSAKYMUI (NAUDOTI ŠIUOS TEKSTUS) ###\n";
    searchResults.forEach(result => {
      retrievedContext += `--- ŠALTINIS: ${result.bookOrSection} (${result.chapterOrRef}) ---\n${result.content}\n\n`;
    });
    retrievedContext += "### ŠALTINIŲ PABAIGA ###\n";
  }

  let finalSystemInstruction = SYSTEM_INSTRUCTION;

  // OPTIMIZACIJA: Sutrumpinta RAG instrukcija taupanti tokenus
  // SVARBU: Pridedame formatavimo priminimą PABAIGOJE, kad modelis nepamirštų taisyklių gavęs daug teksto.
  if (retrievedContext) {
    finalSystemInstruction += `\n\n` +
      `SVARBU: Naudok žemiau pateiktą VARTOTOJO INFORMACIJĄ kaip pagrindinį tiesos šaltinį atsakymui.\n` +
      `Jei atsakymas yra šiuose tekstuose, neieškok kitur ir cituok juos.\n` +
      `\n` +
      `${retrievedContext}` +
      `\n\nPRIMINIMAS FORMATAVIMUI: Antraštėms naudok ###, o citatoms naudok > simbolį.`;
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
    model: 'gemini-3-flash-preview',
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
        recordTokenUsage(estimatedInputTokens, totalOutputTokens, currentMessage);
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
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.5,
    }
  });
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