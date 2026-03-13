import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, User, Calendar, FileText, Settings, LayoutGrid, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (tab: string) => void;
    theme?: 'light' | 'dark';
}

const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid, category: 'Navigation' },
    { id: 'appointments', label: 'Appointments', icon: Calendar, category: 'Navigation' },
    { id: 'patients', label: 'Patient Database', icon: User, category: 'Clinical' },
    { id: 'emr', label: 'Electronic Medical Records', icon: FileText, category: 'Clinical' },
    { id: 'settings', label: 'System Settings', icon: Settings, category: 'Admin' },
];

export function CommandPalette({ isOpen, onClose, onSelect, theme }: CommandPaletteProps) {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const isDark = theme === 'dark';

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredItems.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredItems[selectedIndex]) {
                    onSelect(filteredItems[selectedIndex].id);
                    onClose();
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedIndex, query]);

    const filteredItems = NAV_ITEMS.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className={cn(
                            "w-full max-w-2xl glass-premium rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10",
                            isDark ? "bg-slate-900/80 border-white/10" : "bg-white/70 border-white/50"
                        )}
                    >
                        <div className="p-6 border-b border-white/10 flex items-center gap-4">
                            <Search className="text-primary animate-pulse" size={24} />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search clinical nodes, patients, or settings..."
                                className="w-full bg-transparent outline-none text-xl font-medium placeholder:text-slate-400"
                            />
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-500/10 border border-slate-500/10 text-[10px] font-bold text-slate-500">
                                <Command size={12} />
                                <span>K</span>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
                            {filteredItems.length > 0 ? (
                                <div className="space-y-6">
                                    {['Navigation', 'Clinical', 'Admin'].map(category => {
                                        const categoryItems = filteredItems.filter(i => i.category === category);
                                        if (categoryItems.length === 0) return null;

                                        return (
                                            <div key={category} className="space-y-2">
                                                <h3 className="px-4 text-[10px] font-bold uppercase tracking-widest text-primary/60">{category}</h3>
                                                {categoryItems.map((item, idx) => {
                                                    const globalIdx = filteredItems.indexOf(item);
                                                    const isActive = globalIdx === selectedIndex;

                                                    return (
                                                        <button
                                                            key={item.id}
                                                            onMouseEnter={() => setSelectedIndex(globalIdx)}
                                                            onClick={() => { onSelect(item.id); onClose(); }}
                                                            className={cn(
                                                                "w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group",
                                                                isActive ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" : "hover:bg-white/10 text-slate-400"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={cn(
                                                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                                                    isActive ? "bg-white/20" : "bg-slate-500/10 text-slate-400 group-hover:text-primary"
                                                                )}>
                                                                    <item.icon size={20} />
                                                                </div>
                                                                <div className="text-left">
                                                                    <p className={cn("font-bold", isActive ? "text-white" : "text-slate-700")}>{item.label}</p>
                                                                    <p className={cn("text-[10px] font-medium opacity-60", isActive ? "text-white" : "text-slate-500")}>Jump to {item.label.toLowerCase()}</p>
                                                                </div>
                                                            </div>
                                                            {isActive && (
                                                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/20 text-[9px] font-bold">
                                                                    <span>Select</span>
                                                                    <Command size={10} />
                                                                </div>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-20 text-center space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-slate-500/10 flex items-center justify-center mx-auto">
                                        <Search size={32} className="text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-400">No clinical nodes found</p>
                                        <p className="text-xs text-slate-500 mt-1">Try searching for 'Patients' or 'Dashboard'</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-slate-500/5 border-t border-white/5 flex justify-between items-center text-[10px] font-bold text-slate-400">
                            <div className="flex items-center gap-6">
                                <span className="flex items-center gap-1.5"><Command size={12} className="rotate-90" /> Navigate</span>
                                <span className="flex items-center gap-1.5"><Command size={12} /> Select</span>
                                <span className="flex items-center gap-1.5">ESC Close</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                Smart Search Active
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
