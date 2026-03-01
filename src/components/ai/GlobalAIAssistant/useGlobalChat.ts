import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenerativeAI, ChatSession } from "@google/generative-ai";
import { GLOBAL_ASSISTANT_SYSTEM_PROMPT } from '../../../config/aiConfig';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export function useGlobalChat() {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hello! I am your DentiSphere assistant. How can I help you today?', timestamp: new Date() }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const chatRef = useRef<ChatSession | null>(null);

    useEffect(() => {
        if (!API_KEY) {
            setError('Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file.');
            return;
        }

        try {
            const genAI = new GoogleGenerativeAI(API_KEY);
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                systemInstruction: GLOBAL_ASSISTANT_SYSTEM_PROMPT
            });

            chatRef.current = model.startChat({
                history: [],
                generationConfig: {
                    maxOutputTokens: 1024,
                    temperature: 0.4,
                },
            });
        } catch (err) {
            console.error('Error initializing Gemini:', err);
            setError('Failed to initialize AI assistant.');
        }
    }, []);

    const sendMessage = useCallback(async (userText: string, contextData: any = null) => {
        if (!chatRef.current) return;

        const newMessage: Message = { role: 'user', content: userText, timestamp: new Date() };
        setMessages(prev => [...prev, newMessage]);
        setIsTyping(true);
        setError(null);

        const messageWithContext = contextData
            ? `[CURRENT PAGE CONTEXT - DO NOT MENTION THIS HEADER TO USER]:\n${JSON.stringify(contextData, null, 2)}\n\n[USER QUESTION]: ${userText}`
            : userText;

        try {
            const result = await chatRef.current.sendMessage(messageWithContext);
            const assistantText = result.response.text();

            const assistantMessage: Message = { role: 'assistant', content: assistantText, timestamp: new Date() };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (err: any) {
            console.error('Error sending message:', err);
            let errorMsg = 'Assistant is temporarily unavailable. Please try again.';
            if (err.message?.includes('quota')) errorMsg = 'AI Assistant is busy. Please try again in a minute.';
            setError(errorMsg);
        } finally {
            setIsTyping(false);
        }
    }, []);

    const clearChat = useCallback(() => {
        setMessages([{ role: 'assistant', content: 'Hello! I am your DentiSphere assistant. How can I help you today?', timestamp: new Date() }]);
        // Re-initialize chat session to clear history in the model
        if (API_KEY) {
            const genAI = new GoogleGenerativeAI(API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: GLOBAL_ASSISTANT_SYSTEM_PROMPT });
            chatRef.current = model.startChat({ history: [], generationConfig: { maxOutputTokens: 1024, temperature: 0.4 } });
        }
    }, []);

    return { messages, isTyping, error, sendMessage, clearChat };
}
