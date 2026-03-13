import React, { useState } from 'react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';
import { 
    ShieldAlert, Lock, ArrowRight, 
    CreditCard, Clock, CheckCircle2,
    RefreshCw, LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';

export function LockOutScreen({ theme, clinicName, onLogout }: { 
    theme?: 'light' | 'dark', 
    clinicName: string,
    onLogout: () => void 
}) {
    const isDark = theme === 'dark';
    const { showToast } = useToast();
    const [requesting, setRequesting] = useState(false);

    const handleRenewalRequest = async (packageType: 'Monthly' | 'Yearly') => {
        setRequesting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: clinic } = await supabase
                .from('clinics')
                .select('id')
                .eq('owner_id', user?.id)
                .single();

            if (!clinic) throw new Error('Clinic signature not found.');

            const { error } = await supabase.from('purchase_requests').insert({
                clinic_id: clinic.id,
                package_type: packageType,
                status: 'pending'
            });

            if (error) throw error;
            showToast(`Reactivation request for ${packageType} plan sent to Master Panel.`, 'success');
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setRequesting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden font-sans" style={{ background: isDark ? '#010409' : '#f8fafc' }}>
            {/* Background elements */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.05]" 
                style={{ 
                    backgroundImage: `linear-gradient(rgba(239,68,68,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.3) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                }} 
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-[500px] mx-4 relative z-10"
            >
                <div className="text-center mb-10">
                    <div className="w-24 h-24 rounded-[2rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6 shadow-2xl">
                        <ShieldAlert className="text-red-500 animate-pulse" size={48} />
                    </div>
                    <h1 className={`text-3xl font-black tracking-tighter mb-2 italic ${isDark ? 'text-white' : 'text-slate-900'}`}>Account Suspended</h1>
                    <p className="text-red-500 font-bold uppercase tracking-[0.3em] text-[10px]">Your Account is Deactivated.</p>
                </div>

                <div className={`p-10 rounded-[3rem] border shadow-2xl relative overflow-hidden ${isDark ? 'bg-slate-900/50 border-white/5' : 'bg-white border-slate-200'}`}>
                    <p className={`text-sm font-medium mb-8 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Access to <span className="font-bold text-primary italic">{clinicName}</span> has been restricted due to package expiration or administrative override.
                    </p>

                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center mb-6">Select Reactivation Protocol</p>
                        
                        <div className="grid grid-cols-1 gap-4">
                            <button 
                                onClick={() => handleRenewalRequest('Monthly')}
                                disabled={requesting}
                                className={`group p-6 rounded-2xl border flex items-center justify-between transition-all hover:scale-[1.02] ${isDark ? 'bg-white/5 border-white/10 hover:border-primary/50' : 'bg-slate-50 border-slate-200 hover:border-primary/30'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                        <Clock size={24} />
                                    </div>
                                    <div className="text-left">
                                        <p className={`font-black uppercase tracking-widest text-[10px] ${isDark ? 'text-white' : 'text-slate-900'}`}>Standard Sync</p>
                                        <p className="text-xs text-slate-500 font-bold">Monthly Renewal</p>
                                    </div>
                                </div>
                                <ArrowRight className="text-slate-600 group-hover:text-primary transition-colors" size={20} />
                            </button>

                            <button 
                                onClick={() => handleRenewalRequest('Yearly')}
                                disabled={requesting}
                                className={`group p-6 rounded-2xl border flex items-center justify-between transition-all hover:scale-[1.02] ${isDark ? 'bg-white/5 border-white/10 hover:border-emerald-500/50' : 'bg-slate-50 border-slate-200 hover:border-emerald-500/30'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                        <CreditCard size={24} />
                                    </div>
                                    <div className="text-left">
                                        <p className={`font-black uppercase tracking-widest text-[10px] ${isDark ? 'text-white' : 'text-slate-900'}`}>Infinite Node</p>
                                        <p className="text-xs text-slate-500 font-bold">Yearly Renewal (Value)</p>
                                    </div>
                                </div>
                                <ArrowRight className="text-slate-600 group-hover:text-emerald-500 transition-colors" size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                        <button 
                            onClick={() => window.location.reload()}
                            className="text-[10px] font-black text-slate-500 hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-2"
                        >
                            <RefreshCw size={12} /> Sync Status
                        </button>
                        <button 
                            onClick={onLogout}
                            className="text-[10px] font-black text-slate-500 hover:text-red-500 transition-colors uppercase tracking-widest flex items-center gap-2"
                        >
                            <LogOut size={12} /> Emergency Exit
                        </button>
                    </div>
                </div>

                <p className="mt-8 text-center text-[10px] font-black tracking-[0.3em] text-slate-600 uppercase">
                    Master Panel Approval Required for Reactivation
                </p>
            </motion.div>
        </div>
    );
}
