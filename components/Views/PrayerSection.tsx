import React, { useState, useEffect } from 'react';
import { Heart, Activity, Shield, ChevronDown, ChevronUp, Sparkles, BookOpen, Flame, ArrowRight, X } from 'lucide-react';
import { generateSimpleContent } from '../../services/geminiService';
import { useTheme } from '../../context/ThemeContext';

const EMOTIONS = [
  { label: 'Nerimas', value: 'nerimą ir baimę', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { label: 'Liūdesys', value: 'gilų liūdesį ir vienatvę', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { label: 'Pyktis', value: 'pyktį ir nuoskaudą', color: 'bg-red-100 text-red-800 border-red-200' },
  { label: 'Dėkingumas', value: 'dėkingumą Dievui', color: 'bg-green-100 text-green-800 border-green-200' },
];

const LECTIO_THEMES = [
  { label: 'Ramybė', value: 'ramybė ir pasitikėjimas Dievu' },
  { label: 'Atleidimas', value: 'atleidimas sau ir kitiems' },
  { label: 'Viltis', value: 'viltis sunkumuose' },
  { label: 'Meilė', value: 'artimo meilė ir tarnystė' },
];

const COMMANDMENTS = [
  "Neturėk kitų dievų, tik mane vieną.",
  "Netark Dievo vardo be reikalo.",
  "Švęsk sekmadienį.",
  "Gerbk savo tėvą ir motiną.",
  "Nežudyk.",
  "Nepaleistuvauk.",
  "Nevok.",
  "Nekalbėk netiesos.",
  "Negeisk svetimo vyro/moters.",
  "Negeisk svetimo turto."
];

export const PrayerSection: React.FC = () => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'rosary' | 'confession' | 'doctor' | 'lectio' | 'chapel'>('doctor');
  const [doctorResult, setDoctorResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCommandment, setExpandedCommandment] = useState<number | null>(null);

  // Lectio State
  const [lectioStep, setLectioStep] = useState<'theme' | 'reading' | 'reflection'>('theme');
  const [lectioData, setLectioData] = useState<{ quote: string; ref: string; questions: string[] } | null>(null);

  // Chapel State
  const [candleIntention, setCandleIntention] = useState('');
  const [isCandleLit, setIsCandleLit] = useState(false);
  const [chapelPrayer, setChapelPrayer] = useState<string | null>(null);

  // Rosary Logic
  const dayOfWeek = new Date().getDay();
  let mysteryName = "";
  let mysteries: string[] = [];

  switch (dayOfWeek) {
    case 1: case 6:
      mysteryName = "Džiaugsmingieji Slėpiniai (Gaudiosa)";
      mysteries = ["Apreiškimas Švč. Mergelei Marijai", "Apsilankymas pas Elzbietą", "Jėzaus gimimas", "Paaukojimas šventykloje", "Atradimas šventykloje"];
      break;
    case 2: case 5:
      mysteryName = "Skausmingieji Slėpiniai (Dolorosa)";
      mysteries = ["Malda Alyvų sode", "Nuplakimas", "Vainikavimas erškėčiais", "Kryžiaus nešimas", "Nukryžiavimas"];
      break;
    case 3: case 0:
      mysteryName = "Garbingieji Slėpiniai (Gloriosa)";
      mysteries = ["Prisikėlimas", "Dangun įžengimas", "Šventosios Dvasios atsiuntimas", "Marijos ėmimas į dangų", "Marijos vainikavimas"];
      break;
    case 4:
      mysteryName = "Šviesos Slėpiniai (Luminosa)";
      mysteries = ["Krikštas Jordane", "Vestuvės Kanoje", "Karalystės skelbimas", "Atsimainymas", "Eucharistijos įsteigimas"];
      break;
  }

  const handleSpiritualDoctor = async (emotion: string) => {
    setIsLoading(true);
    setDoctorResult(null);
    try {
      const prompt = `
        Esu katalikas ir šiuo metu jaučiu ${emotion}.
        Prašau:
        1. Pacituok VIENĄ guodžiančią eilutę iš Šventojo Rašto (su tikslia nuoroda).
        2. Parašyk labai trumpą (2-3 sakinių) maldą.
        Formatas: Pirmiausia citata paryškintai, tada malda.
      `;
      const result = await generateSimpleContent(prompt);
      setDoctorResult(result || "Atsiprašau, nepavyko sugeneruoti maldos.");
    } catch (e: any) {
      console.error(e);
      const errStr = JSON.stringify(e);
      if (errStr.includes("403") || errStr.includes("leaked")) {
        setDoctorResult("⚠️ API RAKTO KLAIDA: Jūsų raktas užblokuotas. Pakeiskite jį.");
      } else {
        setDoctorResult("Įvyko klaida. Prašau bandyti vėliau.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLectioStart = async (theme: string) => {
    setIsLoading(true);
    setLectioData(null);
    try {
      const prompt = `
        Paruošk trumpą Lectio Divina (Šventojo Rašto skaitymą) tema: "${theme}".
        
        Pateik atsakymą tiksliu formatu:
        CITATA: [Šventojo Rašto eilutės tekstas]
        NUORODA: [Evangelija Skyrius, Eilutės]
        KLAUSIMAI:
        - [Klausimas apmąstymui 1]
        - [Klausimas apmąstymui 2]
      `;
      const result = await generateSimpleContent(prompt);
      if (result) {
        const quoteMatch = result.match(/CITATA:\s*(.+)/);
        const refMatch = result.match(/NUORODA:\s*(.+)/);
        const questionsMatch = result.match(/KLAUSIMAI:\s*([\s\S]+)/);

        const questions = questionsMatch
          ? questionsMatch[1].split('\n').map(q => q.trim().replace(/^-\s*/, '')).filter(q => q.length > 0)
          : ["Ką Dievas man šiandien kalba per šį žodį?"];

        setLectioData({
          quote: quoteMatch ? quoteMatch[1] : result,
          ref: refMatch ? refMatch[1] : "Šventasis Raštas",
          questions: questions
        });
        setLectioStep('reading');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLightCandle = async () => {
    if (!candleIntention.trim()) return;
    setIsLoading(true);
    setIsCandleLit(true);
    try {
      const prompt = `Parašyk labai trumpą (1 sakinys) užtarimo maldą šiai intencijai: "${candleIntention}".`;
      const result = await generateSimpleContent(prompt);
      setChapelPrayer(result);
    } catch (e) {
      setChapelPrayer("Viešpatie, išklausyk mūsų maldą.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Navigation Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {[
          { id: 'doctor', label: 'Dvasinis Gydytojas', icon: Heart, color: 'text-red-800 bg-red-100', activeBorder: 'border-red-900' },
          { id: 'lectio', label: 'Lectio Divina', icon: BookOpen, color: 'text-amber-800 bg-amber-100', activeBorder: 'border-amber-900' },
          { id: 'rosary', label: 'Šv. Rožinis', icon: Activity, color: 'text-blue-800 bg-blue-100', activeBorder: 'border-blue-900' },
          { id: 'confession', label: 'Sąžinės Patikra', icon: Shield, color: 'text-stone-800 bg-stone-200', activeBorder: 'border-stone-600' },
          { id: 'chapel', label: 'Intencijų Koplyčia', icon: Flame, color: 'text-orange-600 bg-orange-100', activeBorder: 'border-orange-500' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col items-center justify-center text-center gap-2 h-24 ${activeTab === item.id
                ? `${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'} ${item.activeBorder} shadow-md ring-1 ring-opacity-20`
                : `${isDark ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800' : 'bg-white/60 border-stone-200 hover:border-amber-300 hover:bg-white'}`
              }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.color}`}>
              <item.icon size={16} />
            </div>
            <span className={`text-[11px] font-bold uppercase tracking-wide leading-tight ${isDark ? 'text-slate-400' : 'text-stone-600'}`}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className={`rounded-2xl shadow-sm border p-6 md:p-8 min-h-[400px] relative overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-stone-200'}`}>

        {/* === SPIRITUAL DOCTOR === */}
        {activeTab === 'doctor' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center mb-8">
              <h2 className={`font-cinzel font-bold text-2xl mb-2 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>Kaip šiandien jaučiatės?</h2>
              <p className={`text-sm font-serif italic ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>„Ateikite pas mane visi, kurie vargstate...“</p>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {EMOTIONS.map((emotion) => (
                <button
                  key={emotion.label}
                  onClick={() => handleSpiritualDoctor(emotion.value)}
                  disabled={isLoading}
                  className={`px-5 py-2.5 rounded-full border text-sm font-medium transition-transform hover:scale-105 active:scale-95 ${emotion.color} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {emotion.label}
                </button>
              ))}
            </div>

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Sparkles className="text-amber-500 animate-spin-slow mb-3" size={32} />
                <p className="text-sm text-stone-400 animate-pulse">Ieškoma paguodos žodžių...</p>
              </div>
            )}

            {doctorResult && !isLoading && (
              <div className={`mt-8 border rounded-xl p-6 relative animate-in zoom-in-95 duration-300 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-[#faf9f6] border-stone-200'}`}>
                <div className={`prose text-center max-w-none ${isDark ? 'prose-invert' : 'prose-stone'}`}>
                  <div className={`font-serif text-lg leading-relaxed whitespace-pre-wrap ${isDark ? 'text-slate-200' : 'text-stone-800'}`}>
                    {doctorResult}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* === LECTIO DIVINA === */}
        {activeTab === 'lectio' && (
          <div className="animate-in fade-in duration-300 h-full flex flex-col">
            <div className="text-center mb-6">
              <h2 className="font-cinzel font-bold text-2xl text-amber-900">Lectio Divina</h2>
              <p className="text-stone-500 text-sm mt-1">Dieviškasis skaitymas: Skaityk, Mąstyk, Melskis.</p>
            </div>

            {lectioStep === 'theme' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto w-full mt-4">
                {LECTIO_THEMES.map((theme) => (
                  <button
                    key={theme.label}
                    onClick={() => handleLectioStart(theme.value)}
                    disabled={isLoading}
                    className={`group relative overflow-hidden rounded-xl border p-6 transition-all text-left
                      ${isDark ? 'bg-amber-900/10 border-amber-800/30 hover:bg-amber-900/20' : 'bg-amber-50/50 border-amber-200 hover:bg-amber-100'}`}
                  >
                    <h3 className="font-serif text-lg font-bold text-amber-900 mb-1">{theme.label}</h3>
                    <p className="text-xs text-amber-700/70">Šventasis Raštas</p>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-amber-600">
                      <ArrowRight size={20} />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {isLoading && lectioStep === 'theme' && (
              <div className={`absolute inset-0 flex items-center justify-center z-10 backdrop-blur-sm ${isDark ? 'bg-slate-900/80' : 'bg-white/80'}`}>
                <div className="text-center">
                  <BookOpen className="mx-auto text-amber-600 animate-bounce mb-2" size={32} />
                  <p className="font-serif text-amber-800">Atverčiamas Šventasis Raštas...</p>
                </div>
              </div>
            )}

            {lectioStep === 'reading' && lectioData && (
              <div className="flex flex-col items-center justify-center py-4 max-w-2xl mx-auto text-center space-y-8 animate-in slide-in-from-right-8">
                <div className={`p-8 rounded-lg shadow-inner border w-full ${isDark ? 'bg-amber-900/10 border-amber-800/30' : 'bg-[#fffbf0] border-amber-100'}`}>
                  <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-4">Lectio (Skaitymas)</h4>
                  <p className={`font-serif text-xl md:text-2xl leading-relaxed italic ${isDark ? 'text-slate-200' : 'text-stone-800'}`}>
                    „{lectioData.quote}“
                  </p>
                  <p className="text-right text-sm font-bold text-amber-800 mt-4">— {lectioData.ref}</p>
                </div>

                <button
                  onClick={() => setLectioStep('reflection')}
                  className="bg-amber-900 text-amber-50 px-8 py-3 rounded-full font-medium hover:bg-amber-800 transition-colors shadow-lg flex items-center gap-2"
                >
                  Toliau: Meditatio <ArrowRight size={16} />
                </button>
              </div>
            )}

            {lectioStep === 'reflection' && lectioData && (
              <div className="flex flex-col items-center justify-center py-4 max-w-2xl mx-auto space-y-8 animate-in slide-in-from-right-8">
                <div className="w-full space-y-4">
                  <h4 className="text-center text-xs font-bold text-amber-500 uppercase tracking-widest mb-2">Meditatio (Mąstymas)</h4>
                  {lectioData.questions.map((q, i) => (
                    <div key={i} className={`border p-5 rounded-lg shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-stone-200'}`}>
                      <p className={`font-serif text-lg ${isDark ? 'text-slate-200' : 'text-stone-800'}`}>{q}</p>
                    </div>
                  ))}
                </div>

                <div className={`${isDark ? 'bg-slate-800 text-slate-400' : 'bg-stone-100 text-stone-600'} p-4 rounded-lg text-sm italic text-center max-w-md`}>
                  Dabar tyloje atsakykite sau į šiuos klausimus. Kai būsite pasiruošę, užbaikite maldą žodžiais: „Kalbėk, Viešpatie, tarnas klauso.“
                </div>

                <button
                  onClick={() => setLectioStep('theme')}
                  className="text-stone-500 hover:text-stone-800 underline underline-offset-4"
                >
                  Baigti maldą
                </button>
              </div>
            )}
          </div>
        )}

        {/* === ROSARY === */}
        {activeTab === 'rosary' && (
          <div className="animate-in fade-in duration-300">
            <div className={`flex items-center justify-between border-b pb-4 mb-6 ${isDark ? 'border-slate-800' : 'border-stone-100'}`}>
              <h2 className="font-cinzel font-bold text-2xl text-blue-900">Šios dienos slėpiniai</h2>
              <span className={`text-xs font-bold uppercase tracking-widest border px-2 py-1 rounded ${isDark ? 'text-slate-500 border-slate-700' : 'text-stone-400 border-stone-200'}`}>
                {new Date().toLocaleDateString('lt-LT', { weekday: 'long' })}
              </span>
            </div>

            <div className={`rounded-xl p-6 border mb-6 ${isDark ? 'bg-blue-900/20 border-blue-900/30' : 'bg-blue-50/50 border-blue-100'}`}>
              <h3 className="text-xl font-serif text-blue-800 font-semibold mb-4 text-center">{mysteryName}</h3>
              <div className="space-y-3">
                {mysteries.map((m, i) => (
                  <div key={i} className={`flex items-center gap-4 p-3 rounded-lg shadow-sm border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-blue-50'}`}>
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold font-serif">
                      {i + 1}
                    </span>
                    <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-stone-700'}`}>{m}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* === CONFESSION === */}
        {activeTab === 'confession' && (
          <div className="animate-in fade-in duration-300">
            <div className="text-center mb-6">
              <h2 className={`font-cinzel font-bold text-2xl ${isDark ? 'text-stone-100' : 'text-stone-800'}`}>Sąžinės Patikra</h2>
              <p className={`text-sm mt-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Pagal 10 Dievo Įsakymų</p>
            </div>

            <div className="space-y-2">
              {COMMANDMENTS.map((cmd, index) => (
                <div key={index} className={`border rounded-lg overflow-hidden ${isDark ? 'border-slate-800' : 'border-stone-200'}`}>
                  <button
                    onClick={() => setExpandedCommandment(expandedCommandment === index ? null : index)}
                    className={`w-full flex items-center justify-between p-4 text-left transition-colors 
                      ${expandedCommandment === index
                        ? (isDark ? 'bg-amber-900/20' : 'bg-amber-50')
                        : (isDark ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-white hover:bg-stone-50')}`}
                  >
                    <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-stone-800'}`}><span className="text-amber-700 mr-2">{index + 1}.</span> {cmd}</span>
                    {expandedCommandment === index ? <ChevronUp size={16} className="text-amber-700" /> : <ChevronDown size={16} className="text-stone-400" />}
                  </button>
                  {expandedCommandment === index && (
                    <div className={`p-4 pt-0 border-t text-sm space-y-2 pl-10 ${isDark ? 'bg-slate-900 border-amber-900/30 text-stone-400' : 'bg-stone-50 border-amber-100 text-stone-600'}`}>
                      <p className="italic mb-2 pt-3">Klausimai apmąstymui:</p>
                      <ul className="list-disc space-y-1 pl-4">
                        <li>Ar visada Dievas man buvo pirmoje vietoje?</li>
                        <li>Ar pasitikėjau Dievu sunkumuose?</li>
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === CHAPEL / CANDLE === */}
        {activeTab === 'chapel' && (
          <div className="animate-in fade-in duration-300 flex flex-col items-center justify-center min-h-[400px]">
            {!isCandleLit ? (
              <div className="text-center w-full max-w-md">
                <h2 className="font-cinzel font-bold text-2xl text-orange-900 mb-6">Intencijų Koplyčia</h2>
                <div className={`p-8 rounded-full w-48 h-48 mx-auto flex items-center justify-center mb-8 border-4 shadow-inner ${isDark ? 'bg-orange-900/20 border-orange-900/30' : 'bg-orange-50/50 border-orange-100'}`}>
                  <Flame size={64} className="text-stone-300" />
                </div>

                <p className={`mb-4 font-serif ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>Kokia intencija norėtumėte uždegti žvakę?</p>
                <input
                  type="text"
                  value={candleIntention}
                  onChange={(e) => setCandleIntention(e.target.value)}
                  placeholder="Pvz.: Už sveikatą, už taiką..."
                  className={`w-full border-b-2 bg-transparent py-2 px-4 text-center focus:outline-none focus:border-orange-500 mb-6 font-serif text-lg ${isDark ? 'border-orange-900/50 text-slate-200 placeholder-slate-600' : 'border-orange-200 placeholder-stone-300'}`}
                />

                <button
                  onClick={handleLightCandle}
                  disabled={!candleIntention.trim() || isLoading}
                  className="bg-orange-600 text-white px-8 py-3 rounded-full font-medium hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-orange-200"
                >
                  {isLoading ? 'Uždegama...' : 'Uždegti Žvakę'}
                </button>
              </div>
            ) : (
              <div className="text-center w-full max-w-md animate-in zoom-in duration-700">
                <div className="relative w-48 h-48 mx-auto mb-8 flex items-center justify-center">
                  <div className="absolute inset-0 bg-orange-500 rounded-full blur-[60px] opacity-20 animate-pulse"></div>
                  <Flame size={80} className="text-orange-500 drop-shadow-lg animate-pulse" fill="currentColor" />
                </div>

                <h3 className="font-cinzel font-bold text-xl text-stone-800 mb-2">Žvakė uždegta</h3>
                <p className="text-stone-500 italic mb-6">„{candleIntention}“</p>

                {chapelPrayer && (
                  <div className={`border p-6 rounded-xl shadow-sm mb-8 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-orange-100'}`}>
                    <p className="font-serif text-orange-900 text-lg leading-relaxed">{chapelPrayer}</p>
                  </div>
                )}

                <button
                  onClick={() => { setIsCandleLit(false); setCandleIntention(''); setChapelPrayer(null); }}
                  className="text-stone-400 hover:text-stone-600 text-sm"
                >
                  Uždegti kitą žvakę
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};