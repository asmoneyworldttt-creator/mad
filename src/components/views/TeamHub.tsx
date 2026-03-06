import { useState, useEffect } from 'react';
import { Users, Clock, CheckCircle, XCircle, Download, QrCode } from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';
import { QRCodeSVG } from 'qrcode.react';

export function TeamHub({ userRole, theme }: { userRole: string; theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [staff, setStaff] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [today] = useState(new Date().toISOString().split('T')[0]);
    const [selectedStaff, setSelectedStaff] = useState<any>(null);
    const [showQR, setShowQR] = useState(false);

    useEffect(() => {
        fetchStaff();
        fetchLogs();
        const channel = supabase.channel('attendance-live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_logs' }, () => fetchLogs())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const fetchStaff = async () => {
        const { data } = await supabase.from('staff').select('*').order('name');
        if (data) setStaff(data);
    };

    const fetchLogs = async () => {
        const { data } = await supabase
            .from('attendance_logs')
            .select('*, staff(name, role)')
            .eq('date', today)
            .order('clock_in', { ascending: false });
        if (data) setLogs(data);
    };

    const getStaffLog = (staffId: number) => logs.find(l => l.staff_id === staffId);

    const clockIn = async (staffId: number) => {
        const exists = getStaffLog(staffId);
        if (exists?.clock_in && !exists?.clock_out) return showToast('Already clocked in', 'success');
        const { error } = await supabase.from('attendance_logs').insert({
            staff_id: staffId,
            clock_in: new Date().toISOString(),
            date: today,
            method: 'manual'
        });
        if (!error) showToast('Clocked in successfully', 'success');
    };

    const clockOut = async (staffId: number) => {
        const log = getStaffLog(staffId);
        if (!log?.clock_in) return showToast('Not clocked in yet', 'error');
        const hoursWorked = ((new Date().getTime() - new Date(log.clock_in).getTime()) / 3600000).toFixed(1);
        const { error } = await supabase.from('attendance_logs')
            .update({ clock_out: new Date().toISOString(), notes: `${hoursWorked}h worked` })
            .eq('id', log.id);
        if (!error) showToast(`Clocked out — ${hoursWorked}h logged`, 'success');
    };

    const exportCSV = () => {
        const rows = [['Staff', 'Date', 'Clock In', 'Clock Out', 'Hours']];
        logs.forEach(l => {
            const hours = l.clock_out ? ((new Date(l.clock_out).getTime() - new Date(l.clock_in).getTime()) / 3600000).toFixed(1) : 'Active';
            rows.push([l.staff?.name || l.staff_id, l.date, l.clock_in ? new Date(l.clock_in).toLocaleTimeString() : '-', l.clock_out ? new Date(l.clock_out).toLocaleTimeString() : '-', hours]);
        });
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `attendance_${today}.csv`; a.click();
        showToast('Attendance CSV exported', 'success');
    };

    return (
        <div className="animate-slide-up space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Team Hub</h2>
                    <p className={`text-sm font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Staff attendance & shift management · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
                <button onClick={exportCSV} className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm ${isDark ? 'bg-white/5 hover:bg-white/10 border border-white/10' : 'bg-slate-100 hover:bg-slate-200 border border-slate-200'} transition-all`}>
                    <Download size={16} /> Export CSV
                </button>
            </div>

            {/* Who's In Today */}
            <div className={`p-8 rounded-[2rem] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                <h3 className="font-bold text-xl mb-6 flex items-center gap-3">
                    <Users size={24} className="text-primary" /> Today's Roster
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {staff.map(s => {
                        const log = getStaffLog(s.id);
                        const isClockedIn = log?.clock_in && !log?.clock_out;
                        const isDone = log?.clock_in && log?.clock_out;
                        const hoursWorked = isDone ? ((new Date(log.clock_out).getTime() - new Date(log.clock_in).getTime()) / 3600000).toFixed(1) : null;

                        return (
                            <div key={s.id} className={`p-6 rounded-2xl border flex items-center justify-between gap-4 transition-all ${isClockedIn ? 'border-emerald-500/30 bg-emerald-500/5' : isDark ? 'border-white/5 bg-white/3' : 'border-slate-100 bg-slate-50'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm ${isClockedIn ? 'bg-emerald-500/20 text-emerald-400' : isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
                                        {s.name?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{s.name}</p>
                                        <p className={`text-[10px] uppercase tracking-widest font-extrabold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{s.role}</p>
                                        {isClockedIn && <p className="text-[10px] text-emerald-500 font-bold mt-0.5">In since {new Date(log.clock_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>}
                                        {isDone && <p className="text-[10px] text-slate-400 font-bold mt-0.5">{hoursWorked}h worked today</p>}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {!isClockedIn && !isDone && (
                                        <button onClick={() => clockIn(s.id)} className="text-[10px] font-extrabold px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl uppercase tracking-widest hover:bg-emerald-500/20 transition-all">
                                            Clock In
                                        </button>
                                    )}
                                    {isClockedIn && (
                                        <button onClick={() => clockOut(s.id)} className="text-[10px] font-extrabold px-4 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl uppercase tracking-widest hover:bg-rose-500/20 transition-all">
                                            Clock Out
                                        </button>
                                    )}
                                    <button onClick={() => { setSelectedStaff(s); setShowQR(true); }}
                                        className={`text-[10px] font-extrabold px-4 py-2 rounded-xl uppercase tracking-widest transition-all ${isDark ? 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10' : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'}`}>
                                        QR Code
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className={`p-6 rounded-2xl border text-center ${isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'}`}>
                    <p className="text-2xl font-bold text-emerald-500">{logs.filter(l => l.clock_in && !l.clock_out).length}</p>
                    <p className="text-xs font-extrabold text-emerald-500/70 uppercase tracking-widest mt-1">Clocked In</p>
                </div>
                <div className={`p-6 rounded-2xl border text-center ${isDark ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-100'}`}>
                    <p className="text-2xl font-bold text-amber-500">{staff.length - logs.length}</p>
                    <p className="text-xs font-extrabold text-amber-500/70 uppercase tracking-widest mt-1">Not Yet In</p>
                </div>
                <div className={`p-6 rounded-2xl border text-center ${isDark ? 'bg-slate-900 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                    <p className="text-2xl font-bold">{logs.filter(l => l.clock_out).length}</p>
                    <p className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mt-1">Clocked Out</p>
                </div>
            </div>

            {/* QR Code Modal */}
            {showQR && selectedStaff && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowQR(false)}>
                    <div className={`p-10 rounded-[2.5rem] border shadow-2xl text-center ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`} onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-xl mb-2">{selectedStaff.name}</h3>
                        <p className={`text-xs uppercase tracking-widest font-extrabold mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Kiosk Check-In QR Code</p>
                        <div className="bg-white p-4 rounded-2xl inline-block">
                            <QRCodeSVG value={`dentora-checkin:${selectedStaff.id}:${selectedStaff.name}`} size={200} />
                        </div>
                        <p className="text-xs text-slate-400 font-medium mt-4">Scan at kiosk terminal to auto clock-in</p>
                        <button onClick={() => setShowQR(false)} className="mt-6 px-8 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}
