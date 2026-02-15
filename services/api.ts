/**
 * Academic API Service
 * RESTful API interface for researchers and academic integration
 */

import { KnowledgeChunk } from '../data/knowledgeBase';
import { SearchResult, SearchOptions, semanticSearch } from './semanticSearch';
import { AnalysisResult, analyzeContext } from './contextualAnalysis';

// API Configuration
const API_BASE_URL = '/api/v1';
const API_VERSION = '1.0.0';

// Rate limiting
const RATE_LIMIT_REQUESTS = 100;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimits: Map<string, RateLimitEntry> = new Map();

/**
 * API Response types
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    total?: number;
    page?: number;
    perPage?: number;
    version: string;
    timestamp: string;
  };
}

export interface SearchRequest {
  query: string;
  filters?: {
    sources?: string[];
    books?: string[];
    dateRange?: { start?: string; end?: string };
    contentTypes?: string[];
  };
  options?: {
    limit?: number;
    offset?: number;
    fuzzyMatch?: boolean;
    includeContext?: boolean;
    highlightMatches?: boolean;
  };
}

export interface AnalysisRequest {
  text: string;
  includeCitations?: boolean;
  includeCrossReferences?: boolean;
  includeParallelTexts?: boolean;
  includeThemes?: boolean;
}

export interface ExportRequest {
  format: 'json' | 'csv' | 'xml' | 'bibtex' | 'ris';
  data: 'search' | 'analysis' | 'annotations';
  ids?: string[];
}

export interface CorpusStats {
  totalDocuments: number;
  totalWords: number;
  sources: Array<{
    name: string;
    documentCount: number;
    wordCount: number;
  }>;
  books: Array<{
    name: string;
    source: string;
    chapterCount: number;
    wordCount: number;
  }>;
  lastUpdated: string;
}

/**
 * Checks rate limit for an API key
 */
const checkRateLimit = (apiKey: string): boolean => {
  const now = Date.now();
  const entry = rateLimits.get(apiKey);
  
  if (!entry || now > entry.resetTime) {
    rateLimits.set(apiKey, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_REQUESTS) {
    return false;
  }
  
  entry.count++;
  return true;
};

/**
 * Creates a standardized API response
 */
const createResponse = <T>(
  success: boolean,
  data?: T,
  error?: ApiResponse<T>['error'],
  meta?: Partial<ApiResponse<T>['meta']>
): ApiResponse<T> => ({
  success,
  ...(data !== undefined && { data }),
  ...(error && { error }),
  meta: {
    version: API_VERSION,
    timestamp: new Date().toISOString(),
    ...meta
  }
});

/**
 * Validates API key
 */
const validateApiKey = (apiKey: string): boolean => {
  // In production, validate against database
  // For now, accept any non-empty key
  return apiKey.length >= 16;
};

/**
 * Search endpoint
 * POST /api/v1/search
 */
export const apiSearch = async (
  apiKey: string,
  request: SearchRequest,
  knowledgeBase: KnowledgeChunk[]
): Promise<ApiResponse<SearchResult[]>> => {
  // Validate API key
  if (!validateApiKey(apiKey)) {
    return createResponse(false, undefined, {
      code: 'UNAUTHORIZED',
      message: 'Invalid or missing API key'
    });
  }
  
  // Check rate limit
  if (!checkRateLimit(apiKey)) {
    return createResponse(false, undefined, {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded. Please try again later.'
    });
  }
  
  // Validate request
  if (!request.query || request.query.trim().length === 0) {
    return createResponse(false, undefined, {
      code: 'INVALID_REQUEST',
      message: 'Query parameter is required'
    });
  }
  
  try {
    const searchOptions: SearchOptions = {
      query: request.query,
      filters: request.filters ? {
        sources: request.filters.sources,
        books: request.filters.books,
        dateRange: request.filters.dateRange,
        contentTypes: request.filters.contentTypes as any
      } : undefined,
      limit: request.options?.limit || 20,
      offset: request.options?.offset || 0,
      fuzzyMatch: request.options?.fuzzyMatch ?? true,
      includeContext: request.options?.includeContext ?? true,
      highlightMatches: request.options?.highlightMatches ?? true
    };
    
    const results = semanticSearch(knowledgeBase, searchOptions);
    
    return createResponse(true, results, undefined, {
      total: results.length,
      page: Math.floor((searchOptions.offset || 0) / (searchOptions.limit || 20)) + 1,
      perPage: searchOptions.limit
    });
  } catch (error) {
    return createResponse(false, undefined, {
      code: 'INTERNAL_ERROR',
      message: 'An error occurred while processing your request',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Analysis endpoint
 * POST /api/v1/analyze
 */
export const apiAnalyze = async (
  apiKey: string,
  request: AnalysisRequest,
  knowledgeBase: KnowledgeChunk[]
): Promise<ApiResponse<AnalysisResult>> => {
  // Validate API key
  if (!validateApiKey(apiKey)) {
    return createResponse(false, undefined, {
      code: 'UNAUTHORIZED',
      message: 'Invalid or missing API key'
    });
  }
  
  // Check rate limit
  if (!checkRateLimit(apiKey)) {
    return createResponse(false, undefined, {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded. Please try again later.'
    });
  }
  
  // Validate request
  if (!request.text || request.text.trim().length === 0) {
    return createResponse(false, undefined, {
      code: 'INVALID_REQUEST',
      message: 'Text parameter is required'
    });
  }
  
  try {
    const result = analyzeContext(request.text, knowledgeBase);
    
    // Filter results based on request options
    const filteredResult: AnalysisResult = {
      citations: request.includeCitations !== false ? result.citations : [],
      crossReferences: request.includeCrossReferences !== false ? result.crossReferences : [],
      parallelTexts: request.includeParallelTexts !== false ? result.parallelTexts : [],
      themes: request.includeThemes !== false ? result.themes : [],
      keyTerms: result.keyTerms
    };
    
    return createResponse(true, filteredResult);
  } catch (error) {
    return createResponse(false, undefined, {
      code: 'INTERNAL_ERROR',
      message: 'An error occurred while processing your request',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Corpus statistics endpoint
 * GET /api/v1/corpus/stats
 */
export const apiGetCorpusStats = async (
  apiKey: string,
  knowledgeBase: KnowledgeChunk[]
): Promise<ApiResponse<CorpusStats>> => {
  // Validate API key
  if (!validateApiKey(apiKey)) {
    return createResponse(false, undefined, {
      code: 'UNAUTHORIZED',
      message: 'Invalid or missing API key'
    });
  }
  
  // Check rate limit
  if (!checkRateLimit(apiKey)) {
    return createResponse(false, undefined, {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded. Please try again later.'
    });
  }
  
  try {
    // Calculate statistics
    const sources = new Map<string, { documentCount: number; wordCount: number }>();
    const books = new Map<string, { source: string; chapterCount: number; wordCount: number }>();
    let totalWords = 0;
    
    for (const chunk of knowledgeBase) {
      const wordCount = chunk.content.split(/\s+/).length;
      totalWords += wordCount;
      
      // Source stats
      if (!sources.has(chunk.source)) {
        sources.set(chunk.source, { documentCount: 0, wordCount: 0 });
      }
      const sourceStats = sources.get(chunk.source)!;
      sourceStats.documentCount++;
      sourceStats.wordCount += wordCount;
      
      // Book stats
      const bookKey = `${chunk.source}-${chunk.bookOrSection}`;
      if (!books.has(bookKey)) {
        books.set(bookKey, {
          source: chunk.source,
          chapterCount: 0,
          wordCount: 0
        });
      }
      const bookStats = books.get(bookKey)!;
      bookStats.chapterCount++;
      bookStats.wordCount += wordCount;
    }
    
    const stats: CorpusStats = {
      totalDocuments: knowledgeBase.length,
      totalWords,
      sources: Array.from(sources.entries()).map(([name, stats]) => ({
        name,
        documentCount: stats.documentCount,
        wordCount: stats.wordCount
      })),
      books: Array.from(books.entries()).map(([key, stats]) => ({
        name: key.split('-')[1],
        source: stats.source,
        chapterCount: stats.chapterCount,
        wordCount: stats.wordCount
      })),
      lastUpdated: new Date().toISOString()
    };
    
    return createResponse(true, stats);
  } catch (error) {
    return createResponse(false, undefined, {
      code: 'INTERNAL_ERROR',
      message: 'An error occurred while processing your request',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Export endpoint
 * POST /api/v1/export
 */
export const apiExport = async (
  apiKey: string,
  request: ExportRequest,
  data: any
): Promise<ApiResponse<{ content: string; filename: string; mimeType: string }>> => {
  // Validate API key
  if (!validateApiKey(apiKey)) {
    return createResponse(false, undefined, {
      code: 'UNAUTHORIZED',
      message: 'Invalid or missing API key'
    });
  }
  
  // Check rate limit
  if (!checkRateLimit(apiKey)) {
    return createResponse(false, undefined, {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded. Please try again later.'
    });
  }
  
  try {
    let content: string;
    let filename: string;
    let mimeType: string;
    
    const timestamp = new Date().toISOString().split('T')[0];
    
    switch (request.format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        filename = `export-${timestamp}.json`;
        mimeType = 'application/json';
        break;
      
      case 'csv':
        content = convertToCSV(data);
        filename = `export-${timestamp}.csv`;
        mimeType = 'text/csv';
        break;
      
      case 'xml':
        content = convertToXML(data);
        filename = `export-${timestamp}.xml`;
        mimeType = 'application/xml';
        break;
      
      case 'bibtex':
        content = convertToBibTeX(data);
        filename = `export-${timestamp}.bib`;
        mimeType = 'application/x-bibtex';
        break;
      
      case 'ris':
        content = convertToRIS(data);
        filename = `export-${timestamp}.ris`;
        mimeType = 'application/x-research-info-systems';
        break;
      
      default:
        return createResponse(false, undefined, {
          code: 'INVALID_FORMAT',
          message: 'Unsupported export format'
        });
    }
    
    return createResponse(true, { content, filename, mimeType });
  } catch (error) {
    return createResponse(false, undefined, {
      code: 'INTERNAL_ERROR',
      message: 'An error occurred while processing your request',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Converts data to CSV format
 */
const convertToCSV = (data: any[]): string => {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }
  
  const headers = Object.keys(data[0]);
  const rows = data.map(item => 
    headers.map(header => {
      const value = item[header];
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
};

/**
 * Converts data to XML format
 */
const convertToXML = (data: any): string => {
  const convert = (obj: any, indent: string = ''): string => {
    if (Array.isArray(obj)) {
      return obj.map((item, i) => 
        `${indent}<item index="${i}">\n${convert(item, indent + '  ')}${indent}</item>\n`
      ).join('');
    }
    
    if (typeof obj === 'object' && obj !== null) {
      return Object.entries(obj).map(([key, value]) => {
        const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
        if (typeof value === 'object' && value !== null) {
          return `${indent}<${safeKey}>\n${convert(value, indent + '  ')}${indent}</${safeKey}>\n`;
        }
        return `${indent}<${safeKey}>${escapeXml(String(value))}</${safeKey}>\n`;
      }).join('');
    }
    
    return `${indent}${escapeXml(String(obj))}\n`;
  };
  
  return `<?xml version="1.0" encoding="UTF-8"?>\n<data>\n${convert(data)}</data>`;
};

/**
 * Escapes XML special characters
 */
const escapeXml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/**
 * Converts data to BibTeX format
 */
const convertToBibTeX = (data: any[]): string => {
  if (!Array.isArray(data)) return '';
  
  return data.map((item, i) => {
    const entries = Object.entries(item)
      .map(([key, value]) => `  ${key} = {${value}}`)
      .join(',\n');
    
    return `@misc{reference${i},\n${entries}\n}`;
  }).join('\n\n');
};

/**
 * Converts data to RIS format
 */
const convertToRIS = (data: any[]): string => {
  if (!Array.isArray(data)) return '';
  
  return data.map(item => {
    const lines: string[] = ['TY  - GEN'];
    
    for (const [key, value] of Object.entries(item)) {
      const risKey = key.substring(0, 2).toUpperCase();
      lines.push(`${risKey}  - ${value}`);
    }
    
    lines.push('ER  -');
    return lines.join('\n');
  }).join('\n\n');
};

/**
 * API Documentation
 */
export const API_DOCUMENTATION = {
  version: API_VERSION,
  baseUrl: API_BASE_URL,
  endpoints: [
    {
      path: '/search',
      method: 'POST',
      description: 'Search the text corpus with semantic relevance scoring',
      parameters: {
        query: 'string (required) - Search query',
        filters: {
          sources: 'string[] - Filter by source',
          books: 'string[] - Filter by book/section',
          contentTypes: 'string[] - Filter by content type'
        },
        options: {
          limit: 'number - Results per page (default: 20)',
          offset: 'number - Pagination offset',
          fuzzyMatch: 'boolean - Enable fuzzy matching (default: true)',
          includeContext: 'boolean - Include surrounding context (default: true)',
          highlightMatches: 'boolean - Highlight matching terms (default: true)'
        }
      }
    },
    {
      path: '/analyze',
      method: 'POST',
      description: 'Analyze text for citations, cross-references, and themes',
      parameters: {
        text: 'string (required) - Text to analyze',
        includeCitations: 'boolean - Include citation detection',
        includeCrossReferences: 'boolean - Include cross-references',
        includeParallelTexts: 'boolean - Include parallel text detection',
        includeThemes: 'boolean - Include theme extraction'
      }
    },
    {
      path: '/corpus/stats',
      method: 'GET',
      description: 'Get corpus statistics and metadata'
    },
    {
      path: '/export',
      method: 'POST',
      description: 'Export data in various academic formats',
      parameters: {
        format: 'string (required) - json, csv, xml, bibtex, or ris',
        data: 'string (required) - Type of data to export',
        ids: 'string[] - Specific IDs to export'
      }
    }
  ],
  authentication: {
    type: 'API Key',
    header: 'X-API-Key',
    description: 'Include your API key in the X-API-Key header'
  },
  rateLimiting: {
    requests: RATE_LIMIT_REQUESTS,
    window: '1 minute',
    description: 'Rate limits are applied per API key'
  }
};

/**
 * Generates API documentation in OpenAPI format
 */
export const generateOpenAPISpec = (): object => {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Tikėjimo Šviesa Academic API',
      version: API_VERSION,
      description: 'API for accessing religious and theological text corpus with advanced search and analysis capabilities'
    },
    servers: [
      {
        url: API_BASE_URL,
        description: 'Production server'
      }
    ],
    paths: {
      '/search': {
        post: {
          summary: 'Search corpus',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    query: { type: 'string' },
                    filters: { type: 'object' },
                    options: { type: 'object' }
                  },
                  required: ['query']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Search results',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { type: 'array' },
                      meta: { type: 'object' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/analyze': {
        post: {
          summary: 'Analyze text',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    text: { type: 'string' },
                    includeCitations: { type: 'boolean' },
                    includeCrossReferences: { type: 'boolean' },
                    includeParallelTexts: { type: 'boolean' },
                    includeThemes: { type: 'boolean' }
                  },
                  required: ['text']
                }
              }
            }
          }
        }
      }
    }
  };
};