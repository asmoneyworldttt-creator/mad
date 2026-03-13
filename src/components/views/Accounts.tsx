
import { useState, useEffect } from 'react';
import { Plus, ArrowDownLeft, ArrowUpRight, ChevronLeft, DollarSign, Tag, Calendar, FileText, Trash2 } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { supabase } from '../../supabase';
import { CustomSelect } from '../ui/CustomControls';

type UserRole = 'master' | 'admin' | 'staff' | 'patient';

export function Accounts({ userRole, theme }: { userRole: UserRole; theme?: 'light' | 'dark' }) {
    const [activeTab, setActiveTab] = useState<'income' | 'expenses'>('income');
    const [view, setView] = useState<'list' | 'add'>('list');
    const { showToast } = useToast();

    const [incomes, setIncomes] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [form, setForm] = useState({
        category: 'Hospital Visits',
        date: new Date().toISOString().split('T')[0],
        remark: '',
        amount: 0,
        received: 0
    });

    useEffect(() => {
        fetchAccounts();
    }, [activeTab]);

    const fetchAccounts = async () => {
        setIsLoading(true);
        const { data } = await supabase
            .from('accounts')
            .select('*')
            .eq('type', activeTab === 'income' ? 'income' : 'expense')
            .order('date', { ascending: false });

        if (activeTab === 'income') setIncomes(data || []);
        else setExpenses(data || []);
        setIsLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.from('accounts').insert({
            type: activeTab === 'income' ? 'income' : 'expense',
            category: form.category,
            date: form.date,
            remark: form.remark,
            amount: form.amount,
            received_amount: activeTab === 'income' ? form.received : form.amount
        });

        if (error) {
            showToast('Error saving record', 'error');
        } else {
            showToast(`${activeTab === 'income' ? 'Income' : 'Expense'} added successfully!`, 'success');
            setView('list');
            setForm({ category: 'Hospital Visits', date: new Date().toISOString().split('T')[0], remark: '', amount: 0, received: 0 });
            fetchAccounts();
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this record?')) return;
        const { error } = await supabase.from('accounts').delete().eq('id', id);
        if (!error) {
            showToast('Record deleted');
            fetchAccounts();
        }
    };

    if (view === 'add') {
        return (
            <div className="animate-slide-up space-y-8 pb-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('list')} className={`p-3 border rounded-2xl transition-all shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-white/10 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h2 className={`text-3xl font-sans font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-text-dark'}`}>
                            {activeTab === 'income' ? 'Record New Income' : 'Document New Expense'}
                        </h2>
                        <p className="text-slate-500 font-medium">Capture financial data for clinic accounting.</p>
                    </div>
                </div>

                <div className={`rounded-[2.5rem] shadow-sm p-10 border ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100'}`}>
                    <form onSubmit={handleSave} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">Financial Category</label>
                                    <CustomSelect
                                        options={[
                                            { value: 'Hospital Visits', label: 'Hospital Visits' },
                                            { value: 'Consultations', label: 'Consultations' },
                                            { value: 'Pharmacy Sales', label: 'Pharmacy Sales' },
                                            { value: 'Lab Services', label: 'Lab Services' },
                                            { value: 'Rent/Utilities', label: 'Rent/Utilities' },
                                            { value: 'Salary/Payroll', label: 'Salary/Payroll' },
                                            { value: 'Supplies/Maintenance', label: 'Supplies/Maintenance' },
                                            { value: 'Marketing', label: 'Marketing' }
                                        ]}
                                        value={form.category}
                                        onChange={(val) => setForm({ ...form, category: val })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">Transaction Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="date"
                                            value={form.date}
                                            onChange={e => setForm({ ...form, date: e.target.value })}
                                            className={`w-full border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none transition-all focus:ring-4 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-primary/50 focus:ring-primary/10' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-primary focus:ring-primary/10'}`}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">Total Amount (₹)</label>
                                        <input
                                            type="number"
                                            value={form.amount}
                                            onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) })}
                                            className={`w-full border rounded-xl px-4 py-4 text-sm font-bold outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">{activeTab === 'income' ? 'Received (₹)' : 'Final Value'}</label>
                                        <input
                                            type="number"
                                            value={activeTab === 'income' ? form.received : form.amount}
                                            onChange={e => activeTab === 'income' && setForm({ ...form, received: parseFloat(e.target.value) })}
                                            className={`w-full border rounded-xl px-4 py-4 text-sm font-bold outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                            disabled={activeTab === 'expenses'}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">Remarks / Internal Note</label>
                                    <div className="relative">
                                        <FileText className="absolute left-4 top-4 text-slate-400" size={18} />
                                        <textarea
                                            rows={3}
                                            value={form.remark}
                                            onChange={e => setForm({ ...form, remark: e.target.value })}
                                            className={`w-full border rounded-2xl pl-12 pr-4 py-4 text-sm font-medium outline-none transition-all focus:ring-4 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-primary/50 focus:ring-primary/10' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-primary focus:ring-primary/10'}`}
                                            placeholder="Add specific context for this transaction..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8 justify-end">
                            <button type="button" onClick={() => setView('list')} className={`px-10 py-4 rounded-2xl border font-bold transition-all active:scale-95 ${theme === 'dark' ? 'border-white/10 text-slate-400 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Cancel</button>
                            <button type="submit" className="px-12 py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary-hover shadow-premium shadow-primary/20 transition-all active:scale-95">
                                Commit to Ledger
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-slide-up space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className={`text-3xl font-sans font-bold tracking-tight`} style={{ color: 'var(--text-dark)' }}>Financial Accounts</h2>
                    <p className="font-medium" style={{ color: 'var(--text-muted)' }}>Manage clinic income and expenditure streams.</p>
                </div>
                <button
                    onClick={() => setView('add')}
                    className="bg-primary hover:bg-primary-hover text-white px-6 py-3.5 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-premium shadow-primary/20 w-full md:w-auto"
                >
                    <Plus size={18} /> Add {activeTab === 'income' ? 'Income' : 'Expense'} Entry
                </button>
            </div>

            <div className={`flex p-1 rounded-2xl shadow-sm w-max border`} style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)' }}>
                <button
                    onClick={() => setActiveTab('income')}
                    className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'income' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-primary hover:bg-primary/5'
                        }`}
                >
                    <ArrowDownLeft size={18} /> Income
                </button>
                <button
                    onClick={() => setActiveTab('expenses')}
                    className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'expenses' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-primary hover:bg-primary/5'
                        }`}
                >
                    <ArrowUpRight size={18} /> Expenses
                </button>
            </div>

            <div className={`rounded-[2rem] border overflow-hidden`} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: '0 4px 20px var(--glass-shadow)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className={`text-[10px] font-extrabold uppercase tracking-widest border-b`} style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                                <th className="px-8 py-5">Accounting Period</th>
                                <th className="px-8 py-5">Category & Remark</th>
                                <th className="px-8 py-5">Base Amount</th>
                                <th className="px-8 py-5 text-right flex justify-end gap-2 items-center">
                                    Final Value <Trash2 size={12} className="opacity-0" />
                                </th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-50'}`}>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
                                    </td>
                                </tr>
                            ) : (activeTab === 'income' ? incomes : expenses).length > 0 ? (activeTab === 'income' ? incomes : expenses).map((item) => (
                                <tr key={item.id} className={`group transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50/50'}`}>
                                    <td className="px-8 py-5">
                                        <p className={`font-bold text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{item.date}</p>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{item.category}</p>
                                        <p className="text-xs text-slate-400 font-medium mt-1">{item.remark || 'Direct transaction'}</p>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className={`font-bold text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>₹{item.amount.toLocaleString()}</p>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-4">
                                            <span className={`text-sm font-bold ${activeTab === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                                ₹{item.received_amount?.toLocaleString() || item.amount.toLocaleString()}
                                            </span>
                                            <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center text-slate-300 font-bold italic">No financial records found in this stream.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
