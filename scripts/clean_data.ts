
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE_PATH = path.join(__dirname, '../data/library/Biblija_RKK1998.ts');

const runCleanup = () => {
    console.log("Reading file directly:", DATA_FILE_PATH);
    let content = fs.readFileSync(DATA_FILE_PATH, 'utf-8');

    // Pattern: Bibliografiniai duomenys:... up to the end of the JSON string (closing quote)
    // We assume the string ends with a quote "
    // The noise often contains "© 2003" etc.

    // Regex explanation:
    // Bibliografiniai duomenys:  -> Start marker
    // [^"]*                      -> Match any char that is NOT a closing quote
    // term                       -> The content we want to remove
    const regex = /Bibliografiniai duomenys:[^"]*/g;

    // Always attempt replacements regardless of matching the first regex
    let modified = false;

    // 1. Bibliografiniai duomenys
    if (content.match(regex)) {
        console.log("Removing Bibliografiniai duomenys...");
        content = content.replace(regex, '');
        modified = true;
    }

    // 2. Copyrights
    const copyrightRegex = /© 2003 Katalikų interneto tarnyba[^"]*/g;
    if (content.match(copyrightRegex)) {
        console.log("Removing Copyrights...");
        content = content.replace(copyrightRegex, '');
        modified = true;
    }

    // 3. Navigation
    const navRegex = /teisės \| apie projektą[^"]*/g;
    if (content.match(navRegex)) {
        console.log("Removing Navigation...");
        content = content.replace(navRegex, '');
        modified = true;
    }

    // 4. Footnotes
    const footnotesRegex = /Išnašos:[^"]*/g;
    if (content.match(footnotesRegex)) {
        const count = content.match(footnotesRegex)?.length || 0;
        console.log(`Removing Footnotes (${count} occurrences)...`);
        content = content.replace(footnotesRegex, '');
        modified = true;
    }

    // 5. Note markers [i7]
    const noteMarkerRegex = /\[i\d+\]/g;
    if (content.match(noteMarkerRegex)) {
        console.log("Removing Note Markers...");
        content = content.replace(noteMarkerRegex, '');
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(DATA_FILE_PATH, content, 'utf-8');
        console.log("File saved successfully.");
    } else {
        console.log("Nothing to clean.");
    }
};

runCleanup();
