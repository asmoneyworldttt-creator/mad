import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Phone, Calendar, ArrowRight, ExternalLink, CheckCircle2, Circle } from 'lucide-react';
import { supabase } from '../../supabase';
import { CustomSelect } from '../ui/CustomControls';
import { SkeletonList } from '../SkeletonLoader';
import { EmptyState } from '../EmptyState';

type UserRole = 'master' | 'admin' | 'staff' | 'patient';

const DEFAULT_TREATMENTS = [
    "Orthodontic Adjustment", "Crown Fitment", "Implant Loading", "Suture Removal", "Scaling & Polishing", "F- therapy", "Check-up", "Consultation"
];

export function Reminder({ userRole, theme }: { userRole: UserRole; theme?: 'light' | 'dark' }) {
    const [followups, setFollowups] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [treatmentFilter, setTreatmentFilter] = useState('All');
    const [genderFilter, setGenderFilter] = useState('All');
    const [ageFilter, setAgeFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchFollowups();
    }, []);

    const fetchFollowups = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('patient_history')
            .select('*, patients(*)')
            .eq('category', 'FollowUp')
            .order('date', { ascending: true });
        
        if (data) setFollowups(data);
        setIsLoading(false);
    };

    const uniqueTreatments = useMemo(() => {
        const list = followups.map(f => f.treatment).filter(Boolean);
        return ['All', ...Array.from(new Set([...DEFAULT_TREATMENTS, ...list]))];
    }, [followups]);

    const filteredFollowups = useMemo(() => {
        return followups.filter(f => {
            const p = f.patients;
            if (!p) return false;

            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.phone && p.phone.includes(searchTerm));
            const matchesTreatment = treatmentFilter === 'All' || f.treatment === treatmentFilter;
            const matchesGender = genderFilter === 'All' || p.gender === genderFilter;
            
            let matchesAge = true;
            if (ageFilter === 'Adult') matchesAge = (p.age || 0) >= 18;
            else if (ageFilter === 'Pediatric') matchesAge = (p.age || 0) < 18;

            return matchesSearch && matchesTreatment && matchesGender && matchesAge;
        });
    }, [followups, searchTerm, treatmentFilter, genderFilter, ageFilter]);

    const groupedByTimeline = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const today: any[] = [];
        const upcoming: any[] = [];
        const past: any[] = [];
        const completed: any[] = [];

        filteredFollowups.forEach(f => {
            if (f.notes?.includes('[Status]: Completed')) {
                completed.push(f);
            } else if (f.date === todayStr) {
                today.push(f);
            } else if (f.date > todayStr) {
                upcoming.push(f);
            } else {
                past.push(f);
            }
        });

        return { today, upcoming, past, completed };
    }, [filteredFollowups]);

    const handleSendWhatsApp = (f: any) => {
        const p = f.patients;
        if (!p || !p.phone) return;
        const text = f.notes?.replace('\n[Status]: Completed', '') || `Hello ${p.name}, this is a reminder regarding your follow-up for ${f.treatment}.`;
        const url = `https://wa.me/${p.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const handleToggleComplete = async (f: any) => {
        const currentNotes = f.notes || '';
        const isCurrentlyCompleted = currentNotes.includes('[Status]: Completed');
        const newNotes = isCurrentlyCompleted
            ? currentNotes.replace('\n[Status]: Completed', '').trim()
            : (currentNotes.trim() + '\n[Status]: Completed');

        setFollowups(prev => prev.map(item => item.id === f.id ? { ...item, notes: newNotes } : item));

        const { error } = await supabase
            .from('patient_history')
            .update({ notes: newNotes })
            .eq('id', f.id);

        if (error) fetchFollowups();
    };

    return (
        <div className="animate-slide-up space-y-8 pb-10">
            <div className={`p-10 rounded-[3rem] border shadow-2xl transition-all relative overflow-hidden`} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transition-transform group-hover:rotate-12 duration-700"><Calendar size={120} /></div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-dark)' }}>Reminder Desk</h2>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Follow up with patients regarding scheduled treatments.</p>
                    </div>
                </div>
            </div>

            <div className={`rounded-[3rem] border overflow-hidden shadow-2xl transition-all`} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                {/* Filters Header */}
                <div className="p-8 flex flex-col sm:flex-row gap-6 justify-between border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--card-bg-alt)' }}>
                    <div className="relative w-full max-w-sm">
                        <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Find patient..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full rounded-[2rem] py-4 pl-14 pr-6 text-sm font-bold outline-none transition-all shadow-inner"
                            style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                        />
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                        <div className="w-40">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block">Treatment</label>
                            <CustomSelect value={treatmentFilter} onChange={val => setTreatmentFilter(val)} options={uniqueTreatments} />
                        </div>
                        <div className="w-32">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block">Gender</label>
                            <CustomSelect value={genderFilter} onChange={val => setGenderFilter(val)} options={['All', 'Male', 'Female']} />
                        </div>
                        <div className="w-32">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block">Category</label>
                            <CustomSelect value={ageFilter} onChange={val => setAgeFilter(val)} options={['All', 'Adult', 'Pediatric']} />
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {isLoading ? (
                        <SkeletonList rows={5} />
                    ) : (
                        <>
                            {/* Today's Section */}
                            {groupedByTimeline.today.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <h4 className="font-bold text-base" style={{ color: 'var(--text-dark)' }}>Today's Follow-ups</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {groupedByTimeline.today.map(f => (
                                            <ReminderCard key={f.id} f={f} theme={theme} onSend={handleSendWhatsApp} onToggle={handleToggleComplete} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Upcoming Section */}
                            {groupedByTimeline.upcoming.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="font-bold text-base mt-2" style={{ color: 'var(--text-dark)' }}>Upcoming Follow-ups</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {groupedByTimeline.upcoming.map(f => (
                                            <ReminderCard key={f.id} f={f} theme={theme} onSend={handleSendWhatsApp} onToggle={handleToggleComplete} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Past Section */}
                            {groupedByTimeline.past.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="font-bold text-base text-slate-400 mt-2">Missed / Past Follow-ups</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75">
                                        {groupedByTimeline.past.map(f => (
                                            <ReminderCard key={f.id} f={f} theme={theme} onSend={handleSendWhatsApp} onToggle={handleToggleComplete} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Completed Section */}
                            {groupedByTimeline.completed.length > 0 && (
                                <div className="space-y-4 border-t pt-6 mt-4" style={{ borderColor: 'var(--border-color)' }}>
                                    <h4 className="font-bold text-base text-teal-400 flex items-center gap-1.5"><CheckCircle2 size={18} /> Completed Reminders</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
                                        {groupedByTimeline.completed.map(f => (
                                            <ReminderCard key={f.id} f={f} theme={theme} onSend={handleSendWhatsApp} onToggle={handleToggleComplete} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {filteredFollowups.length === 0 && (
                                <EmptyState
                                    icon={Calendar}
                                    title="No Follow-ups Found"
                                    description="No scheduled follow-up reminders matching your filter criteria."
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function ReminderCard({ f, theme, onSend, onToggle }: { f: any, theme?: string, onSend: (f: any) => void, onToggle: (f: any) => void }) {
    const p = f.patients || {};
    const isCompleted = f.notes?.includes('[Status]: Completed');

    return (
        <div className={`p-6 rounded-2xl border flex flex-col justify-between transition-all hover:shadow-md ${isCompleted ? 'bg-slate-50 dark:bg-slate-900/10' : 'bg-white dark:bg-slate-900/40'}`} style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${isCompleted ? 'bg-slate-200 text-slate-500' : 'bg-primary/10 text-primary'}`}>
                        {p.name ? p.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                        <h5 className={`font-bold text-sm tracking-tight ${isCompleted ? 'line-through text-slate-400' : ''}`} style={{ color: 'var(--text-dark)' }}>{p.name || 'Unknown Patient'}</h5>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{p.gender} • {p.age} Yrs</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isCompleted ? 'text-slate-400' : 'text-primary'}`}>{f.date}</p>
                    <p className="text-[8px] font-medium text-slate-400">{f.doctor_name || 'Attending Doctor'}</p>
                </div>
            </div>
            
            <div className={`p-3 rounded-xl mb-4 ${isCompleted ? 'bg-slate-100 dark:bg-white/5' : 'bg-slate-50 dark:bg-white/5'}`}>
                <p className={`text-[10px] font-black mb-1 uppercase ${isCompleted ? 'text-slate-400' : 'text-primary'}`}>Next Treatment</p>
                <p className={`font-bold text-xs ${isCompleted ? 'text-slate-500' : ''}`} style={{ color: 'var(--text-dark)' }}>{f.treatment}</p>
                <p className="text-[10px] font-medium text-slate-500 mt-1 italic">"{f.notes?.replace('\n[Status]: Completed', '') || 'No message added'}"</p>
            </div>
            
            <div className="flex justify-between items-center border-t pt-3 mt-auto" style={{ borderColor: 'var(--border-color)' }}>
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Phone size={12} /> {p.phone || 'N/A'}</span>
                
                <div className="flex items-center gap-2">
                    {p.phone && !isCompleted && (
                        <button onClick={() => onSend(f)} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm active:scale-95 transition-all">
                            Send <ExternalLink size={12} />
                        </button>
                    )}
                    
                    <button onClick={() => onToggle(f)} className={`p-1.5 rounded-lg border transition-all active:scale-95 flex items-center gap-1 text-[10px] font-bold ${isCompleted ? 'bg-teal-500 border-teal-500 text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700'}`}>
                        {isCompleted ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                        {isCompleted ? 'Done' : 'Mark Done'}
                    </button>
                </div>
            </div>
        </div>
    );
}
