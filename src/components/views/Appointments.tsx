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
    Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Appointments() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const { showToast } = useToast();

    // Form State for Add/Edit
    const [formData, setFormData] = useState({
        name: '',
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        type: 'Consultation',
        purpose: '',
        status: 'Confirmed'
    });

    useEffect(() => {
        fetchAppointments();
    }, [currentMonth, statusFilter]);

    const fetchAppointments = async () => {
        setIsLoading(true);
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString();
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString();

        let query = supabase
            .from('appointments')
            .select('*')
            .gte('date', startOfMonth.split('T')[0])
            .lte('date', endOfMonth.split('T')[0])
            .order('date', { ascending: true })
            .order('time', { ascending: true });

        if (statusFilter !== 'All') {
            query = query.eq('status', statusFilter);
        }

        const { data } = await query;
        if (data) setAppointments(data);
        setIsLoading(false);
    };

    const handleSaveAppointment = async () => {
        if (!formData.name) return showToast('Patient name is required', 'error');

        const payload = {
            name: formData.name,
            time: formData.time,
            type: formData.type,
            status: formData.status,
            date: formData.date,
            notes: formData.purpose
        };

        const { error } = isEditModalOpen
            ? await supabase.from('appointments').update(payload).eq('id', selectedAppointment.id)
            : await supabase.from('appointments').insert(payload);

        if (error) {
            showToast('Error saving appointment', 'error');
        } else {
            showToast(`Appointment ${isEditModalOpen ? 'updated' : 'added'} successfully!`, 'success');
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
            fetchAppointments();
        }
    };

    const handleDeleteAppointment = async (id: number) => {
        if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
        const { error } = await supabase.from('appointments').delete().eq('id', id);
        if (error) {
            showToast('Error cancelling appointment', 'error');
        } else {
            showToast('Appointment cancelled successfully', 'success');
            fetchAppointments();
        }
    };

    const handleEditClick = (apt: any) => {
        setSelectedAppointment(apt);
        setFormData({
            name: apt.name,
            date: apt.date,
            time: apt.time,
            type: apt.type,
            purpose: apt.notes || '',
            status: apt.status
        });
        setIsEditModalOpen(true);
    };

    const handleDetailsClick = (apt: any) => {
        setSelectedAppointment(apt);
        setIsDetailsModalOpen(true);
    };

    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

    const filteredAppointments = appointments.filter(apt =>
        apt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="animate-slide-up space-y-6 pb-20">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-3xl font-display font-bold text-text-dark tracking-tight">Appointment Scheduler</h2>
                    <p className="text-slate-500 font-medium mt-1">Manage patient bookings and clinic occupancy in real-time.</p>
                </div>
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-80">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Find appointment..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:bg-white transition-all shadow-inner"
                        />
                    </div>
                    <button
                        onClick={() => {
                            setFormData({
                                name: '',
                                date: new Date().toISOString().split('T')[0],
                                time: '10:00',
                                type: 'Consultation',
                                purpose: '',
                                status: 'Confirmed'
                            });
                            setIsAddModalOpen(true);
                        }}
                        className="bg-primary hover:bg-primary-hover text-white shadow-premium shadow-primary/20 px-6 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <Plus size={20} /> <span className="hidden sm:inline">Book New Appointment</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Left Panel: Calendar & Filters */}
                <div className="xl:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <CalendarIcon size={18} className="text-primary" />
                                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </h3>
                            <div className="flex gap-1">
                                <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-primary"><ChevronLeft size={18} /></button>
                                <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-primary"><ChevronRight size={18} /></button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Filter by Status</p>
                            <div className="grid grid-cols-1 gap-2">
                                {['All', 'Confirmed', 'Visited', 'Cancelled', 'Missed'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${statusFilter === status ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-slate-50 text-slate-600 border border-transparent hover:bg-slate-100'}`}
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
                            <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-2">Daily Summary</p>
                            <h4 className="text-4xl font-display font-bold mb-6">{appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length}</h4>
                            <p className="text-sm font-medium opacity-90">Appointments scheduled for today.</p>
                        </div>
                        <CalendarIcon size={120} className="absolute -right-8 -bottom-8 opacity-10 rotate-12" />
                    </div>
                </div>

                {/* Right Panel: Appointments List */}
                <div className="xl:col-span-3 space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-20 bg-white rounded-[2rem] border border-slate-100">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                <p className="text-slate-400 font-bold italic">Loading your schedule...</p>
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
                                        className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-all group relative overflow-hidden"
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-primary font-bold text-xl shadow-inner border border-slate-100 group-hover:bg-primary/5 transition-colors">
                                                    {apt.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-800 text-lg leading-tight">{apt.name}</h3>
                                                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mt-1 uppercase tracking-tighter">
                                                        <Clock size={12} /> {apt.time}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm border ${apt.status === 'Confirmed' ? 'bg-green-50 text-green-600 border-green-100' :
                                                    apt.status === 'Visited' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                        'bg-red-50 text-red-600 border-red-100'
                                                    }`}>
                                                    {apt.status}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                                    {apt.date}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl mb-6 group-hover:bg-white border border-transparent group-hover:border-slate-100 transition-all">
                                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-primary">
                                                <AlertCircle size={16} />
                                            </div>
                                            <p className="text-xs font-bold text-slate-600 line-clamp-1">{apt.type} • {apt.notes || 'No notes provided'}</p>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleDetailsClick(apt)}
                                                className="flex-1 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all transform active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                View Details
                                            </button>
                                            <button
                                                onClick={() => handleEditClick(apt)}
                                                className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary/30 rounded-xl transition-all active:scale-95"
                                            >
                                                <MoreVertical size={18} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="p-20 text-center bg-white rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center gap-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                <CalendarIcon size={40} />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-slate-700">No appointments found</h4>
                                <p className="text-slate-400 font-medium">Try changing the filters or the month view.</p>
                            </div>
                            <button onClick={prevMonth} className="text-primary font-bold text-sm hover:underline">View previous month</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <Modal isOpen={isAddModalOpen || isEditModalOpen} onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} title={isEditModalOpen ? "Edit Appointment" : "Schedule New Appointment"} maxWidth="max-w-xl">
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">Patient Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="Full name..."
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">Date & Time</label>
                                <div className="flex gap-3">
                                    <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-primary outline-none transition-all" />
                                    <input type="time" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} className="w-32 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-primary outline-none transition-all" />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">Appointment Type</label>
                                <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-primary outline-none transition-all">
                                    <option>Consultation</option>
                                    <option>Follow-up</option>
                                    <option>Procedure</option>
                                    <option>Surgery</option>
                                    <option>Emergency</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">Status</label>
                                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-primary outline-none transition-all">
                                    <option>Confirmed</option>
                                    <option>Visited</option>
                                    <option>Cancelled</option>
                                    <option>Missed</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">Clinical Notes / Purpose</label>
                        <textarea rows={4} value={formData.purpose} onChange={e => setFormData({ ...formData, purpose: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all" placeholder="Enter clinical notes or reason for visit..."></textarea>
                    </div>
                    <div className="flex gap-4 pt-4 border-t border-slate-100">
                        <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all active:scale-95">Cancel</button>
                        <button onClick={handleSaveAppointment} className="flex-1 py-3.5 rounded-2xl bg-primary text-white font-bold hover:bg-primary-hover shadow-premium shadow-primary/20 transition-all active:scale-95 uppercase tracking-widest text-xs">
                            {isEditModalOpen ? 'Update Appointment' : 'Confirm Booking'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Details Modal */}
            <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="Appointment Information" maxWidth="max-w-md">
                {selectedAppointment && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary text-2xl font-bold">
                                {selectedAppointment.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-xl text-slate-800">{selectedAppointment.name}</h3>
                                <p className="text-sm font-bold text-primary">ID: {selectedAppointment.id}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date</p>
                                <p className="text-sm font-bold text-slate-700">{selectedAppointment.date}</p>
                            </div>
                            <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Time</p>
                                <p className="text-sm font-bold text-slate-700">{selectedAppointment.time}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                <span className="text-sm font-bold text-slate-500">Type</span>
                                <span className="text-sm font-bold text-slate-800">{selectedAppointment.type}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                <span className="text-sm font-bold text-slate-500">Status</span>
                                <span className="text-[10px] font-extrabold px-3 py-1 bg-primary/10 text-primary rounded-full uppercase">{selectedAppointment.status}</span>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Notes</p>
                            <p className="text-sm font-medium text-slate-600 italic">"{selectedAppointment.notes || 'No clinical notes provided'}"</p>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button onClick={() => { setIsDetailsModalOpen(false); handleEditClick(selectedAppointment); }} className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-md">edit</span> Edit Record
                            </button>
                            <button onClick={() => { setIsDetailsModalOpen(false); handleDeleteAppointment(selectedAppointment.id); }} className="px-4 py-3 bg-red-50 text-red-500 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all">
                                <span className="material-symbols-outlined text-md">delete</span>
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
