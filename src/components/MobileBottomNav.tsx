import { Activity, Calendar, Users, Home, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function MobileBottomNav({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) {
    const tabs = [
        { id: 'dashboard', icon: Home, label: 'Home' },
        { id: 'appointments', icon: Calendar, label: 'Schedule' },
        { id: 'emr', icon: Activity, label: 'EMR' },
        { id: 'patients', icon: Users, label: 'Patients' },
        { id: 'settings', icon: Settings, label: 'More' }
    ];

    return (
        <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-slate-200 pb-safe z-50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
            <div className="flex justify-around items-center px-2 py-3">
                {tabs.map(t => {
                    const isActive = activeTab === t.id;
                    const Icon = t.icon;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={`flex flex-col items-center justify-center w-16 gap-1 transition-colors relative ${isActive ? 'text-primary drop-shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <div className="relative z-10">
                                <Icon size={isActive ? 24 : 22} className={`transition-transform duration-300 ${isActive ? 'scale-110 mb-0.5' : ''}`} />
                            </div>
                            <span className={`text-[10px] uppercase font-bold tracking-wider transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-70 font-medium'}`}>{t.label}</span>

                            <AnimatePresence>
                                {isActive && (
                                    <motion.div
                                        layoutId="mobileNavIndicator"
                                        className="absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-primary"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    />
                                )}
                            </AnimatePresence>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
