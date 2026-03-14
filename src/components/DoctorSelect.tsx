import { useState, useEffect } from 'react';
import { User, ChevronDown } from 'lucide-react';
import { supabase } from '../supabase';

interface DoctorSelectProps {
    value?: string;
    onSelect: (doctor: { id: string; name: string }) => void;
    theme?: 'light' | 'dark';
}

export function DoctorSelect({ value, onSelect, theme }: DoctorSelectProps) {
    const [doctors, setDoctors] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
    const isDark = theme === 'dark';

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        const { data } = await supabase
            .from('staff')
            .select('id, name')
            .eq('role', 'Doctor');
        if (data) setDoctors(data);
        
        // If initial value present, find it
        if (value) {
            const found = data?.find(d => d.id === value || d.name === value);
            if (found) setSelected(found);
        }
    };

    return (
        <div className="relative">
            <label className={`text-[8px] font-black uppercase tracking-widest mb-1.5 block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Attending Physician</label>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-bold transition-all ${isDark ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'} focus:border-primary`}
            >
                <div className="flex items-center gap-2">
                    <User size={14} className="text-primary" />
                    {selected ? selected.name : 'Select Doctor'}
                </div>
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className={`absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border shadow-2xl overflow-hidden animate-slide-up ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100'}`}>
                    {doctors.map(doc => (
                        <div
                            key={doc.id}
                            onClick={() => {
                                setSelected(doc);
                                onSelect(doc);
                                setIsOpen(false);
                            }}
                            className={`px-5 py-4 cursor-pointer text-sm font-bold flex items-center gap-3 transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                        >
                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                {doc.name.charAt(0)}
                            </div>
                            {doc.name}
                        </div>
                    ))}
                    {doctors.length === 0 && (
                        <div className="p-4 text-xs text-slate-500 italic text-center">No doctors found</div>
                    )}
                </div>
            )}
        </div>
    );
}
