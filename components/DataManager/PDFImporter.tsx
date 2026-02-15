import React, { useState, useCallback } from 'react';
import { Upload, FileText, Download, X, Check, Loader2, BookOpen } from 'lucide-react';
import {
  extractTextFromPDF,
  convertPDFToTypeScript,
  generateLocalDocumentEntry,
  processPDFs,
  downloadTypeScriptFile,
  PDFDocument
} from '../../services/pdfProcessor';

interface PDFImporterProps {
  onImportComplete?: () => void;
}

interface ProcessingFile {
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  result?: {
    variableName: string;
    tsContent: string;
    entry: string;
  };
  error?: string;
}

export const PDFImporter: React.FC<PDFImporterProps> = ({ onImportComplete }) => {
  const [files, setFiles] = useState<ProcessingFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    const newFiles: ProcessingFile[] = selectedFiles.map(file => ({
      file,
      status: 'pending',
      progress: 0
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateFileConfig = (index: number, config: Partial<ProcessingFile['result']>) => {
    setFiles(prev => {
      const updated = [...prev];
      if (!updated[index].result) {
        updated[index].result = {
          variableName: '',
          tsContent: '',
          entry: ''
        };
      }
      updated[index].result = { ...updated[index].result!, ...config };
      return updated;
    });
  };

  const processFiles = async () => {
    setIsProcessing(true);
    
    for (let i = 0; i < files.length; i++) {
      setFiles(prev => {
        const updated = [...prev];
        updated[i].status = 'processing';
        return updated;
      });
      
      try {
        const doc = await extractTextFromPDF(files[i].file);
        
        // Auto-generate variable name from filename
        const baseName = files[i].file.name
          .replace('.pdf', '')
          .replace(/\s+/g, '_')
          .toUpperCase();
        const variableName = `${baseName}_TEXT`;
        
        // Auto-detect type
        const type = doc.title.toLowerCase().includes('evangelija') 
          ? 'BIBLE' 
          : doc.title.toLowerCase().includes('katekizmas')
          ? 'CATECHISM'
          : 'OTHER';
        
        const tsContent = convertPDFToTypeScript(doc, {
          variableName,
          bookName: doc.title,
          type: type as any
        });
        
        const entry = generateLocalDocumentEntry(
          variableName,
          doc.title,
          type as any
        );
        
        setFiles(prev => {
          const updated = [...prev];
          updated[i].status = 'completed';
          updated[i].progress = 100;
          updated[i].result = {
            variableName,
            tsContent,
            entry
          };
          return updated;
        });
      } catch (error) {
        setFiles(prev => {
          const updated = [...prev];
          updated[i].status = 'error';
          updated[i].error = error instanceof Error ? error.message : 'Unknown error';
          return updated;
        });
      }
    }
    
    setIsProcessing(false);
    generateCombinedCode();
  };

  const generateCombinedCode = () => {
    const completedFiles = files.filter(f => f.status === 'completed' && f.result);
    
    // Generate imports
    const imports = completedFiles
      .map(f => `import { ${f.result!.variableName} } from './library/${f.result!.variableName.replace('_TEXT', '')}';`)
      .join('\n');
    
    // Generate entries
    const entries = completedFiles
      .map(f => f.result!.entry)
      .join(',\n');
    
    const combinedCode = `// === AUTO-GENERATED FROM PDFs ===
// Copy these imports to data/localDocuments.ts

${imports}

// Add these entries to LOCAL_DOCUMENTS array:
${entries}
`;
    
    setGeneratedCode(combinedCode);
  };

  const downloadAll = () => {
    files.forEach((file, index) => {
      if (file.status === 'completed' && file.result) {
        const fileName = `${file.result.variableName.replace('_TEXT', '')}.ts`;
        downloadTypeScriptFile(file.result.tsContent, fileName);
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Upload size={24} className="text-amber-600" />
        PDF Importavimas
      </h2>
      
      <p className="text-gray-600 mb-6">
        Įkelkite PDF failus ir jie bus automatiškai konvertuoti į TypeScript formatą.
        Po to juos galėsite įkelti į duomenų bazę.
      </p>

      {/* File Upload */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-amber-500 transition-colors">
        <input
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="pdf-upload"
        />
        <label
          htmlFor="pdf-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          <Upload size={48} className="text-gray-400 mb-4" />
          <span className="text-gray-600">
            Spustelėkite norėdami pasirinkti PDF failus
          </span>
          <span className="text-sm text-gray-400 mt-2">
            arba nutempkite juos čia
          </span>
        </label>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="font-medium text-gray-700">Pasirinkti failai:</h3>
          
          {files.map((file, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                file.status === 'completed'
                  ? 'bg-green-50 border-green-200'
                  : file.status === 'error'
                  ? 'bg-red-50 border-red-200'
                  : file.status === 'processing'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-gray-500" />
                <div>
                  <p className="font-medium text-gray-800">{file.file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {file.status === 'pending' && (
                  <span className="text-sm text-gray-500">Laukiama...</span>
                )}
                
                {file.status === 'processing' && (
                  <Loader2 size={20} className="animate-spin text-amber-600" />
                )}
                
                {file.status === 'completed' && (
                  <>
                    <Check size={20} className="text-green-600" />
                    <button
                      onClick={() => downloadTypeScriptFile(
                        file.result!.tsContent,
                        `${file.result!.variableName.replace('_TEXT', '')}.ts`
                      )}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                      title="Atsisiųsti .ts failą"
                    >
                      <Download size={16} />
                    </button>
                  </>
                )}
                
                {file.status === 'error' && (
                  <span className="text-sm text-red-600" title={file.error}>
                    Klaida
                  </span>
                )}
                
                <button
                  onClick={() => removeFile(index)}
                  disabled={isProcessing}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Process Button */}
      {files.length > 0 && files.some(f => f.status === 'pending') && (
        <button
          onClick={processFiles}
          disabled={isProcessing}
          className="mt-6 w-full py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Apdorojama...
            </>
          ) : (
            <>
              <BookOpen size={20} />
              Konvertuoti į TypeScript
            </>
          )}
        </button>
      )}

      {/* Generated Code */}
      {generatedCode && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-700">Sugeneruotas kodas:</h3>
            <button
              onClick={() => copyToClipboard(generatedCode)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Kopijuoti viską
            </button>
          </div>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
            {generatedCode}
          </pre>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Instrukcijos:</h4>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>Atsisiųskite visus .ts failus</li>
              <li>Įkelkite juos į <code>data/library/</code> aplanką</li>
              <li>Pridėkite importus į <code>data/localDocuments.ts</code></li>
              <li>Pridėkite įrašus į <code>LOCAL_DOCUMENTS</code> masyvą</li>
              <li>Perkraukite aplikaciją</li>
            </ol>
          </div>
        </div>
      )}

      {/* Download All Button */}
      {files.some(f => f.status === 'completed') && (
        <button
          onClick={downloadAll}
          className="mt-4 w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
        >
          <Download size={20} />
          Atsisiųsti visus .ts failus
        </button>
      )}
    </div>
  );
};

export default PDFImporter;