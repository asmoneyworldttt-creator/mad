import { Activity, Calendar, Users, Home, Menu, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function MobileBottomNav({ activeTab, setActiveTab, toggleMore }: { activeTab: string, setActiveTab: (t: string) => void, toggleMore: () => void }) {
    return (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-sm bg-surface-bg/80 backdrop-blur-3xl rounded-[28px] px-6 py-3.5 border border-primary/20 shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.05)] z-50 transition-all duration-500 ease-fluid">
            <div className="flex items-center justify-between relative">
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex flex-col items-center gap-1.5 transition-all duration-300 ease-fluid ${activeTab === 'dashboard' ? 'text-primary scale-110' : 'text-text-muted hover:text-white'}`}>
                    <Home size={22} className={activeTab === 'dashboard' ? 'drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]' : ''} />
                    <span className="font-sans text-[10px] tracking-wide">Home</span>
                </button>
                <button
                    onClick={() => setActiveTab('patients')}
                    className={`flex flex-col items-center gap-1.5 transition-all duration-300 ease-fluid ${activeTab === 'patients' ? 'text-primary scale-110' : 'text-text-muted hover:text-white'}`}>
                    <Users size={22} className={activeTab === 'patients' ? 'drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]' : ''} />
                    <span className="font-sans text-[10px] tracking-wide">Patients</span>
                </button>

                {/* Central Action Button */}
                <div className="relative -top-8 mx-2">
                    <button
                        onClick={() => setActiveTab('appointments')}
                        className="w-16 h-16 rounded-full bg-primary text-background-deep flex items-center justify-center shadow-neon hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] active:scale-90 hover:scale-105 transition-all duration-300 ease-fluid border border-white/20 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        <Plus size={32} className="relative z-10 group-hover:rotate-90 transition-transform duration-500" />
                    </button>
                </div>

                <button
                    onClick={() => setActiveTab('prescriptions')}
                    className={`flex flex-col items-center gap-1.5 transition-all duration-300 ease-fluid ${activeTab === 'prescriptions' ? 'text-primary scale-110' : 'text-text-muted hover:text-white'}`}>
                    <Activity size={22} className={activeTab === 'prescriptions' ? 'drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]' : ''} />
                    <span className="font-sans text-[10px] tracking-wide">Scripts</span>
                </button>
                <button
                    onClick={() => toggleMore()}
                    className={`flex flex-col items-center gap-1.5 text-text-muted hover:text-white transition-all duration-300 ease-fluid active:scale-95`}>
                    <Menu size={22} />
                    <span className="font-sans text-[10px] tracking-wide">More</span>
                </button>
            </div>
        </nav>
    );
}

