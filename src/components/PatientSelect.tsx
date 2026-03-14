import { useState, useEffect } from 'react';
import { Search, User, ChevronDown } from 'lucide-react';
import { supabase } from '../supabase';

interface PatientSelectProps {
    value?: string;
    onSelect: (patient: any) => void;
    theme?: 'light' | 'dark';
}

export function PatientSelect({ value, onSelect, theme }: PatientSelectProps) {
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const isDark = theme === 'dark';

    useEffect(() => {
        if (value) {
            fetchInitialPatient(value);
        }
    }, [value]);

    const fetchInitialPatient = async (id: string) => {
        const { data } = await supabase.from('patients').select('*').eq('id', id).single();
        if (data) {
            setSelected(data);
            setSearch(data.name);
        }
    };

    const handleSearch = async (q: string) => {
        setSearch(q);
        if (q.length < 2) {
            setResults([]);
            return;
        }

        const { data } = await supabase
            .from('patients')
            .select('*')
            .or(`name.ilike.%${q}%,phone.ilike.%${q}%`)
            .limit(5);
        
        if (data) setResults(data);
    };

    return (
        <div className="relative">
            <label className={`text-[8px] font-black uppercase tracking-widest mb-1.5 block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Patient Case</label>
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search patient name or phone..."
                    value={search}
                    onChange={(e) => {
                        handleSearch(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    className={`w-full rounded-xl px-10 py-3 text-sm font-bold outline-none border transition-all ${isDark ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-200'} focus:border-primary`}
                />
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            {isOpen && search.length >= 2 && results.length > 0 && (
                <div className={`absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border shadow-2xl overflow-hidden animate-slide-up ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100'}`}>
                    {results.map(p => (
                        <div
                            key={p.id}
                            onClick={() => {
                                setSelected(p);
                                setSearch(p.name);
                                onSelect(p);
                                setIsOpen(false);
                            }}
                            className={`px-5 py-4 cursor-pointer text-sm font-bold flex items-center justify-between transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                    <User size={14} />
                                </div>
                                <div>
                                    <p>{p.name}</p>
                                    <p className="text-[10px] text-slate-500 font-medium">#{p.id.slice(0, 8)}</p>
                                </div>
                            </div>
                            <span className="text-xs text-slate-400 font-bold">{p.phone}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
