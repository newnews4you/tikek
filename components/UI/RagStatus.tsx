import React, { useEffect, useState } from 'react';
import { RagState } from '../../types';
import { Search, Sparkles, Database, BookOpen, Scroll } from 'lucide-react';

interface RagStatusProps {
  state: RagState;
}

export const RagStatus: React.FC<RagStatusProps> = ({ state }) => {
  const [activeSource, setActiveSource] = useState<string>('');

  useEffect(() => {
    if (state === RagState.RETRIEVING) {
      const sources = [
        'Vietinių failų saugyklą...', 
        'Šventąjį Raštą (data/knowledgeBase)...', 
        'Katekizmą (KBK)...', 
        'Įkeltus dokumentus...'
      ];
      let i = 0;
      const interval = setInterval(() => {
        setActiveSource(sources[i]);
        i = (i + 1) % sources.length;
      }, 700);
      return () => clearInterval(interval);
    }
  }, [state]);

  if (state === RagState.IDLE) return null;

  return (
    <div className="flex justify-center my-4">
      <div className="bg-white border border-stone-200 rounded-full px-5 py-2 shadow-sm flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-[90%]">
        
        {state === RagState.RETRIEVING && (
          <>
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-green-200 rounded-full opacity-30 animate-ping"></div>
              <Database size={16} className="text-green-700 relative z-10" />
            </div>
            <span className="text-stone-600 text-sm font-medium font-serif truncate">
              Nuskaitoma: <span className="text-green-700 font-semibold">{activeSource}</span>
            </span>
          </>
        )}

        {state === RagState.ANALYZING && (
          <>
            <Scroll size={16} className="text-blue-700 animate-pulse flex-shrink-0" />
            <span className="text-stone-600 text-sm font-medium font-serif">
              Tikrinamas faktų atitikimas...
            </span>
          </>
        )}

        {state === RagState.GENERATING && (
          <>
            <Sparkles size={16} className="text-red-700 animate-spin-slow flex-shrink-0" />
            <span className="text-stone-600 text-sm font-medium font-serif">
              Formuluojamas atsakymas pagal šaltinius...
            </span>
          </>
        )}
      </div>
    </div>
  );
};