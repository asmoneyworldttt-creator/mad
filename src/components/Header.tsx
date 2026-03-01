import { Bell, Search, UserPlus, Menu } from 'lucide-react';
import { useToast } from './Toast';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabase';
import { PatientProfileModal } from './views/PatientProfileModal';

export function Header({ toggleMenu }: { toggleMenu: () => void }) {
    const { showToast } = useToast();

    const [searchQuery, setSearchQuery] = useState('');
    const [liveResults, setLiveResults] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setLiveResults([]);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length > 1) {
            const { data } = await supabase
                .from('patients')
                .select('id, name, phone, gender, age')
                .or(`name.ilike.%${query}%,id.ilike.%${query}%,phone.ilike.%${query}%`)
                .limit(6);
            setLiveResults(data || []);
        } else {
            setLiveResults([]);
        }
    };

    const handleSelectPatient = async (p: any) => {
        const { data } = await supabase.from('patients').select('*, patient_history(*)').eq('id', p.id).single();
        setSelectedPatient(data);
        showToast(`Loaded: ${p.name}`, 'success');
        setSearchQuery('');
        setLiveResults([]);
    };

    const handleSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            const { data } = await supabase
                .from('patients')
                .select('*, patient_history(*)')
                .or(`name.ilike.%${searchQuery}%,id.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
                .limit(1);

            if (data && data.length > 0) {
                setSelectedPatient(data[0]);
                showToast(`Found: ${data[0].name}`, 'success');
            } else {
                showToast('No patient found with that ID, Name or Phone', 'error');
            }
            setSearchQuery('');
            setLiveResults([]);
        }
    };

    return (
        <div className="h-20 border-b border-slate-200 bg-surface/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-4 md:px-8 shadow-sm">
            <div className="flex items-center gap-4 flex-1">
                <button onClick={toggleMenu} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                    <Menu size={24} />
                </button>
                <div ref={searchRef} className="relative w-full max-w-md hidden md:block group">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-primary transition-colors" />
                    <input
                        id="global-search-input"
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onKeyDown={handleSearch}
                        placeholder="Global Search (Name, Patient ID, Phone)..."
                        className="w-full bg-slate-100/50 border border-slate-200 rounded-full py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-text-dark placeholder-slate-400 font-medium shadow-sm focus:shadow-md"
                    />
                    {liveResults.length > 0 && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-premium overflow-hidden z-50 animate-slide-up">
                            <div className="p-2.5 border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Live Results — Click to open EMR
                            </div>
                            {liveResults.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => handleSelectPatient(p)}
                                    className="p-3 cursor-pointer hover:bg-primary/5 transition-colors flex items-center gap-3 border-b border-slate-50 last:border-0"
                                >
                                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                        {p.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-text-dark">{p.name}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">{p.id} • {p.phone} • {p.age}y {p.gender}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-6 text-slate-500">
                <div className="hidden sm:flex items-center gap-2 bg-alert/10 px-3 py-1.5 rounded-full border border-alert/20">
                    <div className="w-2 h-2 rounded-full bg-alert animate-pulse" />
                    <span className="text-sm font-bold text-alert">3 Patients Waiting</span>
                </div>
                <button onClick={() => showToast("You have 3 new notifications!")} className="relative hover:text-primary transition-colors text-slate-400 hover:bg-slate-50 p-2 rounded-full">
                    <Bell size={20} />
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white" />
                </button>
                <button onClick={() => showToast("Quick Registration form opened")} className="bg-primary hover:bg-primary-hover text-white shadow-premium shadow-primary/30 px-4 md:px-5 py-2 md:py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-transform hover:scale-105 active:scale-95">
                    <UserPlus size={16} />
                    <span className="hidden sm:inline">New Patient</span>
                </button>
            </div>
            <PatientProfileModal isOpen={!!selectedPatient} onClose={() => setSelectedPatient(null)} patient={selectedPatient} />
        </div>
    );
}
