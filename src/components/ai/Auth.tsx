import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';
import {
    Lock, Mail, User, ArrowRight,
    Eye, EyeOff, CheckCircle2,
    Activity, Heart, ShieldCheck, Sparkles, Stethoscope
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type SignUpRole = 'staff' | 'patient';

export function Auth({ onAuthSuccess, theme }: { onAuthSuccess: () => void; theme?: 'light' | 'dark' }) {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { showToast } = useToast();
    const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        role: 'patient' as SignUpRole
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

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password,
                });
                if (error) throw error;
                showToast('Welcome back to Dentora!', 'success');
            } else {
                const { error } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            full_name: formData.fullName,
                            role: formData.role
                        }
                    }
                });
                if (error) throw error;
                showToast('Account created! Please check your email to verify.', 'success');
            }
            onAuthSuccess();
        } catch (error: any) {
            showToast(error.message || 'Something went wrong. Try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const roleOptions: { value: SignUpRole; label: string; desc: string; icon: any }[] = [
        { value: 'staff', label: 'Clinic Staff', desc: 'Doctors & employees', icon: Stethoscope },
        { value: 'patient', label: 'Patient', desc: 'Personal health portal', icon: Heart },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#020818' }}>
            {/* Animated aurora blobs */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(19,91,236,0.18) 0%, transparent 50%)`,
                    transition: 'background 0.3s ease',
                }}
            />
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full pointer-events-none animate-aurora-1"
                style={{ background: 'radial-gradient(circle, rgba(19,91,236,0.25) 0%, transparent 70%)', filter: 'blur(60px)' }} />
            <div className="absolute bottom-[-20%] right-[-10%] w-[55%] h-[55%] rounded-full pointer-events-none animate-aurora-2"
                style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)', filter: 'blur(80px)' }} />
            <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] rounded-full pointer-events-none animate-aurora-3"
                style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }} />

            {/* Floating orbs */}
            {[...Array(8)].map((_, i) => (
                <div key={i}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                        width: `${6 + (i % 3) * 4}px`,
                        height: `${6 + (i % 3) * 4}px`,
                        left: `${10 + i * 11}%`,
                        top: `${15 + (i % 5) * 15}%`,
                        background: i % 2 === 0 ? 'rgba(19,91,236,0.5)' : 'rgba(16,185,129,0.4)',
                        boxShadow: i % 2 === 0 ? '0 0 12px rgba(19,91,236,0.8)' : '0 0 12px rgba(16,185,129,0.7)',
                        animation: `float-orb ${4 + i * 0.7}s ease-in-out infinite`,
                        animationDelay: `${i * 0.5}s`,
                    }}
                />
            ))}

            {/* Grid overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                }} />

            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-5xl mx-4 flex flex-col lg:flex-row overflow-hidden relative z-10"
                style={{
                    borderRadius: '2.5rem',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(19,91,236,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
                    background: 'rgba(7,12,28,0.85)',
                    backdropFilter: 'blur(40px)',
                }}
            >
                {/* Left Visual Panel */}
                <div className="hidden lg:flex w-[46%] flex-col justify-between p-14 relative overflow-hidden"
                    style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                    {/* Inner glow */}
                    <div className="absolute inset-0 pointer-events-none"
                        style={{ background: 'radial-gradient(ellipse at 30% 40%, rgba(19,91,236,0.15) 0%, transparent 65%)' }} />

                    {/* Logo */}
                    <div className="relative z-10">
                        <div className="flex items-center gap-3.5 mb-14">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                style={{
                                    background: 'linear-gradient(135deg, #135bec, #0d9488)',
                                    boxShadow: '0 8px 24px rgba(19,91,236,0.5)',
                                }}>
                                <Activity className="text-white" size={22} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white tracking-tight">Dentora</h1>
                                <p className="text-[10px] text-white/40 font-semibold tracking-widest uppercase">Dental Management</p>
                            </div>
                        </div>

                        <div className="mb-10">
                            <p className="text-[11px] font-bold tracking-[0.3em] uppercase mb-4"
                                style={{ color: 'rgba(19,91,236,0.9)' }}>Smart Dental Platform</p>
                            <h2 className="text-4xl font-black text-white leading-[1.15] tracking-tight">
                                Better Care.<br />
                                <span style={{
                                    background: 'linear-gradient(90deg, #135bec, #10b981)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}>Smarter Tools.</span>
                            </h2>
                        </div>

                        <div className="space-y-5">
                            {[
                                { icon: Activity, text: 'Appointments & patient records', color: '#135bec' },
                                { icon: ShieldCheck, text: 'Safe & secure health data', color: '#10b981' },
                                { icon: Heart, text: 'Built for clinics of all sizes', color: '#8b5cf6' },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + i * 0.1 }}
                                    className="flex items-center gap-4"
                                >
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: `${item.color}20`, border: `1px solid ${item.color}30` }}>
                                        <item.icon size={16} style={{ color: item.color }} />
                                    </div>
                                    <span className="text-sm font-semibold text-white/70">{item.text}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="relative z-10 pt-10" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-2">
                                {[34, 45, 67, 89].map(i => (
                                    <img key={i} src={`https://i.pravatar.cc/80?u=${i}`}
                                        className="w-8 h-8 rounded-full border-2 shadow-sm"
                                        style={{ borderColor: '#070c1c' }} alt="User" />
                                ))}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white/60">Trusted by 5,000+ patients</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Sparkles key={i} size={8} style={{ color: '#f59e0b' }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Form Panel */}
                <div className="flex-1 p-10 lg:p-14 flex flex-col justify-center">
                    {/* Mobile logo */}
                    <div className="flex lg:hidden items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #135bec, #0d9488)' }}>
                            <Activity className="text-white" size={18} />
                        </div>
                        <h1 className="text-lg font-bold text-white">Dentora</h1>
                    </div>

                    {/* Tab switcher */}
                    <div className="flex items-center gap-2 mb-10 p-1.5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        {['Sign In', 'Create Account'].map((tab, i) => (
                            <button key={tab} type="button"
                                onClick={() => setIsLogin(i === 0)}
                                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300"
                                style={{
                                    background: (i === 0 && isLogin) || (i === 1 && !isLogin)
                                        ? 'linear-gradient(135deg, #135bec, #0d4bcc)'
                                        : 'transparent',
                                    color: (i === 0 && isLogin) || (i === 1 && !isLogin)
                                        ? 'white'
                                        : 'rgba(255,255,255,0.4)',
                                    boxShadow: (i === 0 && isLogin) || (i === 1 && !isLogin)
                                        ? '0 4px 16px rgba(19,91,236,0.4)'
                                        : 'none',
                                }}>
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="mb-8">
                        <h3 className="text-2xl font-black text-white tracking-tight">
                            {isLogin ? 'Welcome back' : 'Get started'}
                        </h3>
                        <p className="text-sm text-white/40 font-medium mt-1">
                            {isLogin ? 'Sign in to your account below' : 'Create your free account now'}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-4">
                        <AnimatePresence mode="wait">
                            {!isLogin && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-4 overflow-hidden"
                                >
                                    {/* Full Name */}
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2" size={17} style={{ color: 'rgba(255,255,255,0.25)' }} />
                                        <input
                                            type="text" required
                                            value={formData.fullName}
                                            onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                            className="auth-input w-full py-4 pl-12 pr-4 outline-none font-semibold text-sm"
                                            placeholder="Full Name"
                                        />
                                    </div>

                                    {/* Role Selector */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {roleOptions.map(r => (
                                            <button key={r.value} type="button"
                                                onClick={() => setFormData({ ...formData, role: r.value })}
                                                className="p-4 rounded-2xl text-left transition-all duration-200 relative overflow-hidden"
                                                style={{
                                                    background: formData.role === r.value
                                                        ? 'rgba(19,91,236,0.2)'
                                                        : 'rgba(255,255,255,0.04)',
                                                    border: formData.role === r.value
                                                        ? '1px solid rgba(19,91,236,0.6)'
                                                        : '1px solid rgba(255,255,255,0.08)',
                                                    boxShadow: formData.role === r.value
                                                        ? '0 0 20px rgba(19,91,236,0.15)'
                                                        : 'none',
                                                }}>
                                                {formData.role === r.value && (
                                                    <div className="absolute top-2.5 right-2.5">
                                                        <CheckCircle2 size={14} style={{ color: '#135bec' }} />
                                                    </div>
                                                )}
                                                <r.icon size={18} className="mb-2"
                                                    style={{ color: formData.role === r.value ? '#135bec' : 'rgba(255,255,255,0.35)' }} />
                                                <p className="text-xs font-bold"
                                                    style={{ color: formData.role === r.value ? 'white' : 'rgba(255,255,255,0.5)' }}>
                                                    {r.label}
                                                </p>
                                                <p className="text-[11px] mt-0.5"
                                                    style={{ color: 'rgba(255,255,255,0.3)' }}>{r.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Email */}
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2" size={17} style={{ color: 'rgba(255,255,255,0.25)' }} />
                            <input
                                type="email" required
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="auth-input w-full py-4 pl-12 pr-4 outline-none font-semibold text-sm"
                                placeholder="Email Address"
                            />
                        </div>

                        {/* Password */}
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2" size={17} style={{ color: 'rgba(255,255,255,0.25)' }} />
                            <input
                                type={showPassword ? 'text' : 'password'} required
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="auth-input w-full py-4 pl-12 pr-12 outline-none font-semibold text-sm"
                                placeholder="Password"
                            />
                            <button type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                                style={{ color: 'rgba(255,255,255,0.3)' }}>
                                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                            </button>
                        </div>

                        {isLogin && (
                            <div className="text-right">
                                <button type="button" className="text-xs font-semibold transition-colors"
                                    style={{ color: 'rgba(19,91,236,0.8)' }}>
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-4 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-3 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{
                                background: 'linear-gradient(135deg, #135bec 0%, #0d46c7 100%)',
                                boxShadow: '0 8px 28px rgba(19,91,236,0.45), inset 0 1px 0 rgba(255,255,255,0.15)',
                            }}>
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {isLogin ? 'Sign In' : 'Create Account'}
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-8 pt-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            {isLogin ? "Don't have an account? " : 'Already have an account? '}
                            <button onClick={() => setIsLogin(!isLogin)} className="font-bold transition-colors"
                                style={{ color: '#135bec' }}>
                                {isLogin ? 'Create one' : 'Sign in'}
                            </button>
                        </p>
                        <p className="text-[11px] mt-4 font-medium" style={{ color: 'rgba(255,255,255,0.15)' }}>
                            Dentora — Dental Practice Management System
                        </p>
                    </div>
                </div>
            </motion.div>

            <style>{`
                .auth-input {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 1rem;
                    color: white;
                    transition: all 0.2s;
                }
                .auth-input::placeholder { color: rgba(255,255,255,0.25); }
                .auth-input:focus {
                    background: rgba(255,255,255,0.08);
                    border-color: rgba(19,91,236,0.6);
                    box-shadow: 0 0 0 3px rgba(19,91,236,0.12);
                }
                @keyframes aurora-1 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(5%, 3%) scale(1.05); }
                    66% { transform: translate(-3%, 5%) scale(0.95); }
                }
                @keyframes aurora-2 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(-4%, -3%) scale(1.08); }
                    66% { transform: translate(3%, -5%) scale(0.95); }
                }
                @keyframes aurora-3 {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(-5%, 5%); }
                }
                @keyframes float-orb {
                    0%, 100% { transform: translateY(0px); opacity: 0.6; }
                    50% { transform: translateY(-20px); opacity: 1; }
                }
                .animate-aurora-1 { animation: aurora-1 12s ease-in-out infinite; }
                .animate-aurora-2 { animation: aurora-2 15s ease-in-out infinite; }
                .animate-aurora-3 { animation: aurora-3 10s ease-in-out infinite; }
            `}</style>
        </div>
    );
}
