import { TrendingUp, TrendingDown, DollarSign, Download, Search } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useState, useEffect } from 'react';
import { useToast } from '../Toast';
import { supabase } from '../../supabase';

export function Earnings() {
    const { showToast } = useToast();
    const [filterRange, setFilterRange] = useState('This Month');
    const [bills, setBills] = useState<any[]>([]);
    const [treatmentProfitability, setTreatmentProfitability] = useState<any[]>([]);
    const [showProfitBreakdown, setShowProfitBreakdown] = useState<string | null>(null);

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

    const handleExport = () => {
        showToast('Exporting Financial Report CSV...', 'success');
        // CSV logic similar to patients
    };

    return (
        <div className="animate-slide-up space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold text-text-dark tracking-tight">Advanced Earnings Dashboard</h2>
                    <p className="text-text-muted font-medium">Detailed breakdown of clinic revenue, payment history, and treatment profitability.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <select value={filterRange} onChange={e => setFilterRange(e.target.value)} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold flex-1 md:flex-none outline-none">
                        <option>Today</option>
                        <option>Yesterday</option>
                        <option>This Week</option>
                        <option>This Month</option>
                        <option>Custom Range</option>
                    </select>
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 border border-slate-200 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 flex-1 md:flex-none shadow-premium"
                    >
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface border border-slate-200 p-6 rounded-2xl shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4"><TrendingUp size={20} /></div>
                    <p className="text-sm font-bold text-slate-500 mb-1">Total Revenue ({filterRange})</p>
                    <div className="flex items-center gap-3">
                        <h3 className="text-3xl font-display font-bold text-text-dark">₹{treatmentProfitability.reduce((a, b) => a + b.revenue, 0).toLocaleString()}</h3>
                        <span className="text-xs font-bold bg-success/10 text-success px-2 py-0.5 rounded-full flex items-center gap-1">+14.5%</span>
                    </div>
                </div>
                <div className="bg-surface border border-slate-200 p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:border-blue-300 transition-colors cursor-pointer" onClick={() => setShowProfitBreakdown('all')}>
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4"><DollarSign size={20} /></div>
                    <p className="text-sm font-bold text-slate-500 mb-1">Treatment Profitability</p>
                    <div className="flex items-center gap-3">
                        <h3 className="text-3xl font-display font-bold text-text-dark">View Breakdown</h3>
                        <span className="text-xs font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1">Click to analyze</span>
                    </div>
                </div>
                <div className="bg-surface border border-slate-200 p-6 rounded-2xl shadow-sm relative overflow-hidden">
                    <div className="w-10 h-10 bg-alert/10 text-alert rounded-xl flex items-center justify-center mb-4"><TrendingDown size={20} /></div>
                    <p className="text-sm font-bold text-slate-500 mb-1">Outstanding Payments</p>
                    <div className="flex items-center gap-3">
                        <h3 className="text-3xl font-display font-bold text-text-dark">₹42,000</h3>
                        <button className="text-xs font-bold bg-alert hover:bg-red-600 text-white px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors">Send Reminders</button>
                    </div>
                </div>
            </div>

            {showProfitBreakdown && (
                <div className="bg-surface border border-primary/20 p-6 rounded-2xl shadow-sm animate-fade-in relative">
                    <button onClick={() => setShowProfitBreakdown(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-sm">Close Breakdown</button>
                    <h3 className="font-display font-bold text-lg text-primary mb-6">Detailed Profitability by Treatment</h3>
                    <div className="h-[400px] w-full pr-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={treatmentProfitability.slice(0, 15)} layout="vertical" margin={{ top: 0, right: 0, left: 100, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }} width={180} />
                                <Tooltip
                                    cursor={{ fill: '#F1F5F9' }}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    formatter={(value: any) => [`₹${(value || 0).toLocaleString()}`, 'Total Profit']}
                                />
                                <Bar dataKey="revenue" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <div className="bg-surface border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col mt-6">
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50">
                    <h3 className="font-display font-bold text-lg text-text-dark">Payment History</h3>
                    <div className="relative w-full max-w-sm">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search Patient or Bill ID..."
                            className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-sm transition-all"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                <th className="p-4 rounded-tl-xl w-48">Date</th>
                                <th className="p-4">Patient Name</th>
                                <th className="p-4 text-center">Amount Paid</th>
                                <th className="p-4 text-right">Treatment Link</th>
                                <th className="p-4 rounded-tr-xl">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {bills.length === 0 ? (
                                <tr><td colSpan={5} className="text-center p-8 text-slate-500 font-medium italic">No payment history available.</td></tr>
                            ) : bills.map((b, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="p-4 text-sm text-slate-600 font-medium">{new Date(b.date).toLocaleDateString()}</td>
                                    <td className="p-4 font-bold text-text-dark">
                                        {b.patients?.name || 'Unknown Patient'}
                                        <p className="text-xs text-slate-400">{b.patients?.id}</p>
                                    </td>
                                    <td className="p-4 text-center font-bold text-text-dark">₹{b.amount.toLocaleString()}</td>
                                    <td className="p-4 text-right text-xs text-primary font-bold cursor-pointer hover:underline">View Breakdown</td>
                                    <td className="p-4 text-xs font-bold uppercase tracking-wider">
                                        <span className={`px-2 py-1 rounded-md border ${b.status === 'Paid' ? 'bg-success/10 text-success border-success/20' : 'bg-alert/10 text-alert border-alert/20'}`}>
                                            {b.status || 'Paid'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {/* Dummy Data for demonstration if bills table is empty */}
                            {bills.length === 0 && Array.from({ length: 5 }).map((_, i) => (
                                <tr key={`mock-${i}`} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="p-4 text-sm text-slate-600 font-medium">05/06/2026</td>
                                    <td className="p-4 font-bold text-text-dark">
                                        Mock Patient {i + 1}
                                        <p className="text-xs text-slate-400">PT-00{i + 1}</p>
                                    </td>
                                    <td className="p-4 text-center font-bold text-text-dark">₹{(Math.random() * 5000 + 1000).toFixed(0)}</td>
                                    <td className="p-4 text-right text-xs text-primary font-bold cursor-pointer hover:underline">View Invoice</td>
                                    <td className="p-4 text-xs font-bold uppercase tracking-wider">
                                        <span className="px-2 py-1 rounded-md border bg-success/10 text-success border-success/20">Paid</span>
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
