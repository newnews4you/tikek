
import { useMemo } from 'react';
import { BIBLIJA_RKK1998 } from '../data/library/Biblija_RKK1998';
import { ParsedBook, ParsedChapter } from '../utils/bibleParser';

// Singleton to cache parsed data (though RKK1998 is already structured, we might not need parsing)
let bibleData: Record<string, ParsedBook> = BIBLIJA_RKK1998;

export const useBibleContent = () => {
    // If we were parsing a string, we would do it here. 
    // Now we imported a structured object directly.

    // We can add a check if data is empty (scraper still running)
    const isReady = Object.keys(bibleData).length > 0;

    const getChapterContent = (bookName: string, chapterIndex: number): ParsedChapter | null => {
        if (!bibleData || !bibleData[bookName]) {
            return null;
        }

        const bookData = bibleData[bookName];
        // The scraped data uses 1-based indexing for chapter comparisons, 
        // assuming chapters array is sorted or we search by number
        const targetChapterNum = chapterIndex + 1;

        // Chapters are typically sorted, but let's find safer
        const chapter = bookData.chapters.find(c => c.number === targetChapterNum);

        return chapter || null;
    };

    return {
        getChapterContent,
        isReady
    };
};
