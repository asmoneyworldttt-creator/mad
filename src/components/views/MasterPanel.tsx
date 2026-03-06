import { useState, useEffect } from 'react';
import {
    TrendingUp, Users, DollarSign, Activity,
    ArrowUpRight, ArrowDownRight, Briefcase,
    Globe, ShieldCheck, PieChart, BarChart3,
    Calendar, UserPlus, Target
} from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, AreaChart, Area,
    BarChart, Bar, Cell
} from 'recharts';

export function MasterPanel({ theme }: { theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [stats, setStats] = useState({
        totalRevenue: 0,
        netProfit: 0,
        patientGrowth: 0,
        activeStaff: 0,
        avgTicket: 0,
        conversionRate: 0
    });
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [topDoctors, setTopDoctors] = useState<any[]>([]);

    useEffect(() => {
        fetchMasterData();
    }, []);

    const fetchMasterData = async () => {
        try {
            // 1. Fetch Revenue stats
            const { data: bills } = await supabase.from('bills').select('amount, created_at');
            const totalRev = bills?.reduce((acc, b) => acc + (b.amount || 0), 0) || 0;

            // 2. Fetch Expense stats
            const { data: accounts } = await supabase.from('accounts').select('amount').eq('type', 'expense');
            const totalExp = accounts?.reduce((acc, a) => acc + (a.amount || 0), 0) || 0;

            // 3. Patient Count
            const { count: patientCount } = await supabase.from('patients').select('*', { count: 'exact', head: true });

            // 4. Staff Count
            const { count: staffCount } = await supabase.from('staff').select('*', { count: 'exact', head: true });

            setStats({
                totalRevenue: totalRev,
                netProfit: totalRev - totalExp,
                patientGrowth: 12.5, // Mock trend
                activeStaff: staffCount || 0,
                avgTicket: bills?.length ? Math.round(totalRev / bills.length) : 0,
                conversionRate: 68
            });

            // Mock revenue chart data based on recent months
            setRevenueData([
                { name: 'Oct', revenue: totalRev * 0.7, profit: (totalRev - totalExp) * 0.6 },
                { name: 'Nov', revenue: totalRev * 0.85, profit: (totalRev - totalExp) * 0.75 },
                { name: 'Dec', revenue: totalRev * 0.9, profit: (totalRev - totalExp) * 0.8 },
                { name: 'Jan', revenue: totalRev * 1.1, profit: (totalRev - totalExp) * 0.95 },
                { name: 'Feb', revenue: totalRev, profit: totalRev - totalExp },
            ]);

            setTopDoctors([
                { name: 'Dr. Jenkins', revenue: totalRev * 0.45, conversion: 82 },
                { name: 'Dr. Sarah', revenue: totalRev * 0.35, conversion: 71 },
                { name: 'Dr. Michael', revenue: totalRev * 0.20, conversion: 59 },
            ]);

        } catch (error) {
            showToast('Failed to synthesize global analytics', 'error');
        }
    };

    const kpiCards = [
        { label: 'Cumulative Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, trend: '+18.4%', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'Net Clinic Profit', value: `₹${stats.netProfit.toLocaleString()}`, trend: '+12.1%', icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
        { label: 'Treatment Conversion', value: `${stats.conversionRate}%`, trend: '+2.4%', icon: Target, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { label: 'Active Personnel', value: stats.activeStaff, trend: 'Stable', icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    ];

    return (
        <div className="animate-slide-up space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Globe className="text-primary animate-pulse" />
                        Master Performance Lexicon
                    </h2>
                    <p className={`text-sm font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Administrative God-View • Multi-Branch Health Hierarchy
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className={`px-5 py-2.5 rounded-xl font-bold text-xs border border-white/10 ${isDark ? 'bg-white/5 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500'} transition-all`}>
                        Export Audit Log
                    </button>
                    <button onClick={fetchMasterData} className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-xs shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                        <Activity size={14} /> Refresh Matrix
                    </button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpiCards.map((card, idx) => (
                    <div key={idx} className={`p-8 rounded-[2rem] border relative overflow-hidden group hover:-translate-y-1 transition-all duration-500 ease-fluid ${isDark ? 'bg-surface/80 border-primary/10 shadow-glass hover:border-primary/30 hover:shadow-neon' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}>
                        <div className={`absolute -right-4 -top-4 p-8 opacity-5 group-hover:scale-125 group-hover:opacity-10 transition-all ${card.color}`}><card.icon size={80} /></div>
                        <div className={`w-12 h-12 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center mb-6`}>
                            <card.icon size={22} />
                        </div>
                        <p className={`font-display font-medium text-[11px] tracking-widest mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{card.label}</p>
                        <div className="flex items-baseline gap-3">
                            <h3 className="text-3xl font-bold tracking-tight">{card.value}</h3>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg flex items-center gap-1 ${card.trend.includes('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                {card.trend.includes('+') ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                {card.trend}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Intelligence */}
                <div className={`lg:col-span-2 p-10 rounded-[3rem] border transition-all duration-500 ease-fluid ${isDark ? 'bg-surface/80 border-primary/10 shadow-glass hover:border-primary/20 hover:shadow-neon' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}>
                    <div className="flex justify-between items-center mb-10">
                        <h4 className="text-xl font-bold flex items-center gap-3">
                            <BarChart3 className="text-primary" />
                            Financial Trajectory
                        </h4>
                        <select className={`rounded-xl px-4 py-2 text-[10px] font-bold border outline-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`}>
                            <option>Last 6 Months</option>
                            <option>Last 12 Months</option>
                            <option>YTD Performance</option>
                        </select>
                    </div>

                    <div className="h-[350px] w-full mt-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#135bec" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#135bec" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: isDark ? '#0f172a' : '#fff',
                                        borderRadius: '1.5rem',
                                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #f1f5f9',
                                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                                    }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#135bec" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                                <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorProfit)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Staff Leaderboard */}
                <div className={`p-10 rounded-[3rem] border transition-all duration-500 ease-fluid ${isDark ? 'bg-surface/80 border-primary/10 shadow-glass hover:border-primary/20 hover:shadow-neon' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}>
                    <h4 className="text-xl font-bold mb-8 flex items-center gap-3">
                        <Briefcase className="text-primary" />
                        Clinical Benchmarks
                    </h4>
                    <div className="space-y-6">
                        {topDoctors.map((doc, idx) => (
                            <div key={idx} className={`p-5 rounded-[2rem] border transition-all hover:bg-white/5 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm">
                                            {doc.name.split(' ')[1].charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{doc.name}</p>
                                            <p className="text-[11px] text-slate-500 font-display font-medium tracking-wide">{doc.conversion}% Conversion</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-emerald-500">₹{(doc.revenue / 1000).toFixed(1)}k</p>
                                        <p className="text-[9px] text-slate-500 font-display font-medium">Generated</p>
                                    </div>
                                </div>
                                <div className="w-full h-1.5 bg-slate-800/20 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all duration-1000"
                                        style={{ width: `${doc.conversion}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 hover:border-amber-500/30 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-4">
                            <ShieldCheck className="text-amber-500" size={18} />
                            <h5 className="text-xs font-display font-medium tracking-widest text-amber-500">Strategic Alert</h5>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed italic">
                            Overall conversion velocity has increased by 14% since implementing automated follow-ups. Recommendation: Reward top clinical performers.
                        </p>
                    </div>
                </div>
            </div>

            {/* Audit Log / Recent Activity */}
            <div className={`p-10 rounded-[3rem] border transition-all duration-500 ease-fluid ${isDark ? 'bg-surface/80 border-primary/10 shadow-glass hover:border-primary/20 hover:shadow-neon' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}>
                <div className="flex justify-between items-center mb-8">
                    <h4 className="text-xl font-bold">Global Clinical Ledger</h4>
                    <button className="text-primary text-xs font-display font-medium tracking-wide hover:underline">View Full Audit Trail</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="pb-4 text-[11px] font-display font-medium tracking-wide text-slate-500">Timestamp</th>
                                <th className="pb-4 text-[11px] font-display font-medium tracking-wide text-slate-500">Entity</th>
                                <th className="pb-4 text-[11px] font-display font-medium tracking-wide text-slate-500">Transaction</th>
                                <th className="pb-4 text-[11px] font-display font-medium tracking-wide text-slate-500">Status</th>
                                <th className="pb-4 text-[11px] font-display font-medium tracking-wide text-slate-500 text-right">Magnitude</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {[1, 2, 3, 4, 5].map((_, i) => (
                                <tr key={i} className="group hover:bg-white/5 transition-all">
                                    <td className="py-4 text-xs font-bold text-slate-400">Today, 14:2{i} PM</td>
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                                <Briefcase size={14} className="text-slate-500" />
                                            </div>
                                            <span className="text-sm font-bold">Billing ID #823{i}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 text-sm font-medium text-slate-400">Treatment Plan Locked</td>
                                    <td className="py-4">
                                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[10px] font-display font-medium">Synced</span>
                                    </td>
                                    <td className="py-4 text-right">
                                        <span className="font-bold text-white">₹{(Math.random() * 5000 + 1000).toFixed(0)}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
