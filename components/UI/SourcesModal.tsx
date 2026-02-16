import React from 'react';
import { X, Book, Shield, Church, Scroll, Feather, Info, AlertOctagon, Sparkles } from 'lucide-react';
import { KNOWLEDGE_SOURCES } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

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
  const { isDark } = useTheme();
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-stone-900/60 backdrop-blur-md transition-opacity"
          onClick={onClose}
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-stone-200'
            }`}
        >

          <div className={`sticky top-0 border-b p-5 flex items-center justify-between z-10 backdrop-blur-xl ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-stone-100'
            }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-800'}`}>
                <Info size={22} />
              </div>
              <h2 className={`font-cinzel font-bold text-2xl ${isDark ? 'text-white' : 'text-stone-900'}`}>Apie Sistemą</h2>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${isDark ? 'text-slate-500 hover:bg-slate-800 hover:text-white' : 'text-stone-400 hover:bg-stone-100'
                }`}
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6 md:p-8 space-y-10">

            {/* Mission Section */}
            <div className={`rounded-3xl p-6 border relative overflow-hidden ${isDark ? 'bg-amber-900/10 border-amber-900/30 text-slate-300' : 'bg-amber-50/50 border-amber-100 text-stone-700'
              }`}>
              <div className="relative z-10">
                <h3 className={`font-cinzel font-bold text-xl mb-4 ${isDark ? 'text-amber-400' : 'text-amber-900'}`}>Tikėjimo Šviesa</h3>
                <p className="text-base leading-relaxed font-serif italic mb-6">
                  Tai išmanusis katalikiško tikėjimo palydovas, apjungiantis tūkstantmetę Bažnyčios išmintį su pažangiausiomis dirbtinio intelekto technologijomis.
                </p>

                <div className={`p-4 rounded-2xl border flex gap-4 ${isDark ? 'bg-slate-950/50 border-amber-500/20' : 'bg-white border-amber-200'
                  }`}>
                  <AlertOctagon size={20} className="shrink-0 text-amber-600 mt-1" />
                  <div className="text-sm">
                    <strong className={`block uppercase tracking-wider mb-1 ${isDark ? 'text-amber-400' : 'text-amber-900'}`}>Dėmesio dėl tikslumo</strong>
                    <p className={isDark ? 'text-slate-400' : 'text-stone-600'}>
                      Nors sistema remiasi patikimais šaltiniais, AI gali sugeneruoti netikslių interpretacijų („haliucinacijų“). Rimtoms dvasinėms studijoms visada rekomenduojame pasitikslinti su oficialiais Bažnyčios leidiniais.
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute -right-10 -bottom-10 opacity-5">
                <Church size={200} />
              </div>
            </div>

            {/* Knowledge Base */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Sparkles size={18} className="text-amber-500" />
                <h3 className={`font-cinzel font-bold text-lg uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                  AI Žinių Bazė
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {KNOWLEDGE_SOURCES.map((source, idx) => (
                  <div key={idx} className={`flex items-start gap-4 p-5 rounded-2xl border transition-all ${isDark ? 'bg-slate-800/40 border-slate-700 hover:bg-slate-800 hover:border-amber-500/30 text-white' : 'bg-stone-50/50 border-stone-200/60 hover:bg-white hover:shadow-lg text-stone-900'
                    }`}>
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-900 text-amber-500' : 'bg-white text-red-800 shadow-sm'}`}>
                      {iconMap[source.icon]}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm mb-1">{source.title}</h4>
                      <p className={`text-xs font-serif leading-relaxed ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                        {source.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center pt-8 border-t border-stone-100 flex flex-col items-center gap-2">
              <p className={`text-[11px] uppercase tracking-[0.3em] font-bold ${isDark ? 'text-amber-500/60' : 'text-stone-400'}`}>
                Ad Majorem Dei Gloriam
              </p>
              <div className={`h-1 w-12 rounded-full ${isDark ? 'bg-amber-900/50' : 'bg-amber-100'}`} />
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};