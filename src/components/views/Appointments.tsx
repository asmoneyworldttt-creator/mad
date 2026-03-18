
import { useState, useEffect, useRef } from 'react';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { supabase } from '../../supabase';
import { CustomSelect } from '../ui/CustomControls';
import {
    Calendar as CalendarIcon,
    Plus,
    ChevronLeft,
    Clock,
    User,
    Search,
    Filter,
    Edit3,
    Trash2,
    Stethoscope,
    Building2,
    CalendarDays,
    Users,
    CheckCircle2,
    X,
    MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type UserRole = 'master' | 'admin' | 'staff' | 'patient';

const formatTime = (time: string) => {
    try {
        const [h, m] = time.split(':');
        const hr = parseInt(h);
        const ampm = hr >= 12 ? 'PM' : 'AM';
        const h12 = hr % 12 || 12;
        return `${h12}:${m} ${ampm}`;
    } catch (e) {
        return time;
    }
};
const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days = [];
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) { days.push({ dayNumber: prevMonthDays - i, currentMonth: false }); }
    for (let i = 1; i <= totalDays; i++) {
        const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        days.push({ dayNumber: i, currentMonth: true, dateStr: dStr });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) { days.push({ dayNumber: i, currentMonth: false }); }
    return days;
};

function CustomScrollableCalendar({ selectedDate, onSelect, onClose, theme }: any) {
    const calendarRef = useRef<HTMLDivElement>(null);
    const [viewDate, setViewDate] = useState(new Date(selectedDate));
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => { if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) onClose(); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const months: Date[] = [];
    const currentYear = viewDate.getFullYear();
    for (let i = 0; i < 12; i++) { months.push(new Date(currentYear, i, 1)); }

    const handleScroll = (e: any) => {
        const element = e.target;
        const index = Math.floor((element.scrollTop + 50) / 180);
        if (months[index]) setViewDate(months[index]);
    };

    return (
        <div ref={calendarRef} className={`absolute top-full left-0 mt-1 z-50 p-3 rounded-2xl shadow-2xl border w-72 h-[320px] flex flex-col animate-slide-up ${theme === 'dark' ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-100'}`}>
            <div className="flex justify-between items-center mb-2 px-1">
                <div className="flex items-center gap-1">
                    <select 
                        value={currentYear} 
                        onChange={(e) => setViewDate(new Date(Number(e.target.value), viewDate.getMonth(), 1))}
                        className="bg-slate-100 dark:bg-white/5 border-none font-extrabold text-[11px] text-primary rounded-md px-1 py-0.5 outline-none cursor-pointer"
                    >
                        {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y} className="text-black bg-white">{y}</option>)}
                    </select>
                    <span className="font-extrabold text-xs text-primary">{viewDate.toLocaleString('default', { month: 'long' })}</span>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full"><X size={12} /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[9px] text-slate-400 mb-1 border-b pb-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <span key={d}>{d}</span>)}
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 snap-y snap-mandatory no-scrollbar pr-1" onScroll={handleScroll}>
                {months.map((mDate, mIdx) => {
                    const days = getDaysInMonth(mDate);
                    return (
                        <div key={mIdx} className="snap-start pt-1">
                            <h5 className="text-[10px] font-black text-center text-slate-400 mb-1 tracking-wider">{mDate.toLocaleString('default', { month: 'long' })}</h5>
                            <div className="grid grid-cols-7 gap-1">
                                {days.map((d, dIdx) => {
                                    const isSelected = d.currentMonth && d.dateStr === selectedDate;
                                    const isToday = d.currentMonth && d.dateStr === new Date().toISOString().split('T')[0];
                                    return (
                                        <button key={dIdx} disabled={!d.currentMonth} onClick={() => { if (d.dateStr) onSelect(d.dateStr); }}
                                            className={`h-7 flex font-black items-center justify-center rounded-xl text-[10px] transition-all ${
                                                !d.currentMonth ? 'opacity-20 pointer-events-none' :
                                                isSelected ? 'bg-primary text-white shadow-md' :
                                                isToday ? 'border border-primary text-primary' : 'hover:bg-primary/10 text-slate-700 dark:text-slate-200'
                                            }`}
                                        >
                                            {d.dayNumber}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function Appointments({ userRole, theme, setActiveTab }: { userRole: UserRole; theme?: 'light' | 'dark'; setActiveTab?: (tab: string) => void }) {
    const today = new Date().toISOString().split('T')[0];
    const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(today);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [doctorFilter, setDoctorFilter] = useState('All');
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [useDateRange, setUseDateRange] = useState(false);
    const { showToast } = useToast();
    const dateStripRef = useRef<HTMLDivElement>(null);
    const datePickerRef = useRef<HTMLInputElement>(null);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isStartOpen, setIsStartOpen] = useState(false);
    const [isEndOpen, setIsEndOpen] = useState(false);

    useEffect(() => {
        const el = dateStripRef.current;
        if (!el) return;
        let isDown = false; let startX: number; let scrollLeft: number;
        const onDown = (e: MouseEvent) => { isDown = true; startX = e.pageX - el.offsetLeft; scrollLeft = el.scrollLeft; el.style.cursor = 'grabbing'; };
        const onLeave = () => { isDown = false; el.style.cursor = 'default'; };
        const onUp = () => { isDown = false; el.style.cursor = 'default'; };
        const onMove = (e: MouseEvent) => { if (!isDown) return; e.preventDefault(); const walk = (e.pageX - el.offsetLeft - startX) * 1.5; el.scrollLeft = scrollLeft - walk; };
        el.addEventListener('mousedown', onDown); el.addEventListener('mouseleave', onLeave); el.addEventListener('mouseup', onUp); el.addEventListener('mousemove', onMove);
        return () => { el.removeEventListener('mousedown', onDown); el.removeEventListener('mouseleave', onLeave); el.removeEventListener('mouseup', onUp); el.removeEventListener('mousemove', onMove); };
    }, []);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        date: today,
        time: '10:00',
        type: 'Consultation',
        purpose: '',
        status: 'Confirmed',
        toothId: '',
        doctorId: '',
        doctorName: '',
        patientId: ''
    });

    // Patient Search in Form
    const [patientSearch, setPatientSearch] = useState('');
    const [patientResults, setPatientResults] = useState<any[]>([]);
    const [isSearchingPatients, setIsSearchingPatients] = useState(false);
    const [showPatientResults, setShowPatientResults] = useState(false);

    useEffect(() => {
        fetchAppointments();
        fetchDoctors();

        const channel = supabase
            .channel('appointments_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
                fetchAppointments();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedDate, statusFilter, doctorFilter, startDate, endDate, useDateRange]);

    useEffect(() => {
        const searchTimer = setTimeout(async () => {
            if (patientSearch.length >= 2) {
                setIsSearchingPatients(true);
                // Search by name, phone, or ID
                const { data, error } = await supabase
                    .from('patients')
                    .select('id, name, last_name, phone')
                    .or(`name.ilike.%${patientSearch}%,phone.ilike.%${patientSearch}%,id.ilike.%${patientSearch}%`)
                    .limit(5);
                
                if (!error && data) {
                    setPatientResults(data);
                    setShowPatientResults(true);
                }
                setIsSearchingPatients(false);
            } else {
                setPatientResults([]);
                setShowPatientResults(false);
            }
        }, 300);

        return () => clearTimeout(searchTimer);
    }, [patientSearch]);

    const fetchDoctors = async () => {
        const { data } = await supabase.from('staff').select('id, name').order('name');
        if (data) setDoctors(data);
    };

    const fetchAppointments = async () => {
        setIsLoading(true);
        let query = supabase
            .from('appointments')
            .select('*')
            .order('date', { ascending: true })
            .order('time', { ascending: true });

        if (useDateRange) {
            query = query.gte('date', startDate).lte('date', endDate);
        } else {
            query = query.eq('date', selectedDate);
        }

        if (statusFilter !== 'All') {
            const mappedStatus = statusFilter === 'Completed' ? 'Visited' : statusFilter;
            query = query.eq('status', mappedStatus);
        }

        if (doctorFilter !== 'All') {
            query = query.eq('doctor_name', doctorFilter);
        }

        const { data } = await query;
        if (data) {
            setAppointments(data.map(a => ({
                ...a,
                status: a.status === 'Visited' ? 'Completed' : a.status
            })));
        }
        setIsLoading(false);
    };

    const handleSaveAppointment = async () => {
        if (!formData.name) return showToast('Patient name is required', 'error');
        if (!formData.doctorName) return showToast('Please select a doctor', 'error');

        const apptData = {
            name: formData.name,
            date: formData.date,
            time: formData.time,
            type: formData.type,
            notes: formData.purpose,
            status: formData.status === 'Completed' ? 'Visited' : formData.status,
            tooth_id: formData.toothId || null,
            doctor_name: formData.doctorName,
            doctor_id: formData.doctorId || null,
            patient_id: formData.patientId || null
        };

        if (view === 'edit') {
            const { error } = await supabase.from('appointments').update(apptData).eq('id', selectedAppointment.id);
            if (!error) showToast('Appointment updated', 'success');
        } else {
            const { error } = await supabase.from('appointments').insert(apptData);
            if (!error) showToast('Appointment scheduled', 'success');
        }

        setView('list');
        fetchAppointments();
    };

    const handleUpdateStatus = async (id: number, status: string) => {
        const mappedStatus = status === 'Completed' ? 'Visited' : status;
        const { error } = await supabase.from('appointments').update({ status: mappedStatus }).eq('id', id);
        if (error) {
            showToast('Error updating status', 'error');
        } else {
            showToast(`Status updated to ${status}`, 'success');
            setIsDetailsModalOpen(false);
            fetchAppointments();
        }
    };

    const handleDeleteAppointment = async (id: number) => {
        if (confirm('Delete this appointment?')) {
            const { error } = await supabase.from('appointments').delete().eq('id', id);
            if (!error) {
                showToast('Appointment deleted', 'success');
                fetchAppointments();
            }
        }
    };

    const handleEditClick = (apt: any) => {
        setSelectedAppointment(apt);
        setFormData({
            name: apt.name || '',
            date: apt.date || today,
            time: apt.time || '10:00',
            type: apt.type || 'Consultation',
            purpose: apt.notes || '',
            status: apt.status || 'Confirmed',
            toothId: apt.tooth_id || '',
            doctorId: apt.doctor_id || '',
            doctorName: apt.doctor_name || '',
            patientId: apt.patient_id || ''
        });
        setPatientSearch(apt.name || '');
        setView('edit');
    };

    const getDates = () => {
        const dates = [];
        const base = new Date(selectedDate);
        for (let i = -7; i <= 7; i++) {
            const d = new Date(base);
            d.setDate(d.getDate() + i);
            dates.push(d);
        }
        return dates;
    };

    const renderDateStrip = () => {
        const dates = getDates();
        return (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar-hide snap-x snap-mandatory no-scrollbar cursor-grab" ref={dateStripRef}>
                {dates.map((date, idx) => {
                    const dateStr = date.toISOString().split('T')[0];
                    const isSelected = dateStr === selectedDate;
                    const isToday = dateStr === today;
                    return (
                        <button
                            key={idx}
                            onClick={() => setSelectedDate(dateStr)}
                            className={`flex flex-col items-center min-w-[48px] p-1.5 rounded-lg transition-all border snap-center ${
                                isSelected 
                                ? 'bg-primary border-primary text-white shadow-sm' 
                                : `bg-slate-50 dark:bg-white/5 border-transparent text-slate-500`
                            }`}
                        >
                            <span className="text-[8px] font-bold uppercase">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                            <span className="text-sm font-bold">{date.getDate()}</span>
                            {isToday && !isSelected && <div className="w-1 h-1 bg-primary rounded-full mt-0.5" />}
                        </button>
                    );
                })}
            </div>
        );
    };

    const renderTimelineItem = (apt: any) => {
        const isCancelled = apt.status === 'Cancelled';
        return (
            <div key={apt.id} className="relative ps-12 sm:ps-16 pb-4 group">
                <div className="absolute left-[19px] sm:left-[27px] top-3 bottom-0 w-px bg-slate-100 dark:bg-white/5 group-last:hidden" />
                <div className="absolute left-0 top-0 w-8 sm:w-10 text-center">
                    <p className={`text-[10px] font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{formatTime(apt.time)}</p>
                </div>
                <div className={`absolute left-[16px] sm:left-[24px] top-1.5 w-2 h-2 rounded-full border z-10 ${
                    apt.status === 'Confirmed' ? 'bg-emerald-500 border-white dark:border-slate-900' :
                    apt.status === 'Completed' ? 'bg-primary border-white dark:border-slate-900' :
                    apt.status === 'Cancelled' ? 'bg-rose-500 border-white dark:border-slate-900' : 'bg-slate-300 border-white dark:border-slate-900'
                }`} />
                <div 
                    onClick={() => { setSelectedAppointment(apt); setIsDetailsModalOpen(true); }}
                    className={`p-2.5 sm:p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-all active:scale-[0.99] ${
                        theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'
                    }`}
                >
                    <div className="flex justify-between items-center gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-md bg-primary/5 flex items-center justify-center text-primary font-bold text-xs shrink-0">{apt.name.charAt(0)}</div>
                            <div className="min-w-0">
                                <h4 className={`text-xs sm:text-sm font-bold truncate ${isCancelled ? 'line-through opacity-50' : ''} ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{apt.name}</h4>
                                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                    <span className="text-[9px] sm:text-[10px] text-slate-500 flex items-center gap-1"><Stethoscope size={10} /> {apt.doctor_name || 'Assign Doctor'}</span>
                                    <span className="hidden sm:inline text-[9px] text-slate-400 bg-slate-50 dark:bg-white/5 px-1 py-0.5 rounded">{apt.type}</span>
                                </div>
                            </div>
                        </div>
                        <select
                            onClick={(e) => e.stopPropagation()}
                            value={apt.status}
                            onChange={(e) => handleUpdateStatus(apt.id, e.target.value)}
                            className={`text-[8px] font-bold px-1 py-0.5 rounded border uppercase shrink-0 outline-none cursor-pointer transition-all ${
                                apt.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                apt.status === 'Completed' ? 'bg-primary/5 text-primary border-primary/10' :
                                apt.status === 'Cancelled' ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-slate-50 text-slate-500'
                            }`}
                        >
                            {['Confirmed', 'Completed', 'Cancelled', 'Missed'].map(s => (
                                <option key={s} value={s} className="text-black bg-white">{s}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        );
    };

    if (view === 'add' || view === 'edit') {
        return (
            <div className="animate-slide-up space-y-3 max-w-xl mx-auto px-2">
                <div className="flex items-center gap-2">
                    <button onClick={() => setView('list')} className="p-1.5 rounded-lg border bg-white dark:bg-white/5"><ChevronLeft size={16} /></button>
                    <h2 className="text-lg font-bold">{view === 'edit' ? 'Edit Appointment' : 'New Appointment'}</h2>
                </div>
                <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div className="space-y-3">
                        <div className="space-y-1 relative">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Patient Name or ID</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search by Name, ID or Phone..."
                                    value={patientSearch}
                                    onChange={e => { setPatientSearch(e.target.value); setFormData({ ...formData, name: e.target.value, patientId: '' }); }}
                                    className={`w-full border rounded-lg pl-9 pr-4 py-2 text-xs font-medium outline-none ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}
                                />
                            </div>
                            {showPatientResults && (
                                <div className="absolute left-0 right-0 top-full mt-1 z-50 p-1 rounded-lg shadow-xl border bg-white dark:bg-slate-800 border-slate-100 dark:border-white/10">
                                    {patientResults.map(p => (
                                        <button key={p.id} onClick={() => { setFormData({ ...formData, name: `${p.name}`, patientId: p.id }); setPatientSearch(p.name); setShowPatientResults(false); }} className="w-full text-left px-3 py-1.5 rounded-md hover:bg-primary/5 text-[11px] flex justify-between items-center transition-all">
                                            <div className="flex flex-col">
                                                <span className="font-bold">{p.name} {p.last_name || ''}</span>
                                                <span className="text-[9px] opacity-50">ID: {p.id.slice(0, 8)}</span>
                                            </div>
                                            <span className="text-[10px] opacity-50">{p.phone}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Date</label>
                                <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className={`w-full border rounded-lg px-2 py-1.5 text-xs outline-none ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Time</label>
                                <input type="time" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} className={`w-full border rounded-lg px-2 py-1.5 text-xs outline-none ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Doctor</label>
                            <CustomSelect value={formData.doctorName} onChange={val => { const d = doctors.find(doc => doc.name === val); setFormData({ ...formData, doctorName: val, doctorId: d?.id || '' }); }} options={doctors.map(d => d.name)} placeholder="Select doctor" className="text-xs" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Treatment Type</label>
                                <CustomSelect value={formData.type} onChange={v => setFormData({ ...formData, type: v })} options={['Consultation', 'Scaling', 'Root Canal', 'Fillings', 'Extraction', 'Surgery']} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Tooth ID</label>
                                <input type="text" value={formData.toothId} onChange={e => setFormData({ ...formData, toothId: e.target.value })} className={`w-full border rounded-lg px-2 py-1.5 text-xs outline-none ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Notes</label>
                            <textarea rows={2} value={formData.purpose} onChange={e => setFormData({ ...formData, purpose: e.target.value })} className={`w-full border rounded-lg p-2 text-xs outline-none ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`} placeholder="Reason for appointment..." />
                        </div>
                        <div className="flex gap-2 pt-1">
                            <button onClick={() => setView('list')} className="flex-1 py-2 rounded-lg border text-xs font-bold transition-all hover:bg-slate-50">Cancel</button>
                            <button onClick={handleSaveAppointment} className="flex-1 py-2 rounded-lg bg-primary text-white text-xs font-bold transition-all hover:opacity-90 active:scale-95">Save Appointment</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-slide-up space-y-3 px-1 sm:px-0">
            {/* Header */}
            <div className={`p-3 sm:p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                        <div onClick={() => setIsCalendarOpen(!isCalendarOpen)} className="p-1.5 rounded-lg bg-primary/10 text-primary cursor-pointer hover:bg-primary/20 transition-all">
                            <CalendarDays size={18} />
                        </div>
                        <div>
                            <h2 className="text-sm sm:text-base font-bold uppercase tracking-tight">Appointments</h2>
                                <div className="relative">
                                    <p onClick={() => setIsCalendarOpen(!isCalendarOpen)} className="text-[10px] font-medium text-slate-500 hover:text-primary cursor-pointer transition-all flex items-center gap-1">
                                        {new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • {appointments.length} Total
                                    </p>
                                    {isCalendarOpen && (
                                        <CustomScrollableCalendar 
                                            selectedDate={selectedDate} 
                                            onSelect={(date: string) => { setSelectedDate(date); setIsCalendarOpen(false); setUseDateRange(false); }} 
                                            onClose={() => setIsCalendarOpen(false)} 
                                            theme={theme} 
                                        />
                                    )}
                                </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select 
                            value={doctorFilter} 
                            onChange={(e) => setDoctorFilter(e.target.value)}
                            className="bg-slate-50 dark:bg-white/5 border-none rounded-lg text-[11px] font-bold px-3 py-2 outline-none flex-1 sm:flex-none"
                        >
                            <option value="All">All Doctors</option>
                            {doctors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                        </select>
                        <button onClick={() => setView('add')} className="bg-primary text-white px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-bold transition-all hover:opacity-90 active:scale-95">
                            <Plus size={14} /> Add New
                        </button>
                    </div>
                </div>
                <div className="mt-3">{renderDateStrip()}</div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-1 space-y-2">
                    <div className={`p-2.5 rounded-xl border ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                        <div className="relative mb-2">
                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="Quick find..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-lg pl-8 pr-3 py-1.5 text-[11px] outline-none" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <div className="border-b dark:border-white/5 pb-2 mb-1.5 px-0.5">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Date Range</p>
                                <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer">
                                    <input type="checkbox" checked={useDateRange} onChange={e => setUseDateRange(e.target.checked)} className="rounded text-primary focus:ring-primary/20 w-3 h-3" />
                                    <span className="text-[10px] font-medium">Use Range</span>
                                </label>
                                {useDateRange && (
                                    <div className="space-y-1.5 mt-1">
                                        <div className="grid grid-cols-2 gap-1">
                                            <div className="relative">
                                                <p className="text-[8px] font-bold text-slate-400 mb-0.5">Start</p>
                                                <p onClick={() => { setIsStartOpen(!isStartOpen); setIsEndOpen(false); }} className="bg-slate-50 dark:bg-white/5 rounded-md px-1.5 py-1 text-[9px] font-bold cursor-pointer truncate hover:bg-slate-100">
                                                    {new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                </p>
                                                {isStartOpen && ( <CustomScrollableCalendar selectedDate={startDate} onSelect={(d: string) => { setStartDate(d); setIsStartOpen(false); }} onClose={() => setIsStartOpen(false)} theme={theme} /> )}
                                            </div>
                                            <div className="relative">
                                                <p className="text-[8px] font-bold text-slate-400 mb-0.5">End</p>
                                                <p onClick={() => { setIsEndOpen(!isEndOpen); setIsStartOpen(false); }} className="bg-slate-50 dark:bg-white/5 rounded-md px-1.5 py-1 text-[9px] font-bold cursor-pointer truncate hover:bg-slate-100">
                                                    {new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                </p>
                                                {isEndOpen && ( <div className="absolute right-0 top-full mt-1 z-50"><CustomScrollableCalendar selectedDate={endDate} onSelect={(d: string) => { setEndDate(d); setIsEndOpen(false); }} onClose={() => setIsEndOpen(false)} theme={theme} /></div> )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 px-1">Status</p>
                            {['All', 'Confirmed', 'Completed', 'Cancelled', 'Missed'].map(status => (
                                <button key={status} onClick={() => setStatusFilter(status)} className={`text-left px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${statusFilter === status ? 'bg-primary text-white shadow-sm' : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500'}`}>{status === 'Completed' ? 'Completed' : status}</button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="md:col-span-3">
                    {isLoading ? (
                        <div className="py-16 flex flex-col items-center justify-center gap-2 opacity-50"><div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin rounded-full" /><p className="text-[9px] font-bold uppercase tracking-widest">Updating Schedule...</p></div>
                    ) : appointments.length > 0 ? (
                        <div className="space-y-0.5">{appointments.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase())).map(renderTimelineItem)}</div>
                    ) : (
                        <div className={`py-16 text-center rounded-xl border-2 border-dashed ${theme === 'dark' ? 'border-white/5 text-slate-600' : 'border-slate-100 text-slate-300'}`}><Users size={32} className="mx-auto mb-1.5 opacity-50" /><p className="text-xs font-bold">No appointments scheduled for this day</p></div>
                    )}
                </div>
            </div>

            <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="Appointment Details" maxWidth="max-w-xs">
                {selectedAppointment && (
                    <div className="space-y-4 pt-1">
                        <div className="flex items-center gap-3 pb-3 border-b dark:border-white/5">
                            <div className="w-12 h-12 rounded-lg bg-primary text-white flex items-center justify-center text-xl font-bold italic shadow-sm">{selectedAppointment.name.charAt(0)}</div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-sm truncate">{selectedAppointment.name}</h3>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                                    <Clock size={10} /> {formatTime(selectedAppointment.time)}
                                    <span className="opacity-50">•</span>
                                    <span className={`px-1 rounded bg-slate-100 dark:bg-white/10 text-[9px] font-bold`}>{selectedAppointment.status}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                             <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Update Status</p>
                             <div className="grid grid-cols-3 gap-1.5">
                                {['Completed', 'Cancelled', 'Missed'].map(s => (
                                    <button 
                                        key={s} 
                                        onClick={() => handleUpdateStatus(selectedAppointment.id, s)} 
                                        className={`py-2 rounded-lg border text-[9px] font-bold uppercase transition-all flex items-center justify-center ${
                                            selectedAppointment.status === s 
                                            ? 'bg-primary text-white border-primary' 
                                            : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 hover:border-primary/50'
                                        }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                            <p className="text-[9px] font-bold uppercase text-slate-400 mb-1 flex items-center gap-1"><Filter size={9} /> Notes</p>
                            <p className="text-[11px] font-medium leading-relaxed">{selectedAppointment.notes || 'No notes available for this appointment.'}</p>
                        </div>

                        <div className="flex gap-2 pt-1">
                            <button onClick={() => { setIsDetailsModalOpen(false); handleEditClick(selectedAppointment); }} className="flex-1 py-2.5 bg-primary text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:opacity-90 active:scale-95">
                                <Edit3 size={12} /> Reschedule
                            </button>
                            <button onClick={() => { setIsDetailsModalOpen(false); handleDeleteAppointment(selectedAppointment.id); }} className="px-3 py-2.5 border border-rose-100 dark:border-rose-500/20 text-rose-500 rounded-lg flex items-center justify-center transition-all hover:bg-rose-50 dark:hover:bg-rose-500/10">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
