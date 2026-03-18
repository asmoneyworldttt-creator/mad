import { useState, useEffect } from 'react';
import {
    ChevronLeft, ChevronRight, Clock, CheckCircle2, Box, Monitor, Activity, Plus, Maximize2, CalendarCheck, Briefcase, X, User, Search
} from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';
import { Modal } from '../Modal';

const SLOTS = Array.from({ length: 11 }).map((_, i) => `${i + 9}:00 AM`); // 9 AM to 7 PM

export function ResourceCalendar({ userRole, theme }: { userRole: string; theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [chairs, setChairs] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);

    // Modal States
    const [isAddChairOpen, setIsAddChairOpen] = useState(false);
    const [newChair, setNewChair] = useState({ name: '', type: 'General', color: 'bg-primary shadow-primary/30' });
    
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ chairId: string, time: string, appt?: any } | null>(null);
    const [bookingForm, setBookingForm] = useState({ name: '', doctorName: '', doctorId: '', status: 'Scheduled', type: 'Consultation', patientId: '' });

    // Patient Search
    const [patientSearch, setPatientSearch] = useState('');
    const [patientResults, setPatientResults] = useState<any[]>([]);

    useEffect(() => {
        fetchChairs();
        fetchDoctors();
    }, []);

    useEffect(() => {
        fetchAppointments();
    }, [date]);

    useEffect(() => {
        if (patientSearch.length >= 2) {
            const timer = setTimeout(async () => {
                const { data } = await supabase
                    .from('patients')
                    .select('id, name')
                    .ilike('name', `%${patientSearch}%`)
                    .limit(5);
                if (data) setPatientResults(data);
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setPatientResults([]);
        }
    }, [patientSearch]);

    const fetchChairs = async () => {
        const { data } = await supabase.from('clinic_chairs').select('*').order('created_at', { ascending: true });
        if (data && data.length > 0) {
            setChairs(data);
        } else {
            setChairs([
                { id: '1', name: 'Chair 01', type: 'Surge', color: 'bg-primary shadow-primary/30' },
                { id: '2', name: 'Chair 02', type: 'Gen', color: 'bg-emerald-500 shadow-emerald-500/30' }
            ]);
        }
    };

    const fetchDoctors = async () => {
        const { data } = await supabase.from('staff').select('id, name').order('name');
        if (data) setDoctors(data);
    };

    const fetchAppointments = async () => {
        const { data } = await supabase.from('appointments').select('*').eq('date', date);
        if (data) setAppointments(data);
    };

    const handleAddChair = async () => {
        if (!newChair.name) return showToast('Chair name is required', 'error');
        const { error } = await supabase.from('clinic_chairs').insert(newChair);
        if (!error) {
            showToast('Chair added successfully', 'success');
            setIsAddChairOpen(false);
            setNewChair({ name: '', type: 'General', color: 'bg-primary shadow-primary/30' });
            fetchChairs();
        }
    };

    const handleActionClick = (chairId: string, time: string, appt?: any) => {
        setSelectedSlot({ chairId, time, appt });
        if (appt) {
            setBookingForm({
                name: appt.name,
                doctorName: appt.doctor_name || '',
                doctorId: appt.doctor_id || '',
                status: appt.status || 'Scheduled',
                type: appt.type || 'Consultation',
                patientId: appt.patient_id || ''
            });
            setPatientSearch(appt.name);
        } else {
            setBookingForm({ name: '', doctorName: '', doctorId: '', status: 'Scheduled', type: 'Consultation', patientId: '' });
            setPatientSearch('');
        }
        setIsBookingOpen(true);
    };

    const handleSaveBooking = async () => {
        if (!bookingForm.name || !bookingForm.doctorName) return showToast('Patient and Doctor are required', 'error');

        const insertData = {
            name: bookingForm.name,
            doctor_name: bookingForm.doctorName,
            doctor_id: bookingForm.doctorId || null,
            patient_id: bookingForm.patientId || null,
            status: bookingForm.status,
            type: bookingForm.type,
            time: selectedSlot?.time,
            date: date,
            chair_id: selectedSlot?.chairId
        };

        const { error } = selectedSlot?.appt 
            ? await supabase.from('appointments').update(insertData).eq('id', selectedSlot.appt.id)
            : await supabase.from('appointments').insert(insertData);

        if (!error) {
            showToast('Booking Saved', 'success');
            setIsBookingOpen(false);
            fetchAppointments();
        } else {
            showToast('Error saving: ' + error.message, 'error');
        }
    };

    // Metrics calculations
    const activeChairsCount = [...new Set(appointments.filter(a => a.status === 'Working').map(a => a.chair_id))].length;
    const cliniciansCount = [...new Set(appointments.map(a => a.doctor_name).filter(Boolean))].length;

    return (
        <div className="animate-slide-up space-y-6 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight">In-Clinic Flow</h2>
                    <p className={`text-xs font-medium mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Chair scheduling and flow setups
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <input 
                        type="date" 
                        value={date} 
                        onChange={e => setDate(e.target.value)} 
                        className={`p-2 rounded-xl border text-xs font-bold ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}
                    />
                    <button 
                        onClick={() => setIsAddChairOpen(true)}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                    >
                        <Plus size={16} /> Add Chair
                    </button>
                    <button className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all">
                        <Maximize2 size={16} /> Maximize
                    </button>
                </div>
            </div>

            {/* Availability Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Working Chairs', value: `${activeChairsCount} / ${chairs.length}`, icon: Box, color: 'text-primary' },
                    { label: 'Clinicians On-Site', value: cliniciansCount.toString(), icon: Briefcase, color: 'text-emerald-500' },
                    { label: 'Today Scheduled', value: appointments.length.toString(), icon: CalendarCheck, color: 'text-rose-500' }
                ].map((s, i) => (
                    <div key={i} className={`p-4 md:p-5 rounded-2xl border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${s.color} bg-current/10`}><s.icon size={16} /></div>
                        <p className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{s.label}</p>
                        <h4 className="text-xl font-bold">{s.value}</h4>
                    </div>
                ))}
            </div>

            {/* Advanced Calendar Grid View */}
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
                            {chairs.map(chair => (
                                <th key={chair.id} className="p-4 md:p-5 text-center border-b border-white/5 min-w-[180px]">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white mb-1.5 shadow-md ${chair.color || 'bg-primary'}`}>
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
                        {SLOTS.map((time) => (
                            <tr key={time} className="group transition-all hover:bg-white/[0.02]">
                                <td className={`p-4 md:p-5 sticky left-0 z-20 transition-all ${isDark ? 'bg-slate-950/95 group-hover:bg-slate-900' : 'bg-white group-hover:bg-slate-50'} border-r border-white/5`}>
                                    <span className="text-xs font-bold text-slate-400">{time}</span>
                                </td>
                                {chairs.map(chair => {
                                    const appt = appointments.find(a => a.time === time && a.chair_id === chair.id);

                                    return (
                                        <td key={chair.id} className="p-4 border-r border-white/5 transition-all relative">
                                            {appt ? (
                                                <div 
                                                    onClick={() => handleActionClick(chair.id, time, appt)}
                                                    className={`p-3 rounded-xl border flex flex-col gap-1 transition-all hover:scale-[1.02] cursor-pointer shadow-sm ${
                                                    appt.status === 'Completed' 
                                                    ? 'bg-emerald-500/10 border-emerald-500/20' 
                                                    : appt.status === 'Working' ? 'bg-amber-500/10 border-amber-500/20' : (isDark ? 'bg-primary/10 border-primary/20' : 'bg-primary/5 border-primary/20')
                                                }`}>
                                                    <div className="flex justify-between items-start">
                                                        <span className={`text-[9px] font-bold uppercase tracking-tight ${appt.status === 'Completed' ? 'text-emerald-500' : 'text-primary'}`}>{appt.type}</span>
                                                        {appt.status === 'Completed' ? <CheckCircle2 size={10} className="text-emerald-500" /> : <Activity size={10} className="text-primary animate-pulse" />}
                                                    </div>
                                                    <p className="font-bold text-xs leading-tight truncate">{appt.name}</p>
                                                    <p className="text-[8px] font-bold opacity-70 mt-0.5">{appt.doctor_name || 'No Dr.'}</p>
                                                    <p className="text-[8px] font-medium opacity-50">{appt.status || 'Active'}</p>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => handleActionClick(chair.id, time)}
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

            {/* Modal: Add Chair */}
            {isAddChairOpen && (
                <Modal isOpen={true} onClose={() => setIsAddChairOpen(false)} title="Register New Chair">
                    <div className="space-y-4 p-4">
                        <div>
                            <label className="block text-xs font-bold mb-1">Chair Name</label>
                            <input type="text" value={newChair.name} onChange={e => setNewChair({ ...newChair, name: e.target.value })} className="w-full p-2 border rounded-lg" placeholder="Chair 06" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1">Type / Zone</label>
                            <select value={newChair.type} onChange={e => setNewChair({ ...newChair, type: e.target.value })} className="w-full p-2 border rounded-lg">
                                <option value="General">General</option>
                                <option value="Surgical">Surgical</option>
                                <option value="Orthodontic">Orthodontic</option>
                                <option value="Imaging">Imaging</option>
                                <option value="Hygiene">Hygiene</option>
                            </select>
                        </div>
                        <button onClick={handleAddChair} className="w-full bg-primary text-white p-2 rounded-lg font-bold">Add Chair</button>
                    </div>
                </Modal>
            )}

            {/* Modal: Booking / Edit Slot */}
            {isBookingOpen && (
                <Modal isOpen={true} onClose={() => setIsBookingOpen(false)} title={`Chair Allocation: ${chairs.find(c => c.id === selectedSlot?.chairId)?.name} at ${selectedSlot?.time}`}>
                    <div className="space-y-4 p-4">
                        <div className="relative">
                            <label className="block text-xs font-bold mb-1">Patient Name</label>
                            <div className="relative">
                                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text" 
                                    value={patientSearch} 
                                    onChange={e => { setPatientSearch(e.target.value); setBookingForm({ ...bookingForm, name: e.target.value }); }} 
                                    className="w-full pl-10 pr-4 p-2 border rounded-lg" 
                                    placeholder="Search patient..."
                                />
                            </div>
                            {patientResults.length > 0 && (
                                <div className="absolute z-30 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-40 overflow-auto">
                                    {patientResults.map(p => (
                                        <div key={p.id} onClick={() => { setBookingForm({ ...bookingForm, name: p.name, patientId: p.id }); setPatientSearch(p.name); setPatientResults([]); }} className="p-2 hover:bg-slate-100 cursor-pointer text-sm font-medium">
                                            {p.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1">Doctor Name</label>
                            <select value={bookingForm.doctorName} onChange={e => { const d = doctors.find(doc => doc.name === e.target.value); setBookingForm({ ...bookingForm, doctorName: e.target.value, doctorId: d?.id || '' }); }} className="w-full p-2 border rounded-lg">
                                <option value="">Select Doctor</option>
                                {doctors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1">Service Type</label>
                            <select value={bookingForm.type} onChange={e => setBookingForm({ ...bookingForm, type: e.target.value })} className="w-full p-2 border rounded-lg">
                                <option value="Consultation">Consultation</option>
                                <option value="OPD">OPD</option>
                                <option value="Surgical">Surgical</option>
                                <option value="Follow-up">Follow-up</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1">Flow Status</label>
                            <select value={bookingForm.status} onChange={e => setBookingForm({ ...bookingForm, status: e.target.value })} className="w-full p-2 border rounded-lg">
                                <option value="Scheduled">Scheduled</option>
                                <option value="Working">Working</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                        <button onClick={handleSaveBooking} className="w-full bg-primary text-white p-2 rounded-lg font-bold">Save Allocation</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
