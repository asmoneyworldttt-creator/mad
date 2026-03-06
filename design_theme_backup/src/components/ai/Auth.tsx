import React, { useState } from 'react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';
import {
    Lock, Mail, User, ShieldCheck,
    ArrowRight, Github, Chrome, Activity,
    Eye, EyeOff, KeyRound, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Auth({ onAuthSuccess, theme }: { onAuthSuccess: () => void; theme?: 'light' | 'dark' }) {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { showToast } = useToast();
    const isDark = theme === 'dark';

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        role: 'patient' as 'admin' | 'staff' | 'doctor' | 'patient'
    });

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
                showToast('Welcome back to DentiSphere', 'success');
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
                showToast('Clinical node created. Please verify email.', 'success');
            }
            onAuthSuccess();
        } catch (error: any) {
            showToast(error.message || 'Authentication sequence failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center p-6 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
            {/* Background Grid/Mesh */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#3b82f6,transparent_50%)]" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`w-full max-w-5xl rounded-[3rem] border flex flex-col lg:flex-row overflow-hidden shadow-2xl ${isDark ? 'bg-slate-900/50 border-white/5 backdrop-blur-3xl' : 'bg-white border-slate-200'}`}
            >
                {/* Visual Side */}
                <div className={`hidden lg:flex w-1/2 p-16 flex-col justify-between relative overflow-hidden ${isDark ? 'bg-slate-900 border-r border-white/5' : 'bg-primary'}`}>
                    <div className="absolute inset-0 opacity-10 blur-3xl bg-[radial-gradient(circle_at_50%_0%,#3b82f6,transparent_70%)]" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-12">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 p-1">
                                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                            </div>
                            <h1 className="text-3xl font-display font-bold text-white tracking-tight">DentiSphere</h1>
                        </div>

                        <h2 className="text-5xl font-bold text-white leading-[1.1] mb-8">
                            Empowering <span className="text-primary-light">Clinical</span> Precision.
                        </h2>

                        <div className="space-y-6">
                            {[
                                { icon: Activity, text: "Real-time vitals & patient monitoring" },
                                { icon: ShieldCheck, text: "End-to-end encrypted medical records" },
                                { icon: KeyRound, text: "Role-based clinical workspace access" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 text-white/70">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
                                        <item.icon size={16} className="text-white" />
                                    </div>
                                    <span className="text-sm font-medium">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative z-10 pt-12 border-t border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-3">
                                {[1, 2, 3].map(i => (
                                    <img
                                        key={i}
                                        src={`https://i.pravatar.cc/100?u=${i}`}
                                        className="w-8 h-8 rounded-full border-2 border-slate-900"
                                        alt="Avatar"
                                    />
                                ))}
                            </div>
                            <p className="text-xs font-bold text-white/50 tracking-widest uppercase">Trusted by 2k+ clinicians</p>
                        </div>
                    </div>
                </div>

                {/* Form Side */}
                <div className={`w-full lg:w-1/2 p-10 lg:p-20 ${isDark ? 'bg-slate-900/10' : 'bg-white'}`}>
                    <div className="max-w-md mx-auto">
                        <div className="mb-12">
                            <h3 className="text-3xl font-bold mb-3">{isLogin ? 'Access Core' : 'Initialize Node'}</h3>
                            <p className="text-slate-500 font-medium">{isLogin ? 'Securely connect to your clinical dashboard.' : 'Deploy your profile to the DentiSphere network.'}</p>
                        </div>

                        <form onSubmit={handleAuth} className="space-y-6">
                            <AnimatePresence mode="wait">
                                {!isLogin && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-6"
                                    >
                                        <div>
                                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2 block">Full Clinical Name</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.fullName}
                                                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                                    className={`w-full py-4 pl-12 pr-4 rounded-2xl border outline-none transition-all ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-primary' : 'bg-slate-50 border-slate-200 focus:border-primary'}`}
                                                    placeholder="e.g. Dr. Sarah Jenkins"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2 block">Assigned Protocol / Role</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {(['doctor', 'patient'] as const).map(r => (
                                                    <button
                                                        key={r}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, role: r })}
                                                        className={`py-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${formData.role === r ? 'bg-primary border-primary text-white shadow-lg' : isDark ? 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'}`}
                                                    >
                                                        {formData.role === r && <CheckCircle2 size={12} />}
                                                        {r.toUpperCase()}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div>
                                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2 block">Secure Email Node</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className={`w-full py-4 pl-12 pr-4 rounded-2xl border outline-none transition-all ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-primary' : 'bg-slate-50 border-slate-200 focus:border-primary'}`}
                                        placeholder="clinician@dentisphere.pro"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2 block">Encryption Key / Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className={`w-full py-4 pl-12 pr-12 rounded-2xl border outline-none transition-all ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-primary' : 'bg-slate-50 border-slate-200 focus:border-primary'}`}
                                        placeholder="••••••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-5 rounded-2xl bg-primary text-white font-bold text-sm shadow-xl shadow-primary/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] hover:bg-primary-hover'}`}
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        {isLogin ? 'Establish Connection' : 'Register Protocol'}
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 flex flex-col items-center gap-6">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">or continue with enterprise ID</p>
                            <div className="flex gap-4 w-full">
                                <button className={`flex-1 py-4 rounded-2xl border flex items-center justify-center gap-2 transition-all ${isDark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                    <Chrome size={18} />
                                    <span className="text-xs font-bold">Google Workspace</span>
                                </button>
                                <button className={`flex-1 py-4 rounded-2xl border flex items-center justify-center gap-2 transition-all ${isDark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                    <Github size={18} />
                                    <span className="text-xs font-bold">Azure SSO</span>
                                </button>
                            </div>

                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-sm font-bold text-primary hover:underline transition-all"
                            >
                                {isLogin ? "Need a new clinical node? Register here" : "Return to connection terminal"}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
