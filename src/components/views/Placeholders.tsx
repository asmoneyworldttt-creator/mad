export function Appointments() {
    return (
        <div className="animate-slide-up space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-display font-bold text-text-dark tracking-tight">Appointments Calendar</h2>
                <button className="bg-primary hover:bg-primary-hover text-white shadow-premium px-5 py-2.5 rounded-full text-sm font-bold flex items-center transition-transform active:scale-95">
                    + Book Slot
                </button>
            </div>
            <div className="bg-surface border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
                <div className="text-6xl mb-4 opacity-50">🗓️</div>
                <h3 className="font-display text-xl text-slate-600 font-bold">Interactive Calendar Integration</h3>
                <p className="text-sm font-medium mt-2">Full drag-and-drop scheduling functionality is available in the Pro Version.</p>
            </div>
        </div>
    );
}

export function Patients() {
    return (
        <div className="animate-slide-up space-y-6">
            <div className="flex justify-between items-center">
                <div className="relative w-full max-w-sm">
                    <input type="text" placeholder="Search by name, ID, or phone..." className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-4 pr-10 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-sm transition-all" />
                </div>
                <button className="bg-primary hover:bg-primary-hover text-white shadow-premium px-5 py-2.5 rounded-full text-sm font-bold flex items-center transition-transform active:scale-95">
                    Add Patient
                </button>
            </div>
            <div className="bg-surface border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
                <div className="text-6xl mb-4 opacity-50">👥</div>
                <h3 className="font-display text-xl text-slate-600 font-bold">Comprehensive Patient Database</h3>
                <p className="text-sm font-medium mt-2">Sort, filter, and export patient medical histories.</p>
            </div>
        </div>
    );
}

export function Prescriptions() {
    return (
        <div className="animate-slide-up space-y-6">
            <h2 className="text-3xl font-display font-bold text-text-dark tracking-tight">e-Prescriptions</h2>
            <div className="bg-surface border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
                <div className="text-6xl mb-4 opacity-50">💊</div>
                <h3 className="font-display text-xl text-slate-600 font-bold">Smart Pharmacy Integration</h3>
                <p className="text-sm font-medium mt-2">AI-driven prescription parsing and drug-interaction warnings.</p>
            </div>
        </div>
    );
}

export function Settings() {
    return (
        <div className="animate-slide-up space-y-6">
            <h2 className="text-3xl font-display font-bold text-text-dark tracking-tight">Clinic Settings</h2>
            <div className="bg-surface border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
                <div className="text-6xl mb-4 opacity-50">⚙️</div>
                <h3 className="font-display text-xl text-slate-600 font-bold">Administrative Control Panel</h3>
                <p className="text-sm font-medium mt-2">Manage staff roles, billing rates, integrations, and branding.</p>
            </div>
        </div>
    );
}
