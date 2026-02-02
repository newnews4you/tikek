/**
 * PDF Processing Service
 * Handles PDF text extraction and conversion to searchable format
 */

import * as pdfjs from 'pdfjs-dist';

// PDF.js worker configuration
// Note: In production, you should use a local worker file
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export interface PDFDocument {
  fileName: string;
  title: string;
  type: 'BIBLE' | 'CATECHISM' | 'ENCYCLICAL' | 'SAINT' | 'COMMENTARY' | 'OTHER';
  pages: PDFPage[];
  metadata?: {
    author?: string;
    creationDate?: Date;
    totalPages: number;
  };
}

export interface PDFPage {
  pageNumber: number;
  text: string;
  chapters?: Array<{
    title: string;
    verses?: Array<{
      number: string;
      text: string;
    }>;
  }>;
}

/**
 * Extracts text from PDF file
 */
export const extractTextFromPDF = async (file: File): Promise<PDFDocument> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  
  const pages: PDFPage[] = [];
  const totalPages = pdf.numPages;
  
  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item: any) => item.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    pages.push({
      pageNumber: i,
      text
    });
  }
  
  // Try to extract metadata
  const metadata = await pdf.getMetadata().catch(() => null);
  
  return {
    fileName: file.name,
    title: metadata?.info?.Title || file.name.replace('.pdf', ''),
    type: 'OTHER',
    pages,
    metadata: {
      author: metadata?.info?.Author,
      creationDate: metadata?.info?.CreationDate,
      totalPages
    }
  };
};

/**
 * Attempts to parse biblical text structure
 */
export const parseBiblicalStructure = (text: string): PDFPage['chapters'] => {
  const chapters: PDFPage['chapters'] = [];
  
  // Match chapter headers like "1 skyrius", "2 SKYRIUS", etc.
  const chapterPattern = /(\d+)\s*(?:skyrius|SKYRIUS|Skyrius)/gi;
  const versesPattern = /(\d+)\s+([^\d]+?)(?=\s+\d+\s+|$)/g;
  
  let chapterMatch;
  let lastIndex = 0;
  
  while ((chapterMatch = chapterPattern.exec(text)) !== null) {
    const chapterNum = chapterMatch[1];
    const chapterStart = chapterMatch.index;
    
    // Find next chapter or end of text
    const nextChapterMatch = chapterPattern.exec(text);
    chapterPattern.lastIndex = chapterMatch.index + 1; // Reset for next iteration
    
    const chapterEnd = nextChapterMatch ? nextChapterMatch.index : text.length;
    const chapterText = text.slice(chapterStart, chapterEnd);
    
    // Extract verses from chapter
    const verses: Array<{ number: string; text: string }> = [];
    let verseMatch;
    
    while ((verseMatch = versesPattern.exec(chapterText)) !== null) {
      verses.push({
        number: verseMatch[1],
        text: verseMatch[2].trim()
      });
    }
    
    chapters.push({
      title: `${chapterNum} skyrius`,
      verses
    });
    
    lastIndex = chapterEnd;
  }
  
  return chapters.length > 0 ? chapters : undefined;
};

/**
 * Converts PDF document to TypeScript format
 */
export const convertPDFToTypeScript = (
  doc: PDFDocument,
  options: {
    variableName: string;
    bookName: string;
    type: PDFDocument['type'];
  }
): string => {
  const { variableName, bookName, type } = options;
  
  // Combine all pages into one text
  const fullText = doc.pages
    .map(p => p.text)
    .join('\n\n');
  
  // Escape backticks and special characters
  const escapedText = fullText
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');
  
  return `// ${bookName}
// Imported from PDF: ${doc.fileName}
// Type: ${type}
// Pages: ${doc.pages.length}

export const ${variableName} = \`
${escapedText}
\`;
`;
};

/**
 * Generates localDocuments.ts entry for the PDF
 */
export const generateLocalDocumentEntry = (
  variableName: string,
  bookName: string,
  type: PDFDocument['type']
): string => {
  return `  {
    title: "${bookName}",
    type: "${type}" as const,
    content: ${variableName}
  }`;
};

/**
 * Processes multiple PDFs and generates complete TypeScript files
 */
export const processPDFs = async (
  files: File[],
  options: Array<{
    variableName: string;
    bookName: string;
    type: PDFDocument['type'];
  }>
): Promise<Array<{
  fileName: string;
  tsContent: string;
  entry: string;
}>> => {
  const results = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const opts = options[i];
    
    try {
      const doc = await extractTextFromPDF(file);
      const tsContent = convertPDFToTypeScript(doc, opts);
      const entry = generateLocalDocumentEntry(
        opts.variableName,
        opts.bookName,
        opts.type
      );
      
      results.push({
        fileName: `${opts.variableName}.ts`,
        tsContent,
        entry
      });
    } catch (error) {
      console.error(`Error processing ${file.name}:`, error);
      results.push({
        fileName: `${opts.variableName}.ts`,
        tsContent: `// Error processing ${file.name}: ${error}`,
        entry: `  // Error: ${file.name}`
      });
    }
  }
  
  return results;
};

/**
 * Splits large text into chunks for better processing
 */
export const splitIntoChunks = (
  text: string,
  maxChunkSize: number = 5000
): string[] => {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk += '\n\n' + paragraph;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
};

/**
 * Detects document type from filename and content
 */
export const detectDocumentType = (
  fileName: string,
  content: string
): PDFDocument['type'] => {
  const lowerFileName = fileName.toLowerCase();
  const lowerContent = content.toLowerCase().slice(0, 1000);
  
  // Check for Bible books
  const bibleBooks = ['evangelija', 'psalm', 'patarliu', 'isėjimo', 'pradžios'];
  if (bibleBooks.some(book => lowerFileName.includes(book) || lowerContent.includes(book))) {
    return 'BIBLE';
  }
  
  // Check for Catechism
  if (lowerFileName.includes('katekizmas') || lowerContent.includes('katekizmas')) {
    return 'CATECHISM';
  }
  
  // Check for Encyclical
  if (lowerFileName.includes('enciklika') || lowerContent.includes('enciklika')) {
    return 'ENCYCLICAL';
  }
  
  // Check for Saint writings
  if (lowerFileName.includes('šventasis') || lowerFileName.includes('palaimintasis')) {
    return 'SAINT';
  }
  
  return 'OTHER';
};

/**
 * Downloads generated TypeScript file
 */
export const downloadTypeScriptFile = (
  content: string,
  fileName: string
): void => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};