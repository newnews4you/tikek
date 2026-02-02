import React, { useCallback, useState, useEffect } from 'react';
import { Upload, Trash2, Database, CheckCircle, AlertCircle, Loader2, Lock, RefreshCw, Download, Copy, FileCode, TrendingUp, DollarSign, Calculator, ArrowRightLeft, Code, BarChart3 } from 'lucide-react';
import { addDocumentToKnowledgeBase, getStats, resetKnowledgeBase } from '../../data/knowledgeBase';
import { TokenStatistics } from '../Admin/TokenStatistics';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';

export const DataManager: React.FC = () => {
  const [stats, setStats] = useState(getStats());
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ msg: string; type: 'success' | 'error' | 'loading' } | null>(null);
  const [isCheckingDB, setIsCheckingDB] = useState(false);

  // Converter State
  const [convertedData, setConvertedData] = useState<{ fileName: string; content: string } | null>(null);

  useEffect(() => {
    // Initialize PDF.js worker
    const lib = (pdfjsLib as any).default || pdfjsLib;
    if (typeof window !== 'undefined' && lib.GlobalWorkerOptions) {
      lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    handleRefreshStats();
    const timer = setTimeout(handleRefreshStats, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleRefreshStats = () => {
    setIsCheckingDB(true);
    setTimeout(() => {
      setStats(getStats());
      setIsCheckingDB(false);
    }, 300);
  };

  const handleReset = async () => {
    if (window.confirm("DĖMESIO: Tai ištrins visą naršyklėje įkeltą duomenų bazę. Tęsti?")) {
      await resetKnowledgeBase();
      handleRefreshStats();
      setUploadStatus({ msg: "Duomenų bazė sėkmingai išvalyta.", type: 'success' });
    }
  };

  const extractTextFromPDF = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    try {
      const lib = (pdfjsLib as any).default || pdfjsLib;
      const loadingTask = lib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';
      const maxPages = Math.min(pdf.numPages, 100);

      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += `--- Puslapis ${i} ---\n${pageText}\n\n`;
      }
      return fullText;
    } catch (error: any) {
      console.error("PDF Extraction Error:", error);
      throw new Error("Nepavyko nuskaityti PDF.");
    }
  };

  // --- DB UPLOAD LOGIC ---
  const processFileForDB = async (file: File) => {
    setUploadStatus({ msg: `Įkeliama į saugyklą: ${file.name}...`, type: 'loading' });
    try {
      let text = '';
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        text = await extractTextFromPDF(arrayBuffer);
      } else {
        text = await file.text();
        if (file.name.endsWith('.ts')) {
          text = text.replace(/export\s+const\s+\w+\s*=\s*[`'"]/g, '').replace(/[`'"];?\s*$/g, '');
        }
      }

      if (!text || text.trim().length === 0) throw new Error("Failas tuščias.");

      let type: 'Biblija' | 'Katekizmas' | 'Kita' = 'Kita';
      const nameLower = file.name.toLowerCase();
      if (nameLower.includes('biblija') || nameLower.includes('testament')) type = 'Biblija';
      else if (nameLower.includes('katekizmas') || nameLower.includes('kbk')) type = 'Katekizmas';

      await addDocumentToKnowledgeBase(file.name, text, type);

      setUploadStatus({ msg: `Sėkmingai išsaugota: ${file.name}.`, type: 'success' });
      handleRefreshStats();

    } catch (err: any) {
      setUploadStatus({ msg: `Klaida: ${err.message}`, type: 'error' });
    }
  };

  // --- CONVERTER LOGIC ---
  const generateTsContent = (fileName: string, rawText: string) => {
    const baseName = fileName.replace(/\.[^/.]+$/, "");
    const varName = baseName.toUpperCase().replace(/[^A-Z0-9]/g, '_') + '_TEXT';
    const safeText = rawText.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
    return `// Sugeneruota iš failo: ${fileName}
export const ${varName} = \`
${safeText}
\`;
`;
  };

  const processFileForConversion = async (file: File) => {
    setUploadStatus({ msg: `Konvertuojama: ${file.name}...`, type: 'loading' });
    try {
      let text = '';
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        text = await extractTextFromPDF(arrayBuffer);
      } else {
        text = await file.text();
      }
      const tsContent = generateTsContent(file.name, text);
      const tsFileName = file.name.replace(/\.[^/.]+$/, "") + '.ts';
      setConvertedData({ fileName: tsFileName, content: tsContent });
      setUploadStatus({ msg: `Failas paruoštas: ${tsFileName}`, type: 'success' });
    } catch (err: any) {
      setUploadStatus({ msg: `Konvertavimo klaida: ${err.message}`, type: 'error' });
    }
  };

  const onConvertFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFileForConversion(e.target.files[0]);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(processFileForDB);
  }, []);

  const downloadTsFile = () => {
    if (!convertedData) return;
    const blob = new Blob([convertedData.content], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = convertedData.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- COST CALCULATION (Gemini 3 Flash Logic) ---
  const PRICING = {
    input: 0.075, // $0.075 per 1M tokens
    output: 0.30, // $0.30 per 1M tokens
    eurRate: 0.92 // Approx USD to EUR
  };

  const USAGE = {
    inputTokens: 4500, // Context (3.5k) + System (0.5k) + History (0.5k)
    outputTokens: 600  // Average comprehensive theological response
  };

  const costInput = (USAGE.inputTokens / 1000000) * PRICING.input;
  const costOutput = (USAGE.outputTokens / 1000000) * PRICING.output;
  const totalCostUSD = costInput + costOutput;
  const totalCostEUR = totalCostUSD * PRICING.eurRate;

  const formattedCost = totalCostEUR.toFixed(5);
  const runsPerEuro = Math.floor(1 / totalCostEUR);

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12 animate-in fade-in duration-500 bg-red-50/30 min-h-full">

      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 border border-red-200 shadow-sm">
          <Lock size={12} /> Admin Zona
        </div>
      </div>

      <div className="text-center mb-8">
        <h2 className="font-cinzel font-bold text-3xl text-stone-900 mb-3 flex items-center justify-center gap-3">
          <Database size={28} className="text-red-900" />
          Duomenų Centras
        </h2>
        <p className="text-stone-600 font-serif max-w-2xl mx-auto">
          Valdykite žinių bazę ir stebėkite sistemos veikimo sąnaudas.
        </p>
      </div>

      {/* === TOKEN STATISTICS === */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
            <BarChart3 size={20} className="text-amber-600" />
            Gemini API Naudojimo Statistika
          </h3>
          <span className="text-xs text-stone-500">Realūs duomenys iš API atsakymų</span>
        </div>
        <TokenStatistics />
      </div>

      {/* === STATIC COST ESTIMATE (for reference) === */}
      <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 mb-8">
        <p className="text-xs text-stone-500 text-center">
          Žemiau pateikiamas teorinis įvertinimas: ~{formattedCost}€ už vieną vidutinę užklausą (įskaitant embeddings generavimą).
        </p>
      </div>

      {/* Status Message */}
      {uploadStatus && (
        <div className={`max-w-3xl mx-auto p-4 rounded-xl mb-8 flex items-center gap-3 border ${uploadStatus.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' :
            uploadStatus.type === 'loading' ? 'bg-amber-50 text-amber-800 border-amber-200' :
              'bg-red-50 text-red-800 border-red-200'
          }`}>
          {uploadStatus.type === 'success' && <CheckCircle size={20} />}
          {uploadStatus.type === 'error' && <AlertCircle size={20} />}
          {uploadStatus.type === 'loading' && <Loader2 size={20} className="animate-spin" />}
          <span className="font-medium">{uploadStatus.msg}</span>
        </div>
      )}

      {/* === TOOLS GRID === */}
      <div className="grid lg:grid-cols-2 gap-8 mb-12">

        {/* 1. TS CONVERTER TOOL */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-lg overflow-hidden flex flex-col">
          <div className="bg-stone-900 text-stone-100 p-4 flex items-center gap-3 border-b border-stone-700">
            <div className="bg-stone-800 p-2 rounded-lg">
              <FileCode size={20} className="text-green-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm">TS Generatorius (Cloudflare/Public)</h3>
              <p className="text-[10px] text-stone-400">PDF → .ts kodo failas</p>
            </div>
          </div>

          <div className="p-6 flex-1 flex flex-col">
            <p className="text-xs text-stone-500 mb-4 leading-relaxed">
              Sugeneruokite failą, kurį įkelsite į <code>data/library</code>. Tai užtikrins, kad visi vartotojai matys šiuos duomenis be jokių papildomų DB sąnaudų.
            </p>

            {!convertedData ? (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-stone-300 rounded-xl p-8 hover:bg-stone-50 hover:border-stone-400 cursor-pointer transition-all h-40">
                <FileCode size={32} className="text-stone-300 mb-2" />
                <span className="text-xs font-bold text-stone-600">Pasirinkti PDF/TXT konvertavimui</span>
                <input type="file" className="hidden" accept=".pdf,.txt" onChange={onConvertFileSelect} />
              </label>
            ) : (
              <div className="flex-1 flex flex-col h-full">
                <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 mb-4 flex-1 overflow-hidden relative">
                  <pre className="text-[10px] font-mono text-stone-700 overflow-auto h-32 w-full whitespace-pre-wrap">
                    {convertedData.content.slice(0, 500)}...
                  </pre>
                  <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-stone-50 to-transparent"></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={downloadTsFile} className="flex-1 bg-green-700 hover:bg-green-600 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                    <Download size={14} /> Atsisiųsti .ts
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(convertedData.content); alert("Nukopijuota!"); }} className="flex-1 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                    <Copy size={14} /> Kopijuoti
                  </button>
                  <button onClick={() => setConvertedData(null)} className="px-3 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg">
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. BROWSER DB UPLOAD */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-lg overflow-hidden flex flex-col">
          <div className="bg-red-900 text-stone-100 p-4 flex items-center gap-3 border-b border-red-800">
            <div className="bg-red-800 p-2 rounded-lg">
              <Database size={20} className="text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Vietinė DB (Testavimui)</h3>
              <p className="text-[10px] text-red-200">Veikia tik šioje naršyklėje</p>
            </div>
          </div>

          <div
            className={`p-6 flex-1 flex flex-col transition-all ${isDragging ? 'bg-red-50' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
          >
            <p className="text-xs text-stone-500 mb-4 leading-relaxed">
              Įkelkite failus greitam patikrinimui. Jie bus saugomi IndexedDB jūsų kompiuteryje.
            </p>

            <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-stone-300 rounded-xl p-6 hover:bg-stone-50 hover:border-red-400 cursor-pointer transition-all">
              <div className="w-10 h-10 bg-red-50 text-red-900 rounded-full flex items-center justify-center mb-2">
                <Upload size={20} />
              </div>
              <span className="text-xs font-bold text-stone-700">Įkelti į IndexedDB</span>
              <input type="file" className="hidden" multiple accept=".txt,.pdf,.ts" onChange={(e) => { if (e.target.files) Array.from(e.target.files).forEach(processFileForDB); }} />
            </label>
          </div>
        </div>

      </div>

      {/* Stats List */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="bg-stone-50 px-6 py-4 border-b border-stone-200 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-stone-800 flex items-center gap-2">
              <Database size={18} className="text-stone-500" />
              Visi Aktyvūs Dokumentai
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">Viso fragmentų: {stats.totalChunks}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleRefreshStats} disabled={isCheckingDB} className="text-xs bg-white border border-stone-200 hover:bg-stone-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
              <RefreshCw size={14} className={isCheckingDB ? 'animate-spin' : ''} /> Atnaujinti
            </button>
            <button onClick={handleReset} className="text-xs text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors border border-transparent hover:border-red-200">
              <Trash2 size={14} /> Valyti DB
            </button>
          </div>
        </div>

        <div className="divide-y divide-stone-100 max-h-[300px] overflow-y-auto">
          {stats.documents.length === 0 ? (
            <div className="p-8 text-center text-stone-400 italic">
              Dokumentų nėra.
            </div>
          ) : (
            stats.documents.map((doc, idx) => {
              const isStatic = doc === "Evangelija pagal Matą" || doc === "Evangelija pagal Joną" || doc.includes("Katekizmas (Ištrauka)");
              return (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-stone-400 font-mono text-xs">{idx + 1}.</span>
                    <div>
                      <span className="font-medium text-stone-700 text-sm">{doc}</span>
                      <div className="flex gap-2 mt-0.5">
                        {isStatic ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1">
                            <Code size={10} /> Kodo failas (.ts)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 flex items-center gap-1">
                            <CheckCircle size={10} /> Naršyklės DB
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};