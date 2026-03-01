import { useState, useEffect } from 'react';
import { Plus, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { supabase } from '../../supabase';

export function Accounts() {
    const [activeTab, setActiveTab] = useState<'income' | 'expenses'>('income');
    const { showToast } = useToast();
    const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

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
            setIsIncomeModalOpen(false);
            setIsExpenseModalOpen(false);
            setForm({ category: 'Hospital Visits', date: new Date().toISOString().split('T')[0], remark: '', amount: 0, received: 0 });
            fetchAccounts();
        }
    };

    return (
        <div className="animate-slide-up space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold text-text-dark tracking-tight">Accounts</h2>
                    <p className="text-text-muted font-medium">Manage your clinic's income and expenses.</p>
                </div>
                <button
                    onClick={() => activeTab === 'income' ? setIsIncomeModalOpen(true) : setIsExpenseModalOpen(true)}
                    className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-premium w-full md:w-auto"
                >
                    <Plus size={16} /> Add {activeTab === 'income' ? 'Income' : 'Expenses'}
                </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-surface border border-slate-200 rounded-xl p-1 shadow-sm w-max">
                <button
                    onClick={() => setActiveTab('income')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'income' ? 'bg-primary-light text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <ArrowDownLeft size={16} /> Income
                </button>
                <button
                    onClick={() => setActiveTab('expenses')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'expenses' ? 'bg-primary-light text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <ArrowUpRight size={16} /> Expenses
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-surface border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                    <h3 className="font-bold text-text-dark">{activeTab === 'income' ? 'Income List' : 'Expenses List'}</h3>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-slate-500 font-medium">Synchronizing Financial Records...</p>
                        </div>
                    ) : activeTab === 'income' ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                    <th className="p-4 whitespace-nowrap">Date</th>
                                    <th className="p-4 whitespace-nowrap">Category</th>
                                    <th className="p-4 whitespace-nowrap">Amount(Rs.)</th>
                                    <th className="p-4 whitespace-nowrap">Received(Rs.)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {incomes.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-4 font-bold text-sm text-text-dark">{new Date(item.date).toLocaleDateString()}</td>
                                        <td className="p-4 text-sm font-medium text-slate-600">{item.category}</td>
                                        <td className="p-4 text-sm font-bold text-text-dark">₹{item.amount.toLocaleString()}</td>
                                        <td className="p-4 text-sm font-bold text-success">₹{item.received_amount?.toLocaleString() || '0'}</td>
                                    </tr>
                                ))}
                                {incomes.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-slate-500 font-medium">No data available in table</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                    <th className="p-4 whitespace-nowrap">Date</th>
                                    <th className="p-4 whitespace-nowrap">Category</th>
                                    <th className="p-4 whitespace-nowrap">Amount(Rs.)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {expenses.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-4 font-bold text-sm text-text-dark">{new Date(item.date).toLocaleDateString()}</td>
                                        <td className="p-4 text-sm font-medium text-slate-600">{item.category}</td>
                                        <td className="p-4 text-sm font-bold text-alert">₹{item.amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                                {expenses.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="p-8 text-center text-slate-500 font-medium">No data available in table</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <Modal isOpen={isIncomeModalOpen} onClose={() => setIsIncomeModalOpen(false)} title="Income Details" maxWidth="max-w-xl">
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Category</label>
                            <select
                                value={form.category}
                                onChange={e => setForm({ ...form, category: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
                            >
                                <option>Hospital Visits</option>
                                <option>Treatment Fee</option>
                                <option>Other Income</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Date <span className="text-alert">*</span></label>
                            <input
                                type="date"
                                required
                                value={form.date}
                                onChange={e => setForm({ ...form, date: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Remark <span className="text-alert">*</span></label>
                            <textarea
                                required
                                rows={2}
                                value={form.remark}
                                onChange={e => setForm({ ...form, remark: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
                            ></textarea>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Due Amount <span className="text-alert">*</span></label>
                            <input
                                type="number"
                                required
                                value={form.amount}
                                onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Received Amount</label>
                            <input
                                type="number"
                                value={form.received}
                                onChange={e => setForm({ ...form, received: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex justify-center mt-6 pt-4 border-t border-slate-100">
                        <button type="submit" className="bg-primary hover:bg-primary-hover text-white px-8 py-2.5 rounded-lg text-sm font-bold shadow-premium transition-transform active:scale-95">
                            Submit
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Expenses Details" maxWidth="max-w-xl">
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Category</label>
                            <select
                                value={form.category}
                                onChange={e => setForm({ ...form, category: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
                            >
                                <option>Staff Salary</option>
                                <option>Equipment Purchase</option>
                                <option>Clinic Rent</option>
                                <option>Marketing</option>
                                <option>Other Expenses</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Date <span className="text-alert">*</span></label>
                            <input
                                type="date"
                                required
                                value={form.date}
                                onChange={e => setForm({ ...form, date: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Remark <span className="text-alert">*</span></label>
                            <textarea
                                required
                                rows={2}
                                value={form.remark}
                                onChange={e => setForm({ ...form, remark: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
                            ></textarea>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Amount <span className="text-alert">*</span></label>
                            <input
                                type="number"
                                required
                                value={form.amount}
                                onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Clinic</label>
                            <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none">
                                <option>Default Clinic</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-2 text-sm font-bold text-primary cursor-pointer hover:underline mb-4">
                        Additional Details
                    </div>

                    <div className="flex justify-center mt-6 pt-4 border-t border-slate-100">
                        <button type="submit" className="bg-primary hover:bg-primary-hover text-white px-8 py-2.5 rounded-lg text-sm font-bold shadow-premium transition-transform active:scale-95">
                            Submit
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
