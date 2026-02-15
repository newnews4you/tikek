import React, { useState } from 'react';
import { Download, X, FileText, FileSpreadsheet, Code, BookOpen } from 'lucide-react';
import { exportData, ExportData, ExportFormat, downloadExport, getMimeType, getFileExtension } from '../../services/export';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: ExportData;
  title?: string;
}

interface ExportOption {
  format: ExportFormat;
  label: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  data,
  title = 'Eksportuoti duomenis'
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeHighlights, setIncludeHighlights] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const exportOptions: ExportOption[] = [
    {
      format: 'json',
      label: 'JSON',
      description: 'Struktūrizuoti duomenys programavimui',
      icon: <Code size={24} />,
      available: true
    },
    {
      format: 'csv',
      label: 'CSV',
      description: 'Lentelės formatas skaičiuoklėms',
      icon: <FileSpreadsheet size={24} />,
      available: true
    },
    {
      format: 'xml',
      label: 'XML',
      description: 'XML formatas duomenų keitimui',
      icon: <Code size={24} />,
      available: true
    },
    {
      format: 'bibtex',
      label: 'BibTeX',
      description: 'Citavimo formatas akademiniams darbams',
      icon: <BookOpen size={24} />,
      available: true
    },
    {
      format: 'ris',
      label: 'RIS',
      description: 'Research Information Systems formatas',
      icon: <BookOpen size={24} />,
      available: true
    },
    {
      format: 'html',
      label: 'HTML',
      description: 'Skaitymui skirtas HTML dokumentas',
      icon: <FileText size={24} />,
      available: true
    }
  ];

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const content = exportData(data, {
        format: selectedFormat,
        includeMetadata,
        includeHighlights
      });
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `tikejimo-sviesa-export-${timestamp}.${getFileExtension(selectedFormat)}`;
      const mimeType = getMimeType(selectedFormat);
      
      downloadExport(content, filename, mimeType);
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      alert('Eksportuojant įvyko klaida');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-white text-lg font-semibold flex items-center gap-2">
            <Download size={20} />
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Format selection */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Pasirinkite formatą
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {exportOptions.map(option => (
                <button
                  key={option.format}
                  onClick={() => setSelectedFormat(option.format)}
                  disabled={!option.available}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedFormat === option.format
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:border-amber-300 hover:bg-gray-50'
                  } ${!option.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`${
                      selectedFormat === option.format ? 'text-amber-600' : 'text-gray-500'
                    }`}>
                      {option.icon}
                    </div>
                    <div>
                      <div className={`font-medium ${
                        selectedFormat === option.format ? 'text-amber-900' : 'text-gray-800'
                      }`}>
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {option.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Eksporto parinktys
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeMetadata}
                  onChange={(e) => setIncludeMetadata(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <span className="text-gray-700">
                  Įtraukti metaduomenis (data, versija)
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeHighlights}
                  onChange={(e) => setIncludeHighlights(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <span className="text-gray-700">
                  Įtraukti pažymėjimus ir paryškinimus
                </span>
              </label>
            </div>
          </div>

          {/* Preview */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Peržiūra
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs text-gray-600 overflow-x-auto">
              <pre>
                {(() => {
                  try {
                    const preview = exportData(data, {
                      format: selectedFormat,
                      includeMetadata,
                      includeHighlights
                    });
                    return preview.slice(0, 500) + (preview.length > 500 ? '...' : '');
                  } catch {
                    return 'Peržiūra nepasiekiama';
                  }
                })()}
              </pre>
            </div>
          </div>

          {/* Data summary */}
          <div className="mt-6 p-4 bg-amber-50 rounded-lg">
            <h4 className="text-sm font-semibold text-amber-900 mb-2">
              Eksportuojami duomenys
            </h4>
            <div className="text-sm text-amber-800 space-y-1">
              {data.searchResults && (
                <p>• {data.searchResults.length} paieškos rezultatų</p>
              )}
              {data.analysis && (
                <p>• Analizės rezultatai ({data.analysis.citations.length} citatų, {data.analysis.crossReferences.length} kryžminių nuorodų)</p>
              )}
              {data.annotations && (
                <p>• {data.annotations.length} anotacijų</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Atšaukti
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Eksportuojama...
              </>
            ) : (
              <>
                <Download size={18} />
                Eksportuoti
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;