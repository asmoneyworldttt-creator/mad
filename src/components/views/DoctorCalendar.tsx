import { useState, useEffect } from 'react';
import {
    ChevronLeft, ChevronRight, Clock, Plus,
    User, Search, RefreshCw, Calendar as CalendarIcon,
    Users, MoreHorizontal, CheckCircle2, AlertCircle
} from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';
import { motion, AnimatePresence } from 'framer-motion';

const TIME_SLOTS = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
];

export function DoctorCalendar({ theme, setActiveTab }: { theme?: 'light' | 'dark'; setActiveTab?: (t: string) => void }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const today = new Date().toISOString().split('T')[0];

    const [date, setDate] = useState(today);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInitialData();
        const sub = supabase.channel('doc_cal')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetchAppointments)
            .subscribe();
        return () => { supabase.removeChannel(sub); };
    }, [date]);

    async function fetchInitialData() {
        setLoading(true);
        try {
            // Fetch doctors (staff with role like 'Doctor' or 'Surgeon')
            const { data: staff } = await supabase.from('staff').select('*');
            const docs = staff?.filter((s: any) =>
                s.role?.toLowerCase().includes('doctor') ||
                s.role?.toLowerCase().includes('surgeon') ||
                s.role?.toLowerCase().includes('dentist')
            ) || [];

            // Add a default doctor if none found for demo purposes
            if (docs.length === 0) {
                docs.push({ id: 'jenkins', name: 'Dr. Jenkins', role: 'Chief Dentist' });
            }

            setDoctors(docs);
            await fetchAppointments();
        } catch (e) {
            showToast('Failed to load clinical personnel', 'error');
        } finally {
            setLoading(false);
        }
    }

    async function fetchAppointments() {
        const { data } = await supabase.from('appointments').select('*').eq('date', date);
        setAppointments(data || []);
    }

    const prevDay = () => {
        const d = new Date(date);
        d.setDate(d.getDate() - 1);
        setDate(d.toISOString().split('T')[0]);
    };

    const nextDay = () => {
        const d = new Date(date);
        d.setDate(d.getDate() + 1);
        setDate(d.toISOString().split('T')[0]);
    };

    const getApptAt = (doctorId: string, doctorName: string, time: string) => {
        return appointments.find(a =>
            a.time?.startsWith(time) &&
            (a.doctor_id === doctorId || a.doctor_name === doctorName)
        );
    };

    const handleAddSession = (doc: any, time: string) => {
        showToast(`Redirecting to book session for ${doc.name} at ${time}`, 'success');
        if (setActiveTab) {
            setActiveTab('appointments');
        }
    };

    return (
        <div className="animate-slide-up space-y-6 pb-20">
            {/* Header */}
            <div className={`p-5 md:p-6 rounded-2xl border flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div>
                    <h2 className="text-lg font-bold tracking-tight">Doctor Schedule</h2>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Patient flow for {date === today ? 'Today' : date}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`flex items-center p-1 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                        <button onClick={prevDay} className="p-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-all text-slate-400"><ChevronLeft size={18} /></button>
                        <div className="px-4 flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-500 mb-0.5">{new Date(date).toLocaleDateString('en-IN', { month: 'short' })}</span>
                            <span className="text-base font-bold leading-none">{new Date(date).getDate()}</span>
                        </div>
                        <button onClick={nextDay} className="p-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-all text-slate-400"><ChevronRight size={18} /></button>
                    </div>
                    <button onClick={fetchInitialData} className={`p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500'}`}><RefreshCw size={18} /></button>
                    <button className="bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-xs flex items-center gap-2">
                        <Plus size={16} /> New Session
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className={`rounded-3xl border overflow-hidden ${isDark ? 'bg-slate-900/50 border-white/10' : 'bg-white border-slate-200 shadow-xl'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse" style={{ minWidth: doctors.length * 200 + 100 }}>
                        <thead>
                            <tr className={`${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                                <th className={`p-5 text-center border-b border-r sticky left-0 z-30 w-28 ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'}`}>
                                    <div className="flex flex-col items-center gap-1">
                                        <Clock size={14} className="text-primary" />
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Time</span>
                                    </div>
                                </th>
                                {doctors.map((doc, i) => (
                                    <th key={doc.id || i} className={`p-4 md:p-5 text-center border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="relative">
                                                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center font-bold text-base shadow-md ${isDark ? 'bg-white/10 text-white' : 'bg-primary/10 text-primary'}`}>
                                                    {doc.name?.charAt(0) || 'D'}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-xs md:text-sm tracking-tight">{doc.name}</h4>
                                                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{doc.role || 'Doctor'}</p>
                                            </div>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {TIME_SLOTS.map((time, rowIdx) => (
                                <tr key={time} className="group transition-all hover:bg-white/[0.01]">
                                    <td className={`p-4 sticky left-0 z-20 transition-all border-r ${isDark ? 'bg-slate-900/95 group-hover:bg-slate-900 border-white/5' : 'bg-white group-hover:bg-slate-50 border-slate-100'}`}>
                                        <span className="text-xs font-bold text-slate-400">{time}</span>
                                    </td>
                                    {doctors.map((doc, colIdx) => {
                                        const appt = getApptAt(doc.id, doc.name, time);
                                        return (
                                            <td key={`${doc.id}-${time}`} className={`p-3 relative border-r last:border-r-0 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                                                {appt ? (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className={`p-3 rounded-xl border shadow-sm transition-all hover:scale-[1.02] cursor-pointer group/card ${appt.status === 'Confirmed' ? (isDark ? 'bg-primary/10 border-primary/30' : 'bg-primary/5 border-primary/20') :
                                                                appt.status === 'Visited' ? (isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-500/5 border-emerald-500/20') :
                                                                    (isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200')
                                                            }`}
                                                    >
                                                        <div className="flex justify-between items-start mb-1.5">
                                                            <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${appt.status === 'Confirmed' ? 'text-primary bg-primary/10' :
                                                                    appt.status === 'Visited' ? 'text-emerald-500 bg-emerald-500/10' :
                                                                        'text-slate-400 bg-white/10'
                                                                }`}>
                                                                {appt.type}
                                                            </span>
                                                            <button className="opacity-0 group-hover/card:opacity-100 transition-opacity p-1 text-slate-400 hover:text-white">
                                                                <MoreHorizontal size={14} />
                                                            </button>
                                                        </div>
                                                        <p className="font-bold text-sm leading-tight mb-1">{appt.name || appt.patient_name}</p>
                                                        <div className="flex items-center gap-1.5 opacity-60">
                                                            <User size={10} className="text-primary" />
                                                            <p className="text-[9px] font-medium truncate">{appt.notes || 'No notes'}</p>
                                                        </div>
                                                    </motion.div>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleAddSession(doc, time)}
                                                        className={`w-full h-10 rounded-xl flex items-center justify-center border border-dashed transition-all active:scale-95 text-slate-400 opacity-60 hover:opacity-100 hover:border-primary hover:text-primary hover:bg-primary/5 ${isDark ? 'border-white/20' : 'border-slate-300'}`}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            <Plus size={14} />
                                                            <span className="text-[10px] font-bold">Add</span>
                                                        </div>
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

            {/* Legend */}
            <div className="flex flex-wrap gap-6 justify-center mt-4">
                {[
                    { label: 'Confirmed', color: 'bg-primary' },
                    { label: 'Visited', color: 'bg-emerald-500' },
                    { label: 'Cancelled', color: 'bg-rose-500' },
                    { label: 'Manual', color: 'bg-slate-400' }
                ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${item.color}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
