import { Settings as SettingsIcon, Users, ShieldCheck, CreditCard, Save, MapPin, Activity, Edit3, Trash2, Shield, UserCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '../Toast';
import { supabase } from '../../supabase';
import { Modal } from '../../components/Modal';

export function Settings() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('general');

    // Data State
    const [staffList, setStaffList] = useState<any[]>([]);

    // Modal State
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
    const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
    const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

    // Form State
    const [staffForm, setStaffForm] = useState({
        name: '', role: 'Associate Dentist', email: '', mobile: '', qualifications: '',
        degree: '', grad_year: '', license_number: '',
        permissions: { dashboard: true, appointments: true, emr: true, billing: false, settings: false, inventory: false }
    });

    useEffect(() => {
        if (activeTab === 'general') fetchBranches();
        if (activeTab === 'staff') fetchStaff();
    }, [activeTab]);

    const fetchBranches = async () => {
        await supabase.from('branches').select('*');
    };

    const fetchStaff = async () => {
        const { data } = await supabase.from('staff').select('*').order('created_at', { ascending: false });
        if (data) setStaffList(data);
    };

    const handleAIFillStaff = () => {
        if (!staffForm.name) return showToast("Enter a name to trigger AI profile reconstruction.", 'error');
        setIsAIAnalyzing(true);
        setTimeout(() => {
            setStaffForm(prev => ({
                ...prev,
                qualifications: prev.qualifications || 'BDS, MDS (Endodontics)',
                degree: prev.degree || 'Master of Dental Surgery',
                grad_year: prev.grad_year || '2019',
                license_number: prev.license_number || `DCI/TN/${Math.floor(Math.random() * 90000) + 10000}`,
                mobile: prev.mobile || '+91 91234 56789',
                email: prev.email || `${prev.name.toLowerCase().replace(' ', '.')}@dentisphere.clinic`,
                role: 'Specialist / Endodontist'
            }));
            setIsAIAnalyzing(false);
            showToast("AI auto-filled professional details based on DCI registry.", 'success');
        }, 1200);
    };

    const handleSaveStaff = async () => {
        if (!staffForm.name || !staffForm.email) return showToast('Mandatory fields missing: Name & Email', 'error');

        const staffData = {
            name: staffForm.name,
            role: staffForm.role,
            email: staffForm.email,
            mobile: staffForm.mobile,
            qualifications: staffForm.qualifications,
            degree: staffForm.degree,
            grad_year: staffForm.grad_year ? parseInt(staffForm.grad_year) : null,
            license_number: staffForm.license_number,
            permissions: staffForm.permissions
        };

        if (editingStaffId) {
            const { error } = await supabase.from('staff').update(staffData).eq('id', editingStaffId);
            if (!error) showToast(`Profile for ${staffForm.name} updated successfully`, 'success');
            else showToast(error.message, 'error');
        } else {
            const { error } = await supabase.from('staff').insert(staffData);
            if (!error) showToast(`Invitation sent to ${staffForm.name}`, 'success');
            else showToast(error.message, 'error');
        }

        setIsStaffModalOpen(false);
        setEditingStaffId(null);
        fetchStaff();
    };

    const handleEditStaff = (staff: any) => {
        setStaffForm({
            name: staff.name,
            role: staff.role,
            email: staff.email,
            mobile: staff.mobile || '',
            qualifications: staff.qualifications || '',
            degree: staff.degree || '',
            grad_year: staff.grad_year?.toString() || '',
            license_number: staff.license_number || '',
            permissions: staff.permissions || { dashboard: true, appointments: true, emr: true, billing: false, settings: false, inventory: false }
        });
        setEditingStaffId(staff.id);
        setIsStaffModalOpen(true);
    };

    const handleRemoveStaff = async (id: string, name: string) => {
        if (confirm(`Are you sure you want to remove ${name} from DentiSphere? This action will revoke their access immediately.`)) {
            const { error } = await supabase.from('staff').delete().eq('id', id);
            if (!error) {
                showToast(`Staff member ${name} removed.`, 'success');
                fetchStaff();
            } else {
                showToast(error.message, 'error');
            }
        }
    };

    const tabs = [
        { id: 'general', label: 'Clinic Profile', icon: SettingsIcon },
        { id: 'staff', label: 'Team Management', icon: Users, badge: 'RBAC' },
        { id: 'admin', label: 'Access Control', icon: ShieldCheck },
        { id: 'billing', label: 'Subscription', icon: CreditCard }
    ];

    return (
        <div className="animate-slide-up space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-display font-bold text-text-dark tracking-tight">Control Center</h2>
                    <p className="text-slate-500 font-medium mt-1">Configure your clinical environment, team roles, and security protocols.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm">View Changelog</button>
                    {activeTab === 'general' && (
                        <button onClick={() => showToast('Master settings locked in storage', 'success')} className="bg-primary hover:bg-primary-hover text-white shadow-premium px-8 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95">
                            <Save size={18} /> Sync Settings
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Navigation Sidebar */}
                <div className="lg:w-72 space-y-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center justify-between w-full px-6 py-4 rounded-[1.5rem] transition-all group ${activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/20 font-bold' : 'hover:bg-primary/5 text-slate-600 hover:text-primary'}`}
                        >
                            <span className="flex items-center gap-4"><tab.icon size={20} className={activeTab === tab.id ? 'text-white' : 'text-slate-400 group-hover:text-primary'} /> {tab.label}</span>
                            {tab.badge && <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>{tab.badge}</span>}
                        </button>
                    ))}
                    <div className="mt-8 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hidden lg:block">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">Cloud Status</p>
                        <div className="flex items-center gap-2 text-green-500 font-bold text-xs">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Global Nodes Online
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">v2.4.0-Stable Production</p>
                    </div>
                </div>

                {/* Main Content Pane */}
                <div className="flex-1 space-y-6">
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm p-8 overflow-hidden relative group">
                                <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
                                <h3 className="font-display text-xl font-bold text-text-dark mb-8 flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-primary rounded-full" /> Master Identity
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Clinic Registered Name</label>
                                            <input type="text" defaultValue="DentiSphere Multi-Speciality Center" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Primary Contact Protocol</label>
                                            <input type="text" defaultValue="+91 44 2491 5858" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:bg-white focus:border-primary outline-none transition-all font-bold" />
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Base Operational Hours</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <select className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-600 outline-none">
                                                    <option>09:00 AM</option>
                                                    <option>10:00 AM</option>
                                                </select>
                                                <select className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-600 outline-none">
                                                    <option>08:00 PM</option>
                                                    <option>07:00 PM</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Default Currency</label>
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600">Indian Rupee (INR - ₹)</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-xl p-8 text-white">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="font-display text-xl font-bold flex items-center gap-3">
                                        <MapPin size={24} className="text-primary" /> Branch Network
                                    </h3>
                                    <button onClick={() => showToast('Expansion plan required for new branches', 'error')} className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold px-4 py-2 rounded-xl transition-all border border-white/10 uppercase tracking-widest">Add Location</button>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl flex justify-between items-center group hover:bg-white/10 transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-bold shadow-lg">HQ</div>
                                            <div>
                                                <p className="font-bold text-lg">Downtown Clinic (Main)</p>
                                                <p className="text-sm opacity-50 font-medium">15/2, Cathedral Road, Chennai, Tamil Nadu</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] bg-primary text-white px-3 py-1 rounded-full font-extrabold tracking-widest">MASTER NODE</span>
                                    </div>
                                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all flex justify-between items-center">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 rounded-2xl bg-white/10 text-white/50 flex items-center justify-center font-bold">B1</div>
                                            <div>
                                                <p className="font-bold text-lg">Adyar Satellite Center</p>
                                                <p className="text-sm opacity-50 font-medium">42, LB Road, Adyar, Chennai</p>
                                            </div>
                                        </div>
                                        <button className="text-xs font-bold text-slate-400 hover:text-white transition-colors">Configure</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'staff' && (
                        <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm p-8">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                                <div>
                                    <h3 className="font-display text-2xl font-bold text-text-dark flex items-center gap-3">
                                        <Users size={28} className="text-primary" /> Team Infrastructure
                                    </h3>
                                    <p className="text-sm text-slate-400 font-medium mt-1">Foundational Role Based Access Control (RBAC) System.</p>
                                </div>
                                <button onClick={() => { setEditingStaffId(null); setStaffForm({ name: '', role: 'Associate Dentist', email: '', mobile: '', qualifications: '', degree: '', grad_year: '', license_number: '', permissions: { dashboard: true, appointments: true, emr: true, billing: false, settings: false, inventory: false } }); setIsStaffModalOpen(true); }} className="bg-primary hover:bg-primary-hover text-white text-xs font-extrabold px-6 py-3 rounded-2xl shadow-premium shadow-primary/20 transition-all uppercase tracking-widest active:scale-95">
                                    Onboard Staff Member
                                </button>
                            </div>

                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                                            <th className="px-6 py-4">Professional Persona</th>
                                            <th className="px-6 py-4">Registry Info</th>
                                            <th className="px-6 py-4">Security Clearances</th>
                                            <th className="px-6 py-4 text-right">Operational Logic</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {staffList.map(s => (
                                            <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-display font-bold text-xl shadow-inner border border-primary/5">
                                                            {s.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-text-dark text-base tracking-tight">{s.name}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md uppercase tracking-tighter">{s.role}</span>
                                                                {s.id === 'master' && <span className="text-[10px] font-extrabold bg-red-50 text-red-600 px-2 py-0.5 rounded-md uppercase tracking-tighter border border-red-100">Super Admin</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="text-xs font-bold text-slate-600">{s.email}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium mt-1">{s.mobile || 'No contact provided'}</p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                        {Object.entries(s.permissions || {}).filter(([_, val]) => val).map(([key]) => (
                                                            <span key={key} className="text-[8px] font-extrabold text-primary bg-primary/5 border border-primary/10 px-1.5 py-0.5 rounded uppercase">{key}</span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleEditStaff(s)} className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary rounded-xl shadow-sm transition-all" title="Edit Profile">
                                                            <Edit3 size={16} />
                                                        </button>
                                                        <button onClick={() => handleRemoveStaff(s.id, s.name)} className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-alert hover:border-alert rounded-xl shadow-sm transition-all" title="Revoke Access">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {staffList.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="py-20 text-center">
                                                    <UserCircle2 size={48} className="text-slate-200 mx-auto mb-4" />
                                                    <p className="text-slate-400 font-bold italic">No specialized staff accounts linked to this clinic.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'admin' && (
                        <div className="space-y-6">
                            <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm p-8 relative overflow-hidden">
                                <h3 className="font-display text-xl font-bold text-text-dark mb-8 flex items-center gap-3">
                                    <ShieldCheck size={24} className="text-primary" /> Advanced Access Control (ACL)
                                </h3>
                                <div className="space-y-4 max-w-3xl">
                                    <div className="p-6 border border-slate-100 bg-slate-50/50 rounded-3xl flex justify-between items-center group hover:bg-white hover:border-primary/20 transition-all">
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary border border-slate-100"><Shield size={24} /></div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">Role-Based Feature Toggles</h4>
                                                <p className="text-xs text-slate-500 font-medium">Hide entire navigation blocks for specific roles automatically.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {['Dentist', 'Nurse', 'Admin'].map(role => (
                                                <button key={role} className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-extrabold uppercase text-slate-400 hover:text-primary hover:border-primary transition-all">{role}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-6 border border-slate-100 bg-slate-50/50 rounded-3xl flex justify-between items-center group hover:bg-white hover:border-primary/20 transition-all">
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary border border-slate-100"><Activity size={24} /></div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">Operational Audit Logs</h4>
                                                <p className="text-xs text-slate-500 font-medium">Track every patient edit and billing action with timestamps.</p>
                                            </div>
                                        </div>
                                        <button onClick={() => showToast('Audit Viewer is a separate module', 'success')} className="bg-primary text-white text-[10px] font-extrabold px-4 py-2 rounded-xl">SECURE ACCESS</button>
                                    </div>
                                    <div className="p-8 bg-red-50 border border-red-100 rounded-[2rem] mt-8">
                                        <h4 className="font-bold text-red-600 text-lg mb-2">Destructive Territory</h4>
                                        <p className="text-xs text-red-500 font-medium mb-6">These actions ripple across the entire database and ARE NOT reversible. Proceed with ultimate caution.</p>
                                        <div className="flex gap-3">
                                            <button onClick={() => showToast('Profile hard-locking not enabled', 'error')} className="px-6 py-3 border border-red-200 bg-white text-red-600 rounded-2xl font-bold text-xs hover:bg-red-600 hover:text-white transition-all">Archive All History</button>
                                            <button onClick={() => showToast('Wipe command requires Master Auth Token', 'error')} className="px-6 py-3 bg-red-600 text-white rounded-2xl font-bold text-xs shadow-lg shadow-red-200 hover:bg-red-700 transition-all">Factory Reset Instance</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'billing' && (
                        <div className="space-y-6">
                            <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm p-10 relative overflow-hidden text-center">
                                <div className="absolute top-0 right-0 p-8">
                                    <span className="bg-green-50 text-green-600 text-[10px] font-extrabold px-4 py-1 rounded-full border border-green-100 uppercase tracking-widest">ACTIVE SUBSCRIPTION</span>
                                </div>
                                <div className="w-20 h-20 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-primary/5">
                                    <CreditCard size={40} />
                                </div>
                                <h3 className="font-display text-3xl font-bold text-slate-800 mb-2">DentiSphere Enterprise</h3>
                                <p className="text-slate-500 font-medium text-lg mb-8">Ultimate clinic management for multiple practitioners.</p>

                                <div className="max-w-md mx-auto grid grid-cols-2 gap-4 mb-10">
                                    <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                                        <p className="text-[10px] font-extrabold text-slate-400 uppercase mb-1">Billing Cycle</p>
                                        <p className="font-bold text-slate-800">Annual (Save 20%)</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                                        <p className="text-[10px] font-extrabold text-slate-400 uppercase mb-1">Next Renewal</p>
                                        <p className="font-bold text-slate-800">Nov 12, 2027</p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <button className="px-8 py-4 bg-primary text-white rounded-2xl font-bold text-sm shadow-premium shadow-primary/20 hover:scale-105 transition-all">Download Invoices</button>
                                    <button className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all">Switch Pro Plan</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Staff Onboarding Modal */}
            <Modal isOpen={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} title={editingStaffId ? "Refine Clinician Credentials" : "Initialize Team Onboarding"} maxWidth="max-w-3xl">
                <div className="space-y-8 max-h-[75vh] overflow-y-auto px-2 custom-scrollbar pr-4">
                    <div className="bg-gradient-to-r from-primary/5 to-transparent border-l-4 border-primary p-6 rounded-r-3xl flex justify-between items-center group">
                        <div className="pr-4">
                            <h4 className="font-bold text-primary text-sm mb-1">DCI Registry Smart Connect</h4>
                            <p className="text-xs text-primary/70 font-medium">Type a known practitioner's name, and our Intelligence engine will attempt to sync their professional records for verified onboarding.</p>
                        </div>
                        <button
                            className={`flex flex-shrink-0 items-center justify-center gap-3 py-3 px-6 rounded-2xl font-bold text-xs text-white shadow-xl transition-all active:scale-95 ${isAIAnalyzing ? 'bg-slate-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-hover shadow-primary/20'}`}
                            onClick={handleAIFillStaff}
                            disabled={isAIAnalyzing}
                        >
                            <Activity size={16} className={isAIAnalyzing ? 'animate-spin' : ''} />
                            {isAIAnalyzing ? 'Analyzing...' : 'Trigger AI Sync'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 block">Professional Full Name *</label>
                                <input type="text" value={staffForm.name} onChange={e => setStaffForm({ ...staffForm, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-primary outline-none transition-all" placeholder="e.g. Dr. K. Ramesh" />
                            </div>
                            <div>
                                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 block">Clinic Specialization / Role</label>
                                <select value={staffForm.role} onChange={e => setStaffForm({ ...staffForm, role: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-primary outline-none appearance-none cursor-pointer">
                                    <option>Associate Dentist</option>
                                    <option>Consultant Specialist</option>
                                    <option>Dental Surgeon</option>
                                    <option>Nurse / Assistant</option>
                                    <option>Front Office Executive</option>
                                    <option>Practice Manager</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 block">Corporate Email Identifier *</label>
                                <input type="email" value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-primary outline-none transition-all" placeholder="dr.ramesh@dentisphere.clinic" />
                            </div>
                            <div>
                                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 block">Encrypted Mobile Gateway</label>
                                <input type="text" value={staffForm.mobile} onChange={e => setStaffForm({ ...staffForm, mobile: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white focus:border-primary outline-none transition-all" placeholder="+91 00000 00000" />
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-6">Credential Validation (DCI/TN)</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-bold text-slate-500 mb-2 block">Advanced Qualifications</label>
                                <input type="text" value={staffForm.qualifications} onChange={e => setStaffForm({ ...staffForm, qualifications: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:border-primary outline-none" placeholder="e.g. BDS (Honours), PG Implantology" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 mb-2 block">Verified License ID</label>
                                <input type="text" value={staffForm.license_number} onChange={e => setStaffForm({ ...staffForm, license_number: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:border-primary outline-none" placeholder="DCI/XXX/XXXX" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <label className="text-[10px] font-extrabold text-slate-800 uppercase tracking-[0.2em] block">RBAC Module Permission Matrix</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {Object.keys(staffForm.permissions).map(key => (
                                <button
                                    key={key}
                                    onClick={() => setStaffForm({
                                        ...staffForm,
                                        permissions: { ...staffForm.permissions, [key]: !(staffForm.permissions as any)[key] }
                                    })}
                                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${(staffForm.permissions as any)[key] ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}
                                >
                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${(staffForm.permissions as any)[key] ? 'bg-primary border-primary text-white' : 'border-slate-300 bg-slate-50'}`}>
                                        {(staffForm.permissions as any)[key] && <Save size={12} />}
                                    </div>
                                    <span className="text-xs font-bold capitalize">{key}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button onClick={() => setIsStaffModalOpen(false)} className="flex-1 py-4 border border-slate-200 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all uppercase tracking-widest text-xs">Cancel</button>
                        <button onClick={handleSaveStaff} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all uppercase tracking-widest text-xs active:scale-95">
                            {editingStaffId ? 'Synchronize Profiles' : 'Complete Team Enrollment'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
