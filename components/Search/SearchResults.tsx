import React, { useState } from 'react';
import { FileText, BookOpen, ChevronDown, ChevronUp, ExternalLink, Highlighter } from 'lucide-react';
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
      <div className="text-center py-12 text-gray-500">
        <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
        <p className="text-lg">Rezultatų nerasta</p>
        <p className="text-sm mt-2">Pabandykite pakeisti paieškos žodžius arba filtrus</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
        <span>Rasta {results.length} rezultatų</span>
        <span className="text-xs">Surūšiuota pagal aktualumą</span>
      </div>

      {results.map((result, index) => {
        const isExpanded = expandedResults.has(result.id);
        const hasHighlights = result.highlights.length > 0;

        return (
          <div
            key={result.id}
            className="bg-white rounded-lg border border-gray-200 hover:border-amber-300 transition-all shadow-sm hover:shadow-md"
          >
            {/* Header */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <FileText size={14} />
                    <span>{result.source}</span>
                    <span className="text-gray-300">•</span>
                    <span className="font-medium text-gray-700">{result.bookOrSection}</span>
                    <span className="text-gray-300">•</span>
                    <span>{result.chapterOrRef}</span>
                  </div>

                  <h3 
                    className="font-semibold text-gray-900 cursor-pointer hover:text-amber-700"
                    onClick={() => onResultClick?.(result)}
                  >
                    {result.bookOrSection} {result.chapterOrRef}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                    {result.score.toFixed(1)}%
                  </span>
                  <button
                    onClick={() => toggleExpand(result.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>

              {/* Content Preview */}
              <div 
                className="mt-3 text-gray-700 leading-relaxed"
                onMouseUp={() => handleTextSelection(result.id)}
              >
                {isExpanded ? (
                  <div 
                    className="prose prose-sm max-w-none"
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
                <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
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
                  className="flex items-center gap-1 text-sm text-amber-700 hover:text-amber-800 font-medium"
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
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Highlighter size={14} />
                    Pažymėti
                  </button>
                )}

                <div className="flex-1" />

                {/* Metadata */}
                <div className="flex items-center gap-3 text-xs text-gray-500">
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
                <div className="text-xs text-gray-500 mb-2">Kiti sutapimai:</div>
                <div className="space-y-1">
                  {result.highlights.slice(1, 3).map((highlight, idx) => (
                    <div 
                      key={idx}
                      className="text-sm text-gray-600 pl-3 border-l-2 border-amber-200"
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