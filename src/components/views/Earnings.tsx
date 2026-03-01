import { TrendingUp, TrendingDown, DollarSign, Download, CreditCard, ChevronDown, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useState, useEffect } from 'react';
import { useToast } from '../Toast';
import { supabase } from '../../supabase';

const TN_DOCTORS = [
    { id: '1', name: 'Dr. K. Ramesh', role: 'Associate Dentist', salary: 120000 },
    { id: '2', name: 'Dr. S. Priya', role: 'Endodontist', salary: 150000 },
    { id: '3', name: 'Dr. M. Karthik', role: 'Orthodontist', salary: 180000 },
    { id: '4', name: 'Dr. A. Lakshmi', role: 'Periodontist', salary: 140000 },
    { id: '5', name: 'Dr. V. Vijay', role: 'Oral Surgeon', salary: 200000 },
    { id: '6', name: 'Dr. R. Anitha', role: 'Prosthodontist', salary: 160000 },
    { id: '7', name: 'Dr. G. Balaji', role: 'General Dentist', salary: 110000 },
    { id: '8', name: 'Dr. D. Shalini', role: 'Pediatric Dentist', salary: 130000 },
    { id: '9', name: 'Dr. P. Senthil', role: 'Implantologist', salary: 190000 },
    { id: '10', name: 'Dr. J. Meena', role: 'Associate Dentist', salary: 120000 }
];

const generatePayrollHistory = (baseSalary: number) => {
    const months = ['Jan 2027', 'Dec 2026', 'Nov 2026', 'Oct 2026', 'Sep 2026', 'Aug 2026'];
    return months.map(m => ({
        month: m,
        base: baseSalary,
        bonus: Math.floor(Math.random() * 10000),
        status: 'Paid',
        method: 'Bank Transfer'
    }));
};

const staffPayrollData = TN_DOCTORS.map(doc => ({
    ...doc,
    history: generatePayrollHistory(doc.salary),
    totalPaid: generatePayrollHistory(doc.salary).reduce((acc, curr) => acc + curr.base + curr.bonus, 0)
}));

export function Earnings() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'Revenue' | 'Payroll'>('Revenue');
    const [filterRange, setFilterRange] = useState('This Month');
    const [bills, setBills] = useState<any[]>([]);
    const [treatmentProfitability, setTreatmentProfitability] = useState<any[]>([]);
    const [showProfitBreakdown, setShowProfitBreakdown] = useState<string | null>(null);
    const [selectedStaff, setSelectedStaff] = useState<string | null>(null);

    useEffect(() => {
        fetchFinancialData();
    }, [filterRange]);

    const fetchFinancialData = async () => {
        const { data: billsData } = await supabase.from('bills').select('*, patients(name, id)');
        if (billsData) {
            setBills(billsData);
        }

        const { data: historyData } = await supabase.from('patient_history').select('*');
        if (historyData) {
            const profitMap: Record<string, number> = {};
            historyData.forEach((h: any) => {
                if (h.treatment) {
                    profitMap[h.treatment] = (profitMap[h.treatment] || 0) + Number(h.cost || 0);
                }
            });
            const topProfits = Object.entries(profitMap).map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue);
            setTreatmentProfitability(topProfits);
        }
    };

    const handleExport = (type: 'revenue' | 'payroll') => {
        showToast(`Preparing ${type} report...`, 'success');
        const content = type === 'revenue'
            ? "Date,Patient,Amount,Status\n" + bills.map(b => `${b.date},${b.patients?.name},${b.amount},${b.status}`).join('\n')
            : "Staff ID,Name,Role,Total Paid\n" + staffPayrollData.map(s => `${s.id},${s.name},${s.role},${s.totalPaid}`).join('\n');

        const blob = new Blob([content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DentiSphere_${type}_Report.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} report downloaded successfully!`, 'success');
    };

    const totalRevenue = treatmentProfitability.reduce((a, b) => a + b.revenue, 0);
    const totalPayroll = staffPayrollData.reduce((a, b) => a + b.totalPaid, 0);

    return (
        <div className="animate-slide-up space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold text-text-dark tracking-tight">Financial Hub</h2>
                    <p className="text-text-muted font-medium font-bold text-xs uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full inline-block mt-2">DentiSphere Analytics</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={() => setActiveTab('Revenue')} className={`flex-1 md:flex-none px-6 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'Revenue' ? 'bg-primary text-white shadow-premium' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Clinic Revenue</button>
                    <button onClick={() => setActiveTab('Payroll')} className={`flex-1 md:flex-none px-6 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'Payroll' ? 'bg-primary text-white shadow-premium' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Staff Payroll</button>
                </div>
            </div>

            {activeTab === 'Revenue' ? (
                <>
                    <div className="flex justify-end gap-3">
                        <select value={filterRange} onChange={e => setFilterRange(e.target.value)} className="bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-[1.25rem] text-sm font-bold shadow-sm outline-none">
                            <option>Today</option>
                            <option>Yesterday</option>
                            <option>This Week</option>
                            <option>This Month</option>
                        </select>
                        <button onClick={() => handleExport('revenue')} className="px-6 py-3 bg-slate-900 border border-slate-800 text-white rounded-[1.25rem] text-sm font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg">
                            <Download size={18} /> Export Data
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6"><TrendingUp size={24} /></div>
                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-2">Gross Revenue ({filterRange})</p>
                            <div className="flex items-center gap-3">
                                <h3 className="text-4xl font-display font-bold text-text-dark">₹{totalRevenue.toLocaleString('en-IN')}</h3>
                                <span className="text-[10px] font-extrabold bg-green-50 text-green-600 px-2 py-0.5 rounded-full border border-green-100">+14.5%</span>
                            </div>
                        </div>
                        <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all cursor-pointer" onClick={() => setShowProfitBreakdown('all')}>
                            <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-50/50 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6"><DollarSign size={24} /></div>
                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-2">Service Analysis</p>
                            <div className="flex items-center gap-3">
                                <h3 className="text-2xl font-display font-bold text-text-dark">Detailed Insights</h3>
                                <div className="p-2 bg-blue-600 text-white rounded-lg"><ChevronDown size={14} /></div>
                            </div>
                        </div>
                        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden text-white">
                            <div className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-6"><TrendingDown size={24} /></div>
                            <p className="text-[10px] font-extrabold opacity-60 uppercase tracking-[0.2em] mb-2">Outstanding Dues</p>
                            <div className="flex items-center gap-3">
                                <h3 className="text-4xl font-display font-bold">₹42,000</h3>
                                <button onClick={() => showToast('Reminders sent to 8 patients', 'success')} className="text-[10px] font-extrabold bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-primary/20">SEND ALERTS</button>
                            </div>
                        </div>
                    </div>

                    {showProfitBreakdown && (
                        <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-lg animate-slide-up relative">
                            <button onClick={() => setShowProfitBreakdown(null)} className="absolute top-6 right-8 text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest">Close Analysis</button>
                            <h3 className="font-display font-bold text-xl text-slate-800 mb-8 flex items-center gap-3">
                                <div className="w-2 h-8 bg-primary rounded-full" />
                                Profitability by Treatment Type
                            </h3>
                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={treatmentProfitability.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 30, left: 100, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }} width={180} />
                                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }} formatter={(value: any) => [`₹${(value || 0).toLocaleString('en-IN')}`, 'Revenue']} />
                                        <Bar dataKey="revenue" fill="#135bec" radius={[0, 8, 8, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col mt-6">
                        <div className="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/30">
                            <h3 className="font-display font-bold text-xl text-text-dark">Live Collection History</h3>
                            <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 uppercase tracking-widest animate-pulse">Synced Real-time</span>
                        </div>
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase tracking-[0.2em] text-slate-400 font-extrabold">
                                        <th className="px-8 py-5">Date</th>
                                        <th className="px-8 py-5">Patient Identity</th>
                                        <th className="px-8 py-5 text-center">Amount Secured</th>
                                        <th className="px-8 py-5 text-right">Reference</th>
                                        <th className="px-8 py-5 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {bills.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-20 text-slate-300 font-bold italic">No financial transactions recorded.</td></tr>
                                    ) : bills.map((b, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-5 text-xs text-slate-500 font-bold">{new Date(b.date).toLocaleDateString()}</td>
                                            <td className="px-8 py-5 font-bold text-slate-800 text-sm">{b.patients?.name || 'Unknown Patient'}</td>
                                            <td className="px-8 py-5 text-center font-display font-bold text-primary text-lg">₹{b.amount.toLocaleString('en-IN')}</td>
                                            <td className="px-8 py-5 text-right text-[10px] font-extrabold text-slate-400 group-hover:text-primary transition-colors cursor-pointer uppercase tracking-widest">INV-00{b.id}</td>
                                            <td className="px-8 py-5 text-center">
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase border ${b.status === 'Paid' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                                    {b.status || 'Paid'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-center text-white">
                            <div className="w-14 h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-6"><CreditCard size={32} /></div>
                            <p className="text-[10px] font-extrabold opacity-60 uppercase tracking-[0.2em] mb-2">Total Payroll Disbursement</p>
                            <h3 className="text-5xl font-display font-bold">₹{totalPayroll.toLocaleString('en-IN')}</h3>
                            <button onClick={() => handleExport('payroll')} className="mt-8 py-4 bg-white text-slate-900 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-lg active:scale-95">Download Salary Statements</button>
                        </div>

                        <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm lg:col-span-2">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="font-display font-bold text-xl text-text-dark">Professional Fee Structure</h3>
                                <span className="text-[10px] font-extrabold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">10 Active Practitioners</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { role: 'Senior Associate', count: 3, total: 3400000 },
                                    { role: 'Consultant Specialist', count: 5, total: 5800000 },
                                    { role: 'Clinical Nurse', count: 2, total: 1200000 }
                                ].map((role, idx) => (
                                    <div key={idx} className="p-5 border border-slate-50 bg-slate-50/50 rounded-2xl group hover:border-primary/20 transition-all">
                                        <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-widest mb-4 group-hover:text-primary transition-colors">{role.role}</h4>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400">{role.count} Members</p>
                                                <p className="text-xs font-display font-bold text-slate-800 mt-1">₹{role.total.toLocaleString('en-IN')}</p>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-primary"><TrendingUp size={14} /></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                            <h3 className="font-display font-bold text-xl text-text-dark">Clinician Roster & Payout Logs</h3>
                            <button className="text-[10px] font-extrabold text-primary hover:underline uppercase tracking-widest">Audit Full History</button>
                        </div>
                        <div className="p-4 space-y-3">
                            {staffPayrollData.map((staff) => (
                                <div key={staff.id} className={`border border-slate-100 rounded-3xl overflow-hidden transition-all ${selectedStaff === staff.id ? 'shadow-lg border-primary/20 bg-slate-50/30' : 'hover:border-slate-200'}`}>
                                    <div
                                        className="p-6 flex justify-between items-center cursor-pointer"
                                        onClick={() => setSelectedStaff(selectedStaff === staff.id ? null : staff.id)}
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 bg-primary/10 text-primary rounded-[1.25rem] flex items-center justify-center font-display font-bold text-2xl shadow-inner border border-primary/5">
                                                {staff.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-display font-bold text-text-dark text-lg leading-tight">{staff.name}</p>
                                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-1">{staff.role}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="text-right hidden sm:block">
                                                <p className="font-display font-bold text-primary text-xl">₹{staff.totalPaid.toLocaleString('en-IN')}</p>
                                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Aggregate Payout</p>
                                            </div>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-400 transition-all ${selectedStaff === staff.id ? 'rotate-180 bg-primary text-white shadow-lg' : ''}`}>
                                                <ChevronDown size={20} />
                                            </div>
                                        </div>
                                    </div>
                                    {selectedStaff === staff.id && (
                                        <div className="px-8 pb-8 pt-2 animate-slide-up">
                                            <div className="flex items-center gap-2 mb-6 text-slate-400">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                <h4 className="font-extrabold text-[10px] uppercase tracking-[0.2em]">6-Month Disbursement Registry</h4>
                                            </div>
                                            <div className="space-y-3">
                                                {staff.history.map((h, i) => (
                                                    <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-white border border-slate-100 rounded-2xl text-sm hover:border-primary/20 transition-all group">
                                                        <div className="flex items-center gap-4 w-full sm:w-1/3">
                                                            <div className="bg-slate-50 p-2 rounded-lg text-slate-400 group-hover:text-primary transition-colors"><CheckCircle2 size={16} /></div>
                                                            <span className="font-bold text-slate-700 uppercase text-xs tracking-tight">{h.month}</span>
                                                        </div>
                                                        <div className="flex justify-between sm:justify-center w-full sm:w-1/3 py-2 sm:py-0">
                                                            <span className="text-slate-400 font-bold text-[10px] sm:hidden uppercase">Base</span>
                                                            <span className="text-slate-600 font-bold">₹{h.base.toLocaleString()}</span>
                                                            <span className="mx-2 text-slate-200 hidden sm:inline">|</span>
                                                            <span className="text-slate-400 font-medium">Extra: ₹{h.bonus.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between sm:justify-end w-full sm:w-1/3 items-center gap-4">
                                                            <span className="text-slate-400 font-bold text-[10px] sm:hidden uppercase">Total</span>
                                                            <span className="font-display font-bold text-slate-800">₹{(h.base + h.bonus).toLocaleString()}</span>
                                                            <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-extrabold border border-green-100 uppercase tracking-tighter">Cleared</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
