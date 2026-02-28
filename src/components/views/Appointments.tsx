import { useState, useEffect } from 'react';
import { useToast } from '../Toast';
import { Calendar as CalendarIcon, Clock, MoreVertical, Plus, History } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { supabase } from '../../supabase';

export function Appointments() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'Schedule' | 'History'>('Schedule');
    const [activeView, setActiveView] = useState('Today');
    const [statusFilter, setStatusFilter] = useState('All');
    const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);

    // Forms
    const [newAppt, setNewAppt] = useState({ date: '', time: '', name: '', doctor: 'Dr. Jenkins (Available)' });

    const [appointments, setAppointments] = useState<any[]>([]);
    const [pending, setPending] = useState<any[]>([]);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        const { data: appts } = await supabase.from('appointments').select('*');
        if (appts) setAppointments(appts);

        const { data: pends } = await supabase.from('pending_appointments').select('*');
        if (pends) setPending(pends);
    };

    const handleConfirm = async (id: string, name: string, time: string, type: string) => {
        await supabase.from('pending_appointments').delete().eq('id', id);
        await supabase.from('appointments').insert({
            id: `conf-${id}`,
            name,
            time: time.split(', ')[1] || time,
            type,
            status: 'Confirmed',
            date: 'Today'
        });
        showToast('Appointment Confirmed!', 'success');
        fetchAppointments();
    };

    const handleReject = async (id: string, name: string, time: string, type: string) => {
        await supabase.from('pending_appointments').delete().eq('id', id);
        await supabase.from('appointments').insert({
            id: `rej-${id}`,
            name,
            time: time.split(', ')[1] || time,
            type,
            status: 'Rejected',
            date: 'Today'
        });
        showToast('Appointment Rejected.', 'error');
        fetchAppointments();
    };

    const handleBookSlot = async () => {
        if (!newAppt.name || !newAppt.date || !newAppt.time) return showToast('Please fill all fields', 'error');
        await supabase.from('appointments').insert({
            id: `apt-${Date.now()}`,
            name: newAppt.name,
            time: newAppt.time,
            type: 'Consultation',
            status: 'Booked',
            date: newAppt.date
        });
        showToast('Slot booked and added to calendar.', 'success');
        setIsSlotModalOpen(false);
        fetchAppointments();
    };

    // Status change
    const updateStatus = async (id: string, status: string) => {
        await supabase.from('appointments').update({ status }).eq('id', id);
        showToast(`Status updated to ${status}`, 'success');
        fetchAppointments();
    };

    const filteredAppointments = appointments.filter(apt => {
        if (activeTab === 'Schedule') {
            if (statusFilter !== 'All' && apt.status !== statusFilter) return false;
            if (activeView === 'Today') return apt.date === 'Today' || apt.date === new Date().toISOString().split('T')[0] || !apt.date;
            if (activeView === 'Weekly') return apt.date === 'Today' || apt.date === 'Weekly' || !apt.date;
            return true; // Monthly
        } else {
            // History Tab
            if (statusFilter !== 'All') return apt.status === statusFilter;
            return true;
        }
    });

    const statusOptions = ['All', 'Pending', 'Booked', 'Confirmed', 'Engaged', 'Completed (Treatment Done)', 'Checked-Out (Patient Left)', 'Rejected'];

    return (
        <div className="animate-slide-up space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-display font-bold text-text-dark tracking-tight">Appointments</h2>
                    <p className="text-text-muted font-medium">Manage your daily schedule and upcoming bookings.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setActiveTab(activeTab === 'Schedule' ? 'History' : 'Schedule')}
                        className="bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
                    >
                        {activeTab === 'Schedule' ? <><History size={16} /> History Menu</> : <><CalendarIcon size={16} /> Active Schedule</>}
                    </button>
                    <button
                        onClick={() => setIsSlotModalOpen(true)}
                        className="bg-primary hover:bg-primary-hover text-white shadow-premium px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-transform active:scale-95"
                    >
                        <Plus size={16} /> Book Slot
                    </button>
                </div>
            </div>

            <div className={`grid grid-cols-1 ${activeTab === 'Schedule' ? 'lg:grid-cols-3' : ''} gap-6`}>
                <div className={`${activeTab === 'Schedule' ? 'lg:col-span-2' : ''} bg-surface border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[60vh]`}>
                    <div className="flex flex-wrap justify-between items-center mb-6 border-b border-slate-100 pb-4 gap-4">
                        {activeTab === 'Schedule' ? (
                            <div className="flex items-center gap-4">
                                {['Today', 'Weekly', 'Monthly'].map(view => (
                                    <button key={view} onClick={() => setActiveView(view)} className={`pb-2 transition-colors ${activeView === view ? 'font-bold text-text-dark border-b-2 border-primary' : 'font-medium text-slate-400 hover:text-slate-600'}`}>
                                        {view}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <h3 className="font-bold text-lg text-text-dark">All Bookings History</h3>
                        )}
                        <div className="flex items-center gap-3">
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="bg-slate-50 border border-slate-200 text-slate-600 font-bold text-sm rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-primary outline-none"
                            >
                                {statusOptions.map(o => <option key={o} value={o}>{o === 'All' ? 'All Statuses' : o}</option>)}
                            </select>
                            {activeTab === 'Schedule' && <div className="text-sm font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg whitespace-nowrap"><CalendarIcon size={14} className="inline mr-1" /> {activeView}</div>}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {filteredAppointments.length === 0 ? (
                            <p className="text-center text-slate-500 py-10">No appointments found matching this criteria.</p>
                        ) : filteredAppointments.map((apt) => (
                            <div key={apt.id} className={`flex items-center justify-between p-4 rounded-xl border transition-colors hover:border-slate-300 ${apt.status === 'Engaged' ? 'bg-primary/5 border-primary/20' : 'bg-slate-50 border-slate-100'}`}>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-full border border-slate-200 flex items-center justify-center font-bold text-slate-600">{apt.name.charAt(0)}</div>
                                    <div>
                                        <p className="font-bold text-text-dark">{apt.name}</p>
                                        <p className="text-xs text-slate-500 font-medium">{apt.type} • {apt.date || 'Today'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-slate-500 font-medium text-sm w-24">
                                        <Clock size={14} /> {apt.time}
                                    </div>
                                    <select
                                        value={apt.status}
                                        onChange={(e) => updateStatus(apt.id, e.target.value)}
                                        className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-md border-none cursor-pointer outline-none md:w-44 ${apt.status === 'Confirmed' ? 'bg-success/10 text-success' :
                                            apt.status === 'Pending' ? 'bg-alert/10 text-alert' :
                                                apt.status === 'Engaged' ? 'bg-primary text-white animate-pulse' :
                                                    apt.status === 'Rejected' ? 'bg-red-100 text-red-600' :
                                                        apt.status.includes('Completed') ? 'bg-purple-100 text-purple-600' :
                                                            apt.status.includes('Checked-Out') ? 'bg-blue-100 text-blue-700' :
                                                                'bg-slate-200 text-slate-600'
                                            }`}
                                    >
                                        {statusOptions.filter(o => o !== 'All').map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                    <button onClick={() => showToast(`Options for ${apt.name}`)} className="text-slate-400 hover:text-slate-600 p-2"><MoreVertical size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {activeTab === 'Schedule' && (
                    <div className="space-y-6">
                        <div className="bg-surface border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="font-display font-bold text-lg text-text-dark mb-4">Pending Confirmations</h3>
                            {pending.length === 0 ? (
                                <p className="text-sm text-slate-500">No pending requests.</p>
                            ) : pending.map(p => (
                                <div key={p.id} className="p-4 bg-alert/5 border border-alert/20 rounded-xl mb-3">
                                    <p className="font-bold text-text-dark">{p.name}</p>
                                    <p className="text-xs text-slate-500 font-medium mb-3">{p.time} • {p.type}</p>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleConfirm(p.id, p.name, p.time, p.type)} className="flex-1 py-2 bg-text-dark text-white rounded-lg text-xs font-bold hover:bg-black transition-colors">Confirm</button>
                                        <button onClick={() => handleReject(p.id, p.name, p.time, p.type)} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors">Reject</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Modal isOpen={isSlotModalOpen} onClose={() => setIsSlotModalOpen(false)} title="Block Slot / New Booking">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Date</label>
                            <input type="date" value={newAppt.date} onChange={e => setNewAppt({ ...newAppt, date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Time</label>
                            <input type="time" value={newAppt.time} onChange={e => setNewAppt({ ...newAppt, time: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Patient Name & Phone</label>
                        <input type="text" value={newAppt.name} onChange={e => setNewAppt({ ...newAppt, name: e.target.value })} placeholder="e.g. John Doe - 9876543210" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Doctor</label>
                        <select value={newAppt.doctor} onChange={e => setNewAppt({ ...newAppt, doctor: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600">
                            <option>Dr. Jenkins (Available)</option>
                            <option>Dr. Smith (Busy)</option>
                        </select>
                    </div>
                    <button onClick={handleBookSlot} className="w-full py-2 bg-primary text-white rounded-lg text-sm font-bold mt-4 shadow-premium active:scale-95 transition-transform">Confirm Slot</button>
                </div>
            </Modal>
        </div>
    );
}
