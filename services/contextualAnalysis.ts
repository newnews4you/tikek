/**
 * Contextual Analysis Service
 * Automatically detects citations, cross-references, and parallel texts
 */

import { KnowledgeChunk } from '../data/knowledgeBase';

export interface Citation {
  id: string;
  source: string;
  reference: string;
  text: string;
  confidence: number;
  position: { start: number; end: number };
}

export interface CrossReference {
  id: string;
  sourceRef: string;
  targetRef: string;
  relationship: 'direct' | 'thematic' | 'prophecy' | 'quotation' | 'allusion' | 'parallel';
  strength: number; // 0-1
  description?: string;
}

export interface ParallelText {
  id: string;
  texts: Array<{
    source: string;
    reference: string;
    content: string;
  }>;
  similarity: number;
  type: 'synoptic' | 'thematic' | 'quotation' | 'structural';
}

export interface AnalysisResult {
  citations: Citation[];
  crossReferences: CrossReference[];
  parallelTexts: ParallelText[];
  themes: string[];
  keyTerms: Array<{ term: string; frequency: number; significance: number }>;
}

// Biblical book abbreviations and their full names
const BIBLICAL_BOOKS: Record<string, string[]> = {
  'pradžios': ['pradžios', 'pr', 'gen', 'genesis'],
  'išėjimo': ['išėjimo', 'iš', 'exod', 'exodus'],
  'kunigų': ['kunigų', 'kun', 'lev', 'leviticus'],
  'skaičių': ['skaičių', 'sk', 'num', 'numbers'],
  'pakartoto įstatymo': ['pakartoto įstatymo', 'pak įst', 'deut', 'deuteronomy'],
  'jozuės': ['jozuės', 'joz', 'josh', 'joshua'],
  'teisėjų': ['teisėjų', 'ts', 'judg', 'judges'],
  'rūtos': ['rūtos', 'rut', 'ruth'],
  '1 samuelio': ['1 samuelio', '1 sam', '1 sam'],
  '2 samuelio': ['2 samuelio', '2 sam', '2 sam'],
  '1 karalių': ['1 karalių', '1 kar', '1 kgs'],
  '2 karalių': ['2 karalių', '2 kar', '2 kgs'],
  '1 metraščių': ['1 metraščių', '1 met', '1 chr'],
  '2 metraščių': ['2 metraščių', '2 met', '2 chr'],
  'ezros': ['ezros', 'ezr', 'ezra'],
  'nehemijo': ['nehemijo', 'neh', 'nehemiah'],
  'esteros': ['esteros', 'est', 'esther'],
  'jobo': ['jobo', 'job', 'job'],
  'psalmių': ['psalmių', 'ps', 'psalm'],
  'patarlių': ['patarlių', 'pat', 'prov', 'proverbs'],
  'mokytojo': ['mokytojo', 'mok', 'eccles', 'ecclesiastes'],
  'giesmių giesmės': ['giesmių giesmės', 'gg', 'song', 'song of solomon'],
  'izaijo': ['izaijo', 'iz', 'isa', 'isaiah'],
  'jeremijo': ['jeremijo', 'jer', 'jeremiah'],
  'raudų': ['raudų', 'raud', 'lam', 'lamentations'],
  'ezekielio': ['ezekielio', 'ez', 'ezek', 'ezekiel'],
  'danielio': ['danielio', 'dan', 'daniel'],
  'ozėjo': ['ozėjo', 'oz', 'hosea'],
  'joelio': ['joelio', 'joel', 'joel'],
  'amoso': ['amoso', 'am', 'amos'],
  'abdijo': ['abdijo', 'abd', 'obadiah'],
  'jonos': ['jonos', 'jon', 'jonah'],
  'michėjo': ['michėjo', 'mich', 'micah'],
  'nahumo': ['nahumo', 'nah', 'nahum'],
  'habakuko': ['habakuko', 'hab', 'habakkuk'],
  'cefanijo': ['cefanijo', 'cef', 'zephaniah'],
  'hagajo': ['hagajo', 'hag', 'haggai'],
  'zacharijo': ['zacharijo', 'zach', 'zechariah'],
  'malachijo': ['malachijo', 'mal', 'malachi'],
  'mato': ['mato', 'mt', 'matt', 'matthew'],
  'markaus': ['markaus', 'mk', 'mark'],
  'luko': ['luko', 'lk', 'luke'],
  'jono': ['jono', 'jn', 'john'],
  'apostolų darbų': ['apostolų darbų', 'ap d', 'acts', 'apostolų'],
  'romiečiams': ['romiečiams', 'rom', 'romans'],
  '1 korintiečiams': ['1 korintiečiams', '1 kor', '1 cor'],
  '2 korintiečiams': ['2 korintiečiams', '2 kor', '2 cor'],
  'galatams': ['galatams', 'gal', 'galatians'],
  'efziečiams': ['efziečiams', 'ef', 'eph', 'ephesians'],
  'filipiečiams': ['filipiečiams', 'fil', 'phil', 'philippians'],
  'kolosiečiams': ['kolosiečiams', 'kol', 'col', 'colossians'],
  '1 tesalonikiečiams': ['1 tesalonikiečiams', '1 tes', '1 thess'],
  '2 tesalonikiečiams': ['2 tesalonikiečiams', '2 tes', '2 thess'],
  '1 timotiejui': ['1 timotiejui', '1 tim', '1 timothy'],
  '2 timotiejui': ['2 timotiejui', '2 tim', '2 timothy'],
  'titui': ['titui', 'tit', 'titus'],
  'filemonui': ['filemonui', 'flm', 'philemon'],
  'hebrajams': ['hebrajams', 'hebr', 'heb', 'hebrews'],
  'jokūbo': ['jokūbo', 'jak', 'james'],
  '1 petro': ['1 petro', '1 pt', '1 pet', '1 peter'],
  '2 petro': ['2 petro', '2 pt', '2 pet', '2 peter'],
  '1 jono': ['1 jono', '1 jn', '1 john'],
  '2 jono': ['2 jono', '2 jn', '2 john'],
  '3 jono': ['3 jono', '3 jn', '3 john'],
  'judas': ['judas', 'jud', 'jude'],
  'apreiškimo': ['apreiškimo', 'ap', 'rev', 'revelation', 'apocalypse']
};

// Synoptic gospel parallels
const SYNOPTIC_PARALLELS: Array<{ refs: string[]; theme: string }> = [
  { refs: ['Mt 5:3-12', 'Lk 6:20-23'], theme: 'Palaiminimai' },
  { refs: ['Mt 6:9-13', 'Lk 11:2-4'], theme: 'Tėve mūsų' },
  { refs: ['Mt 26:26-29', 'Mk 14:22-25', 'Lk 22:19-20'], theme: 'Paskutinė vakarienė' },
  { refs: ['Mt 28:1-10', 'Mk 16:1-8', 'Lk 24:1-12'], theme: 'Prisikėlimas' }
];

// Major thematic parallels between Old and New Testaments
const THEMATIC_PARALLELS: Array<{ ot: string; nt: string; theme: string }> = [
  { ot: 'Pr 3:15', nt: 'Gal 4:4', theme: 'Išganymo pažadas' },
  { ot: 'Ps 22', nt: 'Mt 27', theme: 'Kančia' },
  { ot: 'Iz 53', nt: 'Rom 4:25', theme: 'Kančios Tarnas' },
  { ot: 'Pr 22:1-14', nt: 'Jn 3:16', theme: 'Tėvo auka' }
];

/**
 * Detects biblical citations in text
 */
export const detectCitations = (text: string, knowledgeBase: KnowledgeChunk[]): Citation[] => {
  const citations: Citation[] = [];
  
  // Pattern for biblical references
  const referencePatterns = [
    // Full format: "Mato 5, 3" or "Mato evangelija 5, 3"
    /(\p{L}+(?:\s+evangelija)?)\s+(\d+)\s*[,:;]\s*(\d+(?:\s*-\s*\d+)?)/giu,
    // Abbreviated format: "Mt 5, 3"
    /\b(Mt|Mk|Lk|Jn|Pr|Iš|Ps|Iz|Jer|Kor|Ef|Fil|Kol|Tit|Hebr|Jak|Pt|Jud|Ap)\s+(\d+)\s*[,:;]\s*(\d+(?:\s*-\s*\d+)?)/gi,
    // Square bracket format: "[Mt 5:3]"
    /\[(\p{L}+)\s+(\d+)\s*:\s*(\d+(?:\s*-\s*\d+)?)\]/gu
  ];
  
  for (const pattern of referencePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const bookRef = match[1].toLowerCase().trim();
      const chapter = match[2];
      const verse = match[3];
      
      // Normalize book name
      const normalizedBook = normalizeBookName(bookRef);
      
      if (normalizedBook) {
        const reference = `${normalizedBook} ${chapter}, ${verse}`;
        
        // Try to find the actual text in knowledge base
        const citationText = findCitationText(normalizedBook, chapter, verse, knowledgeBase);
        
        citations.push({
          id: `citation-${match.index}`,
          source: normalizedBook,
          reference,
          text: citationText || '',
          confidence: citationText ? 0.9 : 0.6,
          position: { start: match.index, end: match.index + match[0].length }
        });
      }
    }
  }
  
  return citations;
};

/**
 * Normalizes book name to standard form
 */
const normalizeBookName = (input: string): string | null => {
  const inputLower = input.toLowerCase().replace(/\s+evangelija/g, '');
  
  for (const [standard, variants] of Object.entries(BIBLICAL_BOOKS)) {
    if (variants.includes(inputLower)) {
      return standard;
    }
  }
  
  return null;
};

/**
 * Finds citation text in knowledge base
 */
const findCitationText = (
  book: string,
  chapter: string,
  verse: string,
  knowledgeBase: KnowledgeChunk[]
): string | null => {
  const bookChunks = knowledgeBase.filter(
    c => c.bookOrSection.toLowerCase().includes(book.toLowerCase())
  );
  
  for (const chunk of bookChunks) {
    if (chunk.chapterOrRef.includes(chapter)) {
      // Try to extract specific verse
      const verseMatch = chunk.content.match(
        new RegExp(`\\b${verse}\\b([^\\d]+)(?=\\d|$)`, 'i')
      );
      if (verseMatch) {
        return verseMatch[1].trim();
      }
    }
  }
  
  return null;
};

/**
 * Finds cross-references for a given reference
 */
export const findCrossReferences = (reference: string): CrossReference[] => {
  const crossRefs: CrossReference[] = [];
  
  // Check synoptic parallels
  for (const parallel of SYNOPTIC_PARALLELS) {
    if (parallel.refs.some(ref => ref.toLowerCase().includes(reference.toLowerCase()))) {
      for (const ref of parallel.refs) {
        if (ref !== reference) {
          crossRefs.push({
            id: `syn-${reference}-${ref}`,
            sourceRef: reference,
            targetRef: ref,
            relationship: 'parallel',
            strength: 0.95,
            description: `Sinoptinis parallelas: ${parallel.theme}`
          });
        }
      }
    }
  }
  
  // Check thematic parallels
  for (const parallel of THEMATIC_PARALLELS) {
    if (reference.toLowerCase().includes(parallel.ot.toLowerCase()) ||
        reference.toLowerCase().includes(parallel.nt.toLowerCase())) {
      const targetRef = reference.toLowerCase().includes(parallel.ot.toLowerCase()) 
        ? parallel.nt 
        : parallel.ot;
      
      crossRefs.push({
        id: `theme-${reference}-${targetRef}`,
        sourceRef: reference,
        targetRef,
        relationship: 'thematic',
        strength: 0.8,
        description: `Teologinė tema: ${parallel.theme}`
      });
    }
  }
  
  // Auto-detect based on similar phrases
  crossRefs.push(...detectSimilarReferences(reference));
  
  return crossRefs;
};

/**
 * Detects similar references based on content similarity
 */
const detectSimilarReferences = (reference: string): CrossReference[] => {
  // This would use more sophisticated similarity detection in production
  // For now, return empty array as placeholder
  return [];
};

/**
 * Finds parallel texts across different sources
 */
export const findParallelTexts = (
  text: string,
  knowledgeBase: KnowledgeChunk[],
  minSimilarity: number = 0.7
): ParallelText[] => {
  const parallels: ParallelText[] = [];
  
  // Extract key phrases from the text
  const keyPhrases = extractKeyPhrases(text);
  
  // Search for similar content in knowledge base
  const candidates = knowledgeBase.filter(chunk => {
    const chunkPhrases = extractKeyPhrases(chunk.content);
    const similarity = calculatePhraseSimilarity(keyPhrases, chunkPhrases);
    return similarity >= minSimilarity;
  });
  
  // Group by similarity clusters
  const clusters = clusterBySimilarity(candidates, minSimilarity);
  
  for (const cluster of clusters) {
    if (cluster.length >= 2) {
      parallels.push({
        id: `parallel-${Date.now()}-${Math.random()}`,
        texts: cluster.map(c => ({
          source: c.source,
          reference: `${c.bookOrSection} ${c.chapterOrRef}`,
          content: c.content.slice(0, 200) + '...'
        })),
        similarity: calculateClusterSimilarity(cluster),
        type: determineParallelType(cluster)
      });
    }
  }
  
  return parallels;
};

/**
 * Extracts key phrases from text
 */
const extractKeyPhrases = (text: string): string[] => {
  const phrases: string[] = [];
  
  // Split into sentences and extract significant phrases
  const sentences = text.split(/[.!?]+/);
  
  for (const sentence of sentences) {
    // Extract 3-5 word phrases
    const words = sentence.trim().split(/\s+/).filter(w => w.length > 3);
    
    for (let i = 0; i <= words.length - 3; i++) {
      phrases.push(words.slice(i, i + 3).join(' ').toLowerCase());
    }
  }
  
  return [...new Set(phrases)];
};

/**
 * Calculates similarity between two sets of phrases
 */
const calculatePhraseSimilarity = (phrases1: string[], phrases2: string[]): number => {
  if (phrases1.length === 0 || phrases2.length === 0) return 0;
  
  let matches = 0;
  for (const phrase1 of phrases1) {
    for (const phrase2 of phrases2) {
      if (phrase1.includes(phrase2) || phrase2.includes(phrase1)) {
        matches++;
      }
    }
  }
  
  return matches / Math.max(phrases1.length, phrases2.length);
};

/**
 * Clusters chunks by content similarity
 */
const clusterBySimilarity = (
  chunks: KnowledgeChunk[],
  threshold: number
): KnowledgeChunk[][] => {
  const clusters: KnowledgeChunk[][] = [];
  const visited = new Set<string>();
  
  for (const chunk of chunks) {
    if (visited.has(chunk.id || '')) continue;
    
    const cluster: KnowledgeChunk[] = [chunk];
    visited.add(chunk.id || '');
    
    for (const other of chunks) {
      if (visited.has(other.id || '')) continue;
      
      const similarity = calculateContentSimilarity(chunk.content, other.content);
      if (similarity >= threshold) {
        cluster.push(other);
        visited.add(other.id || '');
      }
    }
    
    clusters.push(cluster);
  }
  
  return clusters;
};

/**
 * Calculates content similarity using simple word overlap
 */
const calculateContentSimilarity = (text1: string, text2: string): number => {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
};

/**
 * Calculates average similarity within a cluster
 */
const calculateClusterSimilarity = (cluster: KnowledgeChunk[]): number => {
  if (cluster.length < 2) return 1;
  
  let totalSimilarity = 0;
  let comparisons = 0;
  
  for (let i = 0; i < cluster.length; i++) {
    for (let j = i + 1; j < cluster.length; j++) {
      totalSimilarity += calculateContentSimilarity(cluster[i].content, cluster[j].content);
      comparisons++;
    }
  }
  
  return comparisons > 0 ? totalSimilarity / comparisons : 0;
};

/**
 * Determines the type of parallel
 */
const determineParallelType = (cluster: KnowledgeChunk[]): ParallelText['type'] => {
  const sources = new Set(cluster.map(c => c.source));
  
  // Check if from synoptic gospels
  const synopticSources = ['Mato', 'Markaus', 'Luko'];
  const isSynoptic = cluster.some(c => 
    synopticSources.some(s => c.bookOrSection.includes(s))
  );
  
  if (isSynoptic && sources.size > 1) {
    return 'synoptic';
  }
  
  // Default to thematic
  return 'thematic';
};

/**
 * Extracts themes from text
 */
export const extractThemes = (text: string): string[] => {
  const themes: string[] = [];
  
  // Common theological themes
  const themeKeywords: Record<string, string[]> = {
    'Meilė': ['meilė', 'myli', 'mylimas', 'mylėti'],
    'Tikėjimas': ['tikėjimas', 'tiki', 'tikėti'],
    'Viltis': ['viltis', 'viltingas', 'viltis'],
    'Išganymas': ['išganymas', 'išgelbėti', 'išgelbėjimas'],
    'Malonė': ['malonė', 'maloningas'],
    'Teisumas': ['teisumas', 'teisingas', 'teisybė'],
    'Gailestingumas': ['gailestingumas', 'pasigailėti', 'pasigailėjimas'],
    'Atleidimas': ['atleisti', 'atleidimas', 'atleista']
  };
  
  const textLower = text.toLowerCase();
  
  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    if (keywords.some(kw => textLower.includes(kw))) {
      themes.push(theme);
    }
  }
  
  return themes;
};

/**
 * Extracts key terms with frequency and significance
 */
export const extractKeyTerms = (
  text: string,
  knowledgeBase: KnowledgeChunk[]
): Array<{ term: string; frequency: number; significance: number }> => {
  const terms: Map<string, { frequency: number; contexts: string[] }> = new Map();
  
  // Tokenize and count
  const words = text.toLowerCase()
    .replace(/[.,!?;:"()]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !isStopWord(w));
  
  for (const word of words) {
    if (!terms.has(word)) {
      terms.set(word, { frequency: 0, contexts: [] });
    }
    const entry = terms.get(word)!;
    entry.frequency++;
  }
  
  // Calculate significance (TF-IDF-like)
  const totalDocs = knowledgeBase.length || 1;
  
  const results = Array.from(terms.entries())
    .map(([term, data]) => {
      // Document frequency (how many chunks contain this term)
      const docFreq = knowledgeBase.filter(c => 
        c.content.toLowerCase().includes(term)
      ).length;
      
      const idf = Math.log(totalDocs / (docFreq + 1));
      const significance = data.frequency * idf;
      
      return { term, frequency: data.frequency, significance };
    })
    .sort((a, b) => b.significance - a.significance);
  
  return results.slice(0, 20);
};

/**
 * Check if word is a stop word
 */
const isStopWord = (word: string): boolean => {
  const stopWords = new Set([
    'tai', 'kur', 'kas', 'koks', 'kada', 'kodėl', 'kaip', 'ir', 'bet', 'arba',
    'nes', 'todėl', 'tačiau', 'nors', 'jei', 'kad', 'kai', 'kuris', 'toks'
  ]);
  return stopWords.has(word.toLowerCase());
};

/**
 * Performs full contextual analysis
 */
export const analyzeContext = (
  text: string,
  knowledgeBase: KnowledgeChunk[]
): AnalysisResult => {
  const citations = detectCitations(text, knowledgeBase);
  
  const crossReferences: CrossReference[] = [];
  for (const citation of citations) {
    crossReferences.push(...findCrossReferences(citation.reference));
  }
  
  const parallelTexts = findParallelTexts(text, knowledgeBase);
  const themes = extractThemes(text);
  const keyTerms = extractKeyTerms(text, knowledgeBase);
  
  return {
    citations,
    crossReferences: [...new Map(crossReferences.map(r => [r.id, r])).values()],
    parallelTexts,
    themes,
    keyTerms
  };
};

/**
 * Generates citation in academic format
 */
export const formatCitation = (
  citation: Citation,
  format: 'chicago' | 'mla' | 'apa' | 'turabian'
): string => {
  switch (format) {
    case 'chicago':
      return `${citation.source} ${citation.reference}`;
    case 'mla':
      return `"${citation.text.slice(0, 50)}..." (${citation.source} ${citation.reference})`;
    case 'apa':
      return `(${citation.source}, ${citation.reference})`;
    case 'turabian':
      return `${citation.source} ${citation.reference}`;
    default:
      return `${citation.source} ${citation.reference}`;
  }
};