import { useState, useEffect } from 'react';
import {
    Clock, Calendar, Star, TrendingUp,
    ArrowRight, Activity, CheckCircle2,
    ClipboardList, Target, User, Search, Brain, Video, type LucideIcon
} from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';
import { PredictiveScoreBadge } from '../ai/PredictiveScoreBadge';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell
} from 'recharts';

export function DoctorPanel({ theme }: { theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [appointments, setAppointments] = useState<any[]>([]);
    const [stats, setStats] = useState({
        todayCount: 0,
        completedToday: 0,
        avgSatisfaction: 4.8,
        monthlyEarnings: 0
    });
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const syncSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                fetchDoctorData(session.user);
            }
        };
        syncSession();
    }, []);

    const fetchDoctorData = async (user: any) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const doctorName = user.user_metadata?.full_name || 'Dr. Jenkins';

            // Fetch appointments for this specific doctor
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

            // Mock monthly earnings calculation
            setStats(prev => ({
                ...prev,
                monthlyEarnings: 124500
            }));

        } catch (error) {
            showToast('Logic Error: Failed to synchronize daily worklist', 'error');
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles: Record<string, string> = {
            'Scheduled': 'bg-primary/10 text-primary border-primary/20',
            'Visited': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            'Completed': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            'Waiting': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
            'Cancelled': 'bg-rose-500/10 text-rose-500 border-rose-500/20'
        };
        return (
            <span className={`px-3 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-widest border ${styles[status] || styles['Scheduled']}`}>
                {status}
            </span>
        );
    };

    const kpiCards = [
        { label: "Today's Ledger", value: appointments.length, icon: Calendar, color: 'text-primary' },
        { label: "Efficiency Rate", value: `${Math.round((stats.completedToday / (stats.todayCount || 1)) * 100)}%`, icon: Target, color: 'text-amber-500' },
        { label: "Clinical Rating", value: stats.avgSatisfaction, icon: Star, color: 'text-emerald-500' },
        { label: "Month Accrual", value: `₹${(stats.monthlyEarnings / 1000).toFixed(1)}k`, icon: TrendingUp, color: 'text-purple-500' },
    ];

    return (
        <div className="animate-slide-up space-y-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Activity className="text-primary" />
                        Practitioner Desk
                    </h2>
                    <p className={`text-sm font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Clinical Workflow Optimization • Live Patient Stream
                    </p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        placeholder="Retrieve specific record..."
                        className={`w-full pl-12 pr-6 py-3 rounded-2xl font-bold text-sm outline-none border transition-all ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 focus:border-primary'}`}
                    />
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {kpiCards.map((card, i) => (
                    <div key={i} className={`p-6 rounded-[2rem] border relative overflow-hidden group ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                        <div className={`absolute -right-2 -top-2 p-6 opacity-5 group-hover:scale-125 transition-all ${card.color}`}><card.icon size={50} /></div>
                        <p className={`text-[9px] font-extrabold uppercase tracking-[0.2em] mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{card.label}</p>
                        <h3 className="text-2xl font-bold">{card.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Live Worklist */}
                <div className={`lg:col-span-2 p-10 rounded-[3rem] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div className="flex justify-between items-center mb-10">
                        <h4 className="text-xl font-bold flex items-center gap-3">
                            <Clock className="text-primary" />
                            Live Procedural Queue
                        </h4>
                        <span className="text-[10px] font-extrabold text-slate-500 px-4 py-2 bg-slate-500/5 rounded-xl uppercase tracking-widest">
                            {appointments.filter(a => a.status === 'Waiting').length} Urgent Purgatory
                        </span>
                    </div>

                    <div className="space-y-4">
                        {appointments.length > 0 ? appointments.map((apt, i) => (
                            <div key={i} className={`p-6 rounded-[2rem] border group hover:border-primary/50 transition-all flex items-center justify-between ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-lg shadow-lg">
                                        {apt.patient_name?.charAt(0) || 'P'}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h5 className="font-bold text-lg">{apt.patient_name}</h5>
                                            <PredictiveScoreBadge patientId={apt.patient_id} />
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-500 flex items-center gap-2">
                                            <ClipboardList size={12} className="text-primary" />
                                            {apt.type} • {apt.time}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <StatusBadge status={apt.status} />
                                    <div className="flex gap-2">
                                        <button className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/10">
                                            <Video size={18} />
                                        </button>
                                        <button className="p-3 rounded-xl bg-white/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all">
                                            <ArrowRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="py-20 text-center border-2 border-dashed border-slate-100/10 rounded-[3rem]">
                                <p className="text-sm text-slate-500 font-medium italic italic">No clinical nodes assigned for today's session.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Performance & Quick Actions */}
                <div className="space-y-8">
                    <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                        <h4 className="text-lg font-bold mb-6">Recent Diagnostic Activity</h4>
                        <div className="space-y-4">
                            {[1, 2, 3].map((_, i) => (
                                <div key={i} className="flex gap-4 items-start pb-4 border-b border-white/5 last:border-0">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                        <CheckCircle2 size={16} className="text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold">SOAP Committed for J. Doe</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">Tooth #46 RCT Phase 1 • 2h ago</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={`p-8 rounded-[2.5rem] border relative overflow-hidden flex flex-col items-center text-center ${isDark ? 'bg-primary/10 border-primary/20' : 'bg-primary text-white shadow-xl shadow-primary/20'}`}>
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><TrendingUp size={80} /></div>
                        <div className={`w-16 h-16 rounded-3xl bg-white/20 flex items-center justify-center mb-6`}>
                            <TrendingUp size={32} />
                        </div>
                        <h4 className="text-xl font-bold mb-2">Clinical Incentive Engine</h4>
                        <p className={`text-xs font-medium mb-8 leading-relaxed opacity-80`}>
                            You are tracking 12% ahead of your quarterly performance conversion metrics.
                        </p>
                        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-2">
                            <div className="h-full bg-white rounded-full w-[82%]" />
                        </div>
                        <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-60">82% of Goal Met</p>
                    </div>

                    <button className="w-full py-5 rounded-[2rem] bg-emerald-500 text-white font-bold flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all">
                        <CheckCircle2 size={20} /> Mark Shift Complete
                    </button>
                </div>
            </div>
        </div>
    );
}
