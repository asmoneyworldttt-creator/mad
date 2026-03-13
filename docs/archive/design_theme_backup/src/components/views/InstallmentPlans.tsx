import { useState, useEffect } from 'react';
import { CreditCard, Plus, Calendar, CheckCircle, AlertCircle, DollarSign, Trash2 } from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';

export function InstallmentPlans({ userRole, theme }: { userRole: string; theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [plans, setPlans] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [patients, setPatients] = useState<any[]>([]);
    const [patientSearch, setPatientSearch] = useState('');
    const [form, setForm] = useState({
        patient_id: '',
        patient_name: '',
        total_amount: '',
        down_payment: '',
        installments: '3',
        start_date: new Date().toISOString().split('T')[0],
        description: ''
    });

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        const { data } = await supabase
            .from('installment_plans')
            .select('*, patients(name, phone)')
            .order('created_at', { ascending: false });
        if (data) setPlans(data);
    };

    const searchPatients = async (q: string) => {
        setPatientSearch(q);
        if (q.length < 2) { setPatients([]); return; }
        const { data } = await supabase.from('patients').select('id, name, phone').ilike('name', `%${q}%`).limit(5);
        if (data) setPatients(data);
    };

    const generateInstallments = () => {
        const total = parseFloat(form.total_amount) || 0;
        const down = parseFloat(form.down_payment) || 0;
        const remaining = total - down;
        const count = parseInt(form.installments) || 3;
        const perInstallment = remaining / count;
        const schedules = [];
        const start = new Date(form.start_date);
        for (let i = 0; i < count; i++) {
            const dueDate = new Date(start);
            dueDate.setMonth(dueDate.getMonth() + i + 1);
            schedules.push({ amount: perInstallment, due_date: dueDate.toISOString().split('T')[0], paid: false });
        }
        return schedules;
    };

    const createPlan = async () => {
        if (!form.patient_id || !form.total_amount) return showToast('Patient and total amount required', 'error');
        const schedule = generateInstallments();
        const { error } = await supabase.from('installment_plans').insert({
            patient_id: form.patient_id,
            total_amount: parseFloat(form.total_amount),
            down_payment: parseFloat(form.down_payment) || 0,
            installments: parseInt(form.installments),
            schedule: schedule,
            description: form.description,
            status: 'Active',
            start_date: form.start_date
        });
        if (!error) {
            showToast('Installment plan created', 'success');
            setShowForm(false);
            setForm({ patient_id: '', patient_name: '', total_amount: '', down_payment: '', installments: '3', start_date: new Date().toISOString().split('T')[0], description: '' });
            fetchPlans();
        } else {
            showToast('Failed to create plan', 'error');
        }
    };

    const markInstallmentPaid = async (planId: number, installmentIndex: number) => {
        const plan = plans.find(p => p.id === planId);
        if (!plan) return;
        const newSchedule = [...plan.schedule];
        newSchedule[installmentIndex] = { ...newSchedule[installmentIndex], paid: true, paid_at: new Date().toISOString() };
        const allPaid = newSchedule.every((s: any) => s.paid);
        const { error } = await supabase.from('installment_plans')
            .update({ schedule: newSchedule, status: allPaid ? 'Completed' : 'Active' })
            .eq('id', planId);
        if (!error) { showToast('Payment recorded', 'success'); fetchPlans(); }
    };

    const totalOutstanding = plans.reduce((acc, p) => {
        const unpaid = (p.schedule || []).filter((s: any) => !s.paid).reduce((a: number, s: any) => a + s.amount, 0);
        return acc + unpaid;
    }, 0);

    const overduePlans = plans.filter(p => {
        const today = new Date().toISOString().split('T')[0];
        return (p.schedule || []).some((s: any) => !s.paid && s.due_date < today);
    });

    return (
        <div className="animate-slide-up space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Treatment Installments</h2>
                    <p className={`text-sm font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Manage payment plans and track outstanding balances
                    </p>
                </div>
                <button onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 hover:bg-primary/90 transition-all active:scale-95">
                    <Plus size={18} /> New Plan
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <p className={`text-[9px] font-extrabold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Total Outstanding</p>
                    <p className="text-2xl font-bold text-rose-400">₹{totalOutstanding.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                </div>
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <p className={`text-[9px] font-extrabold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Active Plans</p>
                    <p className="text-2xl font-bold">{plans.filter(p => p.status === 'Active').length}</p>
                </div>
                <div className={`p-6 rounded-2xl border ${overduePlans.length > 0 ? 'border-amber-500/30 bg-amber-500/5' : isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <p className={`text-[9px] font-extrabold uppercase tracking-widest mb-2 ${overduePlans.length > 0 ? 'text-amber-500' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>Overdue</p>
                    <p className={`text-2xl font-bold ${overduePlans.length > 0 ? 'text-amber-400' : ''}`}>{overduePlans.length}</p>
                </div>
            </div>

            {/* Create Plan Form */}
            {showForm && (
                <div className={`p-8 rounded-[2rem] border animate-slide-up ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <h3 className="font-bold text-lg mb-6">New Installment Plan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 relative">
                            <input placeholder="Search patient..." value={patientSearch} onChange={e => searchPatients(e.target.value)}
                                className={`w-full rounded-2xl px-6 py-4 font-bold outline-none border text-sm transition-all ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 focus:border-primary'}`} />
                            {form.patient_name && <p className="text-xs font-bold text-primary mt-1 pl-2">✓ {form.patient_name}</p>}
                            {patients.length > 0 && (
                                <div className={`absolute top-full mt-2 w-full z-50 rounded-2xl border shadow-xl overflow-hidden ${isDark ? 'bg-slate-800 border-white/10' : 'bg-white border-slate-100'}`}>
                                    {patients.map(p => (
                                        <div key={p.id} onClick={() => { setForm({ ...form, patient_id: p.id, patient_name: p.name }); setPatientSearch(p.name); setPatients([]); }}
                                            className={`px-5 py-4 cursor-pointer font-medium text-sm ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                                            <span className="font-bold">{p.name}</span> <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>· {p.phone}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className={`text-[9px] font-extrabold uppercase tracking-widest block mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Total Treatment Amount (₹)</label>
                            <input type="number" placeholder="e.g. 25000" value={form.total_amount} onChange={e => setForm({ ...form, total_amount: e.target.value })}
                                className={`w-full rounded-2xl px-6 py-4 font-bold outline-none border text-sm transition-all ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 focus:border-primary'}`} />
                        </div>
                        <div>
                            <label className={`text-[9px] font-extrabold uppercase tracking-widest block mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Down Payment (₹)</label>
                            <input type="number" placeholder="e.g. 5000" value={form.down_payment} onChange={e => setForm({ ...form, down_payment: e.target.value })}
                                className={`w-full rounded-2xl px-6 py-4 font-bold outline-none border text-sm transition-all ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 focus:border-primary'}`} />
                        </div>
                        <div>
                            <label className={`text-[9px] font-extrabold uppercase tracking-widest block mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Number of Installments</label>
                            <select value={form.installments} onChange={e => setForm({ ...form, installments: e.target.value })}
                                className={`w-full rounded-2xl px-6 py-4 font-bold outline-none border text-sm ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`}>
                                {[2, 3, 4, 6, 9, 12].map(n => <option key={n} value={n}>{n} months</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={`text-[9px] font-extrabold uppercase tracking-widest block mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Start Date</label>
                            <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
                                className={`w-full rounded-2xl px-6 py-4 font-bold outline-none border text-sm ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`} />
                        </div>
                        {form.total_amount && form.down_payment && (
                            <div className={`md:col-span-2 p-4 rounded-2xl ${isDark ? 'bg-primary/5 border border-primary/10' : 'bg-blue-50 border border-blue-100'}`}>
                                <p className="text-xs font-bold text-primary mb-1">Payment Preview</p>
                                <p className="text-sm font-medium">
                                    Down: <strong>₹{parseInt(form.down_payment || '0').toLocaleString('en-IN')}</strong> · Then{' '}
                                    <strong>{form.installments} × ₹{Math.round((parseFloat(form.total_amount || '0') - parseFloat(form.down_payment || '0')) / parseInt(form.installments || '3')).toLocaleString('en-IN')}/month</strong>
                                </p>
                            </div>
                        )}
                        <div className="md:col-span-2">
                            <input placeholder="Treatment description (optional)..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                className={`w-full rounded-2xl px-6 py-4 font-bold outline-none border text-sm transition-all ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 focus:border-primary'}`} />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button onClick={createPlan} className="px-8 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/20">
                            Create Plan
                        </button>
                        <button onClick={() => setShowForm(false)} className={`px-8 py-3 rounded-2xl font-bold transition-all ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Plans List */}
            <div className="space-y-6">
                {plans.map(plan => {
                    const schedule: any[] = plan.schedule || [];
                    const paid = schedule.filter(s => s.paid).length;
                    const pct = schedule.length > 0 ? Math.round((paid / schedule.length) * 100) : 0;
                    const today = new Date().toISOString().split('T')[0];
                    const nextDue = schedule.find(s => !s.paid);
                    const isOverdue = nextDue && nextDue.due_date < today;

                    return (
                        <div key={plan.id} className={`p-7 rounded-[2rem] border transition-all ${isOverdue ? 'border-amber-500/30 bg-amber-500/3' : isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                            <div className="flex items-start justify-between mb-5">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-bold text-lg">{plan.patients?.name}</h3>
                                        {isOverdue && <span className="text-[9px] font-extrabold px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full uppercase tracking-widest animate-pulse">Overdue</span>}
                                        {plan.status === 'Completed' && <span className="text-[9px] font-extrabold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full uppercase tracking-widest">Completed</span>}
                                    </div>
                                    <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{plan.description || 'Treatment plan'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold">₹{parseInt(plan.total_amount).toLocaleString('en-IN')}</p>
                                    <p className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{paid}/{schedule.length} paid</p>
                                </div>
                            </div>

                            <div className={`w-full h-2 rounded-full mb-5 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                                <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                                {schedule.map((s: any, i: number) => (
                                    <div key={i} onClick={() => !s.paid && markInstallmentPaid(plan.id, i)}
                                        className={`p-3 rounded-xl border text-center cursor-pointer transition-all hover:scale-105 ${s.paid ? 'bg-emerald-500/10 border-emerald-500/20' : s.due_date < today ? 'bg-amber-500/10 border-amber-500/30 animate-pulse' : isDark ? 'bg-white/5 border-white/10 hover:border-primary/30' : 'bg-slate-50 border-slate-100 hover:border-primary/30'}`}>
                                        <p className={`text-[9px] font-extrabold uppercase tracking-widest mb-1 ${s.paid ? 'text-emerald-500' : s.due_date < today ? 'text-amber-500' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                            {s.paid ? '✓ Paid' : s.due_date < today ? 'Overdue' : `Due`}
                                        </p>
                                        <p className="text-xs font-bold">₹{Math.round(s.amount).toLocaleString('en-IN')}</p>
                                        <p className={`text-[9px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                            {new Date(s.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
                {plans.length === 0 && (
                    <div className={`py-20 text-center rounded-[2rem] border-2 border-dashed ${isDark ? 'border-white/5 text-slate-600' : 'border-slate-200 text-slate-400'}`}>
                        <CreditCard size={40} className="mx-auto mb-4 opacity-30" />
                        <p className="font-medium">No installment plans yet. Click "New Plan" to start.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
