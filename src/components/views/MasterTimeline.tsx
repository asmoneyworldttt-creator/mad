import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
    Search, Filter, Grid, List as ListIcon, Columns, 
    Bell, ChevronLeft, Calendar, User, ArrowUpDown, ChevronRight 
} from 'lucide-react';

export function MasterTimeline({ patients = [], theme, onBack, onSelectPatient }: any) {
    const isDark = theme === 'dark';
    const [viewMode, setViewMode] = useState<'card' | 'list' | 'stage'>('card');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDoctor, setFilterDoctor] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');

    // Master list of all Timeline Events flat across all patients
    const timelineEvents = useMemo(() => {
        let events: any[] = [];
        patients.forEach((p: any) => {
             const history = p.patient_history || [];
             history.forEach((h: any) => {
                  events.push({
                      id: `${p.id}-${h.id}`,
                      patientName: `${p.name} ${p.last_name || ''}`,
                      patientId: p.id,
                      p: p, // keep ref
                      type: h.category || 'Treatment',
                      title: h.treatment || 'Treatment Session',
                      date: h.date || h.created_at?.split('T')[0] || '',
                      status: 'Visited',
                      cost: h.cost,
                      doctor: h.doctor_name || 'Dr. Sarah Jenkins'
                  });
             });

             const notes = p.clinical_notes || [];
             notes.forEach((n: any) => {
                  try {
                      const par = JSON.parse(n.plan);
                      (par.treatments_done || []).forEach((t: any, idx: number) => {
                           events.push({
                                id: `${p.id}-note-done-${n.id}-${idx}`,
                                patientName: `${p.name} ${p.last_name || ''}`,
                                patientId: p.id,
                                p: p,
                                type: 'Completed Treatment',
                                title: t.treatment || 'Consultation',
                                date: n.created_at?.split('T')[0] || '',
                                status: 'Completed',
                                doctor: n.doctor_name || 'Dr. Sarah Jenkins'
                           });
                      });
                  } catch(e) {}
             });
        });

        return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [patients]);

    const filteredEvents = timelineEvents.filter(e => {
        const matchSearch = e.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || e.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchDoctor = filterDoctor === 'All' || e.doctor === filterDoctor;
        return matchSearch && matchDoctor;
    });

    // Derived alerts for panel sidebar
    const alerts = useMemo(() => {
         return filteredEvents.slice(0, 5).map((e, idx) => ({
             id: idx,
             type: 'status',
             text: `${e.patientName}: ${e.title}`,
             time: e.date
         }));
    }, [filteredEvents]);

    const columns = ['New', 'Pending', 'In Progress', 'Completed', 'Follow-up'];

    return (
        <div className="space-y-6 pb-20 animate-slide-up">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className={`p-3 border rounded-xl hover:scale-105 active:scale-95 transition-all ${isDark ? 'bg-slate-900 border-white/5 text-slate-400' : 'bg-white border-slate-100 shadow-sm text-slate-500'}`}><ChevronLeft size={20} /></button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Treatment Timeline</h2>
                        <p className="text-xs font-medium text-slate-500">Live feed across all patient journeys</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Modes */}
                    <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-black/5">
                        <button onClick={() => setViewMode('card')} className={`p-2 rounded-lg ${viewMode === 'card' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-500'}`}><Grid size={16} /></button>
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-500'}`}><ListIcon size={16} /></button>
                        <button onClick={() => setViewMode('stage')} className={`p-2 rounded-lg ${viewMode === 'stage' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-500'}`}><Columns size={16} /></button>
                    </div>
                </div>
            </div>

            {/* ── Filter Strip ── */}
            <div className={`p-3 rounded-2xl border flex flex-wrap items-center gap-3 ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search Event or Patient..." className="w-full pl-9 pr-4 py-2 border rounded-xl outline-none text-xs font-bold" style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} />
                </div>
                <select value={filterDoctor} onChange={e => setFilterDoctor(e.target.value)} className="p-2 border rounded-xl text-xs font-bold" style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)' }}>
                    <option value="All">All Doctors</option>
                    <option value="Dr. Sarah Jenkins">Dr. Sarah Jenkins</option>
                </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                    {viewMode === 'card' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredEvents.map(e => (
                                <div key={e.id} onClick={() => onSelectPatient(e.p)} className={`p-4 rounded-xl border-l-4 border-l-primary cursor-pointer hover:shadow-md transition-all ${isDark ? 'bg-slate-900 border border-white/5' : 'bg-white border shadow-sm'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400">{e.date}</p>
                                            <h4 className="text-sm font-black mt-0.5">{e.title}</h4>
                                            <div className="flex items-center gap-1.5 mt-2">
                                                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold">{e.patientName.charAt(0)}</div>
                                                <span className="text-xs font-bold">{e.patientName}</span>
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-black bg-slate-50 dark:bg-white/5 px-2 py-1 rounded-md text-slate-500">{e.doctor.split(' ')[1]}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {viewMode === 'list' && (
                        <div className={`border rounded-2xl overflow-hidden divide-y ${isDark ? 'border-white/5 divide-white/5' : 'border-slate-100 divide-slate-100'}`}>
                            {filteredEvents.map(e => (
                                <div key={e.id} onClick={() => onSelectPatient(e.p)} className="p-4 flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                        <span>{e.date}</span>
                                        <span className="text-primary">{e.patientName}</span>
                                    </div>
                                    <span>{e.title}</span>
                                    <span className="text-[10px] text-slate-400">{e.doctor}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {viewMode === 'stage' && (
                        <div className="flex gap-4 overflow-x-auto pb-4 items-start">
                            {columns.map(col => (
                                <div key={col} className={`flex-1 min-w-[220px] p-3 rounded-2xl border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                                    <h4 className="text-xs font-black uppercase text-slate-400 mb-3">{col}</h4>
                                    <div className="space-y-2">
                                        {filteredEvents.filter(e => col === 'Completed' ? e.status === 'Completed' : true).slice(0, 3).map(e => (
                                            <div key={e.id} onClick={() => onSelectPatient(e.p)} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border dark:border-white/5 shadow-sm text-xs font-bold">
                                                <p className="text-[10px] text-primary">{e.patientName}</p>
                                                <p className="mt-0.5">{e.title}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Alerts Panel ── */}
                <div className={`p-4 rounded-2xl border h-fit ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><Bell size={14} /> Live Feeds</h4>
                    <div className="space-y-3">
                        {alerts.map(a => (
                            <div key={a.id} className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border dark:border-white/5 text-[11px] font-bold">
                                <p className="line-clamp-2">{a.text}</p>
                                <p className="text-[9px] text-slate-400 mt-1">{a.time}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
