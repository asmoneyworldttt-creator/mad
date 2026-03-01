import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Maximize2, Minimize2, Send, Trash2, Sparkles } from 'lucide-react';
import { useGlobalChat } from './useGlobalChat';
import { ChatMessage } from '../shared/ChatMessage';
import { TypingIndicator } from '../shared/TypingIndicator';
import { useAIContext } from './useAIContext';

export function GlobalAIAssistant({ activeTab }: { activeTab: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [inputText, setInputText] = useState('');
    const { messages, isTyping, error, sendMessage, clearChat } = useGlobalChat();
    const contextData = useAIContext(activeTab);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = () => {
        if (!inputText.trim() || isTyping) return;
        sendMessage(inputText, contextData);
        setInputText('');
    };

    return (
        <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end">
            <AnimatePresence>
                {isOpen && !isMinimized && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="mb-4 w-[380px] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-premium border border-slate-200 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 bg-primary text-white flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white/20 rounded-lg">
                                    <Bot size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm leading-none">Clinic AI Assistant</h3>
                                    <div className="flex items-center gap-1 mt-1">
                                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Ready to help</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={clearChat} title="Clear Chat" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                </button>
                                <button onClick={() => setIsMinimized(true)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                    <Minimize2 size={16} />
                                </button>
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-2 bg-slate-50/50 custom-scrollbar">
                            <div className="py-4">
                                {messages.map((msg, i) => (
                                    <ChatMessage key={i} {...msg} />
                                ))}
                                {isTyping && <TypingIndicator />}
                                {error && (
                                    <div className="px-4 py-2 mx-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[11px] font-bold text-center mb-4">
                                        {error}
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                placeholder="Type your question..."
                                className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 focus:bg-white transition-all"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputText.trim() || isTyping}
                                className={`p-2.5 rounded-xl transition-all ${!inputText.trim() || isTyping ? 'bg-slate-100 text-slate-400' : 'bg-primary text-white shadow-premium shadow-primary/20 hover:scale-105 active:scale-95'}`}
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Minimized / Floating Button */}
            <motion.div className="flex flex-col items-end">
                {isMinimized && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2 cursor-pointer hover:bg-slate-50"
                        onClick={() => setIsMinimized(false)}
                    >
                        <Maximize2 size={12} /> Restore Chat
                    </motion.div>
                )}

                <button
                    onClick={() => {
                        if (isMinimized) {
                            setIsMinimized(false);
                        } else {
                            setIsOpen(!isOpen);
                        }
                    }}
                    className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-110 active:scale-95 ${isOpen && !isMinimized ? 'bg-slate-800 text-white' : 'bg-primary text-white shadow-primary/30'
                        }`}
                >
                    <AnimatePresence mode="wait">
                        {isOpen && !isMinimized ? (
                            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                                <X size={24} />
                            </motion.div>
                        ) : (
                            <motion.div key="bot" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.5, opacity: 0 }}>
                                <Sparkles size={24} className="animate-pulse" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!isOpen && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-alert border-2 border-white rounded-full flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        </div>
                    )}
                </button>
            </motion.div>

            <style>{`
                .shadow-premium {
                    box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.2);
                }
                .custom-scrollbar::-webkit-scrollbar {
                  width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background-color: #E2E8F0;
                  border-radius: 20px;
                }
            `}</style>
        </div>
    );
}
