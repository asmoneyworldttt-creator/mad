
import { useState, useCallback, useRef } from 'react';

// Candidate models for free tier stability
const CANDIDATE_MODELS = [
    'openrouter/free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'stepfun/step-3.5-flash:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'qwen/qwen3-coder-480b-a35b:free'
];

const DENTISPHERE_SYSTEM_PROMPT = `You are Dentora AI, the hyper-fast clinical brain of the Dentora Practice Management System. 
Your objective is to provide INSTANT, medically-accurate, and data-driven responses for Dental professionals.

CORE DIRECTIVE: 
- Be incredibly fast. Use short sentences and immediate answers.
- You have full "Site Awareness". You know every module: Dashboard (KPIs), EMR (Records), Clinical Notes (SOAP), Finance (Revenue/Bills), Inventory, Lab Orders, etc.
- If a user asks for a report, synthesize it instantly from current data context.

CAPABILITIES:
- Clinical: FDI Notation analysis (#11-#48), SOAP note summaries, treatment planning advice.
- Financial: Revenue analysis, pending payments, expense tracking.
- Operational: Workflow guidance (e.g., "Add staff in Team Hub", "Set up branches in Settings").

INTERACTION:
1. NO FILLER: Skip "Hello", "How can I help". Jump straight to the answer.
2. FORMATTING: Use bold text for key metrics or paths.
3. CONTEXT: You see live JSON data of the current screen. Analyze it immediately.

TONE: Clinical, efficient, and proactive.`;

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export function useGlobalChat() {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: '👋 **Dentora AI Core** online. Diagnostics and operations active. How can I assist your practice today?', timestamp: new Date() }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const historyRef = useRef<{ role: string; content: string }[]>([]);

    const sendMessage = useCallback(async (userText: string, contextData: any = null): Promise<string> => {
        if (!userText.trim()) return '';

        const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';

        const newUserMessage: Message = { role: 'user', content: userText, timestamp: new Date() };
        setMessages(prev => [...prev, newUserMessage]);
        setIsTyping(true);
        setError(null);

        if (!OPENROUTER_API_KEY) {
            setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ **Key Missing.** Please ensure `VITE_OPENROUTER_API_KEY` is set in your environment.', timestamp: new Date() }]);
            setIsTyping(false);
            return '';
        }

        // Optimization: Context extraction
        const contextPrefix = contextData
            ? `[SYSTEM CONTEXT - DO NOT MENTION]:\n${JSON.stringify(contextData, null, 1)}\n\n`
            : '';
        const fullUserContent = contextPrefix + userText;

        const currentHistory = [
            ...historyRef.current.slice(-6), // keep context window tight for speed
            { role: 'user', content: fullUserContent }
        ];

        async function tryFetch(modelIdx: number): Promise<string> {
            if (modelIdx >= CANDIDATE_MODELS.length) {
                throw new Error("All AI endpoints are currently congested. Please try again in a few minutes.");
            }

            const model = CANDIDATE_MODELS[modelIdx];
            let aiText = '';

            try {
                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://dentora.clinic',
                        'X-Title': 'Dentora AI',
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [
                            { role: 'system', content: DENTISPHERE_SYSTEM_PROMPT },
                            ...currentHistory
                        ],
                        temperature: 0.1,
                        max_tokens: 500,
                        stream: true,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    // If model not found or endpoints exhausted, try next one
                    if (response.status === 404 || errorData.error?.code === 404 || errorData.error?.message?.includes('No endpoints')) {
                        console.warn(`Model ${model} unavailable, trying next...`);
                        return tryFetch(modelIdx + 1);
                    }
                    
                    if (response.status === 402) {
                        throw new Error("Insufficient OpenRouter credits. Please add balance or check free tier status.");
                    }
                    if (response.status === 401 || response.status === 403) {
                        throw new Error("Invalid API Key. Please verify your `VITE_OPENROUTER_API_KEY` in `.env`.");
                    }
                    
                    throw new Error(errorData.error?.message || 'Network congestion');
                }

                const reader = response.body?.getReader();
                const decoder = new TextDecoder();

                // Add initial empty assistant message to populate via stream
                setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date() }]);
                setIsTyping(false);

                while (true) {
                    const { done, value } = await reader!.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const dataStr = line.slice(6).trim();
                            if (dataStr === '[DONE]') break;

                            try {
                                const data = JSON.parse(dataStr);
                                const content = data.choices?.[0]?.delta?.content || '';
                                if (content) {
                                    aiText += content;
                                    setMessages(prev => {
                                        const next = [...prev];
                                        next[next.length - 1] = { ...next[next.length - 1], content: aiText };
                                        return next;
                                    });
                                }
                            } catch (e) { }
                        }
                    }
                }

                historyRef.current = [...currentHistory, { role: 'assistant', content: aiText }];
                return aiText;
            } catch (err: any) {
                if (err.message.includes('No endpoints') || err.message.includes('unavailable')) {
                    return tryFetch(modelIdx + 1);
                }
                throw err;
            }
        }

        try {
            return await tryFetch(0);
        } catch (err: any) {
            console.error('AI Logic Error:', err);
            const helpText = err.message || "I encountered a synchronization delay. Please check your connectivity.";
            setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${helpText}`, timestamp: new Date() }]);
            return '';
        } finally {
            setIsTyping(false);
        }
    }, []);

    const clearChat = useCallback(() => {
        setMessages([
            { role: 'assistant', content: '👋 **Dentora AI Core** online. Diagnostics and operations active. How can I assist your practice today?', timestamp: new Date() }
        ]);
        historyRef.current = [];
        setError(null);
    }, []);

    return { messages, isTyping, error, sendMessage, clearChat };
}
