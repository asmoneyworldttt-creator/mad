
import { TrendingUp, TrendingDown, DollarSign, Download, CreditCard, CheckCircle2, FileText, Table, Plus, Trash2, Users } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { useState, useEffect } from 'react';
import { useToast } from '../Toast';
import { supabase } from '../../supabase';
import { Modal } from '../Modal';

type UserRole = 'admin' | 'staff' | 'doctor' | 'patient';

const COLORS = ['#135bec', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const formatINR = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

export function Earnings({ userRole, theme }: { userRole: UserRole; theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [activeTab, setActiveTab] = useState<'Revenue' | 'Payroll'>('Revenue');
    const [filterRange, setFilterRange] = useState('This Month');
    const [bills, setBills] = useState<any[]>([]);
    const [treatmentProfitability, setTreatmentProfitability] = useState<any[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
    const [payrollLogs, setPayrollLogs] = useState<any[]>([]);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
    const [showPayrollModal, setShowPayrollModal] = useState(false);
    const [payrollForm, setPayrollForm] = useState({ staffId: '', amount: 0, bonus: 0, deductions: 0, month: new Date().toISOString().slice(0, 7), method: 'Bank Transfer', notes: '' });

    useEffect(() => {
        fetchFinancialData();

        const channel = supabase.channel('earnings_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, fetchFinancialData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'payroll_transactions' }, fetchFinancialData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_members' }, fetchFinancialData)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [filterRange]);

    const getDateRange = () => {
        const now = new Date();
        let from = new Date();
        if (filterRange === 'Today') { from = new Date(now.toDateString()); }
        else if (filterRange === 'This Week') { from.setDate(now.getDate() - 7); }
        else if (filterRange === 'This Month') { from = new Date(now.getFullYear(), now.getMonth(), 1); }
        else if (filterRange === 'Last 3 Months') { from.setMonth(now.getMonth() - 3); }
        else if (filterRange === 'This Year') { from = new Date(now.getFullYear(), 0, 1); }
        return { from: from.toISOString().split('T')[0], to: now.toISOString().split('T')[0] };
    };

    const fetchFinancialData = async () => {
        const { from, to } = getDateRange();

        // Fetch bills (revenue)
        const { data: billsData } = await supabase
            .from('bills')
            .select('*, patients(name, id)')
            .gte('date', from).lte('date', to)
            .order('date', { ascending: false });
        if (billsData) setBills(billsData);

        // Fetch treatment profitability from patient_history
        const { data: historyData } = await supabase.from('patient_history').select('*').gte('date', from).lte('date', to);
        if (historyData) {
            const profitMap: Record<string, number> = {};
            historyData.forEach((h: any) => {
                if (h.treatment) profitMap[h.treatment] = (profitMap[h.treatment] || 0) + Number(h.cost || 0);
            });
            const topProfits = Object.entries(profitMap)
                .map(([name, revenue]) => ({ name, revenue }))
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 10);
            setTreatmentProfitability(topProfits);
        }

        // Fetch real staff from DB
        const { data: staffData } = await supabase.from('staff').select('*').order('name');
        if (staffData) setStaff(staffData);

        // Fetch payroll logs
        const { data: payrollData } = await supabase
            .from('payroll_transactions')
            .select('*, staff_members(full_name, role_title)')
            .order('payment_date', { ascending: false });
        if (payrollData) setPayrollLogs(payrollData);
    };

    const handleAddPayroll = async (e: React.FormEvent) => {
        e.preventDefault();
        const net = Number(payrollForm.amount) + Number(payrollForm.bonus) - Number(payrollForm.deductions);
        const { error } = await supabase.from('payroll_transactions').insert({
            staff_id: payrollForm.staffId || null,
            staff_name: staff.find(s => s.id.toString() === payrollForm.staffId)?.name || 'Staff Member',
            role_title: staff.find(s => s.id.toString() === payrollForm.staffId)?.role || 'Staff',
            month_year: payrollForm.month,
            salary_amount: payrollForm.amount,
            bonus_amount: payrollForm.bonus,
            deductions: payrollForm.deductions,
            net_paid: net,
            payment_date: new Date().toISOString().split('T')[0],
            payment_status: 'Paid',
            payment_method: payrollForm.method,
            notes: payrollForm.notes
        });
        if (error) {
            showToast('Error saving payroll: ' + error.message, 'error');
        } else {
            showToast('Payroll record saved successfully!', 'success');
            setShowPayrollModal(false);
            fetchFinancialData();
        }
    };

    const handleExport = (type: 'revenue' | 'payroll', format: 'csv' | 'xls' | 'pdf') => {
        setIsExporting(true);
        showToast(`Preparing ${format.toUpperCase()} export...`, 'success');
        setTimeout(() => {
            if (format === 'pdf') { window.print(); setIsExporting(false); return; }
            const content = type === 'revenue'
                ? "Date,Patient,Amount,Status\n" + bills.map(b => `${b.date},${b.patients?.name || 'N/A'},${b.amount},${b.status || 'Paid'}`).join('\n')
                : "Month,Staff,Role,Salary,Bonus,Deductions,Net Paid,Method\n" + payrollLogs.map(p => `${p.month_year},${p.staff_name},${p.role_title},${p.salary_amount},${p.bonus_amount},${p.deductions},${p.net_paid},${p.payment_method}`).join('\n');
            const mimeType = format === 'xls' ? 'application/vnd.ms-excel' : 'text/csv';
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `Dentora_${type}_${Date.now()}.${format === 'xls' ? 'xls' : 'csv'}`; a.click();
            URL.revokeObjectURL(url);
            setIsExporting(false);
            showToast(`${format.toUpperCase()} exported!`, 'success');
        }, 800);
    };

    const totalRevenue = bills.reduce((a, b) => a + Number(b.amount || 0), 0);
    const totalPayroll = payrollLogs.reduce((a, b) => a + Number(b.net_paid || 0), 0);
    const avgTicket = bills.length > 0 ? totalRevenue / bills.length : 0;
    const paidBills = bills.filter(b => b.status === 'Paid').length;
    const conversionRate = bills.length > 0 ? Math.round((paidBills / bills.length) * 100) : 0;

    // Pie chart data for payment methods
    const paymentMethodMap: Record<string, number> = {};
    bills.forEach(b => {
        const method = b.payment_method || 'Cash';
        paymentMethodMap[method] = (paymentMethodMap[method] || 0) + Number(b.amount || 0);
    });
    const pieData = Object.entries(paymentMethodMap).map(([name, value]) => ({ name, value }));

    return (
        <div className={`animate-slide-up space-y-8 pb-10 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {/* Header */}
            <div className={`p-8 rounded-[2.5rem] border flex flex-col md:flex-row justify-between items-center gap-6 ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div>
                    <h2 className="text-3xl font-sans font-bold tracking-tight">Financial Hub</h2>
                    <p className="text-slate-400 font-medium mt-1">Live revenue & payroll analytics — synced from database.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`p-1 rounded-2xl border flex gap-1 ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                        <button onClick={() => setActiveTab('Revenue')} className={`px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'Revenue' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-primary'}`}>Revenue</button>
                        <button onClick={() => setActiveTab('Payroll')} className={`px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'Payroll' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-primary'}`}>Payroll</button>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Revenue', value: formatINR(totalRevenue), color: 'text-emerald-500', icon: TrendingUp },
                        { label: 'Avg Ticket', value: formatINR(avgTicket), color: 'text-primary', icon: DollarSign },
                        { label: 'Conversion', value: `${conversionRate}%`, color: 'text-amber-500', icon: CheckCircle2 },
                        { label: 'Total Payroll', value: formatINR(totalPayroll), color: 'text-rose-500', icon: Users },
                    ].map(({ label, value, color, icon: Icon }) => (
                        <div key={label} className={`p-5 rounded-[2rem] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <Icon size={14} className={color} />
                                <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">{label}</p>
                            </div>
                            <h3 className={`text-xl font-sans font-bold ${color}`}>{value}</h3>
                        </div>
                    ))}
                </div>
                <div className="flex gap-3">
                    <select value={filterRange} onChange={e => setFilterRange(e.target.value)} className={`px-5 py-3.5 rounded-2xl font-bold text-xs outline-none border ${isDark ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-700'}`}>
                        <option>Today</option>
                        <option>This Week</option>
                        <option>This Month</option>
                        <option>Last 3 Months</option>
                        <option>This Year</option>
                    </select>
                    <div className={`flex gap-1 p-1 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
                        <button onClick={() => handleExport(activeTab.toLowerCase() as any, 'xls')} className="px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-extrabold text-[10px] uppercase flex items-center gap-2 active:scale-95"><Table size={12} /> XLS</button>
                        <button onClick={() => handleExport(activeTab.toLowerCase() as any, 'pdf')} className="px-4 py-2.5 rounded-xl bg-rose-500 text-white font-extrabold text-[10px] uppercase flex items-center gap-2 active:scale-95"><FileText size={12} /> PDF</button>
                        <button onClick={() => handleExport(activeTab.toLowerCase() as any, 'csv')} className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-extrabold text-[10px] uppercase flex items-center gap-2 active:scale-95"><Download size={12} /> CSV</button>
                    </div>
                </div>
            </div>

            {activeTab === 'Revenue' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Treatment Revenue Chart */}
                        <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-3"><TrendingUp size={24} className="text-primary" /> Revenue by Treatment</h3>
                            {treatmentProfitability.length > 0 ? (
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={treatmentProfitability} layout="vertical" margin={{ left: 100, right: 30 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? '#1E293B' : '#f1f5f9'} />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 800 }} width={120} />
                                            <Tooltip formatter={(v: any) => formatINR(v)} contentStyle={{ borderRadius: '16px', border: 'none', background: isDark ? '#0F172A' : '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} />
                                            <Bar dataKey="revenue" fill="#135bec" radius={[0, 10, 10, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-32 flex items-center justify-center text-slate-400 italic">No treatment history data for this period.</div>
                            )}
                        </div>

                        {/* Bills Table */}
                        <div className={`rounded-[2.5rem] border overflow-hidden ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                            <div className={`px-8 py-6 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                                <h3 className="font-bold text-lg">Transaction Ledger</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500 bg-white/5' : 'text-slate-400 bg-slate-50'}`}>
                                            <th className="px-8 py-5">Date</th>
                                            <th className="px-8 py-5">Patient</th>
                                            <th className="px-8 py-5 text-right">Amount</th>
                                            <th className="px-8 py-5 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100/10">
                                        {bills.length > 0 ? bills.map((b, idx) => (
                                            <tr key={idx} className={`transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                                                <td className="px-8 py-5 text-xs text-slate-500 font-bold">{new Date(b.date).toLocaleDateString('en-IN')}</td>
                                                <td className="px-8 py-5">
                                                    <p className="font-bold text-sm">{b.patients?.name || b.patient_name || 'N/A'}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">INV-{(b.id || '').toString().slice(-6)}</p>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <span className="font-sans font-bold text-lg text-primary">{formatINR(b.amount)}</span>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-extrabold border uppercase ${b.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                                                        {b.status || 'Paid'}
                                                    </span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic">No transactions found for this period.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Payment Method Breakdown */}
                        <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                            <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-slate-400">Payment Channels</h4>
                            {pieData.length > 0 ? (
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={4}>
                                                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip formatter={(v: any) => formatINR(v)} contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '11px' }} />
                                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', fontWeight: 800 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : <div className="h-32 flex items-center justify-center text-slate-400 italic text-sm">No payment data yet.</div>}
                        </div>

                        {/* Intelligence Panel */}
                        <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-slate-950 border-white/5' : 'bg-slate-900 text-white'}`}>
                            <h4 className="text-xs font-extrabold tracking-[0.2em] uppercase text-primary mb-6">Revenue Intelligence</h4>
                            <div className="space-y-5">
                                <div className={`p-5 rounded-2xl ${isDark ? 'bg-white/5 border border-white/5' : 'bg-white/10'}`}>
                                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Avg Ticket</p>
                                    <p className="text-2xl font-bold text-white">{formatINR(avgTicket)}</p>
                                </div>
                                <div className={`p-5 rounded-2xl ${isDark ? 'bg-white/5 border border-white/5' : 'bg-white/10'}`}>
                                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Collection Rate</p>
                                    <p className="text-2xl font-bold text-emerald-400">{conversionRate}%</p>
                                </div>
                                <div className={`p-5 rounded-2xl ${isDark ? 'bg-white/5 border border-white/5' : 'bg-white/10'}`}>
                                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Total Bills</p>
                                    <p className="text-2xl font-bold text-white">{bills.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Payroll Tab */
                <div className="space-y-8 animate-slide-up">
                    <div className="flex justify-end">
                        <button onClick={() => setShowPayrollModal(true)} className="flex items-center gap-2 px-6 py-3.5 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all">
                            <Plus size={18} /> Add Payroll Entry
                        </button>
                    </div>

                    {/* Staff Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {staff.map(s => {
                            const staffLogs = payrollLogs.filter(p => p.staff_name === s.name || p.staff_id === s.id.toString());
                            const totalPaid = staffLogs.reduce((a, b) => a + Number(b.net_paid || 0), 0);
                            const isSelected = selectedStaff === s.id.toString();
                            return (
                                <div key={s.id} onClick={() => setSelectedStaff(isSelected ? null : s.id.toString())} className={`p-6 rounded-[2rem] border cursor-pointer transition-all hover:scale-[1.02] ${isSelected ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20' : isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-lg ${isSelected ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>{s.name?.charAt(0)}</div>
                                        <div className="overflow-hidden">
                                            <p className="font-bold truncate text-sm">{s.name}</p>
                                            <p className={`text-[9px] font-extrabold uppercase tracking-widest ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>{s.role}</p>
                                        </div>
                                    </div>
                                    <p className={`text-[10px] font-extrabold uppercase tracking-widest mb-1 ${isSelected ? 'text-white/40' : 'text-slate-500'}`}>Total Paid</p>
                                    <p className="text-xl font-sans font-bold">{formatINR(totalPaid)}</p>
                                </div>
                            );
                        })}
                        {staff.length === 0 && (
                            <div className="col-span-full py-20 text-center text-slate-400 italic">No staff records found. Add staff in Team Hub.</div>
                        )}
                    </div>

                    {/* Payroll History for selected staff */}
                    {selectedStaff && (
                        <div className={`p-8 rounded-[2.5rem] border animate-slide-up ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100 shadow-sm'}`}>
                            <h3 className="text-xl font-bold mb-6">Payroll History: {staff.find(s => s.id.toString() === selectedStaff)?.name}</h3>
                            <div className="space-y-3">
                                {payrollLogs.filter(p => p.staff_id === selectedStaff || p.staff_name === staff.find(s => s.id.toString() === selectedStaff)?.name).map((h, i) => (
                                    <div key={i} className={`p-5 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                                        <div className="flex items-center gap-6">
                                            <span className="text-xs font-bold text-slate-400 w-28">{h.month_year}</span>
                                            <span className={`text-[10px] font-extrabold uppercase tracking-widest ${h.bonus_amount > 0 ? 'text-emerald-500' : 'text-slate-500'}`}>
                                                {h.bonus_amount > 0 ? `+ ${formatINR(h.bonus_amount)} Bonus` : 'Standard'}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-sans font-bold text-lg">{formatINR(h.net_paid)}</p>
                                            <p className="text-[10px] font-extrabold text-emerald-500 uppercase">{h.payment_method}</p>
                                        </div>
                                    </div>
                                ))}
                                {payrollLogs.filter(p => p.staff_id === selectedStaff || p.staff_name === staff.find(s => s.id.toString() === selectedStaff)?.name).length === 0 && (
                                    <p className="text-slate-400 italic text-center py-12">No payroll records for this staff member yet.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* All payroll table */}
                    <div className={`rounded-[2.5rem] border overflow-hidden ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                        <div className={`px-8 py-6 border-b ${isDark ? 'border-white/5' : 'border-slate-100'} flex justify-between items-center`}>
                            <h3 className="font-bold text-lg">All Payroll Records</h3>
                            <span className={`text-xs font-bold px-3 py-1 rounded-lg ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{payrollLogs.length} entries</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500 bg-white/5' : 'text-slate-400 bg-slate-50'}`}>
                                        <th className="px-8 py-4">Staff</th>
                                        <th className="px-8 py-4">Period</th>
                                        <th className="px-8 py-4">Salary</th>
                                        <th className="px-8 py-4">Bonus</th>
                                        <th className="px-8 py-4 text-right">Net Paid</th>
                                        <th className="px-8 py-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/10">
                                    {payrollLogs.map((p, i) => (
                                        <tr key={i} className={`transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                                            <td className="px-8 py-4">
                                                <p className="font-bold text-sm">{p.staff_name}</p>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-widest">{p.role_title}</p>
                                            </td>
                                            <td className="px-8 py-4 text-sm text-slate-400 font-bold">{p.month_year}</td>
                                            <td className="px-8 py-4 text-sm font-bold">{formatINR(p.salary_amount)}</td>
                                            <td className="px-8 py-4 text-sm font-bold text-emerald-500">{formatINR(p.bonus_amount || 0)}</td>
                                            <td className="px-8 py-4 text-right font-sans font-bold text-primary text-lg">{formatINR(p.net_paid)}</td>
                                            <td className="px-8 py-4 text-center">
                                                <span className="px-3 py-1 rounded-lg text-[9px] font-extrabold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase">{p.payment_status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {payrollLogs.length === 0 && (
                                        <tr><td colSpan={6} className="px-8 py-20 text-center text-slate-400 italic">No payroll records yet. Add one using the button above.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Payroll Modal */}
            <Modal isOpen={showPayrollModal} onClose={() => setShowPayrollModal(false)} title="Add Payroll Entry" maxWidth="max-w-lg">
                <form onSubmit={handleAddPayroll} className="space-y-5">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Staff Member</label>
                        <select value={payrollForm.staffId} onChange={e => setPayrollForm({ ...payrollForm, staffId: e.target.value })} required className="w-full border rounded-2xl px-4 py-3 text-sm font-bold outline-none bg-slate-50 border-slate-200 text-slate-900">
                            <option value="">Select Staff...</option>
                            {staff.map(s => <option key={s.id} value={s.id.toString()}>{s.name} — {s.role}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Month (YYYY-MM)</label>
                            <input type="month" value={payrollForm.month} onChange={e => setPayrollForm({ ...payrollForm, month: e.target.value })} required className="w-full border rounded-xl px-4 py-3 text-sm font-bold outline-none bg-slate-50 border-slate-200 text-slate-900" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Payment Method</label>
                            <select value={payrollForm.method} onChange={e => setPayrollForm({ ...payrollForm, method: e.target.value })} className="w-full border rounded-xl px-4 py-3 text-sm font-bold outline-none bg-slate-50 border-slate-200 text-slate-900 appearance-none">
                                <option>Bank Transfer</option><option>Cash</option><option>Cheque</option><option>UPI</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Salary (₹)</label>
                            <input type="number" value={payrollForm.amount} onChange={e => setPayrollForm({ ...payrollForm, amount: parseFloat(e.target.value) })} required className="w-full border rounded-xl px-4 py-3 text-sm font-bold outline-none bg-slate-50 border-slate-200 text-slate-900" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Bonus (₹)</label>
                            <input type="number" value={payrollForm.bonus} onChange={e => setPayrollForm({ ...payrollForm, bonus: parseFloat(e.target.value) })} className="w-full border rounded-xl px-4 py-3 text-sm font-bold outline-none bg-slate-50 border-slate-200 text-slate-900" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Deductions (₹)</label>
                            <input type="number" value={payrollForm.deductions} onChange={e => setPayrollForm({ ...payrollForm, deductions: parseFloat(e.target.value) })} className="w-full border rounded-xl px-4 py-3 text-sm font-bold outline-none bg-slate-50 border-slate-200 text-slate-900" />
                        </div>
                    </div>
                    <div className={`p-4 rounded-2xl border text-center ${payrollForm.amount > 0 ? 'bg-primary/5 border-primary/20' : 'bg-slate-50 border-slate-200'}`}>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Net Payable</p>
                        <p className="text-2xl font-bold text-primary">{formatINR(Number(payrollForm.amount) + Number(payrollForm.bonus) - Number(payrollForm.deductions))}</p>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Notes</label>
                        <textarea rows={2} value={payrollForm.notes} onChange={e => setPayrollForm({ ...payrollForm, notes: e.target.value })} placeholder="Optional remarks..." className="w-full border rounded-2xl px-4 py-3 text-sm font-medium outline-none bg-slate-50 border-slate-200 text-slate-900" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setShowPayrollModal(false)} className="flex-1 py-3.5 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
                        <button type="submit" className="flex-1 py-3.5 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">Save Payroll</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
