import { useState, useEffect } from 'react';
import {
    Video, VideoOff, Mic, MicOff, PhoneOff,
    MessageSquare, Settings, Share2, Users,
    Maximize2, Heart, Shield, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../Toast';

export function TeleDentistry({ theme, appointment }: { theme?: 'light' | 'dark', appointment?: any }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [isConnecting, setIsConnecting] = useState(true);

    useEffect(() => {
        const timer = setInterval(() => {
            if (!isConnecting) setCallDuration(d => d + 1);
        }, 1000);

        const connectTimeout = setTimeout(() => {
            setIsConnecting(false);
            showToast('Clinical connection established', 'success');
        }, 2500);

        return () => {
            clearInterval(timer);
            clearTimeout(connectTimeout);
        };
    }, [isConnecting]);

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`fixed inset-0 z-[100] flex flex-col ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
            {/* Connection Overlay */}
            <AnimatePresence>
                {isConnecting && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[110] bg-slate-900 flex flex-col items-center justify-center p-10 text-center"
                    >
                        <div className="relative mb-8">
                            <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Establishing HIPAA Compliant Tunnel</h2>
                        <p className="text-slate-500 font-medium">Authenticating clinical nodes and initializing encrypted media stream...</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="h-20 px-8 flex items-center justify-between border-b border-white/5 backdrop-blur-3xl bg-white/5">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                        <Video size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold">Tele-Consultation Node</h1>
                        <p className="text-[10px] font-extrabold text-primary uppercase tracking-widest flex items-center gap-2">
                            <Activity size={10} /> Secure Session #TC-{appointment?.id || '8829'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex flex-col items-end">
                        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Call Duration</p>
                        <p className="text-sm font-mono font-bold text-white tracking-widest">{formatTime(callDuration)}</p>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20 text-xs font-bold">
                        <Shield size={14} /> HIPAA Secure
                    </button>
                    <button onClick={() => window.location.reload()} className="p-3 rounded-xl hover:bg-white/5 text-slate-400 transition-all">
                        <Settings size={20} />
                    </button>
                </div>
            </div>

            {/* Main Stage */}
            <div className="flex-1 flex overflow-hidden p-6 gap-6 relative">
                {/* Main Video (Patient) */}
                <div className="flex-1 relative rounded-[3rem] overflow-hidden bg-slate-900 border border-white/10 shadow-2xl group">
                    <img
                        src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=1200"
                        className="w-full h-full object-cover"
                        alt="Patient Feed"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-10 left-10">
                        <h3 className="text-xl font-bold">{appointment?.patient_name || 'Jane Doe'}</h3>
                        <p className="text-xs font-medium text-white/70">Remote Site • Mumbai, IN</p>
                    </div>

                    {/* Dr Small Feed */}
                    <div className="absolute top-10 right-10 w-64 aspect-video rounded-3xl overflow-hidden border-2 border-primary/50 shadow-2xl bg-slate-800">
                        {isVideoOff ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                                <VideoOff size={32} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Feed Disabled</span>
                            </div>
                        ) : (
                            <img
                                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300"
                                className="w-full h-full object-cover"
                                alt="Clinician Feed"
                            />
                        )}
                        <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg text-[8px] font-bold">YOU</div>
                    </div>

                    {/* Floating Health HUD */}
                    <div className="absolute top-10 left-10 p-6 rounded-3xl bg-black/30 backdrop-blur-xl border border-white/10 space-y-4">
                        <div className="flex items-center gap-3">
                            <Activity className="text-rose-500 animate-pulse" size={16} />
                            <div>
                                <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest">Pulse / BPM</p>
                                <p className="text-sm font-bold">78 <span className="text-[10px] opacity-50">NORMAL</span></p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Heart className="text-emerald-500" size={16} />
                            <div>
                                <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest">Oxygen / SpO2</p>
                                <p className="text-sm font-bold">99% <span className="text-[10px] opacity-50">OPTIMAL</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel (Chat/Diagnostics) */}
                <AnimatePresence>
                    {showChat && (
                        <motion.div
                            initial={{ x: 400, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 400, opacity: 0 }}
                            className="w-96 rounded-[3rem] bg-white/5 border border-white/5 flex flex-col overflow-hidden backdrop-blur-2xl"
                        >
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                                <h4 className="font-bold flex items-center gap-2 italic">Diagnostic Notes</h4>
                                <button onClick={() => setShowChat(false)} className="text-slate-500 hover:text-white uppercase text-[8px] font-extrabold tracking-widest">Close</button>
                            </div>
                            <div className="flex-1 p-6 overflow-y-auto space-y-4 font-mono text-xs">
                                <div className="p-4 rounded-2xl bg-white/3 border border-white/5">
                                    <p className="text-primary mb-1">[SYSTEM]: Node established successfully.</p>
                                    <p className="text-slate-500">2026-03-04 15:05:22</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/3 border border-white/5">
                                    <p className="text-emerald-500 mb-1">Dr. Jenkins: Current pain score pre-op?</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/3 border border-white/5">
                                    <p className="text-white mb-1">Jane Doe: Feeling a sharp pain on #46, worsens with cold.</p>
                                </div>
                            </div>
                            <div className="p-6 bg-white/5">
                                <div className="relative">
                                    <input
                                        className="w-full bg-slate-800 border-white/10 border rounded-2xl py-3 pl-4 pr-12 text-xs outline-none focus:border-primary"
                                        placeholder="Transmit clinical instruction..."
                                    />
                                    <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:scale-110 transition-transform">
                                        <MessageSquare size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Control Bar */}
            <div className="h-32 px-10 flex items-center justify-center gap-4 relative">
                <div className="flex items-center gap-4 bg-slate-900/60 backdrop-blur-2xl p-4 rounded-[2.5rem] border border-white/10 shadow-2xl">
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`p-5 rounded-2xl border transition-all ${isMuted ? 'bg-rose-500 border-rose-400 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
                    >
                        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>
                    <button
                        onClick={() => setIsVideoOff(!isVideoOff)}
                        className={`p-5 rounded-2xl border transition-all ${isVideoOff ? 'bg-rose-500 border-rose-400 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
                    >
                        {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                    </button>

                    <div className="w-px h-10 bg-white/10 mx-2" />

                    <button
                        onClick={() => setShowChat(!showChat)}
                        className={`p-5 rounded-2xl border transition-all ${showChat ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
                    >
                        <MessageSquare size={24} />
                    </button>
                    <button className="p-5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                        <Users size={24} />
                    </button>
                    <button className="p-5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                        <Share2 size={24} />
                    </button>
                    <button className="p-5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                        <Maximize2 size={24} />
                    </button>

                    <div className="w-px h-10 bg-white/10 mx-2" />

                    <button
                        onClick={() => window.location.reload()}
                        className="bg-rose-500 hover:bg-rose-600 active:scale-95 text-white px-10 py-5 rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-rose-500/20 transition-all"
                    >
                        <PhoneOff size={20} /> End Consult
                    </button>
                </div>
            </div>
        </div>
    );
}
