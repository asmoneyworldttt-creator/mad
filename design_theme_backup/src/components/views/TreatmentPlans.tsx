
import { useState, useEffect } from 'react';
import { Plus, ChevronRight, CheckCircle2, Clock, XCircle, Trash2, Save, ArrowLeft, Search } from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';
import { Modal } from '../Modal';

type UserRole = 'admin' | 'staff' | 'doctor' | 'patient';
const formatINR = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

const STATUS_CONFIG: any = {
    Draft: { color: 'text-slate-500 bg-slate-100 border-slate-200' },
    Active: { color: 'text-primary bg-primary/10 border-primary/20' },
    Completed: { color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    Cancelled: { color: 'text-rose-500 bg-rose-50 border-rose-200' },
};

const ITEM_STATUS_CONFIG: any = {
    Pending: { icon: Clock, color: 'text-amber-500 bg-amber-50 border-amber-100' },
    'In Progress': { icon: ChevronRight, color: 'text-blue-500 bg-blue-50 border-blue-100' },
    Done: { icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
};

const TREATMENTS = [
    'Scaling & Polishing', 'Composite Restoration', 'Root Canal Treatment', 'Crown (PFM)', 'Crown (Zirconia)',
    'Tooth Extraction', 'Implant Placement', 'Teeth Whitening', 'Denture (Full)', 'Denture (Partial)',
    'Orthodontic Treatment', 'Sealants', 'Fluoride Application', 'Bone Grafting', 'Sinus Lift',
    'Gum Treatment (Flap Surgery)', 'Night Guard', 'Bleaching Tray', 'Veneer', 'Bridge (PFM)'
];

export function TreatmentPlans({ userRole, theme }: { userRole: UserRole; theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';

    const [plans, setPlans] = useState<any[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [planItems, setPlanItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<'list' | 'detail' | 'new'>('list');
    const [search, setSearch] = useState('');

    // New plan form
    const [newPlan, setNewPlan] = useState({ patientSearch: '', patientId: '', patientName: '', title: '', status: 'Draft' });
    const [patientResults, setPatientResults] = useState<any[]>([]);
    const [newItems, setNewItems] = useState<any[]>([{ treatment_name: '', tooth_reference: '', estimated_sessions: 1, cost: 0, status: 'Pending', scheduled_date: '', notes: '' }]);
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [planToDelete, setPlanToDelete] = useState<string | null>(null);

    useEffect(() => {
        fetchPlans();
        const ch = supabase.channel('tx_plans')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'treatment_plans' }, fetchPlans)
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, []);

    useEffect(() => {
        if (newPlan.patientSearch.length > 2) {
            supabase.from('patients').select('id, name, phone').ilike('name', `%${newPlan.patientSearch}%`).limit(5).then(({ data }) => setPatientResults(data || []));
        } else setPatientResults([]);
    }, [newPlan.patientSearch]);

    const fetchPlans = async () => {
        setIsLoading(true);
        const { data } = await supabase
            .from('treatment_plans')
            .select('*, patients(name, phone)')
            .order('created_at', { ascending: false });
        setPlans(data || []);
        setIsLoading(false);
    };

    const fetchPlanItems = async (planId: string) => {
        const { data } = await supabase.from('treatment_plan_items').select('*').eq('plan_id', planId).order('created_at');
        setPlanItems(data || []);
    };

    const handleOpenPlan = async (plan: any) => {
        setSelectedPlan(plan);
        await fetchPlanItems(plan.id);
        setView('detail');
    };

    const handleSaveNewPlan = async () => {
        if (!newPlan.patientId) return showToast('Please select a patient', 'error');
        if (!newPlan.title) return showToast('Plan title is required', 'error');
        if (newItems.some(i => !i.treatment_name)) return showToast('All treatment names are required', 'error');

        setIsSaving(true);
        const totalCost = newItems.reduce((a, b) => a + Number(b.cost || 0), 0);

        const { data: planData, error: planError } = await supabase.from('treatment_plans').insert({
            patient_id: newPlan.patientId,
            title: newPlan.title,
            status: newPlan.status,
            total_cost: totalCost,
            paid_amount: 0,
        }).select('id').single();

        if (planError) { showToast('Error creating plan: ' + planError.message, 'error'); setIsSaving(false); return; }

        const items = newItems.map(item => ({ ...item, plan_id: planData.id, cost: Number(item.cost) }));
        const { error: itemsError } = await supabase.from('treatment_plan_items').insert(items);

        if (itemsError) { showToast('Plan created but items had an error: ' + itemsError.message, 'error'); }
        else { showToast('Treatment plan created!', 'success'); }

        setIsSaving(false);
        setView('list');
        setNewPlan({ patientSearch: '', patientId: '', patientName: '', title: '', status: 'Draft' });
        setNewItems([{ treatment_name: '', tooth_reference: '', estimated_sessions: 1, cost: 0, status: 'Pending', scheduled_date: '', notes: '' }]);
        fetchPlans();
    };

    const handleUpdateItemStatus = async (itemId: string, newStatus: string) => {
        await supabase.from('treatment_plan_items').update({ status: newStatus }).eq('id', itemId);
        if (selectedPlan) fetchPlanItems(selectedPlan.id);
    };

    const handleUpdatePlanStatus = async (planId: string, newStatus: string) => {
        await supabase.from('treatment_plans').update({ status: newStatus }).eq('id', planId);
        setSelectedPlan((p: any) => ({ ...p, status: newStatus }));
        fetchPlans();
    };

    const handleDeletePlan = async () => {
        if (!planToDelete) return;
        await supabase.from('treatment_plan_items').delete().eq('plan_id', planToDelete);
        await supabase.from('treatment_plans').delete().eq('id', planToDelete);
        showToast('Treatment plan deleted', 'success');
        setShowDeleteModal(false);
        setPlanToDelete(null);
        setView('list');
        fetchPlans();
    };

    const filtered = plans.filter(p =>
        (p.patients?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        p.title.toLowerCase().includes(search.toLowerCase())
    );

    /* ─────── DETAIL VIEW ─────── */
    if (view === 'detail' && selectedPlan) {
        const progress = planItems.length > 0 ? Math.round((planItems.filter(i => i.status === 'Done').length / planItems.length) * 100) : 0;
        const paidPct = selectedPlan.total_cost > 0 ? Math.round((selectedPlan.paid_amount / selectedPlan.total_cost) * 100) : 0;
        return (
            <div className="animate-slide-up space-y-6 pb-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('list')} className={`p-3 rounded-2xl border transition-all ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}><ArrowLeft size={20} /></button>
                    <div className="flex-1">
                        <h2 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedPlan.title}</h2>
                        <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{selectedPlan.patients?.name} · {selectedPlan.patients?.phone}</p>
                    </div>
                    <select value={selectedPlan.status} onChange={e => handleUpdatePlanStatus(selectedPlan.id, e.target.value)} className={`px-4 py-2 rounded-xl font-bold text-sm border outline-none ${STATUS_CONFIG[selectedPlan.status]?.color || 'bg-slate-100 text-slate-600'}`}>
                        <option>Draft</option><option>Active</option><option>Completed</option><option>Cancelled</option>
                    </select>
                    <button onClick={() => { setPlanToDelete(selectedPlan.id); setShowDeleteModal(true); }} className="p-3 rounded-2xl border border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all"><Trash2 size={18} /></button>
                </div>

                {/* Progress Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Treatments', value: planItems.length, color: 'text-primary' },
                        { label: 'Completed', value: planItems.filter(i => i.status === 'Done').length, color: 'text-emerald-500' },
                        { label: 'Total Cost', value: formatINR(selectedPlan.total_cost), color: 'text-primary' },
                        { label: 'Paid Amount', value: formatINR(selectedPlan.paid_amount), color: 'text-emerald-500' },
                    ].map((card, i) => (
                        <div key={i} className={`p-5 rounded-[1.8rem] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
                            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                        </div>
                    ))}
                </div>

                {/* Progress Bars */}
                <div className={`p-6 rounded-[2rem] border space-y-4 ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div>
                        <div className="flex justify-between mb-2">
                            <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Treatment Progress</span>
                            <span className="text-xs font-bold text-primary">{progress}%</span>
                        </div>
                        <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                            <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between mb-2">
                            <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Payment Collection</span>
                            <span className="text-xs font-bold text-emerald-500">{paidPct}%</span>
                        </div>
                        <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${paidPct}%` }} />
                        </div>
                    </div>
                </div>

                {/* Treatment Items */}
                <div className={`rounded-[2rem] border overflow-hidden ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div className={`px-6 py-5 border-b flex justify-between items-center ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                        <h3 className="font-bold text-lg">Treatment Items</h3>
                        <span className={`text-xs font-bold px-3 py-1 rounded-lg ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{planItems.length} procedures</span>
                    </div>
                    <div className="divide-y divide-slate-100/10">
                        {planItems.map((item, i) => {
                            const cfg = ITEM_STATUS_CONFIG[item.status] || ITEM_STATUS_CONFIG.Pending;
                            const StatusIcon = cfg.icon;
                            return (
                                <div key={item.id} className={`p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'} transition-all`}>
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500'}`}>{i + 1}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{item.treatment_name}</p>
                                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                                            {item.tooth_reference && `Tooth: ${item.tooth_reference} · `}
                                            {item.estimated_sessions} session(s)
                                            {item.scheduled_date && ` · Scheduled: ${new Date(item.scheduled_date).toLocaleDateString('en-IN')}`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-primary text-sm">{formatINR(item.cost)}</span>
                                        <select value={item.status} onChange={e => handleUpdateItemStatus(item.id, e.target.value)} className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold border outline-none ${cfg.color}`}>
                                            <option>Pending</option><option>In Progress</option><option>Done</option>
                                        </select>
                                    </div>
                                </div>
                            );
                        })}
                        {planItems.length === 0 && <div className="py-16 text-center text-slate-400 italic">No treatment items found.</div>}
                    </div>
                </div>

                <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Treatment Plan">
                    <p className="text-slate-500 mb-6">Are you sure you want to delete this treatment plan? This action cannot be undone.</p>
                    <div className="flex gap-3">
                        <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                        <button onClick={handleDeletePlan} className="flex-1 py-3 bg-rose-500 text-white rounded-2xl font-bold hover:bg-rose-600 active:scale-95 transition-all">Delete</button>
                    </div>
                </Modal>
            </div>
        );
    }

    /* ─────── NEW PLAN FORM ─────── */
    if (view === 'new') {
        return (
            <div className="animate-slide-up space-y-6 pb-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('list')} className={`p-3 rounded-2xl border transition-all ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}><ArrowLeft size={20} /></button>
                    <div>
                        <h2 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>New Treatment Plan</h2>
                        <p className="text-sm text-slate-400 font-medium">Design a comprehensive treatment roadmap for your patient</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-5">
                        {/* Plan Header */}
                        <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                            <h3 className="font-bold mb-5 text-sm uppercase tracking-widest text-slate-400">Plan Details</h3>
                            <div className="space-y-4">
                                {/* Patient Search */}
                                <div className="relative">
                                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search patient by name..."
                                        value={newPlan.patientSearch}
                                        onChange={e => setNewPlan({ ...newPlan, patientSearch: e.target.value, patientId: '', patientName: '' })}
                                        className={`w-full pl-11 pr-4 py-3 rounded-2xl border font-bold text-sm outline-none transition-all ${isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-primary'}`}
                                    />
                                    {patientResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                                            {patientResults.map(p => (
                                                <button key={p.id} onClick={() => { setNewPlan({ ...newPlan, patientId: p.id, patientName: p.name, patientSearch: p.name }); setPatientResults([]); }}
                                                    className="w-full text-left px-5 py-3 hover:bg-slate-50 flex items-center gap-3 transition-colors border-b border-slate-100 last:border-0">
                                                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">{p.name?.charAt(0)}</div>
                                                    <div>
                                                        <p className="font-bold text-sm text-slate-700">{p.name}</p>
                                                        <p className="text-[10px] text-slate-400">{p.phone}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {newPlan.patientName && (
                                    <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                                        <CheckCircle2 size={16} className="text-primary" />
                                        <span className="text-sm font-bold text-primary">{newPlan.patientName} selected</span>
                                    </div>
                                )}
                                <input type="text" placeholder="Plan Title (e.g. Full Smile Makeover)" value={newPlan.title} onChange={e => setNewPlan({ ...newPlan, title: e.target.value })}
                                    className={`w-full px-5 py-3.5 rounded-2xl border font-bold text-sm outline-none transition-all ${isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-primary'}`} />
                                <select value={newPlan.status} onChange={e => setNewPlan({ ...newPlan, status: e.target.value })} className={`w-full px-5 py-3.5 rounded-2xl border font-bold text-sm outline-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                    <option>Draft</option><option>Active</option>
                                </select>
                            </div>
                        </div>

                        {/* Treatment Items */}
                        <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400">Treatment Items</h3>
                                <button onClick={() => setNewItems([...newItems, { treatment_name: '', tooth_reference: '', estimated_sessions: 1, cost: 0, status: 'Pending', scheduled_date: '', notes: '' }])}
                                    className="flex items-center gap-2 text-xs font-bold text-primary hover:underline">
                                    <Plus size={14} /> Add Item
                                </button>
                            </div>
                            <div className="space-y-4">
                                {newItems.map((item, i) => (
                                    <div key={i} className={`p-5 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                            <select value={item.treatment_name} onChange={e => { const n = [...newItems]; n[i].treatment_name = e.target.value; setNewItems(n); }}
                                                className={`px-4 py-3 rounded-xl border font-bold text-sm outline-none ${isDark ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-700'}`}>
                                                <option value="">Select Treatment...</option>
                                                {TREATMENTS.map(t => <option key={t}>{t}</option>)}
                                            </select>
                                            <input type="text" placeholder="Tooth Ref. (e.g. 14, 15)" value={item.tooth_reference} onChange={e => { const n = [...newItems]; n[i].tooth_reference = e.target.value; setNewItems(n); }}
                                                className={`px-4 py-3 rounded-xl border font-bold text-sm outline-none ${isDark ? 'bg-slate-800 border-white/10 text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-700'}`} />
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Cost (₹)</label>
                                                <input type="number" value={item.cost} onChange={e => { const n = [...newItems]; n[i].cost = Number(e.target.value); setNewItems(n); }}
                                                    className={`w-full px-4 py-2.5 rounded-xl border font-bold text-sm outline-none ${isDark ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-700'}`} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Sessions</label>
                                                <input type="number" min="1" value={item.estimated_sessions} onChange={e => { const n = [...newItems]; n[i].estimated_sessions = Number(e.target.value); setNewItems(n); }}
                                                    className={`w-full px-4 py-2.5 rounded-xl border font-bold text-sm outline-none ${isDark ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-700'}`} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Scheduled</label>
                                                <input type="date" value={item.scheduled_date} onChange={e => { const n = [...newItems]; n[i].scheduled_date = e.target.value; setNewItems(n); }}
                                                    className={`w-full px-4 py-2.5 rounded-xl border font-bold text-sm outline-none ${isDark ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-700'}`} />
                                            </div>
                                        </div>
                                        {newItems.length > 1 && (
                                            <button onClick={() => setNewItems(newItems.filter((_, idx) => idx !== i))} className="mt-3 flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:underline">
                                                <Trash2 size={12} /> Remove
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Summary Panel */}
                    <div className="space-y-4">
                        <div className={`p-6 rounded-[2rem] border sticky top-6 ${isDark ? 'bg-slate-950 border-white/5' : 'bg-slate-900 text-white'}`}>
                            <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest mb-5">Plan Summary</h3>
                            <div className="space-y-3 mb-6">
                                <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-white/10'}`}>
                                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Patient</p>
                                    <p className="font-bold text-white">{newPlan.patientName || '—'}</p>
                                </div>
                                <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-white/10'}`}>
                                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Procedures</p>
                                    <p className="font-bold text-white">{newItems.filter(i => i.treatment_name).length}</p>
                                </div>
                                <div className={`p-4 rounded-2xl ${isDark ? 'bg-primary/10 border border-primary/20' : 'bg-primary/10'}`}>
                                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Estimated Total</p>
                                    <p className="text-2xl font-bold text-primary">{formatINR(newItems.reduce((a, b) => a + Number(b.cost || 0), 0))}</p>
                                </div>
                            </div>
                            <button onClick={handleSaveNewPlan} disabled={isSaving} className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={18} /> Create Treatment Plan</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ─────── LIST VIEW ─────── */
    return (
        <div className="animate-slide-up space-y-6 pb-10">
            <div className={`p-6 rounded-[2.5rem] border flex flex-col md:flex-row justify-between items-center gap-4 ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div>
                    <h2 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Treatment Plans</h2>
                    <p className={`text-sm font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Build, track, and manage comprehensive dental treatment roadmaps.</p>
                </div>
                <button onClick={() => setView('new')} className="flex items-center gap-2 px-6 py-3.5 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all">
                    <Plus size={18} /> New Plan
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search by patient or plan title..." value={search} onChange={e => setSearch(e.target.value)}
                    className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border font-bold text-sm outline-none ${isDark ? 'bg-slate-900 border-white/10 text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-700 shadow-sm focus:border-primary'}`} />
            </div>

            {/* Plans Grid */}
            {isLoading ? (
                <div className="py-20 text-center">
                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">Loading treatment plans...</p>
                </div>
            ) : filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filtered.map(plan => {
                        const statusCfg = STATUS_CONFIG[plan.status] || STATUS_CONFIG.Draft;
                        const paidPct = plan.total_cost > 0 ? Math.round((plan.paid_amount / plan.total_cost) * 100) : 0;
                        return (
                            <div key={plan.id} onClick={() => handleOpenPlan(plan)}
                                className={`p-6 rounded-[2rem] border cursor-pointer transition-all hover:-translate-y-1 group ${isDark ? 'bg-slate-900 border-white/5 hover:border-primary/20' : 'bg-white border-slate-100 shadow-sm hover:shadow-xl'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="font-bold text-sm line-clamp-1">{plan.title}</p>
                                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">{plan.patients?.name}</p>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-xl text-[9px] font-extrabold border uppercase ${statusCfg.color}`}>{plan.status}</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-xs text-slate-400 font-medium">Total Cost</span>
                                        <span className="text-sm font-bold text-primary">{formatINR(plan.total_cost)}</span>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-[10px] text-slate-400 font-medium">Payment</span>
                                            <span className="text-[10px] font-extrabold text-emerald-500">{paidPct}%</span>
                                        </div>
                                        <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${paidPct}%` }} />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-[10px] text-slate-400">{new Date(plan.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    <span className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">Open <ChevronRight size={14} /></span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className={`py-20 text-center rounded-[2rem] border-2 border-dashed ${isDark ? 'border-white/10 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
                    <p className="font-bold mb-2">No treatment plans yet</p>
                    <p className="text-sm">Create your first plan to get started</p>
                </div>
            )}
        </div>
    );
}
