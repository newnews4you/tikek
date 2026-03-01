/**
 * Performance Optimization Service
 * Handles caching, lazy loading, and optimization for large datasets
 */

import { KnowledgeChunk } from '../data/knowledgeBase';

// Cache configuration
const CACHE_PREFIX = 'ts_cache_';
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100; // Maximum number of cached items

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  size: number;
  hits: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  entries: number;
}

// In-memory cache
const memoryCache: Map<string, CacheEntry<any>> = new Map();
let cacheStats: CacheStats = { hits: 0, misses: 0, size: 0, entries: 0 };

/**
 * Generates cache key from query parameters
 */
export const generateCacheKey = (prefix: string, params: Record<string, any>): string => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&');
  return `${CACHE_PREFIX}${prefix}_${sortedParams}`;
};

/**
 * Gets data from cache
 */
export const getFromCache = <T>(key: string): T | null => {
  const entry = memoryCache.get(key);
  
  if (!entry) {
    cacheStats.misses++;
    return null;
  }
  
  // Check if expired
  if (Date.now() - entry.timestamp > DEFAULT_CACHE_TTL) {
    memoryCache.delete(key);
    cacheStats.misses++;
    return null;
  }
  
  entry.hits++;
  cacheStats.hits++;
  return entry.data;
};

/**
 * Sets data in cache with LRU eviction
 */
export const setCache = <T>(key: string, data: T, ttl?: number): void => {
  // Evict oldest entries if cache is full
  if (memoryCache.size >= MAX_CACHE_SIZE) {
    evictOldestEntries(10);
  }
  
  const size = JSON.stringify(data).length;
  
  memoryCache.set(key, {
    data,
    timestamp: Date.now(),
    size,
    hits: 0
  });
  
  cacheStats.entries = memoryCache.size;
  cacheStats.size += size;
};

/**
 * Evicts oldest cache entries
 */
const evictOldestEntries = (count: number): void => {
  const entries = Array.from(memoryCache.entries());
  
  // Sort by timestamp (oldest first)
  entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
  
  // Remove oldest entries
  for (let i = 0; i < Math.min(count, entries.length); i++) {
    const [key, entry] = entries[i];
    cacheStats.size -= entry.size;
    memoryCache.delete(key);
  }
};

/**
 * Clears all cache
 */
export const clearCache = (): void => {
  memoryCache.clear();
  cacheStats = { hits: 0, misses: 0, size: 0, entries: 0 };
};

/**
 * Gets cache statistics
 */
export const getCacheStats = (): CacheStats & { hitRate: number } => {
  const total = cacheStats.hits + cacheStats.misses;
  const hitRate = total > 0 ? cacheStats.hits / total : 0;
  
  return {
    ...cacheStats,
    hitRate
  };
};

/**
 * Virtual scrolling configuration
 */
export interface VirtualScrollConfig {
  itemHeight: number;
  containerHeight: number;
  overscan: number;
  totalItems: number;
}

export interface VirtualScrollResult {
  startIndex: number;
  endIndex: number;
  visibleItems: number;
  offsetY: number;
}

/**
 * Calculates virtual scroll parameters
 */
export const calculateVirtualScroll = (
  scrollTop: number,
  config: VirtualScrollConfig
): VirtualScrollResult => {
  const { itemHeight, containerHeight, overscan, totalItems } = config;
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleItems = Math.ceil(containerHeight / itemHeight) + overscan * 2;
  const endIndex = Math.min(totalItems, startIndex + visibleItems);
  const offsetY = startIndex * itemHeight;
  
  return {
    startIndex,
    endIndex,
    visibleItems: endIndex - startIndex,
    offsetY
  };
};

/**
 * Debounces a function
 */
export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Throttles a function
 */
export const throttle = <T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Creates a web worker for heavy computations
 */
export const createWorker = <T, R>(
  workerFunction: (data: T) => R
): { postMessage: (data: T) => Promise<R>; terminate: () => void } => {
  const workerScript = `
    self.onmessage = function(e) {
      const result = (${workerFunction.toString()})(e.data);
      self.postMessage(result);
    };
  `;
  
  const blob = new Blob([workerScript], { type: 'application/javascript' });
  const worker = new Worker(URL.createObjectURL(blob));
  
  let pendingResolve: ((value: R) => void) | null = null;
  
  worker.onmessage = (e) => {
    if (pendingResolve) {
      pendingResolve(e.data);
      pendingResolve = null;
    }
  };
  
  return {
    postMessage: (data: T): Promise<R> => {
      return new Promise((resolve) => {
        pendingResolve = resolve;
        worker.postMessage(data);
      });
    },
    terminate: () => worker.terminate()
  };
};

/**
 * Lazy loads data in chunks
 */
export const lazyLoad = async <T>(
  items: T[],
  chunkSize: number,
  onChunk: (chunk: T[], index: number) => void,
  delay: number = 0
): Promise<void> => {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    onChunk(chunk, i / chunkSize);
    
    if (delay > 0 && i + chunkSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Creates an intersection observer for lazy loading
 */
export const createLazyLoader = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
): IntersectionObserver => {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '100px',
    threshold: 0.1,
    ...options
  };
  
  return new IntersectionObserver(callback, defaultOptions);
};

/**
 * Preloads data for faster access
 */
export const preloadData = async <T>(
  fetchFn: () => Promise<T>,
  key: string
): Promise<T> => {
  const cached = getFromCache<T>(key);
  if (cached) return cached;
  
  const data = await fetchFn();
  setCache(key, data);
  return data;
};

/**
 * Indexes data for faster searching
 */
export const createSearchIndex = (
  knowledgeBase: KnowledgeChunk[]
): Map<string, Set<string>> => {
  const index = new Map<string, Set<string>>();
  
  for (const chunk of knowledgeBase) {
    // Index words from content
    const words = chunk.content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);
    
    for (const word of words) {
      if (!index.has(word)) {
        index.set(word, new Set());
      }
      index.get(word)!.add(chunk.id || '');
    }
    
    // Index book/section names
    const bookWords = chunk.bookOrSection.toLowerCase().split(/\s+/);
    for (const word of bookWords) {
      if (word.length > 1) {
        if (!index.has(word)) {
          index.set(word, new Set());
        }
        index.get(word)!.add(chunk.id || '');
      }
    }
  }
  
  return index;
};

/**
 * Compresses text data
 */
export const compressData = (data: string): string => {
  // Simple compression using LZ-string like approach
  // In production, use a proper compression library
  try {
    return btoa(unescape(encodeURIComponent(data)));
  } catch {
    return data;
  }
};

/**
 * Decompresses text data
 */
export const decompressData = (data: string): string => {
  try {
    return decodeURIComponent(escape(atob(data)));
  } catch {
    return data;
  }
};

/**
 * Measures function execution time
 */
export const measurePerformance = <T extends (...args: any[]) => any>(
  fn: T,
  name: string
): ((...args: Parameters<T>) => ReturnType<T>) => {
  return (...args: Parameters<T>): ReturnType<T> => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    
    console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
    
    return result;
  };
};

/**
 * Batch processes items with concurrency control
 */
export const batchProcess = async <T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number = 5
): Promise<R[]> => {
  const results: R[] = [];
  const queue = [...items];
  
  const workers = Array(concurrency)
    .fill(null)
    .map(async () => {
      while (queue.length > 0) {
        const item = queue.shift()!;
        const result = await processor(item);
        results.push(result);
      }
    });
  
  await Promise.all(workers);
  return results;
};

/**
 * Memoizes a function
 */
export const memoize = <T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T => {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

/**
 * Monitors memory usage
 */
export const getMemoryUsage = (): {
  used: number;
  total: number;
  limit: number;
} | null => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit
    };
  }
  return null;
};

/**
 * Optimizes large array operations
 */
export const optimizeArrayOperations = {
  // Fast unique filter
  unique: <T>(arr: T[]): T[] => [...new Set(arr)],
  
  // Fast intersection
  intersection: <T>(a: T[], b: T[]): T[] => {
    const setB = new Set(b);
    return a.filter(x => setB.has(x));
  },
  
  // Fast difference
  difference: <T>(a: T[], b: T[]): T[] => {
    const setB = new Set(b);
    return a.filter(x => !setB.has(x));
  },
  
  // Fast group by
  groupBy: <T, K extends string | number>(arr: T[], keyFn: (item: T) => K): Record<K, T[]> => {
    return arr.reduce((acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<K, T[]>);
  }
};

/**
 * Progressive loading for large datasets
 */
export class ProgressiveLoader<T> {
  private items: T[];
  private chunkSize: number;
  private loadedCount: number = 0;
  private isLoading: boolean = false;
  
  constructor(items: T[], chunkSize: number = 100) {
    this.items = items;
    this.chunkSize = chunkSize;
  }
  
  async loadNext(
    onChunk: (items: T[], progress: number) => void,
    delay: number = 0
  ): Promise<boolean> {
    if (this.isLoading || this.loadedCount >= this.items.length) {
      return false;
    }
    
    this.isLoading = true;
    
    const start = this.loadedCount;
    const end = Math.min(start + this.chunkSize, this.items.length);
    const chunk = this.items.slice(start, end);
    
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.loadedCount = end;
    this.isLoading = false;
    
    const progress = this.loadedCount / this.items.length;
    onChunk(chunk, progress);
    
    return this.loadedCount < this.items.length;
  }
  
  reset(): void {
    this.loadedCount = 0;
    this.isLoading = false;
  }
  
  get progress(): number {
    return this.loadedCount / this.items.length;
  }
  
  get hasMore(): boolean {
    return this.loadedCount < this.items.length;
  }
}