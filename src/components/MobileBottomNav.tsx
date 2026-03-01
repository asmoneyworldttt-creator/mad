
export function MobileBottomNav({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) {
    const tabsLeft = [
        { id: 'dashboard', icon: 'grid_view', label: 'Home' },
        { id: 'appointments', icon: 'calendar_today', label: 'Schedule' },
    ];
    const tabsRight = [
        { id: 'patients', icon: 'group', label: 'Patients' },
        { id: 'settings', icon: 'settings', label: 'Menu' }
    ];

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100]">
            <div className="glass-dock flex items-center justify-between px-6 py-4">
                {tabsLeft.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`flex flex-col items-center gap-1 transition-all ${activeTab === t.id ? 'text-[#135bec]' : 'text-slate-400'}`}
                    >
                        <span className="material-symbols-outlined text-[26px]">{t.icon}</span>
                        <span className="text-[9px] font-black uppercase tracking-tighter font-trap">{t.label}</span>
                    </button>
                ))}

                <div className="-mt-14">
                    <button
                        onClick={() => setActiveTab('dashboard')} // Or another action for Quick Bill
                        className="w-16 h-16 quick-bill-fab rounded-full flex items-center justify-center text-white border-4 border-white shadow-2xl active:scale-90 transition-transform"
                    >
                        <span className="material-symbols-outlined text-3xl font-bold">add</span>
                    </button>
                </div>

                {tabsRight.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`flex flex-col items-center gap-1 transition-all ${activeTab === t.id ? 'text-[#135bec]' : 'text-slate-400'}`}
                    >
                        <span className="material-symbols-outlined text-[26px]">{t.icon}</span>
                        <span className="text-[9px] font-black uppercase tracking-tighter font-trap">{t.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
}

