import { Activity, Calendar, Users, Home, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function MobileBottomNav({ activeTab, setActiveTab, toggleMore }: { activeTab: string, setActiveTab: (t: string) => void, toggleMore: () => void }) {
    return (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] glass-morphism rounded-[32px] px-6 py-4 cyan-glow z-50">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-[var(--accent-cyan)]' : 'text-white/40'}`}>
                    <span className="material-symbols-outlined text-2xl font-variation-fill">grid_view</span>
                    <span className="text-[10px] font-bold">Dash</span>
                </button>
                <button
                    onClick={() => setActiveTab('patients')}
                    className={`flex flex-col items-center gap-1 ${activeTab === 'patients' ? 'text-[var(--accent-cyan)]' : 'text-white/40'}`}>
                    <span className="material-symbols-outlined text-2xl">patient_list</span>
                    <span className="text-[10px] font-bold">Clients</span>
                </button>
                <div className="relative -top-8">
                    <button
                        onClick={() => setActiveTab('appointments')}
                        className="w-14 h-14 rounded-full bg-[var(--accent-cyan)] text-[#0F171A] flex items-center justify-center shadow-[0_0_20px_var(--glow-cyan)] active:scale-90 transition-transform">
                        <span className="material-symbols-outlined text-3xl font-bold">add</span>
                    </button>
                </div>
                <button
                    onClick={() => setActiveTab('prescriptions')}
                    className={`flex flex-col items-center gap-1 ${activeTab === 'prescriptions' ? 'text-[var(--accent-cyan)]' : 'text-white/40'}`}>
                    <span className="material-symbols-outlined text-2xl">description</span>
                    <span className="text-[10px] font-bold">Scripts</span>
                </button>
                <button
                    onClick={() => toggleMore()}
                    className={`flex flex-col items-center gap-1 text-white/40`}>
                    <span className="material-symbols-outlined text-2xl">settings</span>
                    <span className="text-[10px] font-bold">Setup</span>
                </button>
            </div>
        </nav>
    );
}

