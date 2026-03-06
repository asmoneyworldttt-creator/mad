import { useState, useEffect } from 'react';
import {
    UserCheck,
    Smartphone,
    Key,
    Calendar,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    User,
    Phone
} from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';

export function KioskMode({ theme }: { theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [step, setStep] = useState(1); // 1: Welcome, 2: Identify, 3: Confirm, 4: Success
    const [identifier, setIdentifier] = useState('');
    const [patient, setPatient] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleIdentify = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        // Search by phone or ID
        const { data } = await supabase
            .from('patients')
            .select('*')
            .or(`phone.eq.${identifier},id.eq.${identifier}`)
            .single();

        if (data) {
            setPatient(data);
            setStep(3);
        } else {
            showToast('Record not found. Please see the front desk.', 'error');
        }
        setIsProcessing(false);
    };

    const handleCheckIn = async () => {
        setIsProcessing(true);
        // Create an entry in a 'kiosk_checkins' table or update appointment status
        const { error } = await supabase.from('appointments')
            .update({ status: 'Arrived' })
            .eq('patient_id', patient.id)
            .eq('date', new Date().toISOString().split('T')[0]);

        if (!error) {
            setStep(4);
            setTimeout(() => {
                setStep(1);
                setIdentifier('');
                setPatient(null);
            }, 5000);
        } else {
            showToast('Unable to check in. Please visit the counter.', 'error');
        }
        setIsProcessing(false);
    };

    return (
        <div className={`min-h-[80vh] flex items-center justify-center p-10 rounded-[3rem] ${isDark ? 'bg-slate-950/50' : 'bg-slate-50'}`}>
            <div className={`w-full max-w-2xl p-12 rounded-[4rem] border shadow-2xl text-center transition-all duration-700 ${isDark ? 'bg-slate-900 border-white/5 shadow-primary/10' : 'bg-white border-slate-100 shadow-xl'}`}>

                {step === 1 && (
                    <div className="animate-fade-in flex flex-col items-center">
                        <div className="w-24 h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary mb-8 animate-pulse">
                            <UserCheck size={48} />
                        </div>
                        <h2 className="text-5xl font-sans font-bold mb-6 tracking-tight">Welcome to MedPro</h2>
                        <p className={`text-xl font-medium mb-12 max-w-md ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Avoid the queue. Check in for your appointment instantly.
                        </p>
                        <button onClick={() => setStep(2)} className="w-full py-6 bg-primary hover:bg-primary-hover text-white rounded-3xl text-xl font-bold shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3">
                            Tap to Start Check-In
                            <ArrowRight size={24} />
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-slide-up">
                        <h3 className="text-3xl font-bold mb-8">Identify Yourself</h3>
                        <form onSubmit={handleIdentify} className="space-y-6">
                            <div className="relative">
                                <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={24} />
                                <input
                                    autoFocus
                                    placeholder="Enter Phone Number or Patient ID"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className={`w-full rounded-3xl py-6 pl-16 pr-8 text-2xl font-bold outline-none border transition-all ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-primary' : 'bg-slate-50 border-slate-200 focus:border-primary'}`}
                                />
                            </div>
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setStep(1)} className={`flex-1 py-4 rounded-2xl font-bold ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>Back</button>
                                <button type="submit" disabled={isProcessing} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold shadow-lg hover:bg-primary-hover transition-all disabled:opacity-50">
                                    {isProcessing ? 'Searching...' : 'Continue'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {step === 3 && patient && (
                    <div className="animate-slide-up">
                        <div className="w-20 h-20 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                            {patient.name.charAt(0)}
                        </div>
                        <h3 className="text-3xl font-bold mb-2">Hello, {patient.name}!</h3>
                        <p className="text-slate-500 font-medium mb-10">Is this you? Please confirm to finalize check-in.</p>

                        <div className={`p-8 rounded-3xl border mb-10 text-left ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Scheduled Visit</span>
                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-xs font-bold border border-emerald-500/20 uppercase tracking-widest">Today</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <Calendar className="text-primary" />
                                <div>
                                    <p className="font-bold">Routine Checkup</p>
                                    <p className="text-xs text-slate-400 font-medium">10:30 AM • Consultation Room 2</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setStep(2)} className={`flex-1 py-4 rounded-2xl font-bold ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>Not Me</button>
                            <button onClick={handleCheckIn} disabled={isProcessing} className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg hover:bg-emerald-700 transition-all">
                                {isProcessing ? 'Checking in...' : 'Confirm Check-In'}
                            </button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="animate-zoom-in py-10">
                        <div className="w-24 h-24 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto mb-8">
                            <CheckCircle2 size={56} className="animate-bounce" />
                        </div>
                        <h2 className="text-4xl font-bold mb-4">Check-In Successful!</h2>
                        <p className="text-xl text-slate-500 font-medium max-w-sm mx-auto mb-10">
                            Please take a seat. Dr. K. Ramesh has been notified of your arrival.
                        </p>
                        <div className={`p-4 rounded-2xl border flex items-center justify-center gap-2 ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                            <AlertCircle size={18} className="text-primary" />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Estimated Wait Time: 12 Mins</p>
                        </div>
                    </div>
                )}

                <div className="mt-12 pt-8 border-t border-slate-100/10 flex justify-center items-center gap-10 opacity-30">
                    <div className="flex items-center gap-2"><Smartphone size={16} /><span className="text-[10px] font-bold uppercase tracking-widest">Mobile Sync</span></div>
                    <div className="flex items-center gap-2"><Key size={16} /><span className="text-[10px] font-bold uppercase tracking-widest">Secure ID</span></div>
                </div>
            </div>
        </div>
    );
}
