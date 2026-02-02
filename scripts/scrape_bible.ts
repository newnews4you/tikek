
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://biblija.lt/index.aspx?cmp=reading&doc=BiblijaRKK1998';
const OUTPUT_FILE = path.join(__dirname, '../data/library/Biblija_RKK1998.ts');

// Embedded BibleBooks data to avoid import issues
const BIBLE_BOOKS = [
    { book: 'Pradžios knyga', chapters: 50 },
    { book: 'Išėjimo knyga', chapters: 40 },
    { book: 'Kunigų knyga', chapters: 27 },
    { book: 'Skaičių knyga', chapters: 36 },
    { book: 'Pakartoto Įstatymo knyga', chapters: 34 },
    { book: 'Jozuės knyga', chapters: 24 },
    { book: 'Teisėjų knyga', chapters: 21 },
    { book: 'Rūtos knyga', chapters: 4 },
    { book: '1 Samuelio knyga', chapters: 31 },
    { book: '2 Samuelio knyga', chapters: 24 },
    { book: '1 Karalių knyga', chapters: 22 },
    { book: '2 Karalių knyga', chapters: 25 },
    { book: '1 Kronikų knyga', chapters: 29 },
    { book: '2 Kronikų knyga', chapters: 36 },
    { book: 'Ezros knyga', chapters: 10 },
    { book: 'Nehemijo knyga', chapters: 13 },
    { book: 'Esteros knyga', chapters: 10 },
    { book: 'Jobo knyga', chapters: 42 },
    { book: 'Psalmės', chapters: 150 },
    { book: 'Patarlės', chapters: 31 },
    { book: 'Ekleziasto knyga', chapters: 12 },
    { book: 'Giesmių giesmė', chapters: 8 },
    { book: 'Izaijo pranašystė', chapters: 66 },
    { book: 'Jeremijo pranašystė', chapters: 52 },
    { book: 'Jeremijo raudos', chapters: 5 },
    { book: 'Ezekielio pranašystė', chapters: 48 },
    { book: 'Danieliaus pranašystė', chapters: 12 },
    { book: 'Ozėjo pranašystė', chapters: 14 },
    { book: 'Joelio pranašystė', chapters: 3 },
    { book: 'Amoso pranašystė', chapters: 9 },
    { book: 'Abdijo pranašystė', chapters: 1 },
    { book: 'Jonos pranašystė', chapters: 4 },
    { book: 'Michėjo pranašystė', chapters: 7 },
    { book: 'Nahumo pranašystė', chapters: 3 },
    { book: 'Habakuko pranašystė', chapters: 3 },
    { book: 'Sofonijo pranašystė', chapters: 3 },
    { book: 'Agėjo pranašystė', chapters: 2 },
    { book: 'Zacharijo pranašystė', chapters: 14 },
    { book: 'Malachijo pranašystė', chapters: 4 },
    { book: 'Evangelija pagal Matą', chapters: 28 },
    { book: 'Evangelija pagal Morkų', chapters: 16 },
    { book: 'Evangelija pagal Luką', chapters: 24 },
    { book: 'Evangelija pagal Joną', chapters: 21 },
    { book: 'Apaštalų darbai', chapters: 28 },
    { book: 'Laiškas romiečiams', chapters: 16 },
    { book: 'Pirmasis laiškas korintiečiams', chapters: 16 },
    { book: 'Antrasis laiškas korintiečiams', chapters: 13 },
    { book: 'Laiškas galatams', chapters: 6 },
    { book: 'Laiškas efeziečiams', chapters: 6 },
    { book: 'Laiškas filipiečiams', chapters: 4 },
    { book: 'Laiškas kolosiečiams', chapters: 4 },
    { book: 'Pirmasis laiškas tesalonikiečiams', chapters: 5 },
    { book: 'Antrasis laiškas tesalonikiečiams', chapters: 3 },
    { book: 'Pirmasis laiškas Timotiejui', chapters: 6 },
    { book: 'Antrasis laiškas Timotiejui', chapters: 4 },
    { book: 'Laiškas Titui', chapters: 3 },
    { book: 'Laiškas Filemonui', chapters: 1 },
    { book: 'Laiškas hebrajams', chapters: 13 },
    { book: 'Jokūbo laiškas', chapters: 5 },
    { book: 'Pirmasis Petro laiškas', chapters: 5 },
    { book: 'Antrasis Petro laiškas', chapters: 3 },
    { book: 'Pirmasis Jono laiškas', chapters: 5 },
    { book: 'Antrasis Jono laiškas', chapters: 1 },
    { book: 'Trečiasis Jono laiškas', chapters: 1 },
    { book: 'Judo laiškas', chapters: 1 },
    { book: 'Apreiškimas Jonui', chapters: 22 }
];

const BOOK_MAPPING: Record<string, string> = {
    'Pradžios knyga': 'Pr',
    'Išėjimo knyga': 'Iš',
    'Kunigų knyga': 'Kun',
    'Skaičių knyga': 'Sk',
    'Pakartoto Įstatymo knyga': 'Ist',
    'Jozuės knyga': 'Joz',
    'Teisėjų knyga': 'Ts',
    'Rūtos knyga': 'Rut',
    '1 Samuelio knyga': '1_Sam',
    '2 Samuelio knyga': '2_Sam',
    '1 Karalių knyga': '1_Kar',
    '2 Karalių knyga': '2_Kar',
    '1 Kronikų knyga': '1_Kr',
    '2 Kronikų knyga': '2_Kr',
    'Ezros knyga': 'Ezd',
    'Nehemijo knyga': 'Neh',
    'Esteros knyga': 'Est',
    'Jobo knyga': 'Job',
    'Psalmės': 'Ps',
    'Patarlės': 'Pat',
    'Ekleziasto knyga': 'Koh',
    'Giesmių giesmė': 'Gg',
    'Izaijo pranašystė': 'Iz',
    'Jeremijo pranašystė': 'Jer',
    'Jeremijo raudos': 'Rd',
    'Ezekielio pranašystė': 'Ez',
    'Danieliaus pranašystė': 'Dan',
    'Ozėjo pranašystė': 'Oz',
    'Joelio pranašystė': 'Jl',
    'Amoso pranašystė': 'Am',
    'Abdijo pranašystė': 'Abd',
    'Jonos pranašystė': 'Jon',
    'Michėjo pranašystė': 'Mch',
    'Nahumo pranašystė': 'Nah',
    'Habakuko pranašystė': 'Hab',
    'Sofonijo pranašystė': 'Sof',
    'Agėjo pranašystė': 'Ag',
    'Zacharijo pranašystė': 'Zch',
    'Malachijo pranašystė': 'Mal',
    'Evangelija pagal Matą': 'Mt',
    'Evangelija pagal Morkų': 'Mk',
    'Evangelija pagal Luką': 'Lk',
    'Evangelija pagal Joną': 'Jn',
    'Apaštalų darbai': 'Apd',
    'Laiškas romiečiams': 'Rom',
    'Pirmasis laiškas korintiečiams': '1_Kor',
    'Antrasis laiškas korintiečiams': '2_Kor',
    'Laiškas galatams': 'Gal',
    'Laiškas efeziečiams': 'Ef',
    'Laiškas filipiečiams': 'Fil',
    'Laiškas kolosiečiams': 'Kol',
    'Pirmasis laiškas tesalonikiečiams': '1_Tes',
    'Antrasis laiškas tesalonikiečiams': '2_Tes',
    'Pirmasis laiškas Timotiejui': '1_Tim',
    'Antrasis laiškas Timotiejui': '2_Tim',
    'Laiškas Titui': 'Tit',
    'Laiškas Filemonui': 'Fm',
    'Laiškas hebrajams': 'Žyd',
    'Jokūbo laiškas': 'Jok',
    'Pirmasis Petro laiškas': '1_Pt',
    'Antrasis Petro laiškas': '2_Pt',
    'Pirmasis Jono laiškas': '1_Jn',
    'Antrasis Jono laiškas': '2_Jn',
    'Trečiasis Jono laiškas': '3_Jn',
    'Judo laiškas': 'Jud',
    'Apreiškimas Jonui': 'Apr'
};

interface ScrapedChapter {
    number: number;
    title: string;
    verses: { number: number; content: string }[];
}

interface ScrapedBook {
    title: string;
    chapters: ScrapedChapter[];
}

async function scrapeChapter(bookCode: string, chapterNum: number, bookTitle: string): Promise<ScrapedChapter> {
    const url = `${BASE_URL}_${bookCode}_${chapterNum}`;
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const $ = cheerio.load(data);
        const verses: { number: number; content: string }[] = [];

        // Parsing logic based on observed HTML (user provided)
        // It seems verses are in text nodes mixed with <sup> or hints.
        // Let's look for a container. The user didn't show the full HTML structure, just text chunks.
        // Usually biblija.lt has a main content area.

        // We will try to find text that starts with numbers using a generic traversal if specific class isn't known.
        // Or assume the content is within the body.

        // Heuristic: iterate all paragraphs or text nodes.
        // In biblija.lt, verses are often: "1 In the beginning..."
        // Sometimes verse numbers are superscripts.

        // Let's assume the text is in the main body.
        // We'll clean HTML: remove scripts, styles.
        $('script').remove();
        $('style').remove();

        // Remove known navigation/footer elements if any
        $('.header').remove();
        $('.footer').remove();
        $('a').each((_, el) => {
            // If link text is "1" or "[1]", it might be a footnote ref
            if (/^\[?\d+\]?$/.test($(el).text().trim())) {
                $(el).remove();
            }
        });
        $('sup').each((_, el) => {
            $(el).replaceWith(` ${$(el).text()} `);
        });
        $('br').replaceWith(' ');
        $('p').each((_, el) => {
            $(el).append(' ');
        });

        // Let's get text and parse it with regex like our parser, 
        // OR try to be smarter with DOM.
        // The text chunk showed: "20 Dievas tarė... 21 Dievas sukūrė..."
        // So numbers are embedded.

        // Strategy: Get full text of the likely content area.
        // biblija.lt usually has <div id="center_col"> or similar.
        // Let's try 'body' and refine if needed.

        // We will match verse numbers.

        const rawText = $('body').text().replace(/\s+/g, ' ');
        // Regex to find " 1 ", " 2 ", etc. (might be risky).
        // Better: `(\d+)\s+([^\d]+)`

        // Optimization: if we can rely on DOM, better. But without seeing DOM...
        // Let's try to scrape roughly.

        let currentVerse = 0;
        let buffer = "";

        // Refined matching for the text dump we saw
        // It showed: "20 Dievas tarė... 21 Dievas sukūrė..."
        // We can split by `(\d+)\s` but be careful of numbers in text.
        // Verse numbers usually follow a period or start of block.

        // ALTERNATIVE: Use the parser logic we already wrote! 
        // We can fetch the text, then feed it to `parseBibleText` logic, but applied to single chapter.

        // Let's implement a simple verse splitter that looks for "NUMBER Text...".
        // Iterate words?

        const words = rawText.split(' ');
        let currentVerseContent = "";
        let currentVerseNum = 0;

        for (let i = 0; i < words.length; i++) {
            const w = words[i].trim();
            if (!w) continue;

            // Check if word is a verse number
            if (/^\d+$/.test(w)) {

                // IGNORE numbers that are likely not verses
                // e.g. "1998" (year)
                const num = parseInt(w);
                if (num > 200) { // Verse numbers differ rarely exceed 176 (Psalm 119)
                    currentVerseContent += " " + w;
                    continue;
                }

                // If it's 1, reset
                if (num === 1 && currentVerseNum === 0) {
                    // Check if previous words were "Pradžios knyga..." header?
                    // We can discard preamble if we start verses.
                    currentVerseNum = 1;
                    currentVerseContent = "";
                    continue;
                }

                // Sequential check
                if (num === currentVerseNum + 1) {
                    if (currentVerseNum > 0) {
                        verses.push({ number: currentVerseNum, content: currentVerseContent.trim() });
                    }
                    currentVerseNum = num;
                    currentVerseContent = "";
                    continue;
                }
            }

            // Heuristic for "Verse 1" if number missed?
            // "Pradžioje Dievas..."
            if (currentVerseNum === 0) {
                // If we see typical start words?
            }

            if (currentVerseNum > 0) {
                currentVerseContent += " " + w;
            }
        }

        if (currentVerseNum > 0) {
            verses.push({ number: currentVerseNum, content: currentVerseContent.trim() });
        }

        // Fallback: If 0 verses found, maybe text is raw?
        if (verses.length === 0) {
            // Try to find ANY text
            console.warn(`    WARNING: No verses parsed for ${bookTitle} ${chapterNum}. content length: ${rawText.length}`);
        }

        return {
            number: chapterNum,
            title: `${bookTitle} ${chapterNum} skyrius`,
            verses
        };

    } catch (err: any) {
        console.error(`    Error scraping ${bookTitle} Ch ${chapterNum}: ${err.message}`);
        // Return placeholder
        return {
            number: chapterNum,
            title: `${bookTitle} ${chapterNum} skyrius (Klaida)`,
            verses: [{ number: 1, content: "Nepavyko parsiųsti turinio." }]
        };
    }
}

async function scrapeAll() {
    console.log("Starting Bible Scrape...");
    const books: Record<string, ScrapedBook> = {};

    for (const bookInfo of BIBLE_BOOKS) {
        const code = BOOK_MAPPING[bookInfo.book];
        if (!code) {
            console.warn(`Skipping ${bookInfo.book} - No code mapping`);
            continue;
        }

        console.log(`Scraping ${bookInfo.book} (${code}) [${bookInfo.chapters} ch]...`);
        const scrapedBook: ScrapedBook = {
            title: bookInfo.book,
            chapters: []
        };

        const chapterCount = bookInfo.chapters; // it is number now

        // Parallelizing requests with limit to be polite
        const chunks = [];
        const CHUNK_SIZE = 5;
        for (let i = 1; i <= chapterCount; i += CHUNK_SIZE) {
            const chunk = [];
            for (let j = i; j < i + CHUNK_SIZE && j <= chapterCount; j++) {
                chunk.push(j);
            }

            await Promise.all(chunk.map(async (chNum) => {
                const ch = await scrapeChapter(code, chNum, bookInfo.book);
                // Insert in correct order later or find index? 
                // We'll sort later.
                scrapedBook.chapters.push(ch);
            }));

            // Small delay
            await new Promise(r => setTimeout(r, 200));
            process.stdout.write('.');
        }

        // Sort chapters
        scrapedBook.chapters.sort((a, b) => a.number - b.number);
        books[bookInfo.book] = scrapedBook;
        console.log(`\n  Done ${bookInfo.book}.`);
    }

    // Save to file
    const fileContent = `
import { ParsedBook } from '../../utils/bibleParser';

export const BIBLIJA_RKK1998: Record<string, ParsedBook> = ${JSON.stringify(books, null, 2)};
`;
    // We cast to ParsedBook compatible type

    fs.writeFileSync(OUTPUT_FILE, fileContent, 'utf-8');
    console.log(`Saved to ${OUTPUT_FILE}`);
}

scrapeAll();
