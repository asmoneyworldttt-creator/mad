import { useState, useEffect } from 'react';
import {
    Shield, Plus, Search, RefreshCw, Calendar, Edit3, ClipboardList, AlertTriangle, CheckCircle2,
    DollarSign, FileText, PieChart, TrendingUp, HelpCircle, ArrowRight, PenTool, Lock, Eye
} from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../Modal';
import { CustomSelect } from '../ui/CustomControls';

export function InsuranceManagement({ theme }: { theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [activeTab, setActiveTab] = useState<'overview' | 'providers' | 'policies' | 'preauth' | 'claims' | 'finance'>('providers');

    const [providers, setProviders] = useState<any[]>([]);
    const [preAuths, setPreAuths] = useState<any[]>([]);
    const [claims, setClaims] = useState<any[]>([]);
    
    // Modal states
    const [isAddProviderModalOpen, setIsAddProviderModalOpen] = useState(false);
    const [isAddPreAuthModalOpen, setIsAddPreAuthModalOpen] = useState(false);
    const [isAddClaimModalOpen, setIsAddClaimModalOpen] = useState(false);

    // Form states
    const [providerForm, setProviderForm] = useState({ name: '', type: 'Cashless', contact_name: '', phone: '', email: '', tat: '3' });
    const [preAuthForm, setPreAuthForm] = useState({ patient: '', provider: '', treatment: '', cost: '', code: '', justification: '' });
    const [claimForm, setClaimForm] = useState({ patient: '', provider: '', treatment: '', amount: '', submission_method: 'Online Portal' });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        try {
            // Providers
            const { data: provs } = await supabase.from('insurance_providers').select('*').order('name');
            if (provs) setProviders(provs);

            // Pre-Auths
            const { data: auths } = await supabase.from('insurance_pre_auths').select('*').order('submitted_date', { ascending: false });
            if (auths) setPreAuths(auths);

            // Claims
            const { data: clms } = await supabase.from('insurance_claims').select('*').order('submitted_date', { ascending: false });
            if (clms) setClaims(clms);
        } catch (e) {
            console.error('Data loading error or tables missing');
        }
    };

    const handleSaveProvider = async (e: any) => {
        e.preventDefault();
        if (!providerForm.name) return showToast('Provider Name is required', 'error');

        const { error } = await supabase.from('insurance_providers').insert({
            name: providerForm.name,
            type: providerForm.type,
            contact_person: providerForm.contact_name,
            phone: providerForm.phone,
            email: providerForm.email,
            tat: parseInt(providerForm.tat) || 3,
            status: 'Active'
        });

        if (!error) {
            showToast('Provider added successfully', 'success');
            setIsAddProviderModalOpen(false);
            setProviderForm({ name: '', type: 'Cashless', contact_name: '', phone: '', email: '', tat: '3' });
            fetchData();
        } else {
            showToast('Failed to save provider: ' + error.message, 'error');
        }
    };

    const handleSavePreAuth = async (e: any) => {
        e.preventDefault();
        if (!preAuthForm.patient || !preAuthForm.treatment) return showToast('Fill required fields', 'error');

        const { error } = await supabase.from('insurance_pre_auths').insert({
            patient_name: preAuthForm.patient,
            provider_name: preAuthForm.provider,
            treatment: preAuthForm.treatment,
            estimated_cost: parseFloat(preAuthForm.cost) || 0,
            status: 'Pending',
            submitted_date: new Date().toISOString().split('T')[0]
        });

        if (!error) {
            showToast('Pre-Auth request created', 'success');
            setIsAddPreAuthModalOpen(false);
            setPreAuthForm({ patient: '', provider: '', treatment: '', cost: '', code: '', justification: '' });
            fetchData();
        } else {
            showToast('Failed to create request: ' + error.message, 'error');
        }
    };

    const handleSaveClaim = async (e: any) => {
        e.preventDefault();
        if (!claimForm.patient || !claimForm.amount) return showToast('Fill required fields', 'error');

        const { error } = await supabase.from('insurance_claims').insert({
            patient_name: claimForm.patient,
            provider_name: claimForm.provider,
            treatment: claimForm.treatment,
            claim_amount: parseFloat(claimForm.amount) || 0,
            status: 'Submitted',
            submitted_date: new Date().toISOString().split('T')[0]
        });

        if (!error) {
            showToast('Claim submitted successfully', 'success');
            setIsAddClaimModalOpen(false);
            setClaimForm({ patient: '', provider: '', treatment: '', amount: '', submission_method: 'Online Portal' });
            fetchData();
        } else {
            showToast('Failed to submit claim: ' + error.message, 'error');
        }
    };

    return (
        <div className="animate-slide-up space-y-6 pb-20 relative overflow-hidden">
            {/* Header */}
            <div className={`p-6 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 backdrop-blur-md transition-all ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div>
                    <h2 className="text-xl md:text-2xl font-sans font-bold tracking-tight flex items-center gap-2">
                        <Shield className="text-primary" /> Insurance Deck
                    </h2>
                    <p className={`text-xs font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Claims processing, splitted bill computations & authorizations</p>
                </div>
                <button onClick={fetchData} className={`p-2.5 rounded-xl border transition-all ${isDark ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}><RefreshCw size={14} /></button>
            </div>

            {/* Sub Tabs Navigation */}
            <div className={`flex p-1 rounded-2xl shadow-lg w-max border overflow-x-auto max-w-full backdrop-blur-md`} style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)' }}>
                {[
                    ['overview', 'Overview', ClipboardList],
                    ['providers', 'Providers', Shield],
                    ['policies', 'Patient Policies', FileText],
                    ['preauth', 'Pre-Auth', Lock],
                    ['claims', 'Claims Center', PieChart],
                    ['finance', 'Reconciliation', DollarSign]
                ].map(([tab, label, Icon]: any) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-400 hover:text-primary hover:bg-primary/5'}`}><Icon size={14} /> {label}</button>
                ))}
            </div>

            {/* Content Render Switcher */}
            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }}>
                    {activeTab === 'overview' && <OverviewTab claims={claims} preAuths={preAuths} isDark={isDark} />}
                    {activeTab === 'providers' && <ProvidersTab providers={providers} setIsAddProviderModalOpen={setIsAddProviderModalOpen} isDark={isDark} />}
                    {activeTab === 'policies' && <PoliciesTab isDark={isDark} />}
                    {activeTab === 'preauth' && <PreAuthTab preAuths={preAuths} setIsAddPreAuthModalOpen={setIsAddPreAuthModalOpen} isDark={isDark} />}
                    {activeTab === 'claims' && <ClaimsTab claims={claims} setIsAddClaimModalOpen={setIsAddClaimModalOpen} isDark={isDark} />}
                    {activeTab === 'finance' && <FinanceTab isDark={isDark} />}
                </motion.div>
            </AnimatePresence>

            {/* Modal Components */}
            <Modal isOpen={isAddProviderModalOpen} onClose={() => setIsAddProviderModalOpen(false)} title="Add Insurance Provider" maxWidth="max-w-md">
                <form onSubmit={handleSaveProvider} className="space-y-3.5">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 mb-1 block">Company Name</label>
                        <input type="text" value={providerForm.name} onChange={e => setProviderForm({ ...providerForm, name: e.target.value })} className={`w-full border rounded-xl px-3 py-2 text-xs font-bold outline-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="Star Health etc." />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 mb-1 block">Insurance Type</label>
                            <CustomSelect options={[{ value: 'Cashless', label: 'Cashless' }, { value: 'Reimbursement', label: 'Reimbursement' }, { value: 'Both', label: 'Both' }]} value={providerForm.type} onChange={v => setProviderForm({ ...providerForm, type: v })} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 mb-1 block">Turnaround Time (Days)</label>
                            <input type="number" value={providerForm.tat} onChange={e => setProviderForm({ ...providerForm, tat: e.target.value })} className={`w-full border rounded-xl px-3 py-2 text-xs font-bold ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`} />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 mb-1 block">Contact Person</label>
                        <input type="text" value={providerForm.contact_name} onChange={e => setProviderForm({ ...providerForm, contact_name: e.target.value })} className={`w-full border rounded-xl px-3 py-2 text-xs font-bold ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="Sales Manager etc" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 mb-1 block">Phone</label>
                            <input type="text" value={providerForm.phone} onChange={e => setProviderForm({ ...providerForm, phone: e.target.value })} className={`w-full border rounded-xl px-3 py-2 text-xs font-bold ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 mb-1 block">Email</label>
                            <input type="email" value={providerForm.email} onChange={e => setProviderForm({ ...providerForm, email: e.target.value })} className={`w-full border rounded-xl px-3 py-2 text-xs font-bold ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`} />
                        </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={() => setIsAddProviderModalOpen(false)} className="flex-1 py-2 rounded-xl border text-xs font-bold">Cancel</button>
                        <button type="submit" className="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-bold">Save Provider</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isAddPreAuthModalOpen} onClose={() => setIsAddPreAuthModalOpen(false)} title="Create Pre-Auth Request" maxWidth="max-w-md">
                <form onSubmit={handleSavePreAuth} className="space-y-3.5">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 mb-1 block">Patient Name</label>
                        <input type="text" value={preAuthForm.patient} onChange={e => setPreAuthForm({ ...preAuthForm, patient: e.target.value })} className={`w-full border rounded-xl px-3 py-2 text-xs font-bold ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="Rahul Sharma etc" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 mb-1 block">Provider</label>
                        <input type="text" value={preAuthForm.provider} onChange={e => setPreAuthForm({ ...preAuthForm, provider: e.target.value })} className={`w-full border rounded-xl px-3 py-2 text-xs font-bold ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="Provider Co." />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 mb-1 block">Treatment Requested</label>
                        <input type="text" value={preAuthForm.treatment} onChange={e => setPreAuthForm({ ...preAuthForm, treatment: e.target.value })} className={`w-full border rounded-xl px-3 py-2 text-xs font-bold ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`} />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 mb-1 block">Estimated Cost</label>
                        <input type="number" value={preAuthForm.cost} onChange={e => setPreAuthForm({ ...preAuthForm, cost: e.target.value })} className={`w-full border rounded-xl px-3 py-2 text-xs font-bold ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`} />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={() => setIsAddPreAuthModalOpen(false)} className="flex-1 py-2 rounded-xl border text-xs font-bold">Cancel</button>
                        <button type="submit" className="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-bold">Submit Request</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isAddClaimModalOpen} onClose={() => setIsAddClaimModalOpen(false)} title="Submit Insurance Claim" maxWidth="max-w-md">
                <form onSubmit={handleSaveClaim} className="space-y-3.5">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 mb-1 block">Patient Name</label>
                        <input type="text" value={claimForm.patient} onChange={e => setClaimForm({ ...claimForm, patient: e.target.value })} className={`w-full border rounded-xl px-3 py-2 text-xs font-bold ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`} />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 mb-1 block">Provider</label>
                        <input type="text" value={claimForm.provider} onChange={e => setClaimForm({ ...claimForm, provider: e.target.value })} className={`w-full border rounded-xl px-3 py-2 text-xs font-bold ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`} />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 mb-1 block">Claim Amount</label>
                        <input type="number" value={claimForm.amount} onChange={e => setClaimForm({ ...claimForm, amount: e.target.value })} className={`w-full border rounded-xl px-3 py-2 text-xs font-bold ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`} />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={() => setIsAddClaimModalOpen(false)} className="flex-1 py-2 rounded-xl border text-xs font-bold">Cancel</button>
                        <button type="submit" className="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-bold">Submit Claim</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

// ───── OVERVIEW TAB ─────
function OverviewTab({ claims, preAuths, isDark }: any) {
    const stats = [
        { label: 'Pending Pre-Auths', value: preAuths ? preAuths.filter((p: any) => p.status === 'Pending').length : 0, icon: Lock, color: 'text-amber-500' },
        { label: 'Active Provider Masters', value: 2, icon: Shield, color: 'text-primary' },
        { label: 'Submitted Claims', value: claims ? claims.filter((c: any) => c.status === 'Submitted').length : 0, icon: ClipboardList, color: 'text-violet-500' },
        { label: 'Outstandings Claims', value: '₹0', icon: DollarSign, color: 'text-emerald-500' }
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                    <div key={i} className={`p-4 rounded-xl border relative overflow-hidden group backdrop-blur-md ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                        <div className={`absolute -right-2 -top-2 p-4 opacity-5 group-hover:scale-125 transition-transform ${s.color}`}><s.icon size={40} /></div>
                        <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{s.label}</p>
                        <h4 className="text-xl font-black">{s.value}</h4>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2"><AlertTriangle size={14} className="text-amber-500" /> Actionable Alerts (Section 10)</h4>
                    <div className="space-y-2">
                        <div className="p-3 bg-amber-50 dark:bg-amber-500/5 rounded-xl border border-amber-100 dark:border-amber-500/10 flex items-center justify-between"><p className="text-xs font-bold text-amber-700 dark:text-amber-500">Demo Alert: Policies expiring triggers</p><Eye size={14} className="cursor-pointer" /></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ───── PROVIDERS TAB ─────
function ProvidersTab({ providers, setIsAddProviderModalOpen, isDark }: any) {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center"><h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Providers Master</h3><button onClick={() => setIsAddProviderModalOpen(true)} className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5"><Plus size={14} /> Add Provider</button></div>
            <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                {providers.length > 0 ? (
                    <table className="w-full text-left">
                        <thead className={`border-b ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}><tr className="text-[9px] font-black text-slate-500 uppercase"><th className="p-4">Provider</th><th className="p-4">Type</th><th className="p-4">TAT</th><th className="p-4">Contact</th><th className="p-4">Status</th></tr></thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {providers.map((p: any) => (
                                <tr key={p.id} className="hover:bg-slate-50/20 text-xs font-bold transition-all"><td className="p-4">{p.name}</td><td className="p-4">{p.type}</td><td className="p-4">{p.tat}</td><td className="p-4">{p.phone}</td><td className="p-4"><span className={`px-2 py-0.5 rounded text-[10px] font-black ${p.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>{p.status}</span></td></tr>
                            ))}
                        </tbody>
                    </table>
                ) : <div className="p-10 text-center text-slate-400 text-xs font-bold">No real data providers registered yet. Click "Add Provider" above.</div>}
            </div>
        </div>
    );
}

// ───── POLICIES TAB ─────
function PoliciesTab({ isDark }: any) { return <div className="p-10 text-center text-slate-400 text-xs font-bold">Patient Policies Management Grid (Sub-limits triggers framing setup)</div>; }

// ───── PRE-AUTH TAB ─────
function PreAuthTab({ preAuths, setIsAddPreAuthModalOpen, isDark }: any) {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center"><h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Pre-Authorization Desk</h3><button onClick={() => setIsAddPreAuthModalOpen(true)} className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5"><Plus size={14} /> Create Request</button></div>
            <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                {preAuths.length > 0 ? (
                    <table className="w-full text-left">
                        <thead className={`border-b ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}><tr className="text-[9px] font-black text-slate-500 uppercase"><th className="p-4">ID</th><th className="p-4">Patient</th><th className="p-4">Treatment</th><th className="p-4">Status</th><th className="p-4 text-right">Appr Amount</th></tr></thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {preAuths.map((p: any) => (
                                <tr key={p.id} className="hover:bg-slate-50/20 text-xs font-bold transition-all"><td className="p-4 text-slate-400">{p.id}</td><td className="p-4">{p.patient_name}</td><td className="p-4">{p.treatment}</td><td className="p-4"><span className={`px-2 py-0.5 rounded text-[10px] font-black ${p.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{p.status}</span></td><td className="p-4 text-right text-emerald-600">{p.approved_amount}</td></tr>
                            ))}
                        </tbody>
                    </table>
                ) : <div className="p-10 text-center text-slate-400 text-xs font-bold">No requests submitted yet. Click "Create Request" above.</div>}
            </div>
        </div>
    );
}

// ───── CLAIMS TAB ─────
function ClaimsTab({ claims, setIsAddClaimModalOpen, isDark }: any) {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center"><h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Claim Management Deck</h3><button onClick={() => setIsAddClaimModalOpen(true)} className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5"><Plus size={14} /> Submit Claim</button></div>
            <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                {claims.length > 0 ? (
                    <table className="w-full text-left">
                        <thead className={`border-b ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}><tr className="text-[9px] font-black text-slate-500 uppercase"><th className="p-4">ID</th><th className="p-4">Patient</th><th className="p-4">Provider</th><th className="p-4">Amount</th><th className="p-4">Status</th></tr></thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {claims.map((c: any) => (
                                <tr key={c.id} className="hover:bg-slate-50/20 text-xs font-bold transition-all"><td className="p-4 text-slate-400">{c.id}</td><td className="p-4">{c.patient_name}</td><td className="p-4">{c.provider_name}</td><td className="p-4">{c.claim_amount}</td><td className="p-4"><span className={`px-2 py-0.5 rounded text-[10px] font-black ${c.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>{c.status}</span></td></tr>
                            ))}
                        </tbody>
                    </table>
                ) : <div className="p-10 text-center text-slate-400 text-xs font-bold">No claims submitted yet. Click "Submit Claim" above.</div>}
            </div>
        </div>
    );
}

// ───── FINANCE TAB ─────
function FinanceTab({ isDark }: any) { return <div className="p-10 text-center text-slate-400 text-xs font-bold">Reconcile Batch logs / Allocations framing setup Dashboard</div>; }
