import React, { useState } from 'react';
import { Message, Sender } from '../../types';
import { User, Sparkles, Volume2, VolumeX, Globe, ExternalLink } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface MessageBubbleProps {
  message: Message;
  onSuggestionClick?: (text: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onSuggestionClick }) => {
  const { isDark } = useTheme();
  const isUser = message.sender === Sender.USER;
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(message.text);
    utterance.lang = 'lt-LT'; // Lithuanian
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const renderContent = (text: string) => {
    const cleanText = text.split('|||SUGGESTIONS')[0].split('|||SOURCES')[0];
    const lines = cleanText.split('\n');

    return lines.map((line, i) => {
      // HEADER 3 (###)
      if (line.trim().startsWith('###')) {
        return (
          <h3 key={i} className={`${isDark ? 'text-amber-400 border-amber-500/20' : 'text-red-900 border-red-100'} font-cinzel font-bold text-lg mt-6 mb-3 tracking-wide border-b pb-1`}>
            {parseInlineStyles(line.replace(/^###\s*/, ''))}
          </h3>
        );
      }
      // HEADER 2 (##)
      if (line.trim().startsWith('##')) {
        return (
          <h2 key={i} className={`${isDark ? 'text-amber-500' : 'text-red-900'} font-cinzel font-bold text-xl mt-6 mb-4`}>
            {parseInlineStyles(line.replace(/^##\s*/, ''))}
          </h2>
        );
      }
      // CITATA (>)
      if (line.trim().startsWith('>')) {
        return (
          <blockquote key={i} className={`my-5 pl-5 border-l-4 ${isDark ? 'border-amber-600 bg-amber-900/20 text-slate-300' : 'border-amber-400 bg-amber-50 text-stone-800'} py-4 pr-4 italic font-serif text-lg rounded-r-lg shadow-sm leading-relaxed`}>
            {parseInlineStyles(line.replace(/^>\s*/, ''))}
          </blockquote>
        );
      }
      // NUMERUOTAS SĄRAŠAS (1. 2. 3.)
      const numberedMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
      if (numberedMatch) {
        return (
          <div key={i} className="flex gap-3 ml-2 mb-2">
            <span className={`font-bold min-w-[1.5em] text-right ${isDark ? 'text-amber-500' : 'text-red-800'}`}>{numberedMatch[1]}.</span>
            <p className={`min-h-[1em] ${!isUser ? `font-serif leading-relaxed ${isDark ? 'text-slate-200' : 'text-stone-800'}` : 'font-sans'}`}>
              {parseInlineStyles(numberedMatch[2])}
            </p>
          </div>
        );
      }
      // SĄRAŠAS (* arba -)
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        return (
          <div key={i} className="flex gap-2 ml-2 mb-2">
            <span className="text-amber-600 mt-1.5">•</span>
            <p className={`min-h-[1em] ${!isUser ? `font-serif leading-relaxed ${isDark ? 'text-slate-200' : 'text-stone-800'}` : 'font-sans'}`}>
              {parseInlineStyles(line.replace(/^[\*-]\s*/, ''))}
            </p>
          </div>
        )
      }
      // HORIZONTALI LINIJA (---)
      if (line.trim() === '---' || line.trim() === '***') {
        return <hr key={i} className={`my-4 ${isDark ? 'border-slate-700' : 'border-stone-200'}`} />;
      }
      // TUŠČIA EILUTĖ
      if (line.trim() === '') {
        return <div key={i} className="h-2" />;
      }
      // PAPRASTAS TEKSTAS
      return (
        <p key={i} className={`min-h-[1em] mb-3 last:mb-0 ${!isUser ? `font-serif leading-relaxed ${isDark ? 'text-slate-200' : 'text-stone-800'} text-base md:text-lg` : 'font-sans'}`}>
          {parseInlineStyles(line)}
        </p>
      );
    });
  };

  const parseInlineStyles = (text: string): React.ReactNode[] => {
    // Split by all inline patterns: **bold**, *italic*, `code`, [link](url)
    const parts = text.split(/(\*\*.*?\*\*|\*(?!\*).*?\*|`[^`]+`|\[.*?\]\(.*?\))/g);
    return parts.map((part, j) => {
      // BOLD (**text**)
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} className={`${isDark ? 'text-amber-400' : 'text-red-900'} font-bold`}>{part.slice(2, -2)}</strong>;
      }
      // ITALIC (*text*)
      if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
        return <em key={j} className={`${isDark ? 'text-amber-200' : 'text-stone-700'} italic`}>{part.slice(1, -1)}</em>;
      }
      // INLINE CODE (`code`)
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={j} className={`px-1.5 py-0.5 rounded text-sm font-mono ${isDark ? 'bg-slate-800 text-amber-300' : 'bg-stone-100 text-red-800'}`}>{part.slice(1, -1)}</code>;
      }
      // LINK ([text](url))
      const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        return <a key={j} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className={`underline underline-offset-2 ${isDark ? 'text-amber-400 hover:text-amber-300' : 'text-red-800 hover:text-red-600'}`}>{linkMatch[1]}</a>;
      }
      return part;
    });
  };

  return (
    <div className={`flex flex-col w-full mb-6 ${isUser ? 'items-end' : 'items-start'}`}>
      <div className={`flex max-w-[95%] md:max-w-[85%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>

        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm border ${isUser
          ? (isDark ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-stone-200 border-stone-300 text-stone-600')
          : (isDark ? 'bg-amber-700 border-amber-600 text-amber-100' : 'bg-red-900 border-red-800 text-amber-50')
          }`}>
          {isUser ? <User size={16} /> : <Sparkles size={16} />}
        </div>

        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} w-full`}>
          <div className={`rounded-2xl px-5 py-5 shadow-sm border w-full overflow-hidden relative group ${isUser
            ? (isDark ? 'bg-slate-800 border-slate-700 text-slate-200 rounded-tr-none' : 'bg-white border-stone-200 text-stone-800 rounded-tr-none')
            : (isDark ? 'bg-slate-900 border-slate-800 text-slate-200 rounded-tl-none' : 'bg-[#faf9f6] border-stone-200 text-stone-900 rounded-tl-none')
            }`}>

            {!isUser && !message.isStreaming && (
              <button
                onClick={handleSpeak}
                className={`absolute top-2 right-2 p-1.5 rounded-full transition-all ${isDark ? 'text-slate-500 hover:text-amber-400 hover:bg-slate-800' : 'text-stone-300 hover:text-amber-700 hover:bg-stone-100'}`}
                title="Klausytis"
              >
                {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            )}

            {message.image && (
              <div className={`mb-4 rounded-lg overflow-hidden shadow-sm max-w-[250px] border ${isDark ? 'border-slate-700' : 'border-stone-200'}`}>
                <img src={message.image} alt="Vartotojo nuotrauka" className="w-full h-auto object-cover" />
              </div>
            )}
            <div className={`prose max-w-none ${isDark ? 'prose-invert' : 'prose-stone'}`}>
              {renderContent(message.text)}
            </div>

            {/* GROUNDING SOURCES (Real RAG) */}
            {!isUser && message.groundingSources && message.groundingSources.length > 0 && (
              <div className={`mt-6 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-stone-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Globe size={14} className={isDark ? 'text-slate-600' : 'text-stone-400'} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-stone-500'}`}>Šaltiniai</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {message.groundingSources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-between text-xs border rounded p-2 transition-colors group/link
                           ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-amber-400 hover:border-amber-500/30' : 'bg-white border-stone-200 text-stone-600 hover:text-red-900 hover:border-red-200'}`}
                    >
                      <span className="truncate pr-2 font-medium">{source.title || source.uri}</span>
                      <ExternalLink size={12} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-1 px-1 flex items-center gap-2">
            <span className={`text-[10px] font-medium uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-stone-400'}`}>
              {isUser ? 'Jūs' : 'Tikėjimo Šviesa'}
            </span>
          </div>

          {!isUser && message.suggestions && message.suggestions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1 duration-500">
              {message.suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => onSuggestionClick && onSuggestionClick(sug)}
                  className={`text-xs font-medium border px-3 py-1.5 rounded-full transition-colors cursor-pointer
                         ${isDark ? 'text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20' : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-200'}`}
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};