import { useState, useEffect, useMemo } from 'react';
import { 
    Users, Clock, CheckCircle, XCircle, Download, QrCode, 
    Coffee, Play, FileText, Table, Calendar, ChevronRight,
    Search, Filter, UserCog, History, TrendingUp, AlertCircle
} from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ROLES = ['All', 'Doctor', 'Practice Manager', 'Nurse', 'Receptionist', 'Hygienist'];

export function TeamHub({ userRole, theme }: { userRole: string; theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [view, setView] = useState<'roster' | 'history'>('roster');
    const [staff, setStaff] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [today] = useState(new Date().toISOString().split('T')[0]);
    const [selectedRole, setSelectedRole] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStaff, setSelectedStaff] = useState<any>(null);
    const [showQR, setShowQR] = useState(false);
    const [showStaffDetails, setShowStaffDetails] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [clockingId, setClockingId] = useState<number | null>(null);
    const [stats, setStats] = useState<any>({ total_days: 0, total_hours: 0, total_leaves: 0 });

    useEffect(() => {
        fetchStaff();
        fetchLogs();
        if (view === 'history') fetchHistory();

        const channel = supabase.channel('attendance-live-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_logs' }, () => {
                fetchLogs();
                if (view === 'history') fetchHistory();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [view]);

    useEffect(() => {
        if (showStaffDetails) {
            fetchStaffStats(showStaffDetails.id);
        }
    }, [showStaffDetails]);

    const fetchStaffStats = async (staffId: string | number) => {
        const { data: logsData } = await supabase
            .from('attendance_logs')
            .select('working_hours')
            .eq('staff_id', staffId)
            .not('clock_out', 'is', null);

        const { count: leaveCount } = await supabase
            .from('staff_leaves')
            .select('*', { count: 'exact' })
            .eq('staff_id', staffId);

        const totalHours = logsData?.reduce((acc, curr) => acc + Number(curr.working_hours || 0), 0) || 0;
        setStats({
            total_days: logsData?.length || 0,
            total_hours: totalHours.toFixed(1),
            total_leaves: leaveCount || 0
        });
    };

    const fetchStaff = async () => {
        const { data } = await supabase.from('staff').select('*').order('name');
        if (data) setStaff(data);
    };

    const fetchLogs = async () => {
        const { data } = await supabase
            .from('attendance_logs')
            .select('*, staff(name, role, staff_external_id)')
            .eq('date', today)
            .order('clock_in', { ascending: false });
        if (data) setLogs(data);
    };

    const fetchHistory = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('attendance_logs')
            .select('*, staff(name, role, staff_external_id)')
            .order('date', { ascending: false })
            .limit(100);
        if (data) setHistory(data);
        setLoading(false);
    };

    const getStaffLog = (staffId: number) => logs.find(l => l.staff_id === staffId);

    const handleCheckIn = async (staffId: number) => {
        setClockingId(staffId);
        const { error } = await supabase.from('attendance_logs').insert({
            staff_id: staffId,
            clock_in: new Date().toISOString(),
            date: today,
            status: 'Checked-in',
            method: 'manual'
        });
        if (!error) {
            showToast('Shift started successfully', 'success');
            fetchLogs();
        } else {
            showToast('Check-in failed', 'error');
        }
        setClockingId(null);
    };

    const handleCheckOut = async (logId: string, staffId: number) => {
        setClockingId(staffId);
        const now = new Date();
        const { error } = await supabase.from('attendance_logs')
            .update({ 
                clock_out: now.toISOString(),
                status: 'Checked-out'
            })
            .eq('id', logId);
        
        if (!error) {
            showToast('Shift ended and recorded', 'success');
            fetchLogs();
        }
        setClockingId(null);
    };

    const handleToggleBreak = async (log: any) => {
        setClockingId(log.staff_id);
        const now = new Date().toISOString();
        const isOnBreak = log.status === 'On Break';
        
        let update: any = {};
        if (!isOnBreak) {
            update = { status: 'On Break', break_start: now };
        } else {
            const start = new Date(log.break_start).getTime();
            const end = new Date(now).getTime();
            const additionalMinutes = Math.round((end - start) / 60000);
            update = { 
                status: 'Checked-in', 
                break_end: now,
                total_break_minutes: (log.total_break_minutes || 0) + additionalMinutes
            };
        }

        const { error } = await supabase.from('attendance_logs')
            .update(update)
            .eq('id', log.id);

        if (!error) {
            showToast(isOnBreak ? 'Break ended' : 'On break', 'info');
            fetchLogs();
        }
        setClockingId(null);
    };

    const filteredStaff = useMemo(() => {
        return staff.filter(s => {
            const matchesRole = selectedRole === 'All' || s.role === selectedRole;
            const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                (s.staff_external_id || '').toLowerCase().includes(searchQuery.toLowerCase());
            return matchesRole && matchesSearch;
        });
    }, [staff, selectedRole, searchQuery]);

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text('Staff Attendance Report', 14, 22);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

        const tableData = (view === 'history' ? history : logs).map(l => [
            l.staff?.name || 'Unknown',
            l.staff?.staff_external_id || '-',
            l.date,
            l.clock_in ? new Date(l.clock_in).toLocaleTimeString() : '-',
            l.clock_out ? new Date(l.clock_out).toLocaleTimeString() : 'Active',
            `${l.total_break_minutes || 0}m`,
            l.working_hours ? `${l.working_hours}h` : '-'
        ]);

        autoTable(doc, {
            startY: 35,
            head: [['Staff Name', 'ID', 'Date', 'Check-in', 'Check-out', 'Break', 'Total Hours']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: '#135bec', textColor: 255 }
        });

        doc.save(`Attendance_Report_${today}.pdf`);
        showToast('PDF Report Downloaded', 'success');
    };

    const exportToExcel = () => {
        const headers = ['Staff Name', 'Staff ID', 'Date', 'Check-in', 'Check-out', 'Break Minutes', 'Total Working Hours', 'Status'];
        const dataRows = (view === 'history' ? history : logs).map(l => [
            l.staff?.name,
            l.staff?.staff_external_id,
            l.date,
            l.clock_in ? new Date(l.clock_in).toISOString() : '',
            l.clock_out ? new Date(l.clock_out).toISOString() : '',
            l.total_break_minutes || 0,
            l.working_hours || 0,
            l.status
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + dataRows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Attendance_Export_${today}.csv`);
        document.body.appendChild(link);
        link.click();
        showToast('CSV Exported for Excel', 'success');
    };

    return (
        <div className="animate-slide-up space-y-6 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-dark)' }}>Team Management</h2>
                    <div className="flex items-center gap-3 mt-1.5">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest border border-emerald-500/20">
                            <Users size={10} /> {staff.length} Members
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-widest border border-primary/20">
                            <Clock size={10} /> Active Now: {logs.filter(l => l.status === 'Checked-in').length}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => setView(view === 'roster' ? 'history' : 'roster')}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs transition-all border shadow-sm ${view === 'history' ? 'bg-primary text-white border-primary shadow-primary/20' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'}`}>
                        {view === 'history' ? <Users size={16} /> : <History size={16} />}
                        {view === 'history' ? 'Live Roster' : 'Attendance History'}
                    </button>
                    <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                        <button onClick={exportToPDF} title="Export PDF" className="p-2.5 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-all text-rose-500"><FileText size={18} /></button>
                        <button onClick={exportToExcel} title="Export Excel" className="p-2.5 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-all text-emerald-500"><Table size={18} /></button>
                    </div>
                </div>
            </div>

            {/* View Navigation & Filters */}
            {view === 'roster' && (
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                        {ROLES.map(role => (
                            <button key={role} onClick={() => setSelectedRole(role)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${selectedRole === role ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/10 hover:border-primary/50'}`}>
                                {role}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-64">
                        <input 
                            type="text" placeholder="Search staff or ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-10 py-3 text-sm font-medium outline-none focus:border-primary active:scale-[0.98] transition-all"
                        />
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                </div>
            )}

            {/* Main Roster View */}
            {view === 'roster' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredStaff.map(s => {
                        const log = getStaffLog(s.id);
                        const status = log?.status || 'Offline';
                        const isClockedIn = status === 'Checked-in';
                        const isOnBreak = status === 'On Break';
                        const isOut = status === 'Checked-out';
                        const isBusy = isClockedIn || isOnBreak;

                        return (
                            <div key={s.id} 
                                className={`p-6 rounded-[2.5rem] border flex flex-col justify-between gap-6 transition-all duration-300 relative group overflow-hidden ${isBusy ? 'border-primary/20 shadow-xl shadow-primary/5' : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-white/10'}`}
                                style={isBusy ? { background: isDark ? 'rgba(19,91,236,0.05)' : 'rgba(19,91,236,0.02)' } : {}}>
                                
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl transition-all shadow-inner ${isBusy ? 'bg-primary text-white rotate-3 scale-105' : 'bg-slate-100 dark:bg-white/5 text-primary'}`}>
                                            {s.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-base flex items-center gap-2">
                                                {s.name}
                                                <button onClick={() => { setSelectedStaff(s); setShowQR(true); }} className="text-slate-300 hover:text-primary transition-all"><QrCode size={14} /></button>
                                            </h4>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.role} • {s.staff_external_id || `#${s.id}`}</p>
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${isClockedIn ? 'bg-emerald-500 animate-pulse' : isOnBreak ? 'bg-amber-500' : 'bg-slate-300'}`}></span>
                                                <span className={`text-[10px] font-bold ${isClockedIn ? 'text-emerald-500' : isOnBreak ? 'text-amber-500' : 'text-slate-400'}`}>{status}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowStaffDetails(s)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"><ChevronRight size={18} /></button>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {!isBusy ? (
                                        <button onClick={() => handleCheckIn(s.id)} disabled={clockingId === s.id}
                                            className="col-span-2 py-4 bg-emerald-500 text-white rounded-2xl text-xs font-bold hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                                            {clockingId === s.id ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Play size={14} fill="currentColor" />}
                                            Start Shift
                                        </button>
                                    ) : (
                                        <>
                                            <button onClick={() => handleToggleBreak(log)} disabled={clockingId === s.id}
                                                className={`py-4 rounded-2xl text-xs font-bold hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 border ${isOnBreak ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' : 'bg-white dark:bg-white/5 text-amber-600 border-amber-200 dark:border-amber-500/20'}`}>
                                                <Coffee size={14} />
                                                {isOnBreak ? 'End Break' : 'Break'}
                                            </button>
                                            <button onClick={() => handleCheckOut(log.id, s.id)} disabled={clockingId === s.id || isOnBreak}
                                                className="py-4 bg-rose-500 text-white rounded-2xl text-xs font-bold hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 disabled:opacity-50">
                                                <XCircle size={14} />
                                                End Shift
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* History View Table */}
            {view === 'history' && (
                <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                        <h3 className="font-bold text-lg">Detailed Attendance Log</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 italic">Showing last 100 entries</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-white/5">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Employee</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Date</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Shift Window</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Breaks</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Work Hours</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {loading ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 animate-pulse">Synchronizing records...</td></tr>
                                ) : history.map(l => (
                                    <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">{l.staff?.name?.charAt(0)}</div>
                                                <div>
                                                    <p className="text-sm font-bold">{l.staff?.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-500">{l.staff?.role} • {l.staff?.staff_external_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium">{new Date(l.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold flex items-center gap-2">
                                                {l.clock_in ? new Date(l.clock_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}
                                                <ChevronRight size={12} className="text-slate-300" />
                                                {l.clock_out ? new Date(l.clock_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Active'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg">{l.total_break_minutes || 0}m</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-black text-primary">
                                            {l.working_hours ? `${l.working_hours} h` : '--'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${l.status === 'Checked-in' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                                {l.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Attendance Analytics Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-6 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10 flex flex-col justify-between h-32">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Present</p>
                    <div className="flex items-end justify-between">
                        <h5 className="text-4xl font-sans font-black text-emerald-600">{logs.length}</h5>
                        <TrendingUp size={24} className="text-emerald-500/30" />
                    </div>
                </div>
                <div className="p-6 rounded-[2rem] bg-rose-500/5 border border-rose-500/10 flex flex-col justify-between h-32">
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Absent</p>
                    <div className="flex items-end justify-between">
                        <h5 className="text-4xl font-sans font-black text-rose-600">{Math.max(0, staff.length - logs.length)}</h5>
                        <AlertCircle size={24} className="text-rose-500/30" />
                    </div>
                </div>
                <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10 flex flex-col justify-between h-32">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Avg. Shift</p>
                    <div className="flex items-end justify-between">
                        <h5 className="text-4xl font-sans font-black text-primary">8.5h</h5>
                        <Clock size={24} className="text-primary/30" />
                    </div>
                </div>
                <div className="p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 flex flex-col justify-between h-32">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Total Ops</p>
                    <div className="flex items-end justify-between">
                        <h5 className="text-4xl font-sans font-black text-amber-600">{staff.filter(s => s.role === 'Doctor').length}</h5>
                        <UserCog size={24} className="text-amber-500/30" />
                    </div>
                </div>
            </div>

            {/* QR Code Modal */}
            {showQR && selectedStaff && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onClick={() => setShowQR(false)}>
                    <div className={`p-10 rounded-[3rem] border shadow-2xl text-center max-w-sm w-full animate-slide-up ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`} onClick={e => e.stopPropagation()}>
                        <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
                            <Users size={40} />
                        </div>
                        <h3 className="font-bold text-xl mb-1">{selectedStaff.name}</h3>
                        <p className={`text-xs font-bold mb-8 uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{selectedStaff.role}</p>
                        
                        <div className="bg-white p-6 rounded-[2rem] inline-block shadow-premium border-4 border-primary/20">
                            <QRCodeSVG value={`DENTORA-ID:${selectedStaff.staff_external_id}`} size={180} />
                        </div>
                        
                        <div className="mt-8 space-y-2">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unique Digital ID</p>
                             <h4 className="text-lg font-black text-primary font-mono">{selectedStaff.staff_external_id}</h4>
                        </div>

                        <div className="flex gap-3 mt-10">
                            <button onClick={async () => {
                                const svg = document.querySelector('.qr-container svg') as SVGGraphicsElement;
                                if (svg) {
                                    const svgData = new XMLSerializer().serializeToString(svg);
                                    const canvas = document.createElement("canvas");
                                    const svgSize = svg.getBoundingClientRect();
                                    canvas.width = 500;
                                    canvas.height = 500;
                                    const ctx = canvas.getContext("2d");
                                    const img = new Image();
                                    img.onload = () => {
                                        ctx?.drawImage(img, 0, 0, 500, 500);
                                        const pngFile = canvas.toDataURL("image/png");
                                        const downloadLink = document.createElement("a");
                                        downloadLink.download = `QR_${selectedStaff.name.replace(/\s+/g, '_')}.png`;
                                        downloadLink.href = `${pngFile}`;
                                        downloadLink.click();
                                    };
                                    img.src = "data:image/svg+xml;base64," + btoa(svgData);
                                }
                            }} className="flex-1 py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2">
                                <Download size={14} /> Save QR
                            </button>
                            <button onClick={() => setShowQR(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 active:scale-95 transition-all">Dismiss</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Staff Detailed View Modal */}
            {showStaffDetails && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md p-4" onClick={() => setShowStaffDetails(null)}>
                    <div className={`p-10 rounded-[3.5rem] border shadow-2xl max-w-2xl w-full animate-slide-up overflow-hidden ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-10">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-[2rem] bg-primary text-white flex items-center justify-center font-bold text-3xl">
                                    {showStaffDetails.name?.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold">{showStaffDetails.name}</h3>
                                    <p className="text-sm font-bold text-primary">{showStaffDetails.role}</p>
                                    <p className="text-xs text-slate-400 font-medium mt-1">Hired on: {new Date(showStaffDetails.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff Index</p>
                                <p className="text-lg font-mono font-black text-primary">{showStaffDetails.staff_external_id}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-10">
                            <div className="p-5 bg-slate-100 dark:bg-white/5 rounded-3xl text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Days</p>
                                <p className="text-xl font-black">{stats.total_days}</p>
                            </div>
                            <div className="p-5 bg-slate-100 dark:bg-white/5 rounded-3xl text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Hours</p>
                                <p className="text-xl font-black">{stats.total_hours}</p>
                            </div>
                            <div className="p-5 bg-slate-100 dark:bg-white/5 rounded-3xl text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">On Leaves</p>
                                <p className="text-xl font-black text-rose-500">{stats.total_leaves}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Professional Stats</p>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/3 rounded-2xl border border-black/5">
                                    <span className="text-xs font-bold text-slate-500">Attendance Rate</span>
                                    <span className="text-sm font-black text-emerald-500 text-right">98%</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/3 rounded-2xl border border-black/5">
                                    <span className="text-xs font-bold text-slate-500">Punctuality Score</span>
                                    <span className="text-sm font-black text-primary text-right">A+ (9.4/10)</span>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => setShowStaffDetails(null)} className="mt-10 w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover shadow-xl shadow-primary/30 transition-all">Close Profile View</button>
                    </div>
                </div>
            )}
        </div>
    );
}
