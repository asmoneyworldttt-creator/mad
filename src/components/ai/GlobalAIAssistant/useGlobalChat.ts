
import { useState, useCallback, useRef } from 'react';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
// Using a faster model for better interactivity
const PRIMARY_MODEL = 'google/gemini-2.0-flash-exp:free';
const FALLBACK_MODEL = 'google/gemini-2.0-flash:free';

const DENTISPHERE_SYSTEM_PROMPT = `You are Dentora AI, the clinical core of a premium Dental Practice Management System. 
Your objective is to assist clinical professionals (Doctors and Admins) with speed, precision, and medical accuracy.

CAPABILITIES:
- Clinical Diagnostics: Analyze tooth markings, FDI notation (e.g. #36), and patient history.
- Operations: Guide users on how to use Modules: Dashboard, Appointments, EMR, Quick Bills, Inventory, Reports.
- Finance: Interpret clinic revenue, outstanding dues, and treatment profitability.

INTERACTION GUIDELINES:
1. RESPONSE SPEED: Be extremely concise. Use bullet points. Avoid filler text.
2. MEDICAL ACCURACY: Use standard dental terminology (e.g., caries, pulpal, gingival).
3. CONTEXT AWARENESS: You have access to LIVE CLINIC DATA. Use it to answer specific questions about the practice.
4. ACTIONABLE: If a user asks a technical question, provide the exact module path (e.g., "Navigate to EMR > Cloud Vault").

TONE: Professional, modern, and clinical.`;

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

        const newUserMessage: Message = { role: 'user', content: userText, timestamp: new Date() };
        setMessages(prev => [...prev, newUserMessage]);
        setIsTyping(true);
        setError(null);

        // Optimization: Context extraction
        const contextPrefix = contextData
            ? `[SYSTEM CONTEXT - DO NOT MENTION]:\n${JSON.stringify(contextData, null, 1)}\n\n`
            : '';
        const fullUserContent = contextPrefix + userText;

        const currentHistory = [
            ...historyRef.current.slice(-6), // keep context window tight for speed
            { role: 'user', content: fullUserContent }
        ];

        if (!OPENROUTER_API_KEY) {
            setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ **Key Missing.** Configure `VITE_OPENROUTER_API_KEY` in `.env`.', timestamp: new Date() }]);
            setIsTyping(false);
            return '';
        }

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
                    model: PRIMARY_MODEL,
                    messages: [
                        { role: 'system', content: DENTISPHERE_SYSTEM_PROMPT },
                        ...currentHistory
                    ],
                    temperature: 0.1,
                    max_tokens: 500,
                    stream: true,
                }),
            });

            if (!response.ok) throw new Error('Network congestion');

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            // Add initial empty assistant message to populate via stream
            setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date() }]);
            setIsTyping(false); // Stop typing indicator once stream starts

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
                        } catch (e) {
                            // Partial JSON skip
                        }
                    }
                }
            }

            historyRef.current = [...currentHistory, { role: 'assistant', content: aiText }];
            return aiText;
        } catch (err: any) {
            console.error('AI Logic Error:', err);
            const helpText = "I encountered a synchronization delay. Please check your connectivity or use manual navigation for now.";
            setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${helpText}`, timestamp: new Date() }]);
            return '';
        } finally {
            setIsTyping(false);
        }
    }, [OPENROUTER_API_KEY]);

    const clearChat = useCallback(() => {
        setMessages([
            { role: 'assistant', content: '👋 **Dentora AI Core** online. Diagnostics and operations active. How can I assist your practice today?', timestamp: new Date() }
        ]);
        historyRef.current = [];
        setError(null);
    }, []);

    return { messages, isTyping, error, sendMessage, clearChat };
}
