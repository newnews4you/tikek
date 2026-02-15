import React from 'react';
import { X, Book, Shield, Church, Scroll, Feather, Info, AlertTriangle, AlertOctagon } from 'lucide-react';
import { KNOWLEDGE_SOURCES } from '../../constants';

interface SourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  Book: <Book size={20} />,
  Shield: <Shield size={20} />,
  Church: <Church size={20} />,
  Scroll: <Scroll size={20} />,
  Feather: <Feather size={20} />,
};

export const SourcesModal: React.FC<SourcesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        
        <div className="sticky top-0 bg-white border-b border-stone-100 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="bg-amber-100 p-2 rounded-lg text-amber-800">
              <Info size={20} />
            </div>
            <h2 className="font-cinzel font-bold text-xl text-stone-900">Apie Sistemą ir Šaltinius</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-stone-400 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 space-y-4">
            <div>
                <h3 className="font-bold text-amber-900 mb-2 font-serif">Kaip veikia „Tikėjimo Šviesa“?</h3>
                <p className="text-sm text-stone-700 leading-relaxed font-serif">
                Ši sistema naudoja dirbtinį intelektą (Google Gemini), kuris yra apmokytas naudojant milijonus teologinių tekstų.
                </p>
            </div>

            <div className="bg-white/60 p-3 rounded-lg border border-amber-200/50 text-sm space-y-3">
                <div className="flex gap-3 items-start p-2 bg-red-50/50 rounded border border-red-100">
                    <AlertOctagon size={16} className="mt-0.5 text-red-600 shrink-0" />
                    <div>
                        <span className="font-bold text-red-900 block text-xs uppercase tracking-wider mb-1">Svarbus įspėjimas apie tikslumą:</span>
                        <span className="text-stone-700">
                            Kadangi AI remiasi savo atmintimi, o ne tiesiogine duomenų baze, <strong>gali pasitaikyti netikslumų („haliucinacijų“)</strong>. Modelis gali sugeneruoti tekstą, kuris skamba bibliškai, bet nėra tiksli citata. Rimtoms studijoms visada patikrinkite citatas su oficialiais šaltiniais (pvz., <em>biblija.lt</em> ar <em>katekizmas.lt</em>).
                        </span>
                    </div>
                </div>

                <div className="h-px bg-amber-200/50 w-full" />

                <div className="flex gap-2 items-start">
                    <span className="font-bold text-stone-800 min-w-[80px]">Biblioteka:</span>
                    <span className="text-stone-600 flex items-start gap-1">
                        <AlertTriangle size={14} className="mt-0.5 text-amber-600 shrink-0" />
                        <span>
                            Šioje programėlės versijoje įkeltos tik <strong>pavyzdinės ištraukos</strong> (demonstracinė versija). Tai vienintelė vieta, kur tekstas yra 100% statinis ir patikrintas.
                        </span>
                    </span>
                </div>
            </div>
          </div>

          <div>
            <h3 className="font-cinzel font-bold text-lg text-stone-800 mb-4 border-b border-stone-200 pb-2">
              Naudojami Šaltiniai (AI Žinių Bazė)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {KNOWLEDGE_SOURCES.map((source, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors border border-transparent hover:border-stone-100">
                  <div className="mt-1 text-red-800">
                    {iconMap[source.icon]}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-stone-900">{source.title}</h4>
                    <p className="text-xs text-stone-500 font-serif mt-1">{source.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center pt-4 border-t border-stone-100">
             <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">
               Ad Majorem Dei Gloriam
             </p>
          </div>

        </div>
      </div>
    </div>
  );
};