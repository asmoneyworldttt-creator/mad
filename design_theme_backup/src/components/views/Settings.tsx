
import { Settings as SettingsIcon, Users, ShieldCheck, CreditCard, Save, MapPin, Activity, Edit3, Trash2, Shield, UserCircle2, MessageSquare, LifeBuoy, ChevronLeft, Lock, Smartphone, FileText, Mail, Globe, Sparkles, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '../Toast';
import { supabase } from '../../supabase';
import { Modal } from '../../components/Modal';

type UserRole = 'admin' | 'staff' | 'doctor' | 'patient';

export function Settings({ userRole, theme }: { userRole: UserRole; theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('general');
    const [view, setView] = useState<'tabs' | 'onboard'>('tabs');

    // Data State
    const [staffList, setStaffList] = useState<any[]>([]);
    const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
    const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

    // Form State
    const [staffForm, setStaffForm] = useState({
        name: '', role: 'Associate Dentist', email: '', mobile: '', qualifications: '',
        degree: '', grad_year: '', license_number: '',
        permissions: { dashboard: true, appointments: true, emr: true, billing: false, settings: false, inventory: false }
    });

    useEffect(() => {
        if (activeTab === 'staff') fetchStaff();
    }, [activeTab]);

    const fetchStaff = async () => {
        const { data, error } = await supabase.from('staff').select('*');
        if (error) {
            console.error('Staff fetch error:', error);
            showToast('Unable to synchronize staff list: ' + error.message, 'error');
            return;
        }
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
                email: prev.email || `${prev.name.toLowerCase().replace(' ', '.')}@dentora.clinic`,
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

        setView('tabs');
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
        setView('onboard');
    };

    const handleRemoveStaff = async (id: string, name: string) => {
        if (confirm(`Are you sure you want to remove ${name} from Dentora? This action will revoke their access immediately.`)) {
            const { error } = await supabase.from('staff').delete().eq('id', id);
            if (!error) {
                showToast(`Staff member ${name} removed.`, 'success');
                fetchStaff();
            } else {
                showToast(error.message, 'error');
            }
        }
    };

    if (view === 'onboard') {
        return (
            <div className="animate-slide-up space-y-8 pb-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('tabs')} className={`p-3 border rounded-2xl transition-all shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-white/10 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h2 className={`text-3xl font-sans font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-text-dark'}`}>{editingStaffId ? 'Refine Clinician Hub' : 'Initialize Team Member'}</h2>
                        <p className="text-slate-500 font-medium">Onboard new specialists or update role based access control.</p>
                    </div>
                </div>

                <div className={`rounded-[2.5rem] shadow-sm p-10 border ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100'}`}>
                    <div className="bg-gradient-to-r from-primary/10 to-transparent border-l-4 border-primary p-6 rounded-r-3xl flex justify-between items-center mb-10">
                        <div>
                            <h4 className="font-bold text-primary text-sm mb-1">DCI Registry Sync</h4>
                            <p className="text-xs text-primary/70 font-medium">Auto-fill credentials using Dentora AI engine.</p>
                        </div>
                        <button
                            onClick={handleAIFillStaff}
                            className={`flex items-center gap-2 py-3 px-6 rounded-2xl font-bold text-xs text-white transition-all active:scale-95 ${isAIAnalyzing ? 'bg-slate-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20'}`}
                        >
                            <Sparkles size={16} /> {isAIAnalyzing ? 'Analyzing...' : 'Auto-Fill Details'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-extrabold text-slate-500 mb-2 block uppercase tracking-widest">Full Name</label>
                                <input
                                    type="text"
                                    value={staffForm.name}
                                    onChange={e => setStaffForm({ ...staffForm, name: e.target.value })}
                                    className={`w-full border rounded-2xl px-5 py-4 text-sm font-bold outline-none transition-all focus:ring-4 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-primary/50 focus:ring-primary/10' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-primary focus:ring-primary/10'}`}
                                    placeholder="Enter practitioner name"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-extrabold text-slate-500 mb-2 block uppercase tracking-widest">Primary Email</label>
                                    <input type="email" value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })} className={`w-full border rounded-xl px-5 py-4 text-sm font-bold outline-none ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-extrabold text-slate-500 mb-2 block uppercase tracking-widest">Mobile Contact</label>
                                    <input type="text" value={staffForm.mobile} onChange={e => setStaffForm({ ...staffForm, mobile: e.target.value })} className={`w-full border rounded-xl px-5 py-4 text-sm font-bold outline-none ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-extrabold text-slate-500 mb-2 block uppercase tracking-widest">Clinical Designation</label>
                                <select value={staffForm.role} onChange={e => setStaffForm({ ...staffForm, role: e.target.value })} className={`w-full border rounded-2xl px-5 py-4 text-sm font-bold outline-none appearance-none ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                                    <option>Associate Dentist</option>
                                    <option>Specialist / Endodontist</option>
                                    <option>Oral Surgeon</option>
                                    <option>Orthodontist</option>
                                    <option>Clinic Manager</option>
                                    <option>Receptionist</option>
                                    <option>Nursing Staff</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-extrabold text-slate-500 mb-2 block uppercase tracking-widest">Security Clearance (RBAC)</label>
                                <div className={`grid grid-cols-2 gap-3 p-6 rounded-3xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                                    {Object.entries(staffForm.permissions).map(([key, val]) => (
                                        <button
                                            key={key}
                                            onClick={() => setStaffForm({ ...staffForm, permissions: { ...staffForm.permissions, [key]: !val } })}
                                            className={`flex items-center justify-between p-3 rounded-xl border text-[10px] font-extrabold uppercase transition-all ${val ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-white/50 border-transparent text-slate-400'}`}
                                        >
                                            {key}
                                            <div className={`w-2 h-2 rounded-full ${val ? 'bg-primary animate-pulse' : 'bg-slate-300'}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-extrabold text-slate-500 mb-2 block uppercase tracking-widest">DCI License #</label>
                                    <input type="text" value={staffForm.license_number} onChange={e => setStaffForm({ ...staffForm, license_number: e.target.value })} className={`w-full border rounded-xl px-5 py-4 text-sm font-bold outline-none ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-extrabold text-slate-500 mb-2 block uppercase tracking-widest">Graduation Year</label>
                                    <input type="text" value={staffForm.grad_year} onChange={e => setStaffForm({ ...staffForm, grad_year: e.target.value })} className={`w-full border rounded-xl px-5 py-4 text-sm font-bold outline-none ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-12 justify-end">
                        <button onClick={() => setView('tabs')} className={`px-10 py-4 rounded-2xl border font-bold transition-all active:scale-95 ${theme === 'dark' ? 'border-white/10 text-slate-400 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Abort Onboarding</button>
                        <button onClick={handleSaveStaff} className="px-12 py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary-hover shadow-premium shadow-primary/20 transition-all active:scale-95">
                            {editingStaffId ? 'Update Credentials' : 'Commit Onboarding'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'general', label: 'Clinic Profile', icon: SettingsIcon },
        { id: 'staff', label: 'Team Infrastructure', icon: Users, badge: 'RBAC' },
        { id: 'inventory', label: 'Procurement Settings', icon: Activity },
        { id: 'marketing', label: 'Broadcast & SMS', icon: Mail },
        { id: 'consents', label: 'Legal Architecture', icon: ShieldCheck },
        { id: 'security', label: 'Security & Protocol', icon: Shield },
        { id: 'billing', label: 'Enterprise Plan', icon: CreditCard },
        { id: 'support', label: 'Node Feedback', icon: LifeBuoy }
    ];

    return (
        <div className="animate-slide-up space-y-8">
            <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 p-8 rounded-[2rem] border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100'}`}>
                <div>
                    <h2 className={`text-3xl font-sans font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-text-dark'}`}>Control Center</h2>
                    <p className="text-slate-500 font-medium mt-1">Configure your clinical environment, team roles, and security protocols.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => showToast('Master sync triggered across all nodes.', 'success')} className="bg-primary hover:bg-primary-hover text-white shadow-premium shadow-primary/20 px-8 py-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95">
                        <Save size={18} /> Sync Settings
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Navigation Sidebar */}
                <div className="lg:w-80 space-y-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${activeTab === tab.id
                                ? 'bg-primary text-white shadow-lg shadow-primary/20 font-bold'
                                : theme === 'dark' ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-50 hover:text-primary'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <tab.icon size={20} className={activeTab === tab.id ? 'text-white' : 'text-slate-400 group-hover:text-primary'} />
                                <span className="text-sm">{tab.label}</span>
                            </div>
                            {tab.badge && <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded ${activeTab === tab.id ? 'bg-white text-primary' : 'bg-primary/10 text-primary'}`}>{tab.badge}</span>}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <div className={`p-8 rounded-[2.5rem] border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100'}`}>
                                <h3 className={`font-sans text-2xl font-bold mb-8 flex items-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-text-dark'}`}>
                                    <SettingsIcon size={28} className="text-primary" /> Profile Identity
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-extrabold text-slate-400 mb-2 uppercase tracking-widest">Clinic Core Name</label>
                                            <input type="text" className={`w-full border rounded-2xl px-5 py-4 text-sm font-bold outline-none ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} defaultValue="Downtown Dental Clinic" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-extrabold text-slate-400 mb-2 uppercase tracking-widest">Global Currency</label>
                                            <div className={`px-5 py-4 border rounded-2xl text-sm font-bold ${theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>Indian Rupee (INR - ₹)</div>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-extrabold text-slate-400 mb-2 uppercase tracking-widest">Operational Window</label>
                                            <div className="flex items-center gap-4">
                                                <select className={`flex-1 border rounded-xl px-4 py-4 text-sm font-bold outline-none ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} defaultValue="09:00 AM"><option>09:00 AM</option><option>10:00 AM</option></select>
                                                <div className="text-slate-400 font-bold">to</div>
                                                <select className={`flex-1 border rounded-xl px-4 py-4 text-sm font-bold outline-none ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} defaultValue="08:00 PM"><option>07:00 PM</option><option>08:00 PM</option></select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`p-8 rounded-[2.5rem] border shadow-xl text-white relative overflow-hidden ${theme === 'dark' ? 'bg-slate-950 border-white/5' : 'bg-slate-900'}`}>
                                <div className="flex justify-between items-center mb-8 relative z-10">
                                    <h3 className="font-sans text-xl font-bold flex items-center gap-3">
                                        <MapPin size={24} className="text-primary" /> Branch Network
                                    </h3>
                                    <button onClick={() => showToast('Expansion module initialized.', 'success')} className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold px-5 py-2.5 rounded-xl transition-all border border-white/10 uppercase tracking-widest">Add Node</button>
                                </div>
                                <div className="space-y-4 relative z-10">
                                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl flex justify-between items-center group transition-all hover:bg-white/10">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-bold shadow-lg shadow-primary/20">HQ</div>
                                            <div>
                                                <p className="font-bold text-lg">Main Medical Hub</p>
                                                <p className="text-xs opacity-50 font-medium">15/2, Cathedral Road, Chennai</p>
                                            </div>
                                        </div>
                                        <span className="text-[8px] bg-primary text-white px-3 py-1 rounded-full font-extrabold tracking-[0.2em]">MASTER</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'staff' && (
                        <div className={`p-8 rounded-[2.5rem] border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100'}`}>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                                <div>
                                    <h3 className={`font-sans text-2xl font-bold flex items-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-text-dark'}`}>
                                        <Users size={28} className="text-primary" /> Multi-Role Infrastructure
                                    </h3>
                                    <p className="text-sm text-slate-400 font-medium mt-1">Deep RBAC logic control for decentralized healthcare.</p>
                                </div>
                                <button onClick={() => { setEditingStaffId(null); setStaffForm({ name: '', role: 'Associate Dentist', email: '', mobile: '', qualifications: '', degree: '', grad_year: '', license_number: '', permissions: { dashboard: true, appointments: true, emr: true, billing: false, settings: false, inventory: false } }); setView('onboard'); }} className="bg-primary hover:bg-primary-hover text-white text-xs font-extrabold px-8 py-4 rounded-2xl shadow-premium shadow-primary/20 transition-all active:scale-95">
                                    Onboard New Clinician
                                </button>
                            </div>

                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100/10">
                                            <th className="px-6 py-5">Practitioner Domain</th>
                                            <th className="px-6 py-5">Node Access</th>
                                            <th className="px-6 py-5 text-right">Operational Protocol</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50/10">
                                        {staffList.length > 0 ? staffList.map(s => (
                                            <tr key={s.id} className="group transition-colors">
                                                <td className="px-6 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
                                                            {s.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className={`font-bold text-sm tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{s.name}</p>
                                                            <p className="text-xs text-slate-400 font-medium">{s.role}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-xs text-slate-400 font-medium">
                                                    {Object.entries(s.permissions || {}).filter(([_, v]) => v).length} Modules active
                                                </td>
                                                <td className="px-6 py-6 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleEditStaff(s)} className="p-3 bg-white/5 border border-white/10 text-slate-400 hover:text-primary rounded-xl transition-all"><Edit3 size={16} /></button>
                                                        <button onClick={() => handleRemoveStaff(s.id, s.name)} className="p-3 bg-white/5 border border-white/10 text-slate-400 hover:text-red-500 rounded-xl transition-all"><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={4} className="py-20 text-center">
                                                    <UserCircle2 size={48} className="text-slate-200 mx-auto mb-4" />
                                                    <p className="text-slate-400 font-bold italic mb-6">No specialized staff accounts linked to this clinic.</p>
                                                    <button
                                                        onClick={async () => {
                                                            const demoStaff = [
                                                                { name: 'Dr. Sarah Jenkins', role: 'Medical Director', email: 'sarah.j@medpro.com', mobile: '+91 98765 43210', qualifications: 'BDS, MDS (Oral Surgery)', degree: 'Master of Dental Surgery', grad_year: 2012, license_number: 'DCI/TN/12345' },
                                                                { name: 'Priya Mani', role: 'Clinical Assistant', email: 'priya.m@medpro.com', mobile: '+91 98765 43212', qualifications: 'Diploma in Nursing', degree: 'Nursing Assistant', grad_year: 2020, license_number: 'RNA/2020/001' }
                                                            ];
                                                            for (const s of demoStaff) {
                                                                await supabase.from('staff').upsert(s, { onConflict: 'email' });
                                                            }
                                                            fetchStaff();
                                                            showToast("Management team initialized.", 'success');
                                                        }}
                                                        className="px-6 py-2 border border-primary/30 text-primary text-[10px] font-bold uppercase rounded-xl hover:bg-primary/5 transition-all"
                                                    >
                                                        Initialize Management Team
                                                    </button>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'marketing' && (
                        <div className={`p-10 rounded-[2.5rem] border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100'}`}>
                            <h3 className={`font-sans text-2xl font-bold mb-8 flex items-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-text-dark'}`}>
                                <Mail size={28} className="text-primary" /> Outreach Infrastructure
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <div className={`p-8 rounded-3xl border border-dashed transition-all hover:bg-primary/5 cursor-pointer ${theme === 'dark' ? 'border-primary/30' : 'border-primary/20'}`}>
                                        <h4 className="font-bold text-primary mb-2 flex items-center gap-2">SMS Broadcast Engine</h4>
                                        <p className="text-xs text-slate-400 leading-relaxed font-medium">Send localized appointments reminders or promotional offers to your clinical database via Twilio cloud.</p>
                                    </div>
                                    <div className={`p-8 rounded-3xl border border-dashed transition-all hover:bg-primary/5 cursor-pointer ${theme === 'dark' ? 'border-primary/30' : 'border-primary/20'}`}>
                                        <h4 className="font-bold text-primary mb-2 flex items-center gap-2 text-violet-500"><Globe size={16} /> Patient Portal SEO</h4>
                                        <p className="text-xs text-slate-400 leading-relaxed font-medium">Manage how your clinic appears on Google My Business and other clinical aggregators.</p>
                                    </div>
                                </div>
                                <div className={`p-8 rounded-[2rem] border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                                    <h4 className={`text-sm font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Node Statistics</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center py-3 border-b border-white/5">
                                            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">SMS Credits</span>
                                            <span className="text-lg font-sans font-bold text-primary">12,480</span>
                                        </div>
                                        <div className="flex justify-between items-center py-3 border-b border-white/5">
                                            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Active Campaigns</span>
                                            <span className="text-lg font-sans font-bold text-primary">3</span>
                                        </div>
                                    </div>
                                    <button onClick={() => showToast('Redirecting to Marketing Forge...', 'success')} className="w-full mt-10 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all">Launch Forge</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className={`p-10 rounded-[2.5rem] border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100'}`}>
                            <h3 className={`font-sans text-2xl font-bold mb-8 flex items-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-text-dark'}`}>
                                <Shield size={28} className="text-primary" /> Hardened Protocols
                            </h3>
                            <div className="space-y-6">
                                <div className={`p-6 rounded-3xl border flex items-center justify-between ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center"><Lock size={24} /></div>
                                        <div>
                                            <p className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>2FA Clinical Authentication</p>
                                            <p className="text-sm text-slate-400 font-medium">Force Multi-Factor Authentication for all Admin roles.</p>
                                        </div>
                                    </div>
                                    <button onClick={() => showToast('Protocol 2FA enabled.', 'success')} className="p-2 transition-all active:scale-95"><div className="w-14 h-7 bg-primary rounded-full relative"><div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full" /></div></button>
                                </div>
                                <div className={`p-6 rounded-3xl border flex items-center justify-between ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center"><Smartphone size={24} /></div>
                                        <div>
                                            <p className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Biometric Node Login</p>
                                            <p className="text-sm text-slate-400 font-medium">Use Fingerprint/FaceID on mobile devices.</p>
                                        </div>
                                    </div>
                                    <button onClick={() => showToast('Biometric layer activated.', 'success')} className="p-2 transition-all active:scale-95"><div className="w-14 h-7 bg-slate-700/50 rounded-full relative"><div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full" /></div></button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'inventory' && (
                        <div className={`p-10 rounded-[2.5rem] border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100'}`}>
                            <h3 className={`font-sans text-2xl font-bold mb-8 flex items-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-text-dark'}`}>
                                <Activity size={28} className="text-primary" /> Supply Chain Logic
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className={`p-8 rounded-3xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                                    <h4 className={`font-bold mb-6 text-xs uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Depletion Thresholds</h4>
                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-sm font-bold text-slate-400 mb-3">Critical Warning Level</p>
                                            <div className="flex items-center gap-4">
                                                <input type="range" className="flex-1 accent-primary" />
                                                <span className="font-sans font-bold text-primary">15 Units</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className={`p-8 rounded-3xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                                    <h4 className="font-bold text-primary mb-4">Auto-Restock Protocols</h4>
                                    <p className="text-xs text-slate-400 mb-6 font-medium">Link with verified Dentora suppliers for automated procurement when stock hits critical thresholds.</p>
                                    <button onClick={() => showToast('Supplier network sync active.', 'success')} className="w-full py-3 bg-primary/10 border border-primary/20 text-primary rounded-xl font-bold text-xs uppercase tracking-widest transition-all">Link Supplier Node</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
