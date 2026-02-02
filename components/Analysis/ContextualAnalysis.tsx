import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Link2, 
  Copy, 
  Tag, 
  Quote, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { 
  analyzeContext, 
  AnalysisResult,
  Citation,
  CrossReference,
  ParallelText
} from '../../services/contextualAnalysis';
import { getKnowledgeBase } from '../../data/knowledgeBase';

interface ContextualAnalysisProps {
  text?: string;
  source?: string;
  reference?: string;
}

export const ContextualAnalysis: React.FC<ContextualAnalysisProps> = ({
  text,
  source,
  reference
}) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'citations' | 'crossrefs' | 'parallel' | 'themes'>('citations');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [inputText, setInputText] = useState(text || '');

  useEffect(() => {
    if (!inputText) return;

    setIsLoading(true);
    const knowledgeBase = getKnowledgeBase();
    const result = analyzeContext(inputText, knowledgeBase);
    setAnalysis(result);
    setIsLoading(false);
  }, [inputText]);

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="animate-spin text-amber-600" size={24} />
        <span className="ml-2 text-gray-600">Analizuojama...</span>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <BookOpen size={24} />
          Kontekstinė analizė
        </h2>
        <p className="text-gray-600 mb-4">
          Įveskite tekstą analizei. Sistema automatiškai atpažins citatas, kryžmines nuorodas ir paralelinius tekstus.
        </p>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Įveskite tekstą čia..."
          className="w-full h-40 p-4 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none resize-none"
        />
        <button
          onClick={() => setInputText(inputText)}
          disabled={!inputText.trim()}
          className="mt-4 bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Analizuoti
        </button>
      </div>
    );
  }

  const tabs = [
    { 
      id: 'citations' as const, 
      label: 'Citatos', 
      icon: Quote,
      count: analysis.citations.length 
    },
    { 
      id: 'crossrefs' as const, 
      label: 'Kryžminės nuorodos', 
      icon: Link2,
      count: analysis.crossReferences.length 
    },
    { 
      id: 'parallel' as const, 
      label: 'Lyginamieji tekstai', 
      icon: Copy,
      count: analysis.parallelTexts.length 
    },
    { 
      id: 'themes' as const, 
      label: 'Temų analizė', 
      icon: Tag,
      count: analysis.themes.length 
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4">
        <h2 className="text-white text-lg font-semibold flex items-center gap-2">
          <BookOpen size={20} />
          Kontekstinė analizė
        </h2>
        {source && reference && (
          <p className="text-amber-100 text-sm mt-1">
            {source} {reference}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-amber-700 border-b-2 border-amber-500 bg-amber-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.count > 0 && (
              <span className="bg-gray-200 text-gray-700 text-xs px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6 max-h-[500px] overflow-y-auto">
        {activeTab === 'citations' && (
          <CitationsTab 
            citations={analysis.citations}
            expandedItems={expandedItems}
            onToggle={toggleExpand}
            onCopy={copyToClipboard}
          />
        )}

        {activeTab === 'crossrefs' && (
          <CrossReferencesTab 
            references={analysis.crossReferences}
            expandedItems={expandedItems}
            onToggle={toggleExpand}
          />
        )}

        {activeTab === 'parallel' && (
          <ParallelTextsTab 
            parallels={analysis.parallelTexts}
            expandedItems={expandedItems}
            onToggle={toggleExpand}
          />
        )}

        {activeTab === 'themes' && (
          <ThemesTab 
            themes={analysis.themes}
            keyTerms={analysis.keyTerms}
          />
        )}
      </div>

      {/* Summary footer */}
      <div className="bg-gray-50 border-t border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <span>Aptikta citatų: {analysis.citations.length}</span>
          <span>Kryžminių nuorodų: {analysis.crossReferences.length}</span>
          <span>Lyginamųjų tekstų: {analysis.parallelTexts.length}</span>
          <span>Temos: {analysis.themes.length}</span>
        </div>
      </div>
    </div>
  );
};

// Citations Tab
const CitationsTab: React.FC<{
  citations: Citation[];
  expandedItems: Set<string>;
  onToggle: (id: string) => void;
  onCopy: (content: string) => void;
}> = ({ citations, expandedItems, onToggle, onCopy }) => {
  if (citations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Quote size={32} className="mx-auto mb-2 opacity-50" />
        <p>Citatų nerasta</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {citations.map(citation => {
        const isExpanded = expandedItems.has(citation.id);
        
        return (
          <div
            key={citation.id}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <div
              className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
              onClick={() => onToggle(citation.id)}
            >
              <div className="flex items-center gap-3">
                <Quote size={16} className="text-amber-600" />
                <span className="font-medium text-gray-800">
                  {citation.source} {citation.reference}
                </span>
                <span className="text-xs text-gray-500">
                  ({(citation.confidence * 100).toFixed(0)}%)
                </span>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
            
            {isExpanded && (
              <div className="p-3 bg-white">
                <p className="text-gray-700 italic mb-3">
                  "{citation.text}"
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onCopy(citation.text)}
                    className="text-sm text-amber-700 hover:text-amber-800 flex items-center gap-1"
                  >
                    <Copy size={14} />
                    Kopijuoti
                  </button>
                  <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    <ExternalLink size={14} />
                    Atidaryti
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Cross References Tab
const CrossReferencesTab: React.FC<{
  references: CrossReference[];
  expandedItems: Set<string>;
  onToggle: (id: string) => void;
}> = ({ references, expandedItems, onToggle }) => {
  if (references.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Link2 size={32} className="mx-auto mb-2 opacity-50" />
        <p>Kryžminių nuorodų nerasta</p>
      </div>
    );
  }

  const relationshipLabels: Record<string, string> = {
    direct: 'Tiesioginė',
    thematic: 'Tematinė',
    prophecy: 'Pranašystė',
    quotation: 'Citata',
    allusion: 'Užuomina',
    parallel: 'Paralelis'
  };

  return (
    <div className="space-y-3">
      {references.map(ref => {
        const isExpanded = expandedItems.has(ref.id);
        
        return (
          <div
            key={ref.id}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <div
              className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
              onClick={() => onToggle(ref.id)}
            >
              <div className="flex items-center gap-3">
                <Link2 size={16} className="text-blue-600" />
                <span className="font-medium text-gray-800">
                  {ref.sourceRef}
                </span>
                <span className="text-gray-400">→</span>
                <span className="font-medium text-gray-800">
                  {ref.targetRef}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {relationshipLabels[ref.relationship]}
                </span>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>
            
            {isExpanded && ref.description && (
              <div className="p-3 bg-white">
                <p className="text-gray-700">{ref.description}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${ref.strength * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {(ref.strength * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Parallel Texts Tab
const ParallelTextsTab: React.FC<{
  parallels: ParallelText[];
  expandedItems: Set<string>;
  onToggle: (id: string) => void;
}> = ({ parallels, expandedItems, onToggle }) => {
  if (parallels.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Copy size={32} className="mx-auto mb-2 opacity-50" />
        <p>Lyginamųjų tekstų nerasta</p>
      </div>
    );
  }

  const typeLabels: Record<string, string> = {
    synoptic: 'Sinoptinis',
    thematic: 'Tematinis',
    quotation: 'Citata',
    structural: 'Struktūrinis'
  };

  return (
    <div className="space-y-4">
      {parallels.map(parallel => {
        const isExpanded = expandedItems.has(parallel.id);
        
        return (
          <div
            key={parallel.id}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <div
              className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
              onClick={() => onToggle(parallel.id)}
            >
              <div className="flex items-center gap-3">
                <Copy size={16} className="text-green-600" />
                <span className="font-medium text-gray-800">
                  {typeLabels[parallel.type]} panašumas
                </span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  {(parallel.similarity * 100).toFixed(0)}%
                </span>
              </div>
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            
            {isExpanded && (
              <div className="p-3 bg-white space-y-3">
                {parallel.texts.map((text, idx) => (
                  <div key={idx} className="border-l-4 border-green-400 pl-3">
                    <p className="text-sm text-gray-500 mb-1">
                      {text.source} {text.reference}
                    </p>
                    <p className="text-gray-700 text-sm">{text.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Themes Tab
const ThemesTab: React.FC<{
  themes: string[];
  keyTerms: Array<{ term: string; frequency: number; significance: number }>;
}> = ({ themes, keyTerms }) => {
  return (
    <div className="space-y-6">
      {/* Themes */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Tag size={16} />
          Aptiktos temos
        </h3>
        {themes.length === 0 ? (
          <p className="text-gray-500 text-sm">Temų nerasta</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {themes.map(theme => (
              <span
                key={theme}
                className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm"
              >
                {theme}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Key Terms */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Pagrindinės sąvokos
        </h3>
        {keyTerms.length === 0 ? (
          <p className="text-gray-500 text-sm">Sąvokų nerasta</p>
        ) : (
          <div className="space-y-2">
            {keyTerms.slice(0, 10).map((term, idx) => (
              <div
                key={term.term}
                className="flex items-center gap-3 text-sm"
              >
                <span className="text-gray-400 w-6">{idx + 1}.</span>
                <span className="flex-1 font-medium text-gray-700">
                  {term.term}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${Math.min(term.significance * 10, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right">
                    {term.frequency}x
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContextualAnalysis;