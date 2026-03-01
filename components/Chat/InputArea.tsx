import React, { useState, useRef, useEffect } from 'react';
import { Send, BookOpenText, Image as ImageIcon, X } from 'lucide-react';

interface InputAreaProps {
    onSendMessage: (text: string, image?: string) => void;
    isLoading: boolean;
}
import { useTheme } from '../../context/ThemeContext';

export const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isLoading }) => {
    const { isDark } = useTheme();
    const [text, setText] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if ((text.trim() || selectedImage) && !isLoading) {
            onSendMessage(text, selectedImage || undefined);
            setText('');
            setSelectedImage(null);
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        }
    }, [text]);

    return (
        <div className={`relative left-0 right-0 backdrop-blur-lg border-t p-4 md:p-6 pb-8 z-40 transition-colors duration-500
            ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-stone-50/80 border-stone-200'}`}>
            <div className="max-w-3xl mx-auto">
                {/* Image Preview */}
                {selectedImage && (
                    <div className="mb-2 relative inline-block animate-in fade-in slide-in-from-bottom-2">
                        <img
                            src={selectedImage}
                            alt="Preview"
                            className="h-20 w-auto rounded-lg border border-amber-200 shadow-sm object-cover"
                        />
                        <button
                            onClick={() => { setSelectedImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                            className="absolute -top-2 -right-2 bg-red-900 text-white rounded-full p-1 shadow-md hover:bg-red-800"
                        >
                            <X size={12} />
                        </button>
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className={`relative group rounded-xl shadow-lg border transition-all duration-300
                        ${isDark
                            ? (isLoading ? 'bg-slate-800/50 border-slate-700 opacity-80' : 'bg-slate-800 border-slate-700 hover:border-amber-500/50 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500/20')
                            : (isLoading ? 'bg-white border-stone-200 opacity-80' : 'bg-white border-stone-300 hover:border-amber-400 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500/20')
                        }`}
                >
                    <div className="flex items-end p-2">
                        {/* Context Icon */}
                        <div className={`pl-3 py-3 ${isDark ? 'text-slate-500' : 'text-stone-400'}`}>
                            <BookOpenText size={20} />
                        </div>

                        {/* Text Input */}
                        <textarea
                            ref={textareaRef}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Klauskite arba įkelkite religinį paveikslėlį..."
                            className={`flex-1 max-h-[150px] bg-transparent border-none focus:ring-0 resize-none py-3 px-3 min-h-[50px] font-inter leading-relaxed
                                ${isDark ? 'text-slate-200 placeholder-slate-500' : 'text-stone-800 placeholder-stone-400'}`}
                            rows={1}
                            disabled={isLoading}
                        />

                        {/* Actions */}
                        <div className="flex items-center gap-1 mb-1 mr-1">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept="image/*"
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading}
                                className={`p-2 rounded-lg transition-colors ${isDark ? 'text-slate-500 hover:text-amber-400 hover:bg-slate-700' : 'text-stone-400 hover:text-amber-700 hover:bg-amber-50'}`}
                                title="Įkelti paveikslėlį"
                            >
                                <ImageIcon size={20} />
                            </button>

                            <button
                                type="submit"
                                disabled={(!text.trim() && !selectedImage) || isLoading}
                                className={`p-2 rounded-lg transition-colors duration-200 relative ${(!text.trim() && !selectedImage) || isLoading
                                    ? (isDark ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-stone-100 text-stone-300 cursor-not-allowed')
                                    : (isDark ? 'bg-amber-600 text-white hover:bg-amber-500 shadow-md' : 'bg-red-900 text-white hover:bg-red-800 shadow-md')
                                    }`}
                            >
                                <Send size={18} className={isLoading ? 'opacity-0' : 'opacity-100'} />
                                {isLoading && (
                                    <span className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-4 h-4 border-2 border-stone-300 border-t-stone-500 rounded-full animate-spin"></div>
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </form>


            </div>
        </div>
    );
};
