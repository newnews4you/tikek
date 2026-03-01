# Duomenų Biblioteka (Statiniai Duomenys)

**SVARBU:** Jei norite, kad duomenys būtų pasiekiami visiems vartotojams (įkėlus į Cloudflare), jie **PRIVALO** būti čia, `.ts` (TypeScript) formatu.

Čia **NEGALIMA** dėti PDF failų. Web aplikacija negali tiesiogiai skaityti PDF failų iš serverio aplankų be sudėtingo konvertavimo.

## Darbo eiga (Workflow):

1.  Turite PDF failą? Nukopijuokite jo tekstą.
2.  Sukurkite naują failą šiame aplanke, pvz.: `MarkoEvangelija.ts`.
3.  Įklijuokite tekstą į kintamąjį:
    ```typescript
    export const MARKO_EVANGELIJA_TEXT = `
      čia įklijuokite visą tekstą iš PDF...
      ...
    `;
    ```
4.  Nueikite į `../localDocuments.ts` ir importuokite šį kintamąjį.

Taip paruošta programėlė veiks "Cloudflare" be jokios papildomos duomenų bazės.
