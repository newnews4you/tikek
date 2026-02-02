// Biblijos knygų struktūra su pilnais pavadinimais
export interface BibleBook {
  book: string;
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
  { book: 'Pradžios knyga', testament: 'Senasis Testamentas', category: 'Įstatymo knygos', chapters: createChapters(50) },
  { book: 'Išėjimo knyga', testament: 'Senasis Testamentas', category: 'Įstatymo knygos', chapters: createChapters(40) },
  { book: 'Kunigų knyga', testament: 'Senasis Testamentas', category: 'Įstatymo knygos', chapters: createChapters(27) },
  { book: 'Skaičių knyga', testament: 'Senasis Testamentas', category: 'Įstatymo knygos', chapters: createChapters(36) },
  { book: 'Pakartoto Įstatymo knyga', testament: 'Senasis Testamentas', category: 'Įstatymo knygos', chapters: createChapters(34) },
  
  // Senasis Testamentas - Istorinės knygos
  { book: 'Jozuės knyga', testament: 'Senasis Testamentas', category: 'Istorinės knygos', chapters: createChapters(24) },
  { book: 'Teisėjų knyga', testament: 'Senasis Testamentas', category: 'Istorinės knygos', chapters: createChapters(21) },
  { book: 'Rūtos knyga', testament: 'Senasis Testamentas', category: 'Istorinės knygos', chapters: createChapters(4) },
  { book: '1 Samuelio knyga', testament: 'Senasis Testamentas', category: 'Istorinės knygos', chapters: createChapters(31) },
  { book: '2 Samuelio knyga', testament: 'Senasis Testamentas', category: 'Istorinės knygos', chapters: createChapters(24) },
  { book: '1 Karalių knyga', testament: 'Senasis Testamentas', category: 'Istorinės knygos', chapters: createChapters(22) },
  { book: '2 Karalių knyga', testament: 'Senasis Testamentas', category: 'Istorinės knygos', chapters: createChapters(25) },
  { book: '1 Kronikų knyga', testament: 'Senasis Testamentas', category: 'Istorinės knygos', chapters: createChapters(29) },
  { book: '2 Kronikų knyga', testament: 'Senasis Testamentas', category: 'Istorinės knygos', chapters: createChapters(36) },
  { book: 'Ezros knyga', testament: 'Senasis Testamentas', category: 'Istorinės knygos', chapters: createChapters(10) },
  { book: 'Nehemijo knyga', testament: 'Senasis Testamentas', category: 'Istorinės knygos', chapters: createChapters(13) },
  { book: 'Esteros knyga', testament: 'Senasis Testamentas', category: 'Istorinės knygos', chapters: createChapters(10) },
  
  // Senasis Testamentas - Išminties knygos
  { book: 'Jobo knyga', testament: 'Senasis Testamentas', category: 'Išminties knygos', chapters: createChapters(42) },
  { book: 'Psalmės', testament: 'Senasis Testamentas', category: 'Išminties knygos', chapters: createChapters(150) },
  { book: 'Patarlės', testament: 'Senasis Testamentas', category: 'Išminties knygos', chapters: createChapters(31) },
  { book: 'Ekleziasto knyga', testament: 'Senasis Testamentas', category: 'Išminties knygos', chapters: createChapters(12) },
  { book: 'Giesmių giesmė', testament: 'Senasis Testamentas', category: 'Išminties knygos', chapters: createChapters(8) },
  
  // Senasis Testamentas - Pranašų knygos
  { book: 'Izaijo pranašystė', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(66) },
  { book: 'Jeremijo pranašystė', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(52) },
  { book: 'Jeremijo raudos', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(5) },
  { book: 'Ezekielio pranašystė', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(48) },
  { book: 'Danieliaus pranašystė', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(12) },
  { book: 'Ozėjo pranašystė', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(14) },
  { book: 'Joelio pranašystė', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(3) },
  { book: 'Amoso pranašystė', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(9) },
  { book: 'Abdijo pranašystė', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(1) },
  { book: 'Jonos pranašystė', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(4) },
  { book: 'Michėjo pranašystė', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(7) },
  { book: 'Nahumo pranašystė', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(3) },
  { book: 'Habakuko pranašystė', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(3) },
  { book: 'Sofonijo pranašystė', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(3) },
  { book: 'Agėjo pranašystė', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(2) },
  { book: 'Zacharijo pranašystė', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(14) },
  { book: 'Malachijo pranašystė', testament: 'Senasis Testamentas', category: 'Pranašų knygos', chapters: createChapters(4) },
  
  // Naujasis Testamentas - Evangelijos
  { book: 'Evangelija pagal Matą', testament: 'Naujasis Testamentas', category: 'Evangelijos', chapters: createChapters(28) },
  { book: 'Evangelija pagal Morkų', testament: 'Naujasis Testamentas', category: 'Evangelijos', chapters: createChapters(16) },
  { book: 'Evangelija pagal Luką', testament: 'Naujasis Testamentas', category: 'Evangelijos', chapters: createChapters(24) },
  { book: 'Evangelija pagal Joną', testament: 'Naujasis Testamentas', category: 'Evangelijos', chapters: createChapters(21) },
  
  // Naujasis Testamentas - Apaštalų darbai
  { book: 'Apaštalų darbai', testament: 'Naujasis Testamentas', category: 'Apaštalų darbai', chapters: createChapters(28) },
  
  // Naujasis Testamentas - Laiškai
  { book: 'Laiškas romiečiams', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(16) },
  { book: 'Pirmasis laiškas korintiečiams', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(16) },
  { book: 'Antrasis laiškas korintiečiams', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(13) },
  { book: 'Laiškas galatams', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(6) },
  { book: 'Laiškas efeziečiams', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(6) },
  { book: 'Laiškas filipiečiams', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(4) },
  { book: 'Laiškas kolosiečiams', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(4) },
  { book: 'Pirmasis laiškas tesalonikiečiams', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(5) },
  { book: 'Antrasis laiškas tesalonikiečiams', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(3) },
  { book: 'Pirmasis laiškas Timotiejui', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(6) },
  { book: 'Antrasis laiškas Timotiejui', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(4) },
  { book: 'Laiškas Titui', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(3) },
  { book: 'Laiškas Filemonui', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(1) },
  { book: 'Laiškas hebrajams', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(13) },
  { book: 'Jokūbo laiškas', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(5) },
  { book: 'Pirmasis Petro laiškas', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(5) },
  { book: 'Antrasis Petro laiškas', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(3) },
  { book: 'Pirmasis Jono laiškas', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(5) },
  { book: 'Antrasis Jono laiškas', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(1) },
  { book: 'Trečiasis Jono laiškas', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(1) },
  { book: 'Judo laiškas', testament: 'Naujasis Testamentas', category: 'Laiškai', chapters: createChapters(1) },
  
  // Naujasis Testamentas - Apreiškimas
  { book: 'Apreiškimas Jonui', testament: 'Naujasis Testamentas', category: 'Apreiškimas', chapters: createChapters(22) },
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
