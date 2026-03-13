
import { useState, useEffect } from 'react';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { supabase } from '../../supabase';
import { CustomSelect } from '../ui/CustomControls';
import {
    Calendar as CalendarIcon,
    Plus,
    ChevronLeft,
    ChevronRight,
    Clock,
    User,
    MoreVertical,
    AlertCircle,
    Search,
    Filter,
    Edit3,
    Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type UserRole = 'master' | 'admin' | 'staff' | 'patient';

export function Appointments({ userRole, setActiveTab, theme }: { userRole: UserRole; setActiveTab: (tab: string) => void; theme?: 'light' | 'dark' }) {
    const today = new Date().toISOString().split('T')[0];
    const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(today);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const { showToast } = useToast();

    // Form State for Add/Edit
    const [formData, setFormData] = useState({
        name: '',
        date: today,
        time: '10:00',
        type: 'Consultation',
        purpose: '',
        status: 'Confirmed',
        toothId: ''
    });

    useEffect(() => {
        fetchAppointments();

        const channel = supabase
            .channel('appointments_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
                fetchAppointments();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedDate, statusFilter]);

    const fetchAppointments = async () => {
        setIsLoading(true);

        let query = supabase
            .from('appointments')
            .select('*')
            .eq('date', selectedDate)
            .order('time', { ascending: true });

        if (statusFilter !== 'All') {
            const mappedStatus = statusFilter === 'Finished' ? 'Visited' : statusFilter;
            query = query.eq('status', mappedStatus);
        }

        const { data } = await query;
        if (data) {
            setAppointments(data.map(a => ({
                ...a,
                status: a.status === 'Visited' ? 'Finished' : a.status
            })));
        }
        setIsLoading(false);
    };

    const handleSaveAppointment = async () => {
        if (!formData.name) return showToast('Patient name is required', 'error');

        // CLINICAL CONFLICT LOGIC: Extraction vs Implant on same day/tooth
        if (formData.toothId && (formData.type === 'Extraction' || formData.type === 'Implant')) {
            const { data: conflicts } = await supabase
                .from('appointments')
                .select('type')
                .eq('date', formData.date)
                .eq('tooth_id', formData.toothId)
                .neq('id', selectedAppointment?.id || 0);

            const hasExtraction = conflicts?.some(c => c.type === 'Extraction');
            const hasImplant = conflicts?.some(c => c.type === 'Implant');

            if ((formData.type === 'Extraction' && hasImplant) || (formData.type === 'Implant' && hasExtraction)) {
                showToast('Clinical Conflict Warning: Extraction and Implant cannot occur on the same tooth on the same day!', 'error');
                return;
            }
        }

        const apptData = {
            name: formData.name,
            date: formData.date,
            time: formData.time,
            type: formData.type,
            notes: formData.purpose,
            status: formData.status === 'Finished' ? 'Visited' : formData.status,
            tooth_id: formData.toothId || null
        };

        if (view === 'edit') {
            const { error } = await supabase.from('appointments').update(apptData).eq('id', selectedAppointment.id);
            if (!error) showToast('Appointment updated successfully', 'success');
        } else {
            const { error } = await supabase.from('appointments').insert(apptData);
            if (!error) showToast('New appointment scheduled', 'success');
        }

        setView('list');
        fetchAppointments();
    };

    const handleDetailsClick = (apt: any) => {
        setSelectedAppointment({ ...apt });
        setIsDetailsModalOpen(true);
    };

    const handleEditClick = (apt: any) => {
        setSelectedAppointment(apt);
        setFormData({
            name: apt.patient_name || apt.name || '',
            date: apt.date || today,
            time: apt.time || '10:00',
            type: apt.type || 'Consultation',
            purpose: apt.notes || '',
            status: apt.status || 'Confirmed',
            toothId: apt.tooth_id || ''
        });
        setView('edit');
    };




    const handleDeleteAppointment = async (id: number) => {
        if (confirm('Are you sure you want to cancel this appointment?')) {
            const { error } = await supabase.from('appointments').delete().eq('id', id);
            if (!error) {
                showToast('Appointment removed', 'success');
                fetchAppointments();
            }
        }
    };

    const PROCEDURE_COLORS: Record<string, { bg: string, border: string, text: string }> = {
        'Consultation': { bg: 'bg-indigo-50/50', border: 'border-l-indigo-500', text: 'text-indigo-600' },
        'Extraction': { bg: 'bg-rose-50/50', border: 'border-l-rose-500', text: 'text-rose-600' },
        'Root Canal': { bg: 'bg-amber-50/50', border: 'border-l-amber-500', text: 'text-amber-600' },
        'Implant': { bg: 'bg-purple-50/50', border: 'border-l-purple-500', text: 'text-purple-600' },
        'Scaling': { bg: 'bg-teal-50/50', border: 'border-l-teal-500', text: 'text-teal-600' },
        'Fillings': { bg: 'bg-emerald-50/50', border: 'border-l-emerald-500', text: 'text-emerald-600' },
        'Emergency': { bg: 'bg-red-50/50', border: 'border-l-red-600', text: 'text-red-700' },
    };

    const getColorsForType = (type: string) => PROCEDURE_COLORS[type] || { bg: 'bg-slate-50/50', border: 'border-l-slate-300', text: 'text-slate-500' };

    const renderAppointmentCard = (apt: any) => {
        const colors = getColorsForType(apt.type);
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={apt.id}
                className={`p-6 rounded-[2rem] border shadow-sm group hover:-translate-y-1 border-l-4 transition-all flex items-center justify-between cursor-pointer ${theme === 'dark' ? `bg-slate-900 border-white/5 ${colors.border}` : `bg-white ${colors.border} border-y-slate-100 border-r-slate-100`}`}
            >
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${colors.bg} ${colors.text}`}>
                            {apt.time}
                        </span>
                        <span className={`text-[9px] font-bold uppercase tracking-wide ${colors.text}`}>{apt.type}</span>
                    </div>
                    <h4 className="text-base font-bold">{apt.patient_name}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">{apt.purpose}</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className={`text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border ${apt.status === 'Confirmed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        apt.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                            'bg-slate-500/10 text-slate-500 border-slate-500/20'
                        }`}>
                        {apt.status}
                    </span>
                    <button onClick={() => handleDetailsClick(apt)} className={`w-10 h-10 rounded-[1rem] flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10' : 'bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}>
                        <MoreVertical size={16} />
                    </button>
                </div>
            </motion.div>
        );
    };

    const prevDay = () => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() - 1);
        setSelectedDate(d.toISOString().split('T')[0]);
    };

    const nextDay = () => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + 1);
        setSelectedDate(d.toISOString().split('T')[0]);
    };

    if (view === 'add' || view === 'edit') {
        return (
            <div className="animate-slide-up space-y-6">
                <div className="flex items-center gap-3">
                    <button onClick={() => setView('list')} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                        <ChevronLeft size={18} />
                    </button>
                    <div>
                        <h2 className={`text-xl md:text-2xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-text-dark'}`}>{view === 'edit' ? 'Reschedule' : 'New Appointment'}</h2>
                        <p className="text-xs font-medium text-slate-500">Clinical session details.</p>
                    </div>
                </div>

                <div className={`rounded-2xl shadow-sm p-5 border ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 mb-1.5 block uppercase tracking-widest">Patient Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input
                                        type="text"
                                        placeholder="Full Name..."
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className={`w-full border rounded-xl pl-10 pr-4 py-2 text-xs font-bold outline-none transition-all focus:ring-4 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-primary'}`}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 mb-1.5 block uppercase tracking-widest">Date</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        className={`w-full border rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 mb-1.5 block uppercase tracking-widest">Time</label>
                                    <input
                                        type="time"
                                        value={formData.time}
                                        onChange={e => setFormData({ ...formData, time: e.target.value })}
                                        className={`w-full border rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 mb-1.5 block uppercase tracking-widest">Treatment</label>
                                    <CustomSelect 
                                        value={formData.type} 
                                        onChange={val => setFormData({ ...formData, type: val })}
                                        options={[
                                            'Consultation', 'Scaling', 'Root Canal', 'Fillings', 
                                            'Follow-up', 'Extraction', 'Implant', 'Procedure', 
                                            'Surgery', 'Emergency'
                                        ]}
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 mb-1.5 block uppercase tracking-widest">Tooth #</label>
                                    <input
                                        type="text"
                                        placeholder="ISO/FDI #"
                                        value={formData.toothId}
                                        onChange={e => setFormData({ ...formData, toothId: e.target.value })}
                                        className={`w-full border rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 mb-1.5 block uppercase tracking-widest">Status</label>
                                <div className="flex flex-wrap gap-1">
                                    {['Confirmed', 'Finished', 'Cancelled', 'Missed'].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setFormData({ ...formData, status: s })}
                                            className={`px-2.5 py-1 rounded-lg text-[8px] font-black border transition-all uppercase tracking-widest ${formData.status === s ? 'bg-primary text-white border-primary shadow-md' : theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="text-[9px] font-black text-slate-400 mb-1.5 block uppercase tracking-widest">Clinical Notes</label>
                        <textarea rows={3} value={formData.purpose} onChange={e => setFormData({ ...formData, purpose: e.target.value })} className={`w-full border rounded-xl p-3 text-xs font-bold outline-none transition-all focus:ring-4 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-primary'}`} placeholder="Reason for visit..."></textarea>
                    </div>

                    <div className="flex gap-2 mt-6 justify-end">
                        <button onClick={() => setView('list')} className={`px-5 py-2.5 rounded-xl border text-[11px] font-bold transition-all active:scale-95 ${theme === 'dark' ? 'border-white/10 text-slate-400 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Cancel</button>
                        <button onClick={handleSaveAppointment} className="px-6 py-2.5 rounded-xl bg-primary text-white text-[11px] font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95">
                            {view === 'edit' ? 'Save' : 'Confirm Slot'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const filteredAppointments = appointments.filter(apt =>
        apt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="animate-slide-up space-y-3 pb-20">
            {/* Header Section */}
            <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-4 md:p-5 rounded-2xl shadow-xl border transition-all`} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                <div>
                    <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-dark)' }}>Appointments</h2>
                    <p className="text-[10px] font-bold mt-0.5" style={{ color: 'var(--text-muted)' }}>Coordination for <span className="text-primary">{selectedDate === today ? 'Today' : selectedDate}</span></p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    <div className={`flex items-center gap-2 p-1 px-3 rounded-xl border w-full sm:w-auto transition-all`} style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)' }}>
                        <CalendarIcon size={14} className="text-primary" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent border-none text-[10px] font-black focus:ring-0 outline-none p-1 cursor-pointer"
                            style={{ color: 'var(--text-main)' }}
                        />
                    </div>
                    <div className="relative flex-1 lg:w-48 w-full">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Find..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full border rounded-xl py-2 pl-9 pr-3 text-[10px] font-bold outline-none transition-all shadow-inner`}
                            style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                        />
                    </div>
                    <button
                        onClick={() => {
                            setFormData({
                                name: '',
                                date: selectedDate,
                                time: '10:00',
                                type: 'Consultation',
                                purpose: '',
                                status: 'Confirmed',
                                toothId: ''
                            });
                            setView('add');
                        }}
                        className="bg-primary hover:scale-[1.02] active:scale-95 text-white shadow-lg shadow-primary/20 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all w-full sm:w-auto flex items-center justify-center gap-2"
                    >
                        <Plus size={16} /> New Slot
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-3">
                <div className="xl:col-span-1 space-y-3">
                    <div className={`p-4 rounded-2xl shadow-lg border transition-all`} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-black text-[8px] uppercase tracking-widest flex items-center gap-1.5" style={{ color: 'var(--text-dark)' }}>
                                <Filter size={12} className="text-primary" />
                                Filters
                            </h3>
                            <div className="flex gap-0.5">
                                <button onClick={prevDay} className="p-1 hover:bg-primary/10 rounded-md transition-all text-slate-400 hover:text-primary"><ChevronLeft size={14} /></button>
                                <button onClick={nextDay} className="p-1 hover:bg-primary/10 rounded-md transition-all text-slate-400 hover:text-primary"><ChevronRight size={14} /></button>
                            </div>
                        </div>

                        <div className="space-y-1">
                            {['All', 'Confirmed', 'Finished', 'Cancelled', 'Missed'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${statusFilter === status ? 'bg-primary text-white border-primary shadow-md' : 'hover:bg-primary/5'}`}
                                    style={statusFilter === status ? {} : { background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                                >
                                    <span>{status}</span>
                                    {statusFilter === status && <div className="w-1 h-1 bg-white rounded-full" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-primary via-primary to-primary-hover p-5 rounded-2xl shadow-xl shadow-primary/20 text-white relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-[8px] font-black uppercase tracking-widest opacity-80 mb-0.5">Registry</p>
                            <h4 className="text-2xl font-black mb-2 flex items-baseline gap-1">
                                {appointments.length}
                                <span className="text-[9px] font-bold opacity-60">NODES</span>
                            </h4>
                            <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (appointments.length / 20) * 100)}%` }} />
                            </div>
                        </div>
                        <CalendarIcon size={60} className="absolute -right-3 -bottom-3 opacity-10 rotate-12 transition-transform group-hover:scale-110 duration-700" />
                    </div>
                </div>

                <div className="xl:col-span-3 space-y-3">
                    {isLoading ? (
                        <div className={`p-16 flex items-center justify-center rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100'}`}>
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                <p className="text-xs text-slate-400 font-bold italic">Loading...</p>
                            </div>
                        </div>
                    ) : filteredAppointments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <AnimatePresence>
                                {filteredAppointments.map((apt, idx) => (
                                    <motion.div
                                        key={apt.id}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={`p-3.5 rounded-2xl shadow-sm border transition-all group relative overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border-white/10 hover:border-primary/30' : 'bg-white border-slate-100 hover:shadow-md'}`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-primary font-black text-xs shadow-inner border transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/10 group-hover:bg-primary/5' : 'bg-slate-50 border-slate-100 group-hover:bg-primary/5'}`}>
                                                    {apt.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className={`font-bold text-xs leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{apt.name}</h3>
                                                    <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 mt-0.5 uppercase tracking-widest">
                                                        <Clock size={8} /> {apt.time}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest border ${apt.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                apt.status === 'Finished' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    'bg-rose-50 text-rose-600 border-rose-100'
                                                }`}>
                                                {apt.status}
                                            </span>
                                        </div>

                                        <div className={`flex items-center gap-2 p-2 rounded-xl mb-3 transition-all border ${theme === 'dark' ? 'bg-white/5 border-transparent group-hover:border-white/10' : 'bg-slate-50 border-transparent group-hover:border-slate-100'}`}>
                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shadow-sm text-primary ${theme === 'dark' ? 'bg-white/10' : 'bg-white'}`}>
                                                <AlertCircle size={12} />
                                            </div>
                                            <p className={`text-[9px] font-bold line-clamp-1 uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>{apt.type} • {apt.notes || 'Routine'}</p>
                                        </div>

                                        <div className="flex gap-1.5">
                                            <button
                                                onClick={() => handleDetailsClick(apt)}
                                                className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm transition-all transform active:scale-95 flex items-center justify-center gap-1.5 ${theme === 'dark' ? 'bg-primary text-white' : 'bg-slate-800 text-white'}`}
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleEditClick(apt)}
                                                className={`p-1.5 border rounded-lg transition-all active:scale-95 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-400 hover:text-primary hover:border-primary/30'}`}
                                            >
                                                <MoreVertical size={14} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className={`p-16 text-center rounded-2xl border flex flex-col items-center justify-center gap-3 ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100'}`}>
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                <CalendarIcon size={32} />
                            </div>
                            <div>
                                <h4 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>No appointments</h4>
                                <p className="text-xs text-slate-400 font-medium">Try another date.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="Appointment Details" maxWidth="max-w-md">
                {selectedAppointment && (
                    <div className="space-y-6">
                        <div className={`flex items-center gap-4 p-4 rounded-3xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary text-2xl font-bold">
                                {selectedAppointment.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className={`font-bold text-xl ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{selectedAppointment.name}</h3>
                                <p className="text-sm font-bold text-primary">ID: {selectedAppointment.id}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className={`p-4 border rounded-2xl shadow-sm ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'}`}>
                                <p className="text-[10px] font-bold text-slate-400   mb-1">Date</p>
                                <p className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{selectedAppointment.date}</p>
                            </div>
                            <div className={`p-4 border rounded-2xl shadow-sm ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'}`}>
                                <p className="text-[10px] font-bold text-slate-400   mb-1">Time</p>
                                <p className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{selectedAppointment.time}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b border-slate-50/10">
                                <span className="text-sm font-bold text-slate-500">Type</span>
                                <span className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>{selectedAppointment.type}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-slate-50/10">
                                <span className="text-sm font-bold text-slate-500">Status</span>
                                <span className="text-[10px] font-extrabold px-3 py-1 bg-primary/10 text-primary rounded-full ">{selectedAppointment.status}</span>
                            </div>
                            {selectedAppointment.tooth_id && (
                                <div className="flex items-center justify-between py-2 border-b border-slate-50/10">
                                    <span className="text-sm font-bold text-slate-500">Target Tooth</span>
                                    <span className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>#{selectedAppointment.tooth_id}</span>
                                </div>
                            )}
                        </div>

                        <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`}>
                            <p className="text-[10px] font-bold text-slate-400   mb-2">Notes</p>
                            <p className={`text-sm font-medium italic ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>"{selectedAppointment.notes || 'No clinical notes provided'}"</p>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button onClick={() => { setIsDetailsModalOpen(false); handleEditClick(selectedAppointment); }} className="flex-1 py-4 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                                <Edit3 size={16} /> Edit Record
                            </button>
                            <button onClick={() => { setIsDetailsModalOpen(false); handleDeleteAppointment(selectedAppointment.id); }} className={`px-4 py-4 rounded-xl font-bold transition-all ${theme === 'dark' ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white'}`}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
