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
        { id: 'dashboard', icon: LayoutDashboard, label: userRole === 'patient' ? 'My Health' : 'Dashboard', roles: ['admin', 'staff', 'doctor', 'patient'] },
        { id: 'appointments', icon: Calendar, label: userRole === 'patient' ? 'My Bookings' : 'Appointments', roles: ['admin', 'staff', 'doctor', 'patient'] },
        { id: 'doctor-calendar', icon: CalendarRange, label: 'Doctor Timeline', roles: ['admin', 'staff', 'doctor'] },
        { id: 'patients', icon: Users, label: 'Patient Directory', roles: ['admin', 'staff', 'doctor'] },
        { id: 'quickbills', icon: FileText, label: 'Quick Bills', roles: ['admin', 'staff', 'doctor'] },
        { id: 'emr', icon: Activity, label: userRole === 'patient' ? 'Medical Records' : 'EMR & Vitals', roles: ['admin', 'staff', 'doctor', 'patient'] },
        { id: 'labwork', icon: FlaskConical, label: 'Lab Cases', roles: ['admin', 'staff', 'doctor'] },
        { id: 'prescriptions', icon: FileText, label: 'e-Prescriptions', roles: ['admin', 'staff', 'doctor', 'patient'] },
        { id: 'treatment-plans', icon: ClipboardCheck, label: 'Treatment Plans', roles: ['admin', 'staff', 'doctor'] },
        { id: 'reminders', icon: Bell, label: 'Reminder Center', roles: ['admin', 'staff', 'doctor'] },
        { id: 'earnings', icon: DollarSign, label: 'Financial Hub', roles: ['admin', 'doctor'] },
        { id: 'accounts', icon: WalletCards, label: 'Accounts', roles: ['admin'] },
        { id: 'inventory', icon: PackageSearch, label: 'Smart Inventory', roles: ['admin', 'staff', 'doctor'] },
        { id: 'suppliers', icon: Truck, label: 'Suppliers & Vendors', roles: ['admin', 'staff', 'doctor'] },
        { id: 'reports', icon: FileBarChart, label: 'Analytical Reports', roles: ['admin'] },
        { id: 'tasks', icon: ClipboardList, label: 'Clinic Tasks', roles: ['admin', 'staff', 'doctor'] },
        { id: 'team-hub', icon: UserCog, label: 'Team Hub', roles: ['admin'] },
        { id: 'installments', icon: CreditCard, label: 'Installments', roles: ['admin', 'staff', 'doctor'] },
        { id: 'consent-forms', icon: FileSignature, label: 'Consent Forms', roles: ['admin', 'staff', 'doctor'] },
        { id: 'loyalty', icon: Gift, label: 'Loyalty & Rewards', roles: ['admin', 'staff', 'doctor', 'patient'] },
        { id: 'sterilization', icon: Thermometer, label: 'Compliance & Sterilization', roles: ['admin', 'staff', 'doctor'] },
        { id: 'equipment-log', icon: Wrench, label: 'Asset Maintenance', roles: ['admin', 'staff', 'doctor'] },
        { id: 'operatory-status', icon: Layout, label: 'Live Chair Hub', roles: ['admin', 'staff', 'doctor'] },
        { id: 'perio-charting', icon: Activity, label: 'Perio Diagnostic', roles: ['admin', 'doctor'] },
        { id: 'recall-engine', icon: RefreshCcw, label: 'Growth & Retention', roles: ['admin'] },
        { id: 'waitlist-engine', icon: Clock4, label: 'Smart Waitlist', roles: ['admin', 'staff'] },
        { id: 'resources', icon: CalendarPlus, label: 'Chair & Resources', roles: ['admin', 'staff', 'doctor'] },
        { id: 'kiosk', icon: Monitor, label: 'Patient Kiosk', roles: ['admin', 'staff', 'doctor'] },
        { id: 'settings', icon: Settings, label: 'Settings', roles: ['admin', 'staff', 'doctor', 'patient'] }
    ];

    const menus = allMenus.filter(m => m.roles.includes(userRole));

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-background-dark/80 z-40 lg:hidden backdrop-blur-xl transition-all duration-500 animate-in fade-in"
                    onClick={() => setIsOpen(false)}
                />
            )}
            <div className={`w-72 border-r ${theme === 'dark' ? 'border-white/5 bg-background-light/30 shadow-[10px_0_30px_rgba(0,0,0,0.5)]' : 'border-slate-200 bg-white shadow-sm'} backdrop-blur-2xl h-screen fixed left-0 top-0 flex flex-col z-50 transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                <div className="p-8 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-neon group hover:rotate-6 transition-all duration-300 p-1">
                        <img src="/logo.png" alt="Dentora Logo" className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(0,229,255,0.8)] group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className={`font-display font-bold text-2xl leading-none tracking-tight ${theme === 'dark' ? 'text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400' : 'text-blue-600'}`}>DentiSphere</h1>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${theme === 'dark' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse' : 'bg-green-500 animate-pulse'}`} />
                            <p className={`text-[10px] tracking-widest font-bold uppercase ${theme === 'dark' ? 'text-primary opacity-90' : 'text-slate-400'}`}>PREMIUM CLINIC</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar">
                    {menus.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => setActiveTab(m.id)}
                            className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 font-bold text-sm group ${activeTab === m.id
                                ? theme === 'dark' ? 'bg-primary/20 text-white shadow-neon border border-primary/30' : 'bg-blue-50 text-blue-600 border border-blue-100'
                                : theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <m.icon size={20} className={`transition-all duration-300 ${activeTab === m.id ? theme === 'dark' ? 'text-primary drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]' : 'text-blue-600' : 'text-slate-400 group-hover:text-primary'}`} />
                            <span className="font-semibold">{m.label}</span>
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    <div
                        className={`p-4 rounded-2xl transition-all duration-500 cursor-pointer group border ${activeTab === 'profile' ? 'bg-primary/10 border-primary/30 shadow-neon' : 'bg-white/5 hover:bg-white/10 hover:shadow-glass hover:border-white/10 border-white/5'}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <img
                                    src={userRole === 'patient' ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150" : "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150"}
                                    alt="User"
                                    className="w-11 h-11 rounded-xl object-cover border-2 border-white/10 shadow-md group-hover:scale-105 group-hover:shadow-neon transition-all duration-300"
                                />
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-background-light shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
                            </div>
                            <div className="text-left overflow-hidden">
                                <p className={`text-sm font-semibold truncate transition-colors duration-300 ${activeTab === 'profile' ? 'text-text-dark drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : 'text-slate-300 group-hover:text-white'}`}>
                                    {userRole === 'patient' ? "Jane Doe" : "Dr. S. Jenkins"}
                                </p>
                                <div className="flex items-center gap-1 opacity-70 mt-0.5">
                                    <ShieldCheck size={12} className={activeTab === 'profile' ? 'text-primary' : 'text-slate-400 group-hover:text-primary transition-colors'} />
                                    <p className="text-[10px] font-medium tracking-wide text-slate-400 group-hover:text-slate-300 transition-colors uppercase">Verified {userRole}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

