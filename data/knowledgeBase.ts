import { LOCAL_DOCUMENTS } from './localDocuments';
import { BIBLE_BOOKS } from './library/BibleBooks';

export interface KnowledgeChunk {
  id?: string;
  source: string;
  bookOrSection: string;
  chapterOrRef: string;
  content: string;
  tags: string[];
  embedding?: number[];
}

const INITIAL_DATA: KnowledgeChunk[] = [
  {
    source: "Biblija",
    bookOrSection: "Pradžios knyga",
    chapterOrRef: "1 skyrius",
    content: "[Pradžios 1:1] Pradžioje Dievas sukūrė dangų ir žemę. Žemė buvo beformė ir tuščia, tamsa gaubė bedugnę, ir Dievo Dvasia pleveno virš vandenų.",
    tags: ["sukūrimas", "pradžia"]
  }
];

const DB_NAME = 'TikejimoSviesaDB';
const STORE_NAME = 'chunks';
const DB_VERSION = 1;

let runtimeKnowledgeBase: KnowledgeChunk[] = [];
let isInitialized = false;

// --- SUMANUS SKAIDYMAS (SMART CHUNKING) ---
const chunkText = (fileName: string, text: string, type: string): KnowledgeChunk[] => {
  const cleanText = text.replace(/\r\n/g, '\n');

  // Skaidome tekstą į prasmingas pastraipas
  // Biblijai idealu skaidyti kas 5-10 eilučių arba per dvigubą naują eilutę
  const rawChunks = cleanText.split(/\n\s*\n/);

  return rawChunks
    .map((chunk, index): KnowledgeChunk | null => {
      const trimmed = chunk.trim();
      if (trimmed.length < 15) return null;

      // SVARBU: Į kiekvieną chunk'ą įterpiame šaltinio informaciją.
      // Tai leidžia AI "suprasti" kontekstą net jei jis mato tik mažą fragmentą.
      const enrichedContent = `[Šaltinis: ${fileName}, ${type}] ${trimmed}`;

      return {
        id: `static-${fileName}-${index}`,
        source: type,
        bookOrSection: fileName,
        chapterOrRef: `Dalis ${index + 1}`,
        content: enrichedContent,
        tags: [fileName.toLowerCase(), type.toLowerCase()]
      };
    })
    .filter((c): c is KnowledgeChunk => c !== null);
};

// --- INDEXED DB ---
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
    request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
  });
};

export const initKnowledgeBase = async () => {
  if (isInitialized) return;
  if (typeof window === 'undefined') return;

  let staticChunks: KnowledgeChunk[] = [];
  LOCAL_DOCUMENTS.forEach(doc => {
    const chunks = chunkText(doc.title, doc.content, doc.type);
    staticChunks = [...staticChunks, ...chunks];
  });

  runtimeKnowledgeBase = [...INITIAL_DATA, ...staticChunks];

  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const dbResult = request.result as KnowledgeChunk[];
      if (dbResult && dbResult.length > 0) {
        runtimeKnowledgeBase = [...runtimeKnowledgeBase, ...dbResult];
      }
      isInitialized = true;
    };
  } catch (e) {
    console.error("Failed to init IndexedDB:", e);
    isInitialized = true;
  }
};

export const resetKnowledgeBase = async () => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  store.clear();
  isInitialized = false;
  await initKnowledgeBase();
};

export const addDocumentToKnowledgeBase = async (
  fileName: string,
  textContext: string,
  type: 'Biblija' | 'Katekizmas' | 'Kita' = 'Kita'
) => {
  const newChunks = chunkText(fileName, textContext, type).map(c => ({
    ...c,
    id: `${fileName}-${Date.now()}-${Math.random()}`
  }));

  runtimeKnowledgeBase = [...runtimeKnowledgeBase, ...newChunks];

  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  newChunks.forEach(chunk => store.put(chunk));

  return newChunks.length;
};

export const getKnowledgeBase = () => runtimeKnowledgeBase;

export const getBibleStructure = () => {
  // Use new Bible books structure
  return BIBLE_BOOKS.map(book => ({
    book: book.book,
    testament: book.testament,
    category: book.category,
    chapters: book.chapters
  }));
};

export const getStats = () => {
  const sources = new Set(runtimeKnowledgeBase.map(k => k.bookOrSection));
  return {
    totalChunks: runtimeKnowledgeBase.length,
    totalDocuments: sources.size,
    documents: Array.from(sources),
    staticDocsCount: LOCAL_DOCUMENTS.length
  };
};
