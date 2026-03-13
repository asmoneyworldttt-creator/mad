
import { Settings as SettingsIcon, Users, ShieldCheck, CreditCard, Save, MapPin, Activity, Edit3, Trash2, Shield, UserCircle2, MessageSquare, LifeBuoy, ChevronLeft, Lock, Smartphone, FileText, Mail, Globe, Sparkles, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '../Toast';
import { supabase } from '../../supabase';
import { Modal } from '../../components/Modal';
import { EmptyState } from '../EmptyState';
import { SkeletonList } from '../SkeletonLoader';
import { CustomSelect, CustomSlider } from '../ui/CustomControls';

type UserRole = 'master' | 'admin' | 'staff' | 'patient';

export function Settings({ userRole, theme }: { userRole: UserRole; theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('general');
    const [view, setView] = useState<'tabs' | 'onboard'>('tabs');

    // Data State
    const [staffList, setStaffList] = useState<any[]>([]);
    const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
    const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
    const [is2FAEnabled, setIs2FAEnabled] = useState(true);
    const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
    const [thresholdValue, setThresholdValue] = useState(15);
    const [supportCat, setSupportCat] = useState('Bug Report');

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
                <div className="flex items-center gap-3">
                    <button onClick={() => setView('tabs')} className={`p-2 border rounded-xl transition-all shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-white/10 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        <ChevronLeft size={16} />
                    </button>
                    <div>
                        <h2 className={`text-lg font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-text-dark'}`}>{editingStaffId ? 'Edit Staff' : 'Add Staff'}</h2>
                        <p className="text-[10px] font-medium text-slate-500">Update team details and access.</p>
                    </div>
                </div>

                <div className={`rounded-2xl shadow-xl p-6 border relative overflow-hidden group`} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transition-transform group-hover:scale-110 duration-1000 rotate-animation"><Users size={80} /></div>
                    
                    <div className="bg-gradient-to-r from-primary/10 to-transparent border-l-4 border-primary p-3 rounded-r-xl flex justify-between items-center mb-6 relative z-10 shadow-sm">
                        <div>
                            <h4 className="font-bold text-primary text-[9px] uppercase tracking-wider mb-0.5">Quick Registration</h4>
                            <p className="text-[9px] text-primary/70 font-medium">Auto-fill details using verified registry.</p>
                        </div>
                        <button
                            onClick={handleAIFillStaff}
                            className={`flex items-center gap-2 py-2.5 px-5 rounded-xl font-bold text-[10px] uppercase tracking-wider text-white transition-all active:scale-95 shadow-xl shadow-primary/20 ${isAIAnalyzing ? 'bg-slate-400 cursor-not-allowed' : 'bg-primary hover:scale-105'}`}
                        >
                            <Sparkles size={14} /> {isAIAnalyzing ? 'Analyzing...' : 'Auto-Fill'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">Full Name</label>
                                <input
                                    type="text"
                                    value={staffForm.name}
                                    onChange={e => setStaffForm({ ...staffForm, name: e.target.value })}
                                    className={`w-full border rounded-xl px-4 py-3 text-xs font-bold outline-none transition-all focus:ring-2 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-primary/50 focus:ring-primary/10 shadow-inner' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-primary focus:ring-primary/10 shadow-inner'}`}
                                    placeholder="Enter practitioner name"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">Primary Email</label>
                                    <input type="email" value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })} className={`w-full border rounded-xl px-4 py-3 text-xs font-bold outline-none shadow-inner ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">Mobile Contact</label>
                                    <input type="text" value={staffForm.mobile} onChange={e => setStaffForm({ ...staffForm, mobile: e.target.value })} className={`w-full border rounded-xl px-4 py-3 text-xs font-bold outline-none shadow-inner ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">Designation</label>
                                <CustomSelect 
                                    value={staffForm.role} 
                                    onChange={val => setStaffForm({ ...staffForm, role: val })}
                                    options={[
                                        'Associate Dentist',
                                        'Specialist / Endodontist',
                                        'Oral Surgeon',
                                        'Orthodontist',
                                        'Clinic Manager',
                                        'Receptionist',
                                        'Nursing Staff'
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">Security Clearance (RBAC)</label>
                                <div className={`grid grid-cols-2 gap-2 p-4 rounded-2xl border shadow-inner ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                                    {Object.entries(staffForm.permissions).map(([key, val]) => (
                                        <button
                                            key={key}
                                            onClick={() => setStaffForm({ ...staffForm, permissions: { ...staffForm.permissions, [key]: !val } })}
                                            className={`flex items-center justify-between p-2.5 rounded-lg border text-[8px] font-bold uppercase tracking-tight transition-all shadow-sm ${val ? 'bg-primary text-white border-primary shadow-primary/20' : 'bg-white/50 border-transparent text-slate-400'}`}
                                        >
                                            {key}
                                            <div className={`w-1.5 h-1.5 rounded-full ${val ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-slate-300'}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">DCI License #</label>
                                    <input type="text" value={staffForm.license_number} onChange={e => setStaffForm({ ...staffForm, license_number: e.target.value })} className={`w-full border rounded-xl px-4 py-3 text-xs font-bold outline-none shadow-inner ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">Grad Year</label>
                                    <input type="text" value={staffForm.grad_year} onChange={e => setStaffForm({ ...staffForm, grad_year: e.target.value })} className={`w-full border rounded-xl px-4 py-3 text-xs font-bold outline-none shadow-inner ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-16 justify-end relative z-10">
                        <button onClick={() => setView('tabs')} className={`px-10 py-5 rounded-[1.5rem] border font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 ${theme === 'dark' ? 'border-white/10 text-slate-400 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Abort Onboarding</button>
                        <button onClick={handleSaveStaff} className="px-12 py-5 rounded-[1.5rem] bg-primary text-white font-black text-[11px] uppercase tracking-widest hover:scale-105 shadow-2xl shadow-primary/30 transition-all active:scale-95">
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
        <div className="animate-slide-up space-y-6 pb-10">
            <div className={`p-3 md:p-4 rounded-xl border shadow-lg transition-all relative overflow-hidden group mb-4`} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                <div className="absolute top-0 right-0 p-3 md:p-4 opacity-5 pointer-events-none transition-transform group-hover:scale-110 group-hover:rotate-12 duration-1000 rotate-animation"><SettingsIcon size={60} /></div>
                <div className="flex flex-col md:flex-row justify-between items-center gap-3 relative z-10 text-center md:text-left">
                    <div className="flex-1">
                        <div className="flex items-center justify-center md:justify-start gap-1.5 mb-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(19,91,236,0.6)] animate-pulse" />
                            <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                Clinic Core Configuration
                            </span>
                        </div>
                        <h2 className="text-lg md:text-xl font-bold tracking-tight" style={{ color: 'var(--text-dark)' }}>Settings</h2>
                        <p className="text-[10px] font-medium opacity-70" style={{ color: 'var(--text-muted)' }}>Environmental controls and protocols.</p>
                    </div>
                    <button onClick={() => showToast('Settings synchronized.', 'success')} className="bg-primary hover:scale-105 active:scale-95 text-white px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/30">
                        <Save size={14} /> Sync All
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-5">
                {/* Navigation Sidebar */}
                <div className="lg:w-52 space-y-1 flex-shrink-0">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all group relative overflow-hidden ${activeTab === tab.id
                                ? 'bg-primary text-white shadow-lg shadow-primary/20 font-bold border-primary'
                                : theme === 'dark' ? 'text-slate-400 hover:bg-white/5 border border-transparent hover:border-white/10' : 'text-slate-500 hover:bg-slate-50 border border-transparent hover:border-slate-200'
                                } border shadow-sm`}
                        >
                            <div className="flex items-center gap-2.5 relative z-10">
                                <tab.icon size={14} className={activeTab === tab.id ? 'text-white' : 'text-slate-400 group-hover:text-primary transition-colors'} />
                                <span className="text-[9px] font-bold uppercase tracking-wider">{tab.label}</span>
                            </div>
                            {tab.badge && <span className={`text-[6px] font-bold px-1 py-0.5 rounded-lg relative z-10 ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>{tab.badge}</span>}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    {activeTab === 'general' && (
                        <div className="space-y-5">
                            <div className={`p-6 rounded-2xl border shadow-lg relative overflow-hidden group`} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transition-transform group-hover:scale-110 group-hover:rotate-12 duration-1000 rotate-animation"><SettingsIcon size={100} /></div>
                                <h3 className={`font-bold text-lg mb-6 flex items-center gap-3 relative z-10 ${theme === 'dark' ? 'text-white' : 'text-text-dark'}`}>
                                    <SettingsIcon size={20} className="text-primary" /> Profile Identity
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
                                    <div className="space-y-3">
                                        <div className="group/field">
                                            <label className="text-[8px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block group-hover/field:text-primary transition-colors">Clinic Registry Name</label>
                                            <input type="text" className={`w-full border rounded-xl px-4 py-2.5 text-[11px] font-semibold outline-none transition-all focus:ring-2 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:ring-primary/10 shadow-inner' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-primary/10 shadow-inner'}`} defaultValue="Downtown Dental Clinic" />
                                        </div>
                                        <div className="group/field">
                                            <label className="text-[8px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block group-hover/field:text-primary transition-colors">Operational Currency</label>
                                            <div className={`px-4 py-2.5 border rounded-xl text-[11px] font-bold flex items-center justify-between ${theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                                                <span>Indian Rupee (INR - ₹)</span>
                                                <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="group/field">
                                            <label className="text-[8px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block group-hover/field:text-primary transition-colors">Clinic Node Hours</label>
                                            <div className="flex items-center gap-2">
                                                <select className={`flex-1 border rounded-xl px-3 py-2.5 text-[11px] font-bold outline-none transition-all focus:ring-2 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-primary/10'}`} defaultValue="09:00 AM"><option>09:00 AM</option><option>10:00 AM</option></select>
                                                <div className="text-slate-400 font-bold text-[8px] uppercase tracking-wider">thru</div>
                                                <select className={`flex-1 border rounded-xl px-3 py-2.5 text-[11px] font-bold outline-none transition-all focus:ring-2 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} defaultValue="08:00 PM"><option>07:00 PM</option><option>08:00 PM</option></select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 rounded-2xl border text-white relative overflow-hidden shadow-xl group/branch" style={{ background: 'var(--sidebar-bg)', borderColor: 'rgba(255,255,255,0.1)' }}>
                                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
                                <div className="flex justify-between items-center mb-6 relative z-10">
                                    <h3 className="font-bold text-lg flex items-center gap-3 tracking-tight">
                                        <MapPin size={24} className="text-primary" /> Branch Network
                                    </h3>
                                    <button onClick={() => showToast('Coming soon.', 'success')} className="bg-white/10 hover:bg-white/20 text-white text-[9px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all border border-white/10 hover:scale-105 active:scale-95 shadow-lg">Add Branch</button>
                                </div>
                                <div className="space-y-4 relative z-10">
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center group transition-all hover:bg-white/10 shadow-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-xl">HQ</div>
                                            <div>
                                                <p className="font-bold text-base tracking-tight">Main Hub</p>
                                                <p className="text-[10px] opacity-50 font-medium">Cathedral Road, Chennai</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[7px] bg-primary text-white px-2 py-0.5 rounded-full font-bold tracking-wider">PRIMARY</span>
                                            <span className="text-[8px] opacity-40 font-bold uppercase tracking-wider">Certified</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'staff' && (
                        <div className="p-5 rounded-xl border shadow-lg relative overflow-hidden group" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                            <div className="absolute top-0 right-0 p-5 opacity-5 pointer-events-none transition-transform group-hover:scale-110 group-hover:rotate-12 duration-1000 rotate-animation"><Users size={50} /></div>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3 relative z-10">
                                <div>
                                    <h3 className="font-bold text-base flex items-center gap-2.5 tracking-tight" style={{ color: 'var(--text-dark)' }}>
                                        <Users size={18} className="text-primary" /> Team Infrastructure
                                    </h3>
                                    <p className="text-[9px] font-medium opacity-60" style={{ color: 'var(--text-muted)' }}>Manage clinician roles and access.</p>
                                </div>
                                <button onClick={() => { setEditingStaffId(null); setStaffForm({ name: '', role: 'Associate Dentist', email: '', mobile: '', qualifications: '', degree: '', grad_year: '', license_number: '', permissions: { dashboard: true, appointments: true, emr: true, billing: false, settings: false, inventory: false } }); setView('onboard'); }} className="bg-primary hover:scale-105 active:scale-95 text-white text-[8px] font-bold uppercase tracking-wider px-4 py-2 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center gap-1.5">
                                    <Plus size={14} /> New Clinician
                                </button>
                            </div>

                            <div className="overflow-x-auto custom-scrollbar relative z-10">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[8px] font-bold uppercase tracking-[0.15em] text-slate-400 border-b" style={{ borderColor: 'var(--border-color)' }}>
                                            <th className="px-4 py-3">Practitioner</th>
                                            <th className="px-4 py-3">Access</th>
                                            <th className="px-4 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50/10">                                        {staffList.length > 0 ? staffList.map(s => (
                                            <tr key={s.id} className="group transition-all hover:bg-primary/[0.02]">
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-base shadow-lg shadow-primary/20 flex-shrink-0">
                                                            {s.name.charAt(0)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-[13px] tracking-tight mb-0.5 truncate" style={{ color: 'var(--text-main)' }}>{s.name}</p>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[8px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-lg">{s.role}</span>
                                                                <span className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] flex-shrink-0" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {Object.entries(s.permissions || {}).filter(([_, v]) => v).slice(0, 3).map(([key]) => (
                                                            <span key={key} className="text-[6px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md border border-slate-200">{key}</span>
                                                        ))}
                                                        {Object.entries(s.permissions || {}).filter(([_, v]) => v).length > 3 && (
                                                            <span className="text-[6px] font-bold uppercase tracking-wider bg-primary text-white px-1.5 py-0.5 rounded-md">+{Object.entries(s.permissions || {}).filter(([_, v]) => v).length - 3}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button onClick={() => handleEditStaff(s)} className="p-2 bg-white shadow-md border border-slate-100 text-slate-400 hover:text-primary rounded-lg transition-all"><Edit3 size={12} /></button>
                                                        <button onClick={() => handleRemoveStaff(s.id, s.name)} className="p-2 bg-white shadow-md border border-slate-100 text-slate-400 hover:text-red-500 rounded-lg transition-all"><Trash2 size={12} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={4} className="py-24 text-center">
                                                    <EmptyState
                                                        icon={UserCircle2}
                                                        title="No Staff Members Linked"
                                                        description="You haven't onboarded any specialists or clinic managers yet."
                                                        actionLabel="Initialize Management Team"
                                                        onAction={async () => {
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
                                                    />
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'marketing' && (
                        <div className={`p-6 rounded-2xl border shadow-lg relative overflow-hidden group`} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none transition-transform group-hover:scale-110 group-hover:rotate-12 duration-1000 rotate-animation"><Mail size={60} /></div>
                            <h3 className={`font-bold text-lg mb-6 flex items-center gap-3 relative z-10 ${theme === 'dark' ? 'text-white' : 'text-text-dark'}`}>
                                <Mail size={20} className="text-primary" /> Outreach Channels
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                <div className="space-y-4">
                                    <div className={`p-4 rounded-xl border border-dashed transition-all hover:bg-primary/5 hover:border-primary/40 cursor-pointer shadow-sm group/broadcast ${theme === 'dark' ? 'border-primary/30' : 'border-primary/20 bg-white'}`}>
                                        <h4 className="font-bold text-base text-primary mb-1 flex items-center gap-2">
                                            SMS Broadcast
                                            <span className="text-[6px] bg-primary/10 px-1 py-0.5 rounded-md">TWILIO</span>
                                        </h4>
                                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Send appointment reminders or offers.</p>
                                        <div className="mt-4 flex items-center justify-between text-[8px] font-bold uppercase tracking-wider text-slate-400">
                                            <span>Configured</span>
                                            <button className="text-primary hover:underline">Edit</button>
                                        </div>
                                    </div>
                                    <div className={`p-6 rounded-2xl border border-dashed transition-all hover:bg-violet-500/5 hover:border-violet-500/40 cursor-pointer shadow-md group/seo ${theme === 'dark' ? 'border-violet-500/30' : 'border-violet-500/20 bg-white'}`}>
                                        <h4 className="font-bold text-base text-violet-500 mb-2 flex items-center gap-2">
                                            <Globe size={18} /> Patient Portal SEO
                                        </h4>
                                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Manage how clinic appears on aggregators.</p>
                                        <div className="mt-4 flex items-center justify-between text-[8px] font-bold uppercase tracking-wider text-slate-400">
                                            <span>Visibility Score: 94%</span>
                                            <button className="text-violet-500 hover:underline">Boost</button>
                                        </div>
                                    </div>
                                </div>
                                <div className={`p-6 rounded-2xl border shadow-lg relative overflow-hidden flex flex-col justify-between ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                                    <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Node Statistics</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center py-3 border-b border-white/10">
                                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">SMS Credits</span>
                                            <span className="text-2xl font-bold text-primary tracking-tight">12,480</span>
                                        </div>
                                        <div className="flex justify-between items-center py-3">
                                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Campaigns</span>
                                            <span className="text-2xl font-bold text-primary tracking-tight">03</span>
                                        </div>
                                    </div>
                                    <div className="mt-8 group/forge">
                                        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-primary to-primary-hover text-white shadow-lg shadow-primary/40 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-12 h-12 bg-white/10 rounded-full blur-xl" />
                                            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md"><Activity size={16} /></div>
                                            <div className="flex-1">
                                                <p className="text-[9px] font-bold uppercase tracking-wider opacity-80 mb-0.5">Marketing Forge</p>
                                                <p className="text-[10px] font-bold">AI generation active.</p>
                                            </div>
                                            <span className="text-[6px] font-bold bg-white/20 px-1.5 py-0.5 rounded-full uppercase">DEV</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className={`p-6 rounded-2xl border shadow-lg relative overflow-hidden group`} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none transition-transform group-hover:scale-110 group-hover:rotate-12 duration-1000 rotate-animation"><Shield size={60} /></div>
                            <h3 className={`font-bold text-lg mb-6 flex items-center gap-3 relative z-10 ${theme === 'dark' ? 'text-white' : 'text-text-dark'}`}>
                                <Shield size={20} className="text-primary" /> Security Protocols
                            </h3>
                            <div className="space-y-4 relative z-10">
                                <div className={`p-5 rounded-2xl border flex items-center justify-between transition-all hover:scale-[1.01] shadow-md ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-100 hover:bg-white'}`}>
                                    <div className="flex items-center gap-5">
                                        <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center border border-green-500/20"><Lock size={20} /></div>
                                        <div>
                                            <p className={`font-bold text-base tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>2FA Clinical Auth</p>
                                            <p className="text-[10px] text-slate-500 font-medium">Force MFA for admins.</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setIs2FAEnabled(v => !v); showToast(is2FAEnabled ? '2FA disabled.' : '2FA enabled.', 'success'); }} className="p-1 transition-all">
                                        <div className={`w-10 h-6 rounded-full relative transition-all duration-300 ${is2FAEnabled ? 'bg-primary' : 'bg-slate-300'}`}>
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${is2FAEnabled ? 'right-1' : 'left-1'}`} />
                                        </div>
                                    </button>
                                </div>
                                <div className={`p-5 rounded-2xl border flex items-center justify-between transition-all hover:scale-[1.01] shadow-md ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-100 hover:bg-white'}`}>
                                    <div className="flex items-center gap-5">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20"><Smartphone size={20} /></div>
                                        <div>
                                            <p className={`font-bold text-base tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Biometric Node</p>
                                            <p className="text-[10px] text-slate-500 font-medium">Use Fingerprint/FaceID.</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setIsBiometricEnabled(v => !v); showToast(isBiometricEnabled ? 'Disabled.' : 'Biometric active.', 'success'); }} className="p-1 transition-all">
                                        <div className={`w-10 h-6 rounded-full relative transition-all duration-300 ${isBiometricEnabled ? 'bg-primary' : 'bg-slate-300'}`}>
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${isBiometricEnabled ? 'right-1' : 'left-1'}`} />
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'inventory' && (
                        <div className={`p-6 rounded-2xl border shadow-lg relative overflow-hidden group`} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none transition-transform group-hover:scale-110 group-hover:rotate-12 duration-1000 rotate-animation"><Activity size={60} /></div>
                            <h3 className={`font-bold text-lg mb-6 flex items-center gap-3 relative z-10 ${theme === 'dark' ? 'text-white' : 'text-text-dark'}`}>
                                <Activity size={20} className="text-primary" /> Supply Chain
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                <div className={`p-6 rounded-2xl border shadow-md ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                                    <h4 className="font-bold text-[9px] uppercase tracking-wider text-slate-500 mb-6">Depletion Thresholds</h4>
                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 mb-4 flex justify-between items-center">
                                                <span>Warning Level</span>
                                                <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-md">PROT-IN-01</span>
                                            </p>
                                            <div className="flex flex-col gap-6">
                                                <CustomSlider min={0} max={100} value={thresholdValue} onChange={setThresholdValue} />
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Trigger at</span>
                                                    <span className="text-2xl font-bold text-primary tracking-tight">{thresholdValue}<span className="text-[8px] ml-1 opacity-50 uppercase font-bold">Units</span></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className={`p-6 rounded-2xl border shadow-md flex flex-col justify-between relative overflow-hidden group/card ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                                    <div>
                                        <h4 className="font-bold text-primary text-[10px] uppercase tracking-wider mb-2">Restock Protocols</h4>
                                        <p className="text-[10px] text-slate-400 mb-6 leading-relaxed font-medium">Automated procurement when stock hits thresholds. AI demand forecasting active.</p>
                                    </div>
                                    <button onClick={() => showToast('Supplier network sync active.', 'success')} className="w-full py-3 bg-primary/10 border border-primary/20 hover:border-primary/40 text-primary rounded-xl font-bold text-[9px] uppercase tracking-wider transition-all hover:scale-[1.02] flex items-center justify-center gap-2">
                                        Initialize Link
                                        <span className="text-[7px] bg-primary text-white px-1.5 py-0.5 rounded-full font-bold">ACTIVE</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'consents' && (
                        <div className={`p-6 rounded-2xl border shadow-lg relative overflow-hidden group`} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none transition-transform group-hover:scale-110 group-hover:rotate-12 duration-1000 rotate-animation"><ShieldCheck size={60} /></div>
                            <h3 className={`font-bold text-lg mb-6 flex items-center gap-3 relative z-10 ${theme === 'dark' ? 'text-white' : 'text-text-dark'}`}>
                                <ShieldCheck size={20} className="text-primary" /> Legal Protocols
                            </h3>
                            <div className="space-y-4 relative z-10">
                                {[
                                    { title: 'General Treatment Consent', desc: 'Standard consent for routine procedures', active: true },
                                    { title: 'Surgical Procedure Consent', desc: 'For extractions, implants, etc.', active: true },
                                    { title: 'Anesthesia Consent', desc: 'Local or general administration', active: false },
                                    { title: 'X-Ray Consent', desc: 'Radiation exposure acknowledgment', active: true },
                                    { title: 'Orthodontic Consent', desc: 'Long-term treatment consent', active: false },
                                    { title: 'Privacy Policy (HIPAA)', desc: 'Data handling and privacy disclosure', active: true },
                                ].map((form, idx) => (
                                    <div key={idx} className={`p-5 rounded-2xl border flex items-center justify-between transition-all hover:scale-[1.01] shadow-md ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-100 hover:bg-white'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center"><FileText size={18} /></div>
                                            <div>
                                                <p className={`font-bold text-base tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{form.title}</p>
                                                <p className="text-[10px] text-slate-500 font-medium mt-0.5">{form.desc}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`text-[7px] font-bold px-2.5 py-1 rounded-full shadow-sm tracking-wider ${form.active ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/10'}`}>{form.active ? 'ACTIVE' : 'INACTIVE'}</span>
                                            <button onClick={() => showToast(`Editing: ${form.title}`, 'success')} className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all ${theme === 'dark' ? 'bg-white/10 text-slate-300 hover:bg-white/20' : 'bg-white border border-slate-200 text-slate-600 hover:shadow-lg'}`}>Config</button>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => showToast('Opening builder...', 'success')} className="w-full py-4 border-2 border-dashed border-primary/20 text-primary rounded-2xl font-bold text-[9px] uppercase tracking-wider hover:bg-primary/5 hover:border-primary/40 transition-all flex items-center justify-center gap-2 mt-6 group/add">
                                    <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Append New Protocol
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'billing' && (
                        <div className={`p-6 rounded-2xl border shadow-lg relative overflow-hidden group`} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none transition-transform group-hover:scale-110 group-hover:rotate-12 duration-1000 rotate-animation"><CreditCard size={60} /></div>
                            <h3 className={`font-bold text-lg mb-6 flex items-center gap-3 relative z-10 ${theme === 'dark' ? 'text-white' : 'text-text-dark'}`}>
                                <CreditCard size={20} className="text-primary" /> Subscription Plan
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                                {[
                                    { name: 'Starter', price: '₹999', subtitle: 'per month', features: ['1 Practitioner Node', '500 Records/mo', 'Basic Reports', 'Standard Support'], current: false },
                                    { name: 'Professional', price: '₹2,999', subtitle: 'per month', features: ['5 Practitioner Nodes', 'Unlimited Records', 'AI Diagnostics', 'Priority Access', 'Dedicated Support'], current: true },
                                    { name: 'Enterprise', price: 'Volume', subtitle: 'Custom Quote', features: ['Unlimited Access', 'Multi-Branch', 'Custom Integrations', '24/7 Priority Ops', 'SLA Guarantee'], current: false },
                                ].map((plan, idx) => (
                                    <div key={idx} className={`p-6 rounded-2xl border flex flex-col transition-all hover:scale-[1.01] shadow-lg ${plan.current ? 'border-primary bg-primary/5 ring-2 ring-primary/10' : theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-white'}`}>
                                        <div className="flex-1">
                                            {plan.current && <span className="text-[7px] bg-primary text-white px-3 py-1 rounded-full font-bold uppercase tracking-wider block mb-4 w-fit shadow-md">Active Plan</span>}
                                            <h4 className={`font-bold text-lg mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{plan.name}</h4>
                                            <div className="flex items-baseline gap-1.5 mb-6">
                                                <span className="text-2xl font-bold text-primary tracking-tight">{plan.price}</span>
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{plan.subtitle}</span>
                                            </div>
                                            <ul className="space-y-3 mb-8">
                                                {plan.features.map(f => (
                                                    <li key={f} className="text-[10px] text-slate-500 font-bold flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(19,91,236,0.5)]" />
                                                        {f}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <button onClick={() => showToast(`Switching to ${plan.name} plan...`, 'success')} className={`w-full py-3 rounded-xl font-bold text-[9px] uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-md ${plan.current ? 'bg-primary text-white' : theme === 'dark' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-100 text-slate-600 hover:bg-primary hover:text-white'}`}>
                                            {plan.current ? 'Active Protocol' : 'Upgrade Plan'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'support' && (
                        <div className={`p-6 rounded-2xl border shadow-lg relative overflow-hidden group`} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none transition-transform group-hover:scale-110 group-hover:rotate-12 duration-1000 rotate-animation"><LifeBuoy size={60} /></div>
                            <h3 className={`font-bold text-lg mb-6 flex items-center gap-3 relative z-10 ${theme === 'dark' ? 'text-white' : 'text-text-dark'}`}>
                                <LifeBuoy size={20} className="text-primary" /> Support Center
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                <div className="space-y-6">
                                    <div className="p-6 rounded-2xl border shadow-md space-y-6" style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', borderColor: 'var(--border-color)' }}>
                                        <div>
                                            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">Inquiry Spectrum</label>
                                            <CustomSelect 
                                                value={supportCat} 
                                                onChange={setSupportCat}
                                                options={[
                                                    'Node Technical Flaw (Bug)',
                                                    'Proposal (Feature)',
                                                    'Reconciliation (Billing)',
                                                    'Data Integrity Query',
                                                    'General Clinical Protocol'
                                                ]}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">Subject</label>
                                            <input type="text" className={`w-full border rounded-xl px-4 py-3 text-xs font-bold outline-none transition-all shadow-inner focus:ring-2 focus:ring-primary/10 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} placeholder="Issue summary..." />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">Description</label>
                                            <textarea rows={4} className={`w-full border rounded-xl px-4 py-3 text-xs font-bold outline-none resize-none transition-all shadow-inner focus:ring-2 focus:ring-primary/10 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} placeholder="Describe discrepancy..." />
                                        </div>
                                        <button onClick={() => showToast('Response scheduled within 24 operational hours.', 'success')} className="w-full py-4 bg-primary text-white rounded-xl font-bold text-[9px] uppercase tracking-wider hover:scale-[1.02] shadow-lg shadow-primary/30 transition-all active:scale-95">
                                            Transmit Support Signal
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="font-bold text-[9px] uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                                        <span className="w-6 h-[1px] bg-slate-200" /> Knowledge Base
                                    </h4>
                                    {[
                                        { label: 'Documentation', icon: FileText, desc: 'Architectural blueprints.' },
                                        { label: 'Video Training', icon: MessageSquare, desc: 'Master classes on EMR.' },
                                        { label: 'Community', icon: Globe, desc: 'Connect with practitioners.' },
                                        { label: 'Network Status', icon: Activity, desc: 'Real-time node monitoring.' },
                                    ].map(({ label, icon: Icon, desc }) => (
                                        <button key={label} onClick={() => showToast(`Synchronizing ${label}...`, 'success')} className={`w-full group flex items-start gap-4 p-5 rounded-2xl border transition-all text-left hover:scale-[1.01] shadow-sm ${theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10' : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-white'}`}>
                                            <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform"><Icon size={18} /></div>
                                            <div>
                                                <span className="text-xs font-bold uppercase tracking-wider block mb-0.5">{label}</span>
                                                <span className="text-[9px] text-slate-400 font-medium block">{desc}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

