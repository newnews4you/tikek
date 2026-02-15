
import { BIBLE_BOOKS } from '../data/library/BibleBooks';

export interface ParsedChapter {
    number: number;
    title: string;
    verses: { number: number, content: string }[];
}

export interface ParsedBook {
    title: string;
    chapters: ParsedChapter[];
}

export const parseBibleText = (rawText: string): Record<string, ParsedBook> => {
    const books: Record<string, ParsedBook> = {};

    // 1. Clean the text
    const lines = rawText.split('\n');
    const cleanLines: string[] = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Page markers
        if (trimmed.startsWith('--- Puslapis')) continue;
        if (trimmed === 'BIBLIJA' || trimmed.startsWith('KARALIAUS JOKŪBO')) continue;

        // Headers
        if (trimmed.includes('KNYGŲ SĄRAŠAS')) continue;
        if (trimmed.match(/puslapio nr/i)) continue;
        if (trimmed.includes(' Skyrių skaičius ')) continue;
        if (trimmed.match(/\.{4,}/)) continue;

        // Footnotes: e.g. "1 [1] Pat 3:19..." or "[2] ..."
        if (trimmed.match(/^(\d+\s+)?\[\d+\]/)) continue;
        if (trimmed.match(/^\[\d+\]/)) continue;

        // Headers repeated on pages
        if (trimmed.match(/^\d+\s+\d+\s+[A-ZĄČĘĖĮŠŲŪŽ\s]+\d+(,\s*\d+)*$/)) continue;
        if (trimmed === 'SENASIS TESTAMENTAS' || trimmed === 'NAUJASIS TESTAMENTAS') continue;

        cleanLines.push(trimmed);
    }

    let currentBook: ParsedBook | null = null;
    let currentChapter: ParsedChapter | null = null;
    let currentVerseNum = 0;

    // Map canonical uppercase titles
    const bookTitleMap: Record<string, string> = {};
    BIBLE_BOOKS.forEach(b => {
        bookTitleMap[b.book.toUpperCase()] = b.book;
    });

    for (let i = 0; i < cleanLines.length; i++) {
        let line = cleanLines[i];

        // DETECT BOOK
        // Pattern: "y PRADŽIOS KNYGA" or similar.
        const titleMatch = line.match(/^y\s+([A-ZĄČĘĖĮŠŲŪŽ\s]+)$/);
        // Also fallback for just "PRADŽIOS KNYGA"
        const isTitleLine = titleMatch || bookTitleMap[line.toUpperCase()] || (line.endsWith('KNYGA') && line === line.toUpperCase() && line.length < 50);

        if (isTitleLine) {
            const rawTitle = titleMatch ? titleMatch[1] : line;
            let title = rawTitle.replace('y ', '').replace(' KNYGA', '').trim();

            // Map to canonical name
            let canonicalTitle = title;
            // Simple mapping based on known keywords
            if (title.includes('PRADŽIOS')) canonicalTitle = 'Pradžios knyga';
            else if (title.includes('IŠĖJIMO')) canonicalTitle = 'Išėjimo knyga';
            else if (title.includes('KUNIGŲ')) canonicalTitle = 'Kunigų knyga';
            else if (title.includes('SKAIČIŲ')) canonicalTitle = 'Skaičių knyga';
            else if (title.includes('PAKARTOTO')) canonicalTitle = 'Pakartoto Įstatymo knyga';
            else {
                // Try to find in map
                const mapKey = Object.keys(bookTitleMap).find(k => k.includes(title));
                if (mapKey) canonicalTitle = bookTitleMap[mapKey];
                else canonicalTitle = title.charAt(0) + title.slice(1).toLowerCase();
            }

            if (currentBook?.title !== canonicalTitle) {
                currentBook = {
                    title: canonicalTitle,
                    chapters: []
                };
                books[canonicalTitle] = currentBook;
                currentChapter = null;
                currentVerseNum = 0;
            }
            continue;
        }

        // Inline Book detection (header "y ...") followed by Content
        if (line.startsWith('y ')) {
            const sub = line.substring(2);
            const split = sub.match(/^([A-ZĄČĘĖĮŠŲŪŽ\s]+KNYGA)\s*(.*)/);
            if (split) {
                const titleKeyword = split[1].replace(' KNYGA', '').trim();
                let remainder = split[2];

                let canonicalTitle = titleKeyword;
                if (titleKeyword.includes('PRADŽIOS')) canonicalTitle = 'Pradžios knyga';
                else if (titleKeyword.includes('IŠĖJIMO')) canonicalTitle = 'Išėjimo knyga';
                else if (titleKeyword.includes('KUNIGŲ')) canonicalTitle = 'Kunigų knyga';
                else if (titleKeyword.includes('SKAIČIŲ')) canonicalTitle = 'Skaičių knyga';
                else if (titleKeyword.includes('PAKARTOTO')) canonicalTitle = 'Pakartoto Įstatymo knyga';

                currentBook = {
                    title: canonicalTitle,
                    chapters: []
                };
                books[canonicalTitle] = currentBook;
                currentChapter = null;
                currentVerseNum = 0;

                line = remainder;
                if (!line) continue;
            }
        }

        if (!currentBook) continue;

        // DETECT CHAPTER / VERSE
        // Simple tokenizer: split by numbers (\d+)
        // Note: Capture group in split includes the separator.
        const tokens = line.split(/(\d+)/);

        for (let j = 0; j < tokens.length; j++) {
            const token = tokens[j];
            if (!token.trim()) continue;

            const num = parseInt(token, 10);

            if (!isNaN(num)) {
                // It's a number. Check context.
                // Look ahead for content.
                let content = "";
                if (j + 1 < tokens.length) {
                    content = tokens[j + 1];
                    // If content is just space or empty, maybe more ahead?
                    if (!content.trim() && j + 2 < tokens.length) {
                        // Check next token? No, confusing.
                    }
                }

                if (!content.trim()) {
                    // Just a bare number at end of line? Suffix it to previous verse?
                    // Or ignore?
                    continue;
                }

                // DECISION: Chapter or Verse?
                let isChapter = false;
                let isVerse = false;

                // Heuristics
                if (!currentChapter) {
                    isChapter = true;
                } else {
                    // If number matches next expected verse
                    if (num === currentVerseNum + 1) {
                        isVerse = true;
                    }
                    // If number matches next expected chapter (and isn't expected verse)
                    else if (num === (currentChapter.number || 0) + 1) {
                        isChapter = true;
                    }
                    // If number is 1, and we are already deep in a chapter? New Chapter.
                    else if (num === 1 && currentVerseNum > 1) {
                        isChapter = true;
                    }
                    // If we erroneously missed a verse?
                    else if (num > currentVerseNum && num < currentVerseNum + 5) {
                        // Assume verse skip
                        isVerse = true;
                    }
                    else {
                        // Likely just a number in text
                        if (currentChapter.verses.length > 0) {
                            currentChapter.verses[currentChapter.verses.length - 1].content += token; // Add number back
                        }
                        continue;
                    }
                }

                if (isChapter) {
                    const newChNum = (!currentChapter) ? 1 : (num === 1 && currentChapter.number ? currentChapter.number + 1 : num);

                    currentChapter = {
                        number: newChNum,
                        title: `${currentBook.title} ${newChNum} skyrius`,
                        verses: []
                    };
                    currentBook.chapters.push(currentChapter);
                    currentVerseNum = 0;

                    // Does this number ALSO start verse 1?
                    // If the text immediately follows, treat it as Verse 1.
                    if (content.trim()) {
                        currentVerseNum = 1;
                        currentChapter.verses.push({ number: 1, content: content.trim() });
                    }
                    j++; // Skip content token
                } else if (isVerse) {
                    currentVerseNum = num;
                    currentChapter.verses.push({ number: num, content: content.trim() });
                    j++; // Skip content token
                }

            } else {
                // Text token. Append to current verse.
                if (currentChapter && currentChapter.verses.length > 0) {
                    currentChapter.verses[currentChapter.verses.length - 1].content += " " + token.trim();
                }
            }
        }
    }

    return books;
};
