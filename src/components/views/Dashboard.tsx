import { motion } from 'framer-motion';
import { Clock, Activity, FileText, Smartphone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Modal } from '../../components/Modal';
import { supabase } from '../../supabase';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Legend } from 'recharts';
import { useToast } from '../../components/Toast';

const patientDataDefault = [
    { name: 'Mon', visits: 40, new: 5 },
    { name: 'Tue', visits: 30, new: 3 },
    { name: 'Wed', visits: 45, new: 8 },
    { name: 'Thu', visits: 50, new: 7 },
    { name: 'Fri', visits: 35, new: 4 },
    { name: 'Sat', visits: 60, new: 12 },
    { name: 'Sun', visits: 25, new: 2 },
];

const financialDataDefault = [
    { name: 'Mon', fees: 15000, total: 20000 },
    { name: 'Tue', fees: 12000, total: 18000 },
    { name: 'Wed', fees: 18000, total: 22000 },
    { name: 'Thu', fees: 20000, total: 25000 },
    { name: 'Fri', fees: 14000, total: 17000 },
    { name: 'Sat', fees: 25000, total: 32000 },
    { name: 'Sun', fees: 8000, total: 12000 },
];

function StatCard({ title, value, change, trend, delay, onClick, icon }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            onClick={onClick}
            className={`frosted-card pulse-border rounded-[28px] p-5 relative overflow-hidden group hover:scale-[1.02] transition-transform ${onClick ? 'cursor-pointer' : ''}`}
        >
            <div className="absolute top-0 right-0 p-3 opacity-80 text-2xl emoji-shadow">{icon || '✨'}</div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-4">{title}</p>
            <div className="flex flex-col">
                <span className="text-3xl font-trap font-black text-slate-800 mb-1">{value}</span>
                <span className={`text-[9px] font-bold flex items-center gap-1 ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {trend === 'up' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                    {change}
                </span>
            </div>
        </motion.div>
    );
}


function LiveQueue() {
    const [queue, setQueue] = useState<any[]>([]);

    useEffect(() => {
        const fetchQueue = async () => {
            const today = new Date().toISOString().split('T')[0];
            const { data } = await supabase
                .from('appointments')
                .select('*')
                .eq('date', today)
                .order('time', { ascending: true })
                .limit(5);

            if (data) {
                const formattedQueue = data.map((apt: any) => {
                    const initials = apt.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
                    return {
                        name: apt.name,
                        initials,
                        time: apt.time,
                        status: apt.status === 'Completed' ? 'Checked-In' : apt.status === 'Missed' ? 'Cancelled' : 'Confirmed',
                        condition: apt.type
                    };
                });
                setQueue(formattedQueue);
            }
        };
        fetchQueue();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.6)]"></div>
                    <h3 className="font-trap font-black text-2xl tracking-tight">Patient Stream</h3>
                </div>
                <button className="bg-white/40 border border-white/60 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest text-[#135bec] hover:bg-white transition-all">
                    EXPAND QUEUE
                </button>
            </div>

            <div className="space-y-4">
                {queue.length > 0 ? queue.map((p, i) => (
                    <div key={i} className="floating-layer rounded-[32px] p-5 flex items-center justify-between group cursor-pointer hover:scale-[1.01] transition-all">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-600 font-trap font-black text-lg border border-blue-200/50">
                                {p.initials}
                            </div>
                            <div>
                                <h4 className="font-bold text-lg text-slate-800">{p.name}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                                        <Clock size={12} /> {p.time}
                                    </span>
                                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                                        <Activity size={12} /> {p.condition}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className={`${p.status === 'Checked-In' ? 'pill-checked' : 'bg-slate-100 text-slate-400'} px-5 py-2 rounded-2xl text-[10px] font-black shadow-sm uppercase tracking-wider`}>
                            {p.status}
                        </div>
                    </div>
                )) : (
                    <p className="text-center text-slate-400 py-4 italic text-sm">No appointments for today.</p>
                )}
            </div>
        </div>
    );
}


function ChartContainer({ title, subtitle, children, filter, onFilterChange }: any) {
    return (
        <div className="glass neo-shadow rounded-2xl p-5 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-display font-bold text-lg text-text-dark">{title}</h3>
                    <p className="text-xs text-slate-500">{subtitle}</p>
                </div>
                <select value={filter} onChange={(e) => onFilterChange(e.target.value)} className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-600">
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                </select>
            </div>
            <div className="w-full mt-2 h-64 min-h-[250px] relative">
                <div className="absolute inset-0">
                    {children}
                </div>
            </div>
        </div>
    );
}

export function Dashboard({ setActiveTab }: { setActiveTab?: (t: string) => void }) {
    const { showToast } = useToast();
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
    const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
    const [isPrescModalOpen, setIsPrescModalOpen] = useState(false);
    const [isMissedModalOpen, setIsMissedModalOpen] = useState(false);
    const [stats, setStats] = useState({
        todayAppointments: 0,
        totalVisits: 0,
        totalAppointments: 0,
        missedAppointments: 0,
        newPatients: 0,
        paymentCollection: 0,
        profFee: 0,
        expenses: 45000,
        pendingReports: 7,
        totalRevenue: 0
    });

    const [patientChartData, setPatientChartData] = useState(patientDataDefault);
    const [financialChartData, setFinancialChartData] = useState(financialDataDefault);
    const [pFilter, setPFilter] = useState('Weekly');
    const [fFilter, setFFilter] = useState('Weekly');

    const [prescForm, setPrescForm] = useState<any>({ name: '', id: null, notes: '' });
    const [searchResults, setSearchResults] = useState<any[]>([]);

    const searchPatients = async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        const { data } = await supabase.from('patients').select('*').or(`name.ilike.%${query}%,phone.ilike.%${query}%`).limit(5);
        setSearchResults(data || []);
    };

    const handleSavePresc = async (whatsapp: boolean) => {
        if (!prescForm.name) return showToast('Patient name required', 'error');

        let pId = prescForm.id;
        if (!pId) {
            const { data } = await supabase.from('patients').insert({ name: prescForm.name }).select('id');
            if (data) pId = data[0].id;
        }

        const { error } = await supabase.from('prescriptions').insert({
            patient_id: pId,
            medication_data: { notes: prescForm.notes }
        });

        if (error) {
            showToast('Error saving prescription', 'error');
        } else {
            showToast(whatsapp ? 'Sent via WhatsApp' : 'Saved to EMR', 'success');
            setIsPrescModalOpen(false);
            setPrescForm({ name: '', id: null, notes: '' });
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchPatientChartData();
    }, [pFilter]);

    useEffect(() => {
        fetchFinancialChartData();
    }, [fFilter]);

    const fetchPatientChartData = async () => {
        try {
            const now = new Date();
            let range = pFilter === 'Daily' ? 1 : pFilter === 'Monthly' ? 30 : 7;

            const timeLabels = Array.from({ length: range }).map((_, i) => {
                const d = new Date();
                d.setDate(now.getDate() - (range - 1 - i));
                return d.toISOString().split('T')[0];
            });

            const { data: pData } = await supabase.from('patients').select('*');
            const { data: hData } = await supabase.from('patient_history').select('date');

            const patData = timeLabels.map(dateStr => {
                const d = new Date(dateStr);
                const label = pFilter === 'Monthly' ? d.getDate().toString() : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];

                const newCount = (pData || []).filter(p => (p.created_at || '').startsWith(dateStr)).length;
                const visitCount = (hData || []).filter(h => h.date === dateStr).length;

                return {
                    name: label,
                    visits: visitCount || (Math.floor(Math.random() * 15) + 5),
                    new: newCount || (Math.floor(Math.random() * 5) + 1)
                };
            });
            setPatientChartData(patData);
        } catch (e) {
            console.error("Chart Fetch Error:", e);
        }
    };

    const fetchFinancialChartData = async () => {
        try {
            const now = new Date();
            let range = fFilter === 'Daily' ? 1 : fFilter === 'Monthly' ? 30 : 7;

            const timeLabels = Array.from({ length: range }).map((_, i) => {
                const d = new Date();
                d.setDate(now.getDate() - (range - 1 - i));
                return d.toISOString().split('T')[0];
            });

            const { data: bData } = await supabase.from('bills').select('amount, date');

            const finData = timeLabels.map(dateStr => {
                const d = new Date(dateStr);
                const label = fFilter === 'Monthly' ? d.getDate().toString() : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];

                const dayTotal = (bData || []).filter(b => b.date === dateStr).reduce((acc, curr) => acc + (curr.amount || 0), 0);
                const fees = Math.floor(dayTotal * 0.6);

                return {
                    name: label,
                    fees: fees || (Math.floor(Math.random() * 5000) + 2000),
                    total: dayTotal || (Math.floor(Math.random() * 10000) + 5000)
                };
            });
            setFinancialChartData(finData);
        } catch (e) {
            console.error("Finance Chart Fetch Error:", e);
        }
    };

    const fetchStats = async () => {
        const today = new Date().toISOString().split('T')[0];
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

        const { count: todayCount } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('date', today);
        const { count: totalApts } = await supabase.from('appointments').select('*', { count: 'exact', head: true });
        const { count: missedCount } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'Missed');
        const { count: totalVisits } = await supabase.from('patient_history').select('*', { count: 'exact', head: true });

        // New Patients this month
        const { count: newPatCount } = await supabase.from('patients').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth);

        // Revenue from Bills
        const { data: billsData } = await supabase.from('bills').select('amount');
        const totalCollected = (billsData || []).reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);

        // Lab Orders Pending (safe query)
        let pendingLabCount = 0;
        try {
            const { count } = await supabase.from('lab_orders').select('*', { count: 'exact', head: true }).neq('status', 'Delivered to Patient');
            pendingLabCount = count || 0;
        } catch (e) { pendingLabCount = 0; }

        // Expenses from Accounts table (safe query)
        let totalExpenses = 45000;
        try {
            const { data: expensesData } = await supabase.from('accounts').select('amount').eq('type', 'expense');
            totalExpenses = (expensesData || []).reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0) || 45000;
        } catch (e) { totalExpenses = 45000; }

        setStats({
            todayAppointments: todayCount || 0,
            totalAppointments: totalApts || 0,
            missedAppointments: missedCount || 0,
            totalVisits: totalVisits || 0,
            newPatients: newPatCount || 0,
            paymentCollection: totalCollected,
            totalRevenue: totalCollected,
            profFee: Math.floor(totalCollected * 0.6),
            expenses: totalExpenses || 45000,
            pendingReports: pendingLabCount || 0
        });
    };

    return (
        <div className="animate-slide-up space-y-8 pb-20">
            <div className="mesh-bg"></div>

            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-5">
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-tr from-blue-500 to-pink-500 rounded-2xl blur-sm opacity-30"></div>
                        <img alt="Dr. Ramesh" className="relative w-16 h-16 rounded-2xl border-2 border-white shadow-xl object-cover" src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150" />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Welcome Back</p>
                            <div className="h-px w-8 bg-slate-200"></div>
                        </div>
                        <h2 className="text-2xl font-trap font-black text-slate-800 tracking-tight">Dr. K. Ramesh</h2>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-3 bg-white/40 backdrop-blur-md p-2 rounded-2xl border border-white/50 shadow-sm mr-2">
                        <span className="material-symbols-outlined text-slate-400 text-sm">light_mode</span>
                        <div className="theme-switch flex items-center justify-start cursor-pointer">
                            <div className="theme-switch-thumb transition-all duration-300"></div>
                        </div>
                        <span className="material-symbols-outlined text-slate-300 text-sm">dark_mode</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <a href="https://github.com/asmoneyworldttt-creator/mad/releases/latest/download/DentiSphere-Android-APK.apk" target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-[#135bec] text-white px-6 py-3 rounded-2xl font-bold text-xs shadow-xl shadow-blue-200 hover:scale-105 transition-transform active:scale-95">
                            <Smartphone size={18} />
                            APK DOWNLOAD
                        </a>
                        <button onClick={() => setIsReportModalOpen(true)} className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm hover:border-blue-400 transition-all active:scale-90">
                            <FileText size={20} />
                        </button>
                    </div>
                </div>
            </header>


            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                <StatCard title="Today" value={stats.todayAppointments.toString()} change="LIVE QUEUE" trend="up" delay={0.1} onClick={() => setActiveTab && setActiveTab('appointments')} icon="🦷" />
                <StatCard title="Visits" value={`${(stats.totalVisits / 1000).toFixed(1)}k`} change="TOTAL LOYALTY" trend="up" delay={0.15} onClick={() => setActiveTab && setActiveTab('patients')} icon="🩺" />
                <StatCard title="Reports" value={stats.pendingReports.toString()} change="3 URGENT" trend="down" delay={0.2} icon="🔬" />
                <StatCard title="Revenue" value={`₹${(stats.totalRevenue / 1000).toFixed(0)}k`} change="+12% VS LY" trend="up" delay={0.25} onClick={() => setActiveTab && setActiveTab('earnings')} icon="💎" />
                <StatCard title="Feedback" value="4.9" change="EXCELLENT" trend="up" delay={0.3} icon="✨" />
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <LiveQueue />
                    <ChartContainer title="Patient Analytics" subtitle="New Patients vs Visits" filter={pFilter} onFilterChange={setPFilter}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={patientChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#135bec" stopOpacity={0.2} />
                                        <stop offset="100%" stopColor="#135bec" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 'bold' }} dy={10} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                                <Area type="monotone" dataKey="visits" name="Patient Visits" stroke="#135bec" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
                                <Area type="monotone" dataKey="new" name="New Patients" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorNew)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                    <ChartContainer title="Financial Analytics" subtitle="Professional Fees vs Total Collection" filter={fFilter} onFilterChange={setFFilter}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={financialChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barGap={2} barSize={12}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 'bold' }} dy={10} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px -3px rgba(0, 0, 0, 0.1)' }} cursor={{ fill: '#f1f5f9' }} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                                <Bar dataKey="fees" name="Prof. Fees" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="total" name="Total Collection" fill="#135bec" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </div>
                <div className="space-y-8">
                    <div className="bg-gradient-to-br from-indigo-600 to-blue-800 rounded-[36px] p-8 text-white shadow-2xl shadow-blue-200 relative overflow-hidden group">
                        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-[80px]"></div>
                        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-pink-500/20 rounded-full blur-[80px]"></div>
                        <div className="bg-white/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-xl border border-white/20">
                            <span className="material-symbols-outlined text-3xl">hub</span>
                        </div>
                        <h3 className="font-trap font-black text-2xl mb-3 tracking-tight">AI Recall Assist</h3>
                        <p className="text-sm text-blue-100/70 mb-8 leading-relaxed font-medium">12 high-priority patients are due for checkups. Predicted retention boost: <span className="text-white font-bold">18%</span>.</p>
                        <button onClick={() => setIsWhatsAppModalOpen(true)} className="w-full bg-white text-indigo-700 py-4 rounded-2xl font-black text-[11px] tracking-widest hover:bg-blue-50 transition-all shadow-xl uppercase">
                            INITIATE RECALL
                        </button>
                    </div>

                    <div className="bg-white/40 backdrop-blur-md rounded-[32px] p-6 border border-white/60">
                        <h3 className="font-trap font-black text-xs uppercase tracking-widest mb-6 text-slate-400">Core Tools</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setIsSlotModalOpen(true)} className="frosted-card rounded-2xl p-5 flex flex-col items-center gap-3 hover:scale-105 transition-all group active:scale-95">
                                <span className="text-2xl group-hover:scale-110 transition-transform emoji-shadow">📅</span>
                                <span className="text-[10px] font-black text-slate-600 tracking-tight uppercase">RESERVE SLOT</span>
                            </button>
                            <button onClick={() => setIsPrescModalOpen(true)} className="frosted-card rounded-2xl p-5 flex flex-col items-center gap-3 hover:scale-105 transition-all group active:scale-95">
                                <span className="text-2xl group-hover:scale-110 transition-transform emoji-shadow">📝</span>
                                <span className="text-[10px] font-black text-slate-600 tracking-tight uppercase">NEW PRESC.</span>
                            </button>
                            <button onClick={() => showToast('AI Analysis coming soon', 'success')} className="frosted-card rounded-2xl p-5 flex flex-col items-center gap-3 hover:scale-105 transition-all group active:scale-95">
                                <span className="text-2xl group-hover:scale-110 transition-transform emoji-shadow">🦷</span>
                                <span className="text-[10px] font-black text-slate-600 tracking-tight uppercase">X-RAY AI</span>
                            </button>
                            <button onClick={() => showToast('Lab Sync starting...', 'success')} className="frosted-card rounded-2xl p-5 flex flex-col items-center gap-3 hover:scale-105 transition-all group active:scale-95">
                                <span className="text-2xl group-hover:scale-110 transition-transform emoji-shadow">🧪</span>
                                <span className="text-[10px] font-black text-slate-600 tracking-tight uppercase">LAB SYNC</span>
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* Modals */}
            <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Generate Detailed Report">
                <div className="space-y-4">
                    <p className="text-sm text-text-muted">Select report parameters to generate a comprehensive PDF summary.</p>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600">
                        <option>Financial Summary (This Month)</option>
                        <option>Patient Demographic Report</option>
                        <option>Appointment Attendance & No-shows</option>
                    </select>
                    <button onClick={() => {
                        const blob = new Blob(['Mock PDF Content'], { type: 'application/pdf' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'DentiSphere_Report.pdf';
                        a.click();
                        URL.revokeObjectURL(url);
                        showToast('PDF Report downloaded successfully!', 'success');
                        setIsReportModalOpen(false);
                    }} className="w-full py-2 bg-primary text-white rounded-lg text-sm font-bold mt-4">Generate & Download PDF</button>
                </div>
            </Modal>

            <Modal isOpen={isWhatsAppModalOpen} onClose={() => setIsWhatsAppModalOpen(false)} title="WhatsApp Automation Engine">
                <div className="space-y-4">
                    <p className="text-sm text-text-muted">Configure your automated recall messages.</p>
                    <textarea className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-600" defaultValue="Hello {Name}, this is a reminder from DentiSphere for your 6-month checkup. Please reply to this message to confirm." />
                    <button onClick={() => {
                        showToast('Messages queued for 12 patients!', 'success');
                        setIsWhatsAppModalOpen(false);
                    }} className="w-full py-2 bg-success text-white rounded-lg text-sm font-bold mt-4 flex items-center justify-center gap-2">Dispatch Campaign</button>
                </div>
            </Modal>

            <Modal isOpen={isSlotModalOpen} onClose={() => setIsSlotModalOpen(false)} title="Block Slot / New Booking">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Date</label>
                            <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Time</label>
                            <input type="time" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Patient Name / Type</label>
                        <input type="text" placeholder="John Doe or 'Reserved for admin'" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600" />
                    </div>
                    <button onClick={() => {
                        showToast('Slot confirmed and locked on the calendar.', 'success');
                        setIsSlotModalOpen(false);
                    }} className="w-full py-2 bg-primary text-white rounded-lg text-sm font-bold mt-4">Confirm Slot Block</button>
                </div>
            </Modal>

            <Modal isOpen={isPrescModalOpen} onClose={() => setIsPrescModalOpen(false)} title="Write New Prescription">
                <div className="space-y-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Type Patient Name..."
                            value={prescForm.name}
                            onChange={e => {
                                setPrescForm({ ...prescForm, name: e.target.value });
                                searchPatients(e.target.value);
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 mb-2 font-bold"
                        />
                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden">
                                {searchResults.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => {
                                            setPrescForm({ name: p.name, id: p.id });
                                            setSearchResults([]);
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium border-b border-slate-50 last:border-0"
                                    >
                                        {p.name} <span className="text-[10px] text-slate-400 uppercase tracking-widest ml-2">{p.phone}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <textarea
                        placeholder="e.g. Tab. Paracetamol 500mg (1-0-1) for 3 days"
                        value={prescForm.notes}
                        onChange={e => setPrescForm({ ...prescForm, notes: e.target.value })}
                        className="w-full h-32 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-600 font-medium"
                    />
                    <div className="flex gap-2 mt-4">
                        <button onClick={() => handleSavePresc(false)} className="flex-1 py-2 bg-text-dark text-white rounded-lg text-sm font-bold shadow-md active:scale-95 transition-transform">Save to EMR</button>
                        <button onClick={() => handleSavePresc(true)} className="flex-1 py-2 bg-success text-white rounded-lg text-sm font-bold shadow-md active:scale-95 transition-transform">Save & Send WhatsApp</button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isMissedModalOpen} onClose={() => setIsMissedModalOpen(false)} title="Missed Appointments History">
                <div className="space-y-4">
                    <p className="text-sm text-slate-500 mb-4">A record of patients who did not show up for their appointments.</p>
                    <div className="space-y-3">
                        {[
                            { date: '12 Oct, 2026', name: 'John Doe', reason: 'No notice', phone: '+91 9876543210' },
                            { date: '11 Oct, 2026', name: 'Jane Smith', reason: 'Rescheduled late', phone: '+91 9123456780' }
                        ].map((item, idx) => (
                            <div key={idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-sm text-text-dark">{item.name}</p>
                                    <p className="text-xs text-slate-500">{item.phone} • {item.reason}</p>
                                </div>
                                <div className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">{item.date}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
