
import { useState, useEffect, useMemo } from 'react';
import { Plus, ChevronRight, CheckCircle2, Clock, Trash2, Save, ArrowLeft, Search, Calendar, Zap, BadgePercent, Download, MessageSquareMore as MessageCircle } from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';
import { Modal } from '../Modal';
import { CustomSelect } from '../ui/CustomControls';
import { ToothChart } from '../ui/ToothChart';
import { downloadTreatmentPlanPDF } from '../../utils/pdfExport';

type UserRole = 'master' | 'admin' | 'staff' | 'patient';
const formatINR = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

const STATUS_CONFIG: any = {
    Draft: { color: 'text-slate-500 bg-slate-100/10 border-slate-200/20' },
    Active: { color: 'text-primary bg-primary/10 border-primary/20' },
    Completed: { color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
    Cancelled: { color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
};

const ITEM_STATUS_CONFIG: any = {
    Pending: { icon: Clock, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
    'In Progress': { icon: ChevronRight, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
    Done: { icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
};


export function TreatmentPlans({ userRole, theme, setActiveTab }: { userRole: UserRole; theme?: 'light' | 'dark'; setActiveTab?: (tab: string) => void }) {

    const { showToast } = useToast();
    const isDark = theme === 'dark';

    const [treatmentsList, setTreatmentsList] = useState<string[]>([]);
    const [priceMap, setPriceMap] = useState<Record<string, number>>({});

    const [plans, setPlans] = useState<any[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [planItems, setPlanItems] = useState<any[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<'list' | 'detail' | 'new'>('list');
    const [search, setSearch] = useState('');
    const [itemDateFilter, setItemDateFilter] = useState<'All' | 'Today' | 'This Month'>('All');

    // New plan form
    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

    const groupedPlans = useMemo(() => {
        const groups: Record<string, any[]> = {};
        plans.forEach(p => {
            const pid = p.patient_id || 'unknown';
            if (!groups[pid]) groups[pid] = [];
            groups[pid].push(p);
        });
        return Object.entries(groups).map(([pId, list]) => ({
            patientId: pId,
            patientName: list[0].patients?.name || 'Manual Listing',
            plans: list
        }));
    }, [plans]);

    const [newPlan, setNewPlan] = useState({ 
        patientSearch: '', 
        patientId: '', 
        patientName: '', 
        title: '', 
        status: 'Draft',
        chartType: 'Adult' as 'Adult' | 'Pediatric'
    });
    const [patientResults, setPatientResults] = useState<any[]>([]);
    const [newItems, setNewItems] = useState<any[]>([
        { treatment_name: '', selected_teeth: [] as string[], unit_cost: 0, estimated_sessions: 1, cost: 0, status: 'Pending', scheduled_date: '', notes: '' }
    ]);
    const [discount, setDiscount] = useState({ type: 'flat' as 'flat' | 'percentage', value: 0 });
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [planToDelete, setPlanToDelete] = useState<string | null>(null);

    useEffect(() => {
        fetchPlans();
        fetchTreatments();
        const ch = supabase.channel('tx_plans')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'treatment_plans' }, fetchPlans)
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, []);

    const fetchTreatments = async () => {
        const { data } = await supabase.from('treatments_master').select('treatment_name, fixed_price');
        if (data) {
            setTreatmentsList(data.map((t: any) => t.treatment_name));
            const map: Record<string, number> = {};
            data.forEach((t: any) => { map[t.treatment_name] = Number(t.fixed_price); });
            setPriceMap(map);
        }
    };



    useEffect(() => {
        if (newPlan.patientSearch.length > 2) {
            supabase.from('patients')
                .select('id, name, phone, age, metadata')
                .or(`name.ilike.%${newPlan.patientSearch}%,phone.ilike.%${newPlan.patientSearch}%,id.ilike.%${newPlan.patientSearch}%`)
                .limit(5)
                .then(({ data }) => setPatientResults(data || []));
        } else setPatientResults([]);
    }, [newPlan.patientSearch]);

    const fetchPlans = async () => {
        setIsLoading(true);
        const { data: plansData, error: pError } = await supabase
            .from('treatment_plans')
            .select('*')
            .order('created_at', { ascending: false });

        if (pError) console.error('Fetch Plans Error:', pError);

        const mapped: any[] = [];
        if (plansData && plansData.length > 0) {
            const patientIds = [...new Set(plansData.map(p => p.patient_id))];
            const { data: ptData } = await supabase
                .from('patients')
                .select('id, name, phone')
                .in('id', patientIds);

            plansData.forEach(p => {
                mapped.push({
                    ...p,
                    patients: ptData?.find(pt => pt.id === p.patient_id)
                });
            });
            setPlans(mapped);
        } else {
            setPlans([]);
        }
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
        const subtotal = newItems.reduce((a, b) => a + Number(b.cost || 0), 0);
        const discountAmount = discount.type === 'percentage' ? (subtotal * discount.value / 100) : discount.value;
        const totalCost = Math.max(0, subtotal - discountAmount);

        const { data: planData, error: planError } = await supabase.from('treatment_plans').insert({
            patient_id: newPlan.patientId,
            title: newPlan.title,
            status: newPlan.status,
            total_cost: totalCost,
            paid_amount: 0,
            metadata: {
                discount,
                subtotal,
                discount_amount: discountAmount
            }
        }).select('id').single();

        if (planError) { 
            showToast('Error creating plan: ' + planError.message, 'error'); 
            setIsSaving(false); 
            return; 
        }

        const items = newItems.map(item => ({ 
            plan_id: planData.id,
            treatment_name: item.treatment_name,
            tooth_reference: item.selected_teeth.join(', '),
            estimated_sessions: item.estimated_sessions,
            cost: Number(item.cost),
            status: item.status,
            scheduled_date: item.scheduled_date || null,
            notes: item.notes,
            unit_cost: item.unit_cost
        }));
        
        const { error: itemsError } = await supabase.from('treatment_plan_items').insert(items);

        if (itemsError) { showToast('Plan created but items had an error: ' + itemsError.message, 'error'); }
        else { 
            // Sync to general patient history
            await supabase.from('patient_history').insert({
                patient_id: newPlan.patientId,
                date: new Date().toISOString().split('T')[0],
                treatment: `Treatment Plan Created: ${newPlan.title}`,
                notes: `Budget: ${formatINR(totalCost)}. Sessions: ${items.reduce((a, b) => a + b.estimated_sessions, 0)}`,
                category: 'Clinical'
            });

            showToast('Treatment plan created!', 'success'); 
        }

        setIsSaving(false);
        setView('list');
        setNewPlan({ patientSearch: '', patientId: '', patientName: '', title: '', status: 'Draft', chartType: 'Adult' });
        setNewItems([{ treatment_name: '', selected_teeth: [], unit_cost: 0, estimated_sessions: 1, cost: 0, status: 'Pending', scheduled_date: '', notes: '' }]);
        setDiscount({ type: 'flat', value: 0 });
        fetchPlans();
    };

    const handleUpdateItemStatus = async (itemId: string, newStatus: string) => {
        const updateObj: any = { status: newStatus };
        if (newStatus === 'Done') {
            updateObj.scheduled_date = new Date().toISOString().split('T')[0]; // Record Completion Date
        }
        await supabase.from('treatment_plan_items').update(updateObj).eq('id', itemId);
        if (selectedPlan) fetchPlanItems(selectedPlan.id);
    };

    const handleLoadRecommendedPlan = async () => {
        if (!newPlan.patientId) return showToast('Please select a patient first', 'error');
        setIsLoading(true);
        const { data } = await supabase.from('clinical_notes')
            .select('plan')
            .eq('patient_id', newPlan.patientId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        setIsLoading(false);

        let advised = [];
        if (data?.plan) {
            try {
                const parsed = JSON.parse(data.plan);
                if (parsed && typeof parsed === 'object' && parsed.advised) {
                    advised = parsed.advised;
                }
            } catch (e) { }
        }

        const pendingItems = advised.filter((a: any) => !a.status || a.status === 'Pending');
        if (pendingItems.length > 0) {
            const loadedItems = pendingItems.map((a: any) => {
                const uCost = priceMap[a.treatment] || 0;
                return {
                    treatment_name: a.treatment,
                    selected_teeth: [a.tooth],
                    unit_cost: uCost,
                    estimated_sessions: 1,
                    cost: uCost, // single tooth initially
                    status: 'Pending',
                    scheduled_date: '',
                    notes: `Advised: ${a.treatment}`
                };
            });
            setNewItems(loadedItems);

            showToast('Pulled recommended items from clinical notes!', 'success');
        } else {
            showToast('No advised treatments found in recent clinical notes.', 'info');
        }
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
        (p.patients?.id || '').toLowerCase().includes(search.toLowerCase()) ||
        p.title.toLowerCase().includes(search.toLowerCase())
    );

    /* ─────── DETAIL VIEW ─────── */
    if (view === 'detail' && selectedPlan) {
        const progress = planItems.length > 0 ? Math.round((planItems.filter(i => i.status === 'Done').length / planItems.length) * 100) : 0;
        const paidPct = selectedPlan.total_cost > 0 ? Math.round((selectedPlan.paid_amount / selectedPlan.total_cost) * 100) : 0;
        return (
            <div className="animate-slide-up space-y-6 pb-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('list')} className={`p-3 rounded-2xl border transition-all ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`} aria-label="Back to plans list"><ArrowLeft size={20} /></button>
                    <div className="flex-1">
                        <h2 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedPlan.title}</h2>
                        <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{selectedPlan.patients?.name} · {selectedPlan.patients?.phone}</p>
                    </div>
                    <button
                        onClick={() => setActiveTab?.('appointments')}
                        className="px-5 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 text-white transition-all hover:scale-105"
                        style={{ background: 'var(--primary)', boxShadow: '0 4px 16px var(--primary-glow)' }}
                    >
                        <Calendar size={16} /> Schedule Appointment
                    </button>
                    <CustomSelect 
                        value={selectedPlan.status} 
                        onChange={val => handleUpdatePlanStatus(selectedPlan.id, val)}
                        options={['Draft', 'Active', 'Completed', 'Cancelled']}
                        className="w-40"
                    />
                    <button onClick={() => downloadTreatmentPlanPDF({
                        patientName: selectedPlan.patients?.name || 'Patient',
                        patientPhone: selectedPlan.patients?.phone || '',
                        planTitle: selectedPlan.title,
                        date: selectedPlan.created_at || new Date().toISOString(),
                        items: planItems.map(i => ({ treatment_name: i.treatment_name, tooth_reference: i.tooth_reference, cost: i.cost, status: i.status })),
                        totalCost: selectedPlan.total_cost,
                        discountAmount: selectedPlan.metadata?.discount_amount
                    })} className={`p-3 rounded-2xl border transition-all ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`} aria-label="Download PDF"><Download size={18} /></button>

                    <button onClick={() => {
                        const message = `*Treatment Plan Summary*\n\n` +
                            `Patient: ${selectedPlan.patients?.name || 'Valued Patient'}\n` +
                            `Title: ${selectedPlan.title}\n` +
                            `Total Estimated: ${formatINR(selectedPlan.total_cost)}\n\n` +
                            `*Items:*\n` +
                            planItems.map(i => `- ${i.treatment_name} (${i.tooth_reference || 'General'}): ${formatINR(i.cost)}`).join('\n') +
                            `\n\n_Powered by Dentora_`;
                        const phone = selectedPlan.patients?.phone?.replace(/\D/g, '');
                        if (phone) window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(message)}`, '_blank');
                        else showToast('Patient has no valid phone number saved.', 'error');
                    }} className="p-3 rounded-2xl border bg-emerald-500 text-white transition-all shadow-xl shadow-emerald-500/10 active:scale-95" aria-label="Share WhatsApp"><MessageCircle size={18} /></button>

                    <button onClick={() => { setPlanToDelete(selectedPlan.id); setShowDeleteModal(true); }} className="p-3 rounded-2xl border transition-all" style={{ background: 'var(--red-soft)', borderColor: 'var(--red-subtle)', color: 'var(--error)' }}><Trash2 size={18} /></button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Treatments', value: planItems.length, color: 'text-primary' },
                        { label: 'Completed', value: planItems.filter(i => i.status === 'Done').length, color: 'text-emerald-500' },
                        { label: selectedPlan.metadata?.discount_amount ? 'After Discount' : 'Total Cost', value: formatINR(selectedPlan.total_cost), color: 'text-primary' },
                        { label: 'Paid Amount', value: formatINR(selectedPlan.paid_amount), color: 'text-emerald-500' },
                    ].map((card, i) => (
                        <div key={i} className={`p-5 rounded-[1.8rem] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
                            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                            {card.label === 'After Discount' && selectedPlan.metadata?.subtotal && (
                                <p className="text-[10px] text-slate-500 mt-1 line-through opacity-50">Subtotal: {formatINR(selectedPlan.metadata.subtotal)}</p>
                            )}
                        </div>
                    ))}
                </div>

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

                <div className={`rounded-[2rem] border overflow-hidden ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div className={`px-6 py-5 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                        <div>
                            <h3 className="font-bold text-lg">Treatment Items</h3>
                            <span className={`text-xs font-bold px-3 py-1 rounded-lg ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{planItems.length} procedures</span>
                        </div>
                        <div className="flex items-center gap-1.5 p-1 bg-slate-100/50 dark:bg-white/5 rounded-xl border">
                            {['All', 'Today', 'This Month'].map(f => (
                                <button key={f} onClick={() => setItemDateFilter(f as any)} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${itemDateFilter === f ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-primary'}`}>
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="divide-y divide-slate-100/10">
                        {planItems.filter(i => {
                            if (itemDateFilter === 'All') return true;
                            if (!i.scheduled_date) return false;
                            const d = new Date(i.scheduled_date);
                            const now = new Date();
                            if (itemDateFilter === 'Today') return d.toDateString() === now.toDateString();
                            if (itemDateFilter === 'This Month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                            return true;
                        }).map((item, i) => {
                            const cfg = ITEM_STATUS_CONFIG[item.status] || ITEM_STATUS_CONFIG.Pending;
                            return (
                                <div key={item.id} className={`p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'} transition-all`}>
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500'}`}>{i + 1}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{item.treatment_name}</p>
                                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                                            {item.tooth_reference && `Tooth: ${item.tooth_reference} · `}
                                            {item.estimated_sessions} session(s)
                                            {item.scheduled_date && ` · ${item.status === 'Done' ? 'Completed' : 'Scheduled'}: ${new Date(item.scheduled_date).toLocaleDateString('en-IN')}`}
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
                        <div className={`p-6 rounded-[2rem] border transition-all ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                            <h3 className="font-bold mb-5 text-sm uppercase tracking-widest text-slate-400 text-[10px]">Plan Details</h3>
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search patient by name..."
                                        value={newPlan.patientSearch}
                                        onChange={e => setNewPlan({ ...newPlan, patientSearch: e.target.value, patientId: '', patientName: '' })}
                                        className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border font-bold text-sm outline-none transition-all ${isDark ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 focus:border-primary/50' : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-primary'}`}
                                    />
                                    {patientResults.length > 0 && (
                                        <div className={`absolute top-full left-0 right-0 mt-2 border rounded-2xl shadow-2xl z-50 overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                            {patientResults.map(p => (
                                                <button key={p.id} onClick={() => { 
                                                    setNewPlan({ 
                                                        ...newPlan, 
                                                        patientId: p.id, 
                                                        patientName: p.name, 
                                                        patientSearch: p.name,
                                                        chartType: (p.age && p.age < 13) ? 'Pediatric' : 'Adult'
                                                    }); 
                                                    setPatientResults([]); 
                                                }}
                                                    className={`w-full text-left px-5 py-3 flex items-center gap-3 transition-colors border-b last:border-0 ${isDark ? 'hover:bg-slate-800/50 border-slate-800' : 'hover:bg-slate-50 border-slate-100'}`}>
                                                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">{p.name?.charAt(0)}</div>
                                                    <div>
                                                        <p className={`font-bold text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{p.name}</p>
                                                        <p className="text-[10px] text-slate-400">{p.phone} {p.age ? `· ${p.age} years` : ''}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {newPlan.patientName && (
                                    <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/10 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 size={16} className="text-primary" />
                                            <span className="text-sm font-bold text-primary">{newPlan.patientName} selected</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 p-1 rounded-lg border border-primary/5">
                                            <button 
                                                onClick={() => setNewPlan({ ...newPlan, chartType: 'Adult' })}
                                                className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all ${newPlan.chartType === 'Adult' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-primary'}`}
                                            >
                                                Adult
                                            </button>
                                            <button 
                                                onClick={() => setNewPlan({ ...newPlan, chartType: 'Pediatric' })}
                                                className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all ${newPlan.chartType === 'Pediatric' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-primary'}`}
                                            >
                                                Pediatric
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {newPlan.patientId && (
                                    <div className="flex justify-between items-center p-3 border border-dashed rounded-xl bg-emerald-500/5 border-emerald-500/10">
                                        <div className="flex items-center gap-2">
                                            <Zap size={14} className="text-emerald-500" />
                                            <span className="text-xs font-bold text-emerald-600">Sync advised treatments list</span>
                                        </div>
                                        <button onClick={handleLoadRecommendedPlan} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-black uppercase text-[9px] shadow-sm transition-all active:scale-95">
                                            Pull Recommended
                                        </button>
                                    </div>
                                )}
                                <input type="text" placeholder="Plan Title (e.g. Full Smile Makeover)" value={newPlan.title} onChange={e => setNewPlan({ ...newPlan, title: e.target.value })}
                                    className={`w-full px-5 py-3.5 rounded-2xl border font-bold text-sm outline-none transition-all ${isDark ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 focus:border-primary/50' : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-primary'}`} />
                                <select value={newPlan.status} onChange={e => setNewPlan({ ...newPlan, status: e.target.value })} className={`w-full px-5 py-3.5 rounded-2xl border font-bold text-sm outline-none ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                    <option>Draft</option><option>Active</option>
                                </select>
                            </div>
                        </div>

                        <div className={`p-6 rounded-[2rem] border transition-all ${isDark ? 'bg-slate-900/40 border-slate-800/40 shadow-[0_8px_32px_rgba(0,0,0,0.2)]' : 'bg-white border-slate-100 shadow-sm'}`}>
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400 text-[10px]">Treatment Items</h3>
                                <button onClick={() => setNewItems([...newItems, { treatment_name: '', selected_teeth: [], unit_cost: 0, estimated_sessions: 1, cost: 0, status: 'Pending', scheduled_date: '', notes: '' }])}
                                    className="flex items-center gap-2 text-xs font-black uppercase tracking-tighter text-primary hover:underline">
                                    <Plus size={14} /> Add Item
                                </button>
                            </div>
                            <div className="space-y-6">
                                {newItems.map((item, i) => (
                                    <div key={i} className={`p-6 rounded-[2rem] border ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-6`}>
                                        <div className="flex justify-between items-start">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Treatment Type</label>
                                                    <select value={item.treatment_name} onChange={e => { const n = [...newItems]; n[i].treatment_name = e.target.value; n[i].unit_cost = priceMap[e.target.value] || 0; n[i].cost = n[i].unit_cost * (n[i].selected_teeth?.length || 1); setNewItems(n); }}
                                                        className={`w-full px-5 py-3.5 rounded-2xl border font-bold text-sm outline-none ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-700'}`}>
                                                        <option value="">Select Treatment...</option>
                                                        {treatmentsList.map(t => <option key={t} value={t}>{t}</option>)}
                                                    </select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Unit Cost (₹)</label>
                                                    <input type="number" placeholder="0" value={item.unit_cost} onChange={e => { 
                                                        const n = [...newItems]; 
                                                        n[i].unit_cost = Number(e.target.value); 
                                                        n[i].cost = n[i].unit_cost * (n[i].selected_teeth?.length || 1);
                                                        setNewItems(n); 
                                                    }}
                                                        className={`w-full px-5 py-3.5 rounded-2xl border font-bold text-sm outline-none ${isDark ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-600' : 'bg-white border-slate-200 text-slate-700'}`} />
                                                </div>
                                            </div>
                                            {newItems.length > 1 && (
                                                <button onClick={() => setNewItems(newItems.filter((_, idx) => idx !== i))} className={`p-2 ml-4 rounded-xl transition-all ${isDark ? 'text-rose-400 hover:bg-rose-400/10' : 'text-rose-500 hover:bg-rose-50'}`}>
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>

                                        {item.treatment_name && (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                                                <div className="flex items-center justify-between px-1">
                                                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Select Target Teeth</h4>
                                                    {item.selected_teeth.length > 0 && (
                                                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">
                                                            {item.selected_teeth.length} Teeth Selected
                                                        </span>
                                                    )}
                                                </div>
                                                <ToothChart 
                                                    type={newPlan.chartType} 
                                                    selectedTeeth={item.selected_teeth} 
                                                    isDark={isDark}
                                                    onToggleTooth={(tooth) => {
                                                        const n = [...newItems];
                                                        const teeth = n[i].selected_teeth || [];
                                                        if (teeth.includes(tooth)) {
                                                            n[i].selected_teeth = teeth.filter((t: string) => t !== tooth);
                                                        } else {
                                                            n[i].selected_teeth = [...teeth, tooth];
                                                        }
                                                        n[i].cost = n[i].unit_cost * (n[i].selected_teeth.length || 1);
                                                        setNewItems(n);
                                                    }}
                                                />
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Est. Sessions</label>
                                                <input type="number" min="1" value={item.estimated_sessions} onChange={e => { const n = [...newItems]; n[i].estimated_sessions = Number(e.target.value); setNewItems(n); }}
                                                    className={`w-full px-5 py-3.5 rounded-2xl border font-bold text-sm outline-none ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-700 focus:border-primary'}`} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Scheduled Date</label>
                                                <input type="date" value={item.scheduled_date} onChange={e => { const n = [...newItems]; n[i].scheduled_date = e.target.value; setNewItems(n); }}
                                                    className={`w-full px-5 py-3.5 rounded-2xl border font-bold text-sm outline-none ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-700 focus:border-primary'}`} />
                                            </div>
                                        </div>
                                        <div className="space-y-1 mt-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Notes</label>
                                            <textarea rows={2} value={item.notes || ''} onChange={e => { const n = [...newItems]; n[i].notes = e.target.value; setNewItems(n); }} placeholder="Add manual notes..."
                                                className={`w-full px-5 py-3 rounded-2xl border font-bold text-xs outline-none ${isDark ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-600' : 'bg-white border-slate-200 text-slate-700 focus:border-primary'}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className={`p-6 rounded-[2rem] border sticky top-6 transition-all ${isDark ? 'bg-slate-900 border-slate-800 shadow-2xl shadow-black/40' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'}`}>
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="text-xs font-black text-primary uppercase tracking-widest">Plan Summary</h3>
                            </div>
                            <div className="space-y-3 mb-6">
                                <div className={`p-4 rounded-2xl border transition-colors ${isDark ? 'bg-slate-800/30 border-slate-800/50' : 'bg-slate-50 border-slate-100'}`}>
                                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Patient</p>
                                    <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{newPlan.patientName || '—'}</p>
                                </div>
                                <div className={`p-4 rounded-2xl border transition-colors ${isDark ? 'bg-slate-800/30 border-slate-800/50' : 'bg-slate-50 border-slate-100'}`}>
                                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Procedures</p>
                                    <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{newItems.filter(i => i.treatment_name).length}</p>
                                </div>
                                
                                <div className={`p-5 rounded-2xl border transition-all ${isDark ? 'bg-slate-800/20 border-slate-800/50' : 'bg-slate-50/50 border-slate-100'} space-y-4`}>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-extrabold text-slate-500 uppercase tracking-widest">Subtotal</span>
                                        <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{formatINR(newItems.reduce((a, b) => a + Number(b.cost || 0), 0))}</span>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Discount</span>
                                            <div className={`flex rounded-lg p-0.5 border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                                                <button onClick={() => setDiscount({ ...discount, type: 'flat' })} className={`p-1.5 rounded-md transition-all ${discount.type === 'flat' ? 'bg-primary text-white shadow-lg scale-110' : 'text-slate-400 opacity-40'}`}><Zap size={12} /></button>
                                                <button onClick={() => setDiscount({ ...discount, type: 'percentage' })} className={`p-1.5 rounded-md transition-all ${discount.type === 'percentage' ? 'bg-primary text-white shadow-lg scale-110' : 'text-slate-400 opacity-40'}`}><BadgePercent size={12} /></button>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={discount.value} 
                                                onChange={e => setDiscount({ ...discount, value: Number(e.target.value) })}
                                                className={`w-full rounded-xl px-4 py-2 text-sm font-bold outline-none transition-all ${isDark ? 'bg-slate-900 border-slate-800 text-white focus:border-primary/50' : 'bg-white border-slate-200 text-slate-700 focus:border-primary'}`}
                                                placeholder={discount.type === 'percentage' ? 'Enter %' : 'Enter Amount'}
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] font-black">{discount.type === 'percentage' ? '%' : '₹'}</div>
                                        </div>
                                    </div>

                                    <div className={`pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} flex justify-between items-center`}>
                                        <p className="text-[10px] font-extrabold text-primary uppercase tracking-widest">Grand Total</p>
                                        <p className="text-2xl font-black text-primary">
                                            {(() => {
                                                const subtotal = newItems.reduce((a, b) => a + Number(b.cost || 0), 0);
                                                const disc = discount.type === 'percentage' ? (subtotal * discount.value / 100) : discount.value;
                                                return formatINR(Math.max(0, subtotal - disc));
                                            })()}
                                        </p>
                                    </div>
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
            <div className={`p-6 rounded-[2.5rem] border flex flex-col md:flex-row justify-between items-center gap-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div>
                    <h2 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Treatment Plans</h2>
                    <p className={`text-sm font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Create and track treatment plans for your patients.</p>
                </div>
                <button onClick={() => setView('new')} className="flex items-center gap-2 px-6 py-3.5 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all">
                    <Plus size={18} /> New Plan
                </button>
            </div>

            <div className="relative max-w-md">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search by patient or plan title..." value={search} onChange={e => setSearch(e.target.value)}
                    className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border font-bold text-sm outline-none transition-all ${isDark ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 focus:border-primary/50' : 'bg-white border-slate-200 text-slate-700 shadow-sm focus:border-primary'}`} />
            </div>

            {isLoading ? (
                <div className="py-20 text-center">
                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">Loading treatment plans...</p>
                </div>
            ) : filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {(() => {
                        const filteredGrouped = groupedPlans.filter(group => 
                            group.patientName.toLowerCase().includes(search.toLowerCase()) ||
                            group.plans.some((p: any) => p.title.toLowerCase().includes(search.toLowerCase()))
                        );

                        return filteredGrouped.map((group) => {
                            const isExpanded = expandedGroups.includes(group.patientId);
                            const hasMultiple = group.plans.length > 1;

                            return (
                                <div key={group.patientId} className={`p-6 rounded-[2.5rem] border transition-all ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} space-y-4`}>
                                    <div onClick={() => setExpandedGroups(prev => prev.includes(group.patientId) ? prev.filter(k => k !== group.patientId) : [...prev, group.patientId])} className={`flex justify-between items-center cursor-pointer p-4 rounded-xl ${isExpanded ? 'bg-slate-50 dark:bg-white/5' : ''}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                                                {group.patientName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-base" style={{ color: 'var(--text-dark)' }}>{group.patientName}</p>
                                                <p className="text-[11px] font-black text-primary uppercase tracking-widest">{group.plans.length} Treatment Plans</p>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${isExpanded ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>{isExpanded ? 'Collapse' : 'Expand'}</span>
                                    </div>

                                    {isExpanded && (
                                        <div className="grid grid-cols-1 gap-3 mt-2">
                                            {group.plans.map((plan: any) => {
                                                const statusCfg = STATUS_CONFIG[plan.status] || STATUS_CONFIG.Draft;
                                                const paidPct = plan.total_cost > 0 ? Math.round((plan.paid_amount / plan.total_cost) * 100) : 0;

                                                return (
                                                    <div key={plan.id} onClick={(e) => { e.stopPropagation(); handleOpenPlan(plan); }} className={`p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] bg-slate-50/50 dark:bg-white/3 border-slate-100 dark:border-white/5 space-y-3`}>
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="font-bold text-xs">{plan.title}</p>
                                                                <p className="text-[10px] text-slate-400 mt-0.5">{new Date(plan.created_at).toLocaleDateString()}</p>
                                                            </div>
                                                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-extrabold border uppercase ${statusCfg.color}`}>{plan.status}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="font-bold text-slate-500">Cost:</span>
                                                            <span className="font-extrabold text-primary">{formatINR(plan.total_cost)}</span>
                                                        </div>
                                                        <div>
                                                            <div className="flex justify-between mb-1"><span className="text-[9px] text-slate-500 font-bold">Paid</span><span className="text-[9px] font-bold text-emerald-500">{paidPct}%</span></div>
                                                            <div className={`h-1 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${paidPct}%` }} /></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        });
                    })()}
                </div>
            ) : (
                <div className={`py-20 text-center rounded-[2rem] border-2 border-dashed ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
                    <p className="font-bold mb-2">No treatment plans yet</p>
                    <p className="text-sm">Create your first plan to get started</p>
                </div>
            )}
        </div>
    );
}

