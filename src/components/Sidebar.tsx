import {
    LayoutDashboard, Calendar, Users,
    Activity, Settings, FileText, DollarSign, FlaskConical,
    WalletCards, PackageSearch, FileBarChart, ShieldCheck, ClipboardList, UserCog,
    CreditCard, FileSignature, Thermometer, Monitor, CalendarPlus, Gift, ClipboardCheck, Bell, CalendarRange, Wrench, Truck, Video, Layout, RefreshCcw, Clock4
} from 'lucide-react';

type UserRole = 'admin' | 'staff' | 'doctor' | 'patient';

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
    const allMenus = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'staff', 'doctor', 'patient'] },
        { id: 'appointments', icon: Calendar, label: 'Appointments', roles: ['admin', 'staff', 'doctor', 'patient'] },
        { id: 'doctor-calendar', icon: CalendarRange, label: 'Doctor Schedule', roles: ['admin', 'staff', 'doctor'] },
        { id: 'patients', icon: Users, label: 'Patients', roles: ['admin', 'staff', 'doctor'] },
        { id: 'quickbills', icon: FileText, label: 'Billing', roles: ['admin', 'staff', 'doctor'] },
        { id: 'emr', icon: Activity, label: 'Medical Records', roles: ['admin', 'staff', 'doctor', 'patient'] },
        { id: 'labwork', icon: FlaskConical, label: 'Lab Orders', roles: ['admin', 'staff', 'doctor'] },
        { id: 'prescriptions', icon: FileText, label: 'Prescriptions', roles: ['admin', 'staff', 'doctor', 'patient'] },
        { id: 'treatment-plans', icon: ClipboardCheck, label: 'Treatment Plans', roles: ['admin', 'staff', 'doctor'] },
        { id: 'reminders', icon: Bell, label: 'Reminders', roles: ['admin', 'staff', 'doctor'] },
        { id: 'earnings', icon: DollarSign, label: 'Finance & Payroll', roles: ['admin', 'doctor'] },
        { id: 'accounts', icon: WalletCards, label: 'Accounts', roles: ['admin'] },
        { id: 'inventory', icon: PackageSearch, label: 'Inventory', roles: ['admin', 'staff', 'doctor'] },
        { id: 'suppliers', icon: Truck, label: 'Suppliers', roles: ['admin', 'staff', 'doctor'] },
        { id: 'reports', icon: FileBarChart, label: 'Reports', roles: ['admin'] },
        { id: 'tasks', icon: ClipboardList, label: 'Tasks', roles: ['admin', 'staff', 'doctor'] },
        { id: 'team-hub', icon: UserCog, label: 'Staff Management', roles: ['admin'] },
        { id: 'installments', icon: CreditCard, label: 'Installments', roles: ['admin', 'staff', 'doctor'] },
        { id: 'consent-forms', icon: FileSignature, label: 'Consent Forms', roles: ['admin', 'staff', 'doctor'] },
        { id: 'loyalty', icon: Gift, label: 'Loyalty', roles: ['admin', 'staff', 'doctor', 'patient'] },
        { id: 'sterilization', icon: Thermometer, label: 'Sterilization', roles: ['admin', 'staff', 'doctor'] },
        { id: 'equipment-log', icon: Wrench, label: 'Equipment', roles: ['admin', 'staff', 'doctor'] },
        { id: 'operatory-status', icon: Layout, label: 'Live Rooms', roles: ['admin', 'staff', 'doctor'] },
        { id: 'perio-charting', icon: Activity, label: 'Perio Charting', roles: ['admin', 'doctor'] },
        { id: 'recall-engine', icon: RefreshCcw, label: 'Recalls', roles: ['admin'] },
        { id: 'waitlist-engine', icon: Clock4, label: 'Waitlist', roles: ['admin', 'staff'] },
        { id: 'resources', icon: CalendarPlus, label: 'Resources', roles: ['admin', 'staff', 'doctor'] },
        { id: 'kiosk', icon: Monitor, label: 'Kiosk Mode', roles: ['admin', 'staff', 'doctor'] },
        { id: 'settings', icon: Settings, label: 'Settings', roles: ['admin', 'staff', 'doctor', 'patient'] }
    ];

    const menus = allMenus.filter(m => m.roles.includes(userRole));

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-background-dark/80 z-40 lg:hidden backdrop-blur-xl transition-all duration-700 ease-fluid animate-in fade-in"
                    onClick={() => setIsOpen(false)}
                />
            )}
            <div className={`w-72 border-r ${theme === 'dark' ? 'border-primary/10 bg-surface/80' : 'border-slate-200 bg-slate-50 shadow-sm'} backdrop-blur-3xl h-screen fixed left-0 top-0 flex flex-col z-50 transition-transform duration-700 ease-fluid ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                <div className="p-8 flex items-center gap-4 border-b border-primary/5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/30 flex items-center justify-center shadow-neon group hover:rotate-6 transition-all duration-500 ease-fluid p-1.5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-primary/10 animate-pulse"></div>
                        <img src="/logo.png" alt="Dentora Logo" className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_12px_rgba(0,240,255,1)] group-hover:scale-110 transition-transform duration-500 ease-fluid" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className={`font-display font-medium text-[22px] leading-none tracking-wide ${theme === 'dark' ? 'text-transparent bg-clip-text bg-gradient-to-r from-white to-primary/80 drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]' : 'text-blue-700'}`}>Dentora</h1>
                        <div className="flex items-center gap-1.5 mt-1.5 opacity-90">
                            <span className={`w-1.5 h-1.5 rounded-full ${theme === 'dark' ? 'bg-secondary-mint shadow-[0_0_8px_rgba(132,229,212,0.8)] animate-pulse' : 'bg-green-500 animate-pulse'}`} />
                            <p className={`text-[10px] tracking-[0.1em] font-display font-medium ${theme === 'dark' ? 'text-secondary-mint' : 'text-slate-500'}`}>System Online</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
                    {menus.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => setActiveTab(m.id)}
                            className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ease-fluid group relative overflow-hidden ${activeTab === m.id
                                ? theme === 'dark' ? 'bg-primary/15 text-white shadow-inner border border-primary/20' : 'bg-white text-blue-600 shadow-sm border border-slate-200'
                                : theme === 'dark' ? 'text-text-muted hover:text-white hover:bg-surface-hover border border-transparent' : 'text-slate-500 hover:bg-white hover:text-slate-900 border border-transparent'
                                }`}
                        >
                            {/* Active Tab Glow Indicator */}
                            {activeTab === m.id && theme === 'dark' && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-neon rounded-r-full"></div>
                            )}

                            <m.icon size={18} className={`transition-all duration-300 ease-fluid relative z-10 ${activeTab === m.id ? theme === 'dark' ? 'text-primary drop-shadow-[0_0_8px_rgba(0,240,255,0.8)] scale-110' : 'text-blue-600' : 'text-slate-500 group-hover:text-primary group-hover:scale-110'}`} />
                            <span className={`font-sans text-[13px] tracking-wide relative z-10 transition-colors duration-300 ${activeTab === m.id ? 'font-medium' : 'font-normal'}`}>{m.label}</span>

                            {/* Hover Sweep Effect */}
                            {activeTab !== m.id && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover:animate-[sweep_1s_ease-in-out_forwards]"></div>
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-6 border-t border-primary/5 bg-background-dark/20">
                    <div
                        className={`p-3.5 rounded-2xl transition-all duration-500 ease-fluid cursor-pointer group border relative overflow-hidden ${activeTab === 'profile' ? 'bg-primary/20 border-primary/40 shadow-neon' : 'bg-surface-muted hover:bg-surface-hover hover:border-primary/20 border-white/5'}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        {/* Glow sweep */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-[150%] outline-offset-0 group-hover:transition-all group-hover:duration-700 group-hover:ease-fluid group-hover:translate-x-[150%] z-0"></div>

                        <div className="flex items-center gap-4 relative z-10">
                            <div className="relative">
                                <img
                                    src={userRole === 'patient' ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150" : "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150"}
                                    alt="User"
                                    className="w-10 h-10 rounded-xl object-cover border border-white/20 shadow-lg group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(0,240,255,0.6)] group-hover:border-primary/50 transition-all duration-500 ease-fluid"
                                />
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-secondary-mint border-2 border-background-dark shadow-neon-mint" />
                            </div>
                            <div className="text-left overflow-hidden flex-1">
                                <p className={`font-sans text-[13px] truncate transition-colors duration-300 ${activeTab === 'profile' ? 'text-white font-medium drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]' : 'text-text-main group-hover:text-primary group-hover:font-medium'}`}>
                                    {userRole === 'patient' ? "Jane Doe" : "Dr. Jenkins"}
                                </p>
                                <div className="flex items-center gap-1.5 opacity-80 mt-1">
                                    <ShieldCheck size={10} className={activeTab === 'profile' ? 'text-primary' : 'text-primary/70 group-hover:text-primary transition-colors'} />
                                    <p className="font-display text-[10px] tracking-wide text-text-muted group-hover:text-white transition-colors">{userRole}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

