# Tikėjimo Šviesa – Katalikiškas Žinių Asistentas

**Tikėjimo Šviesa** yra pažangus, dirbtiniu intelektu paremtas asistentas, skirtas padėti tikintiesiems ir ieškantiems atsakymų rasti teisingą informaciją Šventajame Rašte, Bažnyčios dokumentuose ir liturgijoje.

<div align="center">
  <img src="https://via.placeholder.com/800x400?text=App+Screenshot" alt="Programėlės vaizdas" width="800" />
</div>

## ✨ Pagrindinės Funkcijos

*   **AI Pokalbių Asistentas**: Integruotas „Google Gemini“ modelis, kuris atsako į klausimus remdamasis katalikiška teologija ir Šventuoju Raštu.
*   **Šventasis Raštas**: Integruota biblioteka su paieška (RKK1998, KJV vertimai).
*   **Liturginis Kalendorius**: Rodo dienos šventuosius, liturginį laiką ir dienos skaitinius.
*   **Maldynas**: Populiariausių maldų rinkinys.
*   **Turinio Žemėlapis**: Interaktyvi vizualizacija, rodanti ryšius tarp skirtingų tikėjimo temų ir šaltinių.
*   **PWA Palaikymas**: Programėle galima naudotis kaip vietine aplikacija telefone ar kompiuteryje (veikia be interneto pagrindinėms funkcijoms, išskyrus AI).

## 🛠 Technologijos

Projektas sukurtas naudojant šiuolaikines web technologijas:

*   **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **AI**: [Google Gemini API](https://ai.google.dev/) (`@google/genai`)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **PWA**: [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)

## 🚀 Paleidimas (Run Locally)

Norėdami pasileisti projektą savo kompiuteryje:

### 1. Reikalavimai
*   Node.js (versija 18+ rekomenduojama)
*   npm arba pnpm

### 2. Įdiegimas

Atsisiųskite repozitoriją ir įdiekite priklausomybes:

```bash
git clone [REPO_URL]
cd tikejimo-sviesa
npm install
```

### 3. Konfigūracija

Sukurkite failą `.env.local` projekto šakninėje direktorijoje ir įrašykite savo Google Gemini API raktą:

```env
VITE_GEMINI_API_KEY=Jūsų_Gemini_API_Raktas
```

> **Pastaba**: API raktą galite gauti per [Google AI Studio](https://aistudio.google.com/).

### 4. Paleidimas

```bash
npm run dev
```

Programėlė pasileis adresu `http://localhost:5173` (arba panašiu, kurį nurodys terminalas).

## 📦 PWA Diegimas

Šis projektas sukonfigūruotas kaip Progressive Web App (PWA). Naršyklėje (pvz., Chrome ar Safari) matysite diegimo ikoną adreso juostoje, leidžiančią įsirašyti programėlę į įrenginį.

## 🤝 Prisidėjimas

Norėdami prisidėti prie projekto:
1. Sukurkite "Fork" šios repozitorijos.
2. Sukurkite naują šaką (`git checkout -b feature/nauja-funkcija`).
3. Atlikite pakeitimus ir "Commit" (`git commit -m 'Pridėta nauja funkcija'`).
4. "Push" į šaką (`git push origin feature/nauja-funkcija`).
5. Sukurkite "Pull Request".

---
*Garbė Jėzui Kristui.*
