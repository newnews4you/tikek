/**
 * Text utility functions for the application
 */

/**
 * Highlights search terms in text
 */
export const highlightText = (text: string, query: string): string => {
  if (!query.trim()) return escapeHtml(text);
  
  const terms = query
    .split(/\s+/)
    .filter(term => term.length > 2)
    .map(term => escapeRegExp(term));
  
  if (terms.length === 0) return escapeHtml(text);
  
  const pattern = new RegExp(`(${terms.join('|')})`, 'gi');
  
  return escapeHtml(text).replace(
    pattern,
    '<mark class="bg-yellow-200 text-gray-900 px-0.5 rounded">$1</mark>'
  );
};

/**
 * Escapes special regex characters
 */
const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Escapes HTML special characters
 */
export const escapeHtml = (text: string): string => {
  if (!text) return '';
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Truncates text to specified length
 */
export const truncateText = (text: string, maxLength: number, suffix = '...'): string => {
  if (text.length <= maxLength) return text;
  
  const truncated = text.slice(0, maxLength - suffix.length);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 0) {
    return truncated.slice(0, lastSpace) + suffix;
  }
  
  return truncated + suffix;
};

/**
 * Extracts text content from HTML
 */
export const stripHtml = (html: string): string => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

/**
 * Counts words in text
 */
export const countWords = (text: string): number => {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

/**
 * Counts characters in text (excluding whitespace)
 */
export const countCharacters = (text: string): number => {
  return text.replace(/\s/g, '').length;
};

/**
 * Formats a biblical reference
 */
export const formatBiblicalReference = (
  book: string,
  chapter: string | number,
  verse?: string | number
): string => {
  if (verse !== undefined) {
    return `${book} ${chapter}, ${verse}`;
  }
  return `${book} ${chapter}`;
};

/**
 * Parses a biblical reference string
 */
export const parseBiblicalReference = (
  reference: string
): { book: string; chapter?: number; verse?: number } | null => {
  // Match patterns like "Mato 5, 3" or "Mato 5:3" or "Mt 5,3"
  const patterns = [
    /^(\p{L}+)\s+(\d+)\s*[,:;]\s*(\d+)$/iu,
    /^(\p{L}+)\s+(\d+)$/iu
  ];
  
  for (const pattern of patterns) {
    const match = reference.match(pattern);
    if (match) {
      return {
        book: match[1],
        chapter: match[2] ? parseInt(match[2]) : undefined,
        verse: match[3] ? parseInt(match[3]) : undefined
      };
    }
  }
  
  return null;
};

/**
 * Normalizes Lithuanian text for search
 */
export const normalizeLithuanian = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[ąčęėįšųūž]/g, char => {
      const map: Record<string, string> = {
        'ą': 'a', 'č': 'c', 'ę': 'e', 'ė': 'e',
        'į': 'i', 'š': 's', 'ų': 'u', 'ū': 'u', 'ž': 'z'
      };
      return map[char] || char;
    });
};

/**
 * Generates a slug from text
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Capitalizes first letter of each word
 */
export const titleCase = (text: string): string => {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Detects language of text (simple heuristic)
 */
export const detectLanguage = (text: string): 'lt' | 'en' | 'la' | 'unknown' => {
  const ltChars = /[ąčęėįšųūž]/i;
  const laPatterns = /\b(et|est|sum|qui|quae|quod|in|ad|ut|non|sed|cum|autem|enim)\b/i;
  
  if (ltChars.test(text)) return 'lt';
  if (laPatterns.test(text)) return 'la';
  
  // Check for common English words
  const enPatterns = /\b(the|and|of|to|in|a|is|that|for|it|with|as|was|be|are|this)\b/i;
  if (enPatterns.test(text)) return 'en';
  
  return 'unknown';
};

/**
 * Extracts keywords from text
 */
export const extractKeywords = (text: string, maxKeywords: number = 10): string[] => {
  const stopWords = new Set([
    'ir', 'kad', 'kai', 'kur', 'kas', 'dėl', 'su', 'į', 'iš', 'apie', 'kaip',
    'turi', 'yra', 'buvo', 'bet', 'ar', 'tai', 'čia', 'prie', 'nuo', 'šis',
    'tas', 'jie', 'mes', 'pas', 'per', 'po', 'tik', 'the', 'and', 'of', 'to'
  ]);
  
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));
  
  const frequency: Record<string, number> = {};
  for (const word of words) {
    frequency[word] = (frequency[word] || 0) + 1;
  }
  
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
};

/**
 * Compares two texts for similarity (simple Jaccard index)
 */
export const textSimilarity = (text1: string, text2: string): number => {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
};

/**
 * Wraps text at specified width
 */
export const wrapText = (text: string, width: number): string[] => {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    if ((currentLine + word).length <= width) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  
  if (currentLine) lines.push(currentLine);
  return lines;
};

/**
 * Converts text to reading time estimate
 */
export const estimateReadingTime = (text: string, wordsPerMinute: number = 200): number => {
  const words = countWords(text);
  return Math.ceil(words / wordsPerMinute);
};

/**
 * Formats a number with Lithuanian suffix
 */
export const formatLithuanianNumber = (num: number, singular: string, plural: string, pluralGenitive: string): string => {
  const lastDigit = num % 10;
  const lastTwoDigits = num % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return `${num} ${pluralGenitive}`;
  }
  
  if (lastDigit === 1) {
    return `${num} ${singular}`;
  }
  
  if (lastDigit >= 2 && lastDigit <= 9) {
    return `${num} ${plural}`;
  }
  
  return `${num} ${pluralGenitive}`;
};