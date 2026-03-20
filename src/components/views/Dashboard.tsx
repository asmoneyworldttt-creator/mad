import { motion } from 'framer-motion';
import {
    Clock, Activity, FileText, Smartphone, HeartPulse,
    TrendingUp, TrendingDown, Users, DollarSign, Package,
    Plus, CheckCircle2, XCircle, Beaker,
    BarChart3, RefreshCw, Calendar, Wallet,
    Target, Layers, Download, UserCheck, UserPlus,
    ArrowUpRight, Stethoscope, FlaskConical
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Legend } from 'recharts';
import { useToast } from '../Toast';

type UserRole = 'master' | 'admin' | 'staff' | 'patient';
type DateFilter = 'all' | 'day' | 'week' | 'month' | 'custom';

const formatINR = (v: number) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
}).format(v);

function cn(...inputs: any[]) { return inputs.filter(Boolean).join(' '); }

/* ─────────────────────── Sub-components ─────────────────────── */

function StatCard({ title, value, sub, trend, icon: Icon, color, onClick, delay = 0 }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            onClick={onClick}
            className={cn(
                'p-4 md:p-5 rounded-2xl relative overflow-hidden group transition-all duration-500',
                onClick ? 'cursor-pointer hover:-translate-y-1.5 hover:shadow-2xl active:scale-[0.98]' : ''
            )}
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: 'var(--glass-shadow)', backdropFilter: 'blur(20px)' }}
        >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                style={{ background: 'linear-gradient(135deg, var(--primary-soft) 0%, transparent 100%)' }} />
            <div className="flex justify-between items-start mb-3 relative z-10 transition-transform group-hover:translate-x-1 duration-500">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 duration-500 shadow-lg"
                    style={{ background: 'var(--card-bg-alt)', border: '1px solid var(--border-color)' }}>
                    <Icon size={18} style={{ color }} />
                </div>
                {sub && (
                    <div className={cn('flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full text-white shadow-lg active:scale-95 transition-all',
                        trend === 'up' ? 'bg-emerald-500 shadow-emerald-500/20' : trend === 'down' ? 'bg-rose-500 shadow-rose-500/20' : 'bg-slate-500')}>
                        {trend === 'up' ? <TrendingUp size={14} /> : trend === 'down' ? <TrendingDown size={14} /> : null}
                        {sub}
                    </div>
                )}
            </div>
            <div className="relative z-10 transition-transform group-hover:translate-x-1 duration-500">
                <p className="text-sm font-bold mb-1.5 opacity-60" style={{ color: 'var(--text-muted)' }}>{title}</p>
                <div className="flex items-baseline gap-1">
                    <h3 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-dark)' }}>{value}</h3>
                </div>
            </div>
            <div className="absolute -bottom-4 -right-4 opacity-[0.03] transition-transform group-hover:scale-125 group-hover:-rotate-12 duration-1000">
                <Icon size={72} style={{ color }} />
            </div>
        </motion.div>
    );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div className="mb-6">
            <h3 className="text-lg font-bold tracking-tight border-l-4 border-primary pl-4 py-0.5" style={{ color: 'var(--text-dark)' }}>{title}</h3>
            {subtitle && <p className="text-sm font-bold mt-1 opacity-70 ml-5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
        </div>
    );
}

function DateFilterTabs({ active, onChange, customStart, setCustomStart, customEnd, setCustomEnd }: { active: DateFilter; onChange: (f: DateFilter) => void; customStart?: string; setCustomStart?: (s: string) => void; customEnd?: string; setCustomEnd?: (s: string) => void }) {
    const tabs: { id: DateFilter; label: string }[] = [
        { id: 'all', label: 'All' },
        { id: 'day', label: 'Today' },
        { id: 'week', label: 'This Week' },
        { id: 'month', label: 'This Month' },
        { id: 'custom', label: 'Custom' },
    ];
    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center p-1 rounded-xl backdrop-blur-md" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                {tabs.map(t => {
                    const isActive = active === t.id;
                    return (
                        <button key={t.id} onClick={() => onChange(t.id)}
                            className="relative px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all outline-none"
                            style={{
                                color: isActive ? 'white' : 'var(--text-muted)',
                            }}>
                            {isActive && (
                                <motion.div 
                                    layoutId="activeFilterTab"
                                    className="absolute inset-0 bg-primary rounded-xl -z-10 shadow-md shadow-primary/20"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                                />
                            )}
                            <span className="relative z-10">{t.label}</span>
                        </button>
                    );
                })}
            </div>
            {active === 'custom' && setCustomStart && setCustomEnd && (
                <div className="flex items-center gap-2 p-1.5 rounded-xl border backdrop-blur-md" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                    <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="bg-transparent border-none text-[10px] font-bold px-1 outline-none text-slate-400" />
                    <span className="text-[9px] font-bold text-slate-500">to</span>
                    <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="bg-transparent border-none text-[10px] font-bold px-1 outline-none text-slate-400" />
                </div>
            )}
        </div>
    );
}

/* ─────────────────────── MAIN DASHBOARD ─────────────────────── */

export function Dashboard({ setActiveTab, userRole, theme, session, staffData }: { setActiveTab?: (t: string) => void, userRole: UserRole, theme?: 'light' | 'dark', session?: any, staffData?: any }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [stats, setStats] = useState({
        todayAppointments: 0, totalVisits: 0,
        completedApts: 0, missedApts: 0,
        newPatients: 0, oldPatients: 0, totalPatients: 0,
        totalRevenue: 0, avgTicket: 0, totalExpenses: 0, netProfit: 0,
        pendingLabs: 0, totalDoctors: 0, totalSalaries: 0,
    });
    const [patientChartData, setPatientChartData] = useState<any[]>([]);
    const [revenueChartData, setRevenueChartData] = useState<any[]>([]);
    const [collectionChartData, setCollectionChartData] = useState<any[]>([]);
    const [pendingLabCases, setPendingLabCases] = useState<any[]>([]);
    const [dateFilter, setDateFilter] = useState<DateFilter>('all');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const getDateRange = useCallback((filter: DateFilter) => {
        const now = new Date();
        const today = now.toLocaleDateString('en-CA');
        if (filter === 'all') return { start: '2020-01-01', end: '2099-12-31' };
        if (filter === 'day') return { start: today, end: today };
        if (filter === 'week') {
            const start = new Date(now); start.setDate(now.getDate() - 6);
            return { start: start.toLocaleDateString('en-CA'), end: today };
        }
        if (filter === 'month') {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            return { start: start.toLocaleDateString('en-CA'), end: today };
        }
        if (filter === 'custom') {
            return { start: customStart || today, end: customEnd || today };
        }
        return { start: today, end: today };
    }, [customStart, customEnd]);

    const fetchAll = useCallback(async (filter: DateFilter) => {
        setIsLoading(true);
        const { start, end } = getDateRange(filter);
        const today = new Date().toLocaleDateString('en-CA');
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('en-CA');
        const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toLocaleDateString('en-CA');

        const [
            { count: apptCount }, { data: allApts }, { count: missedCount },
            { count: totalVisitsCount }, { count: newPatCount }, { count: totalPatCount },
            { data: billsData }, { count: pendingLabCount },
            { data: expensesData }, { count: doctorCount }, { data: labCasesData }
        ] = await Promise.all([
            supabase.from('appointments').select('*', { count: 'exact', head: true }).gte('date', start).lte('date', end),
            supabase.from('appointments').select('*').gte('date', start).lte('date', end), // Optimized with filters
            supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'Missed').gte('date', start).lte('date', end),
            supabase.from('patient_history').select('*', { count: 'exact', head: true }).gte('date', start).lte('date', end),
            supabase.from('patients').select('*', { count: 'exact', head: true }).gte('created_at', start).lte('created_at', end + 'T23:59:59'),
            supabase.from('patients').select('*', { count: 'exact', head: true }),
            supabase.from('bills').select('amount, date').gte('date', start).lte('date', end),
            supabase.from('lab_orders').select('*', { count: 'exact', head: true }).neq('order_status', 'Delivered to Patient').gte('created_at', start).lte('created_at', end + 'T23:59:59'),
            supabase.from('accounts').select('amount').eq('type', 'expense').gte('created_at', start).lte('created_at', end + 'T23:59:59'),
            supabase.from('staff').select('role', { count: 'exact', head: true }).eq('role', 'doctor'),
            supabase.from('lab_orders').select('patient_name, order_status, created_at').neq('order_status', 'Delivered to Patient').order('created_at', { ascending: false }).limit(5),
        ]);

        // Logic for auto-completing sessions older than 24h
        const now = new Date();
        const autoUpdatedApts = (allApts || []).map(a => {
            const aptDate = new Date(`${a.date} ${a.time}`);
            if (now.getTime() - aptDate.getTime() > 24 * 60 * 60 * 1000 && !['Completed', 'Missed', 'Finished'].includes(a.status)) {
                return { ...a, status: 'Completed' };
            }
            return a;
        });

        const completedCountManaged = autoUpdatedApts.filter(a => ['Completed', 'Visited', 'Finished'].includes(a.status)).length;

        const totalRev = (billsData || []).reduce((a, c) => a + Number(c.amount || 0), 0);
        const totalExp = (expensesData || []).reduce((a, c) => a + Number(c.amount || 0), 0);
        const billCount = billsData?.length || 1;
        const totalSal = 0; // Salary column missing from current schema
        const lastMonthPats = (await supabase.from('patients').select('*', { count: 'exact', head: true }).lt('created_at', startOfMonth).gte('created_at', lastMonth)).count || 0;

        setStats({
            todayAppointments: apptCount || 0,
            totalVisits: totalVisitsCount || 0,
            completedApts: completedCountManaged,
            missedApts: missedCount || 0,
            newPatients: newPatCount || 0,
            oldPatients: Math.max(0, (totalPatCount || 0) - (newPatCount || 0)),
            totalPatients: totalPatCount || 0,
            totalRevenue: totalRev,
            avgTicket: Math.floor(totalRev / billCount),
            totalExpenses: totalExp,
            netProfit: totalRev - totalExp,
            pendingLabs: pendingLabCount || 0,
            totalDoctors: doctorCount || 0,
            totalSalaries: totalSal,
        });
        setPendingLabCases(labCasesData || []);
        setIsLoading(false);
    }, []);

    const fetchCharts = useCallback(async (filter: DateFilter) => {
        const { start, end } = getDateRange(filter);
        const range = filter === 'day' ? 1 : filter === 'week' ? 7 : 30;
        const now = new Date();

        const labels = Array.from({ length: range }, (_, i) => {
            const d = new Date(); d.setDate(now.getDate() - (range - 1 - i));
            return d.toLocaleDateString('en-CA');
        });

        const [{ data: pData }, { data: hData }, { data: bData }] = await Promise.all([
            supabase.from('patients').select('created_at').gte('created_at', start).lte('created_at', end + 'T23:59:59'),
            supabase.from('patient_history').select('date').gte('date', start).lte('date', end),
            supabase.from('bills').select('amount, date').gte('date', start).lte('date', end),
        ]);

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const shortLabels = range <= 7;

        const pts = labels.map(dateStr => {
            const d = new Date(dateStr);
            const label = shortLabels ? dayNames[d.getDay()] : `${d.getDate()}/${d.getMonth() + 1}`;
            const total = (hData || []).filter(h => h.date?.startsWith(dateStr)).length;
            const newPts = (pData || []).filter(p => p.created_at?.startsWith(dateStr)).length;
            return { name: label, 'Total Visits': total, 'New Patients': newPts };
        });
        setPatientChartData(pts);

        const rev = labels.map(dateStr => {
            const d = new Date(dateStr);
            const label = shortLabels ? dayNames[d.getDay()] : `${d.getDate()}/${d.getMonth() + 1}`;
            const gross = (bData || []).filter(b => b.date === dateStr).reduce((a, c) => a + Number(c.amount || 0), 0);
            return { name: label, 'Revenue': gross, 'Professional Fee': Math.floor(gross * 0.6) };
        });
        setRevenueChartData(rev);

        const coll = labels.map(dateStr => {
            const d = new Date(dateStr);
            const label = shortLabels ? dayNames[d.getDay()] : `${d.getDate()}/${d.getMonth() + 1}`;
            const gross = (bData || []).filter(b => b.date === dateStr).reduce((a, c) => a + Number(c.amount || 0), 0);
            return { name: label, 'Collection': gross, 'Net': Math.floor(gross * 0.75) };
        });
        setCollectionChartData(coll);
    }, [getDateRange]);

    useEffect(() => {
        fetchAll(dateFilter);
        fetchCharts(dateFilter);
    }, [fetchAll, fetchCharts, dateFilter, customStart, customEnd]);

    // Patient view
    if (userRole === 'patient') {
        return (
            <div className="animate-slide-up space-y-4 pb-20">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-3xl flex flex-col md:flex-row items-center gap-6"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 2px 10px var(--glass-shadow)' }}>
                    <div className="relative">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                            style={{ background: 'var(--primary-soft)', border: '1px solid var(--border-color)' }}>
                            <HeartPulse size={28} style={{ color: 'var(--primary)' }} />
                        </div>
                        <div className="absolute -bottom-1 -right-1 p-2 bg-primary text-white rounded-xl shadow-lg">
                            <CheckCircle2 size={12} />
                        </div>
                    </div>
                    <div className="text-center md:text-left">
                        <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--primary)' }}>My Health Portal</p>
                        <h2 className="text-xl font-bold tracking-tight mb-1" style={{ color: 'var(--text-dark)' }}>Welcome back!</h2>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>View your health records and appointments.</p>
                    </div>
                    <div className="md:ml-auto">
                        <button onClick={() => setActiveTab?.('appointments')}
                            className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-xs shadow-lg hover:scale-105 active:scale-95 transition-all"
                            style={{ boxShadow: '0 4px 15px var(--primary-glow)' }}>
                            Book Slot
                        </button>
                    </div>
                </motion.div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        { t: 'Appointments', v: 'View Schedule', icon: Calendar, tab: 'appointments' },
                        { t: 'Health Records', v: 'View History', icon: Activity, tab: 'emr' },
                        { t: 'Prescriptions', v: 'View Details', icon: FileText, tab: 'prescriptions' },
                        { t: 'Treatment Plan', v: 'View Plan', icon: Layers, tab: 'treatment-plans' },
                    ].map((card, i) => (
                        <div key={i}
                            className="p-4 rounded-2xl cursor-pointer hover:-translate-y-1 transition-all group"
                            style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 1px 10px var(--glass-shadow)' }}
                            onClick={() => setActiveTab?.(card.tab)}>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                                style={{ background: 'var(--primary-soft)' }}>
                                <card.icon size={16} style={{ color: 'var(--primary)' }} />
                            </div>
                            <p className="text-[10px] font-semibold mb-0.5" style={{ color: 'var(--text-muted)' }}>{card.t}</p>
                            <h4 className="font-bold text-sm tracking-tight" style={{ color: 'var(--text-dark)' }}>{card.v}</h4>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const cardStyle = { background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 2px 16px var(--glass-shadow)' };
    const tooltipStyle = {
        backgroundColor: 'var(--card-bg)', borderRadius: '1rem',
        border: '1px solid var(--border-color)', color: 'var(--text-main)',
        boxShadow: '0 10px 40px var(--glass-shadow)', fontSize: 12, fontWeight: 700
    };

    const renderMobileView = () => {
        return (
            <div className="space-y-5 pb-20 relative overflow-hidden font-sans antialiased" style={{ minHeight: '100vh', background: 'var(--background)' }}>
                {/* Ambient dynamic background orbs only visible on mobile app feels */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                    <motion.div 
                        animate={{ x: [0, 40, 40, 0], y: [0, 20, -20, 0] }}
                        transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
                        className="absolute top-1/6 -left-10 w-72 h-72 rounded-full bg-cyan-400/10 blur-3xl opacity-60"
                    />
                    <motion.div 
                        animate={{ x: [0, -30, 30, 0], y: [0, -40, 40, 0] }}
                        transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
                        className="absolute bottom-1/3 -right-10 w-80 h-80 rounded-full bg-violet-400/10 blur-3xl opacity-60"
                    />
                </div>

                {/* Mobile App Bar Header: Profile photo first, then welcome message */}
                <div className="px-4 pt-1 pb-3 flex flex-col gap-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-bold text-slate-500">
                            {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab?.('profile')}>
                        <div className="w-11 h-11 rounded-xl overflow-hidden shadow-lg border border-slate-200 flex-shrink-0">
                            <img alt="User avatar" className="w-full h-full object-cover" src={staffData?.profile_photo_url || ((userRole as string) === 'patient' ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150" : "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150")} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider leading-none mb-1 text-slate-500">Welcome back,</p>
                            <h2 className="text-lg font-black tracking-tight" style={{ color: 'var(--text-dark)' }}>{session?.user?.user_metadata?.full_name || 'User'}</h2>
                            <p className="text-[9px] font-bold opacity-70" style={{ color: 'var(--text-muted)' }}>ID: {staffData?.id?.slice(0,8) || '...'}</p>
                        </div>
                    </div>
                </div>

                {/* Adding DateFilter Tabs on top of Mobile View */}
                <div className="px-4 bg-transparent scale-90 origin-left">
                    <DateFilterTabs 
                        active={dateFilter} 
                        onChange={setDateFilter} 
                        customStart={customStart} 
                        setCustomStart={setCustomStart} 
                        customEnd={customEnd} 
                        setCustomEnd={setCustomEnd} 
                    />
                </div>

                {/* Quick actions row */}
                <div className="px-4 flex items-center gap-2 mb-3">
                    <button onClick={() => {
                        window.open('https://github.com/asmoneyworldttt-creator/mad/releases/latest/download/DentiSphere-Android-APK.apk', '_blank');
                        showToast('Starting Download...', 'success');
                    }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-black transition-all bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20 shadow-sm active:scale-95"
                    >
                        <Download size={14} className="stroke-[2.5px]" /> App Download
                    </button>
                    <button onClick={() => setActiveTab?.('appointments')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-black text-white bg-primary hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/10"
                    >
                        <Plus size={14} className="stroke-[2.5px]" /> Appointment Book
                    </button>
                </div>

                <div className="px-4 space-y-4">
                     {/* 1. Schedule Card */}
                     <div className="p-4 rounded-2xl relative overflow-hidden backdrop-blur-2xl shadow-md cursor-pointer"
                         onClick={() => setActiveTab?.('appointments')}
                         style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                         <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-xl pointer-events-none" />
                         <div className="flex justify-between items-center mb-4">
                             <div>
                                 <p className="text-[10px] font-bold tracking-widest uppercase text-cyan-450">Clinic Pulse</p>
                                 <h3 className="text-xl font-black mt-0.5" style={{ color: 'var(--text-dark)' }}>Active Schedule</h3>
                             </div>
                             <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyan-500/10 border border-cyan-500/20">
                                 <Calendar size={18} className="text-cyan-500" />
                             </div>
                         </div>
                         <div className="grid grid-cols-2 gap-3 mt-4">
                             <div className="p-3 bg-slate-500/5 rounded-xl border border-black/[0.02]">
                                 <p className="text-[9px] font-bold text-slate-400">Appointments</p>
                                 <h4 className="text-xl font-black mt-0.5" style={{ color: 'var(--text-dark)' }}>{stats.todayAppointments}</h4>
                             </div>
                             <div className="p-3 bg-slate-500/5 rounded-xl border border-black/[0.02]">
                                 <p className="text-[9px] font-bold text-slate-400">Completed</p>
                                 <h4 className="text-xl font-black mt-0.5 text-emerald-600">{stats.completedApts}</h4>
                             </div>
                             <div className="p-3 bg-slate-500/5 rounded-xl border border-black/[0.02]">
                                 <p className="text-[9px] font-bold text-slate-400">Total Visits</p>
                                 <h4 className="text-xl font-black mt-0.5" style={{ color: 'var(--text-dark)' }}>{stats.totalVisits}</h4>
                             </div>
                             <div className="p-3 bg-slate-500/5 rounded-xl border border-black/[0.02]">
                                 <p className="text-[9px] font-bold text-slate-400">Missed</p>
                                 <h4 className="text-xl font-black mt-0.5 text-rose-500">{stats.missedApts}</h4>
                             </div>
                         </div>
                     </div>

                     {/* 2. Patient Demographics Subpanel */}
                     <div className="p-4 rounded-2xl relative overflow-hidden backdrop-blur-2xl shadow-md cursor-pointer"
                         onClick={() => setActiveTab?.('patients')}
                         style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                         <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-xl pointer-events-none" />
                         <div className="flex justify-between items-center mb-4">
                             <div>
                                 <p className="text-[10px] font-bold tracking-widest uppercase text-emerald-500">Demographics</p>
                                 <h3 className="text-xl font-black mt-0.5" style={{ color: 'var(--text-dark)' }}>Patient Insight</h3>
                             </div>
                             <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20">
                                 <Users size={18} className="text-emerald-500" />
                             </div>
                         </div>
                         <div className="grid grid-cols-2 gap-3 mt-4">
                             <div className="p-3 bg-slate-500/5 rounded-xl border border-black/[0.02]">
                                 <p className="text-[9px] font-bold text-slate-400">Total Patients</p>
                                 <h4 className="text-xl font-black mt-0.5" style={{ color: 'var(--text-dark)' }}>{stats.totalPatients}</h4>
                             </div>
                             <div className="p-3 bg-slate-500/5 rounded-xl border border-black/[0.02]">
                                 <p className="text-[9px] font-bold text-slate-400">New Patients</p>
                                 <h4 className="text-xl font-black mt-0.5 text-emerald-600">{stats.newPatients}</h4>
                             </div>
                             <div className="p-3 bg-slate-500/5 rounded-xl border border-black/[0.02]">
                                 <p className="text-[9px] font-bold text-slate-400">Returning</p>
                                 <h4 className="text-xl font-black mt-0.5 text-cyan-500">{stats.oldPatients}</h4>
                             </div>
                             <div className="p-3 bg-slate-500/5 rounded-xl border border-black/[0.02]">
                                 <p className="text-[9px] font-bold text-slate-400">Today Visitors</p>
                                 <h4 className="text-xl font-black mt-0.5" style={{ color: 'var(--text-dark)' }}>{stats.totalVisits}</h4>
                             </div>
                         </div>
                     </div>

                     {/* 3. Financial Card with Clinical Expenses & Salary */}
                     <div className="p-4 rounded-2xl relative overflow-hidden backdrop-blur-2xl shadow-md cursor-pointer"
                         onClick={() => setActiveTab?.('earnings')}
                         style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                         <div className="absolute bottom-0 right-0 w-24 h-24 bg-violet-500/5 blur-xl pointer-events-none" />
                         <div className="flex justify-between items-center mb-4">
                             <div>
                                 <p className="text-[10px] font-bold tracking-widest uppercase text-violet-500">Financial Pulse</p>
                                 <h3 className="text-xl font-black mt-0.5" style={{ color: 'var(--text-dark)' }}>Earnings Overview</h3>
                             </div>
                             <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-500/10 border border-violet-500/20">
                                 <Wallet size={18} className="text-violet-500" />
                             </div>
                         </div>
                         <div className="p-4 bg-slate-500/5 rounded-xl border border-black/[0.02] relative overflow-hidden mb-3">
                             <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent pointer-events-none" />
                             <p className="text-xs font-bold text-slate-400">Total Revenue</p>
                             <h4 className="text-2xl font-black mt-1 text-emerald-600">{formatINR(stats.totalRevenue)}</h4>
                         </div>
                         <div className="grid grid-cols-2 gap-3 mb-3">
                             <div className="p-3 bg-slate-500/5 rounded-xl border border-black/[0.02]">
                                 <p className="text-[9px] font-bold text-slate-400">Clinical Expenses</p>
                                 <h4 className="text-sm font-black mt-0.5 text-rose-500">{formatINR(stats.totalExpenses)}</h4>
                             </div>
                             <div className="p-3 bg-slate-500/5 rounded-xl border border-black/[0.02]">
                                 <p className="text-[9px] font-bold text-slate-400">Net Profit</p>
                                 <h4 className="text-sm font-black mt-0.5 text-cyan-600">{formatINR(stats.netProfit)}</h4>
                             </div>
                         </div>
                         <div className="p-3 bg-slate-500/5 rounded-xl border border-black/[0.02] flex justify-between items-baseline">
                             <p className="text-[10px] font-bold text-slate-400">Staff Payroll</p>
                             <h4 className="text-md font-black text-rose-500">{formatINR(stats.totalSalaries || 0)}</h4>
                         </div>
                     </div>

                     {/* 4. Labs Panel */}
                     {stats.pendingLabs > 0 && (
                         <div className="p-4 rounded-2xl relative overflow-hidden backdrop-blur-2xl shadow-md cursor-pointer"
                             onClick={() => setActiveTab?.('labwork')}
                             style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                             <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
                             <div className="flex justify-between items-start">
                                 <div>
                                     <p className="text-[9px] font-bold text-amber-500 tracking-wider">PENDING LABS</p>
                                     <h4 className="text-2xl font-black mt-1" style={{ color: 'var(--text-dark)' }}>{stats.pendingLabs}</h4>
                                 </div>
                                 <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-500/10 border border-amber-500/20"><Layers size={14} className="text-amber-400" /></div>
                             </div>
                         </div>
                     )}

                     {/* 5. Mobile Analytics Chart */}
                     <div className="p-4 rounded-2xl relative overflow-hidden backdrop-blur-2xl shadow-md"
                         style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                         <div>
                             <p className="text-[10px] font-bold tracking-widest uppercase text-cyan-500">Analytics</p>
                             <h3 className="text-xl font-black mt-0.5 mb-3" style={{ color: 'var(--text-dark)' }}>Visit Statistics</h3>
                         </div>
                         <div className="h-32">
                             <ResponsiveContainer width="100%" height="100%" className="recharts-wrapper-fix">
                                 <AreaChart data={patientChartData}>
                                     <defs>
                                         <linearGradient id="gVisitsMob" x1="0" y1="0" x2="0" y2="1">
                                             <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                                             <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                         </linearGradient>
                                     </defs>
                                     <XAxis dataKey="name" hide />
                                     <YAxis hide />
                                     <Tooltip contentStyle={{ ...tooltipStyle, padding: '4px 8px', borderRadius: '8px', fontSize: 10 }} />
                                     <Area type="monotone" dataKey="Total Visits" stroke="var(--primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#gVisitsMob)" />
                                 </AreaChart>
                             </ResponsiveContainer>
                         </div>
                     </div>

                     {/* Growth Tracker & Earnings Breakdown Cards */}
                     <div className="p-4 rounded-2xl relative overflow-hidden backdrop-blur-2xl shadow-md"
                         style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                         <div>
                             <p className="text-[10px] font-bold tracking-widest uppercase text-violet-500">Earnings Breakdown</p>
                             <h3 className="text-xl font-black mt-0.5 mb-3" style={{ color: 'var(--text-dark)' }}>Financial Status</h3>
                         </div>
                         <div className="h-28">
                             <ResponsiveContainer width="100%" height="100%" className="recharts-wrapper-fix">
                                 <BarChart data={revenueChartData}>
                                     <XAxis dataKey="name" hide />
                                     <YAxis hide />
                                     <Tooltip contentStyle={{ ...tooltipStyle, padding: '4px 8px', borderRadius: '8px', fontSize: 10 }} />
                                     <Bar dataKey="Revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                                     <Bar dataKey="Profit" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                                 </BarChart>
                             </ResponsiveContainer>
                         </div>
                         <div className="flex gap-4 mt-2 justify-center">
                             <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> <span className="text-[10px] text-slate-500 font-bold">Revenue</span></div>
                             <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal-500" /> <span className="text-[10px] text-slate-500 font-bold">Profit</span></div>
                         </div>
                     </div>

                     {/* 6. Queue with seamless App UI feel */}
                     <div className="rounded-2xl backdrop-blur-2xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                         <TodayQueue theme={theme} setActiveTab={setActiveTab} />
                     </div>
                </div>
                <style>{`
                    .recharts-wrapper-fix { outline: none !important; }
                    .recharts-default-tooltip { outline: none !important; }
                `}</style>
            </div>
        );
    };

    if (isMobile) {
        return renderMobileView();
    }

    return (
        <div className="animate-slide-up space-y-6 pb-12">

            {/* ── Header + Quick Links ── */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-4 md:p-5 rounded-2xl relative overflow-hidden group transition-all duration-700 shadow-lg" 
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none transition-transform group-hover:scale-105 duration-1000 rotate-animation"><Activity size={60} /></div>
                <div className="relative z-10 flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                        <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-dark)' }}>Clinic Overview</h2>
                    <p className="text-sm font-bold mt-1 opacity-50" style={{ color: 'var(--text-muted)' }}>Manage your daily clinic activities and performance records.</p>
                </div>
                <div className="flex flex-wrap justify-center md:justify-end gap-2 relative z-10 w-full md:w-auto">
                    <button onClick={() => {
                        window.open('https://github.com/asmoneyworldttt-creator/mad/releases/latest/download/DentiSphere-Android-APK.apk', '_blank');
                        showToast('Starting Direct Download...', 'success');
                    }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[9px] font-bold transition-all bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20 shadow-sm active:scale-95"
                    >
                        <Smartphone size={12} /> Direct APK
                    </button>
                    <button onClick={() => fetchAll(dateFilter)}
                        className="w-9 h-9 rounded-lg flex items-center justify-center transition-all bg-white/5 hover:bg-white/10 active:scale-95 shadow-sm duration-500"
                        style={{ border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        <RefreshCw size={12} />
                    </button>
                    <button onClick={() => setActiveTab?.('appointments')}
                        className="px-4 py-2 rounded-lg text-[10px] font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-lg bg-primary">
                        <Plus size={12} className="inline mr-0.5" /> Book Slot
                    </button>
                </div>
            </div>

            {/* ── Global Date Filters ── */}
            <div className="flex justify-start sm:justify-end p-2 bg-transparent">
                <DateFilterTabs 
                    active={dateFilter} 
                    onChange={setDateFilter} 
                    customStart={customStart} 
                    setCustomStart={setCustomStart} 
                    customEnd={customEnd} 
                    setCustomEnd={setCustomEnd} 
                />
            </div>

            {/* ── KPI Cards – Row 1: Appointments ── */}
            <div>
                <SectionHeader title="Active Schedule" subtitle="Live tracking" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <StatCard title="Today's Appointments" value={isLoading ? '...' : stats.todayAppointments} icon={Calendar} color="var(--primary)" delay={0.05} onClick={() => setActiveTab?.('appointments')} />
                    <StatCard title="Total Visits" value={isLoading ? '...' : stats.totalVisits} icon={Activity} color="#10b981" delay={0.1} onClick={() => setActiveTab?.('appointments')} />
                    <StatCard title="Fulfilled" value={isLoading ? '...' : stats.completedApts} sub="Total" trend="up" icon={CheckCircle2} color="#10b981" delay={0.15} onClick={() => setActiveTab?.('appointments')} />
                    <StatCard title="No-Show" value={isLoading ? '...' : stats.missedApts} sub="Total" trend="down" icon={XCircle} color="#f43f5e" delay={0.2} onClick={() => setActiveTab?.('appointments')} />
                    <StatCard title="Pending Labs" value={isLoading ? '...' : stats.pendingLabs} sub="Updates" trend="down" icon={FlaskConical} color="#f59e0b" delay={0.25} onClick={() => setActiveTab?.('labwork')} />
                </div>
            </div>

            {/* ── KPI Cards – Row 2: Patients ── */}
            <div>
                <SectionHeader title="Patients" subtitle="Registration & return" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <StatCard title="New Patients" value={isLoading ? '...' : stats.newPatients} sub="Monthly" trend="up" icon={UserPlus} color="#8b5cf6" delay={0.05} onClick={() => setActiveTab?.('patients')} />
                    <StatCard title="Returning" value={isLoading ? '...' : stats.oldPatients} sub="Regulars" trend="up" icon={UserCheck} color="#0d9488" delay={0.1} onClick={() => setActiveTab?.('patients')} />
                    <StatCard title="Total Patients" value={isLoading ? '...' : stats.totalPatients} icon={Users} color="var(--primary)" delay={0.15} onClick={() => setActiveTab?.('patients')} />
                    <StatCard title="Medical Staff" value={isLoading ? '...' : stats.totalDoctors} sub={`₹${(stats.totalSalaries / 1000).toFixed(1)}k pay`} icon={Stethoscope} color="#f59e0b" delay={0.2} onClick={() => setActiveTab?.('team-hub')} />
                </div>
            </div>

            {/* ── KPI Cards – Row 3: Financials ── */}
            <div>
                <SectionHeader title="Financial Health" subtitle="Revenue & profit" />
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard title="Total Revenue" value={isLoading ? '...' : formatINR(stats.totalRevenue)} sub="Total" trend="up" icon={Wallet} color="#10b981" delay={0.05} onClick={() => setActiveTab?.('earnings')} />
                    <StatCard title="Average Bill" value={isLoading ? '...' : formatINR(stats.avgTicket)} sub="Per Unit" icon={DollarSign} color="var(--primary)" delay={0.1} onClick={() => setActiveTab?.('earnings')} />
                    <StatCard title="Clinic Expenses" value={isLoading ? '...' : formatINR(stats.totalExpenses)} sub="Outflow" trend="down" icon={TrendingDown} color="#f43f5e" delay={0.15} onClick={() => setActiveTab?.('accounts')} />
                    <StatCard title="Net Profit" value={isLoading ? '...' : formatINR(stats.netProfit)} sub={stats.totalRevenue > 0 ? `${((stats.netProfit / stats.totalRevenue) * 100).toFixed(0)}% margin` : '—'} trend={stats.netProfit >= 0 ? 'up' : 'down'} icon={Target} color={stats.netProfit >= 0 ? '#10b981' : '#f43f5e'} delay={0.2} onClick={() => setActiveTab?.('earnings')} />
                </div>
            </div>

            {/* ── Charts ── */}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <SectionHeader title="Performance Analytics" subtitle="Visual trends" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    {/* Chart 1: New Registrations & Total Visits */}
                    <div className="rounded-xl p-4" style={cardStyle}>
                        <h4 className="font-bold text-xs mb-1 opacity-50" style={{ color: 'var(--text-muted)' }}>Patient Flow</h4>
                        <p className="text-sm font-bold mb-4" style={{ color: 'var(--text-dark)' }}>Visit Statistics</p>
                        <div className="h-40">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={patientChartData}>
                                    <defs>
                                        <linearGradient id="gVisits" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#135bec" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#135bec" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gNew" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#ffffff08' : '#00000006'} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 9, fontWeight: 700 }} dy={4} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 9 }} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                                    <Area type="monotone" dataKey="Total Visits" stroke="#135bec" strokeWidth={2} fillOpacity={1} fill="url(#gVisits)" />
                                    <Area type="monotone" dataKey="New Patients" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#gNew)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Chart 2: Revenue & Treatment */}
                    <div className="rounded-xl p-4" style={cardStyle}>
                        <h4 className="font-bold text-[9px] uppercase tracking-wider mb-0.5 opacity-60" style={{ color: 'var(--text-muted)' }}>Revenue Forge</h4>
                        <p className="text-xs font-bold mb-4" style={{ color: 'var(--text-dark)' }}>Earnings Breakdown</p>
                        <div className="h-40">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueChartData} barGap={4}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#ffffff08' : '#00000006'} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 9, fontWeight: 700 }} dy={4} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 9 }} tickFormatter={v => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} />
                                    <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, undefined]} />
                                    <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                                    <Bar dataKey="Revenue" fill="#135bec" radius={[6, 6, 0, 0]} />
                                    <Bar dataKey="Professional Fee" fill="#0d9488" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Chart 3: Gross Collection */}
                <div className="rounded-xl p-4" style={cardStyle}>
                    <h4 className="font-bold text-xs mb-1 opacity-50" style={{ color: 'var(--text-muted)' }}>Financial Curve</h4>
                    <p className="text-sm font-bold mb-4" style={{ color: 'var(--text-dark)' }}>Growth Tracker</p>
                    <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={collectionChartData}>
                                <defs>
                                    <linearGradient id="gColl" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gNet" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#ffffff08' : '#00000006'} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 9, fontWeight: 700 }} dy={4} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 9 }} tickFormatter={v => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} />
                                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, undefined]} />
                                <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                                <Area type="monotone" dataKey="Collection" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#gColl)" />
                                <Area type="monotone" dataKey="Net" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#gNet)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ── Today's Patient Queue ── */}
            <TodayQueue theme={theme} setActiveTab={setActiveTab} />

            {/* ── Appointment Completion Summary ── */}
            <div className="rounded-xl p-4" style={cardStyle}>
                <SectionHeader title="Completion Metrics" subtitle="Operational efficiency" />
                <div className="space-y-3">
                    {[
                        { l: 'Total Ops', c: stats.totalVisits + stats.missedApts + stats.completedApts, p: 100, color: 'var(--primary)' },
                        { l: 'Completed', c: stats.completedApts, p: Math.round((stats.completedApts / (Math.max(1, stats.totalVisits + stats.missedApts + stats.completedApts))) * 100), color: '#10b981' },
                        { l: 'Missed', c: stats.missedApts, p: Math.round((stats.missedApts / (Math.max(1, stats.totalVisits + stats.missedApts + stats.completedApts))) * 100), color: '#f43f5e' },
                    ].map((s, i) => (
                        <div key={i} className="space-y-1">
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>{s.l}</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="font-bold" style={{ color: 'var(--text-dark)' }}>{s.c}</span>
                                    <span className="text-[8px] font-semibold opacity-60">({s.p}%)</span>
                                </div>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--primary-soft)' }}>
                                <motion.div initial={{ width: 0 }} animate={{ width: `${s.p}%` }}
                                    transition={{ duration: 1, delay: i * 0.1 }}
                                    className="h-full rounded-full" style={{ background: s.color }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Pending Lab Cases ── */}
            {pendingLabCases.length > 0 && (
                <div className="rounded-xl p-5" style={cardStyle}>
                    <div className="flex items-center justify-between mb-4">
                        <SectionHeader title="Pending Lab Reports" subtitle="Follow up" />
                        <button onClick={() => setActiveTab?.('labwork')}
                            className="text-[10px] font-bold flex items-center gap-1 transition-colors hover:underline"
                            style={{ color: 'var(--primary)' }}>
                            View All <ArrowUpRight size={11} />
                        </button>
                    </div>
                    <div className="space-y-2">
                        {pendingLabCases.map((lab, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl"
                                style={{ background: 'var(--card-bg-alt)', border: '1px solid var(--border-color)' }}>
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                                        style={{ background: 'var(--primary-soft)' }}>
                                        <FlaskConical size={12} style={{ color: 'var(--primary)' }} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold" style={{ color: 'var(--text-dark)' }}>{lab.patient_name || 'Patient'}</p>
                                        <p className="text-[9px] font-semibold" style={{ color: 'var(--text-muted)' }}>Lab Case</p>
                                    </div>
                                </div>
                                <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold"
                                    style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                                    {lab.order_status || 'Pending'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Today's Queue sub-component ── */
function TodayQueue({ theme, setActiveTab }: { theme?: string; setActiveTab?: (t: string) => void }) {
    const [queue, setQueue] = useState<any[]>([]);
    const isDark = theme === 'dark';

    const fetch = useCallback(async () => {
        const today = new Date().toLocaleDateString('en-CA');
        const { data } = await supabase.from('appointments').select('*').eq('date', today).order('time').limit(6);
        setQueue(data || []);
    }, []);

    useEffect(() => {
        fetch();
        const ch = supabase.channel('tq').on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetch).subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [fetch]);

    const statusStyle: any = {
        'Confirmed': { bg: 'rgba(19,91,236,0.1)', text: '#135bec' },
        'Completed': { bg: 'rgba(16,185,129,0.1)', text: '#10b981' },
        'Visited': { bg: 'rgba(16,185,129,0.1)', text: '#10b981' },
        'Missed': { bg: 'rgba(244,63,94,0.1)', text: '#f43f5e' },
        'Waiting': { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' },
    };

    return (
        <div className="rounded-xl p-5" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 2px 10px var(--glass-shadow)' }}>
            <div className="flex items-center justify-between mb-5">
                <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                        </span>
                        <h3 className="font-black text-sm" style={{ color: 'var(--text-dark)' }}>Patient Flow</h3>
                    </div>
                    <p className="text-[9px] font-bold" style={{ color: 'var(--text-muted)' }}>Real-time status</p>
                </div>
                <button onClick={fetch} className="w-8 h-8 rounded-lg flex items-center justify-center hover:rotate-180 transition-transform duration-500"
                    style={{ background: 'var(--card-bg-alt)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <RefreshCw size={12} />
                </button>
            </div>
            <div className="space-y-2">
                {queue.length > 0 ? queue.map((p, i) => {
                    const s = statusStyle[p.status] || { bg: 'rgba(148,163,184,0.1)', text: '#94a3b8' };
                    return (
                        <motion.div key={i} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}
                            className="flex items-center justify-between gap-3 p-2 md:p-2.5 rounded-xl"
                            style={{ background: 'var(--card-bg-alt)', border: '1px solid var(--border-color)' }}>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg flex flex-col items-center justify-center"
                                    style={{ background: 'var(--primary-soft)', border: '1px solid var(--border-color)' }}>
                                    <span className="text-[9px] font-black" style={{ color: 'var(--primary)' }}>{p.time?.slice(0, 5)}</span>
                                </div>
                                <div>
                                    <p className="font-bold text-xs" style={{ color: 'var(--text-dark)' }}>{p.name}</p>
                                    <p className="text-[9px] font-bold" style={{ color: 'var(--text-muted)' }}>{p.type}</p>
                                </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold"
                                style={{ background: s.bg, color: s.text }}>
                                {p.status}
                            </span>
                        </motion.div>
                    );
                }) : (
                    <div className="py-10 text-center">
                        <Calendar size={28} className="mx-auto mb-2 opacity-20" style={{ color: 'var(--text-muted)' }} />
                        <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>No appointments today</p>
                        <button onClick={() => setActiveTab?.('appointments')} className="mt-2 text-[10px] font-bold" style={{ color: 'var(--primary)' }}>
                            Book slot →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
