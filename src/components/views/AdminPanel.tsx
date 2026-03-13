import { useState, useEffect } from 'react';
import {
    Clock, Calendar, Star, TrendingUp,
    ArrowRight, Activity, CheckCircle2,
    ClipboardList, Target, User, Search, Brain, Video, ShieldCheck, type LucideIcon
} from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';
import { PredictiveScoreBadge } from '../ai/PredictiveScoreBadge';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell
} from 'recharts';

interface AdminPanelProps {
    theme?: 'light' | 'dark';
    setActiveTab?: (tab: string) => void;
}

export function AdminPanel({ theme, setActiveTab }: AdminPanelProps) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [appointments, setAppointments] = useState<any[]>([]);
    const [stats, setStats] = useState({
        todayCount: 0,
        completedToday: 0,
        avgSatisfaction: 0,
        monthlyEarnings: 0
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [isAIOpen, setIsAIOpen] = useState(false);
    const [subscription, setSubscription] = useState<any>(null);
    const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
    const [isRequesting, setIsRequesting] = useState(false);

    useEffect(() => {
        const syncSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                fetchClinicSubscription(session.user);
                fetchDoctorData(session.user);
                fetchStats();
            }
        };
        syncSession();
    }, []);

    const fetchClinicSubscription = async (user: any) => {
        try {
            const { data: clinic } = await supabase
                .from('clinics')
                .select('id, name')
                .eq('owner_id', user.id)
                .single();

            if (clinic) {
                const { data: sub } = await supabase
                    .from('subscriptions')
                    .select('*')
                    .eq('clinic_id', clinic.id)
                    .single();

                if (sub) {
                    setSubscription(sub);
                    if (sub.validity_end) {
                        const end = new Date(sub.validity_end);
                        const diff = end.getTime() - new Date().getTime();
                        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                        setDaysRemaining(days);
                    }
                }
            }
        } catch (error) {
            console.error('Subscription sync error:', error);
        }
    };

    const handleSendPurchaseRequest = async (packageType: 'Monthly' | 'Yearly') => {
        setIsRequesting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: clinic } = await supabase
                .from('clinics')
                .select('id')
                .eq('owner_id', user?.id)
                .single();

            if (!clinic) throw new Error('Clinic not found');

            const { error } = await supabase.from('purchase_requests').insert({
                clinic_id: clinic.id,
                package_type: packageType,
                status: 'pending'
            });

            if (error) throw error;
            showToast(`Purchase request for ${packageType} plan sent to admin.`, 'success');
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setIsRequesting(false);
        }
    };

    const fetchDoctorData = async (user: any) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const doctorName = user.user_metadata?.full_name || 'Dr. Jenkins';

            const { data: apts } = await supabase
                .from('appointments')
                .select('*')
                .eq('date', today)
                .or(`doctor_name.ilike.%${doctorName}%,doctor_id.eq.${user.id}`)
                .order('time', { ascending: true });

            if (apts) {
                setAppointments(apts);
                setStats(prev => ({
                    ...prev,
                    todayCount: apts.length,
                    completedToday: apts.filter(a => a.status === 'Completed' || a.status === 'Visited').length
                }));
            }
        } catch (error) {
            showToast('Failed to synchronize daily worklist', 'error');
        }
    };

    const fetchStats = async () => {
        try {
            const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
            const today = new Date().toISOString().split('T')[0];

            // Monthly earnings from bills
            const { data: bills } = await supabase
                .from('bills')
                .select('amount')
                .gte('date', startOfMonth)
                .lte('date', today);
            const totalEarnings = bills?.reduce((acc, b) => acc + (Number(b.amount) || 0), 0) || 0;

            setStats(prev => ({ ...prev, monthlyEarnings: totalEarnings }));
        } catch (_) {
            // Silently fail — stats will show 0
        }
    };

    const filteredAppointments = appointments.filter(apt => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            apt.patient_name?.toLowerCase().includes(q) ||
            apt.type?.toLowerCase().includes(q) ||
            apt.status?.toLowerCase().includes(q)
        );
    });

    const handleOpenAI = () => {
        // Trigger global AI assistant via custom event
        window.dispatchEvent(new CustomEvent('dentora:open-ai'));
        showToast('AI Diagnostic Engine activated', 'success');
    };

    const handleOpenTeleDentistry = () => {
        if (setActiveTab) setActiveTab('teledentistry');
    };

    const handleOpenPatient = (apt: any) => {
        if (setActiveTab) setActiveTab('patients');
    };

    const GlassIcon = ({ icon: Icon, color }: { icon: any, color: string }) => (
        <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden",
            isDark ? "bg-white/10 backdrop-blur-md border border-white/20 shadow-lg" : "bg-slate-50 border border-slate-200 shadow-sm"
        )}>
            <div className={cn("absolute inset-0 opacity-10 bg-current", color)} />
            <Icon className={cn("relative z-10", color)} size={24} />
        </div>
    );

    const StatusBadge = ({ status }: { status: string }) => {
        const styles: Record<string, string> = {
            'Scheduled': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            'Visited': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            'Completed': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            'Waiting': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
            'Cancelled': 'bg-rose-500/10 text-rose-500 border-rose-500/20'
        };
        return (
            <span className={cn(
                "px-4 py-1.5 rounded-xl text-xs font-semibold border",
                styles[status] || styles['Scheduled']
            )}>
                {status}
            </span>
        );
    };

    return (
        <div className="animate-slide-up space-y-8 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className={`text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        <Activity className="text-primary" size={24} />
                        Clinic Overview
                    </h2>
                    <p className="text-[10px] md:text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Manage daily clinic activities
                    </p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search patient..."
                            className={`w-full pl-12 pr-6 py-3 rounded-xl text-sm font-medium outline-none transition-all border`}
                            style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                        />
                    </div>
                </div>
            </header>

            {/* Bento Grid Layout */}
            <div className="bento-grid">
                {/* Live Queue (Large) */}
                <div className={cn("bento-card bento-grid-item-large p-5 md:p-6 flex flex-col", isDark ? "" : "bg-white border-slate-100 shadow-sm")}>
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className={`text-base md:text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                <Clock className="text-primary" size={20} />
                                Today's Queue
                            </h3>
                            <p className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>Live clinic activity</p>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span className="text-[9px] font-bold text-amber-600">
                                {filteredAppointments.filter(a => a.status === 'Waiting').length} High priority
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 space-y-2.5 overflow-y-auto custom-scrollbar pr-1">
                        {filteredAppointments.length > 0 ? filteredAppointments.map((apt, i) => (
                            <div key={i} className={cn("p-3 md:p-4 rounded-xl border hover:border-primary/30 group cursor-pointer transition-all", isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200 hover:bg-white")} onClick={() => handleOpenPatient(apt)}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg shadow-md shadow-primary/20 relative overflow-hidden group-hover:scale-105 transition-transform">
                                            {apt.patient_name?.charAt(0) || 'P'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h5 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>{apt.patient_name}</h5>
                                                <PredictiveScoreBadge patientId={apt.patient_id} />
                                            </div>
                                            <div className={`flex items-center gap-3 text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                <span className="flex items-center gap-1"><ClipboardList size={12} className="text-primary" /> {apt.type}</span>
                                                <span className="flex items-center gap-1"><Clock size={12} className="text-slate-400" /> {apt.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <StatusBadge status={apt.status} />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleOpenPatient(apt); }}
                                            className={`p-3 rounded-xl transition-all hover:bg-primary hover:text-white ${isDark ? 'bg-white/5 text-primary' : 'bg-white text-primary border border-slate-100'}`}
                                        >
                                            <ArrowRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                                <ClipboardList size={64} className="mb-4 text-slate-300" />
                                <p className="font-medium text-sm" style={{ color: 'var(--text-muted)' }}>
                                    {searchQuery ? 'No results found' : 'No clinical sessions active'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Monthly Earnings */}
                <div className={cn("bento-card p-6 flex flex-col justify-between", isDark ? "" : "bg-white border-slate-100 shadow-sm")}>
                    <GlassIcon icon={TrendingUp} color="text-amber-500" />
                    <div>
                        <p className="text-[10px] font-bold mb-0.5" style={{ color: 'var(--text-muted)' }}>Gross Revenue</p>
                        <h3 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            ₹{stats.monthlyEarnings > 0 ? (stats.monthlyEarnings / 1000).toFixed(1) + 'k' : '—'}
                        </h3>
                    </div>
                </div>

                {/* Efficiency Goal */}
                <div className="bento-card p-6 flex flex-col justify-between bg-emerald-500 text-white border-none">
                    <div className="flex justify-between items-center relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center">
                            <CheckCircle2 size={20} />
                        </div>
                    </div>
                    <div className="relative z-10 mt-4">
                        <p className="text-xs font-semibold opacity-80 mb-0.5">Today's Goal</p>
                        <h3 className="text-2xl font-bold tracking-tight">
                            {Math.round((stats.completedToday / (stats.todayCount || 1)) * 100)}%
                        </h3>
                        <div className="w-full h-1 bg-white/20 rounded-full mt-3 overflow-hidden">
                            <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${(stats.completedToday / (stats.todayCount || 1)) * 100}%` }} />
                        </div>
                    </div>
                </div>

                {/* Today's Patients */}
                <div className={cn("bento-card p-6 flex flex-col justify-between", isDark ? "" : "bg-white border-slate-100 shadow-sm")}>
                    <GlassIcon icon={Star} color="text-primary" />
                    <div>
                        <p className="text-[10px] font-bold mb-0.5" style={{ color: 'var(--text-muted)' }}>Daily Count</p>
                        <h3 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.todayCount}</h3>
                    </div>
                </div>

                {/* AI Assistant */}
                <div className={cn("bento-card bento-grid-item-wide p-6 flex items-center justify-between border-l-4 border-l-primary", isDark ? "" : "bg-white border-slate-100 shadow-sm")}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary relative">
                            <Brain size={24} className="relative z-10" />
                        </div>
                        <div>
                            <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>AI Ready</h4>
                            <p className="text-[10px] font-medium opacity-60" style={{ color: 'var(--text-muted)' }}>Clinical support enabled</p>
                        </div>
                    </div>
                    <button
                        onClick={handleOpenAI}
                    className="px-6 py-3 rounded-2xl bg-primary text-white font-semibold text-sm shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        Launch Engine
                    </button>
                </div>

                {/* Subscription Node — Real Validity */}
                <div className={cn("bento-card p-8 flex flex-col justify-between relative overflow-hidden", isDark ? "bg-slate-900/40 border-white/5" : "bg-white border-slate-100 shadow-sm")}>
                    <div className="flex justify-between items-start relative z-10">
                        <GlassIcon icon={ShieldCheck} color="text-primary" />
                        {daysRemaining !== null && (
                            <span className={cn(
                                "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest",
                                daysRemaining > 10 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500 animate-pulse"
                            )}>
                                {daysRemaining} Days Left
                            </span>
                        )}
                    </div>
                    <div className="relative z-10">
                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Package Node</p>
                        <h3 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            {subscription?.package_type || 'Unsubscribed'}
                        </h3>
                        {subscription?.status === 'deactivated' && (
                            <p className="text-[10px] text-red-500 font-bold mt-1 animate-bounce">System Locked: Renewal Required</p>
                        )}
                        <div className="flex gap-2 mt-4">
                            <button 
                                onClick={() => handleSendPurchaseRequest('Monthly')}
                                disabled={isRequesting}
                                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isRequesting ? 'Syncing...' : 'Monthly'}
                            </button>
                            <button 
                                onClick={() => handleSendPurchaseRequest('Yearly')}
                                disabled={isRequesting}
                                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 ${isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-600'}`}
                            >
                                Yearly
                            </button>
                        </div>
                    </div>
                </div>

                {/* TeleDentistry — Wired */}
                <div className={cn("bento-card p-8 flex flex-col justify-center items-center text-center space-y-4 cursor-pointer group", isDark ? "" : "bg-white border-slate-100 shadow-sm")} onClick={handleOpenTeleDentistry}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all group-hover:scale-110 ${isDark ? 'bg-white/10' : 'bg-slate-50'}`}>
                        <Video className="text-primary" size={28} />
                    </div>
                    <div>
                        <h5 className={`font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>Video Consultation</h5>
                        <p className="text-xs font-medium text-slate-400">Start a video call with patient</p>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(19, 91, 236, 0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(19, 91, 236, 0.3); }
            `}</style>
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
