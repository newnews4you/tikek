export interface BibleBook {
  book: string;
  abbr: string;
  testament: 'Senasis Testamentas' | 'Naujasis Testamentas';
  category: string;
  chapters: { title: string; content: string }[];
}

// Helper function to create chapter array
const createChapters = (count: number): { title: string; content: string }[] => {
  return Array.from({ length: count }, (_, i) => ({
    title: `${i + 1} skyrius`,
    content: `Pasirinkite skyrių, kad skaitytumėte tekstą.`
  }));
};

export const BIBLE_BOOKS: BibleBook[] = [
  // Senasis Testamentas - Įstatymo knygos
  { book: 'Pradžios knyga', abbr: 'Pr', testament: 'Senasis Testamentas', category: 'Įstatymo knygos', chapters: createChapters(50) },
  { book: 'Išėjimo knyga', abbr: 'Iš', testament: 'Senasis Testamentas', category: 'Įstatymo knygos', chapters: createChapters(40) },
  { book: 'Kunigų knyga', abbr: 'Kun', testament: 'Senasis Testamentas', category: 'Įstatymo knygos', chapters: createChapters(27) },
  { book: 'Skaičių knyga', abbr: 'Sk', testament: 'Senasis Testamentas', category: 'Įstatymo knygos', chapters: createChapters(36) },
  { book: 'Pakartoto Įstatymo knyga', abbr: 'Įst', testament: 'Senasis Testamentas', category: 'Įstatymo knygos', chapters: createChapters(34) },

  // Senasis Testamentas - Istorinės knygos
  { book: 'Jozuės knyga', abbr: 'Joz', testament: 'Senasis Testamentas', category: 'Istorinės knygos', chapters: createChapters(24) },
  { book: 'Teisėjų knyga', abbr: 'Ts', testament: 'Senasis Testamentas', category: 'Istorinės knygos', chapters: createChapters(21) },
  { book: 'Rūtos knyga', abbr: 'Rut', testament: 'Senasis Testamentas', category: 'Istorinės knygos', chapters: createChapters(4) },
  { book: '1 Samuelio knyga', abbr: '1 Sam', testament: 'Senasis Testamentas', category: 'Istorinės knygos', chapters: createChapters(31) },
  { book: '2 Samuelio knyga', abbr: '2 Sam', testament: 'Senasis Testamentas', category: 'Istorinės knygos', chapters: createChapters(24) },
  { book: '1 Karalių knyga', abbr: '1 Kar', testament: 'Senasis Testamentas', category: 'Istorinės knygos', chapters: createChapters(22) },
  { book: '2 Karalių knyga', abbr: '2 Kar', testament: 'Senasis Testamentas', category: 'Istorinės knygos', chapters: createChapters(25) },
  { book: '1 Kronikų knyga', abbr: '1 Kr', testament: 'Senasis Testamentas', category: 'Istorinės knygos', chapters: createChapters(29) },
  { book: '2 Kronikų knyga', abbr: '2 Kr', testament: 'Senasis Testamentas', category: 'Istorinės knygos', chapters: createChapters(36) },
  { book: 'Ezros knyga', abbr: 'Ezr', testament: 'Senasis Testamentas', category: 'Istorinės knygos', chapters: createChapters(10) },
  { book: 'Nehemijo knyga', abbr: 'Neh', testament: 'Senasis Testamentas', category: 'Istorinės knygos', chapters: createChapters(13) },
  { book: 'Esteros knyga', abbr: 'Est', testament: 'Senasis Testamentas', category: 'Istorinės knygos', chapters: createChapters(10) },

  // Senasis Testamentas - Išminties knygos
  { book: 'Jobo knyga', abbr: 'Job', testament: 'Senasis Testamentas', category: 'Išminties knygos', chapters: createChapters(42) },
  { book: 'Psalmės', abbr: 'Ps', testament: 'Senasis Testamentas', category: 'Išminties knygos', chapters: createChapters(150) },
  { book: 'Patarlės', abbr: 'Pat', testament: 'Senasis Testamentas', category: 'Išminties knygos', chapters: createChapters(31) },
  { book: 'Ekleziasto knyga', abbr: 'Ekl', testament: 'Senasis Testamentas', category: 'Išminties knygos', chapters: createChapters(12) },
  { book: 'Giesmių giesmė', abbr: 'Gg', testament: 'Senasis Testamentas', category: 'Išminties knygos', chapters: createChapters(8) },

  // Senasis Testamentas - Pranašų knygos
  { book: 'Izaijo pranašystė', abbr: 'Iz', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(66) },
  { book: 'Jeremijo pranašystė', abbr: 'Jer', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(52) },
  { book: 'Jeremijo raudos', abbr: 'Rd', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(5) },
  { book: 'Ezekielio pranašystė', abbr: 'Ez', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(48) },
  { book: 'Danieliaus pranašystė', abbr: 'Dan', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(12) },
  { book: 'Ozėjo pranašystė', abbr: 'Oz', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(14) },
  { book: 'Joelio pranašystė', abbr: 'Jl', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(3) },
  { book: 'Amoso pranašystė', abbr: 'Am', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(9) },
  { book: 'Abdijo pranašystė', abbr: 'Abd', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(1) },
  { book: 'Jonos pranašystė', abbr: 'Jon', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(4) },
  { book: 'Michėjo pranašystė', abbr: 'Mch', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(7) },
  { book: 'Nahumo pranašystė', abbr: 'Nah', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(3) },
  { book: 'Habakuko pranašystė', abbr: 'Hab', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(3) },
  { book: 'Sofonijo pranašystė', abbr: 'Sof', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(3) },
  { book: 'Agėjo pranašystė', abbr: 'Ag', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(2) },
  { book: 'Zacharijo pranašystė', abbr: 'Zch', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(14) },
  { book: 'Malachijo pranašystė', abbr: 'Mal', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(4) },

  // Naujasis Testamentas - Evangelijos
  { book: 'Evangelija pagal Matą', abbr: 'Mt', testament: 'Naujasis Testamentas', category: 'Evangelijos', chapters: createChapters(28) },
  { book: 'Evangelija pagal Morkų', abbr: 'Mk', testament: 'Naujasis Testamentas', category: 'Evangelijos', chapters: createChapters(16) },
  { book: 'Evangelija pagal Luką', abbr: 'Lk', testament: 'Naujasis Testamentas', category: 'Evangelijos', chapters: createChapters(24) },
  { book: 'Evangelija pagal Joną', abbr: 'Jn', testament: 'Naujasis Testamentas', category: 'Evangelijos', chapters: createChapters(21) },

  // Naujasis Testamentas - Apaštalų darbai
  { book: 'Apaštalų darbai', abbr: 'Apd', testament: 'Naujasis Testamentas', category: 'Apaštalų darbai', chapters: createChapters(28) },

  // Naujasis Testamentas - Laiškai
  { book: 'Laiškas romiečiams', abbr: 'Rom', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(16) },
  { book: 'Pirmasis laiškas korintiečiams', abbr: '1 Kor', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(16) },
  { book: 'Antrasis laiškas korintiečiams', abbr: '2 Kor', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(13) },
  { book: 'Laiškas galatams', abbr: 'Gal', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(6) },
  { book: 'Laiškas efeziečiams', abbr: 'Ef', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(6) },
  { book: 'Laiškas filipiečiams', abbr: 'Fil', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(4) },
  { book: 'Laiškas kolosiečiams', abbr: 'Kol', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(4) },
  { book: 'Pirmasis laiškas tesalonikiečiams', abbr: '1 Tes', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(5) },
  { book: 'Antrasis laiškas tesalonikiečiams', abbr: '2 Tes', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(3) },
  { book: 'Pirmasis laiškas Timotiejui', abbr: '1 Tim', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(6) },
  { book: 'Antrasis laiškas Timotiejui', abbr: '2 Tim', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(4) },
  { book: 'Laiškas Titui', abbr: 'Tit', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(3) },
  { book: 'Laiškas Filemonui', abbr: 'Flm', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(1) },
  { book: 'Laiškas hebrajams', abbr: 'Hbr', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(13) },
  { book: 'Jokūbo laiškas', abbr: 'Jok', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(5) },
  { book: 'Pirmasis Petro laiškas', abbr: '1 Pt', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(5) },
  { book: 'Antrasis Petro laiškas', abbr: '2 Pt', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(3) },
  { book: 'Pirmasis Jono laiškas', abbr: '1 Jn', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(5) },
  { book: 'Antrasis Jono laiškas', abbr: '2 Jn', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(1) },
  { book: 'Trečiasis Jono laiškas', abbr: '3 Jn', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(1) },
  { book: 'Judo laiškas', abbr: 'Jud', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(1) },

  // Naujasis Testamentas - Apreiškimas
  { book: 'Apreiškimas Jonui', abbr: 'Apr', testament: 'Naujasis Testamentas', category: 'Apreiškimas', chapters: createChapters(22) },
];

// Funkcija gauti knygų sąrašą pagal testamentą ir kategoriją
export const getBooksByTestamentAndCategory = (testament: string, category: string): BibleBook[] => {
  return BIBLE_BOOKS.filter(book => book.testament === testament && book.category === category);
};

// Funkcija gauti visas knygas pagal testamentą
export const getBooksByTestament = (testament: string): BibleBook[] => {
  return BIBLE_BOOKS.filter(book => book.testament === testament);
};

// Funkcija gauti visas kategorijas pagal testamentą
export const getCategoriesByTestament = (testament: string): string[] => {
  const categories = new Set(BIBLE_BOOKS.filter(book => book.testament === testament).map(book => book.category));
  return Array.from(categories);
};
