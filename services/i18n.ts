/**
 * Internationalization (i18n) Service
 * Multi-language support for the platform
 */

// Supported languages
export type Language = 'lt' | 'en' | 'la' | 'pl' | 'de';

export interface LanguageConfig {
  code: Language;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', direction: 'ltr', flag: '🇱🇹' },
  { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', flag: '🇬🇧' },
  { code: 'la', name: 'Latin', nativeName: 'Latina', direction: 'ltr', flag: '🏛️' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', direction: 'ltr', flag: '🇵🇱' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr', flag: '🇩🇪' }
];

// Translation dictionary
export type TranslationKey = 
  // Navigation
  | 'nav.home' | 'nav.bible' | 'nav.search' | 'nav.annotations' | 'nav.settings'
  // Search
  | 'search.placeholder' | 'search.button' | 'search.filters' | 'search.results'
  | 'search.noResults' | 'search.loading' | 'search.advanced'
  // Bible
  | 'bible.selectBook' | 'bible.selectChapter' | 'bible.verse' | 'bible.chapter'
  | 'bible.parallel' | 'bible.crossRef'
  // Annotations
  | 'annotations.title' | 'annotations.highlight' | 'annotations.note' | 'annotations.bookmark'
  | 'annotations.delete' | 'annotations.edit' | 'annotations.save'
  // Analysis
  | 'analysis.citations' | 'analysis.crossRefs' | 'analysis.parallel' | 'analysis.themes'
  | 'analysis.keyTerms'
  // Common
  | 'common.loading' | 'common.error' | 'common.success' | 'common.cancel' | 'common.save'
  | 'common.delete' | 'common.edit' | 'common.close' | 'common.open' | 'common.back'
  | 'common.next' | 'common.previous' | 'common.submit' | 'common.clear';

export const TRANSLATIONS: Record<Language, Partial<Record<TranslationKey, string>>> = {
  lt: {
    // Navigation
    'nav.home': 'Pradžia',
    'nav.bible': 'Biblija',
    'nav.search': 'Paieška',
    'nav.annotations': 'Anotacijos',
    'nav.settings': 'Nustatymai',
    // Search
    'search.placeholder': 'Ieškoti tekstuose...',
    'search.button': 'Ieškoti',
    'search.filters': 'Filtrai',
    'search.results': 'Paieškos rezultatai',
    'search.noResults': 'Rezultatų nerasta',
    'search.loading': 'Ieškoma...',
    'search.advanced': 'Išplėstinė paieška',
    // Bible
    'bible.selectBook': 'Pasirinkite knygą',
    'bible.selectChapter': 'Pasirinkite skyrių',
    'bible.verse': 'eil.',
    'bible.chapter': 'skyrius',
    'bible.parallel': 'Lyginamieji tekstai',
    'bible.crossRef': 'Kryžminės nuorodos',
    // Annotations
    'annotations.title': 'Mano anotacijos',
    'annotations.highlight': 'Pažymėti',
    'annotations.note': 'Pridėti pastabą',
    'annotations.bookmark': 'Žymėti',
    'annotations.delete': 'Ištrinti',
    'annotations.edit': 'Redaguoti',
    'annotations.save': 'Išsaugoti',
    // Analysis
    'analysis.citations': 'Citatos',
    'analysis.crossRefs': 'Kryžminės nuorodos',
    'analysis.parallel': 'Lyginamieji tekstai',
    'analysis.themes': 'Temų analizė',
    'analysis.keyTerms': 'Pagrindinės sąvokos',
    // Common
    'common.loading': 'Kraunama...',
    'common.error': 'Įvyko klaida',
    'common.success': 'Sėkmingai atlikta',
    'common.cancel': 'Atšaukti',
    'common.save': 'Išsaugoti',
    'common.delete': 'Ištrinti',
    'common.edit': 'Redaguoti',
    'common.close': 'Uždaryti',
    'common.open': 'Atidaryti',
    'common.back': 'Atgal',
    'common.next': 'Kitas',
    'common.previous': 'Ankstesnis',
    'common.submit': 'Pateikti',
    'common.clear': 'Išvalyti'
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.bible': 'Bible',
    'nav.search': 'Search',
    'nav.annotations': 'Annotations',
    'nav.settings': 'Settings',
    // Search
    'search.placeholder': 'Search texts...',
    'search.button': 'Search',
    'search.filters': 'Filters',
    'search.results': 'Search Results',
    'search.noResults': 'No results found',
    'search.loading': 'Searching...',
    'search.advanced': 'Advanced Search',
    // Bible
    'bible.selectBook': 'Select Book',
    'bible.selectChapter': 'Select Chapter',
    'bible.verse': 'v.',
    'bible.chapter': 'chapter',
    'bible.parallel': 'Parallel Texts',
    'bible.crossRef': 'Cross References',
    // Annotations
    'annotations.title': 'My Annotations',
    'annotations.highlight': 'Highlight',
    'annotations.note': 'Add Note',
    'annotations.bookmark': 'Bookmark',
    'annotations.delete': 'Delete',
    'annotations.edit': 'Edit',
    'annotations.save': 'Save',
    // Analysis
    'analysis.citations': 'Citations',
    'analysis.crossRefs': 'Cross References',
    'analysis.parallel': 'Parallel Texts',
    'analysis.themes': 'Theme Analysis',
    'analysis.keyTerms': 'Key Terms',
    // Common
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.open': 'Open',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.submit': 'Submit',
    'common.clear': 'Clear'
  },
  la: {
    // Navigation
    'nav.home': 'Domus',
    'nav.bible': 'Biblia',
    'nav.search': 'Quaerere',
    'nav.annotations': 'Annotationes',
    'nav.settings': 'Optiones',
    // Search
    'search.placeholder': 'Quaerere in textibus...',
    'search.button': 'Quaerere',
    'search.filters': 'Filtri',
    'search.results': 'Eventa quaestionis',
    'search.noResults': 'Nulla eventa inventa',
    'search.loading': 'Quaerens...',
    'search.advanced': 'Quaestio provecta',
    // Bible
    'bible.selectBook': 'Elige Librum',
    'bible.selectChapter': 'Elige Caput',
    'bible.verse': 'v.',
    'bible.chapter': 'caput',
    'bible.parallel': 'Textus Parallelus',
    'bible.crossRef': 'Referentiae Cruciatae',
    // Annotations
    'annotations.title': 'Meae Annotationes',
    'annotations.highlight': 'Signare',
    'annotations.note': 'Notam Addere',
    'annotations.bookmark': 'Signaculum',
    'annotations.delete': 'Delere',
    'annotations.edit': 'Recensere',
    'annotations.save': 'Servare',
    // Analysis
    'analysis.citations': 'Citationes',
    'analysis.crossRefs': 'Referentiae Cruciatae',
    'analysis.parallel': 'Textus Parallelus',
    'analysis.themes': 'Analyse Thematum',
    'analysis.keyTerms': 'Termini Claves',
    // Common
    'common.loading': 'Onerans...',
    'common.error': 'Error accidit',
    'common.success': 'Successus',
    'common.cancel': 'Abrogare',
    'common.save': 'Servare',
    'common.delete': 'Delere',
    'common.edit': 'Recensere',
    'common.close': 'Claudere',
    'common.open': 'Aperire',
    'common.back': 'Retro',
    'common.next': 'Proximus',
    'common.previous': 'Prior',
    'common.submit': 'Submittere',
    'common.clear': 'Purgare'
  },
  pl: {
    // Navigation
    'nav.home': 'Strona główna',
    'nav.bible': 'Biblia',
    'nav.search': 'Szukaj',
    'nav.annotations': 'Adnotacje',
    'nav.settings': 'Ustawienia',
    // Search
    'search.placeholder': 'Szukaj w tekstach...',
    'search.button': 'Szukaj',
    'search.filters': 'Filtry',
    'search.results': 'Wyniki wyszukiwania',
    'search.noResults': 'Nie znaleziono wyników',
    'search.loading': 'Wyszukiwanie...',
    'search.advanced': 'Wyszukiwanie zaawansowane',
    // Bible
    'bible.selectBook': 'Wybierz księgę',
    'bible.selectChapter': 'Wybierz rozdział',
    'bible.verse': 'w.',
    'bible.chapter': 'rozdział',
    'bible.parallel': 'Teksty równoległe',
    'bible.crossRef': 'Odsyłacze',
    // Annotations
    'annotations.title': 'Moje adnotacje',
    'annotations.highlight': 'Zaznacz',
    'annotations.note': 'Dodaj notatkę',
    'annotations.bookmark': 'Zakładka',
    'annotations.delete': 'Usuń',
    'annotations.edit': 'Edytuj',
    'annotations.save': 'Zapisz',
    // Analysis
    'analysis.citations': 'Cytaty',
    'analysis.crossRefs': 'Odsyłacze',
    'analysis.parallel': 'Teksty równoległe',
    'analysis.themes': 'Analiza tematów',
    'analysis.keyTerms': 'Kluczowe pojęcia',
    // Common
    'common.loading': 'Ładowanie...',
    'common.error': 'Wystąpił błąd',
    'common.success': 'Sukces',
    'common.cancel': 'Anuluj',
    'common.save': 'Zapisz',
    'common.delete': 'Usuń',
    'common.edit': 'Edytuj',
    'common.close': 'Zamknij',
    'common.open': 'Otwórz',
    'common.back': 'Wstecz',
    'common.next': 'Następny',
    'common.previous': 'Poprzedni',
    'common.submit': 'Wyślij',
    'common.clear': 'Wyczyść'
  },
  de: {
    // Navigation
    'nav.home': 'Startseite',
    'nav.bible': 'Bibel',
    'nav.search': 'Suche',
    'nav.annotations': 'Anmerkungen',
    'nav.settings': 'Einstellungen',
    // Search
    'search.placeholder': 'In Texten suchen...',
    'search.button': 'Suchen',
    'search.filters': 'Filter',
    'search.results': 'Suchergebnisse',
    'search.noResults': 'Keine Ergebnisse gefunden',
    'search.loading': 'Suche läuft...',
    'search.advanced': 'Erweiterte Suche',
    // Bible
    'bible.selectBook': 'Buch auswählen',
    'bible.selectChapter': 'Kapitel auswählen',
    'bible.verse': 'V.',
    'bible.chapter': 'Kapitel',
    'bible.parallel': 'Parallele Texte',
    'bible.crossRef': 'Querverweise',
    // Annotations
    'annotations.title': 'Meine Anmerkungen',
    'annotations.highlight': 'Markieren',
    'annotations.note': 'Notiz hinzufügen',
    'annotations.bookmark': 'Lesezeichen',
    'annotations.delete': 'Löschen',
    'annotations.edit': 'Bearbeiten',
    'annotations.save': 'Speichern',
    // Analysis
    'analysis.citations': 'Zitate',
    'analysis.crossRefs': 'Querverweise',
    'analysis.parallel': 'Parallele Texte',
    'analysis.themes': 'Themenanalyse',
    'analysis.keyTerms': 'Schlüsselbegriffe',
    // Common
    'common.loading': 'Laden...',
    'common.error': 'Ein Fehler ist aufgetreten',
    'common.success': 'Erfolgreich',
    'common.cancel': 'Abbrechen',
    'common.save': 'Speichern',
    'common.delete': 'Löschen',
    'common.edit': 'Bearbeiten',
    'common.close': 'Schließen',
    'common.open': 'Öffnen',
    'common.back': 'Zurück',
    'common.next': 'Weiter',
    'common.previous': 'Zurück',
    'common.submit': 'Absenden',
    'common.clear': 'Löschen'
  }
};

// Current language state
let currentLanguage: Language = 'lt';

/**
 * Sets the current language
 */
export const setLanguage = (lang: Language): void => {
  currentLanguage = lang;
  localStorage.setItem('preferredLanguage', lang);
  
  // Dispatch event for components to react
  window.dispatchEvent(new CustomEvent('languagechange', { detail: { language: lang } }));
};

/**
 * Gets the current language
 */
export const getLanguage = (): Language => {
  // Check for stored preference
  const stored = localStorage.getItem('preferredLanguage') as Language;
  if (stored && SUPPORTED_LANGUAGES.some(l => l.code === stored)) {
    currentLanguage = stored;
  }
  return currentLanguage;
};

/**
 * Translates a key to the current language
 */
export const t = (key: TranslationKey, fallback?: string): string => {
  const lang = getLanguage();
  const translation = TRANSLATIONS[lang][key];
  
  if (translation) {
    return translation;
  }
  
  // Fallback to English
  const englishTranslation = TRANSLATIONS.en[key];
  if (englishTranslation) {
    return englishTranslation;
  }
  
  // Return fallback or key
  return fallback || key;
};

/**
 * Formats a date according to current locale
 */
export const formatDate = (date: Date | number, options?: Intl.DateTimeFormatOptions): string => {
  const lang = getLanguage();
  const d = typeof date === 'number' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };
  
  const localeMap: Record<Language, string> = {
    lt: 'lt-LT',
    en: 'en-US',
    la: 'la-LA',
    pl: 'pl-PL',
    de: 'de-DE'
  };
  
  return d.toLocaleDateString(localeMap[lang], defaultOptions);
};

/**
 * Formats a number according to current locale
 */
export const formatNumber = (num: number, options?: Intl.NumberFormatOptions): string => {
  const lang = getLanguage();
  
  const localeMap: Record<Language, string> = {
    lt: 'lt-LT',
    en: 'en-US',
    la: 'la-LA',
    pl: 'pl-PL',
    de: 'de-DE'
  };
  
  return num.toLocaleString(localeMap[lang], options);
};

/**
 * Detects the user's preferred language from browser
 */
export const detectBrowserLanguage = (): Language => {
  const browserLang = navigator.language.toLowerCase();
  
  if (browserLang.startsWith('lt')) return 'lt';
  if (browserLang.startsWith('en')) return 'en';
  if (browserLang.startsWith('la')) return 'la';
  if (browserLang.startsWith('pl')) return 'pl';
  if (browserLang.startsWith('de')) return 'de';
  
  return 'lt'; // Default to Lithuanian
};

/**
 * Initializes language from storage or browser preference
 */
export const initializeLanguage = (): Language => {
  const stored = localStorage.getItem('preferredLanguage') as Language;
  
  if (stored && SUPPORTED_LANGUAGES.some(l => l.code === stored)) {
    setLanguage(stored);
    return stored;
  }
  
  const detected = detectBrowserLanguage();
  setLanguage(detected);
  return detected;
};

/**
 * React hook for language state
 */
export const useLanguage = () => {
  const getCurrentLanguage = (): Language => getLanguage();
  
  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
  };
  
  return {
    language: getCurrentLanguage(),
    setLanguage: changeLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    t
  };
};

/**
 * Translates biblical book names
 */
export const translateBookName = (bookName: string, targetLang: Language = getLanguage()): string => {
  // Book name translations
  const bookTranslations: Record<string, Record<Language, string>> = {
    'Genesis': { lt: 'Pradžios', en: 'Genesis', la: 'Genesis', pl: 'Rodzaju', de: 'Genesis' },
    'Exodus': { lt: 'Išėjimo', en: 'Exodus', la: 'Exodus', pl: 'Wyjścia', de: 'Exodus' },
    'Matthew': { lt: 'Mato', en: 'Matthew', la: 'Matthaeus', pl: 'Mateusza', de: 'Matthäus' },
    'Mark': { lt: 'Markaus', en: 'Mark', la: 'Marcus', pl: 'Marka', de: 'Markus' },
    'Luke': { lt: 'Luko', en: 'Luke', la: 'Lucas', pl: 'Łukasza', de: 'Lukas' },
    'John': { lt: 'Jono', en: 'John', la: 'Ioannes', pl: 'Jana', de: 'Johannes' },
    'Psalms': { lt: 'Psalmių', en: 'Psalms', la: 'Psalmi', pl: 'Psalmów', de: 'Psalmen' }
  };
  
  const normalized = bookName.replace(/\s+(evangelija|gospel)$/i, '');
  const translation = bookTranslations[normalized];
  
  if (translation) {
    return translation[targetLang] || translation.en || bookName;
  }
  
  return bookName;
};

/**
 * Gets text direction for current language
 */
export const getTextDirection = (): 'ltr' | 'rtl' => {
  const lang = getLanguage();
  const config = SUPPORTED_LANGUAGES.find(l => l.code === lang);
  return config?.direction || 'ltr';
};