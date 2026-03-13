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
    const [clockingId, setClockingId] = useState<number | null>(null);

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
        setClockingId(staffId);
        const { error } = await supabase.from('attendance_logs').insert({
            staff_id: staffId,
            clock_in: new Date().toISOString(),
            date: today,
            method: 'manual'
        });
        if (!error) { showToast('Clocked in successfully', 'success'); fetchLogs(); }
        setClockingId(null);
    };

    const clockOut = async (staffId: number) => {
        const log = getStaffLog(staffId);
        if (!log?.clock_in) return showToast('Not clocked in yet', 'error');
        setClockingId(staffId);
        const hoursWorked = ((new Date().getTime() - new Date(log.clock_in).getTime()) / 3600000).toFixed(1);
        const { error } = await supabase.from('attendance_logs')
            .update({ clock_out: new Date().toISOString(), notes: `${hoursWorked}h worked` })
            .eq('id', log.id);
        if (!error) { showToast(`Clocked out — ${hoursWorked}h logged`, 'success'); fetchLogs(); }
        setClockingId(null);
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
        <div className="animate-slide-up space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className={`text-xl font-bold tracking-tight`} style={{ color: 'var(--text-dark)' }}>Team Operations</h2>
                    <p className="text-[10px] font-bold mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Staff attendance • Performance metrics • Duty roster
                    </p>
                </div>
                <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <Download size={14} /> Export
                </button>
            </div>

            {/* Who's In Today */}
                <div className="p-6 rounded-2xl border shadow-lg" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                <h3 className={`font-black text-sm mb-6 flex items-center gap-2`} style={{ color: 'var(--text-dark)' }}>
                    <Users size={18} className="text-primary" /> Active Personnel
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {staff.map(s => {
                        const log = getStaffLog(s.id);
                        const isClockedIn = log?.clock_in && !log?.clock_out;
                        const isDone = log?.clock_in && log?.clock_out;
                        const hoursWorked = isDone ? ((new Date(log.clock_out).getTime() - new Date(log.clock_in).getTime()) / 3600000).toFixed(1) : null;

                        return (
                            <div key={s.id} 
                                className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all duration-300 relative group overflow-hidden ${isClockedIn ? 'border-emerald-500/20 shadow-lg shadow-emerald-500/5' : ''}`}
                                style={{ background: isClockedIn ? 'var(--primary-soft)' : 'var(--card-bg-alt)', borderColor: isClockedIn ? 'rgba(16,185,129,0.15)' : 'var(--border-color)' }}>
                                {isClockedIn && <div className="absolute top-0 right-0 p-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /></div>}
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs transition-transform group-hover:scale-110`}
                                        style={{ background: isClockedIn ? 'rgba(16,185,129,0.15)' : 'var(--primary-soft)', color: isClockedIn ? '#10b981' : 'var(--primary)' }}>
                                        {s.name?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-xs" style={{ color: 'var(--text-dark)' }}>{s.name}</p>
                                        <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{s.role}</p>
                                        {isClockedIn && <p className="text-[8px] text-emerald-500 font-bold mt-1 flex items-center gap-1"><Clock size={10}/> {new Date(log.clock_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>}
                                        {isDone && <p className="text-[8px] font-black uppercase tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>{hoursWorked}H LOGGED</p>}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5 relative z-10 transition-all opacity-90 group-hover:opacity-100">
                                    {!isClockedIn && !isDone && (
                                        <button
                                            onClick={() => clockIn(s.id)}
                                            disabled={clockingId === s.id}
                                            className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-60 flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                                        >
                                            {clockingId === s.id ? <div className="w-2 h-2 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <CheckCircle size={10} />}
                                            Clock In
                                        </button>
                                    )}
                                    {isClockedIn && (
                                        <button
                                            onClick={() => clockOut(s.id)}
                                            disabled={clockingId === s.id}
                                            className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-60 flex items-center gap-1.5 shadow-lg shadow-rose-500/20"
                                        >
                                            {clockingId === s.id ? <div className="w-2 h-2 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <XCircle size={10} />}
                                            Clock Out
                                        </button>
                                    )}
                                    <button onClick={() => { setSelectedStaff(s); setShowQR(true); }}
                                        className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border`}
                                        style={{ background: 'var(--card-bg)', color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}>
                                        View ID
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div className="p-5 rounded-2xl border text-center shadow-lg transition-all hover:scale-[1.02]" style={{ background: 'var(--card-bg-alt)', borderColor: 'rgba(16,185,129,0.15)' }}>
                    <p className="text-xl font-black text-emerald-500">{logs.filter(l => l.clock_in && !l.clock_out).length}</p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500/70 mt-0.5">Clocked In</p>
                </div>
                <div className="p-5 rounded-2xl border text-center shadow-lg transition-all hover:scale-[1.02]" style={{ background: 'var(--card-bg-alt)', borderColor: 'rgba(245,158,11,0.15)' }}>
                    <p className="text-xl font-black text-amber-500">{staff.length - logs.length}</p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-amber-500/70 mt-0.5">Absent</p>
                </div>
                <div className="p-5 rounded-2xl border text-center shadow-lg transition-all hover:scale-[1.02]" style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)' }}>
                    <p className="text-xl font-black" style={{ color: 'var(--text-dark)' }}>{logs.filter(l => l.clock_out).length}</p>
                    <p className="text-[8px] font-black uppercase tracking-widest mt-0.5" style={{ color: 'var(--text-muted)' }}>Clocked Out</p>
                </div>
            </div>

            {showQR && selectedStaff && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowQR(false)}>
                    <div className={`p-8 rounded-3xl border shadow-2xl text-center max-w-sm w-full ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`} onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-lg mb-1">{selectedStaff.name}</h3>
                        <p className={`text-[9px] uppercase tracking-widest font-black mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>IDENTIFICATION TOKEN</p>
                        <div className="bg-white p-3 rounded-xl inline-block shadow-inner border">
                            <QRCodeSVG value={`dentora-checkin:${selectedStaff.id}:${selectedStaff.name}`} size={160} />
                        </div>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-6">Scan for auto-identification</p>
                        <button onClick={() => setShowQR(false)} className="mt-6 w-full py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}
