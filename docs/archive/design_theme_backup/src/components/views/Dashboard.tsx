
import { motion } from 'framer-motion';
import { Clock, Activity, FileText, Smartphone, HeartPulse, TrendingUp, TrendingDown, Users, DollarSign, Package, Plus, AlertTriangle, CheckCircle2, XCircle, Beaker, BarChart3, RefreshCw } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar } from 'recharts';
import { useToast } from '../../components/Toast';

type UserRole = 'admin' | 'staff' | 'doctor' | 'patient';
const formatINR = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

/* ──────────────────────────────────────────────────────── */
/*  Stat Card                                               */
/* ──────────────────────────────────────────────────────── */
function StatCard({ title, value, sub, trend, delay = 0, onClick, theme, icon: Icon, color = 'primary' }: any) {
    const colorMap: any = {
        primary: { bg: 'bg-primary/10', text: 'text-primary', badge: 'bg-primary/10 text-primary' },
        green: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', badge: 'bg-emerald-500/10 text-emerald-500' },
        rose: { bg: 'bg-rose-500/10', text: 'text-rose-500', badge: 'bg-rose-500/10 text-rose-500' },
        amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', badge: 'bg-amber-500/10 text-amber-500' },
        purple: { bg: 'bg-purple-500/10', text: 'text-purple-500', badge: 'bg-purple-500/10 text-purple-500' },
        cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', badge: 'bg-cyan-500/10 text-cyan-500' },
    };
    const c = colorMap[color] || colorMap.primary;
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.45 }}
            onClick={onClick}
            className={`p-5 rounded-[1.8rem] border relative overflow-hidden group transition-all duration-300 ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''} ${theme === 'dark' ? 'bg-slate-900 border-white/5 hover:border-primary/20' : 'bg-white border-slate-100 shadow-sm hover:shadow-lg'}`}
        >
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity ${c.text} bg-current`} />
            <div className="flex justify-between items-start mb-3 relative z-10">
                <div className={`p-2.5 rounded-xl ${c.bg} ${c.text}`}><Icon size={18} /></div>
                {sub && (
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-lg flex items-center gap-1 ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-500' : trend === 'down' ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-100 text-slate-400'}`}>
                        {trend === 'up' ? <TrendingUp size={9} /> : trend === 'down' ? <TrendingDown size={9} /> : null}{sub}
                    </span>
                )}
            </div>
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.12em] mb-1 relative z-10">{title}</p>
            <h3 className={`font-sans text-xl font-bold tracking-tight relative z-10 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{value}</h3>
        </motion.div>
    );
}

/* ──────────────────────────────────────────────────────── */
/*  Live Queue                                              */
/* ──────────────────────────────────────────────────────── */
function LiveQueue({ theme }: { theme?: string }) {
    const [queue, setQueue] = useState<any[]>([]);
    const fetch = useCallback(async () => {
        const today = new Date().toLocaleDateString('en-CA');
        const { data } = await supabase.from('appointments').select('*').eq('date', today).order('time').limit(6);
        setQueue(data || []);
    }, []);
    useEffect(() => {
        fetch();
        const ch = supabase.channel('lq').on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetch).subscribe();
        return () => { supabase.removeChannel(ch); };
    }, []);
    const statusStyle: any = {
        'Confirmed': 'bg-primary/10 text-primary border-primary/20',
        'Completed': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        'Visited': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        'Missed': 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    };
    return (
        <div className={`rounded-[1.8rem] p-5 border h-full ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className={`text-[10px] font-extrabold tracking-[0.2em] uppercase flex items-center gap-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    Live Patient Stream
                </h3>
                <button onClick={fetch} className="p-1 rounded-lg hover:bg-slate-100 transition-colors"><RefreshCw size={12} className="text-slate-400" /></button>
            </div>
            <div className="space-y-3">
                {queue.length > 0 ? queue.map((p, i) => (
                    <div key={i} className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-bold ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-primary'}`}>{p.time?.slice(0, 5)}</div>
                            <div>
                                <p className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{p.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.type}</p>
                            </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold border uppercase ${statusStyle[p.status] || 'bg-slate-100 text-slate-400 border-slate-200'}`}>{p.status}</span>
                    </div>
                )) : <div className="py-10 text-center text-slate-400 italic text-sm">No appointments today.</div>}
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────────────── */
/*  Appointment Funnel                                      */
/* ──────────────────────────────────────────────────────── */
function AppointmentFunnel({ theme, stats }: any) {
    const total = stats.totalAppointments || 1;
    const stages = [
        { label: 'Booked', count: stats.totalAppointments, color: '#135bec', pct: 100 },
        { label: 'Completed / Visited', count: stats.completedApts, color: '#10b981', pct: Math.round((stats.completedApts / total) * 100) },
        { label: 'Missed / No-Show', count: stats.missedAppointments, color: '#ef4444', pct: Math.round((stats.missedAppointments / total) * 100) },
        { label: 'Cancelled', count: stats.cancelledApts, color: '#f59e0b', pct: Math.round((stats.cancelledApts / total) * 100) },
    ];
    return (
        <div className={`p-6 rounded-[1.8rem] border ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
            <h3 className={`text-[10px] font-extrabold tracking-[0.2em] uppercase mb-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>Appointment Funnel</h3>
            <div className="space-y-3">
                {stages.map((s, i) => (
                    <div key={i}>
                        <div className="flex justify-between mb-1">
                            <span className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{s.label}</span>
                            <span className="text-xs font-extrabold" style={{ color: s.color }}>{s.count} <span className="text-slate-400 font-normal">({s.pct}%)</span></span>
                        </div>
                        <div className={`h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'}`}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ delay: i * 0.15, duration: 0.7 }} className="h-full rounded-full" style={{ backgroundColor: s.color }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────────────── */
/*  Inventory Alerts                                        */
/* ──────────────────────────────────────────────────────── */
function InventoryAlerts({ theme, setActiveTab }: any) {
    const [lowStock, setLowStock] = useState<any[]>([]);
    useEffect(() => {
        supabase.from('inventory_stock').select('*').lte('quantity', 10).order('quantity').limit(5).then(({ data }) => setLowStock(data || []));
        const ch = supabase.channel('inv_alert').on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_stock' }, () => {
            supabase.from('inventory_stock').select('*').lte('quantity', 10).order('quantity').limit(5).then(({ data }) => setLowStock(data || []));
        }).subscribe();
        return () => { supabase.removeChannel(ch); };
    }, []);
    return (
        <div className={`p-6 rounded-[1.8rem] border ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className={`text-[10px] font-extrabold tracking-[0.2em] uppercase flex items-center gap-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>
                    <AlertTriangle size={12} className="text-amber-500" /> Critical Stock Alerts
                </h3>
                <button onClick={() => setActiveTab?.('inventory')} className="text-[10px] font-bold text-primary hover:underline">View All</button>
            </div>
            {lowStock.length > 0 ? (
                <div className="space-y-2">
                    {lowStock.map((item, i) => (
                        <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-amber-50 border-amber-100'}`}>
                            <div className="flex items-center gap-3">
                                <Package size={14} className="text-amber-500 flex-shrink-0" />
                                <span className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>{item.product_name}</span>
                            </div>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg ${item.quantity <= 5 ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>{item.quantity} left</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex items-center gap-3 py-4 text-emerald-500">
                    <CheckCircle2 size={18} />
                    <span className="text-sm font-bold">All stock levels are healthy!</span>
                </div>
            )}
        </div>
    );
}

/* ──────────────────────────────────────────────────────── */
/*  Lab Cases Tracker                                       */
/* ──────────────────────────────────────────────────────── */
function LabTracker({ theme, setActiveTab }: any) {
    const [cases, setCases] = useState<any[]>([]);
    useEffect(() => {
        supabase.from('lab_orders').select('*, patients(name)').neq('status', 'Delivered to Patient').order('date', { ascending: false }).limit(5).then(({ data }) => setCases(data || []));
    }, []);
    const statusColor: any = { 'Sent to Lab': 'text-amber-500 bg-amber-500/10', 'Work in Progress': 'text-blue-500 bg-blue-500/10', 'Ready for Delivery': 'text-emerald-500 bg-emerald-500/10' };
    return (
        <div className={`p-6 rounded-[1.8rem] border ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className={`text-[10px] font-extrabold tracking-[0.2em] uppercase flex items-center gap-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>
                    <Beaker size={12} className="text-primary" /> Pending Lab Cases
                </h3>
                <button onClick={() => setActiveTab?.('lab')} className="text-[10px] font-bold text-primary hover:underline">View All</button>
            </div>
            {cases.length > 0 ? (
                <div className="space-y-2">
                    {cases.map((c, i) => (
                        <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                            <div>
                                <p className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>{c.patients?.name || 'Patient'}</p>
                                <p className="text-[10px] text-slate-400">{c.type} · {c.date}</p>
                            </div>
                            <span className={`text-[9px] font-extrabold px-2 py-1 rounded-lg ${statusColor[c.status] || 'text-slate-400 bg-slate-100'}`}>{c.status}</span>
                        </div>
                    ))}
                </div>
            ) : <div className="py-4 text-center text-slate-400 italic text-sm">No pending lab cases.</div>}
        </div>
    );
}

/* ──────────────────────────────────────────────────────── */
/*  Doctor Performance                                      */
/* ──────────────────────────────────────────────────────── */
function DoctorKPIs({ theme }: any) {
    const [doctors, setDoctors] = useState<any[]>([]);
    useEffect(() => {
        Promise.all([
            supabase.from('staff').select('*').order('name'),
            supabase.from('bills').select('amount, doctor_name'),
            supabase.from('appointments').select('status, doctor_name'),
        ]).then(([{ data: staffData }, { data: billData }, { data: aptData }]) => {
            if (!staffData) return;
            const enriched = staffData.slice(0, 6).map((s: any) => {
                const revenue = (billData || []).filter((b: any) => b.doctor_name === s.name).reduce((a: number, b: any) => a + Number(b.amount || 0), 0);
                const completed = (aptData || []).filter((a: any) => a.doctor_name === s.name && (a.status === 'Completed' || a.status === 'Visited')).length;
                return { ...s, revenue, completed };
            });
            setDoctors(enriched);
        });
    }, []);
    return (
        <div className={`p-6 rounded-[1.8rem] border ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
            <h3 className={`text-[10px] font-extrabold tracking-[0.2em] uppercase mb-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>Doctor Performance</h3>
            <div className="space-y-3">
                {doctors.length > 0 ? doctors.map((d, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className={`w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center text-xs font-bold ${theme === 'dark' ? 'bg-white/10 text-white' : 'bg-primary/10 text-primary'}`}>{d.name?.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between mb-1">
                                <span className={`text-xs font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>{d.name}</span>
                                <span className="text-[10px] font-extrabold text-primary ml-2">{formatINR(d.revenue)}</span>
                            </div>
                            <div className={`h-1.5 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'}`}>
                                <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((d.revenue / 50000) * 100, 100)}%` }} />
                            </div>
                        </div>
                        <span className={`text-[10px] font-extrabold w-8 text-right ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{d.completed}</span>
                    </div>
                )) : <p className="text-slate-400 italic text-sm text-center py-4">Doctor data loads from staff+bills tables.</p>}
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────────────── */
/*  MAIN DASHBOARD                                          */
/* ──────────────────────────────────────────────────────── */
export function Dashboard({ setActiveTab, userRole, theme }: { setActiveTab?: (t: string) => void, userRole: UserRole, theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';

    const [stats, setStats] = useState({
        todayAppointments: 0, totalVisits: 0, totalAppointments: 0,
        missedAppointments: 0, cancelledApts: 0, completedApts: 0,
        newPatients: 0, totalPatients: 0, paymentCollection: 0,
        profFee: 0, expenses: 0, pendingReports: 0,
        totalRevenue: 0, netProfit: 0, avgTicket: 0,
    });
    const [patientChartData, setPatientChartData] = useState<any[]>([]);
    const [financialChartData, setFinancialChartData] = useState<any[]>([]);
    const [hourlyData, setHourlyData] = useState<any[]>([]);
    const [treatmentPieData, setTreatmentPieData] = useState<any[]>([]);
    const [pFilter, setPFilter] = useState('Weekly');
    const [fFilter, setFFilter] = useState('Weekly');
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const PIE_COLORS = ['#135bec', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

    const fetchAll = useCallback(async () => {
        const today = new Date().toLocaleDateString('en-CA');
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('en-CA');

        const [
            { count: todayCount }, { count: totalApts }, { count: missedCount },
            { count: cancelCount }, { count: completedCount }, { count: totalVisits },
            { count: newPatCount }, { count: totalPatCount },
            { data: billsData }, { count: pendingLabCount },
            { data: expensesData }, { data: historyData }
        ] = await Promise.all([
            supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('date', today),
            supabase.from('appointments').select('*', { count: 'exact', head: true }),
            supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'Missed'),
            supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'Cancelled'),
            supabase.from('appointments').select('*', { count: 'exact', head: true }).in('status', ['Completed', 'Visited']),
            supabase.from('patient_history').select('*', { count: 'exact', head: true }),
            supabase.from('patients').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
            supabase.from('patients').select('*', { count: 'exact', head: true }),
            supabase.from('bills').select('amount'),
            supabase.from('lab_orders').select('*', { count: 'exact', head: true }).neq('status', 'Delivered to Patient'),
            supabase.from('accounts').select('amount').eq('type', 'expense'),
            supabase.from('patient_history').select('treatment, cost'),
        ]);

        const totalCollected = (billsData || []).reduce((acc: number, c: any) => acc + Number(c.amount || 0), 0);
        const totalExpenses = (expensesData || []).reduce((acc: number, c: any) => acc + Number(c.amount || 0), 0);
        const bills = billsData?.length || 1;

        // Treatment pie
        const tMap: any = {};
        (historyData || []).forEach((h: any) => { if (h.treatment) tMap[h.treatment] = (tMap[h.treatment] || 0) + Number(h.cost || 0); });
        const pieData = Object.entries(tMap).sort((a: any, b: any) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));
        setTreatmentPieData(pieData);

        setStats({
            todayAppointments: todayCount || 0,
            totalAppointments: totalApts || 0,
            missedAppointments: missedCount || 0,
            cancelledApts: cancelCount || 0,
            completedApts: completedCount || 0,
            totalVisits: totalVisits || 0,
            newPatients: newPatCount || 0,
            totalPatients: totalPatCount || 0,
            paymentCollection: totalCollected,
            totalRevenue: totalCollected,
            profFee: Math.floor(totalCollected * 0.6),
            expenses: totalExpenses,
            pendingReports: pendingLabCount || 0,
            netProfit: totalCollected - totalExpenses,
            avgTicket: Math.floor(totalCollected / bills),
        });
        setLastUpdated(new Date());
    }, []);

    const fetchChartData = useCallback(async () => {
        const range = pFilter === 'Daily' ? 1 : pFilter === 'Monthly' ? 30 : 7;
        const now = new Date();
        const labels = Array.from({ length: range }, (_, i) => {
            const d = new Date(); d.setDate(now.getDate() - (range - 1 - i));
            return d.toISOString().split('T')[0];
        });

        const [{ data: pData }, { data: hData }, { data: bData }] = await Promise.all([
            supabase.from('patients').select('created_at'),
            supabase.from('patient_history').select('date'),
            supabase.from('bills').select('amount, date'),
        ]);

        setPatientChartData(labels.map(dateStr => {
            const d = new Date(dateStr);
            const label = range <= 7 ? ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][d.getDay()] : d.getDate().toString();
            return { name: label, visits: (hData || []).filter(h => h.date?.startsWith(dateStr)).length, new: (pData || []).filter(p => p.created_at?.startsWith(dateStr)).length };
        }));

        const finRange = fFilter === 'Daily' ? 1 : fFilter === 'Monthly' ? 30 : 7;
        const finLabels = Array.from({ length: finRange }, (_, i) => {
            const d = new Date(); d.setDate(now.getDate() - (finRange - 1 - i));
            return d.toISOString().split('T')[0];
        });
        setFinancialChartData(finLabels.map(dateStr => {
            const d = new Date(dateStr);
            const label = finRange <= 7 ? ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][d.getDay()] : d.getDate().toString();
            const total = (bData || []).filter(b => b.date === dateStr).reduce((a, c) => a + Number(c.amount || 0), 0);
            return { name: label, total, fees: Math.floor(total * 0.6) };
        }));

        // Hourly heatmap using today's appointments
        const todayStr = now.toLocaleDateString('en-CA');
        const { data: todayApts } = await supabase.from('appointments').select('time').eq('date', todayStr);
        const hourMap: any = {};
        (todayApts || []).forEach((a: any) => {
            const hr = parseInt(a.time?.split(':')[0] || '9');
            hourMap[hr] = (hourMap[hr] || 0) + 1;
        });
        setHourlyData(Array.from({ length: 11 }, (_, i) => {
            const hr = i + 8;
            return { name: `${hr}:00`, count: hourMap[hr] || 0 };
        }));
    }, [pFilter, fFilter]);

    useEffect(() => {
        fetchAll();
        fetchChartData();
        const ch = supabase.channel('dash_master')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetchAll)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, fetchAll)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, fetchAll)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts' }, fetchAll)
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [fetchAll]);

    useEffect(() => { fetchChartData(); }, [fetchChartData]);

    // Patient view
    if (userRole === 'patient') {
        return (
            <div className="animate-slide-up space-y-8 pb-20">
                <div className={`p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div className="relative">
                        <div className={`w-24 h-24 rounded-3xl flex items-center justify-center font-bold text-4xl ${isDark ? 'bg-white/10 text-white' : 'bg-primary/10 text-primary'}`}>P</div>
                        <div className="absolute -bottom-2 -right-2 p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/30"><HeartPulse size={20} /></div>
                    </div>
                    <div className="text-center md:text-left">
                        <h2 className={`text-4xl font-sans font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Your Health Portal</h2>
                        <p className={`font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Track appointments, records & prescriptions in one place.</p>
                    </div>
                    <div className="md:ml-auto flex gap-3">
                        <button onClick={() => setActiveTab?.('appointments')} className="px-8 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 active:scale-95 transition-all">Book Appointment</button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { t: 'Upcoming', v: 'No upcoming visits', s: 'Book now', b: 'primary', tab: 'appointments' },
                        { t: 'Last Visit', v: 'No visits yet', s: 'View history', b: 'green', tab: 'emr' },
                        { t: 'Prescriptions', v: 'Check prescriptions', s: 'Open', b: 'amber', tab: 'prescriptions' },
                        { t: 'My Records', v: 'View documents', s: 'Open Vault', b: 'purple', tab: 'emr' },
                    ].map((card, i) => (
                        <div key={i} className={`p-6 rounded-[2rem] border cursor-pointer transition-all hover:-translate-y-1 ${isDark ? 'bg-slate-900 border-white/5 hover:border-primary/20' : 'bg-white border-slate-100 shadow-sm hover:shadow-lg'}`} onClick={() => setActiveTab?.(card.tab)}>
                            <p className="text-[10px] font-extrabold text-slate-500 mb-2 uppercase tracking-widest">{card.t}</p>
                            <h4 className={`font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>{card.v}</h4>
                            <span className="text-[10px] text-primary font-bold hover:underline tracking-widest uppercase">{card.s} →</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="animate-slide-up space-y-6 pb-10">

            {/* Header */}
            <div className={`p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-4 border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center font-bold text-2xl ${isDark ? 'bg-white/10 text-white' : 'bg-primary/10 text-primary'}`}>D</div>
                    <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">DentiSphere · Live Analytics</p>
                        <h2 className={`text-2xl font-sans font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
                    </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap justify-center md:justify-end">
                    <span className={`text-[10px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button onClick={fetchAll} className={`p-2.5 rounded-xl border transition-all ${isDark ? 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}><RefreshCw size={16} /></button>
                    <button className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-500/20 flex items-center gap-2 active:scale-95 transition-all"><Smartphone size={16} /> Download APK</button>
                    <button onClick={() => setActiveTab?.('reports')} className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-primary/20 flex items-center gap-2 active:scale-95 transition-all"><BarChart3 size={16} /> Reports</button>
                    <button onClick={() => setActiveTab?.('appointments')} className={`px-5 py-2.5 rounded-xl text-xs font-extrabold border flex items-center gap-2 active:scale-95 transition-all ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-700'}`}><Plus size={16} /> New Appt</button>
                </div>
            </div>

            {/* Stat Cards Row 1 — Appointments & Patients */}
            <div>
                <p className={`text-[10px] font-extrabold uppercase tracking-[0.15em] mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Appointments & Patients</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <StatCard theme={theme} title="Today's Apts" value={stats.todayAppointments} sub="Live" trend="up" delay={0.05} icon={Clock} color="primary" onClick={() => setActiveTab?.('appointments')} />
                    <StatCard theme={theme} title="Total Visits" value={stats.totalVisits} sub="All Time" trend="up" delay={0.1} icon={Activity} color="green" onClick={() => setActiveTab?.('patients')} />
                    <StatCard theme={theme} title="Completed" value={stats.completedApts} sub="All Time" trend="up" delay={0.15} icon={CheckCircle2} color="green" />
                    <StatCard theme={theme} title="Missed" value={stats.missedAppointments} sub="Follow up" trend="down" delay={0.2} icon={XCircle} color="rose" />
                    <StatCard theme={theme} title="New Patients" value={stats.newPatients} sub="This Month" trend="up" delay={0.25} icon={Plus} color="cyan" onClick={() => setActiveTab?.('patients')} />
                    <StatCard theme={theme} title="Total Patients" value={stats.totalPatients} sub="All Time" trend="up" delay={0.3} icon={Users} color="purple" onClick={() => setActiveTab?.('patients')} />
                </div>
            </div>

            {/* Stat Cards Row 2 — Financials */}
            <div>
                <p className={`text-[10px] font-extrabold uppercase tracking-[0.15em] mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Financial Overview</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <StatCard theme={theme} title="Total Revenue" value={formatINR(stats.totalRevenue)} sub="Collected" trend="up" delay={0.05} icon={DollarSign} color="green" onClick={() => setActiveTab?.('earnings')} />
                    <StatCard theme={theme} title="Professional Fee" value={formatINR(stats.profFee)} sub="~60% share" trend="up" delay={0.1} icon={TrendingUp} color="primary" />
                    <StatCard theme={theme} title="Avg Ticket" value={formatINR(stats.avgTicket)} sub="Per bill" trend="up" delay={0.15} icon={DollarSign} color="cyan" />
                    <StatCard theme={theme} title="Total Expenses" value={formatINR(stats.expenses)} sub="Recorded" trend="down" delay={0.2} icon={TrendingDown} color="rose" />
                    <StatCard theme={theme} title="Net Profit" value={formatINR(stats.netProfit)} sub={stats.netProfit > 0 ? 'Positive' : 'Deficit'} trend={stats.netProfit > 0 ? 'up' : 'down'} delay={0.25} icon={TrendingUp} color={stats.netProfit > 0 ? 'green' : 'rose'} onClick={() => setActiveTab?.('earnings')} />
                    <StatCard theme={theme} title="Pending Lab" value={stats.pendingReports} sub="Cases" trend={stats.pendingReports > 0 ? 'down' : 'up'} delay={0.3} icon={FileText} color="amber" onClick={() => setActiveTab?.('lab')} />
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Patient Chart */}
                <div className={`lg:col-span-2 p-6 rounded-[1.8rem] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div className="flex justify-between items-center mb-5">
                        <div>
                            <p className={`text-[10px] font-extrabold uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Patient Intake</p>
                            <p className="text-sm font-bold text-primary mt-0.5">New registrations vs total visits</p>
                        </div>
                        <select value={pFilter} onChange={e => setPFilter(e.target.value)} className={`rounded-xl px-3 py-1.5 text-[10px] font-bold outline-none border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                            <option>Daily</option><option>Weekly</option><option>Monthly</option>
                        </select>
                    </div>
                    <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={patientChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#135bec" stopOpacity={0.15} /><stop offset="100%" stopColor="#135bec" stopOpacity={0} /></linearGradient>
                                    <linearGradient id="gN" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.15} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1E293B' : '#E2E8F0'} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} dy={8} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', background: isDark ? '#0F172A' : '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontSize: 12 }} />
                                <Area type="monotone" dataKey="visits" name="Visits" stroke="#135bec" strokeWidth={3} fill="url(#gV)" />
                                <Area type="monotone" dataKey="new" name="New Patients" stroke="#10b981" strokeWidth={3} fill="url(#gN)" />
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, fontWeight: 800 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Treatment Pie */}
                <div className={`p-6 rounded-[1.8rem] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <p className={`text-[10px] font-extrabold uppercase tracking-[0.2em] mb-1 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Revenue by Treatment</p>
                    <p className="text-sm font-bold text-primary mb-4">Top earning procedures</p>
                    {treatmentPieData.length > 0 ? (
                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={treatmentPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={4}>
                                        {treatmentPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(v: any) => formatINR(v)} contentStyle={{ borderRadius: '12px', border: 'none', fontSize: 11 }} />
                                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '9px', fontWeight: 800 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : <div className="h-52 flex items-center justify-center text-slate-400 italic text-sm">Add patient history with treatment costs to see this chart.</div>}
                </div>
            </div>

            {/* Financial Chart + Hourly Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className={`p-6 rounded-[1.8rem] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div className="flex justify-between items-center mb-5">
                        <div>
                            <p className={`text-[10px] font-extrabold uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Revenue Streams</p>
                            <p className="text-sm font-bold text-primary mt-0.5">Gross collection vs professional fees</p>
                        </div>
                        <select value={fFilter} onChange={e => setFFilter(e.target.value)} className={`rounded-xl px-3 py-1.5 text-[10px] font-bold outline-none border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                            <option>Daily</option><option>Weekly</option><option>Monthly</option>
                        </select>
                    </div>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={financialChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barSize={12} barGap={3}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1E293B' : '#E2E8F0'} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} dy={8} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                                <Tooltip formatter={(v: any) => formatINR(v)} contentStyle={{ borderRadius: '16px', border: 'none', background: isDark ? '#0F172A' : '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontSize: 12 }} />
                                <Bar dataKey="total" name="Gross Revenue" fill="#135bec" radius={[6, 6, 0, 0]} />
                                <Bar dataKey="fees" name="Prof Fees" fill="#10b981" radius={[6, 6, 0, 0]} />
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, fontWeight: 800 }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Hourly Patient Heatmap */}
                <div className={`p-6 rounded-[1.8rem] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div className="mb-5">
                        <p className={`text-[10px] font-extrabold uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Today's Hourly Patient Flow</p>
                        <p className="text-sm font-bold text-primary mt-0.5">Peak hours at a glance</p>
                    </div>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hourlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barSize={16}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1E293B' : '#E2E8F0'} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 9, fontWeight: 700 }} dy={8} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} allowDecimals={false} />
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', background: isDark ? '#0F172A' : '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontSize: 12 }} />
                                <Bar dataKey="count" name="Appointments" radius={[6, 6, 0, 0]} fill="#8b5cf6">
                                    {hourlyData.map((entry, index) => (
                                        <Cell key={index} fill={entry.count >= 3 ? '#ef4444' : entry.count >= 2 ? '#f59e0b' : entry.count === 1 ? '#135bec' : '#e2e8f0'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex gap-3 mt-3 flex-wrap">
                        {[['#ef4444', '3+ (Peak)'], ['#f59e0b', '2 (Busy)'], ['#135bec', '1 (Normal)'], ['#e2e8f0', '0 (Free)']].map(([color, label]) => (
                            <div key={label} className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                                <span className={`text-[9px] font-extrabold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row: Live Queue + Funnel + Inventory Alerts + Lab + Doctor KPIs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <LiveQueue theme={theme} />
                <div className="space-y-5">
                    <AppointmentFunnel theme={theme} stats={stats} />
                    <InventoryAlerts theme={theme} setActiveTab={setActiveTab} />
                </div>
                <div className="space-y-5">
                    <LabTracker theme={theme} setActiveTab={setActiveTab} />
                    <DoctorKPIs theme={theme} />
                </div>
            </div>
        </div>
    );
}
