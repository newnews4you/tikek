
import { parseBibleText } from './utils/bibleParser.ts';
import { BIBLIJA_LT_KJV_2012_TEXT } from './data/library/Biblija-LT-KJV-2012.ts';

console.log("Starting Parser Test...");

try {
    const books = parseBibleText(BIBLIJA_LT_KJV_2012_TEXT);
    const genesis = books['Pradžios knyga'];

    if (!genesis) {
        console.error("FAILED: Genesis not found!");
    } else {
        console.log(`Genesis found with ${genesis.chapters.length} chapters.`);

        // Check Chapter 1 (might be parsed as "Pradžios knyga 1 skyrius")
        const ch1 = genesis.chapters.find(c => c.number === 1);
        console.log(`Chapter 1 length: ${ch1?.content.length || 0} chars`);

        // Check Chapter 12
        const ch12 = genesis.chapters.find(c => c.number === 12);
        if (ch12) {
            console.log("SUCCESS: Chapter 12 found!");
            console.log("Chapter 12 Preview:", ch12.content.substring(0, 100).replace(/\n/g, ' '));
        } else {
            console.error("FAILED: Chapter 12 NOT found!");
        }

        // Check random chapters
        console.log("Chapters found:", genesis.chapters.map(c => c.number).join(","));
    }

} catch (e) {
    console.error("Parser crashed:", e);
}
