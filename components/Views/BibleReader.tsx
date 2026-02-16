import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Book,
  ChevronRight,
  MessageSquareQuote,
  Sparkles,
  X,
  Info,
  Send,
  User,
  Highlighter,
  Database,
  Search,
  Menu,
  BookOpen,
  Scroll,
  Church,
  Feather,
  Cross,
  FileText,
  ChevronDown,
  ChevronUp,
  Grid3X3,
  List,
  XCircle,
  ArrowLeft,
  Users,
  Mail,
  Star,
  Brain,
  Flame
} from 'lucide-react';
import { generateSimpleContent, sendMessageStream } from '../../services/geminiService';
import { useBibleContent } from '../../hooks/useBibleContent';
import { GenerateContentResponse } from '@google/genai';
import { getBibleStructure } from '../../data/knowledgeBase';
import { BIBLE_BOOKS } from '../../data/library/BibleBooks';
import { markChapterComplete, getProgressStats, checkStreak } from '../../services/progressService';
import { markPlanReadingComplete, hasActivePlan, getActivePlanIds, getAllPlanProgress } from '../../services/plansService';
import { ReadingMilestone } from '../Engagement/ReadingMilestone';
import { useTheme } from '../../context/ThemeContext';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// Bible book categories with colors and icons
const BOOK_CATEGORIES = {
  'Senasis Testamentas': {
    'Įstatymo knygos': { color: 'amber', icon: BookOpen },
    'Istorinės knygos': { color: 'orange', icon: Scroll },
    'Išminties knygos': { color: 'emerald', icon: Brain },
    'Pranašų knygos': { color: 'purple', icon: Flame }
  },
  'Naujasis Testamentas': {
    'Evangelijos': { color: 'red', icon: Cross },
    'Apaštalų darbai': { color: 'blue', icon: Users },
    'Laiškai': { color: 'indigo', icon: Mail },
    'Apreiškimas': { color: 'rose', icon: Star }
  }
};

// Map books to their categories
const getBookCategory = (bookName: string): { testament: string; category: string } => {
  const otLaw = ['Pradžios knyga', 'Išėjimo knyga', 'Kunigų knyga', 'Skaičių knyga', 'Pakartoto Įstatymo knyga'];
  const otHistory = ['Jozuės knyga', 'Teisėjų knyga', 'Rūtos knyga', '1 Samuelio knyga', '2 Samuelio knyga', '1 Karalių knyga', '2 Karalių knyga', '1 Kronikų knyga', '2 Kronikų knyga', 'Ezros knyga', 'Nehemijo knyga', 'Esteros knyga'];
  const otWisdom = ['Jobo knyga', 'Psalmės', 'Patarlės', 'Ekleziasto knyga', 'Giesmių giesmė'];
  const otProphets = ['Izaijo pranašystė', 'Jeremijo pranašystė', 'Jeremijo raudos', 'Ezekielio pranašystė', 'Danieliaus pranašystė', 'Ozėjo pranašystė', 'Joelio pranašystė', 'Amoso pranašystė', 'Abdijo pranašystė', 'Jonos pranašystė', 'Michėjo pranašystė', 'Nahumo pranašystė', 'Habakuko pranašystė', 'Sofonijo pranašystė', 'Agėjo pranašystė', 'Zacharijo pranašystė', 'Malachijo pranašystė'];

  const ntGospels = ['Evangelija pagal Matą', 'Evangelija pagal Morkų', 'Evangelija pagal Luką', 'Evangelija pagal Joną'];
  const ntActs = ['Apaštalų darbai'];
  const ntLetters = ['Laiškas romiečiams', 'Pirmasis laiškas korintiečiams', 'Antrasis laiškas korintiečiams', 'Laiškas galatams', 'Laiškas efeziečiams', 'Laiškas filipiečiams', 'Laiškas kolosiečiams', 'Pirmasis laiškas tesalonikiečiams', 'Antrasis laiškas tesalonikiečiams', 'Pirmasis laiškas Timotiejui', 'Antrasis laiškas Timotiejui', 'Laiškas Titui', 'Laiškas Filemonui', 'Laiškas hebrajams', 'Jokūbo laiškas', 'Pirmasis Petro laiškas', 'Antrasis Petro laiškas', 'Pirmasis Jono laiškas', 'Antrasis Jono laiškas', 'Trečiasis Jono laiškas', 'Judo laiškas'];
  const ntRevelation = ['Apreiškimas Jonui'];

  if (otLaw.some(b => bookName.includes(b) || b.includes(bookName))) return { testament: 'Senasis Testamentas', category: 'Įstatymo knygos' };
  if (otHistory.some(b => bookName.includes(b) || b.includes(bookName))) return { testament: 'Senasis Testamentas', category: 'Istorinės knygos' };
  if (otWisdom.some(b => bookName.includes(b) || b.includes(bookName))) return { testament: 'Senasis Testamentas', category: 'Išminties knygos' };
  if (otProphets.some(b => bookName.includes(b) || b.includes(bookName))) return { testament: 'Senasis Testamentas', category: 'Pranašų knygos' };

  if (ntGospels.some(b => bookName.includes(b) || b.includes(bookName))) return { testament: 'Naujasis Testamentas', category: 'Evangelijos' };
  if (ntActs.some(b => bookName.includes(b) || b.includes(bookName))) return { testament: 'Naujasis Testamentas', category: 'Apaštalų darbai' };
  if (ntLetters.some(b => bookName.includes(b) || b.includes(bookName))) return { testament: 'Naujasis Testamentas', category: 'Laiškai' };
  if (ntRevelation.some(b => bookName.includes(b) || b.includes(bookName))) return { testament: 'Naujasis Testamentas', category: 'Apreiškimas' };

  // Default fallback based on common patterns
  if (bookName.includes('Evangelija')) return { testament: 'Naujasis Testamentas', category: 'Evangelijos' };
  if (bookName.includes('laiškas') || bookName.includes('Laiškas')) return { testament: 'Naujasis Testamentas', category: 'Laiškai' };
  if (bookName.includes('pranašystė') || bookName.includes('Pranašystė')) return { testament: 'Senasis Testamentas', category: 'Pranašų knygos' };

  return { testament: 'Senasis Testamentas', category: 'Istorinės knygos' };
};

// Get color classes based on color name
const getColorClasses = (color: string, isSelected: boolean = false, isDark: boolean = false) => {
  const colors: Record<string, { bg: string; text: string; border: string; hover: string; light: string }> = {
    amber: {
      bg: isSelected ? (isDark ? 'bg-amber-900/40' : 'bg-amber-100') : (isDark ? 'bg-slate-800' : 'bg-white'),
      text: isDark ? 'text-amber-400' : 'text-amber-900',
      border: isDark ? 'border-amber-700/50' : 'border-amber-200',
      hover: isDark ? 'hover:bg-amber-900/20' : 'hover:bg-amber-50',
      light: isDark ? 'bg-amber-900/20' : 'bg-amber-50'
    },
    orange: {
      bg: isSelected ? (isDark ? 'bg-orange-900/40' : 'bg-orange-100') : (isDark ? 'bg-slate-800' : 'bg-white'),
      text: isDark ? 'text-orange-400' : 'text-orange-900',
      border: isDark ? 'border-orange-700/50' : 'border-orange-200',
      hover: isDark ? 'hover:bg-orange-900/20' : 'hover:bg-orange-50',
      light: isDark ? 'bg-orange-900/20' : 'bg-orange-50'
    },
    emerald: {
      bg: isSelected ? (isDark ? 'bg-emerald-900/40' : 'bg-emerald-100') : (isDark ? 'bg-slate-800' : 'bg-white'),
      text: isDark ? 'text-emerald-400' : 'text-emerald-900',
      border: isDark ? 'border-emerald-700/50' : 'border-emerald-200',
      hover: isDark ? 'hover:bg-emerald-900/20' : 'hover:bg-emerald-50',
      light: isDark ? 'bg-emerald-900/20' : 'bg-emerald-50'
    },
    purple: {
      bg: isSelected ? (isDark ? 'bg-purple-900/40' : 'bg-purple-100') : (isDark ? 'bg-slate-800' : 'bg-white'),
      text: isDark ? 'text-purple-400' : 'text-purple-900',
      border: isDark ? 'border-purple-700/50' : 'border-purple-200',
      hover: isDark ? 'hover:bg-purple-900/20' : 'hover:bg-purple-50',
      light: isDark ? 'bg-purple-900/20' : 'bg-purple-50'
    },
    red: {
      bg: isSelected ? (isDark ? 'bg-red-900/40' : 'bg-red-100') : (isDark ? 'bg-slate-800' : 'bg-white'),
      text: isDark ? 'text-red-400' : 'text-red-900',
      border: isDark ? 'border-red-700/50' : 'border-red-200',
      hover: isDark ? 'hover:bg-red-900/20' : 'hover:bg-red-50',
      light: isDark ? 'bg-red-900/20' : 'bg-red-50'
    },
    blue: {
      bg: isSelected ? (isDark ? 'bg-blue-900/40' : 'bg-blue-100') : (isDark ? 'bg-slate-800' : 'bg-white'),
      text: isDark ? 'text-blue-400' : 'text-blue-900',
      border: isDark ? 'border-blue-700/50' : 'border-blue-200',
      hover: isDark ? 'hover:bg-blue-900/20' : 'hover:bg-blue-50',
      light: isDark ? 'bg-blue-900/20' : 'bg-blue-50'
    },
    indigo: {
      bg: isSelected ? (isDark ? 'bg-indigo-900/40' : 'bg-indigo-100') : (isDark ? 'bg-slate-800' : 'bg-white'),
      text: isDark ? 'text-indigo-400' : 'text-indigo-900',
      border: isDark ? 'border-indigo-700/50' : 'border-indigo-200',
      hover: isDark ? 'hover:bg-indigo-900/20' : 'hover:bg-indigo-50',
      light: isDark ? 'bg-indigo-900/20' : 'bg-indigo-50'
    },
    rose: {
      bg: isSelected ? (isDark ? 'bg-rose-900/40' : 'bg-rose-100') : (isDark ? 'bg-slate-800' : 'bg-white'),
      text: isDark ? 'text-rose-400' : 'text-rose-900',
      border: isDark ? 'border-rose-700/50' : 'border-rose-200',
      hover: isDark ? 'hover:bg-rose-900/20' : 'hover:bg-rose-50',
      light: isDark ? 'bg-rose-900/20' : 'bg-rose-50'
    },
  };
  return colors[color] || colors.amber;
};

export const BibleReader: React.FC = () => {
  const { isDark } = useTheme();
  // Use data from the centralized knowledge base
  const BIBLE_DATA = getBibleStructure();

  const [selectedBook, setSelectedBook] = useState<number | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const [verseClicked, setVerseClicked] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [highlightedText, setHighlightedText] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // New state for improved navigation
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTestaments, setExpandedTestaments] = useState<Record<string, boolean>>({
    'Senasis Testamentas': true,
    'Naujasis Testamentas': true
  });
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Engagement state
  const [milestone, setMilestone] = useState<{
    bookName: string;
    chapter: number;
    streak: number;
    todayCount: number;
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Simulate loading on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    checkStreak();
    return () => clearTimeout(timer);
  }, []);

  // Listen for navigate-to-chapter events from ReadingPlans
  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.book && detail?.chapter !== undefined) {
        const bookIndex = BIBLE_DATA.findIndex(b => b.book === detail.book);
        if (bookIndex >= 0) {
          setSelectedBook(bookIndex);
          setSelectedChapter(detail.chapter);
          mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    };

    window.addEventListener('navigate-to-chapter', handleNavigate);
    return () => window.removeEventListener('navigate-to-chapter', handleNavigate);
  }, []);

  // --- HOOKS ---
  const { getChapterContent, isReady } = useBibleContent();

  // Safety check in case data is empty
  const currentBook = selectedBook !== null ? (BIBLE_DATA[selectedBook] || { book: "Kraunama...", chapters: [] }) : null;
  // NOTE: currentChapter is now derived for title/metadata, but CONTENT is handled by displayedContent
  const currentChapter = currentBook && selectedChapter !== null
    ? (currentBook.chapters[selectedChapter] || { title: "", content: "Pasirinkite skyrių." })
    : null;

  // Resolve content: Real > Static
  const parsedContent = useMemo(() => {
    if (!currentBook || selectedChapter === null) return null;
    const realData = getChapterContent(currentBook.book, selectedChapter);
    return realData;
  }, [currentBook, selectedChapter, getChapterContent]);

  const displayedContent = useMemo(() => {
    if (!currentBook || selectedChapter === null) return "";

    // If we have parsed data (new structure), use it primarily via parsedContent check in render.
    // If not, use static fallback.
    const staticText = currentBook.chapters[selectedChapter]?.content || "";
    const isPlaceholder = staticText.includes("Pasirinkite skyrių");

    if (isPlaceholder) {
      return "Šios knygos tekstas šiuo metu ruošiamas skaitmenizavimui. Atsiprašome.";
    }

    return staticText;
  }, [currentBook, selectedChapter]);

  // Group books by categories using new Bible books structure
  const groupedBooks = useMemo(() => {
    const grouped: Record<string, Record<string, { book: string; abbr: string; index: number; chapters: any[] }[]>> = {
      'Senasis Testamentas': {},
      'Naujasis Testamentas': {}
    };

    BIBLE_BOOKS.forEach((bookData, index) => {
      if (!grouped[bookData.testament][bookData.category]) {
        grouped[bookData.testament][bookData.category] = [];
      }
      grouped[bookData.testament][bookData.category].push({
        book: bookData.book,
        abbr: bookData.abbr,
        index,
        chapters: bookData.chapters
      });
    });

    return grouped;
  }, [BIBLE_BOOKS]);

  // Filter books based on search query
  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return groupedBooks;

    const filtered: Record<string, Record<string, { book: string; abbr: string; index: number; chapters: any[] }[]>> = {
      'Senasis Testamentas': {},
      'Naujasis Testamentas': {}
    };

    const query = searchQuery.toLowerCase();

    Object.entries(groupedBooks).forEach(([testament, categories]) => {
      Object.entries(categories).forEach(([category, books]) => {
        const matchingBooks = books.filter(b =>
          b.book.toLowerCase().includes(query) ||
          b.abbr.toLowerCase().includes(query) ||
          category.toLowerCase().includes(query)
        );
        if (matchingBooks.length > 0) {
          filtered[testament][category] = matchingBooks;
        }
      });
    });

    return filtered;
  }, [groupedBooks, searchQuery]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isAiLoading, isChatOpen]);

  const handleTextSelection = () => {
    // Skip text selection handling if a verse was clicked
    if (verseClicked) {
      setVerseClicked(false);
      return;
    }

    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 5) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // On mobile, add a delay to show the button after native menu appears
      if (isMobile) {
        setTimeout(() => {
          const currentSel = window.getSelection();
          if (currentSel && currentSel.toString().trim().length > 5) {
            setSelection({
              text: currentSel.toString().trim(),
              x: rect.left + rect.width / 2,
              y: rect.top - 10
            });
          }
        }, 300);
      } else {
        setSelection({
          text: sel.toString().trim(),
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        });
      }
    } else {
      setTimeout(() => {
        const currentSel = window.getSelection();
        if (!currentSel || currentSel.toString().trim().length <= 5) {
          setSelection(null);
        }
      }, 100);
    }
  };

  const handleVerseClick = (verseNumber: number, verseContent: string, event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setVerseClicked(true);

    // Toggle verse selection (like Plans)
    setSelectedVerses(prev =>
      prev.includes(verseNumber)
        ? prev.filter(v => v !== verseNumber)
        : [...prev, verseNumber].sort((a, b) => a - b)
    );
  };

  const handleCopySelectedVerses = () => {
    if (!parsedContent?.verses || selectedVerses.length === 0) return;
    const selectedText = selectedVerses.map(vNum => {
      const v = parsedContent.verses.find((cv: any) => cv.number === vNum);
      return v ? `${v.number}. ${v.content}` : '';
    }).join('\n');
    const reference = currentBook ? `${currentBook.book} ${(selectedChapter ?? 0) + 1}:${selectedVerses.join(',')}` : '';
    navigator.clipboard.writeText(`${selectedText}\n\n(${reference})`);
    setSelectedVerses([]);
  };

  const handleAnalyzeSelectedVerses = () => {
    if (!parsedContent?.verses || selectedVerses.length === 0) return;
    const selectedText = selectedVerses.map(vNum => {
      const v = parsedContent.verses.find((cv: any) => cv.number === vNum);
      return v ? v.content : '';
    }).join(' ');
    const reference = currentBook ? `${currentBook.book} ${(selectedChapter ?? 0) + 1}:${selectedVerses.join(',')}` : '';
    setSelection({ text: `${selectedText} (${reference})`, x: 0, y: 0 });
    setSelectedVerses([]);
    // Trigger analysis immediately
    setHighlightedText(`${selectedText} (${reference})`);
    setIsChatOpen(true);
    setChatHistory([]);
    setIsAiLoading(true);
    const prompt = `Esu katalikas ir skaitau šią Šventojo Rašto ištrauką: \"${selectedText}\" (${reference}). Prašau pateikti gilų teologinį komentarą (ekzegezę) iš Katalikų Bažnyčios perspektyvos lietuvių kalba.`;
    generateSimpleContent(prompt).then(result => {
      setChatHistory([{ role: 'model', text: result || 'Negaliu pakomentuoti šios ištraukos.' }]);
    }).catch(() => {
      setChatHistory([{ role: 'model', text: 'Atsiprašau, įvyko ryšio klaida.' }]);
    }).finally(() => {
      setIsAiLoading(false);
    });
    setSelection(null);
  };

  // Reset selected verses on chapter change
  useEffect(() => {
    setSelectedVerses([]);
  }, [selectedBook, selectedChapter]);

  // Inline markdown renderer for Bible analysis chat
  const renderInline = (text: string): React.ReactNode[] => {
    const parts = text.split(/(\*\*.*?\*\*|\*(?!\*).*?\*|`[^`]+`|\[.*?\]\(.*?\))/g);
    return parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} className={`${isDark ? 'text-amber-400' : 'text-red-900'} font-bold`}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
        return <em key={j} className={`${isDark ? 'text-amber-200' : 'text-stone-700'} italic`}>{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={j} className={`px-1 py-0.5 rounded text-xs font-mono ${isDark ? 'bg-slate-800 text-amber-300' : 'bg-stone-100 text-red-800'}`}>{part.slice(1, -1)}</code>;
      }
      const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        return <a key={j} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className={`underline ${isDark ? 'text-amber-400' : 'text-red-800'}`}>{linkMatch[1]}</a>;
      }
      return part;
    });
  };

  const startAnalysis = async () => {
    if (!selection) return;
    const textToAnalyze = selection.text;
    setHighlightedText(textToAnalyze);
    setIsChatOpen(true);
    setChatHistory([]);
    setSelection(null);
    setIsAiLoading(true);

    window.getSelection()?.removeAllRanges();

    const initialPrompt = `Esu katalikas ir skaitau šią Šventojo Rašto ištrauką: "${textToAnalyze}". Prašau pateikti gilų teologinį komentarą (ekzegezę) iš Katalikų Bažnyčios perspektyvos lietuvių kalba.`;

    try {
      const result = await generateSimpleContent(initialPrompt);
      setChatHistory([{ role: 'model', text: result || "Negaliu pakomentuoti šios ištraukos." }]);
    } catch (e: any) {
      const err = JSON.stringify(e);
      if (err.includes("403") || err.includes("leaked")) {
        setChatHistory([{ role: 'model', text: "⚠️ API RAKTO KLAIDA: Raktas užblokuotas." }]);
      } else {
        setChatHistory([{ role: 'model', text: "Atsiprašau, įvyko ryšio klaida." }]);
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const sendFollowUp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!userInput.trim() || isAiLoading) return;

    const currentQuestion = userInput;
    setUserInput("");
    setChatHistory(prev => [...prev, { role: 'user', text: currentQuestion }]);
    setIsAiLoading(true);

    const contextHistory = chatHistory.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const enhancedPrompt = `Atsakyk į klausimą apie Biblijos ištrauką: "${highlightedText}". Klausimas: ${currentQuestion}`;

    try {
      const stream = await sendMessageStream(contextHistory, enhancedPrompt);
      let fullResponse = "";

      setChatHistory(prev => [...prev, { role: 'model', text: "" }]);

      for await (const chunk of stream) {
        const c = chunk as GenerateContentResponse;
        fullResponse += c.text || "";
        setChatHistory(prev => {
          const newHistory = [...prev];
          newHistory[newHistory.length - 1].text = fullResponse;
          return newHistory;
        });
      }
    } catch (e: any) {
      const err = JSON.stringify(e);
      if (err.includes("403") || err.includes("leaked")) {
        setChatHistory(prev => [...prev, { role: 'model', text: "⚠️ KLAIDA: Raktas užblokuotas/nutekintas." }]);
      } else {
        setChatHistory(prev => [...prev, { role: 'model', text: "Klaida." }]);
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleBookSelect = (bookIndex: number) => {
    setSelectedBook(bookIndex);
    setSelectedChapter(null); // Don't auto-select, let user pick chapter in sidebar
  };

  const handleChapterSelect = (chapterIndex: number) => {
    setSelectedChapter(chapterIndex);
    mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    if (isMobile) setIsSidebarOpen(false);
  };

  // Mark current chapter as read and show milestone
  const handleChapterComplete = () => {
    if (!currentBook || selectedChapter === null) return;
    const isNew = markChapterComplete(currentBook.book, selectedChapter);

    // Also track in all active plans
    if (hasActivePlan()) {
      getActivePlanIds().forEach(pid => markPlanReadingComplete(pid, currentBook.book, selectedChapter));
    }

    if (isNew) {
      const stats = getProgressStats();
      const allPlanProgress = getAllPlanProgress();
      const bestStreak = allPlanProgress.length > 0 ? Math.max(...allPlanProgress.map(p => p.streak)) : stats?.streak || 0;
      /*
      setMilestone({
        bookName: currentBook.book,
        chapter: selectedChapter,
        streak: bestStreak,
        todayCount: stats?.todayChaptersRead || 0
      });
      */
      window.dispatchEvent(new Event('bible-progress-update'));
    }
  };

  const handleBackToBookSelection = () => {
    setSelectedBook(null);
    setSelectedChapter(null);
  };

  const handleBackToChapterSelection = () => {
    setSelectedChapter(null);
  };

  const toggleTestament = (testament: string) => {
    setExpandedTestaments(prev => ({
      ...prev,
      [testament]: !prev[testament]
    }));
  };

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  // Chapter grid component
  const ChapterGrid = ({ chapters, currentChapter, onSelect, bookName }: {
    chapters: any[];
    currentChapter: number | null;
    onSelect: (idx: number) => void;
    bookName: string;
  }) => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className={`p-6 border-b ${isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'}`}>
        <button
          onClick={handleBackToBookSelection}
          className={`flex items-center gap-2 transition-colors mb-4 ${isDark ? 'text-slate-400 hover:text-amber-400' : 'text-stone-500 hover:text-red-900'}`}
        >
          <ArrowLeft size={16} />
          <span className="text-sm font-medium">Grįžti prie knygų sąrašo</span>
        </button>
        <h2 className={`font-cinzel font-bold text-2xl ${isDark ? 'text-amber-100' : 'text-stone-900'}`}>{bookName}</h2>
        <p className={`${isDark ? 'text-slate-500' : 'text-stone-500'} text-sm mt-1`}>Pasirinkite skyrių</p>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
          {chapters.map((chapter, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(idx)}
              className={`
                aspect-square flex items-center justify-center rounded-xl font-medium text-sm
                transition-all duration-200 transform hover:scale-105
                ${currentChapter === idx
                  ? 'bg-red-900 text-amber-50 shadow-lg scale-105'
                  : (isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:shadow-md' : 'bg-stone-100 text-stone-700 hover:bg-stone-200 hover:shadow-md')
                }
              `}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Book grid component — compact abbreviation buttons
  const BookGrid = ({ books, selectedBook, onSelect, color }: {
    books: { book: string; abbr: string; index: number; chapters: any[] }[];
    selectedBook: number | null;
    onSelect: (idx: number) => void;
    color: string;
  }) => {
    const colors = getColorClasses(color, false, isDark);
    return (
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
        {books.map((bookData) => (
          <button
            key={bookData.index}
            onClick={() => onSelect(bookData.index)}
            className={`
              flex items-center justify-center rounded-lg
              text-[11px] font-bold transition-all duration-150 py-2 px-1
              ${selectedBook === bookData.index
                ? `${colors.bg} ${colors.text} shadow-lg ring-1 ${colors.border}`
                : (isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 active:bg-slate-600' : 'bg-stone-100 text-stone-700 hover:bg-stone-200 active:bg-stone-300')
              }
            `}
            title={bookData.book}
          >
            {bookData.abbr}
          </button>
        ))}
      </div>
    );
  };




  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-[calc(100vh-64px)] ${isDark ? 'bg-slate-950' : 'bg-[#fdfcf8]'}`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 ${isDark ? 'border-amber-500' : 'border-red-900'}`} />
          <p className={`${isDark ? 'text-slate-400' : 'text-stone-600'} font-serif`}>Kraunama Biblija...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-[calc(100vh-64px)] overflow-hidden ${isDark ? 'bg-slate-950' : 'bg-[#f4f1ea]'}`}>
      {/* Sidebar backdrop overlay (mobile) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Book Navigation */}
      <div className={`
        fixed inset-y-0 left-0 z-20 w-80 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col border-r
        ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-[#f8f6f3] border-[#e5e0d8]'}
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>  <div className="sticky top-0 z-10 p-4 border-b border-stone-100 bg-gradient-to-r from-red-900 to-red-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-cinzel font-bold text-amber-50 flex items-center gap-2">
              <Book size={18} className="text-amber-300" />
              BIBLIJOS KNYGOS
            </h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-amber-200 hover:text-white hover:bg-red-700/50 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-red-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ieškoti knygos..."
              className="w-full pl-9 pr-8 py-2 bg-red-950/50 border border-red-700 rounded-lg text-sm text-amber-50 placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-red-300 hover:text-amber-200"
              >
                <XCircle size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Info Banner */}
        <div className={`mx-4 mt-4 border rounded-lg p-3 flex gap-2 ${isDark ? 'bg-amber-900/10 border-amber-800/30' : 'bg-amber-50 border-amber-200'}`}>
          <Database size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className={`text-[10px] leading-tight ${isDark ? 'text-amber-500' : 'text-amber-800'}`}>
            Duomenys įkelti iš vietinės failų saugyklos. AI naudoja šį tekstą atsakymams.
          </p>
        </div>

        {/* Book List - Grouped by Testament and Category */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-3">
          {Object.entries(filteredBooks).map(([testament, categories]) => {
            const isTestamentExpanded = expandedTestaments[testament];
            const testamentKey = testament;

            return (
              <div key={testament} className={`border rounded-xl overflow-hidden ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-stone-200 bg-stone-50/50'}`}>
                {/* Testament Header */}
                <button
                  onClick={() => toggleTestament(testament)}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 text-left
                    font-cinzel font-bold text-sm
                    transition-all duration-200
                    ${testament === 'Senasis Testamentas'
                      ? 'bg-gradient-to-r from-amber-100 to-amber-50 text-amber-900 hover:from-amber-200 hover:to-amber-100'
                      : 'bg-gradient-to-r from-red-100 to-red-50 text-red-900 hover:from-red-200 hover:to-red-100'
                    }
                  `}
                >
                  <span className="flex items-center gap-2">
                    {testament === 'Senasis Testamentas' ? (
                      <Scroll size={16} className="text-amber-700" />
                    ) : (
                      <Cross size={16} className="text-red-700" />
                    )}
                    {testament}
                  </span>
                  {isTestamentExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {isTestamentExpanded && (
                  <div className="p-2 space-y-2">
                    {Object.entries(categories).map(([category, books]) => {
                      const categoryInfo = BOOK_CATEGORIES[testament as keyof typeof BOOK_CATEGORIES]?.[category as keyof typeof BOOK_CATEGORIES['Senasis Testamentas']];
                      const color = categoryInfo?.color || 'amber';
                      const Icon = categoryInfo?.icon || BookOpen;
                      const categoryKey = `${testament}-${category}`;
                      const isCategoryExpanded = expandedCategories[categoryKey] !== false; // Default to expanded

                      return (
                        <div key={category} className={`rounded-lg border overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-stone-100'}`}>
                          {/* Category Header */}
                          <button
                            onClick={() => toggleCategory(categoryKey)}
                            className={`
                              w-full flex items-center justify-between px-3 py-2.5
                              text-xs font-bold uppercase tracking-wider
                              transition-all duration-200
                              ${getColorClasses(color, false, isDark).light} ${getColorClasses(color, false, isDark).text}
                              hover:brightness-95
                            `}
                          >
                            <span className="flex items-center gap-2">
                              <Icon size={14} />
                              {category}
                            </span>
                            {isCategoryExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>

                          {/* Books Grid */}
                          {isCategoryExpanded && (
                            <div className="p-2">
                              <BookGrid
                                books={books}
                                selectedBook={selectedBook}
                                onSelect={handleBookSelect}
                                color={color}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        {/* Chapter picker in sidebar (after book is selected) */}
        {selectedBook !== null && currentBook && (
          <div className={`sticky bottom-0 border-t p-3 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-stone-100 border-stone-200'}`}>
            <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-amber-400' : 'text-red-900'}`}>
              {currentBook.book} — skyrius:
            </p>
            <div className="grid grid-cols-7 gap-1 max-h-40 overflow-y-auto">
              {currentBook.chapters.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChapterSelect(idx)}
                  className={`py-1.5 rounded text-xs font-bold transition-all ${selectedChapter === idx
                    ? (isDark ? 'bg-amber-500 text-slate-950' : 'bg-red-900 text-white')
                    : (isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-white text-stone-700 hover:bg-stone-200')
                    }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main
        ref={mainContentRef}
        className={`flex-1 overflow-y-auto relative transition-all duration-300 ${isDark ? 'bg-slate-950' : "bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]"} ${isChatOpen ? 'lg:mr-[0px]' : ''} ${isMobile ? 'pb-24' : ''}`}
        onMouseUp={handleTextSelection}
        onTouchEnd={handleTextSelection}
      >
        {/* State 1: No book selected - Show welcome message */}
        {selectedBook === null && (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-gradient-to-br from-red-900 to-red-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <BookOpen size={40} className="text-amber-100" />
              </div>
              <h2 className={`font-cinzel font-bold text-2xl mb-3 ${isDark ? 'text-amber-100' : 'text-stone-900'}`}>
                Sveiki atvykę į Biblijos skaityklę
              </h2>
              <p className={`font-serif mb-6 ${isDark ? 'text-slate-400' : 'text-stone-600'}`}>
                Pasirinkite knygą iš šoninės juostos, kad pradėtumėte skaitymą.
              </p>

              {/* Mobile book selection button */}
              {isMobile && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-red-900 text-amber-50 rounded-xl font-cinzel font-bold mx-auto shadow-lg hover:bg-red-800 transition-colors"
                >
                  <Book size={18} />
                  Atidaryti knygų sąrašą
                </button>
              )}
            </div>
          </div>
        )}

        {/* State 2: Book selected but no chapter - Show chapter grid */}
        {selectedBook !== null && selectedChapter === null && currentBook && (
          <ChapterGrid
            chapters={currentBook.chapters}
            currentChapter={selectedChapter}
            onSelect={handleChapterSelect}
            bookName={currentBook.book}
          />
        )}

        {/* State 3: Book and chapter selected - Show text */}
        {selectedBook !== null && selectedChapter !== null && currentBook && currentChapter && (
          <div className="p-4 md:p-8 lg:p-12">
            <div className="max-w-3xl mx-auto">
              {/* Header with book/chapter info */}
              <header className="mb-8 text-center">
                <div className="h-px w-12 bg-red-900 mx-auto mb-4" />

                {/* Navigation breadcrumbs */}
                <div className="flex items-center justify-center gap-2 mb-4 text-sm flex-wrap">
                  <button
                    onClick={handleBackToBookSelection}
                    className={`transition-colors ${isDark ? 'text-slate-500 hover:text-amber-400' : 'text-stone-500 hover:text-red-900'}`}
                  >
                    Biblija
                  </button>
                  <ChevronRight size={14} className={isDark ? 'text-slate-600' : 'text-stone-400'} />
                  <button
                    onClick={handleBackToChapterSelection}
                    className={`transition-colors ${isDark ? 'text-slate-500 hover:text-amber-400' : 'text-stone-500 hover:text-red-900'}`}
                  >
                    {currentBook.book}
                  </button>
                  <ChevronRight size={14} className={isDark ? 'text-slate-600' : 'text-stone-400'} />
                  <span className={`${isDark ? 'text-amber-500' : 'text-red-900'} font-medium`}>Skyrius {selectedChapter + 1}</span>
                </div>
                <h1 className={`font-cinzel font-bold text-2xl md:text-3xl lg:text-4xl ${isDark ? 'text-slate-100' : 'text-stone-900'}`}>{currentChapter.title}</h1>
                <div className={`h-px w-12 mx-auto mt-4 ${isDark ? 'bg-amber-500/50' : 'bg-red-900'}`} />
              </header>
              <article
                className={`font-serif text-lg md:text-xl leading-loose text-justify whitespace-pre-wrap selection:bg-amber-200 selection:text-amber-950 cursor-text ${isDark ? 'text-slate-300' : 'text-stone-800'}`}
              >
                {parsedContent ? (
                  <div className={`leading-relaxed text-lg space-y-4 ${isDark ? 'text-slate-300' : 'text-stone-800'}`}>
                    {/* Verse Selection Toolbar */}
                    {selectedVerses.length > 0 && (
                      <div className={`fixed top-0 left-0 right-0 z-[200] flex items-center justify-between gap-3 px-4 py-3 backdrop-blur-xl border-b shadow-lg ${isDark ? 'bg-slate-900/95 border-amber-500/30' : 'bg-white/95 border-amber-200'}`}>
                        <span className={`text-sm font-medium ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>
                          Pasirinkta: {selectedVerses.length}
                        </span>
                        <div className="flex gap-2">
                          <button onClick={() => setSelectedVerses([])} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-stone-500 hover:bg-stone-100'}`}>
                            Atšaukti
                          </button>
                          <button onClick={handleCopySelectedVerses} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${isDark ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}>
                            Kopijuoti
                          </button>
                          <button onClick={handleAnalyzeSelectedVerses} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-900 text-amber-50 shadow-lg hover:bg-red-800">
                            <Sparkles size={14} /> Komentuoti
                          </button>
                        </div>
                      </div>
                    )}
                    {parsedContent.verses ? (
                      parsedContent.verses.map((verse: any) => {
                        const isSelected = selectedVerses.includes(verse.number);
                        return (
                          <span
                            key={verse.number}
                            className={`inline mr-1 cursor-pointer transition-colors rounded px-0.5 ${isSelected ? (isDark ? 'bg-amber-900/40' : 'bg-amber-100/60') : ''}`}
                            onClick={(e) => handleVerseClick(verse.number, verse.content, e)}
                            onTouchEnd={(e) => handleVerseClick(verse.number, verse.content, e)}
                          >
                            <sup className={`font-bold text-xs mr-1 select-none ${isSelected ? (isDark ? 'text-amber-400' : 'text-amber-700') : (isDark ? 'text-amber-500/70' : 'text-red-900 opacity-70')}`}>
                              {verse.number}
                            </sup>
                            <span className={`mr-1 transition-colors rounded px-0.5 ${isSelected ? '' : (isDark ? 'hover:bg-white/5' : 'hover:bg-yellow-100')}`}>
                              {verse.content}
                            </span>
                          </span>
                        );
                      })
                    ) : (
                      // Fallback if verses are missing/empty
                      displayedContent || "Tekstas nerastas."
                    )}
                  </div>
                ) : (
                  displayedContent
                )}
              </article>

              {/* Next/Previous Chapter Navigation */}
              <div className="mt-12 flex items-center justify-between">
                <button
                  onClick={() => {
                    if (selectedChapter > 0) {
                      setSelectedChapter(selectedChapter - 1);
                      mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                    } else if (selectedBook > 0) {
                      const prevBook = BIBLE_DATA[selectedBook - 1];
                      setSelectedBook(selectedBook - 1);
                      setSelectedChapter(prevBook.chapters.length - 1);
                      mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  disabled={selectedBook === 0 && selectedChapter === 0}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-stone-600 hover:text-red-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} className="rotate-180" />
                  Ankstesnis
                </button>

                <button
                  onClick={() => {
                    // Mark current chapter as complete before navigating
                    handleChapterComplete();
                    if (selectedChapter < currentBook.chapters.length - 1) {
                      setSelectedChapter(selectedChapter + 1);
                      mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                    } else if (selectedBook < BIBLE_DATA.length - 1) {
                      setSelectedBook(selectedBook + 1);
                      setSelectedChapter(0);
                      mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  disabled={selectedBook === BIBLE_DATA.length - 1 && selectedChapter === currentBook.chapters.length - 1}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-stone-600 hover:text-red-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Kitas
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="mt-12 p-6 bg-stone-100/50 rounded-xl border border-stone-200 text-center">
                <Info className="mx-auto text-stone-400 mb-2" size={20} />
                <p className="text-sm text-stone-500 font-serif italic">
                  Paspauskite ant eilutės (pvz., 15) arba pažymėkite tekstą, kad Tikėjimo Šviesa AI galėtų ją paaiškinti.
                </p>
              </div>

              <div className="h-32" />
            </div>

            {/* Selection Button */}
            {selection && (
              isMobile ? (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-[99999] animate-in slide-in-from-bottom duration-300">
                  <div className="max-w-md mx-auto flex items-center justify-between gap-4">
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">Pažymėta:</p>
                      <p className="text-xs text-stone-600 truncate italic font-serif">„{selection.text}"</p>
                    </div>
                    <button
                      onMouseDown={(e) => { e.preventDefault(); startAnalysis(); }}
                      className="bg-red-900 text-amber-50 px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-cinzel font-bold active:scale-95 transition-transform"
                    >
                      <Sparkles size={18} />
                      KOMENTUOTI
                    </button>
                    <button onClick={() => setSelection(null)} className="p-1 text-stone-400"><X size={20} /></button>
                  </div>
                </div>
              ) : (
                <button
                  onMouseDown={(e) => { e.preventDefault(); startAnalysis(); }}
                  style={{ position: 'fixed', left: selection.x, top: selection.y, transform: 'translate(-50%, -100%)', zIndex: 99999 }}
                  className="bg-red-900 text-amber-50 px-5 py-2.5 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex items-center gap-2 text-sm font-cinzel font-bold animate-in fade-in zoom-in-75 duration-200 hover:scale-105 active:scale-95 transition-transform ring-4 ring-white"
                >
                  <Sparkles size={16} />
                  KOMENTUOTI
                </button>
              )
            )}
          </div>
        )}
      </main>

      {/* Chat Sidebar */}
      {isChatOpen && (
        <aside className={`fixed top-0 right-0 w-full sm:w-[450px] ${isMobile ? 'bottom-[60px]' : 'bottom-0'} ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-stone-200'} border-l shadow-2xl z-[100] flex flex-col animate-in slide-in-from-right duration-300`}>
          <header className="p-4 bg-red-900 text-amber-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Highlighter size={18} />
              <span className="font-cinzel font-bold text-sm tracking-wider uppercase">Versijos Analizė</span>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="p-1 hover:bg-red-800 rounded-full transition-colors"><X size={24} /></button>
          </header>

          <div className={`px-5 py-4 border-b ${isDark ? 'bg-amber-900/20 border-amber-800/30' : 'bg-amber-50 border-amber-100'}`}>
            <span className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Pasirinkta ištrauka:</span>
            <p className={`italic font-serif text-sm leading-relaxed line-clamp-4 ${isDark ? 'text-slate-300' : 'text-stone-700'}`}>„{highlightedText}"</p>
          </div>

          <div ref={scrollRef} className={`flex-1 overflow-y-auto p-5 space-y-6 ${isDark ? 'bg-slate-950' : 'bg-[#fffdfa]'}`}>
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[90%] rounded-2xl p-4 shadow-sm border ${msg.role === 'user'
                  ? (isDark ? 'bg-slate-800 border-slate-700 text-slate-200 rounded-tr-none' : 'bg-stone-100 border-stone-200 text-stone-800 rounded-tr-none')
                  : (isDark ? 'bg-slate-900 border-slate-800 text-slate-200 rounded-tl-none' : 'bg-white border-red-50 text-stone-900 rounded-tl-none')
                  }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {msg.role === 'user' ? <User size={12} className={isDark ? 'text-slate-400' : 'text-stone-400'} /> : <Sparkles size={12} className={isDark ? 'text-amber-400' : 'text-red-700'} />}
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-stone-400'}`}>{msg.role === 'user' ? 'Mano klausimas' : 'Tikėjimo Šviesa'}</span>
                  </div>
                  <div className={`prose prose-sm max-w-none font-serif leading-relaxed ${isDark ? 'prose-invert text-slate-200' : 'prose-stone text-stone-800'}`}>
                    {msg.text.split('|||SUGGESTIONS')[0].split('|||SOURCES')[0].split('\n').map((line, j) => {
                      // HEADER 3
                      if (line.trim().startsWith('###')) {
                        return <h3 key={j} className={`font-cinzel font-bold text-base mt-4 mb-2 ${isDark ? 'text-amber-400' : 'text-red-900'}`}>{renderInline(line.replace(/^###\s*/, ''))}</h3>;
                      }
                      // HEADER 2
                      if (line.trim().startsWith('##')) {
                        return <h2 key={j} className={`font-cinzel font-bold text-lg mt-4 mb-2 ${isDark ? 'text-amber-500' : 'text-red-900'}`}>{renderInline(line.replace(/^##\s*/, ''))}</h2>;
                      }
                      // BLOCKQUOTE
                      if (line.trim().startsWith('>')) {
                        return <blockquote key={j} className={`my-3 pl-4 border-l-3 py-2 italic ${isDark ? 'border-amber-600 text-slate-300' : 'border-amber-400 text-stone-700'}`}>{renderInline(line.replace(/^>\s*/, ''))}</blockquote>;
                      }
                      // NUMBERED LIST
                      const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
                      if (numMatch) {
                        return <div key={j} className="flex gap-2 ml-1 mb-1.5"><span className={`font-bold min-w-[1.2em] text-right ${isDark ? 'text-amber-500' : 'text-red-800'}`}>{numMatch[1]}.</span><span>{renderInline(numMatch[2])}</span></div>;
                      }
                      // UNORDERED LIST
                      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
                        return <div key={j} className="flex gap-2 ml-1 mb-1.5"><span className="text-amber-600">•</span><span>{renderInline(line.replace(/^[\*-]\s*/, ''))}</span></div>;
                      }
                      // HR
                      if (line.trim() === '---' || line.trim() === '***') {
                        return <hr key={j} className={`my-3 ${isDark ? 'border-slate-700' : 'border-stone-200'}`} />;
                      }
                      // EMPTY LINE
                      if (line.trim() === '') return <div key={j} className="h-1.5" />;
                      // PLAIN TEXT
                      return <p key={j} className="mb-2 last:mb-0">{renderInline(line)}</p>;
                    })}
                  </div>
                </div>
              </div>
            ))}
            {isAiLoading && <div className={`text-center text-xs italic ${isDark ? 'text-slate-500' : 'text-stone-400'}`}>Analizuojama...</div>}
          </div>

          <footer className={`p-4 border-t ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-stone-200'}`}>
            <form onSubmit={sendFollowUp} className="relative flex items-center">
              <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} disabled={isAiLoading} placeholder="Klauskite apie šią vietą..." className={`w-full border rounded-xl py-3 px-4 pr-12 text-sm outline-none font-serif ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-stone-50 border-stone-200 text-stone-800 placeholder-stone-400'}`} />
              <button type="submit" disabled={!userInput.trim() || isAiLoading} className="absolute right-2 p-2 bg-red-900 text-amber-50 rounded-lg hover:bg-red-800 transition-all shadow-sm"><Send size={16} /></button>
            </form>
          </footer>
        </aside>
      )}

      {/* Mobile Book Selection Modal */}
      {isMobile && isChatOpen && selectedBook === null && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-stone-200 bg-gradient-to-r from-red-900 to-red-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-cinzel font-bold text-lg text-amber-50">
                  Pasirinkite knygą
                </h3>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-2 hover:bg-red-800 rounded-full transition-colors"
                >
                  <X size={20} className="text-amber-200" />
                </button>
              </div>

              {/* Search in modal */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-red-300" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ieškoti knygos..."
                  className="w-full pl-9 pr-3 py-2 bg-red-950/50 border border-red-700 rounded-lg text-sm text-amber-50 placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {Object.entries(filteredBooks).map(([testament, categories]) => (
                <div key={testament} className="border border-stone-200 rounded-xl overflow-hidden">
                  <div className={`
                    px-4 py-3 font-cinzel font-bold text-sm
                    ${testament === 'Senasis Testamentas'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-red-100 text-red-900'
                    }
                  `}>
                    <span className="flex items-center gap-2">
                      {testament === 'Senasis Testamentas' ? (
                        <Scroll size={16} />
                      ) : (
                        <Cross size={16} />
                      )}
                      {testament}
                    </span>
                  </div>
                  <div className="p-2 space-y-2">
                    {Object.entries(categories).map(([category, books]) => {
                      const categoryInfo = BOOK_CATEGORIES[testament as keyof typeof BOOK_CATEGORIES]?.[category as keyof typeof BOOK_CATEGORIES['Senasis Testamentas']];
                      const color = categoryInfo?.color || 'amber';
                      const Icon = categoryInfo?.icon || BookOpen;

                      return (
                        <div key={category} className="bg-stone-50 rounded-lg p-3">
                          <h5 className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${getColorClasses(color).text}`}>
                            <Icon size={12} />
                            {category}
                          </h5>
                          <BookGrid
                            books={books}
                            selectedBook={selectedBook}
                            onSelect={(idx) => {
                              handleBookSelect(idx);
                              setIsChatOpen(false);
                            }}
                            color={color}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}



      {/* Reading Milestone Toast */}
      {milestone && (
        <ReadingMilestone
          bookName={milestone.bookName}
          chapter={milestone.chapter}
          streak={milestone.streak}
          todayCount={milestone.todayCount}
          onDismiss={() => setMilestone(null)}
        />
      )}
    </div >
  );
};
