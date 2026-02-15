import { getKnowledgeBase, KnowledgeChunk } from '../data/knowledgeBase';

const STOP_WORDS = new Set([
  'ir', 'kad', 'kai', 'kur', 'kas', 'dėl', 'su', 'į', 'iš', 'apie', 'kaip', 'turi', 'yra', 'buvo', 
  'bet', 'ar', 'tai', 'čia', 'prie', 'nuo', 'šis', 'ši', 'tas', 'ta', 'jie', 'jos', 'jūs', 'mes',
  'pas', 'per', 'po', 'tik', 'nei', 'nors', 'dar', 'jau', 'vėl'
]);

const calculateRelevance = (query: string, chunk: KnowledgeChunk): number => {
  const cleanQuery = query.toLowerCase().replace(/[.,?!:;()"']/g, '');
  const contentLower = chunk.content.toLowerCase();
  const titleLower = chunk.bookOrSection.toLowerCase();
  
  let score = 0;

  // 1. Tikslus frazės sutapimas (Labai svarbu)
  if (contentLower.includes(cleanQuery)) {
    score += 150;
  }

  const queryTokens = cleanQuery
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
  
  let matches = 0;

  queryTokens.forEach(token => {
    // Sutapimas pačiame tekste
    if (contentLower.includes(token)) {
      score += 15;
      matches++;
    }
    // Sutapimas knygos pavadinime (pvz. vartotojas klausia "Ką Mato evangelija sako...")
    if (titleLower.includes(token)) {
      score += 50; // Aukštas prioritetas knygos pavadinimui
    }
    // Sutapimas žymėse
    if (chunk.tags.some(tag => tag.toLowerCase().includes(token))) {
      score += 30;
    }
  });

  // Premija už kelis sutampančius žodžius (tikimybė, kad tai tas sakinys)
  if (matches > 1) {
    score += (matches * 10);
  }

  return score;
};

export const retrieveContext = (query: string): string => {
  const currentKnowledgeBase = getKnowledgeBase();
  
  const scoredChunks = currentKnowledgeBase.map(chunk => ({
    chunk,
    score: calculateRelevance(query, chunk)
  }));

  // TOP 12 fragmentų (padidinta nuo 8, kad apimtų daugiau konteksto didelėse knygose)
  const topChunks = scoredChunks
    .filter(item => item.score > 10) // Tik bent kiek prasmingi rezultatai
    .sort((a, b) => b.score - a.score)
    .slice(0, 12); 

  if (topChunks.length === 0) {
    return "";
  }

  const MAX_CHARS = 15000;
  let currentChars = 0;
  let contextString = "### AUTENTIŠKI ŠALTINIAI ATSAKYMUI (NAUDOTI ŠIUOS TEKSTUS) ###\n";

  for (let i = 0; i < topChunks.length; i++) {
    const item = topChunks[i];
    const chunkText = `${item.chunk.content}\n\n`;
    
    if (currentChars + chunkText.length > MAX_CHARS) break;

    contextString += chunkText;
    currentChars += chunkText.length;
  }

  contextString += "### ŠALTINIŲ PABAIGA ###\n";
  return contextString;
};