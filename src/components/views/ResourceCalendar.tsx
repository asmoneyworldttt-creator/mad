import { useState, useEffect } from 'react';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Clock,
    CheckCircle2,
    Box,
    Monitor,
    Activity,
    Plus,
    Maximize2,
    CalendarCheck,
    Briefcase
} from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';

const CHAIRS = [
    { id: '1', name: 'Chair 01', type: 'Surgery', color: 'bg-primary shadow-primary/30' },
    { id: '2', name: 'Chair 02', type: 'General', color: 'bg-emerald-500 shadow-emerald-500/30' },
    { id: '3', name: 'Chair 03', type: 'Ortho', color: 'bg-amber-500 shadow-amber-500/30' },
    { id: '4', name: 'Chair 04', type: 'Imaging', color: 'bg-rose-500 shadow-rose-500/30' },
    { id: '5', name: 'Chair 05', type: 'Hygiene', color: 'bg-indigo-500 shadow-indigo-500/30' }
];

const SLOTS = Array.from({ length: 11 }).map((_, i) => `${i + 9}:00 AM`); // 9 AM to 7 PM

export function ResourceCalendar({ userRole, theme }: { userRole: string; theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [appointments, setAppointments] = useState<any[]>([]);

    useEffect(() => {
        fetchAppointments();
    }, [date]);

    const fetchAppointments = async () => {
        const { data } = await supabase
            .from('appointments')
            .select('*')
            .eq('date', date);
        if (data) setAppointments(data);
    };

    return (
        <div className="animate-slide-up space-y-8 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Resource Utilization Engine</h2>
                    <p className={`text-sm font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Advanced multi-chair scheduling and clinician flow visualization
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-2xl border flex items-center gap-2 ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
                        <button onClick={() => {
                            const d = new Date(date);
                            d.setDate(d.getDate() - 1);
                            setDate(d.toISOString().split('T')[0]);
                        }} className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}><ChevronLeft size={18} /></button>
                        <span className="text-sm font-bold px-4">{new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <button onClick={() => {
                            const d = new Date(date);
                            d.setDate(d.getDate() + 1);
                            setDate(d.toISOString().split('T')[0]);
                        }} className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}><ChevronRight size={18} /></button>
                    </div>
                    <button className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 hover:bg-primary-hover transition-all active:scale-95">
                        <Maximize2 size={18} /> Optimized Layout
                    </button>
                </div>
            </div>

            {/* Availability Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Active Chairs', value: '05 / 05', icon: Box, color: 'text-primary' },
                    { label: 'Clinicians On-Site', value: '08', icon: Briefcase, color: 'text-emerald-500' },
                    { label: 'Resource Load', value: '78%', icon: Activity, color: 'text-amber-500' },
                    { label: 'Today Checks', value: appointments.length.toString(), icon: CalendarCheck, color: 'text-rose-500' }
                ].map((s, i) => (
                    <div key={i} className={`p-6 rounded-[2.5rem] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${s.color} bg-current/10`}><s.icon size={20} /></div>
                        <p className={`text-[9px] font-extrabold uppercase tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{s.label}</p>
                        <h4 className="text-2xl font-bold">{s.value}</h4>
                    </div>
                ))}
            </div>

            {/* Advanced Calendar View */}
            <div className={`overflow-x-auto rounded-[3rem] border border-transparent shadow-premium ${isDark ? 'bg-slate-950 border-white/5' : 'bg-white shadow-xl'}`}>
                <table className="w-full min-w-[1000px] border-collapse">
                    <thead>
                        <tr className={`${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                            <th className="p-6 text-left border-b border-white/5 w-40 sticky left-0 z-20">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Clock size={16} />
                                    <span className="text-[10px] font-extrabold uppercase tracking-widest">Temporal Flow</span>
                                </div>
                            </th>
                            {CHAIRS.map(chair => (
                                <th key={chair.id} className="p-6 text-center border-b border-white/5 min-w-[200px]">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-2 shadow-lg ${chair.color}`}>
                                            <Monitor size={22} />
                                        </div>
                                        <span className="font-bold text-sm tracking-tight">{chair.name}</span>
                                        <span className="text-[9px] font-extrabold uppercase tracking-widest opacity-40">{chair.type} Zone</span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {SLOTS.map((time, rowIdx) => (
                            <tr key={time} className="group transition-all hover:bg-white/[0.02]">
                                <td className={`p-6 sticky left-0 z-20 transition-all ${isDark ? 'bg-slate-950/95 group-hover:bg-slate-900' : 'bg-white group-hover:bg-slate-50'} border-r border-white/5`}>
                                    <span className="text-xs font-bold text-slate-400">{time}</span>
                                </td>
                                {CHAIRS.map(chair => {
                                    // Randomize occupancy for UI demo or match with appointments
                                    const appt = appointments.find(a => a.time === time && (parseInt(a.id) % 5 === parseInt(chair.id) - 1));

                                    return (
                                        <td key={chair.id} className="p-4 border-r border-white/5 transition-all relative">
                                            {appt ? (
                                                <div className={`p-4 rounded-2xl border flex flex-col gap-2 transition-all hover:scale-[1.02] cursor-pointer shadow-md ${isDark ? 'bg-primary/10 border-primary/20' : 'bg-primary/5 border-primary/20'}`}>
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest">{appt.type}</span>
                                                        <CheckCircle2 size={12} className="text-primary" />
                                                    </div>
                                                    <p className="font-bold text-sm leading-tight">{appt.name}</p>
                                                    <p className="text-[9px] font-medium opacity-50 italic">Verified Patient</p>
                                                </div>
                                            ) : (
                                                <button className={`w-full h-12 rounded-xl flex items-center justify-center border border-dashed text-slate-500 opacity-20 hover:opacity-100 hover:border-primary hover:text-primary transition-all transition-transform active:scale-95 ${isDark ? 'border-white/10' : 'border-slate-300'}`}>
                                                    <Plus size={16} />
                                                </button>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
