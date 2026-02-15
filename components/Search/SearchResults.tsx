import React, { useState } from 'react';
import { FileText, BookOpen, ChevronDown, ChevronUp, ExternalLink, Highlighter } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { SearchResult } from '../../services/semanticSearch';
import { highlightText } from '../../utils/textUtils';

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  onResultClick?: (result: SearchResult) => void;
  onAnnotate?: (result: SearchResult, text: string) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  query,
  onResultClick,
  onAnnotate
}) => {
  const { isDark } = useTheme();
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const [selectedText, setSelectedText] = useState<{ resultId: string; text: string } | null>(null);

  const toggleExpand = (resultId: string) => {
    setExpandedResults(prev => {
      const next = new Set(prev);
      if (next.has(resultId)) {
        next.delete(resultId);
      } else {
        next.add(resultId);
      }
      return next;
    });
  };

  const handleTextSelection = (resultId: string) => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      setSelectedText({ resultId, text: selection.toString() });
    }
  };

  if (results.length === 0) {
    return (
      <div className={`text-center py-12 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
        <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
        <p className="text-lg">Rezultatų nerasta</p>
        <p className="text-sm mt-2">Pabandykite pakeisti paieškos žodžius arba filtrus</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`flex items-center justify-between text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
        <span>Rasta {results.length} rezultatų</span>
        <span className="text-xs">Surūšiuota pagal aktualumą</span>
      </div>

      {results.map((result, index) => {
        const isExpanded = expandedResults.has(result.id);
        const hasHighlights = result.highlights.length > 0;

        return (
          <div
            key={result.id}
            className={`rounded-lg border transition-all shadow-sm hover:shadow-md ${isDark ? 'bg-slate-800 border-slate-700 hover:border-amber-500/50' : 'bg-white border-gray-200 hover:border-amber-300'}`}
          >
            {/* Header */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className={`flex items-center gap-2 text-sm mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    <FileText size={14} />
                    <span>{result.source}</span>
                    <span className={isDark ? 'text-slate-600' : 'text-gray-300'}>•</span>
                    <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{result.bookOrSection}</span>
                    <span className={isDark ? 'text-slate-600' : 'text-gray-300'}>•</span>
                    <span>{result.chapterOrRef}</span>
                  </div>

                  <h3
                    className={`font-semibold cursor-pointer hover:text-amber-600 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}
                    onClick={() => onResultClick?.(result)}
                  >
                    {result.bookOrSection} {result.chapterOrRef}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-amber-900/30 text-amber-500' : 'bg-amber-100 text-amber-800'}`}>
                    {result.score.toFixed(1)}%
                  </span>
                  <button
                    onClick={() => toggleExpand(result.id)}
                    className={`p-1 rounded ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100'}`}
                  >
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>

              {/* Content Preview */}
              <div
                className={`mt-3 leading-relaxed ${isDark ? 'text-slate-300' : 'text-gray-700'}`}
                onMouseUp={() => handleTextSelection(result.id)}
              >
                {isExpanded ? (
                  <div
                    className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}
                    dangerouslySetInnerHTML={{
                      __html: highlightText(result.content, query)
                    }}
                  />
                ) : (
                  <p className="line-clamp-3">
                    {hasHighlights ? (
                      <span
                        dangerouslySetInnerHTML={{
                          __html: result.highlights[0]
                        }}
                      />
                    ) : (
                      result.content.slice(0, 200) + '...'
                    )}
                  </p>
                )}
              </div>

              {/* Context (when expanded) */}
              {isExpanded && (result.context.before || result.context.after) && (
                <div className={`mt-4 p-3 rounded text-sm ${isDark ? 'bg-slate-900/50 text-slate-400' : 'bg-gray-50 text-gray-600'}`}>
                  {result.context.before && (
                    <p className="italic opacity-70 mb-2">
                      ...{result.context.before}
                    </p>
                  )}
                  {result.context.after && (
                    <p className="italic opacity-70">
                      {result.context.after}...
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={() => onResultClick?.(result)}
                  className={`flex items-center gap-1 text-sm font-medium ${isDark ? 'text-amber-500 hover:text-amber-400' : 'text-amber-700 hover:text-amber-800'}`}
                >
                  <ExternalLink size={14} />
                  Atidaryti kontekste
                </button>

                {selectedText?.resultId === result.id && (
                  <button
                    onClick={() => {
                      onAnnotate?.(result, selectedText.text);
                      setSelectedText(null);
                    }}
                    className={`flex items-center gap-1 text-sm font-medium ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                  >
                    <Highlighter size={14} />
                    Pažymėti
                  </button>
                )}

                <div className="flex-1" />

                {/* Metadata */}
                <div className={`flex items-center gap-3 text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                  <span>{result.metadata.wordCount} žodžių</span>
                  {result.metadata.verseRange && (
                    <span>Eil. {result.metadata.verseRange}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Highlights Preview */}
            {!isExpanded && hasHighlights && result.highlights.length > 1 && (
              <div className="px-4 pb-4">
                <div className={`text-xs mb-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Kiti sutapimai:</div>
                <div className="space-y-1">
                  {result.highlights.slice(1, 3).map((highlight, idx) => (
                    <div
                      key={idx}
                      className={`text-sm pl-3 border-l-2 ${isDark ? 'text-slate-400 border-amber-900/50' : 'text-gray-600 border-amber-200'}`}
                      dangerouslySetInnerHTML={{ __html: highlight }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SearchResults;