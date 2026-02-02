/**
 * Export Service
 * Handles export of analysis results to academic formats
 */

import { SearchResult } from './semanticSearch';
import { AnalysisResult, Citation, CrossReference, ParallelText } from './contextualAnalysis';
import { Annotation } from './annotations';

export type ExportFormat = 'json' | 'csv' | 'xml' | 'bibtex' | 'ris' | 'docx' | 'pdf' | 'html';

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata?: boolean;
  includeHighlights?: boolean;
  dateFormat?: 'iso' | 'local' | 'relative';
  language?: string;
}

export interface ExportData {
  searchResults?: SearchResult[];
  analysis?: AnalysisResult;
  annotations?: Annotation[];
  query?: string;
  timestamp: number;
}

/**
 * Main export function
 */
export const exportData = (data: ExportData, options: ExportOptions): string => {
  switch (options.format) {
    case 'json':
      return exportToJSON(data, options);
    case 'csv':
      return exportToCSV(data, options);
    case 'xml':
      return exportToXML(data, options);
    case 'bibtex':
      return exportToBibTeX(data, options);
    case 'ris':
      return exportToRIS(data, options);
    case 'html':
      return exportToHTML(data, options);
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
};

/**
 * Exports to JSON format
 */
const exportToJSON = (data: ExportData, options: ExportOptions): string => {
  const exportObj: any = {
    version: '1.0',
    timestamp: new Date(data.timestamp).toISOString(),
    data: {}
  };
  
  if (options.includeMetadata) {
    exportObj.metadata = {
      exportedAt: new Date().toISOString(),
      format: options.format,
      language: options.language || 'lt'
    };
  }
  
  if (data.query) {
    exportObj.query = data.query;
  }
  
  if (data.searchResults) {
    exportObj.data.searchResults = data.searchResults.map(r => ({
      id: r.id,
      source: r.source,
      book: r.bookOrSection,
      chapter: r.chapterOrRef,
      content: r.content,
      score: r.score,
      highlights: r.highlights,
      context: r.context,
      metadata: r.metadata
    }));
  }
  
  if (data.analysis) {
    exportObj.data.analysis = data.analysis;
  }
  
  if (data.annotations) {
    exportObj.data.annotations = data.annotations.map(a => ({
      id: a.id,
      type: a.type,
      source: a.source,
      book: a.bookOrSection,
      chapter: a.chapterOrRef,
      selectedText: a.range.selectedText,
      content: a.content,
      color: a.color,
      tags: a.tags,
      createdAt: formatDate(a.createdAt, options.dateFormat)
    }));
  }
  
  return JSON.stringify(exportObj, null, 2);
};

/**
 * Exports to CSV format
 */
const exportToCSV = (data: ExportData, options: ExportOptions): string => {
  const rows: string[] = [];
  
  if (data.searchResults) {
    rows.push('Type,ID,Source,Book,Chapter,Content,Score,Tags');
    
    for (const result of data.searchResults) {
      const content = escapeCSV(result.content);
      const tags = result.metadata.tags.join(';');
      rows.push(`search,${result.id},${escapeCSV(result.source)},${escapeCSV(result.bookOrSection)},${escapeCSV(result.chapterOrRef)},"${content}",${result.score.toFixed(4)},"${tags}"`);
    }
  }
  
  if (data.analysis?.citations) {
    if (rows.length === 0) rows.push('Type,ID,Source,Reference,Text,Confidence');
    
    for (const citation of data.analysis.citations) {
      const text = escapeCSV(citation.text);
      rows.push(`citation,${citation.id},${escapeCSV(citation.source)},${escapeCSV(citation.reference)},"${text}",${citation.confidence.toFixed(2)}`);
    }
  }
  
  if (data.annotations) {
    if (rows.length === 0) rows.push('Type,ID,Source,Book,Chapter,SelectedText,Content,Color,Tags,CreatedAt');
    
    for (const annotation of data.annotations) {
      const selectedText = escapeCSV(annotation.range.selectedText);
      const content = annotation.content ? escapeCSV(annotation.content) : '';
      const tags = annotation.tags?.join(';') || '';
      const createdAt = formatDate(annotation.createdAt, options.dateFormat);
      rows.push(`annotation,${annotation.id},${escapeCSV(annotation.source)},${escapeCSV(annotation.bookOrSection)},${escapeCSV(annotation.chapterOrRef)},"${selectedText}","${content}",${annotation.color || ''},"${tags}",${createdAt}`);
    }
  }
  
  return rows.join('\n');
};

/**
 * Escapes CSV values
 */
const escapeCSV = (value: string): string => {
  if (!value) return '';
  return value
    .replace(/"/g, '""')
    .replace(/\n/g, ' ')
    .replace(/\r/g, '');
};

/**
 * Exports to XML format
 */
const exportToXML = (data: ExportData, options: ExportOptions): string => {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<export version="1.0">\n';
  xml += `  <timestamp>${new Date(data.timestamp).toISOString()}</timestamp>\n`;
  
  if (options.includeMetadata) {
    xml += '  <metadata>\n';
    xml += `    <exportedAt>${new Date().toISOString()}</exportedAt>\n`;
    xml += `    <format>${options.format}</format>\n`;
    xml += '  </metadata>\n';
  }
  
  if (data.query) {
    xml += `  <query>${escapeXml(data.query)}</query>\n`;
  }
  
  if (data.searchResults) {
    xml += '  <searchResults>\n';
    for (const result of data.searchResults) {
      xml += '    <result>\n';
      xml += `      <id>${result.id}</id>\n`;
      xml += `      <source>${escapeXml(result.source)}</source>\n`;
      xml += `      <book>${escapeXml(result.bookOrSection)}</book>\n`;
      xml += `      <chapter>${escapeXml(result.chapterOrRef)}</chapter>\n`;
      xml += `      <content>${escapeXml(result.content)}</content>\n`;
      xml += `      <score>${result.score}</score>\n`;
      if (options.includeHighlights && result.highlights.length > 0) {
        xml += '      <highlights>\n';
        for (const highlight of result.highlights) {
          xml += `        <highlight>${escapeXml(highlight)}</highlight>\n`;
        }
        xml += '      </highlights>\n';
      }
      xml += '    </result>\n';
    }
    xml += '  </searchResults>\n';
  }
  
  if (data.analysis) {
    xml += '  <analysis>\n';
    
    if (data.analysis.citations.length > 0) {
      xml += '    <citations>\n';
      for (const citation of data.analysis.citations) {
        xml += '      <citation>\n';
        xml += `        <id>${citation.id}</id>\n`;
        xml += `        <source>${escapeXml(citation.source)}</source>\n`;
        xml += `        <reference>${escapeXml(citation.reference)}</reference>\n`;
        xml += `        <text>${escapeXml(citation.text)}</text>\n`;
        xml += `        <confidence>${citation.confidence}</confidence>\n`;
        xml += '      </citation>\n';
      }
      xml += '    </citations>\n';
    }
    
    if (data.analysis.crossReferences.length > 0) {
      xml += '    <crossReferences>\n';
      for (const ref of data.analysis.crossReferences) {
        xml += '      <crossReference>\n';
        xml += `        <id>${ref.id}</id>\n`;
        xml += `        <sourceRef>${escapeXml(ref.sourceRef)}</sourceRef>\n`;
        xml += `        <targetRef>${escapeXml(ref.targetRef)}</targetRef>\n`;
        xml += `        <relationship>${ref.relationship}</relationship>\n`;
        xml += `        <strength>${ref.strength}</strength>\n`;
        xml += '      </crossReference>\n';
      }
      xml += '    </crossReferences>\n';
    }
    
    xml += '  </analysis>\n';
  }
  
  if (data.annotations) {
    xml += '  <annotations>\n';
    for (const annotation of data.annotations) {
      xml += '    <annotation>\n';
      xml += `      <id>${annotation.id}</id>\n`;
      xml += `      <type>${annotation.type}</type>\n`;
      xml += `      <source>${escapeXml(annotation.source)}</source>\n`;
      xml += `      <book>${escapeXml(annotation.bookOrSection)}</book>\n`;
      xml += `      <chapter>${escapeXml(annotation.chapterOrRef)}</chapter>\n`;
      xml += `      <selectedText>${escapeXml(annotation.range.selectedText)}</selectedText>\n`;
      if (annotation.content) {
        xml += `      <content>${escapeXml(annotation.content)}</content>\n`;
      }
      xml += `      <createdAt>${formatDate(annotation.createdAt, options.dateFormat)}</createdAt>\n`;
      xml += '    </annotation>\n';
    }
    xml += '  </annotations>\n';
  }
  
  xml += '</export>';
  return xml;
};

/**
 * Escapes XML special characters
 */
const escapeXml = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/**
 * Exports to BibTeX format (for academic citations)
 */
const exportToBibTeX = (data: ExportData, options: ExportOptions): string => {
  const entries: string[] = [];
  let entryNum = 0;
  
  if (data.searchResults) {
    for (const result of data.searchResults) {
      entryNum++;
      entries.push(`@misc{ts_search_${entryNum},
  title = {${result.bookOrSection} ${result.chapterOrRef}},
  author = {${result.source}},
  note = {Score: ${result.score.toFixed(4)}},
  timestamp = {${new Date(data.timestamp).toISOString()}}
}`);
    }
  }
  
  if (data.analysis?.citations) {
    for (const citation of data.analysis.citations) {
      entryNum++;
      entries.push(`@misc{ts_citation_${entryNum},
  title = {${citation.reference}},
  author = {${citation.source}},
  note = {Citation confidence: ${citation.confidence.toFixed(2)}},
  timestamp = {${new Date(data.timestamp).toISOString()}}
}`);
    }
  }
  
  return entries.join('\n\n');
};

/**
 * Exports to RIS format (Research Information Systems)
 */
const exportToRIS = (data: ExportData, options: ExportOptions): string => {
  const entries: string[] = [];
  
  if (data.searchResults) {
    for (const result of data.searchResults) {
      const lines = [
        'TY  - GEN',
        `TI  - ${result.bookOrSection} ${result.chapterOrRef}`,
        `AU  - ${result.source}`,
        `AB  - ${result.content.slice(0, 200)}...`,
        `N1  - Relevance Score: ${result.score.toFixed(4)}`,
        `DA  - ${new Date(data.timestamp).toISOString().split('T')[0]}`,
        'ER  -'
      ];
      entries.push(lines.join('\n'));
    }
  }
  
  if (data.analysis?.citations) {
    for (const citation of data.analysis.citations) {
      const lines = [
        'TY  - GEN',
        `TI  - ${citation.reference}`,
        `AU  - ${citation.source}`,
        `AB  - ${citation.text}`,
        `N1  - Citation confidence: ${citation.confidence.toFixed(2)}`,
        `DA  - ${new Date(data.timestamp).toISOString().split('T')[0]}`,
        'ER  -'
      ];
      entries.push(lines.join('\n'));
    }
  }
  
  return entries.join('\n\n');
};

/**
 * Exports to HTML format
 */
const exportToHTML = (data: ExportData, options: ExportOptions): string => {
  let html = `<!DOCTYPE html>
<html lang="${options.language || 'lt'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tikėjimo Šviesa - Export</title>
  <style>
    body { font-family: Georgia, serif; line-height: 1.6; max-width: 900px; margin: 0 auto; padding: 20px; }
    h1 { color: #1a365d; border-bottom: 2px solid #2c5282; padding-bottom: 10px; }
    h2 { color: #2c5282; margin-top: 30px; }
    .result { background: #f7fafc; padding: 15px; margin: 15px 0; border-left: 4px solid #3182ce; }
    .citation { background: #f0fff4; padding: 10px; margin: 10px 0; border-left: 4px solid #38a169; }
    .annotation { background: #fffaf0; padding: 10px; margin: 10px 0; border-left: 4px solid #dd6b20; }
    .metadata { color: #718096; font-size: 0.9em; }
    .score { color: #2c5282; font-weight: bold; }
    .reference { color: #744210; font-weight: bold; }
    .highlight { background: #fef3c7; padding: 2px 4px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #edf2f7; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Tikėjimo Šviesa - Eksporto Ataskaita</h1>
  <p class="metadata">Sugeneruota: ${new Date().toLocaleString()}</p>
`;
  
  if (data.query) {
    html += `  <p><strong>Užklausa:</strong> ${escapeHtml(data.query)}</p>\n`;
  }
  
  if (data.searchResults && data.searchResults.length > 0) {
    html += '  <h2>Paieškos Rezultatai</h2>\n';
    for (const result of data.searchResults) {
      html += `  <div class="result">\n`;
      html += `    <p class="reference">${escapeHtml(result.source)} - ${escapeHtml(result.bookOrSection)} ${escapeHtml(result.chapterOrRef)}</p>\n`;
      html += `    <p>${escapeHtml(result.content)}</p>\n`;
      html += `    <p class="metadata">Reitingas: <span class="score">${result.score.toFixed(2)}</span></p>\n`;
      html += `  </div>\n`;
    }
  }
  
  if (data.analysis?.citations && data.analysis.citations.length > 0) {
    html += '  <h2>Aptiktos Citatos</h2>\n';
    for (const citation of data.analysis.citations) {
      html += `  <div class="citation">\n`;
      html += `    <p class="reference">${escapeHtml(citation.source)} ${escapeHtml(citation.reference)}</p>\n`;
      html += `    <p>${escapeHtml(citation.text)}</p>\n`;
      html += `    <p class="metadata">Patikimumas: ${(citation.confidence * 100).toFixed(0)}%</p>\n`;
      html += `  </div>\n`;
    }
  }
  
  if (data.annotations && data.annotations.length > 0) {
    html += '  <h2>Anotacijos</h2>\n';
    for (const annotation of data.annotations) {
      html += `  <div class="annotation" style="border-left-color: ${annotation.color || '#dd6b20'}">\n`;
      html += `    <p><strong>${annotation.type.toUpperCase()}</strong> - ${escapeHtml(annotation.source)} ${escapeHtml(annotation.bookOrSection)}</p>\n`;
      html += `    <p><em>"${escapeHtml(annotation.range.selectedText)}"</em></p>\n`;
      if (annotation.content) {
        html += `    <p>${escapeHtml(annotation.content)}</p>\n`;
      }
      html += `    <p class="metadata">Sukurta: ${formatDate(annotation.createdAt, options.dateFormat)}</p>\n`;
      html += `  </div>\n`;
    }
  }
  
  html += `</body>\n</html>`;
  return html;
};

/**
 * Escapes HTML special characters
 */
const escapeHtml = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
};

/**
 * Formats date according to options
 */
const formatDate = (timestamp: number, format?: string): string => {
  const date = new Date(timestamp);
  
  switch (format) {
    case 'iso':
      return date.toISOString();
    case 'local':
      return date.toLocaleString();
    case 'relative':
      return getRelativeTime(date);
    default:
      return date.toISOString();
  }
};

/**
 * Gets relative time string
 */
const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 30) return date.toLocaleDateString();
  if (days > 0) return `prieš ${days} d.`;
  if (hours > 0) return `prieš ${hours} val.`;
  if (minutes > 0) return `prieš ${minutes} min.`;
  return 'ką tik';
};

/**
 * Downloads exported data as a file
 */
export const downloadExport = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * Gets MIME type for export format
 */
export const getMimeType = (format: ExportFormat): string => {
  switch (format) {
    case 'json':
      return 'application/json';
    case 'csv':
      return 'text/csv';
    case 'xml':
      return 'application/xml';
    case 'bibtex':
      return 'application/x-bibtex';
    case 'ris':
      return 'application/x-research-info-systems';
    case 'html':
      return 'text/html';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'text/plain';
  }
};

/**
 * Gets file extension for export format
 */
export const getFileExtension = (format: ExportFormat): string => {
  switch (format) {
    case 'json':
      return 'json';
    case 'csv':
      return 'csv';
    case 'xml':
      return 'xml';
    case 'bibtex':
      return 'bib';
    case 'ris':
      return 'ris';
    case 'html':
      return 'html';
    case 'docx':
      return 'docx';
    case 'pdf':
      return 'pdf';
    default:
      return 'txt';
  }
};

/**
 * Validates export data
 */
export const validateExportData = (data: ExportData): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.timestamp) {
    errors.push('Timestamp is required');
  }
  
  if (!data.searchResults && !data.analysis && !data.annotations) {
    errors.push('At least one data type must be provided');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};