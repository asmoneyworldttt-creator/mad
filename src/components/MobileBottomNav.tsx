import { useState } from 'react';
import { Home, Calendar, Users, MessageSquare, Plus, Grid3X3, X, LayoutDashboard, Activity, FileText, DollarSign, FlaskConical, PackageSearch, FileBarChart, ClipboardList, CreditCard, Gift, RefreshCcw, Clock4, Settings, Video, Thermometer, Wrench, Layout, CalendarRange, ClipboardCheck, Bell, WalletCards, Truck, UserCog, FileSignature, CalendarPlus, Monitor, HeartPulse, Image as ImageIcon } from 'lucide-react';

const ALL_QUICK_LINKS = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['master', 'admin', 'staff', 'patient'] },
    { id: 'appointments', icon: Calendar, label: 'Calendar', roles: ['master', 'admin', 'staff', 'patient'] },
    { id: 'doctor-calendar', icon: CalendarRange, label: 'Dr. Schedule', roles: ['master', 'admin', 'staff'] },
    { id: 'patients', icon: Users, label: 'Patients', roles: ['master', 'admin', 'staff'] },
    { id: 'quickbills', icon: FileText, label: 'Billing', roles: ['master', 'admin', 'staff'] },
    { id: 'emr', icon: Activity, label: 'EMR', roles: ['master', 'admin', 'staff', 'patient'] },
    { id: 'labwork', icon: FlaskConical, label: 'Lab Orders', roles: ['master', 'admin', 'staff'] },
    { id: 'prescriptions', icon: FileText, label: 'Prescriptions', roles: ['master', 'admin', 'staff', 'patient'] },
    { id: 'treatment-plans', icon: ClipboardCheck, label: 'Tx Plans', roles: ['master', 'admin', 'staff'] },
    { id: 'reminders', icon: Bell, label: 'Reminders', roles: ['master', 'admin', 'staff'] },
    { id: 'earnings', icon: DollarSign, label: 'Finance', roles: ['master', 'admin'] },
    { id: 'accounts', icon: WalletCards, label: 'Accounts', roles: ['master', 'admin'] },
    { id: 'soap', icon: FileText, label: 'SOAP Notes', roles: ['master', 'admin', 'staff'] },
    { id: 'vitals', icon: Activity, label: 'Vital Signs', roles: ['master', 'admin', 'staff', 'patient'] },
    { id: 'risk-score', icon: HeartPulse, label: 'Dental Risk', roles: ['master', 'admin', 'staff', 'patient'] },
    { id: 'gallery', icon: ImageIcon, label: 'Clinical Gallery', roles: ['master', 'admin', 'staff'] },
    { id: 'voice-charting', icon: Monitor, label: 'Voice Chart', roles: ['master', 'admin', 'staff'] },
    { id: 'inventory', icon: PackageSearch, label: 'Inventory', roles: ['master', 'admin', 'staff'] },
    { id: 'suppliers', icon: Truck, label: 'Suppliers', roles: ['master', 'admin', 'staff'] },
    { id: 'reports', icon: FileBarChart, label: 'Reports', roles: ['master', 'admin'] },
    { id: 'tasks', icon: ClipboardList, label: 'Tasks', roles: ['master', 'admin', 'staff'] },
    { id: 'team-hub', icon: UserCog, label: 'Staff', roles: ['master', 'admin'] },
    { id: 'installments', icon: CreditCard, label: 'Installments', roles: ['master', 'admin', 'staff'] },
    { id: 'consent-forms', icon: FileSignature, label: 'Consents', roles: ['master', 'admin', 'staff'] },
    { id: 'loyalty', icon: Gift, label: 'Loyalty', roles: ['master', 'admin', 'staff', 'patient'] },
    { id: 'sterilization', icon: Thermometer, label: 'Sterilization', roles: ['master', 'admin', 'staff'] },
    { id: 'equipment-log', icon: Wrench, label: 'Equipment', roles: ['master', 'admin', 'staff'] },
    { id: 'operatory-status', icon: Layout, label: 'Rooms', roles: ['master', 'admin', 'staff'] },
    { id: 'perio-charting', icon: Activity, label: 'Perio', roles: ['master', 'admin'] },
    { id: 'recall-engine', icon: RefreshCcw, label: 'Recalls', roles: ['master', 'admin'] },
    { id: 'waitlist-engine', icon: Clock4, label: 'Waitlist', roles: ['master', 'admin', 'staff'] },
    { id: 'resources', icon: CalendarPlus, label: 'Resources', roles: ['master', 'admin', 'staff'] },
    { id: 'teledentistry', icon: Video, label: 'Video', roles: ['master', 'admin', 'staff'] },
    { id: 'kiosk', icon: Monitor, label: 'Kiosk', roles: ['master', 'admin', 'staff'] },
    { id: 'settings', icon: Settings, label: 'Settings', roles: ['master', 'admin', 'staff', 'patient'] },
];


export function MobileBottomNav({ activeTab, setActiveTab, toggleMore, theme, userRole }: {
    activeTab: string;
    setActiveTab: (t: string) => void;
    toggleMore: () => void;
    theme?: 'light' | 'dark';
    userRole: string;
}) {
    const isDark = theme === 'dark';
    const [showAllMenu, setShowAllMenu] = useState(false);

    const filteredLinks = ALL_QUICK_LINKS.filter(link => link.roles.includes(userRole));

    return (
        <>
            {/* Full Menu Overlay */}
            {showAllMenu && (
                <div className="fixed inset-0 z-[60]" onClick={() => setShowAllMenu(false)}>
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                    <div
                        className={`absolute bottom-28 left-4 right-4 rounded-[2rem] p-5 shadow-2xl border flex flex-col max-h-[70vh] ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>All Modules</h3>
                            <button onClick={() => setShowAllMenu(false)} className={`p-2 rounded-xl transition-all active:scale-95 ${isDark ? 'bg-white/10 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                <X size={16} />
                            </button>
                        </div>
                        <div className="grid grid-cols-4 gap-2.5 overflow-y-auto p-1 custom-scrollbar">
                            {filteredLinks.map(link => (
                                <button
                                    key={link.id}
                                    onClick={() => { setActiveTab(link.id); setShowAllMenu(false); }}
                                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl transition-all active:scale-90 ${activeTab === link.id
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : isDark
                                            ? 'bg-white/5 text-slate-400 hover:bg-white/10'
                                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                >
                                    <link.icon size={18} />
                                    <span className="text-[8px] font-bold text-center leading-tight">{link.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <nav className={`fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-sm rounded-[2.5rem] px-6 py-3 z-50 transition-all duration-500 shadow-2xl border ${isDark
                ? 'bg-slate-900/95 border-white/10 backdrop-blur-xl'
                : 'bg-white/95 border-slate-200 backdrop-blur-xl shadow-slate-200/50'
                }`}>
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 p-2 rounded-xl ${activeTab === 'dashboard' ? 'text-primary' : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}>
                        <Home size={22} fill={activeTab === 'dashboard' ? 'currentColor' : 'none'} />
                        <span className="text-[8px] font-bold">Home</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('appointments')}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 p-2 rounded-xl ${activeTab === 'appointments' ? 'text-primary' : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}>
                        <Calendar size={22} />
                        <span className="text-[8px] font-bold">Schedule</span>
                    </button>

                    {/* Central Action Button */}
                    <div className="relative -top-4">
                        <button
                            onClick={() => setActiveTab('patient-registration')}
                            className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/40 active:scale-90 hover:scale-105 transition-all duration-300 border-4 border-white">
                            <Plus size={26} strokeWidth={3} />
                        </button>
                        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[7px] font-bold text-slate-400 whitespace-nowrap">New Patient</span>
                    </div>

                    <button
                        onClick={() => setActiveTab('patients')}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 p-2 rounded-xl ${activeTab === 'patients' ? 'text-primary' : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}>
                        <Users size={22} />
                        <span className="text-[8px] font-bold">Patients</span>
                    </button>

                    <button
                        onClick={() => setShowAllMenu(true)}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 p-2 rounded-xl ${showAllMenu ? 'text-primary' : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}>
                        <Grid3X3 size={22} />
                        <span className="text-[8px] font-bold">More</span>
                    </button>
                </div>
            </nav>
        </>
    );
}
