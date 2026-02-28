import {
    LayoutDashboard, Calendar, Users,
    Activity, Settings, HeartPulse, FileText, DollarSign
} from 'lucide-react';

export function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }: { activeTab: string, setActiveTab: (t: string) => void, isOpen: boolean, setIsOpen: (o: boolean) => void }) {
    const menus = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'appointments', icon: Calendar, label: 'Appointments' },
        { id: 'patients', icon: Users, label: 'Patients' },
        { id: 'emr', icon: Activity, label: 'EMR & Vitals' },
        { id: 'prescriptions', icon: FileText, label: 'Prescriptions' },
        { id: 'earnings', icon: DollarSign, label: 'Earnings' },
        { id: 'settings', icon: Settings, label: 'Settings' }
    ];

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />
            )}
            <div className={`w-64 border-r border-slate-200 bg-surface h-screen fixed left-0 top-0 flex flex-col shadow-sm z-50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                <div className="p-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-premium shadow-primary/30">
                        <HeartPulse size={24} />
                    </div>
                    <div>
                        <h1 className="font-display font-bold text-xl text-text-dark">MedPro</h1>
                        <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Premium</p>
                    </div>
                </div>

                <div className="flex-1 px-4 py-6 flex flex-col gap-2">
                    {menus.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => setActiveTab(m.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab === m.id
                                ? 'bg-primary-light text-primary shadow-sm'
                                : 'text-text-muted hover:text-text-main hover:bg-slate-50'
                                }`}
                        >
                            <m.icon size={20} className={activeTab === m.id ? 'text-primary' : 'text-slate-400'} />
                            <span>{m.label}</span>
                            {m.id === 'appointments' && (
                                <span className="ml-auto bg-alert/10 text-alert text-[10px] py-0.5 px-2 rounded-full font-bold">3 New</span>
                            )}
                        </button>
                    ))}
                </div>

                <div className={`p-6 border-t border-slate-200 transition-colors cursor-pointer ${activeTab === 'profile' ? 'bg-primary/5 border-primary/20' : 'bg-slate-50/50 hover:bg-slate-50'}`} onClick={() => setActiveTab('profile')}>
                    <div className="flex items-center gap-3 group transition-opacity">
                        <img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150" alt="Doctor" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                        <div className="text-left">
                            <p className={`text-sm font-bold transition-colors ${activeTab === 'profile' ? 'text-primary' : 'text-text-dark group-hover:text-primary'}`}>Dr. Sarah Jenkins</p>
                            <p className={`text-xs font-medium ${activeTab === 'profile' ? 'text-primary/70' : 'text-text-muted'}`}>Chief Cardiologist</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
