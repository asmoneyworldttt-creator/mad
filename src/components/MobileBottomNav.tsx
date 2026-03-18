import { useState } from 'react';
import { Home, Calendar, Users, MessageSquare, Plus, Grid3X3, X, LayoutDashboard, Activity, FileText, DollarSign, FlaskConical, PackageSearch, FileBarChart, ClipboardList, CreditCard, Gift, RefreshCcw, Clock4, Settings, Video, Thermometer, Wrench, Layout, CalendarRange, ClipboardCheck, Bell, WalletCards, Truck, UserCog, FileSignature, CalendarPlus, Monitor, HeartPulse, Image as ImageIcon, LogOut } from 'lucide-react';
import { supabase } from '../supabase';

const ALL_QUICK_LINKS = [
    { id: 'dashboard', icon: Home, label: 'Home', roles: ['master', 'admin', 'staff', 'patient'] },
    { id: 'appointments', icon: Calendar, label: 'Calendar', roles: ['master', 'admin', 'staff', 'patient'] },
    { id: 'doctor-calendar', icon: CalendarRange, label: 'Dr. Schedule', roles: ['master', 'admin', 'staff'] },
    { id: 'patients', icon: Users, label: 'Patients', roles: ['master', 'admin', 'staff'] },
    { id: 'quickbills', icon: FileText, label: 'Billing', roles: ['master', 'admin', 'staff'] },
    { id: 'emr', icon: Activity, label: 'EMR', roles: ['master', 'admin', 'staff', 'patient'] },
    { id: 'labwork', icon: FlaskConical, label: 'Lab Orders', roles: ['master', 'admin', 'staff'] },
    { id: 'prescriptions', icon: FileText, label: 'Prescriptions', roles: ['master', 'admin', 'staff', 'patient'] },
    { id: 'treatment-plans', icon: ClipboardCheck, label: 'Tx Plans', roles: ['master', 'admin', 'staff'] },
    { id: 'earnings', icon: DollarSign, label: 'Finance', roles: ['master', 'admin'] },
    { id: 'accounts', icon: WalletCards, label: 'Accounts', roles: ['master', 'admin'] },
    { id: 'soap', icon: FileText, label: 'SOAP Notes', roles: ['master', 'admin', 'staff'] },
    { id: 'vitals', icon: Activity, label: 'Vital Signs', roles: ['master', 'admin', 'staff', 'patient'] },
    { id: 'inventory', icon: PackageSearch, label: 'Inventory', roles: ['master', 'admin', 'staff'] },
    { id: 'suppliers', icon: Truck, label: 'Suppliers', roles: ['master', 'admin', 'staff'] },
    { id: 'reports', icon: FileBarChart, label: 'Reports', roles: ['master', 'admin'] },
    { id: 'tasks', icon: ClipboardList, label: 'Tasks', roles: ['master', 'admin', 'staff'] },
    { id: 'team-hub', icon: UserCog, label: 'Attendance', roles: ['master', 'admin', 'staff'] },
    { id: 'installments', icon: CreditCard, label: 'Installments', roles: ['master', 'admin', 'staff'] },
    { id: 'consent-forms', icon: FileSignature, label: 'Consents', roles: ['master', 'admin', 'staff'] },
    { id: 'medical-clearance', icon: FileText, label: 'Medical Clearance', roles: ['master', 'admin', 'staff'] },
    { id: 'loyalty', icon: Gift, label: 'Loyalty', roles: ['master', 'admin', 'staff', 'patient'] },
    { id: 'sterilization', icon: Thermometer, label: 'Sterility', roles: ['master', 'admin', 'staff'] },
    { id: 'equipment-log', icon: Wrench, label: 'Equipment', roles: ['master', 'admin', 'staff'] },
    { id: 'perio-charting', icon: Activity, label: 'Perio', roles: ['master', 'admin'] },
    { id: 'resources', icon: CalendarPlus, label: 'Resources', roles: ['master', 'admin', 'staff'] },
    { id: 'teledentistry', icon: Video, label: 'Video', roles: ['master', 'admin', 'staff'] },
    { id: 'kiosk', icon: Monitor, label: 'Kiosk', roles: ['master', 'admin', 'staff'] },
    { id: 'settings', icon: Settings, label: 'Settings', roles: ['master', 'admin', 'staff', 'patient'] },
];


export function MobileBottomNav({ activeTab, setActiveTab, toggleMore, theme, userRole, permissions }: {
    activeTab: string;
    setActiveTab: (t: string) => void;
    toggleMore: () => void;
    theme?: 'light' | 'dark';
    userRole: string;
    permissions?: any;
}) {
    const isDark = theme === 'dark';
    const [showAllMenu, setShowAllMenu] = useState(false);

    const filteredLinks = ALL_QUICK_LINKS.filter(link => {
        const roleMatches = link.roles.includes(userRole);
        if (!roleMatches) return false;
        
        if (userRole === 'staff' && permissions) {
            if (link.id === 'team-hub' || link.id === 'dashboard') return true;
            return permissions[link.id] === true;
        }
        return true;
    });

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <>
            {/* Full Menu Overlay */}
            {showAllMenu && (
                <div className="fixed inset-0 z-[60]" onClick={() => setShowAllMenu(false)}>
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                    <div
                        className={`absolute bottom-24 left-4 right-4 rounded-[3rem] p-6 shadow-2xl border flex flex-col max-h-[80vh] ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6 px-2">
                            <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>Navigation</h3>
                            <button onClick={() => setShowAllMenu(false)} className={`p-2 rounded-xl transition-all active:scale-95 ${isDark ? 'bg-white/10 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-4 overflow-y-auto p-1 custom-scrollbar pb-6 text-center">
                            {filteredLinks.map(link => (
                                <button
                                    key={link.id}
                                    onClick={() => { setActiveTab(link.id); setShowAllMenu(false); }}
                                    className={`flex flex-col items-center justify-center gap-2 p-3 min-h-[100px] rounded-3xl transition-all active:scale-95 border ${activeTab === link.id
                                        ? 'bg-primary text-white shadow-xl shadow-primary/30 border-primary'
                                        : isDark
                                            ? 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
                                            : 'bg-slate-50 text-slate-600 border-slate-100 shadow-sm'}`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${activeTab === link.id ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
                                        <link.icon size={22} />
                                    </div>
                                    <span className="text-[10px] font-extrabold leading-tight uppercase tracking-tighter">{link.label}</span>
                                </button>
                            ))}
                            
                            {/* Mobile Logout Button in Menu */}
                            <button
                                onClick={handleLogout}
                                className={`flex flex-col items-center justify-center gap-2 p-3 min-h-[100px] rounded-3xl transition-all active:scale-95 border ${isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-600 border-rose-100'}`}
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-rose-500/20 text-rose-500`}>
                                    <LogOut size={22} />
                                </div>
                                <span className="text-[10px] font-extrabold leading-tight uppercase tracking-tighter">Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <nav className={`fixed bottom-6 left-1/2 -translate-x-1/2 w-[94%] max-w-sm rounded-[2.5rem] px-6 py-3 z-50 transition-all duration-500 shadow-2xl border ${isDark
                ? 'bg-slate-900/95 border-slate-800 backdrop-blur-xl'
                : 'bg-white/95 border-slate-200 backdrop-blur-xl shadow-slate-200/50'
                }`}>
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 p-2 rounded-xl ${activeTab === 'dashboard' ? 'text-primary' : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}>
                        <Home size={24} fill={activeTab === 'dashboard' ? 'currentColor' : 'none'} />
                        <span className="text-[10px] font-bold">Home</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('appointments')}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 p-2 rounded-xl ${activeTab === 'appointments' ? 'text-primary' : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}>
                        <Calendar size={24} />
                        <span className="text-[10px] font-bold">Schedule</span>
                    </button>

                    {/* Central Action Button */}
                    <div className="flex flex-col items-center">
                        <button
                            onClick={() => setActiveTab('patient-registration')}
                            className={`w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 active:scale-95 hover:scale-105 transition-all duration-300 -mt-8 mb-1 border-4 ${isDark ? 'border-slate-900' : 'border-white'}`}
                            style={{ background: 'linear-gradient(135deg, var(--primary), #8B5CF6)' }}
                        >
                            <Plus size={28} strokeWidth={2.5} />
                        </button>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Register</span>
                    </div>

                    <button
                        onClick={() => setActiveTab('patients')}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 p-2 rounded-xl ${activeTab === 'patients' ? 'text-primary' : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}>
                        <Users size={24} />
                        <span className="text-[10px] font-bold">Patients</span>
                    </button>

                    <button
                        onClick={() => setShowAllMenu(true)}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 p-2 rounded-xl ${showAllMenu ? 'text-primary' : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}>
                        <Grid3X3 size={24} />
                        <span className="text-[10px] font-bold">More</span>
                    </button>
                </div>
            </nav>
        </>
    );
}
