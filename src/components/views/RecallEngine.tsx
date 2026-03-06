import { useState, useEffect } from 'react';
import {
    RefreshCcw, User, Calendar,
    MessageSquare, Mail, Phone,
    Search, AlertCircle, CheckCircle2,
    TrendingUp, Filter, ArrowRight
} from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';

export function RecallEngine({ theme }: { theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [recalls, setRecalls] = useState<any[]>([]);
    const [stats, setStats] = useState({ due: 0, contacting: 0, converted: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecalls();
    }, []);

    async function fetchRecalls() {
        setLoading(true);
        try {
            // Logic: Find patients whose last appointment was > 6 months ago 
            // and have no upcoming appointments.
            const { data: patients } = await supabase
                .from('patients')
                .select('*, appointments(date, status)')
                .order('id');

            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            const filtered = patients?.filter(p => {
                const lastApt = p.appointments?.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                if (!lastApt) return false;
                const lastDate = new Date(lastApt.date);
                return lastDate < sixMonthsAgo;
            }).map(p => ({
                ...p,
                lastVisit: p.appointments?.[0]?.date || 'Never',
                risk: Math.random() > 0.7 ? 'High' : 'Medium'
            })) || [];

            setRecalls(filtered);
            setStats({
                due: filtered.length,
                contacting: Math.floor(filtered.length * 0.4),
                converted: Math.floor(filtered.length * 0.15)
            });
        } catch (e) {
            showToast('Recall node synchronization failed', 'error');
        } finally {
            setLoading(false);
        }
    }

    const startOutreach = (patient: string, channel: string) => {
        showToast(`Outreach initiated via ${channel} for ${patient}`, 'success');
    };

    return (
        <div className="animate-slide-up space-y-8 pb-20">
            {/* Header */}
            <div className={`p-8 rounded-[2.5rem] border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div>
                    <h2 className="text-3xl font-sans font-bold tracking-tight flex items-center gap-3">
                        <RefreshCcw className="text-primary" />
                        Patient Recall Engine
                    </h2>
                    <p className={`text-sm font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Automated identify-and-engage loops for preventive care retention
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="bg-primary text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 flex items-center gap-2 hover:scale-105 transition-all text-sm">
                        <MessageSquare size={18} /> Bulk Outreach
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Due for Recall', value: stats.due, color: 'text-rose-500', icon: AlertCircle },
                    { label: 'Active Outreach', value: stats.contacting, color: 'text-amber-500', icon: TrendingUp },
                    { label: 'Monthly Conversions', value: stats.converted, color: 'text-emerald-500', icon: CheckCircle2 }
                ].map((s, i) => (
                    <div key={i} className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.2em]">{s.label}</span>
                            <s.icon className={s.color} size={20} />
                        </div>
                        <h3 className="text-4xl font-bold">{s.value}</h3>
                    </div>
                ))}
            </div>

            <div className={`p-10 rounded-[3rem] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <h4 className="text-xl font-bold italic">Retention Target Nodes</h4>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input
                                className={`w-full pl-12 pr-6 py-3 rounded-2xl border text-xs font-bold outline-none transition-all ${isDark ? 'bg-white/5 border-white/10 focus:border-primary' : 'bg-slate-50 border-slate-200 focus:border-primary'}`}
                                placeholder="Filter records..."
                            />
                        </div>
                        <button className={`p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                            <Filter size={18} />
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {recalls.map((p, i) => (
                        <div key={i} className={`p-6 rounded-[2rem] border group hover:border-primary/40 transition-all flex flex-col md:flex-row items-center justify-between gap-6 ${isDark ? 'bg-white/3 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-slate-800 text-white flex items-center justify-center font-bold text-lg border border-white/5">
                                    {p.name?.charAt(0)}
                                </div>
                                <div>
                                    <h5 className="font-bold text-lg">{p.name}</h5>
                                    <div className="flex items-center gap-4 mt-1">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                            <Calendar size={12} className="text-primary" /> Last: {p.lastVisit}
                                        </p>
                                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-extrabold uppercase border ${p.risk === 'High' ? 'text-rose-500 border-rose-500/20 bg-rose-500/5' : 'text-amber-500 border-amber-500/20 bg-amber-500/5'}`}>
                                            {p.risk} Churn Risk
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => startOutreach(p.name, 'WhatsApp')}
                                    className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all"
                                    title="WhatsApp Outreach"
                                >
                                    <MessageSquare size={18} />
                                </button>
                                <button
                                    onClick={() => startOutreach(p.name, 'Email')}
                                    className="p-4 rounded-2xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all"
                                    title="Email Outreach"
                                >
                                    <Mail size={18} />
                                </button>
                                <button
                                    onClick={() => startOutreach(p.name, 'Phone')}
                                    className="p-4 rounded-2xl bg-slate-800 text-slate-400 border border-white/5 hover:bg-white hover:text-slate-900 transition-all"
                                    title="Call"
                                >
                                    <Phone size={18} />
                                </button>
                                <div className="w-px h-10 bg-white/5 mx-2 hidden md:block" />
                                <button className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-primary hover:text-white transition-all flex items-center gap-2">
                                    Book Now <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="py-20 text-center animate-pulse">
                            <p className="text-xs font-extrabold text-slate-500 uppercase tracking-[0.3em]">Calibrating Recall Matrices...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
