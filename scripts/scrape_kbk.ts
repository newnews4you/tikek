
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_FILE = path.join(__dirname, '../data/library/Katekizmas.ts');
const START_URL = 'https://katekizmas.lt/kbk-turinys';
const CONTENT_BASE_URL = 'https://katekizmas.lt/kbk/';

interface KBKSection {
    id: string;
    title: string;
    content: string;
}

const sections: KBKSection[] = [];

async function scrapeKBK() {
    console.log(`Starting KBK scrape from ${START_URL}...`);

    try {
        const { data: tocHtml } = await axios.get(START_URL, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        const $ = cheerio.load(tocHtml);
        const links: string[] = [];

        $('a').each((_, el) => {
            const href = $(el).attr('href');
            if (href && href.startsWith(CONTENT_BASE_URL)) {
                if (!links.includes(href)) {
                    links.push(href);
                }
            }
        });

        console.log(`Found ${links.length} content links.`);

        // Limit concurrency/speed to avoid ban. Process in chunks or one by one.
        for (const link of links) {
            console.log(`Scraping: ${link}...`);

            try {
                const { data: pageHtml } = await axios.get(link, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
                });
                const $p = cheerio.load(pageHtml);

                // Analyze page structure (simplified)
                // Remove Nav, Scripts, Styles
                $p('nav').remove();
                $p('header').remove();
                $p('footer').remove();
                $p('script').remove();
                $p('style').remove();
                $p('.navigation').remove(); // Possible class

                let title = $p('h1').first().text().trim() || $p('title').text().replace('| KATEKIZMAS.LT', '').trim();

                // Get main content. usually in a container or body
                // Best guess: look for the article or main div
                let contentEl = $p('article');
                if (contentEl.length === 0) contentEl = $p('main');
                if (contentEl.length === 0) contentEl = $p('.content'); // generic
                if (contentEl.length === 0) contentEl = $p('body'); // fallback

                let text = contentEl.text().replace(/\s+/g, ' ').trim();

                // Specific text cleanup
                text = text.replace(/Turinys/g, '');
                text = text.replace(/Atgal į pradžią/g, '');

                sections.push({
                    id: link.replace(CONTENT_BASE_URL, ''),
                    title: title,
                    content: text
                });

                // Polite delay
                await new Promise(r => setTimeout(r, 200));

            } catch (err) {
                console.error(`Failed to scrape ${link}:`, err);
            }
        }

        // Save
        const fileContent = `
export const KBK_FULL_TEXT = [
${sections.map(s => `  {
    id: "${s.id}",
    title: ${JSON.stringify(s.title)},
    content: ${JSON.stringify(s.content)}
  }`).join(',\n')}
];
`;
        fs.writeFileSync(OUTPUT_FILE, fileContent, 'utf-8');
        console.log(`KBK Scrape Complete. Saved ${sections.length} sections to ${OUTPUT_FILE}`);

    } catch (error) {
        console.error("Main scrape error:", error);
    }
}

scrapeKBK();
