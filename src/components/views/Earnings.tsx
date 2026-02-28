import { TrendingUp, TrendingDown, DollarSign, Download, CreditCard, ChevronDown } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useState, useEffect } from 'react';
import { useToast } from '../Toast';
import { supabase } from '../../supabase';

// Mock Payroll Data for Section 6 if DB fails
const mockPayrollData = [
    { staffId: '1', name: 'Dr. Sarah Chen', role: 'Associate Dentist', monthlySalary: 520000, monthsPaid: 12, total: 6240000 },
    { staffId: '2', name: 'Dr. James Owusu', role: 'Associate Dentist', monthlySalary: 496000, monthsPaid: 12, total: 5952000 },
    { staffId: '3', name: 'Nurse Priya Menon', role: 'Dental Nurse/Assistant', monthlySalary: 256000, monthsPaid: 12, total: 3072000 },
    { staffId: '4', name: 'Nurse Daniel Koffi', role: 'Dental Nurse/Assistant', monthlySalary: 240000, monthsPaid: 12, total: 2880000 },
    { staffId: '5', name: 'Lisa Park', role: 'Receptionist/Front Desk', monthlySalary: 224000, monthsPaid: 12, total: 2688000 },
    { staffId: '6', name: 'Mohammed Hassan', role: 'Practice Manager', monthlySalary: 360000, monthsPaid: 12, total: 4320000 }
];

export function Earnings() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'Revenue' | 'Payroll'>('Revenue');
    const [filterRange, setFilterRange] = useState('This Month');
    const [bills, setBills] = useState<any[]>([]);
    const [treatmentProfitability, setTreatmentProfitability] = useState<any[]>([]);
    const [showProfitBreakdown, setShowProfitBreakdown] = useState<string | null>(null);
    const [selectedStaff, setSelectedStaff] = useState<any>(null);

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
    };

    const totalRevenue = treatmentProfitability.reduce((a, b) => a + b.revenue, 0);
    const totalPayroll = mockPayrollData.reduce((a, b) => a + b.total, 0);

    const roleBreakdown = mockPayrollData.reduce((acc, curr) => {
        if (!acc[curr.role]) acc[curr.role] = { total: 0, count: 0 };
        acc[curr.role].total += curr.total;
        acc[curr.role].count += 1;
        return acc;
    }, {} as Record<string, { total: number, count: number }>);

    return (
        <div className="animate-slide-up space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold text-text-dark tracking-tight">Financial Dashboard</h2>
                    <p className="text-text-muted font-medium">Detailed breakdown of clinic revenue, payment history, and staff payroll.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={() => setActiveTab('Revenue')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'Revenue' ? 'bg-primary text-white shadow-premium' : 'bg-white border border-slate-200 text-slate-600'}`}>Revenue</button>
                    <button onClick={() => setActiveTab('Payroll')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'Payroll' ? 'bg-primary text-white shadow-premium' : 'bg-white border border-slate-200 text-slate-600'}`}>Staff Payroll</button>
                </div>
            </div>

            {activeTab === 'Revenue' ? (
                <>
                    <div className="flex justify-end gap-3">
                        <select value={filterRange} onChange={e => setFilterRange(e.target.value)} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold flex-1 md:flex-none outline-none">
                            <option>Today</option>
                            <option>Yesterday</option>
                            <option>This Week</option>
                            <option>This Month</option>
                            <option>Custom Range</option>
                        </select>
                        <button onClick={handleExport} className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 flex-1 md:flex-none">
                            <Download size={16} /> Export CSV
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-surface border border-slate-200 p-6 rounded-2xl shadow-sm relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4"><TrendingUp size={20} /></div>
                            <p className="text-sm font-bold text-slate-500 mb-1">Total Revenue ({filterRange})</p>
                            <div className="flex items-center gap-3">
                                <h3 className="text-3xl font-display font-bold text-text-dark">₹{totalRevenue.toLocaleString('en-IN')}</h3>
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
                                        <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} formatter={(value: any) => [`₹${(value || 0).toLocaleString('en-IN')}`, 'Total Profit']} />
                                        <Bar dataKey="revenue" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    <div className="bg-surface border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col mt-6">
                        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50">
                            <h3 className="font-display font-bold text-lg text-text-dark">Payment History</h3>
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
                                            <td className="p-4 font-bold text-text-dark">{b.patients?.name || 'Unknown Patient'}</td>
                                            <td className="p-4 text-center font-bold text-text-dark">₹{b.amount.toLocaleString('en-IN')}</td>
                                            <td className="p-4 text-right text-xs text-primary font-bold cursor-pointer hover:underline">View Breakdown</td>
                                            <td className="p-4 text-xs font-bold uppercase tracking-wider">
                                                <span className={`px-2 py-1 rounded-md border ${b.status === 'Paid' ? 'bg-success/10 text-success border-success/20' : 'bg-alert/10 text-alert border-alert/20'}`}>{b.status || 'Paid'}</span>
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
                        <div className="bg-surface border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-center">
                            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4"><CreditCard size={24} /></div>
                            <p className="text-sm font-bold text-slate-500 mb-1">Total Salaries Paid to Date</p>
                            <h3 className="text-4xl font-display font-bold text-text-dark">₹{totalPayroll.toLocaleString('en-IN')}</h3>
                        </div>

                        <div className="bg-surface border border-slate-200 p-6 rounded-2xl shadow-sm lg:col-span-2">
                            <h3 className="font-display font-bold text-lg text-text-dark mb-4">Role Breakdown</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {Object.entries(roleBreakdown).map(([role, data], idx) => (
                                    <div key={idx} className="p-4 border border-slate-100 bg-slate-50 rounded-xl">
                                        <h4 className="font-bold text-slate-700 text-sm">{role}</h4>
                                        <div className="mt-2 flex justify-between items-end">
                                            <div>
                                                <p className="text-xs text-slate-500">{data.count} Staff Members</p>
                                                <p className="text-xs text-slate-500">Avg: ₹{(data.total / data.count / 12).toLocaleString('en-IN')}/mo</p>
                                            </div>
                                            <p className="font-bold text-primary">₹{data.total.toLocaleString('en-IN')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="font-display font-bold text-lg text-text-dark">Staff Directory & Payroll History</h3>
                        </div>
                        <div className="p-2">
                            {mockPayrollData.map((staff) => (
                                <div key={staff.staffId} className="border border-slate-100 rounded-xl mb-2 overflow-hidden">
                                    <div
                                        className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                                        onClick={() => setSelectedStaff(selectedStaff === staff.staffId ? null : staff.staffId)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                                                {staff.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-text-dark">{staff.name}</p>
                                                <p className="text-xs text-slate-500">{staff.role}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="font-bold text-text-dark">₹{staff.total.toLocaleString('en-IN')}</p>
                                                <p className="text-xs text-slate-500">Paid to Date</p>
                                            </div>
                                            <ChevronDown size={20} className={`text-slate-400 transition-transform ${selectedStaff === staff.staffId ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>
                                    {selectedStaff === staff.staffId && (
                                        <div className="p-4 bg-slate-50 border-t border-slate-100">
                                            <h4 className="font-bold text-sm text-slate-700 mb-3">12 Month History (Feb 2024 - Jan 2025)</h4>
                                            <div className="space-y-2">
                                                {Array.from({ length: 12 }).map((_, i) => (
                                                    <div key={i} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg text-sm">
                                                        <span className="font-medium text-slate-600 w-32">Month {12 - i}</span>
                                                        <span className="text-slate-500">Base: ₹{staff.monthlySalary.toLocaleString('en-IN')}</span>
                                                        <span className="text-slate-500">Bonus: ₹0</span>
                                                        <span className="font-bold text-text-dark">Net: ₹{staff.monthlySalary.toLocaleString('en-IN')}</span>
                                                        <span className="bg-success/10 text-success px-2 py-1 rounded text-xs font-bold w-16 text-center">Paid</span>
                                                        <span className="text-xs text-slate-400">Bank Transfer</span>
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
