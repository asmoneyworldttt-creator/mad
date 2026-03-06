import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Square, Volume2 } from 'lucide-react';
import { useToast } from '../Toast';

interface VoiceChartingProps {
    onTranscript: (text: string) => void;
    currentText: string;
    theme?: 'light' | 'dark';
    disabled?: boolean;
}

export function VoiceCharting({ onTranscript, currentText, theme, disabled }: VoiceChartingProps) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [interimText, setInterimText] = useState('');
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            setIsSupported(true);
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event: any) => {
                let interim = '';
                let finalText = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalText += transcript + ' ';
                    } else {
                        interim += transcript;
                    }
                }
                if (finalText) {
                    onTranscript(currentText + (currentText ? ' ' : '') + finalText.trim());
                    setInterimText('');
                } else {
                    setInterimText(interim);
                }
            };

            recognition.onerror = (event: any) => {
                console.error('Voice error:', event.error);
                if (event.error === 'not-allowed') {
                    showToast('Microphone access denied. Please allow mic access.', 'error');
                }
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
                setInterimText('');
            };

            recognitionRef.current = recognition;
        }
        return () => recognitionRef.current?.stop();
    }, [currentText]); // re-bind when currentText changes

    const toggleListening = () => {
        if (!recognitionRef.current) return showToast('Voice not supported on this browser', 'error');

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
            showToast('🎤 Listening... Speak your clinical notes', 'success');
        }
    };

    if (!isSupported) return null;

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={toggleListening}
                disabled={disabled}
                title={isListening ? 'Stop voice charting' : 'Start voice charting'}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 disabled:opacity-50 ${isListening
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 hover:bg-rose-600'
                        : isDark
                            ? 'bg-white/10 text-slate-300 border border-white/10 hover:bg-white/20 hover:text-white'
                            : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-primary/10 hover:text-primary hover:border-primary/30'
                    }`}
            >
                {isListening ? (
                    <>
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        <MicOff size={14} />
                        Stop
                    </>
                ) : (
                    <>
                        <Mic size={14} />
                        Voice
                    </>
                )}
            </button>
            {isListening && interimText && (
                <span className={`text-xs italic px-3 py-1 rounded-lg border animate-pulse max-w-xs truncate ${isDark ? 'text-slate-400 border-white/10 bg-white/5' : 'text-slate-500 border-slate-200 bg-slate-50'}`}>
                    🎤 {interimText}...
                </span>
            )}
        </div>
    );
}
