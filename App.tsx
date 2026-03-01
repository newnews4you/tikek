import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './components/Layout/Header';
import { MobileNav } from './components/Layout/MobileNav';
import { MessageBubble } from './components/Chat/MessageBubble';
import { InputArea } from './components/Chat/InputArea';
import { ChatHistory } from './components/Chat/ChatHistory';
import { RagStatus } from './components/UI/RagStatus';
import { SourcesModal } from './components/UI/SourcesModal';
import { PrayerSection } from './components/Views/PrayerSection';
import { BibleReader } from './components/Views/BibleReader';
import { DataManager } from './components/Views/DataManager';
import { ReadingPlans } from './components/Engagement/ReadingPlans';
import { Message, Sender, RagState, GroundingSource, SharedScripturePayload } from './types';
import { sendMessageStream } from './services/geminiService';
import { GenerateContentResponse } from '@google/genai';
import { Cross, Book, Heart, HelpCircle } from 'lucide-react';
import { initKnowledgeBase } from './data/knowledgeBase';
import { LiturgyModal } from './components/Liturgy/LiturgyModal';
import { getTodayLiturgy, LiturgyData } from './services/liturgyService';
import { useTheme } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import { saveConversation, loadConversation, getAllConversations, ChatConversation } from './services/chatHistoryService';
import { PrayerGroupsView } from './components/Views/PrayerGroups';

const QUICK_ACTIONS = [
  { label: 'Dienos Evangelija', icon: <Book size={14} />, prompt: 'Kokia yra šios dienos Evangelija? Prašau pateikti pilną tekstą ir trumpą komentarą.' },
  { label: 'Kaip atlikti išpažintį?', icon: <Cross size={14} />, prompt: 'Prašau paaiškinti, kaip pasiruošti ir atlikti Šventąją Išpažintį pagal Katalikų Bažnyčios mokymą.' },
  { label: 'Rožinio malda', icon: <Heart size={14} />, prompt: 'Kaip melstis Rožinį? Kokios yra paslaptys?' },
  { label: 'Kas yra Šv. Mišios?', icon: <HelpCircle size={14} />, prompt: 'Kokia yra Šventųjų Mišių prasmė ir teologija?' },
];

const INITIAL_MESSAGE: Message = {
  id: 'welcome',
  text: "**Garbė Jėzui Kristui!** 👋\n\nAš esu **Tikėjimo Šviesa** – Jūsų tikėjimo palydovas. Štai ką galite nuveikti:\n\n📖 **Biblija** – skaitykite Šventąjį Raštą su patogiu knygų ir skyrių pasirinkimu\n\n✨ **Skaitymo planai** – sekite kasdienį Biblijos skaitymo planą ir stebėkite savo pažangą\n\n🙏 **Maldynas** – atraskite maldas kiekvienai progai\n\n💬 **Klauskite manęs** – užduokite bet kokį klausimą apie tikėjimą, Bažnyčios mokymą ar Šventąjį Raštą\n\n🔥 **Dienos serija** – skaitykite kasdien ir auginkite savo seriją!\n\nPradėkite – užduokite klausimą arba pasirinkite temą žemiau 👇",
  sender: Sender.AI,
  timestamp: Date.now()
};

const App: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'chat' | 'prayer' | 'bible' | 'data' | 'plans' | 'groups'>('chat');
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);

  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [ragState, setRagState] = useState<RagState>(RagState.IDLE);
  const [liturgy, setLiturgy] = useState<LiturgyData | null>(null);
  const [liturgyLoading, setLiturgyLoading] = useState(true);
  const [isLiturgyModalOpen, setIsLiturgyModalOpen] = useState(false);
  const [currentConvoId, setCurrentConvoId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [pendingSharedExcerpt, setPendingSharedExcerpt] = useState<SharedScripturePayload | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Initialize the IndexedDB when app loads
    initKnowledgeBase();

    // Fetch liturgy data
    getTodayLiturgy().then(data => {
      setLiturgy(data);
      setLiturgyLoading(false);
    }).catch(() => setLiturgyLoading(false));
  }, []);

  // Load conversations on mount
  useEffect(() => {
    setConversations(getAllConversations());
  }, []);

  // Auto-save conversation when messages change
  useEffect(() => {
    if (messages.length > 1 && ragState === RagState.IDLE) {
      const id = saveConversation(currentConvoId, messages);
      if (!currentConvoId) setCurrentConvoId(id);
      setConversations(getAllConversations());
    }
  }, [messages, ragState]);

  const handleNewChat = () => {
    // Save current conversation before starting new
    if (messages.length > 1) {
      saveConversation(currentConvoId, messages);
    }
    setMessages([INITIAL_MESSAGE]);
    setCurrentConvoId(null);
    setRagState(RagState.IDLE);
    window.speechSynthesis.cancel();
    setConversations(getAllConversations());
  };

  const handleLoadConversation = useCallback((id: string) => {
    // Save current first
    if (messages.length > 1 && currentConvoId) {
      saveConversation(currentConvoId, messages);
    }
    const convo = loadConversation(id);
    if (convo) {
      setMessages(convo.messages);
      setCurrentConvoId(convo.id);
      setRagState(RagState.IDLE);
      setCurrentView('chat');
    }
  }, [messages, currentConvoId]);

  const handleSendMessage = async (text: string, image?: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: Sender.USER,
      timestamp: Date.now(),
      image: image
    };

    setMessages(prev => [...prev, userMessage]);
    setRagState(RagState.RETRIEVING);

    const history = messages.map(m => ({
      role: m.sender === Sender.USER ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    try {
      if (!image) {
        await new Promise(resolve => setTimeout(resolve, 800));
      } else {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      setRagState(RagState.ANALYZING);
      await new Promise(resolve => setTimeout(resolve, 800));
      setRagState(RagState.GENERATING);

      const promptToSend = text || "Prašau paaiškinti teologinę šio vaizdo prasmę.";

      const streamResult = await sendMessageStream(history, promptToSend, image, 'image/jpeg', liturgy);

      const aiMessageId = (Date.now() + 1).toString();
      let fullText = "";

      setMessages(prev => [
        ...prev,
        {
          id: aiMessageId,
          text: "",
          sender: Sender.AI,
          timestamp: Date.now(),
          isStreaming: true
        }
      ]);

      for await (const chunk of streamResult) {
        const c = chunk as GenerateContentResponse;
        const chunkText = c.text;

        if (chunkText) {
          fullText += chunkText;
          setMessages(prev =>
            prev.map(msg =>
              msg.id === aiMessageId
                ? { ...msg, text: fullText }
                : msg
            )
          );
        }
      }

      // --- Post-Processing for Sources and Suggestions ---
      let cleanText = fullText;
      let suggestions: string[] = [];
      let groundingSources: GroundingSource[] = [];

      // 1. Extract SOURCES
      const sourcesRegex = /\|\|\|\s*SOURCES:([\s\S]*?)\|\|\|/;
      const sourceMatch = cleanText.match(sourcesRegex);
      if (sourceMatch) {
        const rawSources = sourceMatch[1];
        groundingSources = rawSources.split('|').map(s => {
          const t = s.trim();
          // Generate a generic search URI since we don't have real URLs from internal knowledge
          return {
            title: t,
            uri: `https://www.google.com/search?q=${encodeURIComponent(t + " katalikų bažnyčia")}`
          };
        }).filter(s => s.title.length > 0);
        cleanText = cleanText.replace(sourceMatch[0], '');
      }

      // 2. Extract SUGGESTIONS
      const suggestionRegex = /\|\|\|\s*SUGGESTIONS:([\s\S]*?)\|\|\|/;
      const suggestionMatch = cleanText.match(suggestionRegex);
      if (suggestionMatch) {
        const rawSuggestions = suggestionMatch[1];
        suggestions = rawSuggestions.split('|').map(s => s.trim()).filter(s => s.length > 0);
        cleanText = cleanText.replace(suggestionMatch[0], '');
      }

      cleanText = cleanText.trim();

      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? {
              ...msg,
              text: cleanText,
              isStreaming: false,
              suggestions: suggestions,
              groundingSources: groundingSources
            }
            : msg
        )
      );

    } catch (error: any) {
      console.error("Error sending message:", error);

      let errorMessage = "Atsiprašau, įvyko nenumatyta klaida. Prašau pabandyti dar kartą.";
      const errorStr = JSON.stringify(error);

      // Detect Leaked/Blocked API Key
      if (
        errorStr.includes("403") ||
        errorStr.includes("leaked") ||
        errorStr.includes("API key") ||
        errorStr.includes("PERMISSION_DENIED")
      ) {
        errorMessage = "⚠️ **KRITINĖ KLAIDA:** Jūsų API raktas yra užblokuotas (Google pranešė, kad jis nutekintas). Prašau susigeneruoti naują raktą per Google AI Studio.";
      }

      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          text: errorMessage,
          sender: Sender.AI,
          timestamp: Date.now()
        }
      ]);
    } finally {
      setRagState(RagState.IDLE);
    }
  };

  return (
    <div className={`flex flex-col h-screen h-[100dvh] transition-colors duration-500 ${isDark ? 'bg-slate-950 text-stone-100' : 'bg-stone-50 text-stone-900'}`}>
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        onNewChat={handleNewChat}
        onOpenSources={() => setIsSourcesModalOpen(true)}
        onOpenSearch={() => { }}
        onOpenHistory={() => setIsHistoryOpen(true)}
        liturgyData={liturgy}
        onOpenLiturgyModal={() => setIsLiturgyModalOpen(true)}
        isAdminVisible={user?.email === 'lukassdomass@gmail.com'}
        onLogoClick={() => {
          setCurrentView('chat');
        }}
      />

      <main className="flex-1 overflow-y-auto relative scroll-smooth pb-4 md:pb-0">
        <AnimatePresence mode="wait">
          {currentView === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="max-w-3xl mx-auto px-4 pt-8 pb-4"
            >
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onSuggestionClick={(text) => handleSendMessage(text)}
                />
              ))}
              <RagStatus state={ragState} />
              <div ref={messagesEndRef} className="h-4" />
            </motion.div>
          )}

          {currentView === 'prayer' && (
            <motion.div
              key="prayer"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <PrayerSection onOpenGroups={() => setCurrentView('groups')} />
            </motion.div>
          )}

          {currentView === 'bible' && (
            <motion.div
              key="bible"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="h-full"
            >
              <BibleReader
                onShareToGroup={(payload) => {
                  setPendingSharedExcerpt(payload);
                  setCurrentView('groups');
                }}
              />
            </motion.div>
          )}

          {currentView === 'data' && (
            <motion.div
              key="data"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <DataManager />
            </motion.div>
          )}

          {currentView === 'plans' && (
            <motion.div
              key="plans"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <ReadingPlans
                onNavigateToChapter={(book, chapter) => {
                  setCurrentView('bible');
                  window.dispatchEvent(new CustomEvent('navigate-to-chapter', { detail: { book, chapter } }));
                }}
              />
            </motion.div>
          )}

          {currentView === 'groups' && (
            <motion.div
              key="groups"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="h-full flex flex-col"
            >
              <PrayerGroupsView
                pendingSharedExcerpt={pendingSharedExcerpt}
                onConsumePendingExcerpt={() => setPendingSharedExcerpt(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {currentView === 'chat' && (
        <>
          {messages.length < 3 && ragState === RagState.IDLE && (
            <div className="max-w-3xl mx-auto px-4 mb-2 flex flex-wrap gap-2 justify-center fade-in slide-in-from-bottom-3 animate-in duration-500">
              {QUICK_ACTIONS.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(action.prompt)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm backdrop-blur-sm border
                    ${isDark
                      ? 'bg-slate-800/60 hover:bg-slate-800 border-slate-700 hover:border-amber-500/50 text-slate-300 hover:text-amber-400'
                      : 'bg-white/60 hover:bg-white border-stone-200 hover:border-amber-300 text-stone-600 hover:text-amber-800'}`}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          )}

          <InputArea
            onSendMessage={handleSendMessage}
            isLoading={ragState !== RagState.IDLE}
          />
        </>
      )}

      <SourcesModal
        isOpen={isSourcesModalOpen}
        onClose={() => setIsSourcesModalOpen(false)}
      />

      <LiturgyModal
        isOpen={isLiturgyModalOpen}
        onClose={() => setIsLiturgyModalOpen(false)}
        data={liturgy}
        onAsk={() => {
          const prompt = liturgy?.saintOfTheDay
            ? `Papasakok apie šventę: ${liturgy.saintOfTheDay}. Kokia jos prasmė ir šventojo gyvenimas?`
            : `Šiandien yra ${liturgy?.seasonLt || 'eilinis laikas'}. Kokia yra šios dienos Evangelija ir jos išminties žodžiai?`;
          handleSendMessage(prompt);
          // Modal will be closed by the component itself calling callbacks
        }}
      />
      <ChatHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        conversations={conversations}
        currentConvoId={currentConvoId}
        onSelectConversation={handleLoadConversation}
        onRefresh={() => setConversations(getAllConversations())}
      />
      <MobileNav
        currentView={currentView}
        onViewChange={setCurrentView}
        isAdminVisible={user?.email === 'lukassdomass@gmail.com'}
      />
    </div>
  );
};

export default App;
