import React, { useState, useCallback, useEffect } from 'react';
import { Search, Filter, X, ChevronDown, Book, Tag, Calendar } from 'lucide-react';
import { semanticSearch, SearchResult, SearchFilters } from '../../services/semanticSearch';
import { getKnowledgeBase } from '../../data/knowledgeBase';
import { debounce } from '../../services/performance';
import { useTheme } from '../../context/ThemeContext';

interface AdvancedSearchProps {
  onResults: (results: SearchResult[]) => void;
  onClose: () => void;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ onResults, onClose }) => {
  const { isDark } = useTheme();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Available filter options (would come from actual data)
  const availableSources = ['Biblija', 'Katekizmas', 'Enciklika', 'Šventųjų raštai'];
  const availableBooks = ['Mato', 'Markaus', 'Luko', 'Jono', 'Apostolų darbų'];
  const contentTypes = [
    { value: 'BIBLE', label: 'Biblija' },
    { value: 'CATECHISM', label: 'Katekizmas' },
    { value: 'ENCYCLICAL', label: 'Enciklika' },
    { value: 'SAINT', label: 'Šventųjų raštai' },
    { value: 'COMMENTARY', label: 'Komentarai' }
  ];

  const performSearch = useCallback(
    debounce(async (searchQuery: string, searchFilters: SearchFilters) => {
      if (!searchQuery.trim()) {
        onResults([]);
        return;
      }

      setIsLoading(true);

      try {
        const knowledgeBase = getKnowledgeBase();
        const results = semanticSearch(knowledgeBase, {
          query: searchQuery,
          filters: searchFilters,
          limit: 50,
          fuzzyMatch: true,
          includeContext: true,
          highlightMatches: true
        });

        onResults(results);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [onResults]
  );

  useEffect(() => {
    performSearch(query, filters);
  }, [query, filters, performSearch]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Show suggestions for biblical references
    if (value.length > 2) {
      const biblicalPattern = /\b(mato|markaus|luko|jono|pradžios|psalmių)\s*\d*/i;
      if (biblicalPattern.test(value)) {
        setSuggestions([
          `${value} 1`,
          `${value} 2`,
          `${value} 3`
        ]);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const toggleSource = (source: string) => {
    setFilters(prev => {
      const current = prev.sources || [];
      const updated = current.includes(source)
        ? current.filter(s => s !== source)
        : [...current, source];
      return { ...prev, sources: updated };
    });
  };

  const toggleBook = (book: string) => {
    setFilters(prev => {
      const current = prev.books || [];
      const updated = current.includes(book)
        ? current.filter(b => b !== book)
        : [...current, book];
      return { ...prev, books: updated };
    });
  };

  const toggleContentType = (type: string) => {
    setFilters(prev => {
      const current = prev.contentTypes || [];
      const updated = current.includes(type as any)
        ? current.filter(t => t !== type)
        : [...current, type as any];
      return { ...prev, contentTypes: updated };
    });
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters =
    (filters.sources?.length || 0) > 0 ||
    (filters.books?.length || 0) > 0 ||
    (filters.contentTypes?.length || 0) > 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 backdrop-blur-sm">
      <div className={`rounded-xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-white text-lg font-semibold flex items-center gap-2">
            <Search size={20} />
            Išplėstinė paieška
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={handleQueryChange}
              placeholder="Ieškoti tekstuose..."
              className={`w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:border-amber-500 focus:outline-none text-lg ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-white border-gray-200 text-gray-900'}`}
              autoFocus
            />
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} size={20} />

            {isLoading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-amber-500 border-t-transparent" />
              </div>
            )}

            {/* Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className={`absolute top-full left-0 right-0 border rounded-lg mt-1 shadow-lg z-10 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuery(suggestion);
                      setShowSuggestions(false);
                    }}
                    className={`w-full text-left px-4 py-2 first:rounded-t-lg last:rounded-b-lg ${isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`mt-4 flex items-center gap-2 font-medium ${isDark ? 'text-amber-500 hover:text-amber-400' : 'text-amber-700 hover:text-amber-800'}`}
          >
            <Filter size={18} />
            Filtrai
            {hasActiveFilters && (
              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">
                Aktyvūs
              </span>
            )}
            <ChevronDown
              size={16}
              className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Filters Panel */}
          {showFilters && (
            <div className={`mt-4 p-4 rounded-lg space-y-4 ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
              {/* Sources */}
              <div>
                <h3 className={`font-medium mb-2 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  <Book size={16} />
                  Šaltiniai
                </h3>
                <div className="flex flex-wrap gap-2">
                  {availableSources.map(source => (
                    <button
                      key={source}
                      onClick={() => toggleSource(source)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${filters.sources?.includes(source)
                        ? 'bg-amber-500 text-white'
                        : (isDark ? 'bg-slate-800 border border-slate-600 text-slate-300 hover:border-amber-500' : 'bg-white border border-gray-300 text-gray-700 hover:border-amber-500')
                        }`}
                    >
                      {source}
                    </button>
                  ))}
                </div>
              </div>

              {/* Books */}
              <div>
                <h3 className={`font-medium mb-2 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  <Book size={16} />
                  Knygos
                </h3>
                <div className="flex flex-wrap gap-2">
                  {availableBooks.map(book => (
                    <button
                      key={book}
                      onClick={() => toggleBook(book)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${filters.books?.includes(book)
                        ? 'bg-amber-500 text-white'
                        : (isDark ? 'bg-slate-800 border border-slate-600 text-slate-300 hover:border-amber-500' : 'bg-white border border-gray-300 text-gray-700 hover:border-amber-500')
                        }`}
                    >
                      {book}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Types */}
              <div>
                <h3 className={`font-medium mb-2 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  <Tag size={16} />
                  Turinio tipai
                </h3>
                <div className="flex flex-wrap gap-2">
                  {contentTypes.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => toggleContentType(value)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${filters.contentTypes?.includes(value as any)
                        ? 'bg-amber-500 text-white'
                        : (isDark ? 'bg-slate-800 border border-slate-600 text-slate-300 hover:border-amber-500' : 'bg-white border border-gray-300 text-gray-700 hover:border-amber-500')
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <X size={14} />
                  Išvalyti filtrus
                </button>
              )}
            </div>
          )}

          {/* Search Tips */}
          <div className={`mt-6 text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
            <p className="font-medium mb-1">Paieškos patarimai:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Naudokite kabutes tikslioms frazėms: "Dievo meilė"</li>
              <li>Įveskite biblijinę nuorodą: Mato 5, 3 arba Jn 3, 16</li>
              <li>Paieška palaiko lietuviškas raides ir fuzzy matching</li>
            </ul>
          </div>
        </div>
      </div>
    </div >
  );
};

export default AdvancedSearch;