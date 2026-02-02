import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Layout/Header';
import { MessageBubble } from './components/Chat/MessageBubble';
import { InputArea } from './components/Chat/InputArea';
import { RagStatus } from './components/UI/RagStatus';
import { SourcesModal } from './components/UI/SourcesModal';
import { PrayerSection } from './components/Views/PrayerSection';
import { BibleReader } from './components/Views/BibleReader';
import { DataManager } from './components/Views/DataManager';
import { Message, Sender, RagState, GroundingSource } from './types';
import { sendMessageStream } from './services/geminiService';
import { GenerateContentResponse } from '@google/genai';
import { Cross, Book, Heart, HelpCircle } from 'lucide-react';
import { initKnowledgeBase } from './data/knowledgeBase';

const QUICK_ACTIONS = [
  { label: 'Dienos Evangelija', icon: <Book size={14} />, prompt: 'Kokia yra šios dienos Evangelija? Prašau pateikti pilną tekstą ir trumpą komentarą.' },
  { label: 'Kaip atlikti išpažintį?', icon: <Cross size={14} />, prompt: 'Prašau paaiškinti, kaip pasiruošti ir atlikti Šventąją Išpažintį pagal Katalikų Bažnyčios mokymą.' },
  { label: 'Rožinio malda', icon: <Heart size={14} />, prompt: 'Kaip melstis Rožinį? Kokios yra paslaptys?' },
  { label: 'Kas yra Šv. Mišios?', icon: <HelpCircle size={14} />, prompt: 'Kokia yra Šventųjų Mišių prasmė ir teologija?' },
];

const INITIAL_MESSAGE: Message = {
  id: 'welcome',
  text: "**Garbė Jėzui Kristui.** \n\nAš esu Tikėjimo Šviesa – Jūsų pagalbininkas. \n\nGaliu padėti Jums rasti atsakymus Šventajame Rašte, Bažnyčios dokumentuose bei teologiniuose šaltiniuose. Klauskite!",
  sender: Sender.AI,
  timestamp: Date.now()
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'chat' | 'prayer' | 'bible' | 'data'>('chat');
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [ragState, setRagState] = useState<RagState>(RagState.IDLE);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Initialize the IndexedDB when app loads
    initKnowledgeBase();
  }, []);

  useEffect(() => {
    if (currentView === 'chat') {
      scrollToBottom();
    }
  }, [messages, ragState, currentView]);

  const handleNewChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setRagState(RagState.IDLE);
    window.speechSynthesis.cancel();
  };

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

      const streamResult = await sendMessageStream(history, promptToSend, image);
      
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
      const sourcesRegex = /\|\|\|SOURCES:([\s\S]*?)\|\|\|/;
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
      const suggestionRegex = /\|\|\|SUGGESTIONS:([\s\S]*?)\|\|\|/;
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
    <div className="flex flex-col h-screen bg-stone-50">
      <Header 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        onNewChat={handleNewChat}
        onOpenSources={() => setIsSourcesModalOpen(true)}
        onOpenSearch={() => {}}
      />
      
      <main className="flex-1 overflow-y-auto relative scroll-smooth">
        {currentView === 'chat' && (
          <div className="max-w-3xl mx-auto px-4 pt-8 pb-4">
            {messages.map((msg) => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                onSuggestionClick={(text) => handleSendMessage(text)}
              />
            ))}
            <RagStatus state={ragState} />
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}

        {currentView === 'prayer' && (
          <PrayerSection />
        )}

        {currentView === 'bible' && (
          <BibleReader />
        )}

        {currentView === 'data' && (
          <DataManager />
        )}
      </main>

      {currentView === 'chat' && (
        <>
          {messages.length < 3 && ragState === RagState.IDLE && (
            <div className="max-w-3xl mx-auto px-4 mb-2 flex flex-wrap gap-2 justify-center fade-in slide-in-from-bottom-3 animate-in duration-500">
               {QUICK_ACTIONS.map((action, idx) => (
                 <button
                   key={idx}
                   onClick={() => handleSendMessage(action.prompt)}
                   className="flex items-center gap-2 bg-white/60 hover:bg-white border border-stone-200 hover:border-amber-300 px-3 py-1.5 rounded-full text-xs font-medium text-stone-600 hover:text-amber-800 transition-all shadow-sm backdrop-blur-sm"
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
    </div>
  );
};

export default App;