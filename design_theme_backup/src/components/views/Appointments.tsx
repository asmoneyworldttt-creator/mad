
import { useState, useEffect } from 'react';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { supabase } from '../../supabase';
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

type UserRole = 'admin' | 'staff' | 'doctor' | 'patient';

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
                    <div className="flex items-center gap-3 mb-2">
                        <span className={`text-[9px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest ${colors.bg} ${colors.text}`}>
                            {apt.time}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${colors.text}`}>{apt.type}</span>
                    </div>
                    <h4 className="text-xl font-bold">{apt.patient_name}</h4>
                    <p className="text-xs text-slate-500 font-medium">{apt.purpose}</p>
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
            <div className="animate-slide-up space-y-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('list')} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h2 className={`text-3xl font-sans font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-text-dark'}`}>{view === 'edit' ? 'Reschedule Clinical Session' : 'Book New Appointment'}</h2>
                        <p className="text-slate-500 font-medium">Capture details for the upcoming patient interaction.</p>
                    </div>
                </div>

                <div className={`rounded-[2.5rem] shadow-sm p-10 border ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">Patient Identity</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search or Enter Patient Name"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className={`w-full border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none transition-all focus:ring-4 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-primary/50 focus:ring-primary/10' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-primary focus:ring-primary/10'}`}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">Scheduled Date</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        className={`w-full border rounded-xl px-4 py-3.5 text-sm font-bold outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">Interval Slot</label>
                                    <input
                                        type="time"
                                        value={formData.time}
                                        onChange={e => setFormData({ ...formData, time: e.target.value })}
                                        className={`w-full border rounded-xl px-4 py-3.5 text-sm font-bold outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">Clinical Protocol</label>
                                    <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className={`w-full border rounded-xl px-4 py-3.5 text-sm font-bold outline-none transition-all appearance-none ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                                        <option>Consultation</option>
                                        <option>Scaling</option>
                                        <option>Root Canal</option>
                                        <option>Fillings</option>
                                        <option>Follow-up</option>
                                        <option>Extraction</option>
                                        <option>Implant</option>
                                        <option>Procedure</option>
                                        <option>Surgery</option>
                                        <option>Emergency</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">Tooth Mapping</label>
                                    <input
                                        type="text"
                                        placeholder="ISO/FDI #"
                                        value={formData.toothId}
                                        onChange={e => setFormData({ ...formData, toothId: e.target.value })}
                                        className={`w-full border rounded-xl px-4 py-3.5 text-sm font-bold outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">Status Workflow</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Confirmed', 'Finished', 'Cancelled', 'Missed'].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setFormData({ ...formData, status: s })}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-extrabold border transition-all ${formData.status === s ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10">
                        <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">Clinical Notes & Observations</label>
                        <textarea rows={6} value={formData.purpose} onChange={e => setFormData({ ...formData, purpose: e.target.value })} className={`w-full border rounded-3xl p-6 text-sm font-medium outline-none transition-all focus:ring-4 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-primary/50 focus:ring-primary/10' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-primary focus:ring-primary/10'}`} placeholder="Enter clinical notes, history, or reason for visit..."></textarea>
                    </div>

                    <div className="flex gap-4 mt-12 justify-end">
                        <button onClick={() => setView('list')} className={`px-10 py-4 rounded-2xl border font-bold transition-all active:scale-95 ${theme === 'dark' ? 'border-white/10 text-slate-400 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Cancel Operation</button>
                        <button onClick={handleSaveAppointment} className="px-12 py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary-hover shadow-premium shadow-primary/20 transition-all active:scale-95">
                            {view === 'edit' ? 'Update Credentials' : 'Commit Booking'}
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
        <div className="animate-slide-up space-y-6 pb-20">
            {/* Header Section */}
            <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 p-8 rounded-[2rem] shadow-sm border ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100'}`}>
                <div>
                    <h2 className={`text-3xl font-sans font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-text-dark'}`}>Clinical Scheduler</h2>
                    <p className="text-slate-500 font-medium mt-1">Viewing records for <span className="text-primary font-bold">{selectedDate === today ? 'Today' : selectedDate}</span></p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    <div className={`flex items-center gap-2 p-2 rounded-2xl border w-full sm:w-auto ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                        <CalendarIcon size={18} className="text-slate-400 ml-2" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent border-none text-sm font-bold focus:ring-0 outline-none p-1 cursor-pointer"
                        />
                    </div>
                    <div className="relative flex-1 lg:w-64 w-full">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Find in list..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full border rounded-2xl py-3 pl-12 pr-4 text-sm outline-none transition-all shadow-inner ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-primary/50 focus:bg-white'}`}
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
                        className="bg-primary hover:bg-primary-hover text-white shadow-premium shadow-primary/20 px-6 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 w-full sm:w-auto"
                    >
                        <Plus size={20} /> <span className="hidden sm:inline">Book New</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-1 space-y-6">
                    <div className={`p-6 rounded-[2rem] shadow-sm border ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100'}`}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className={`font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                                <Filter size={18} className="text-primary" />
                                Status Filters
                            </h3>
                            <div className="flex gap-1">
                                <button onClick={prevDay} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-primary"><ChevronLeft size={18} /></button>
                                <button onClick={nextDay} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-primary"><ChevronRight size={18} /></button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-2">
                                {['All', 'Confirmed', 'Finished', 'Cancelled', 'Missed'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${statusFilter === status ? 'bg-primary/10 text-primary border border-primary/20' : theme === 'dark' ? 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10' : 'bg-slate-50 text-slate-600 border border-transparent hover:bg-slate-100'}`}
                                    >
                                        <span>{status}</span>
                                        {statusFilter === status && <div className="w-1.5 h-1.5 bg-primary rounded-full" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-primary to-primary-hover p-8 rounded-[2rem] shadow-lg shadow-primary/20 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-xs font-bold opacity-80   mb-2">Live Count</p>
                            <h4 className="text-4xl font-sans font-bold mb-6">{appointments.length}</h4>
                            <p className="text-sm font-medium opacity-90">Appointments for selected date.</p>
                        </div>
                        <CalendarIcon size={120} className="absolute -right-8 -bottom-8 opacity-10 rotate-12" />
                    </div>
                </div>

                <div className="xl:col-span-3 space-y-4">
                    {isLoading ? (
                        <div className={`p-20 flex items-center justify-center rounded-[2rem] border ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100'}`}>
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                <p className="text-slate-400 font-bold italic">Loading schedule...</p>
                            </div>
                        </div>
                    ) : filteredAppointments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <AnimatePresence>
                                {filteredAppointments.map((apt, idx) => (
                                    <motion.div
                                        key={apt.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={`p-6 rounded-[2rem] shadow-sm border transition-all group relative overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border-white/10 hover:border-primary/30' : 'bg-white border-slate-100 hover:shadow-md'}`}
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-primary font-bold text-xl shadow-inner border transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/10 group-hover:bg-primary/5' : 'bg-slate-50 border-slate-100 group-hover:bg-primary/5'}`}>
                                                    {apt.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className={`font-bold text-lg leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{apt.name}</h3>
                                                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mt-1  ">
                                                        <Clock size={12} /> {apt.time}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full   shadow-sm border ${apt.status === 'Confirmed' ? 'bg-green-50 text-green-600 border-green-100' :
                                                    apt.status === 'Finished' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                        'bg-red-50 text-red-600 border-red-100'
                                                    }`}>
                                                    {apt.status}
                                                </span>
                                            </div>
                                        </div>

                                        <div className={`flex items-center gap-3 p-4 rounded-2xl mb-6 transition-all border ${theme === 'dark' ? 'bg-white/5 border-transparent group-hover:border-white/10' : 'bg-slate-50 border-transparent group-hover:border-slate-100'}`}>
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm text-primary ${theme === 'dark' ? 'bg-white/10' : 'bg-white'}`}>
                                                <AlertCircle size={16} />
                                            </div>
                                            <p className={`text-xs font-bold line-clamp-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{apt.type} • {apt.notes || 'No notes provided'}</p>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleDetailsClick(apt)}
                                                className={`flex-1 py-3 rounded-xl text-xs font-bold shadow-sm transition-all transform active:scale-95 flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-primary text-white' : 'bg-slate-800 text-white'}`}
                                            >
                                                View Details
                                            </button>
                                            <button
                                                onClick={() => handleEditClick(apt)}
                                                className={`p-3 border rounded-xl transition-all active:scale-95 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-400 hover:text-primary hover:border-primary/30'}`}
                                            >
                                                <MoreVertical size={18} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className={`p-20 text-center rounded-[2rem] border flex flex-col items-center justify-center gap-4 ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100'}`}>
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                <CalendarIcon size={40} />
                            </div>
                            <div>
                                <h4 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>No appointments for this date</h4>
                                <p className="text-slate-400 font-medium">Try selecting another date or check filters.</p>
                            </div>
                            <button onClick={() => setSelectedDate(today)} className="text-primary font-bold text-sm hover:underline">Back to Today</button>
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="Patient Interaction Log" maxWidth="max-w-md">
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
