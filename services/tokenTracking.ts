/**
 * Token Tracking Service
 * Tracks real token usage from Gemini API responses
 * Stores history, calculates averages, and provides statistics
 */

export interface TokenUsageEntry {
  timestamp: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUSD: number;
  costEUR: number;
  query: string;
  model: string;
}

export interface UsageStatistics {
  totalQueries: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCostUSD: number;
  totalCostEUR: number;
  averageInputTokens: number;
  averageOutputTokens: number;
  averageCostPerQuery: number;
  queriesPerEuro: number;
  last24Hours: {
    queries: number;
    costEUR: number;
  };
  last7Days: {
    queries: number;
    costEUR: number;
  };
  last30Days: {
    queries: number;
    costEUR: number;
  };
}

// Pricing (per 1M tokens)
const PRICING = {
  // Gemini 1.5 Flash
  'gemini-1.5-flash': {
    input: 0.075,
    output: 0.30
  },
  // Gemini 1.5 Pro
  'gemini-1.5-pro': {
    input: 1.25,
    output: 5.00
  },
  // Text Embedding 004
  'text-embedding-004': {
    input: 0.025,
    output: 0 // Embeddings have no output tokens in the same sense
  },
  // Fallback / Legacy (Gemini 3 Flash Preview as placeholder)
  'default': {
    input: 0.075,
    output: 0.30
  },
  eurRate: 0.92 // Approx USD to EUR
};

const STORAGE_KEY = 'gemini_token_usage_history';
const MAX_HISTORY_ENTRIES = 1000;

/**
 * Get all stored token usage history
 */
export const getTokenUsageHistory = (): TokenUsageEntry[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading token usage history:', error);
  }
  return [];
};

/**
 * Save token usage history to localStorage
 */
const saveTokenUsageHistory = (history: TokenUsageEntry[]): void => {
  try {
    // Keep only the most recent entries
    const trimmed = history.slice(-MAX_HISTORY_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error saving token usage history:', error);
  }
};

/**
 * Record a new token usage entry
 */
export const recordTokenUsage = (
  inputTokens: number,
  outputTokens: number,
  query: string = '',
  model: string = 'gemini-1.5-flash'
): TokenUsageEntry => {
  const totalTokens = inputTokens + outputTokens;

  // Determine pricing based on model
  let modelPricing;
  if (model.includes('embedding')) {
    modelPricing = PRICING['text-embedding-004'];
  } else if (model.includes('pro')) {
    modelPricing = PRICING['gemini-1.5-pro'];
  } else {
    modelPricing = PRICING['gemini-1.5-flash'] || PRICING['default'];
  }

  const costInput = (inputTokens / 1000000) * modelPricing.input;
  const costOutput = (outputTokens / 1000000) * modelPricing.output;
  const costUSD = costInput + costOutput;
  const costEUR = costUSD * PRICING.eurRate;

  const entry: TokenUsageEntry = {
    timestamp: Date.now(),
    inputTokens,
    outputTokens,
    totalTokens,
    costUSD,
    costEUR,
    query: query.slice(0, 100), // Store only first 100 chars of query
    model
  };

  const history = getTokenUsageHistory();
  history.push(entry);
  saveTokenUsageHistory(history);

  return entry;
};

/**
 * Calculate comprehensive usage statistics
 */
export const calculateUsageStatistics = (): UsageStatistics => {
  const history = getTokenUsageHistory();
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  const totalQueries = history.length;

  if (totalQueries === 0) {
    return {
      totalQueries: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      totalCostUSD: 0,
      totalCostEUR: 0,
      averageInputTokens: 0,
      averageOutputTokens: 0,
      averageCostPerQuery: 0,
      queriesPerEuro: 0,
      last24Hours: { queries: 0, costEUR: 0 },
      last7Days: { queries: 0, costEUR: 0 },
      last30Days: { queries: 0, costEUR: 0 }
    };
  }

  const totalInputTokens = history.reduce((sum, entry) => sum + entry.inputTokens, 0);
  const totalOutputTokens = history.reduce((sum, entry) => sum + entry.outputTokens, 0);
  const totalTokens = totalInputTokens + totalOutputTokens;
  const totalCostUSD = history.reduce((sum, entry) => sum + entry.costUSD, 0);
  const totalCostEUR = history.reduce((sum, entry) => sum + entry.costEUR, 0);

  // Calculate time-based statistics
  const last24h = history.filter(e => now - e.timestamp < oneDay);
  const last7d = history.filter(e => now - e.timestamp < 7 * oneDay);
  const last30d = history.filter(e => now - e.timestamp < 30 * oneDay);

  return {
    totalQueries,
    totalInputTokens,
    totalOutputTokens,
    totalTokens,
    totalCostUSD,
    totalCostEUR,
    averageInputTokens: Math.round(totalInputTokens / totalQueries),
    averageOutputTokens: Math.round(totalOutputTokens / totalQueries),
    averageCostPerQuery: totalCostEUR / totalQueries,
    queriesPerEuro: totalCostEUR > 0 ? Math.floor(1 / totalCostEUR * totalQueries) : 0,
    last24Hours: {
      queries: last24h.length,
      costEUR: last24h.reduce((sum, e) => sum + e.costEUR, 0)
    },
    last7Days: {
      queries: last7d.length,
      costEUR: last7d.reduce((sum, e) => sum + e.costEUR, 0)
    },
    last30Days: {
      queries: last30d.length,
      costEUR: last30d.reduce((sum, e) => sum + e.costEUR, 0)
    }
  };
};

/**
 * Get token usage data for chart visualization
 */
export const getTokenUsageForChart = (days: number = 7): { date: string; tokens: number; cost: number }[] => {
  const history = getTokenUsageHistory();
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  const result: { date: string; tokens: number; cost: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const dayStart = now - (i + 1) * oneDay;
    const dayEnd = now - i * oneDay;

    const dayEntries = history.filter(e => e.timestamp >= dayStart && e.timestamp < dayEnd);
    const dayTokens = dayEntries.reduce((sum, e) => sum + e.totalTokens, 0);
    const dayCost = dayEntries.reduce((sum, e) => sum + e.costEUR, 0);

    const date = new Date(dayStart);
    const dateStr = `${date.getDate()}/${date.getMonth() + 1}`;

    result.push({
      date: dateStr,
      tokens: dayTokens,
      cost: dayCost
    });
  }

  return result;
};

/**
 * Clear all token usage history
 */
export const clearTokenUsageHistory = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * Get pricing constants
 */
export const getPricing = () => ({ ...PRICING });
