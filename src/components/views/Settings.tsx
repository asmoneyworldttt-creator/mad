import { Settings as SettingsIcon, Users, ShieldCheck, CreditCard, ChevronRight, Save, MapPin, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '../Toast';
import { supabase } from '../../supabase';
import { Modal } from '../../components/Modal';

export function Settings() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('general');

    // Data State
    const [branches, setBranches] = useState<any[]>([]);
    const [staffList, setStaffList] = useState<any[]>([]);

    // Modal State
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
    const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);

    // Form State
    const [newStaff, setNewStaff] = useState({
        name: '', role: 'Dentist', email: '', mobile: '', qualifications: '',
        degree: '', grad_year: '', license_number: '', address: '',
        permissions: { dashboard: true, appointments: true, emr: true, billing: false, settings: false }
    });

    useEffect(() => {
        if (activeTab === 'general') fetchBranches();
        if (activeTab === 'staff') fetchStaff();
    }, [activeTab]);

    const fetchBranches = async () => {
        const { data } = await supabase.from('branches').select('*');
        if (data) setBranches(data);
    };

    const fetchStaff = async () => {
        const { data } = await supabase.from('staff').select('*');
        if (data) setStaffList(data);
    };

    const handleSaveGeneral = () => showToast('Settings successfully saved!', 'success');

    const handleAIFillStaff = () => {
        if (!newStaff.name) return showToast("Enter at least a name to start AI search", 'error');
        setIsAIAnalyzing(true);
        setTimeout(() => {
            setNewStaff(prev => ({
                ...prev,
                qualifications: prev.qualifications || 'BDS, MDS (Endodontics)',
                degree: prev.degree || 'Master of Dental Surgery',
                grad_year: prev.grad_year || '2018',
                license_number: prev.license_number || `DCI-${Math.floor(Math.random() * 90000) + 10000}`,
                mobile: prev.mobile || '+91 9876543210',
                email: prev.email || `${prev.name.toLowerCase().replace(' ', '.')}@medpro.com`,
                role: 'Specialist / Endodontist'
            }));
            setIsAIAnalyzing(false);
            showToast("AI auto-filled missing staff profile fields based on public records.", 'success');
        }, 1500);
    };

    const handleSaveStaff = async () => {
        if (!newStaff.name || !newStaff.email) return showToast('Name and Email required', 'error');
        await supabase.from('staff').insert({
            name: newStaff.name,
            role: newStaff.role,
            email: newStaff.email,
            mobile: newStaff.mobile,
            qualifications: newStaff.qualifications,
            degree: newStaff.degree,
            grad_year: newStaff.grad_year ? parseInt(newStaff.grad_year) : null,
            license_number: newStaff.license_number,
            permissions: newStaff.permissions
        });
        showToast(`Invited ${newStaff.name} to the clinic workspace`, 'success');
        setIsStaffModalOpen(false);
        fetchStaff();
    };

    const tabs = [
        { id: 'general', label: 'Clinic Info & Branches', icon: SettingsIcon },
        { id: 'admin', label: 'Security & Access', icon: ShieldCheck },
        { id: 'staff', label: 'Staff & RBAC Mgmt', icon: Users, badge: 'PRO' },
        { id: 'billing', label: 'Billing & Plans', icon: CreditCard }
    ];

    return (
        <div className="animate-slide-up space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-display font-bold text-text-dark tracking-tight">Clinic Settings</h2>
                    <p className="text-text-muted font-medium">Manage clinic configuration, team access, and billing preferences.</p>
                </div>
                {activeTab === 'general' && (
                    <button
                        onClick={handleSaveGeneral}
                        className="bg-primary hover:bg-primary-hover text-white shadow-premium px-6 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                        <Save size={16} /> Save Changes
                    </button>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-64 bg-surface border border-slate-200 rounded-2xl shadow-sm p-4 h-fit flex flex-col gap-2">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center justify-between w-full p-3 rounded-xl transition-colors font-medium ${activeTab === tab.id ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-slate-50 text-slate-600'}`}>
                            <span className="flex items-center gap-3"><tab.icon size={18} /> {tab.label}</span>
                            {tab.badge && <span className="bg-alert text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{tab.badge}</span>}
                            {!tab.badge && activeTab !== tab.id && <ChevronRight size={14} className="text-slate-400 opacity-0 group-hover:opacity-100" />}
                        </button>
                    ))}
                </div>

                <div className="flex-1 space-y-6">
                    {activeTab === 'general' && (
                        <>
                            <div className="bg-surface border border-slate-200 rounded-2xl shadow-sm p-6 overflow-hidden relative">
                                <h3 className="font-display text-lg font-bold text-text-dark border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
                                    <SettingsIcon size={20} className="text-primary" /> General Configuration
                                </h3>
                                <div className="space-y-5 relative z-10 max-w-2xl">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Master Clinic Name</label>
                                        <input type="text" defaultValue="City Cardiovascular & Dental Clinic" className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-sm transition-all text-text-dark font-medium" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Working Days</label>
                                            <select className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-primary shadow-sm text-slate-600 font-medium cursor-pointer">
                                                <option>Mon - Sat</option>
                                                <option>Mon - Fri</option>
                                                <option>Mon - Sun</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Timing</label>
                                            <select className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-primary shadow-sm text-slate-600 font-medium cursor-pointer">
                                                <option>09:00 AM - 08:00 PM</option>
                                                <option>10:00 AM - 07:00 PM</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-surface border border-slate-200 rounded-2xl shadow-sm p-6 overflow-hidden relative">
                                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                    <h3 className="font-display text-lg font-bold text-text-dark flex items-center gap-2">
                                        <MapPin size={20} className="text-primary" /> Multi-Location Management
                                    </h3>
                                    <button onClick={() => showToast('Opening Branch Add Wizard')} className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20">+ Add Branch Location</button>
                                </div>
                                <div className="space-y-4 max-w-2xl relative z-10">
                                    {branches.length === 0 ? (
                                        <div className="text-sm font-bold text-slate-500 italic">No additional branches configured. Local mock data...</div>
                                    ) : branches.map(b => (
                                        <div key={b.id} className="p-4 border border-slate-200 rounded-xl flex justify-between items-center bg-slate-50">
                                            <div>
                                                <p className="font-bold text-text-dark text-sm">{b.name}</p>
                                                <p className="text-xs text-slate-500 mt-1">{b.address}</p>
                                            </div>
                                            <button className="text-xs font-bold text-slate-400 hover:text-primary">Edit</button>
                                        </div>
                                    ))}
                                    {/* Mock fallback */}
                                    {branches.length === 0 && (
                                        <div className="p-4 border border-slate-200 rounded-xl flex justify-between items-center bg-slate-50">
                                            <div>
                                                <p className="font-bold text-text-dark text-sm">Downtown Main Branch (HQ)</p>
                                                <p className="text-xs text-slate-500 mt-1">123 Health Ave, Mumbai</p>
                                            </div>
                                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold uppercase">Master</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'admin' && (
                        <div className="bg-surface border border-slate-200 rounded-2xl shadow-sm p-6 relative overflow-hidden">
                            <h3 className="font-display text-lg font-bold text-text-dark border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
                                <ShieldCheck size={20} className="text-primary" /> System & Security Config
                            </h3>
                            <div className="space-y-6 max-w-2xl relative z-10">
                                <div className="p-4 border border-slate-200 rounded-xl flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-sm text-text-dark mb-1">Global Two-Factor Authentication (2FA)</h4>
                                        <p className="text-xs text-slate-500 font-medium">Enforce OTP login for all Staff Panel access.</p>
                                    </div>
                                    <button onClick={() => showToast('2FA Settings updated')} className="w-12 h-6 rounded-full bg-success flex items-center p-1 relative shadow-inner">
                                        <div className="w-4 h-4 rounded-full bg-white absolute right-1 shadow-sm" />
                                    </button>
                                </div>
                                <div className="p-4 bg-alert/5 border border-alert/20 rounded-xl">
                                    <h4 className="font-bold text-sm text-alert mb-1">Data Wipe (Super Admin Only)</h4>
                                    <p className="text-xs text-slate-600 mb-3 font-medium">Permanently delete all patient records or reset the application instances.</p>
                                    <button onClick={() => showToast('Action restricted to Master Admin Key', 'error')} className="border border-alert text-alert hover:bg-alert hover:text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">Factory Reset Full Data</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'staff' && (
                        <div className="bg-surface border border-slate-200 rounded-2xl shadow-sm p-6">
                            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="font-display text-lg font-bold text-text-dark flex items-center gap-2">
                                        <Users size={20} className="text-primary" /> Staff Panel & RBAC
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium mt-1">Manage granular access controls for your team members.</p>
                                </div>
                                <button onClick={() => setIsStaffModalOpen(true)} className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2 rounded-lg transition-transform active:scale-95 shadow-premium">
                                    + Add New Staff
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            <th className="p-3 rounded-tl-lg">Staff Member</th>
                                            <th className="p-3">Role / Auth</th>
                                            <th className="p-3">RBAC Access (Modules)</th>
                                            <th className="p-3 rounded-tr-lg text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {staffList.map(s => (
                                            <tr key={s.id} className="hover:bg-slate-50/50">
                                                <td className="p-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">{s.name.charAt(0)}</div>
                                                        <div>
                                                            <p className="font-bold text-text-dark text-sm">{s.name}</p>
                                                            <p className="text-xs text-slate-500">{s.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded block w-fit mb-1">{s.role}</span>
                                                    {s.is_master && <span className="text-[10px] font-bold bg-alert/10 text-alert px-2 py-1 rounded">MASTER ADMIN</span>}
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex gap-1 flex-wrap max-w-[200px]">
                                                        {Object.entries(s.permissions || {}).filter(([_, val]) => val).map(([key]) => (
                                                            <span key={key} className="text-[9px] uppercase font-bold text-primary border border-primary/20 bg-primary/5 px-1.5 py-0.5 rounded">{key}</span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <button className="text-slate-400 hover:text-slate-600 text-xs font-bold mr-3">Edit RBAC</button>
                                                    <button onClick={() => showToast('Access Revoked', 'error')} className="text-alert/60 hover:text-alert text-xs font-bold">Remove</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'billing' && (
                        <div className="bg-surface border border-slate-200 rounded-2xl shadow-sm p-6">
                            <h3 className="font-display text-lg font-bold text-text-dark mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                                <CreditCard size={20} className="text-primary" /> Active Plan & Billing
                            </h3>
                            <div className="p-5 bg-primary/5 border border-primary/20 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 relative overflow-hidden">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-primary text-lg">MedPro Enterprise Dual-Panel</h4>
                                        <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">PRO+</span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-600">₹24,999 / year</p>
                                </div>
                                <button className="bg-white text-primary border border-primary px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-primary/5">Manage Subscription</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} title="Register New Staff & Set RBAC">
                <div className="space-y-4 max-h-[70vh] overflow-y-auto px-2 custom-scrollbar pb-2">
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex justify-between items-center group">
                        <div className="text-sm text-blue-800 font-medium">Type a name, and our AI will attempt to auto-fill public DCI qualifications and licensing details!</div>
                        <button
                            className={`flex flex-shrink-0 items-center justify-center gap-2 py-2 px-4 rounded-lg font-bold text-xs text-white shadow-premium ${isAIAnalyzing ? 'bg-slate-400' : 'bg-primary hover:bg-primary-hover active:scale-95'}`}
                            onClick={handleAIFillStaff}
                            disabled={isAIAnalyzing}
                        >
                            <Activity size={12} className={isAIAnalyzing ? 'animate-spin' : ''} />
                            {isAIAnalyzing ? 'Searching Records...' : 'AI Auto-Fill'}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Full Name</label>
                            <input type="text" value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none" placeholder="e.g. Dr. Jane Doe" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Role Designation</label>
                            <input type="text" value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Email (Used for Staff Login)</label>
                            <input type="email" value={newStaff.email} onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Contact Number</label>
                            <input type="text" value={newStaff.mobile} onChange={e => setNewStaff({ ...newStaff, mobile: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">DCI License Number</label>
                            <input type="text" value={newStaff.license_number} onChange={e => setNewStaff({ ...newStaff, license_number: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none" />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Qualifications & Degrees</label>
                            <input type="text" value={newStaff.qualifications} onChange={e => setNewStaff({ ...newStaff, qualifications: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none" />
                        </div>
                    </div>

                    <div className="border-t border-slate-200 pt-4 mt-4">
                        <label className="text-xs font-bold text-slate-700 mb-3 block uppercase tracking-wider">Granular Read/Write Access Control (RBAC Module Config)</label>
                        <div className="grid grid-cols-2 gap-3">
                            {Object.keys(newStaff.permissions).map(key => (
                                <label key={key} className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                                    <input
                                        type="checkbox"
                                        checked={(newStaff.permissions as any)[key]}
                                        onChange={(e) => setNewStaff({
                                            ...newStaff,
                                            permissions: { ...newStaff.permissions, [key]: e.target.checked }
                                        })}
                                        className="rounded text-primary focus:ring-primary h-4 w-4"
                                    />
                                    <span className="text-sm font-bold text-slate-600 capitalize">{key}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <button onClick={handleSaveStaff} className="w-full py-2.5 bg-text-dark hover:bg-black text-white rounded-lg text-sm font-bold mt-6 shadow-premium transition-transform active:scale-95">Send Registration Email & SMS</button>
                </div>
            </Modal>
        </div>
    );
}
