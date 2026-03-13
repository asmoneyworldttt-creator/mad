import {
    LayoutDashboard, Calendar, Users,
    Activity, Settings, FileText, DollarSign, FlaskConical,
    WalletCards, PackageSearch, FileBarChart, ShieldCheck, ClipboardList, UserCog,
    CreditCard, FileSignature, Thermometer, Monitor, CalendarPlus, Gift, ClipboardCheck, Bell, CalendarRange, Wrench, Truck, Video, Layout, RefreshCcw, Clock4, Sun, Moon, LogOut,
    Database, Image as ImageIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../supabase';

type UserRole = 'master' | 'admin' | 'staff' | 'patient';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (t: string) => void;
    isOpen: boolean;
    setIsOpen: (o: boolean) => void;
    userRole: UserRole;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
}

export function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen, userRole, theme, setTheme }: SidebarProps) {
    const isDark = theme === 'dark';

    const allMenus = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['master', 'admin', 'staff', 'patient'] },
        { id: 'appointments', icon: Calendar, label: 'Appointments', roles: ['master', 'admin', 'staff', 'patient'] },
        { id: 'doctor-calendar', icon: CalendarRange, label: 'Doctor Schedule', roles: ['master', 'admin', 'staff'] },
        { id: 'patients', icon: Users, label: 'Patients', roles: ['master', 'admin', 'staff'] },
        { id: 'quickbills', icon: FileText, label: 'Billing', roles: ['master', 'admin', 'staff'] },
        { id: 'emr', icon: Database, label: 'Cloud EMR', roles: ['master', 'admin', 'staff'] },
        { id: 'gallery', icon: ImageIcon, label: 'Clinical Gallery', roles: ['master', 'admin', 'staff'] },
        { id: 'labwork', icon: FlaskConical, label: 'Lab Orders', roles: ['master', 'admin', 'staff'] },
        { id: 'prescriptions', icon: FileText, label: 'Prescriptions', roles: ['master', 'admin', 'staff', 'patient'] },
        { id: 'treatment-plans', icon: ClipboardCheck, label: 'Treatment Plans', roles: ['master', 'admin', 'staff'] },
        { id: 'soap', icon: FileText, label: 'SOAP Notes', roles: ['master', 'admin', 'staff'] },
        { id: 'vitals', icon: Activity, label: 'Vital Signs', roles: ['master', 'admin', 'staff', 'patient'] },
        { id: 'risk-score', icon: Activity, label: 'Dental Risk', roles: ['master', 'admin', 'staff', 'patient'] },
        { id: 'voice-charting', icon: Monitor, label: 'Voice Charting', roles: ['master', 'admin', 'staff'] },
        { id: 'reminders', icon: Bell, label: 'Reminders', roles: ['master', 'admin', 'staff'] },
        { id: 'earnings', icon: DollarSign, label: 'Finance & Payroll', roles: ['master', 'admin'] },
        { id: 'accounts', icon: WalletCards, label: 'Accounts', roles: ['master', 'admin'] },
        { id: 'inventory', icon: PackageSearch, label: 'Inventory', roles: ['master', 'admin', 'staff'] },
        { id: 'suppliers', icon: Truck, label: 'Suppliers', roles: ['master', 'admin', 'staff'] },
        { id: 'reports', icon: FileBarChart, label: 'Reports', roles: ['master', 'admin'] },
        { id: 'tasks', icon: ClipboardList, label: 'Tasks', roles: ['master', 'admin', 'staff'] },
        { id: 'team-hub', icon: UserCog, label: 'Staff Management', roles: ['master', 'admin'] },
        { id: 'installments', icon: CreditCard, label: 'Installments', roles: ['master', 'admin', 'staff'] },
        { id: 'consent-forms', icon: FileSignature, label: 'Consent Forms', roles: ['master', 'admin', 'staff'] },
        { id: 'loyalty', icon: Gift, label: 'Loyalty', roles: ['master', 'admin', 'staff', 'patient'] },
        { id: 'sterilization', icon: Thermometer, label: 'Sterilization', roles: ['master', 'admin', 'staff'] },
        { id: 'equipment-log', icon: Wrench, label: 'Equipment', roles: ['master', 'admin', 'staff'] },
        { id: 'operatory-status', icon: Layout, label: 'Treatment Rooms', roles: ['master', 'admin', 'staff'] },
        { id: 'perio-charting', icon: Activity, label: 'Perio Charting', roles: ['master', 'admin'] },
        { id: 'recall-engine', icon: RefreshCcw, label: 'Recalls', roles: ['master', 'admin'] },
        { id: 'waitlist-engine', icon: Clock4, label: 'Waitlist', roles: ['master', 'admin', 'staff'] },
        { id: 'resources', icon: CalendarPlus, label: 'Resources', roles: ['master', 'admin', 'staff'] },
        { id: 'teledentistry', icon: Video, label: 'Video Consultation', roles: ['master', 'admin', 'staff'] },
        { id: 'kiosk', icon: Monitor, label: 'Kiosk Mode', roles: ['master', 'admin', 'staff'] },
        { id: 'settings', icon: Settings, label: 'Settings', roles: ['master', 'admin', 'staff', 'patient'] }
    ];

    const menus = allMenus.filter(m => m.roles.includes(userRole));

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 lg:hidden backdrop-blur-sm animate-in fade-in transition-all duration-300"
                    style={{ background: 'rgba(0,0,0,0.3)' }}
                    onClick={() => setIsOpen(false)}
                />
            )}
            <div className={`w-64 h-screen fixed left-0 top-0 flex flex-col z-50 transition-all duration-700 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 glass-sidebar`}
                style={{ 
                    background: 'var(--sidebar-bg)', 
                    borderColor: 'var(--sidebar-border)',
                    color: 'var(--sidebar-text)',
                    backdropFilter: !isDark ? 'blur(15px) saturate(180%)' : 'none'
                }}
                role="navigation" aria-label="Main navigation">
                {/* Logo */}
                <div className={`p-5 flex items-center gap-2.5 border-b border-sidebar-border`} style={{ borderColor: 'var(--sidebar-border)' }}>
                    <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center p-2 shadow-lg shadow-primary/30 flex-shrink-0">
                        <Activity className="text-white w-full h-full" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="font-bold text-lg tracking-tight leading-none" style={{ color: 'var(--sidebar-text)' }}>Dentora</h1>
                        <div className="flex items-center gap-1 mt-1 opacity-80">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                            <p className="text-[10px] font-bold" style={{ color: 'var(--sidebar-muted)' }}>Clinic Manager</p>
                        </div>
                    </div>
                </div>

                {/* Nav Items */}
                <div className="flex-1 px-2.5 py-3 flex flex-col gap-0.5 overflow-y-auto custom-scrollbar">
                    {menus.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => { setActiveTab(m.id); setIsOpen(false); }}
                            aria-current={activeTab === m.id ? 'page' : undefined}
                            aria-label={m.label}
                            title={m.label}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 group w-full text-left relative overflow-hidden ${activeTab === m.id
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'text-slate-500 hover:bg-primary/5 hover:text-primary'
                                }`}
                            style={activeTab === m.id ? { background: 'var(--sidebar-active)' } : { color: 'var(--sidebar-muted)' }}
                        >
                            {activeTab === m.id && (
                                <motion.div layoutId="sidebar-active" className="absolute inset-0 bg-primary -z-10" />
                            )}
                            <m.icon size={15} aria-hidden="true" className={`flex-shrink-0 transition-all duration-200 ${activeTab === m.id ? 'stroke-[2.5px]' : 'group-hover:scale-105'}`} />
                            <span className={`text-[11px] tracking-wide uppercase font-bold ${activeTab === m.id ? 'opacity-100' : 'opacity-70'}`}>{m.label}</span>
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className={`p-4 border-t border-sidebar-border space-y-2`} style={{ borderColor: 'var(--sidebar-border)' }}>
                    {/* Theme Toggle */}
                    <button
                        onClick={() => setTheme(isDark ? 'light' : 'dark')}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-500 group border shadow-sm ${isDark ? 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white'}`}
                    >
                        <div className="flex items-center gap-2.5">
                            {isDark
                                ? <Sun size={15} className="text-amber-400 group-hover:rotate-180 transition-transform duration-700" />
                                : <Moon size={15} className="text-primary group-hover:-rotate-12 transition-transform" />
                            }
                            <span className="text-[10px] font-bold uppercase">{isDark ? 'Light' : 'Dark'}</span>
                        </div>
                        <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-500 ${isDark ? 'bg-primary' : 'bg-slate-200'}`}>
                            <div className={`w-3 h-3 rounded-full bg-white transition-transform duration-500 ${isDark ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                    </button>

                    {/* Profile + Logout */}
                    <div
                        className={`p-2.5 rounded-xl transition-all duration-500 cursor-pointer group flex items-center gap-2.5 border shadow-sm ${activeTab === 'profile'
                            ? 'bg-primary border-primary shadow-lg shadow-primary/20 text-white'
                            : isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-100 hover:bg-primary/5'
                            }`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <div className="relative flex-shrink-0">
                            <img
                                src={userRole === 'patient' ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150" : "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150"}
                                alt="User"
                                className="w-10 h-10 rounded-xl object-cover border-2 border-white/50 shadow-sm"
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                        </div>
                        <div className="text-left overflow-hidden flex-1">
                            <p className="text-[11px] font-bold truncate" style={{ color: activeTab === 'profile' ? 'white' : 'var(--sidebar-text)' }}>
                                {userRole === 'patient' ? 'Patient Portal' : userRole === 'master' ? 'Master Admin' : userRole === 'admin' ? 'Clinic Admin' : 'Clinic Staff'}
                            </p>
                            <p className="text-[9px] font-semibold opacity-60" style={{ color: activeTab === 'profile' ? 'white' : 'var(--sidebar-muted)' }}>
                                {userRole} mode
                            </p>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                            className={`p-2 rounded-xl transition-all hover:scale-110 ${activeTab === 'profile' ? 'text-white/70 hover:text-white hover:bg-white/20' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-500/10'}`}
                            aria-label="Log out"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
