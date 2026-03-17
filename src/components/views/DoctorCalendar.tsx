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
    const [isQuickBooking, setIsQuickBooking] = useState<{ doc: any, time: string } | null>(null);
    const [quickFormData, setQuickFormData] = useState({ patient_id: '', type: 'Consultation', notes: '' });
    const [searchPatients, setSearchPatients] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedPatient, setSelectedPatient] = useState<any>(null);

    useEffect(() => {
        if (selectedPatient) {
            setSearchTerm(`${selectedPatient.name} ${selectedPatient.last_name || ''}`);
        }
    }, [selectedPatient]);

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

    const handleSearchPatients = async (term: string) => {
        setSearchTerm(term);
        if (term.length < 2) {
            setSearchPatients([]);
            return;
        }
        const { data } = await supabase.from('patients').select('id, name, last_name').ilike('name', `%${term}%`).limit(5);
        setSearchPatients(data || []);
    };

    const handleSaveQuickSession = async () => {
        if (!isQuickBooking || !selectedPatient) return;
        
        const newApt = {
            patient_id: selectedPatient.id?.length > 20 ? selectedPatient.id : null,
            name: `${selectedPatient.name} ${selectedPatient.last_name || ''}`,
            doctor_id: isQuickBooking.doc.id?.length > 20 ? isQuickBooking.doc.id : null,
            doctor_name: isQuickBooking.doc.name,
            date: date,
            time: isQuickBooking.time,
            type: quickFormData.type,
            notes: quickFormData.notes || 'Routine checkup',
            status: 'Confirmed'
        };

        const { error } = await supabase.from('appointments').insert(newApt);
        if (error) {
            showToast(error.message, 'error');
        } else {
            showToast(`Recording book session for ${isQuickBooking.doc.name}`, 'success');
            setIsQuickBooking(null);
            setQuickFormData({ patient_id: '', type: 'Consultation', notes: '' });
            setSelectedPatient(null);
            setSearchTerm('');
            fetchAppointments();
        }
    };

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
        setIsQuickBooking({ doc, time });
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
                        <input 
                            type="date" 
                            value={date} 
                            onChange={(e) => setDate(e.target.value)} 
                            className={`bg-transparent border-none text-center font-bold text-xs outline-none px-2 cursor-pointer ${isDark ? 'text-white' : 'text-slate-900'}`} 
                        />
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

            <AnimatePresence>
                {isQuickBooking && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => setIsQuickBooking(null)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className={`relative w-full max-w-md p-8 rounded-[2.5rem] border shadow-2xl ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}
                        >
                            <div className="mb-6 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 font-black text-2xl">
                                    {isQuickBooking.doc.name.charAt(0)}
                                </div>
                                <h3 className="text-xl font-bold tracking-tight">Record Quick Session</h3>
                                <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">{isQuickBooking.doc.name} • {isQuickBooking.time}</p>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">Select Patient</label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input 
                                            type="text" 
                                            placeholder="Search name..."
                                            value={searchTerm}
                                            onChange={(e) => handleSearchPatients(e.target.value)}
                                            className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border text-sm font-bold outline-none transition-all ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-primary' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-primary focus:bg-white shadow-inner'}`}
                                        />
                                    </div>
                                    {searchPatients.length > 0 && (
                                        <div className={`mt-2 rounded-2xl border overflow-hidden shadow-xl ${isDark ? 'bg-slate-800 border-white/10' : 'bg-white border-slate-100'}`}>
                                            {searchPatients.map(p => (
                                                <button 
                                                    key={p.id}
                                                    onClick={() => { setQuickFormData({ ...quickFormData, patient_id: p.id }); setSelectedPatient(p); setSearchPatients([]); }}
                                                    className={`w-full p-4 text-left flex items-center gap-3 transition-colors ${quickFormData.patient_id === p.id ? 'bg-primary text-white' : 'hover:bg-primary/5'}`}
                                                >
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${quickFormData.patient_id === p.id ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
                                                        {p.name.charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-bold">{p.name} {p.last_name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">Procedural Intent</label>
                                    <select 
                                        value={quickFormData.type}
                                        onChange={(e) => setQuickFormData({ ...quickFormData, type: e.target.value })}
                                        className={`w-full px-5 py-3.5 rounded-2xl border text-sm font-bold outline-none transition-all ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white shadow-inner'}`}
                                    >
                                        <option>Consultation</option>
                                        <option>X-Ray / Scan</option>
                                        <option>Extraction</option>
                                        <option>Root Canal</option>
                                        <option>Scaling</option>
                                        <option>Emergency</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">Quick Note</label>
                                    <input 
                                        type="text" 
                                        placeholder="Add clinical context..."
                                        value={quickFormData.notes}
                                        onChange={(e) => setQuickFormData({ ...quickFormData, notes: e.target.value })}
                                        className={`w-full px-5 py-3.5 rounded-2xl border text-sm font-bold outline-none transition-all ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white shadow-inner'}`}
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button 
                                        onClick={() => setIsQuickBooking(null)}
                                        className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 ${isDark ? 'bg-white/5 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleSaveQuickSession}
                                        disabled={!selectedPatient}
                                        className="flex-[2] py-4 rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale"
                                    >
                                        Commit Record
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
