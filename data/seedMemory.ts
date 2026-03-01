import { QAPair } from '../services/vectorMemory';

// This file contains "Golden Knowledge" that is pre-loaded for all users.
// You can generate this by exporting your own 'Smart Memory' from the browser console:
// window.exportKnowledge() -> Copy JSON -> Paste here.

export const SEED_MEMORY: QAPair[] = [
    // Example entry (Placeholder - real data should come from export)
    /*
    {
      id: "seed-1",
      question: "Kas yra Rožinis?",
      answer: "Rožinis yra meditacinė malda, kurioje apmąstomi Jėzaus ir Marijos gyvenimo slėpiniai...",
      embedding: [ ... ], // Vector data
      timestamp: 1700000000000,
      source: 'system'
    }
    */
];
