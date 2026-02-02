
import { parseBibleText } from '../utils/bibleParser';
import { BIBLIJA_LT_KJV_2012_TEXT } from '../data/library/Biblija-LT-KJV-2012';

console.log("Starting Parser Test...");

try {
    const books = parseBibleText(BIBLIJA_LT_KJV_2012_TEXT);
    const genesis = books['Pradžios knyga'];

    if (!genesis) {
        console.error("FAILED: Genesis not found!");
    } else {
        console.log(`Genesis found with ${genesis.chapters.length} chapters.`);

        // Check Chapter 1
        const ch1 = genesis.chapters.find(c => c.number === 1);
        console.log(`Chapter 1 length: ${ch1?.content.length || 0} chars`);

        // Check Chapter 12 (Critical for user)
        const ch12 = genesis.chapters.find(c => c.number === 12);
        if (ch12) {
            console.log("SUCCESS: Chapter 12 found!");
            console.log("Chapter 12 Preview:", ch12.content.substring(0, 100));
        } else {
            console.error("FAILED: Chapter 12 NOT found!");
        }

        // Check Chapter 2
        const ch2 = genesis.chapters.find(c => c.number === 2);
        if (ch2) {
            console.log(`Chapter 2 found. Preview: ${ch2.content.substring(0, 50)}...`);
        } else {
            console.error("FAILED: Chapter 2 not found");
        }

        // List all found chapters
        console.log("Found chapters:", genesis.chapters.map(c => c.number).join(", "));
    }

} catch (e) {
    console.error("Parser crashed:", e);
}
