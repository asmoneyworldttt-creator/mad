import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';
import { 
    Shield, Lock, Mail, ArrowRight, 
    Terminal, Cpu, Zap, Fingerprint,
    Eye, EyeOff, Activity, Globe, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function MasterAuth({ onAuthSuccess, theme }: { onAuthSuccess: () => void; theme?: 'light' | 'dark' }) {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { showToast } = useToast();
    const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
    const [accessStep, setAccessStep] = useState(0);

    const [formData, setFormData] = useState({
        email: 'admin@dentisphere.pro',
        password: 'password123'
    });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({
                x: (e.clientX / window.innerWidth) * 100,
                y: (e.clientY / window.innerHeight) * 100,
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setAccessStep(1); // Simulating auth sequence
        
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });
            
            if (error) {
                // If user doesn't exist, try to sign up as master (for development ease)
                if (error.message.includes('Invalid login credentials')) {
                    setAccessStep(2); // "Authenticating..."
                    const { error: signUpError } = await supabase.auth.signUp({
                        email: formData.email,
                        password: formData.password,
                        options: {
                            data: {
                                full_name: 'Master Core Administrator',
                                role: 'master'
                            }
                        }
                    });
                    if (signUpError) throw signUpError;
                    showToast('Master Core ID initialized. Please verify email if required, or try logging in again.', 'success');
                } else {
                    throw error;
                }
            } else {
                setAccessStep(3); // "Access Granted"
                setTimeout(() => {
                    showToast('Welcome to the Central Command, Master Administrator.', 'success');
                    onAuthSuccess();
                }, 1000);
            }
        } catch (error: any) {
            setAccessStep(0);
            showToast(error.message || 'Access Denied by Core Security.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden font-sans" style={{ background: '#010409' }}>
            {/* Cyberpunk Grid Background */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.1]" 
                style={{ 
                    backgroundImage: `linear-gradient(rgba(19,91,236,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(19,91,236,0.3) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                    maskImage: 'radial-gradient(circle at 50% 50%, black, transparent 80%)'
                }} 
            />

            {/* Pulsing Core Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[160px] opacity-[0.15] pointer-events-none transition-all duration-1000"
                style={{ 
                    background: accessStep === 3 ? 'radial-gradient(circle, #10b981 0%, transparent 60%)' : 'radial-gradient(circle, #135bec 0%, transparent 60%)',
                    transform: `translate(-50%, -50%) scale(${1 + (mousePos.x + mousePos.y) / 400})`
                }} 
            />

            {/* Moving Scanner Line */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                <div className="w-full h-[2px] bg-primary/40 absolute animate-scanline shadow-[0_0_15px_rgba(19,91,236,0.8)]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-[480px] mx-4 relative z-10"
            >
                {/* Master Badge */}
                <div className="flex flex-col items-center mb-10">
                    <motion.div 
                        whileHover={{ rotate: 180 }}
                        transition={{ duration: 0.6 }}
                        className="w-20 h-20 rounded-[1.8rem] bg-slate-900 border border-primary/30 flex items-center justify-center relative group overflow-hidden mb-6 shadow-2xl"
                    >
                        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Shield className="text-primary group-hover:scale-125 transition-transform" size={40} />
                        <div className="absolute inset-0 border border-primary/40 animate-pulse rounded-[1.8rem]" />
                    </motion.div>
                    <h1 className="text-3xl font-black text-white tracking-tighter mb-2 uppercase italic">Master Access</h1>
                    <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <p className="text-[10px] text-primary/60 font-black uppercase tracking-[0.4em]">Secure Protocol v4.0.2</p>
                    </div>
                </div>

                {/* Glass Login Card */}
                <div className="p-10 rounded-[3rem] border border-white/10 shadow-3xl relative overflow-hidden"
                    style={{ 
                        background: 'rgba(10, 15, 30, 0.7)',
                        backdropFilter: 'blur(30px)',
                        boxShadow: '0 40px 100px rgba(0,0,0,0.8), inset 0 0 40px rgba(19,91,236,0.05)'
                    }}>
                    
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none rotate-animation"><Terminal size={120} /></div>

                    <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">Secure Node ID</label>
                            <div className="relative group">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 transition-colors group-focus-within:text-primary" size={18} />
                                <input 
                                    type="email" 
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold text-white outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-700"
                                    placeholder="node@dentora.io"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">Encryption Key</label>
                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 transition-colors group-focus-within:text-primary" size={18} />
                                <input 
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-14 text-sm font-bold text-white outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-700"
                                    placeholder="••••••••••••"
                                    required
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full relative overflow-hidden group py-5 rounded-2xl bg-primary text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-primary/30 active:scale-95 transition-all disabled:opacity-50"
                        >
                            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                            <span className="flex items-center justify-center gap-3 relative z-10">
                                {loading ? 'Initializing...' : 'Decrypt & Enter'}
                                <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                            </span>
                        </button>
                    </form>

                    {/* Security Visualizer */}
                    <div className="mt-10 pt-8 border-t border-white/5">
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { label: 'Crypto', status: 'AES-256', icon: Zap },
                                { label: 'Network', status: 'VPN', icon: Globe },
                                { label: 'Node', status: 'Mainframe', icon: Database },
                            ].map((stat, i) => (
                                <div key={i} className="text-center p-3 rounded-xl bg-white/5 border border-white/5">
                                    <stat.icon size={12} className="text-primary mx-auto mb-2 opacity-60" />
                                    <p className="text-[8px] font-black text-slate-500 uppercase">{stat.label}</p>
                                    <p className="text-[10px] font-black text-slate-300">{stat.status}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Credits */}
                <div className="mt-8 text-center">
                    <p className="text-[10px] font-black tracking-[0.5em] text-slate-600 uppercase">Authorized Core Access Only</p>
                    <button 
                        onClick={() => window.location.href = '/'}
                        className="mt-4 text-[10px] font-bold text-primary/40 hover:text-primary transition-colors uppercase tracking-widest"
                    >
                        Back to Normal Hub
                    </button>
                </div>
            </motion.div>

            {/* Access Sequence Overlay */}
            <AnimatePresence>
                {accessStep > 0 && accessStep < 3 && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl"
                    >
                        <div className="w-64 h-2 bg-slate-900 rounded-full overflow-hidden mb-6 border border-white/10">
                            <motion.div 
                                initial={{ x: '-100%' }}
                                animate={{ x: '0%' }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="w-full h-full bg-primary shadow-[0_0_20px_#135bec]"
                            />
                        </div>
                        <p className="text-primary font-black uppercase tracking-[0.4em] text-xs animate-pulse">
                            {accessStep === 1 ? 'Handshaking Protocol...' : 'Authenticating Node...'}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                @keyframes scanline {
                    0% { top: -10%; }
                    100% { top: 110%; }
                }
                .animate-scanline {
                    animation: scanline 4s linear infinite;
                }
                .rotate-animation {
                    animation: rotate 20s linear infinite;
                }
                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

