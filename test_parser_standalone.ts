
import * as fs from 'fs';
import * as path from 'path';

// --- STUB BIBLE BOOKS ---
const BIBLE_BOOKS = [
    { book: 'Pradžios knyga', testament: 'Senasis Testamentas', category: 'Įstatymo knygos', chapters: [] },
    { book: 'Išėjimo knyga', testament: 'Senasis Testamentas', category: 'Įstatymo knygos', chapters: [] }
];

// --- PARSER LOGIC STUB (Mirrors current bibleParser.ts) ---
interface ParsedChapter {
    number: number;
    title: string;
    content: string;
}

interface ParsedBook {
    title: string;
    chapters: ParsedChapter[];
}

const parseBibleText = (rawText: string): Record<string, ParsedBook> => {
    const books: Record<string, ParsedBook> = {};

    const lines = rawText
        .split('\n')
        .map(l => l.trim())
        .filter(l => {
            if (!l) return false;
            if (l.startsWith('--- Puslapis')) return false;
            if (l.startsWith('BIBLIJA')) return false;

            // Filter Table of Contents lines
            if (l.includes('KNYGŲ SĄRAŠAS')) return false;
            if (l.includes('Puslapio Nr.')) return false;
            if (l.includes(' Skyrių skaičius ')) return false;
            if (l.match(/\.{4,}/)) return false; // Lines with many dots "......" are TOC

            // Filter headers like "PRADŽIOS 1, 2" or "SENOJO TESTAMENTO"
            if (l.match(/^[A-ZĄČĘĖĮŠŲŪŽ\s]+\d+(,\s*\d+)*$/)) return false;
            if (l === 'SENASIS TESTAMENTAS' || l === 'NAUJASIS TESTAMENTAS') return false;

            // Filter footnotes: Start with number + bracket, e.g. "1 [1] ...", or "[1] ..."
            if (l.match(/^\d+\s+\[\d+\]/)) return false;
            if (l.match(/^\[\d+\]/)) return false;

            // Filter lines that are just numbers (page numbers) or single chars
            if (l.match(/^\d+$/)) return false;
            if (l.length < 2) return false;

            return true;
        });

    // DEBUG FILTER
    console.log("DEBUG: Filtered lines count:", lines.length);
    lines.forEach((l, idx) => {
        if (idx < 50 && l.toUpperCase().includes("PRADŽIOS")) {
            console.log(`DEBUG: Line ${idx}:`, l);
        }
    });

    let currentBook: ParsedBook | null = null;
    let currentChapter: ParsedChapter | null = null;
    let lastVerseNum = 0;

    const bookTitleMap: Record<string, string> = {};
    BIBLE_BOOKS.forEach(b => {
        bookTitleMap[b.book.toUpperCase()] = b.book;
    });

    const versePattern = /^(\d+)\s+(.+)/;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // 2. Check for Book Title
        // Normalize line: remove 'y ' prefix, remove punctuation, normalize spaces to single space
        const cleanLine = line
            .replace(/^y\s+/, '')
            .replace(/[.,]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toUpperCase();

        // DEBUG
        if (cleanLine.includes('PRADŽIOS')) {
            console.log(`DEBUG: Clean line check: '${cleanLine}'`);
        }

        let foundTitle: string | null = null;
        for (const capsTitle in bookTitleMap) {
            // Check if line STARTS with the title (after cleaning)
            if (cleanLine === capsTitle || cleanLine.startsWith(capsTitle + ' ')) {
                foundTitle = bookTitleMap[capsTitle];
                break;
            }
        }

        if (foundTitle) {
            const canonicalTitle = foundTitle;

            if (currentBook?.title === canonicalTitle) continue;

            currentBook = {
                title: canonicalTitle,
                chapters: []
            };
            books[canonicalTitle] = currentBook;

            // Start Chapter 1 immediately
            currentChapter = {
                number: 1,
                title: `${canonicalTitle} 1 skyrius`,
                content: ""
            };
            currentBook.chapters.push(currentChapter);

            // Clean content line similar to code
            let contentLine = line;
            contentLine = contentLine.replace(/^y\s+/, '');
            contentLine = contentLine.replace(/([A-Z])\s+([a-ž])/, '$1$2');
            contentLine = contentLine.replace(/\s+/g, ' ');

            lastVerseNum = 1;
            currentChapter.content += contentLine + "\n";
            continue;
        }

        if (!currentBook || !currentChapter) continue;

        const match = line.match(versePattern);

        if (match) {
            const num = parseInt(match[1], 10);
            let content = match[2];
            content = content.replace(/\s+/g, ' ');

            if (num === lastVerseNum + 1) {
                currentChapter.content += `${num}. ${content}\n`;
                lastVerseNum = num;
                continue;
            }

            if (num === currentChapter.number + 1) {
                const newChNum = num;
                currentChapter = {
                    number: newChNum,
                    title: `${currentBook.title} ${newChNum} skyrius`,
                    content: `${num}. ${content}\n`
                };
                currentBook.chapters.push(currentChapter);
                lastVerseNum = 1;
                continue;
            }
        }

        let textLine = line.replace(/\s+/g, ' ');
        currentChapter.content += textLine + "\n";
    }

    return books;
};

// --- RUNNER ---
console.log("Reading file...");
const filePath = path.resolve('./data/library/Biblija-LT-KJV-2012.ts');
const fileContent = fs.readFileSync(filePath, 'utf-8');
const startIdx = fileContent.indexOf('`');
const endIdx = fileContent.lastIndexOf('`');
const bibleText = fileContent.substring(startIdx + 1, endIdx);

console.log("Parsing...");
const result = parseBibleText(bibleText);
const genesis = result['Pradžios knyga'];

if (genesis) {
    console.log(`Genesis: ${genesis.chapters.length} chapters.`);

    // Check Ch 12
    const ch12 = genesis.chapters.find(c => c.number === 12);
    if (ch12) {
        console.log("Chapter 12 FOUND!");
        console.log("Content Preview:", ch12.content.substring(0, 150).replace(/\n/g, ' '));
        // Check if content looks cleaner (no footnotes)
        if (ch12.content.includes('[')) console.log("WARNING: Content might still have footnotes.");
    } else {
        console.log("Chapter 12 NOT FOUND.");
    }

} else {
    console.log("Genesis NOT FOUND.");
}
