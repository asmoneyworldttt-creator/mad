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
    { id: '1', name: 'Chair 01', type: 'Surge', color: 'bg-primary shadow-primary/30' },
    { id: '2', name: 'Chair 02', type: 'Gen', color: 'bg-emerald-500 shadow-emerald-500/30' },
    { id: '3', name: 'Chair 03', type: 'Ortho', color: 'bg-amber-500 shadow-amber-500/30' },
    { id: '4', name: 'Chair 04', type: 'Image', color: 'bg-rose-500 shadow-rose-500/30' },
    { id: '5', name: 'Chair 05', type: 'Hyg', color: 'bg-indigo-500 shadow-indigo-500/30' }
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
        if (data) {
            // Auto-complete older than 24h
            const now = new Date();
            const updated = data.map(a => {
                const aptDate = new Date(`${a.date} ${a.time}`);
                if (now.getTime() - aptDate.getTime() > 24 * 60 * 60 * 1000 && a.status !== 'Completed') {
                    return { ...a, status: 'Completed' };
                }
                return a;
            });
            setAppointments(updated);
        }
    };

    const handleAction = (chairId: string, time: string, currentAppt?: any) => {
        if (!currentAppt) {
            showToast(`Adding new patient to ${CHAIRS.find(c => c.id === chairId)?.name} at ${time}`, 'success');
            // Simulate adding
            const newApt = { id: Math.random().toString(), name: 'New Patient', type: 'OPD', time, date, status: 'Active' };
            setAppointments(prev => [...prev, newApt]);
        } else {
            const nextStatus = currentAppt.status === 'Active' ? 'Completed' : 'Active';
            showToast(`Status updated to ${nextStatus}`, 'success');
            setAppointments(prev => prev.map(a => a.id === currentAppt.id ? { ...a, status: nextStatus } : a));
        }
    };

    return (
        <div className="animate-slide-up space-y-6 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight">In-Clinic Flow</h2>
                    <p className={`text-xs font-medium mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Chair scheduling and flow
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl border flex items-center gap-2 ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
                        <button onClick={() => {
                            const d = new Date(date);
                            d.setDate(d.getDate() - 1);
                            setDate(d.toISOString().split('T')[0]);
                        }} className={`p-1.5 rounded-lg transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}><ChevronLeft size={16} /></button>
                        <span className="text-xs font-bold px-2">{new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <button onClick={() => {
                            const d = new Date(date);
                            d.setDate(d.getDate() + 1);
                            setDate(d.toISOString().split('T')[0]);
                        }} className={`p-1.5 rounded-lg transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}><ChevronRight size={16} /></button>
                    </div>
                    <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                        <Maximize2 size={16} /> Fullscreen
                    </button>
                </div>
            </div>

            {/* Availability Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Active Chairs', value: '05 / 05', icon: Box, color: 'text-primary' },
                    { label: 'Clinicians On-Site', value: '08', icon: Briefcase, color: 'text-emerald-500' },
                    { label: 'Resource Load', value: '78%', icon: Activity, color: 'text-amber-500' },
                    { label: 'Today Checks', value: appointments.length.toString(), icon: CalendarCheck, color: 'text-rose-500' }
                ].map((s, i) => (
                    <div key={i} className={`p-4 md:p-5 rounded-2xl border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${s.color} bg-current/10`}><s.icon size={16} /></div>
                        <p className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{s.label}</p>
                        <h4 className="text-xl font-bold">{s.value}</h4>
                    </div>
                ))}
            </div>

            {/* Advanced Calendar View */}
            <div className={`overflow-x-auto rounded-3xl border border-transparent shadow-premium ${isDark ? 'bg-slate-950 border-white/5' : 'bg-white shadow-xl'}`}>
                <table className="w-full min-w-[1000px] border-collapse">
                    <thead>
                        <tr className={`${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                            <th className="p-4 md:p-5 text-left border-b border-white/5 w-36 sticky left-0 z-20 transition-all">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Clock size={14} />
                                    <span className="text-[9px] font-bold uppercase tracking-wider">Time Flow</span>
                                </div>
                            </th>
                            {CHAIRS.map(chair => (
                                <th key={chair.id} className="p-4 md:p-5 text-center border-b border-white/5 min-w-[180px]">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white mb-1.5 shadow-md ${chair.color}`}>
                                            <Monitor size={18} />
                                        </div>
                                        <span className="font-bold text-xs tracking-tight">{chair.name}</span>
                                        <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">{chair.type} Zone</span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {SLOTS.map((time, rowIdx) => (
                            <tr key={time} className="group transition-all hover:bg-white/[0.02]">
                                <td className={`p-4 md:p-5 sticky left-0 z-20 transition-all ${isDark ? 'bg-slate-950/95 group-hover:bg-slate-900' : 'bg-white group-hover:bg-slate-50'} border-r border-white/5`}>
                                    <span className="text-xs font-bold text-slate-400">{time}</span>
                                </td>
                                {CHAIRS.map(chair => {
                                    // Randomize occupancy for UI demo or match with appointments
                                    const appt = appointments.find(a => a.time === time && (parseInt(a.id) % 5 === parseInt(chair.id) - 1));

                                    return (
                                        <td key={chair.id} className="p-4 border-r border-white/5 transition-all relative">
                                            {appt ? (
                                                <div 
                                                    onClick={() => handleAction(chair.id, time, appt)}
                                                    className={`p-3 rounded-xl border flex flex-col gap-1 transition-all hover:scale-[1.02] cursor-pointer shadow-sm ${
                                                    appt.status === 'Completed' 
                                                    ? 'bg-emerald-500/10 border-emerald-500/20' 
                                                    : (isDark ? 'bg-primary/10 border-primary/20' : 'bg-primary/5 border-primary/20')
                                                }`}>
                                                    <div className="flex justify-between items-start">
                                                        <span className={`text-[9px] font-bold uppercase tracking-tight ${appt.status === 'Completed' ? 'text-emerald-500' : 'text-primary'}`}>{appt.type}</span>
                                                        {appt.status === 'Completed' ? <CheckCircle2 size={10} className="text-emerald-500" /> : <Activity size={10} className="text-primary animate-pulse" />}
                                                    </div>
                                                    <p className="font-bold text-xs leading-tight truncate">{appt.name}</p>
                                                    <p className="text-[8px] font-medium opacity-50">{appt.status || 'Active'}</p>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => handleAction(chair.id, time)}
                                                    className={`w-full h-10 rounded-lg flex items-center justify-center border border-dashed text-slate-400 opacity-40 hover:opacity-100 hover:border-primary hover:text-primary transition-all active:scale-95 ${isDark ? 'border-white/10' : 'border-slate-300'}`}
                                                >
                                                    <Plus size={14} />
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
