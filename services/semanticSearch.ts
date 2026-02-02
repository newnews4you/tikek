/**
 * Advanced Semantic Search Service
 * Provides intelligent search across large text corpora without chunking
 * Uses vector-based similarity, fuzzy matching, and hierarchical indexing
 */

import { KnowledgeChunk } from '../data/knowledgeBase';

export interface SearchResult {
  id: string;
  source: string;
  bookOrSection: string;
  chapterOrRef: string;
  content: string;
  score: number;
  highlights: string[];
  context: {
    before: string;
    after: string;
  };
  metadata: {
    wordCount: number;
    verseRange?: string;
    tags: string[];
  };
}

export interface SearchFilters {
  sources?: string[];
  books?: string[];
  dateRange?: { start?: string; end?: string };
  contentTypes?: ('BIBLE' | 'CATECHISM' | 'ENCYCLICAL' | 'SAINT' | 'COMMENTARY')[];
}

export interface SearchOptions {
  query: string;
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
  fuzzyMatch?: boolean;
  includeContext?: boolean;
  highlightMatches?: boolean;
  queryEmbedding?: number[];
}



// Lithuanian stop words for better search relevance
const STOP_WORDS = new Set([
  'ir', 'kad', 'kai', 'kur', 'kas', 'dėl', 'su', 'į', 'iš', 'apie', 'kaip', 'turi', 'yra', 'buvo',
  'bet', 'ar', 'tai', 'čia', 'prie', 'nuo', 'šis', 'ši', 'tas', 'ta', 'jie', 'jos', 'jūs', 'mes',
  'pas', 'per', 'po', 'tik', 'nei', 'nors', 'dar', 'jau', 'vėl', 'be', 'ant', 'už', 'prieš',
  ' tarp', 'pvz', 't.y', 'ir tt', 'ir t.t', 'etc'
]);

// Biblical book names for recognition
const BIBLICAL_BOOKS = new Set([
  'pradžios', 'išėjimo', 'kunigų', 'skaičių', 'pakartoto įstatymo', 'jozuės', 'teisėjų', 'rūtos',
  '1 samuelio', '2 samuelio', '1 karalių', '2 karalių', '1 metraščių', '2 metraščių', 'ezros',
  'nehemijo', 'esteros', 'jobo', 'psalmių', 'patarlių', 'mokytojo', 'giesmių giesmės', 'izaijo',
  'jeremijo', 'raudų', 'ezekielio', 'danielio', 'ozėjo', 'joelio', 'amoso', 'abdijo', 'jonos',
  'michėjo', 'nahumo', 'habakuko', 'cefanijo', 'hagajo', 'zacharijo', 'malachijo',
  'mato', 'markaus', 'luko', 'jono', 'apostolų darbų', 'romiečiams', '1 korintiečiams',
  '2 korintiečiams', 'galatams', 'efziečiams', 'filipiečiams', 'kolosiečiams',
  '1 tesalonikiečiams', '2 tesalonikiečiams', '1 timotiejui', '2 timotiejui', 'titui',
  'filemonui', 'hebrajams', 'jokūbo', '1 petro', '2 petro', '1 jono', '2 jono', '3 jono',
  'judas', 'apreiškimo'
]);

/**
 * Tokenizes text into searchable terms
 */
const tokenize = (text: string): string[] => {
  return text
    .toLowerCase()
    .replace(/[.,?!:;()"'\[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(token => token.length > 2 && !STOP_WORDS.has(token));
};

/**
 * Calculates Levenshtein distance for fuzzy matching
 */
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
};

/**
 * Checks if two strings are similar (fuzzy match)
 */
const isFuzzyMatch = (str1: string, str2: string, threshold: number = 0.3): boolean => {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return true;
  const distance = levenshteinDistance(str1, str2);
  return distance / maxLength <= threshold;
};

/**
 * Calculates Cosine Similarity between two vectors
 */
export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
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

/**
 * Extracts biblical references from query
 */
const extractBiblicalReference = (query: string): { book?: string; chapter?: number; verse?: number } | null => {
  const patterns = [
    // "Mato 5, 3" or "Mato 5:3" or "Mt 5,3"
    /(?:mato|mt|mtt?)\s*(\d+)[,:\s]+(\d+)/i,
    // "Pradžios 1, 1"
    /(?:pradžios|pr)\s*(\d+)[,:\s]+(\d+)/i,
    // Generic pattern for any book
    /(\w+)\s*(\d+)[,:\s]+(\d+)/i
  ];

  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match) {
      const book = match[1]?.toLowerCase();
      const chapter = parseInt(match[2]);
      const verse = parseInt(match[3]);

      // Validate if it's a biblical book
      if (BIBLICAL_BOOKS.has(book) || BIBLICAL_BOOKS.has(book + ' evangelija')) {
        return { book, chapter, verse };
      }
    }
  }

  return null;
};

/**
 * Calculates semantic relevance score
 */
const calculateRelevanceScore = (
  query: string,
  chunk: KnowledgeChunk,
  options: { fuzzyMatch?: boolean; queryEmbedding?: number[] } = {}
): number => {
  const queryTokens = tokenize(query);
  const contentLower = chunk.content.toLowerCase();
  const titleLower = chunk.bookOrSection.toLowerCase();
  let score = 0;

  // 1. Exact phrase match (highest priority)
  const cleanQuery = query.toLowerCase().replace(/[.,?!:;()"']/g, '');
  if (contentLower.includes(cleanQuery)) {
    score += 200;
  }

  // 2. Biblical reference match
  const biblicalRef = extractBiblicalReference(query);
  if (biblicalRef) {
    const bookMatch = titleLower.includes(biblicalRef.book || '');
    const chapterMatch = chunk.chapterOrRef.includes(biblicalRef.chapter?.toString() || '');

    if (bookMatch && chapterMatch) {
      score += 300;
    } else if (bookMatch) {
      score += 150;
    }
  }

  // 3. Token matching with weights
  let tokenMatches = 0;
  let fuzzyMatches = 0;

  queryTokens.forEach(token => {
    // Exact token match in content
    if (contentLower.includes(token)) {
      score += 20;
      tokenMatches++;
    }

    // Token match in title/book name
    if (titleLower.includes(token)) {
      score += 50;
    }

    // Tag matching
    if (chunk.tags.some(tag => tag.toLowerCase().includes(token))) {
      score += 30;
    }

    // Fuzzy matching
    if (options.fuzzyMatch) {
      const contentTokens = tokenize(chunk.content);
      for (const contentToken of contentTokens) {
        if (isFuzzyMatch(token, contentToken, 0.25)) {
          score += 10;
          fuzzyMatches++;
          break;
        }
      }
    }
  });

  // 4. Bonus for multiple token matches (higher precision)
  if (tokenMatches > 1) {
    score += tokenMatches * 15;
  }

  // 5. Source type weighting
  if (chunk.source === 'Biblija') {
    score *= 1.1; // Slight boost for biblical content
  }

  // 6. Vector Similarity (Semantic meaning)
  if (options.queryEmbedding && chunk.embedding) {
    const similarity = cosineSimilarity(options.queryEmbedding, chunk.embedding);
    // Only boost if similarity is high enough
    if (similarity > 0.6) {
      score += similarity * 200;
    }
  }

  return score;
};

/**
 * Generates highlighted snippets from content
 */
const generateHighlights = (content: string, query: string): string[] => {
  const highlights: string[] = [];
  const queryTokens = tokenize(query);
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);

  for (const sentence of sentences) {
    const sentenceLower = sentence.toLowerCase();
    let matchCount = 0;

    for (const token of queryTokens) {
      if (sentenceLower.includes(token)) {
        matchCount++;
      }
    }

    if (matchCount >= Math.max(1, queryTokens.length * 0.3)) {
      let highlighted = sentence.trim();

      // Highlight matching tokens
      for (const token of queryTokens) {
        const regex = new RegExp(`(${token})`, 'gi');
        highlighted = highlighted.replace(regex, '<mark>$1</mark>');
      }

      highlights.push(highlighted);
    }
  }

  return highlights.slice(0, 3); // Top 3 highlights
};

/**
 * Extracts context around matched content
 */
const extractContext = (content: string, query: string, windowSize: number = 100): { before: string; after: string } => {
  const contentLower = content.toLowerCase();
  const queryLower = query.toLowerCase();
  const index = contentLower.indexOf(queryLower);

  if (index === -1) {
    // If exact match not found, return beginning and end
    return {
      before: content.slice(0, Math.min(windowSize, content.length)),
      after: content.slice(-Math.min(windowSize, content.length))
    };
  }

  const before = content.slice(Math.max(0, index - windowSize), index);
  const after = content.slice(index + query.length, Math.min(content.length, index + query.length + windowSize));

  return { before, after };
};

/**
 * Main semantic search function
 */
export const semanticSearch = (
  knowledgeBase: KnowledgeChunk[],
  options: SearchOptions
): SearchResult[] => {
  const {
    query,
    filters = {},
    limit = 20,
    offset = 0,
    fuzzyMatch = true,
    includeContext = true,
    highlightMatches = true,
    queryEmbedding
  } = options;

  if (!query.trim() || knowledgeBase.length === 0) {
    return [];
  }

  // Apply filters
  let filteredBase = knowledgeBase;

  if (filters.sources && filters.sources.length > 0) {
    filteredBase = filteredBase.filter(chunk =>
      filters.sources!.some(source =>
        chunk.source.toLowerCase().includes(source.toLowerCase())
      )
    );
  }

  if (filters.books && filters.books.length > 0) {
    filteredBase = filteredBase.filter(chunk =>
      filters.books!.some(book =>
        chunk.bookOrSection.toLowerCase().includes(book.toLowerCase())
      )
    );
  }

  if (filters.contentTypes && filters.contentTypes.length > 0) {
    filteredBase = filteredBase.filter(chunk =>
      filters.contentTypes!.some(type =>
        chunk.source.toUpperCase().includes(type)
      )
    );
  }

  // Calculate scores
  const scoredResults = filteredBase.map(chunk => {
    const score = calculateRelevanceScore(query, chunk, { fuzzyMatch, queryEmbedding });
    return { chunk, score };
  });

  // Sort by score and filter out low-relevance results
  const sortedResults = scoredResults
    .filter(item => item.score > 15)
    .sort((a, b) => b.score - a.score);

  // Paginate
  const paginatedResults = sortedResults.slice(offset, offset + limit);

  // Transform to SearchResult format
  return paginatedResults.map(({ chunk, score }) => {
    const cleanContent = chunk.content.replace(/^\[Šaltinis: .*?\]\s*/, '');

    return {
      id: chunk.id || `${chunk.source}-${chunk.bookOrSection}-${Date.now()}`,
      source: chunk.source,
      bookOrSection: chunk.bookOrSection,
      chapterOrRef: chunk.chapterOrRef,
      content: cleanContent,
      score,
      highlights: highlightMatches ? generateHighlights(cleanContent, query) : [],
      context: includeContext ? extractContext(cleanContent, query) : { before: '', after: '' },
      metadata: {
        wordCount: cleanContent.split(/\s+/).length,
        verseRange: extractVerseRange(cleanContent),
        tags: chunk.tags
      }
    };
  });
};

/**
 * Extracts verse range from content if present
 */
const extractVerseRange = (content: string): string | undefined => {
  const match = content.match(/\[([^\]]+)\]/);
  return match ? match[1] : undefined;
};

/**
 * Suggests related queries based on search history
 */
export const suggestRelatedQueries = (query: string, searchHistory: string[]): string[] => {
  const suggestions: string[] = [];
  const queryTokens = tokenize(query);

  // Find similar past queries
  for (const historyQuery of searchHistory) {
    const historyTokens = tokenize(historyQuery);
    const commonTokens = queryTokens.filter(token => historyTokens.includes(token));

    if (commonTokens.length > 0 && commonTokens.length < queryTokens.length) {
      suggestions.push(historyQuery);
    }
  }

  // Add biblical reference variations
  const biblicalRef = extractBiblicalReference(query);
  if (biblicalRef) {
    suggestions.push(`${biblicalRef.book} ${biblicalRef.chapter}`);
    if (biblicalRef.verse) {
      suggestions.push(`${biblicalRef.book} ${biblicalRef.chapter}, ${biblicalRef.verse + 1}`);
    }
  }

  return [...new Set(suggestions)].slice(0, 5);
};

/**
 * Auto-completes search queries
 */
export const autocompleteQuery = (
  partialQuery: string,
  knowledgeBase: KnowledgeChunk[]
): string[] => {
  const suggestions: Set<string> = new Set();
  const partialLower = partialQuery.toLowerCase();

  // Book name suggestions
  for (const book of BIBLICAL_BOOKS) {
    if (book.startsWith(partialLower)) {
      suggestions.add(book.charAt(0).toUpperCase() + book.slice(1));
    }
  }

  // Content-based suggestions
  for (const chunk of knowledgeBase) {
    const contentTokens = tokenize(chunk.content);
    for (const token of contentTokens) {
      if (token.startsWith(partialLower) && token.length > partialLower.length) {
        suggestions.add(token);
      }
    }

    if (suggestions.size >= 10) break;
  }

  return Array.from(suggestions).slice(0, 10);
};

/**
 * Creates a search index for faster queries on large datasets
 */
export class SearchIndex {
  private index: Map<string, Set<string>> = new Map();
  private chunks: Map<string, KnowledgeChunk> = new Map();

  constructor(knowledgeBase: KnowledgeChunk[]) {
    this.buildIndex(knowledgeBase);
  }

  private buildIndex(knowledgeBase: KnowledgeChunk[]) {
    for (const chunk of knowledgeBase) {
      if (chunk.id) {
        this.chunks.set(chunk.id, chunk);

        const tokens = new Set([
          ...tokenize(chunk.content),
          ...tokenize(chunk.bookOrSection),
          ...chunk.tags
        ]);

        for (const token of tokens) {
          if (!this.index.has(token)) {
            this.index.set(token, new Set());
          }
          this.index.get(token)!.add(chunk.id);
        }
      }
    }
  }

  search(query: string): KnowledgeChunk[] {
    const queryTokens = tokenize(query);
    const chunkScores: Map<string, number> = new Map();

    for (const token of queryTokens) {
      const chunkIds = this.index.get(token);
      if (chunkIds) {
        for (const id of chunkIds) {
          chunkScores.set(id, (chunkScores.get(id) || 0) + 1);
        }
      }
    }

    const sortedIds = Array.from(chunkScores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);

    return sortedIds
      .map(id => this.chunks.get(id))
      .filter((chunk): chunk is KnowledgeChunk => chunk !== undefined);
  }

  get size(): number {
    return this.chunks.size;
  }
}