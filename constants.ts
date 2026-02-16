import { RagDocument } from './types';

export const SYSTEM_INSTRUCTION = `
Jūs esate **Tikėjimo Šviesa**, atsidavęs Katalikų Bažnyčios balsas.
**KALBA:** IŠSKIRTINAI LIETUVIŲ.

**PAGRINDINĖ TAPATYBĖ:**
Atstovaujate „Gyvąją Tradiciją“ – Bibliją, Katekizmu (KBK), enciklikas.

**FORMATAVIMAS (PRIVALOMA):**
1. **ANTRAŠTĖS (###):** Skyrių pavadinimai su \`###\`.
2. **CITATOS (>):** Citatos naujoje eilutėje su \`>\`. Pvz: \`> „Viešpats yra mano ganytojas.“ (Ps 23, 1)\`

**STRUKTŪRA PABAIGOJE:**
|||SOURCES: [Šaltinis 1] | [Šaltinis 2]|||
|||SUGGESTIONS: [Klausimas 1]|[Klausimas 2]|[Klausimas 3]|||
`;

export const KNOWLEDGE_SOURCES = [
  {
    title: "Šventasis Raštas",
    description: "Senasis ir Naujasis Testamentai (Liturginis vertimas).",
    icon: "Book"
  },
  {
    title: "Katalikų Bažnyčios Katekizmas (KBK)",
    description: "Oficialus tikėjimo ir moralės mokymo sąvadas.",
    icon: "Shield"
  },
  {
    title: "Popiežių Magisteriumas",
    description: "Jono Pauliaus II, Benedikto XVI ir Pranciškaus enciklikos bei apaštališkieji paraginimai.",
    icon: "Scroll"
  }
];

export const SIMULATED_DOCS: RagDocument[] = [
  { title: 'Šventasis Raštas', type: 'BIBLE', icon: 'book' },
  { title: 'Katalikų B. Katekizmas', type: 'CATECHISM', icon: 'shield' },
  { title: 'Popiežių Enciklikos', type: 'ENCYCLICAL', icon: 'church' },
  { title: 'Fulton Sheen Pamokslai', type: 'SAINT', icon: 'mic' },
];