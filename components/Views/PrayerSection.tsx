import React, { useState, useEffect } from 'react';
import { Heart, Activity, Shield, ChevronDown, ChevronUp, Sparkles, BookOpen, Flame, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  { title: "Neturėk kitų dievų, tik mane vieną.", questions: ["Ar Dievas man yra pirmoje vietoje?", "Ar nepasitikėjau burtais, horoskopais ar prietarais?", "Ar skiriu laiko maldai kasdien?"] },
  { title: "Netark Dievo vardo be reikalo.", questions: ["Ar nepagarbiai tariau Dievo, Marijos ar šventųjų vardus?", "Ar piktžodžiavau?", "Ar laikiausi duotų pažadų Dievui?"] },
  { title: "Švęsk sekmadienį.", questions: ["Ar sekmadieniais ir šventėmis dalyvavau Šv. Mišiose?", "Ar vengiau sunkių darbų sekmadienį?", "Ar skyriau laiko šeimai ir poilsiui?"] },
  { title: "Gerbk savo tėvą ir motiną.", questions: ["Ar gerbiau tėvus, mokytojus ir vyresniuosius?", "Ar padėjau jiems bėdoje?", "Ar rūpinausi savo šeimos nariais?"] },
  { title: "Nežudyk.", questions: ["Ar nekenčiau ko nors savo širdyje?", "Ar kėliau pavojų savo ar kitų sveikatai?", "Ar nebuvau piktas, nepakantus?"] },
  { title: "Nepaleistuvauk.", questions: ["Ar saugojau savo kūno ir minčių skaistumą?", "Ar nežiūrėjau nepadorių vaizdų?", "Ar gerbiau kitą asmenį?"] },
  { title: "Nevok.", contents: ["Ar nepasisavinau svetimo turto?", "Ar sąžiningai dirbau?", "Ar nesugadinau svetimų daiktų?"] },
  { title: "Nekalbėk netiesos.", questions: ["Ar nemelavau?", "Ar neapkalbinėjau kitų?", "Ar nesulaužiau paslapties?"] },
  { title: "Negeisk svetimo vyro/moters.", questions: ["Ar nepuoselėjau nuodėmingų troškimų?", "Ar gerbiau santuokos šventumą?"] },
  { title: "Negeisk svetimo turto.", questions: ["Ar nepavydėjau kitiems sėkmės ar turto?", "Ar mokėjau džiaugtis tuo, ką turiu?"] }
];

const TRADITIONAL_PRAYERS = [
  {
    category: "Pagrindinės",
    items: [
      { name: "Tėve Mūsų", text: "Tėve mūsų, kuris esi danguje! Teesie šventas Tavo vardas, teateinie Tavo Karalystė, teesie Tavo valia kaip danguje, taip ir žemėje. Kasdienės mūsų duonos duok mums šiandien ir atleisk mums mūsų kaltes, kaip ir mes atleidžiame savo kaltininkams. Ir neleisk mūsų gundyti, bet gelbėk mus nuo pikto. Amen." },
      { name: "Sveika Marija", text: "Sveika, Marija, malonės pilnoji! Viešpats su Tavimi. Tu pagirta tarp moterų, ir pagirtas Tavo Sūnus Jėzus. Šventoji Marija, Dievo Motina, melsk už mus, nusidėjėlius, dabar ir mūsų mirties valandą. Amen." },
      { name: "Garbė Dievui Tėvui", text: "Garbė Dievui – Tėvui ir Sūnui, ir Šventajai Dvasiai. Kaip buvo pradžioje, dabar ir visados, ir per amžius. Amen." },
    ]
  },
  {
    category: "Rytinės ir Vakarinės",
    items: [
      { name: "Rytinė Malda", text: "Mano Dieve, aukoju Tau šią dieną visas savo maldas, darbus, džiaugsmus ir kančias. Suteik man malonę šiandien Tavęs neįžeisti, o viską daryti Tavo didesnei garbei ir saugoti mano gyvenimą nuo visokio pikto. Angele Sarge, saugok mane. Amen." },
      { name: "Vakaro Malda", text: "Dėkoju Tau, Viešpatie, už šią dieną, už visas gautas malones ir geradarybes. Atsiprašau už viską, kuo Tave šiandien įžeidžiau mintimis, žodžiais ar darbais. Saugok mus, Viešpatie, budinčius, globok miegančius, kad budėtume su Kristumi ir ilsėtumės ramybėje. Amen." },
      { name: "Angele Sarge", text: "Angele Sarge, mano globėjau, Tu visada būk prie manęs. Apšviesk, saugok, valdyk ir veski mane, nes Dievo esu tau patikėtas. Amen." },
    ]
  },
  {
    category: "Prie Stalo",
    items: [
      { name: "Prieš valgį", text: "Palaimink, Viešpatie, mus ir šias savo dovanas, kurias iš Tavo dosnumo valgysime. Per Kristų, mūsų Viešpatį. Amen." },
      { name: "Po valgio", text: "Dėkojame Tau, Visagalis Dieve, už visas Tavo geradarybes. Tu gyveni ir viešpatauji per amžius. Amen." },
    ]
  }
];

interface PrayerSectionProps {
  onOpenGroups?: () => void;
}

export const PrayerSection: React.FC<PrayerSectionProps> = ({ onOpenGroups }) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'rosary' | 'confession' | 'doctor' | 'lectio' | 'chapel' | 'catalog'>('doctor');
  const [doctorResult, setDoctorResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCommandment, setExpandedCommandment] = useState<number | null>(null);

  // Lectio State
  const [lectioStep, setLectioStep] = useState<'theme' | 'reading' | 'reflection' | 'prayer' | 'contemplation'>('theme');
  const [lectioData, setLectioData] = useState<{ quote: string; ref: string; questions: string[] } | null>(null);

  // Chapel State
  const [candleIntention, setCandleIntention] = useState('');
  const [isCandleLit, setIsCandleLit] = useState(false);
  const [chapelPrayer, setChapelPrayer] = useState<string | null>(null);

  // Strip AI markers from responses
  const stripMarkers = (text: string | undefined | null): string => {
    if (!text) return '';
    return text
      .replace(/\|\|\|\s*SOURCES:[\s\S]*?\|\|\|/g, '')
      .replace(/\|\|\|\s*SUGGESTIONS:[\s\S]*?\|\|\|/g, '')
      .replace(/###\s*/g, '')
      .trim();
  };

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
        Esu katalikas ir šiuo metu išgyvenu šią dvasinę būseną: ${emotion}.
        Prašau, kaip dvasinis palydovas:
        1. Parink VIENĄ gilią ir guodžiančią Šventojo Rašto eilutę (su tikslia nuoroda).
        2. Parašyk trumpą (3-4 sakinių), bet labai gilią ir viltingą maldą/apmąstymą iš Katalikų Bažnyčios tradicijos perspektyvos.
        Formatas: Pirmiausia citata paryškintai, tada malda. Naudok pagarbią, sakralią kalbą.
      `;
      const result = stripMarkers(await generateSimpleContent(prompt));
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
      const result = stripMarkers(await generateSimpleContent(prompt));
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
      const result = stripMarkers(await generateSimpleContent(prompt));
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {[
          { id: 'doctor', label: 'Dvasinis Gydytojas', icon: Heart, color: 'text-red-800 bg-red-50', activeBorder: 'border-red-900/50' },
          { id: 'catalog', label: 'Tradicinės Maldos', icon: Activity, color: 'text-emerald-800 bg-emerald-50', activeBorder: 'border-emerald-900/50' },
          { id: 'lectio', label: 'Lectio Divina', icon: BookOpen, color: 'text-amber-800 bg-amber-50', activeBorder: 'border-amber-900/50' },
          { id: 'rosary', label: 'Šv. Rožinis', icon: Flame, color: 'text-blue-800 bg-blue-50', activeBorder: 'border-blue-900/50' },
          { id: 'confession', label: 'Sąžinės Patikra', icon: Shield, color: 'text-stone-800 bg-stone-100', activeBorder: 'border-stone-600/50' },
          { id: 'chapel', label: 'Intencijų Koplyčia', icon: Sparkles, color: 'text-orange-600 bg-orange-50', activeBorder: 'border-orange-500/50' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-center justify-center text-center gap-2 h-28 group relative overflow-hidden ${activeTab === item.id
              ? `${isDark ? 'bg-slate-800/80 border-slate-700 shadow-lg' : 'bg-white border-stone-200 shadow-md'} ${item.activeBorder} ring-1 ring-opacity-20`
              : `${isDark ? 'bg-slate-900/40 border-slate-800 hover:bg-slate-800/60' : 'bg-white/40 border-stone-100 hover:border-amber-200 hover:bg-white'}`
              }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${item.color} ${isDark ? 'bg-opacity-20' : ''}`}>
              <item.icon size={18} />
            </div>
            <span className={`text-[11px] font-cinzel font-bold uppercase tracking-wider leading-tight ${activeTab === item.id ? (isDark ? 'text-amber-400' : 'text-stone-900') : (isDark ? 'text-slate-400' : 'text-stone-500')}`}>{item.label}</span>
            {activeTab === item.id && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-60" />
            )}
          </button>
        ))}
      </div>

      {onOpenGroups && (
        <div className={`mb-8 rounded-2xl border p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-amber-50/50 border-amber-200'}`}>
          <div>
            <h3 className={`font-cinzel font-bold text-lg ${isDark ? 'text-amber-400' : 'text-amber-900'}`}>Maldų Grupelės</h3>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-stone-600'}`}>
              Dalykitės Biblijos ištraukomis ir maldos intencijomis uždaroje bendruomenėje.
            </p>
          </div>
          <button
            onClick={onOpenGroups}
            className="inline-flex items-center gap-2 rounded-xl bg-red-900 text-amber-50 px-4 py-2.5 text-sm font-semibold hover:bg-red-800 transition-colors"
          >
            Eiti į Maldų grupeles
            <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`rounded-2xl shadow-sm border p-6 md:p-8 min-h-[400px] relative overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-stone-200'}`}>

        {/* === SPIRITUAL DOCTOR === */}
        {activeTab === 'doctor' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center mb-10">
              <h2 className={`font-cinzel font-bold text-3xl mb-3 ${isDark ? 'text-amber-500' : 'text-stone-900'}`}>Dvasinis Gydytojas</h2>
              <p className={`text-base font-serif italic ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>„Ateikite pas mane visi, kurie vargstate...“ (Mt 11, 28)</p>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {EMOTIONS.map((emotion) => (
                <button
                  key={emotion.label}
                  onClick={() => handleSpiritualDoctor(emotion.value)}
                  disabled={isLoading}
                  className={`px-6 py-3 rounded-full border text-sm font-bold uppercase tracking-wider transition-all hover:shadow-md active:scale-95 ${emotion.color} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {emotion.label}
                </button>
              ))}
            </div>

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mb-4 ${isDark ? 'border-amber-500' : 'border-red-900'}`} />
                <p className="font-serif italic text-stone-400 animate-pulse">Ieškoma dvasinio vaisto...</p>
              </div>
            )}

            {doctorResult && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-8 border rounded-3xl p-8 relative shadow-xl overflow-hidden ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-[#fffcf7] border-stone-200'}`}
              >
                <div className="absolute top-0 left-0 w-2 h-full bg-red-900 opacity-20" />
                <div className={`prose max-w-none ${isDark ? 'prose-invert' : 'prose-stone'}`}>
                  <div className={`font-serif text-xl leading-relaxed text-center italic ${isDark ? 'text-slate-200' : 'text-stone-800'}`}>
                    {(() => {
                      // Strip markers
                      let cleanText = doctorResult.split('|||SOURCES')[0].split('|||SUGGESTIONS')[0].trim();

                      // Split into lines
                      const lines = cleanText.split('\n').filter(l => l.trim() !== '');

                      const parseBold = (text: string) => {
                        const parts = text.split(/(\*\*.*?\*\*)/g);
                        return parts.map((part, j) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={j} className={isDark ? 'text-amber-400' : 'text-red-900'}>{part.slice(2, -2)}</strong>;
                          }
                          return part;
                        });
                      };

                      return (
                        <div className="space-y-4">
                          {lines.map((line, i) => (
                            <p key={i} className="whitespace-pre-wrap">{parseBold(line)}</p>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* === TRADITIONAL PRAYERS CATALOG === */}
        {activeTab === 'catalog' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center mb-10">
              <h2 className={`font-cinzel font-bold text-3xl mb-3 ${isDark ? 'text-emerald-500' : 'text-emerald-900'}`}>Tradicinės Maldos</h2>
              <p className={`text-base font-serif italic ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Katalikiškas maldynas ir dvasinis paveldas</p>
            </div>

            <div className="space-y-10">
              {TRADITIONAL_PRAYERS.map((section, sIdx) => (
                <div key={sIdx} className="space-y-4">
                  <h3 className={`font-cinzel font-bold text-lg border-b pb-2 ${isDark ? 'text-emerald-400 border-emerald-900/30' : 'text-emerald-800 border-emerald-100'}`}>
                    {section.category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {section.items.map((prayer, pIdx) => (
                      <div
                        key={pIdx}
                        className={`p-6 rounded-2xl border transition-all hover:shadow-lg ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-stone-200'}`}
                      >
                        <h4 className={`font-cinzel font-bold text-base mb-3 ${isDark ? 'text-amber-500' : 'text-stone-900'}`}>{prayer.name}</h4>
                        <p className={`font-serif text-base leading-relaxed ${isDark ? 'text-slate-300' : 'text-stone-800'}`}>
                          {prayer.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === LECTIO DIVINA === */}
        {activeTab === 'lectio' && (
          <div className="animate-in fade-in duration-300 h-full flex flex-col">
            <div className="text-center mb-10">
              <h2 className={`font-cinzel font-bold text-3xl mb-3 ${isDark ? 'text-amber-500' : 'text-amber-900'}`}>Lectio Divina</h2>
              <p className={`text-base font-serif italic ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Skaityk • Mąstyk • Melskis • Būk</p>
            </div>

            {lectioStep === 'theme' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto w-full mt-4">
                {LECTIO_THEMES.map((theme) => (
                  <button
                    key={theme.label}
                    onClick={() => handleLectioStart(theme.value)}
                    disabled={isLoading}
                    className={`group relative overflow-hidden rounded-2xl border p-8 transition-all text-left shadow-sm hover:shadow-md
                      ${isDark ? 'bg-amber-900/10 border-amber-800/30 hover:bg-amber-900/20' : 'bg-amber-50/30 border-amber-200 hover:bg-amber-50'}`}
                  >
                    <h3 className="font-serif text-xl font-bold text-amber-900 mb-2">{theme.label}</h3>
                    <p className={`text-sm ${isDark ? 'text-amber-700/60' : 'text-amber-800/60'}`}>Meditacija Šventuoju Raštu</p>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-amber-600">
                      <ArrowRight size={24} />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {isLoading && lectioStep === 'theme' && (
              <div className={`absolute inset-0 flex items-center justify-center z-10 backdrop-blur-md ${isDark ? 'bg-slate-900/80' : 'bg-white/80'}`}>
                <div className="text-center">
                  <div className={`w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-6 ${isDark ? 'border-amber-500' : 'border-amber-900'}`} />
                  <p className="font-serif text-2xl text-amber-900 animate-pulse">Atverčiamas Šventasis Raštas...</p>
                </div>
              </div>
            )}

            {lectioStep === 'reading' && lectioData && (
              <div className="flex flex-col items-center justify-center py-4 max-w-2xl mx-auto text-center space-y-8 animate-in slide-in-from-right-8">
                <div className={`p-10 rounded-3xl shadow-xl border w-full relative overflow-hidden ${isDark ? 'bg-amber-900/10 border-amber-800/30' : 'bg-[#fffbf5] border-amber-100'}`}>
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-600 opacity-20" />
                  <h4 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-6">Etapas I: Lectio (Skaitymas)</h4>
                  <p className={`font-serif text-2xl md:text-3xl leading-relaxed italic ${isDark ? 'text-slate-100' : 'text-stone-900'}`}>
                    „{lectioData.quote}“
                  </p>
                  <p className="text-right text-lg font-bold text-amber-900 mt-6">— {lectioData.ref}</p>
                  <p className="mt-8 text-sm text-stone-500 italic">Skaitykite lėtai, galite garsiai. Leiskite žodžiams įsišaknyti.</p>
                </div>

                <button
                  onClick={() => setLectioStep('reflection')}
                  className="bg-amber-900 text-amber-50 px-10 py-4 rounded-full font-bold uppercase tracking-wider hover:bg-amber-800 transition-all shadow-xl flex items-center gap-3 active:scale-95"
                >
                  Meditatio (Mąstymas) <ArrowRight size={18} />
                </button>
              </div>
            )}

            {lectioStep === 'reflection' && lectioData && (
              <div className="flex flex-col items-center justify-center py-4 max-w-2xl mx-auto space-y-8 animate-in slide-in-from-right-8">
                <div className="w-full space-y-4">
                  <h4 className="text-center text-xs font-bold text-amber-600 uppercase tracking-widest mb-4">Etapas II: Meditatio (Mąstymas)</h4>
                  {lectioData.questions.map((q, i) => (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      key={i}
                      className={`border p-6 rounded-2xl shadow-sm ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-stone-200'}`}
                    >
                      <p className={`font-serif text-xl ${isDark ? 'text-slate-200' : 'text-stone-800'}`}>{q}</p>
                    </motion.div>
                  ))}
                </div>

                <div className={`${isDark ? 'bg-amber-900/10 text-slate-400' : 'bg-amber-50 text-stone-600'} p-6 rounded-2xl text-base italic text-center max-w-md border border-amber-500/10`}>
                  Ką šis žodis sako būtent Jums šiandien? Kokie jausmai ar prisiminimai kyla?
                </div>

                <button
                  onClick={() => setLectioStep('prayer')}
                  className="bg-amber-900 text-amber-50 px-10 py-4 rounded-full font-bold uppercase tracking-wider hover:bg-amber-800 transition-all shadow-xl flex items-center gap-3 active:scale-95"
                >
                  Oratio (Malda) <ArrowRight size={18} />
                </button>
              </div>
            )}

            {lectioStep === 'prayer' && (
              <div className="flex flex-col items-center justify-center py-4 max-w-2xl mx-auto space-y-8 animate-in slide-in-from-right-8">
                <div className={`p-10 rounded-3xl shadow-xl border w-full text-center ${isDark ? 'bg-blue-900/10 border-blue-800/20' : 'bg-blue-50/30 border-blue-100'}`}>
                  <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-6">Etapas III: Oratio (Malda)</h4>
                  <p className={`font-serif text-xl leading-relaxed mb-6 ${isDark ? 'text-slate-100' : 'text-stone-800'}`}>
                    Dabar kreipkitės į Dievą savo žodžiais. Padėkokite, paprašykite arba tiesiog išsakykite, kas guli ant širdies po šio skaitymo.
                  </p>
                  <p className="text-sm text-stone-500 italic">Tai Jūsų asmeninis dialogas su Kūrėju.</p>
                </div>

                <button
                  onClick={() => setLectioStep('contemplation')}
                  className="bg-blue-900 text-white px-10 py-4 rounded-full font-bold uppercase tracking-wider hover:bg-blue-800 transition-all shadow-xl flex items-center gap-3 active:scale-95"
                >
                  Contemplatio (Buvimas) <ArrowRight size={18} />
                </button>
              </div>
            )}

            {lectioStep === 'contemplation' && (
              <div className="flex flex-col items-center justify-center py-4 max-w-2xl mx-auto space-y-8 animate-in slide-in-from-right-8 text-center">
                <div className={`p-10 rounded-3xl shadow-xl border w-full ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-stone-200'}`}>
                  <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-6">Etapas IV: Contemplatio (Buvimas)</h4>
                  <p className={`font-serif text-xl leading-relaxed mb-6 ${isDark ? 'text-slate-100' : 'text-stone-800'}`}>
                    Pabūkite tyloje. Tiesiog džiaukitės Dievo buvimu. Nereikia žodžių, nereikia minčių. Tik būkite kartu.
                  </p>
                  <div className="h-px w-16 bg-amber-500 mx-auto my-6 opacity-40" />
                  <p className={`text-base font-serif italic ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>„Ilsėkis Viešpatyje ir pasitikėk Juo.“</p>
                </div>

                <button
                  onClick={() => { setLectioStep('theme'); setLectioData(null); }}
                  className="text-stone-500 hover:text-stone-900 font-bold uppercase tracking-widest text-sm underline underline-offset-8 transition-colors"
                >
                  Užbaigti Lectio Divina
                </button>
              </div>
            )}
          </div>
        )}

        {/* === ROSARY === */}
        {activeTab === 'rosary' && (
          <div className="animate-in fade-in duration-300">
            <div className={`flex flex-col md:flex-row items-center justify-between border-b pb-6 mb-8 gap-4 ${isDark ? 'border-slate-800' : 'border-stone-100'}`}>
              <div className="text-center md:text-left">
                <h2 className={`font-cinzel font-bold text-3xl ${isDark ? 'text-blue-400' : 'text-blue-900'}`}>Šventasis Rožinis</h2>
                <p className={`text-sm font-serif italic ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Meditacija su Marija apie Jėzaus gyvenimą</p>
              </div>
              <span className={`text-xs font-bold uppercase tracking-widest border-2 px-4 py-2 rounded-full ${isDark ? 'text-blue-400 border-blue-900/30 bg-blue-900/10' : 'text-blue-700 border-blue-100 bg-blue-50'}`}>
                {new Date().toLocaleDateString('lt-LT', { weekday: 'long' })}
              </span>
            </div>

            <div className={`rounded-3xl p-8 border mb-8 relative overflow-hidden shadow-xl ${isDark ? 'bg-blue-900/10 border-blue-900/30' : 'bg-[#f8fbff] border-blue-100'}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 blur-[80px] opacity-10" />
              <h3 className="text-2xl font-cinzel text-blue-800 font-bold mb-8 text-center">{mysteryName}</h3>
              <div className="grid grid-cols-1 gap-4">
                {mysteries.map((m, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={i}
                    className={`flex items-center gap-5 p-5 rounded-2xl shadow-sm border transition-all hover:translate-x-2 ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-blue-50'}`}
                  >
                    <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold font-serif text-lg shadow-lg">
                      {i + 1}
                    </span>
                    <span className={`font-serif text-xl ${isDark ? 'text-slate-200' : 'text-stone-800'}`}>{m}</span>
                  </motion.div>
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

            <div className="space-y-4">
              {COMMANDMENTS.map((cmd, index) => (
                <div key={index} className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isDark ? 'border-slate-800 bg-slate-900/40 shadow-sm' : 'border-stone-200 bg-white shadow-sm'}`}>
                  <button
                    onClick={() => setExpandedCommandment(expandedCommandment === index ? null : index)}
                    className={`w-full flex items-center justify-between p-5 text-left transition-colors 
                      ${expandedCommandment === index
                        ? (isDark ? 'bg-amber-900/20' : 'bg-amber-50/50')
                        : (isDark ? 'hover:bg-slate-800/60' : 'hover:bg-stone-50')}`}
                  >
                    <span className={`font-serif text-lg ${isDark ? 'text-slate-200' : 'text-stone-800'}`}>
                      <span className="text-amber-700 font-bold mr-3">{index + 1}.</span> {cmd.title}
                    </span>
                    {expandedCommandment === index ? <ChevronUp size={18} className="text-amber-700" /> : <ChevronDown size={18} className="text-stone-400" />}
                  </button>
                  <AnimatePresence>
                    {expandedCommandment === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className={`p-5 pt-0 border-t space-y-4 pl-12 ${isDark ? 'bg-slate-900/60 border-amber-900/30 text-stone-400' : 'bg-stone-50/50 border-amber-100 text-stone-600'}`}>
                          <p className={`italic font-serif text-sm pt-4 border-l-2 border-amber-500/30 pl-4 ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>Klausimai sąžinės tyrimui:</p>
                          <ul className="space-y-3">
                            {(cmd.questions || cmd.contents || []).map((q: string, i: number) => (
                              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                                <span className="text-amber-600 font-bold">•</span>
                                <span>{q}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === CHAPEL / CANDLE === */}
        {activeTab === 'chapel' && (
          <div className="animate-in fade-in duration-500 flex flex-col items-center justify-center min-h-[450px] py-10">
            {!isCandleLit ? (
              <div className="text-center w-full max-w-lg space-y-8">
                <div className="space-y-4">
                  <h2 className={`font-cinzel font-bold text-4xl mb-4 ${isDark ? 'text-orange-400' : 'text-orange-900'}`}>Intencijų Koplyčia</h2>
                  <p className={`text-lg font-serif italic ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>„Prašykite, ir jums bus duota...“</p>
                </div>

                <div className="relative group cursor-pointer" onClick={handleLightCandle}>
                  <div className={`p-12 rounded-full w-56 h-56 mx-auto flex items-center justify-center mb-10 border-4 shadow-2xl transition-all duration-700 group-hover:bg-orange-900/10 ${isDark ? 'bg-orange-900/10 border-orange-900/30' : 'bg-orange-50/50 border-orange-100'}`}>
                    <Flame size={80} className={`transition-all duration-700 ${candleIntention.trim() ? 'text-orange-500 opacity-60 scale-110' : 'text-stone-300 opacity-30'}`} />
                  </div>
                  {candleIntention.trim() && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-orange-500 rounded-full blur-[60px] opacity-10 pointer-events-none"
                    />
                  )}
                </div>

                <div className="max-w-md mx-auto space-y-6">
                  <p className={`font-serif text-lg ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>Kokia intencija norėtumėte uždegti žvakę?</p>
                  <input
                    type="text"
                    value={candleIntention}
                    onChange={(e) => setCandleIntention(e.target.value)}
                    placeholder="PVZ.: UŽ ŠEIMOS SVEIKATĄ..."
                    className={`w-full border-b bg-transparent py-4 px-2 text-center focus:outline-none focus:border-orange-500 transition-colors font-cinzel text-xl uppercase tracking-widest ${isDark ? 'border-orange-900/50 text-slate-100 placeholder-slate-700' : 'border-orange-200 placeholder-stone-300'}`}
                  />

                  <button
                    onClick={handleLightCandle}
                    disabled={!candleIntention.trim() || isLoading}
                    className={`w-full bg-orange-700 text-white px-10 py-5 rounded-2xl font-bold uppercase tracking-widest hover:bg-orange-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-2xl relative overflow-hidden group`}
                  >
                    <span className="relative z-10">{isLoading ? 'Uždegama...' : 'Uždegti Šventą Žvakę'}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-800 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center w-full max-w-xl animate-in zoom-in duration-1000 space-y-10">
                <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
                  {/* Candle Halos */}
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute inset-0 bg-orange-500 rounded-full blur-[80px]"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="absolute inset-8 bg-orange-400 rounded-full blur-[40px]"
                  />

                  <div className="relative">
                    <Flame size={120} className="text-orange-500 drop-shadow-[0_0_20px_rgba(249,115,22,0.8)] animate-pulse" fill="currentColor" />
                    <motion.div
                      animate={{ y: [-2, 2, -2], opacity: [0.6, 0.9, 0.6] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-8 bg-orange-300 blur-sm rounded-full"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className={`font-cinzel font-bold text-3xl ${isDark ? 'text-slate-100' : 'text-stone-800'}`}>Žvakė uždegta</h3>
                  <p className={`text-xl font-serif italic ${isDark ? 'text-orange-400/80' : 'text-orange-900/70'}`}>„{candleIntention}“</p>
                </div>

                {chapelPrayer && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`border-y py-8 px-6 relative ${isDark ? 'bg-slate-900/40 border-orange-900/30' : 'bg-[#fffcf7] border-orange-100'}`}
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-inherit px-4">
                      <Sparkles size={20} className="text-orange-500" />
                    </div>
                    <p className={`font-serif text-2xl leading-relaxed italic ${isDark ? 'text-slate-200' : 'text-orange-950/80'}`}>
                      {chapelPrayer}
                    </p>
                  </motion.div>
                )}

                <button
                  onClick={() => { setIsCandleLit(false); setCandleIntention(''); setChapelPrayer(null); }}
                  className="font-cinzel text-sm font-bold uppercase tracking-widest text-stone-400 hover:text-orange-600 transition-colors border-b border-transparent hover:border-orange-600 pb-1"
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
