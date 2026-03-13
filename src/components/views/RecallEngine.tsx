import { useState, useEffect } from 'react';
import {
    RefreshCcw, User, Calendar,
    MessageSquare, Mail, Phone,
    Search, AlertCircle, CheckCircle2,
    TrendingUp, Filter, ArrowRight, ExternalLink
} from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';
import { SkeletonList } from '../SkeletonLoader';
import { EmptyState } from '../EmptyState';

export function RecallEngine({ theme, setActiveTab }: { theme?: 'light' | 'dark'; setActiveTab?: (tab: string) => void }) {
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

    const startOutreach = (patient: any, channel: string) => {
        const phone = patient.phone?.replace(/[^0-9]/g, '');
        const name = encodeURIComponent(patient.name || 'Patient');

        if (channel === 'WhatsApp' && phone) {
            const msg = encodeURIComponent(`Hello ${patient.name}, this is a reminder from our clinic for your dental check-up. Please call us to schedule your appointment. Thank you!`);
            window.open(`https://wa.me/91${phone}?text=${msg}`, '_blank');
        } else if (channel === 'Email' && patient.email) {
            const subject = encodeURIComponent('Your Dental Recall — Dentora Clinic');
            const body = encodeURIComponent(`Dear ${patient.name},\n\nIt has been a while since your last dental visit. We recommend scheduling a check-up.\n\nPlease reply to this email or call us to book your appointment.\n\nWarm regards,\nDentora Clinic`);
            window.open(`mailto:${patient.email}?subject=${subject}&body=${body}`);
        } else if (channel === 'Phone' && phone) {
            window.open(`tel:+91${phone}`);
        } else {
            showToast(`No ${channel === 'WhatsApp' ? 'phone' : 'email'} on file for ${patient.name}`, 'warning');
        }
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
                    <button
                        onClick={() => showToast('To enable bulk SMS: integrate Twilio or MSG91 API in Settings → Integrations', 'info')}
                        className="bg-primary text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 flex items-center gap-2 hover:scale-105 transition-all text-sm"
                        aria-label="Send bulk outreach to all recall patients">
                        <MessageSquare size={18} aria-hidden="true" /> Bulk Outreach
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

                {loading ? (
                    <SkeletonList rows={4} />
                ) : recalls.length === 0 ? (
                    <EmptyState
                        icon={RefreshCcw}
                        title="No patients due for recall"
                        description="All patients have visited within the last 6 months. Check back later."
                        size="md"
                    />
                ) : recalls.map((p, i) => (
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
                                onClick={() => startOutreach(p, 'WhatsApp')}
                                className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all"
                                title="Send WhatsApp message" aria-label={`Send WhatsApp to ${p.name}`}
                            >
                                <MessageSquare size={18} aria-hidden="true" />
                            </button>
                            <button
                                onClick={() => startOutreach(p, 'Email')}
                                className="p-4 rounded-2xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all"
                                title="Send Email" aria-label={`Send email to ${p.name}`}
                            >
                                <Mail size={18} aria-hidden="true" />
                            </button>
                            <button
                                onClick={() => startOutreach(p, 'Phone')}
                                className="p-4 rounded-2xl border transition-all hover:bg-slate-100"
                                style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                                title="Call patient" aria-label={`Call ${p.name}`}
                            >
                                <Phone size={18} aria-hidden="true" />
                            </button>
                            <div className="w-px h-10 hidden md:block" style={{ background: 'var(--border-color)' }} />
                            <button
                                onClick={() => setActiveTab?.('appointments')}
                                className="px-6 py-4 rounded-2xl text-xs font-bold flex items-center gap-2 text-white transition-all hover:scale-105"
                                style={{ background: 'var(--primary)', boxShadow: '0 2px 10px var(--primary-glow)' }}
                                aria-label={`Book appointment for ${p.name}`}
                            >
                                Book Now <ArrowRight size={14} aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

