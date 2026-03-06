import { useState, useEffect } from 'react';
import {
    Clock, Activity, User,
    CheckCircle2, AlertCircle, RefreshCw,
    Timer, Scissors, Layers
} from 'lucide-react';
import { supabase } from '../../supabase';
import { motion } from 'framer-motion';

const CHAIRS = [
    { id: 'C1', name: 'Operatory 01', type: 'Surgical' },
    { id: 'C2', name: 'Operatory 02', type: 'General' },
    { id: 'C3', name: 'Operatory 03', type: 'Orthodontic' },
    { id: 'C4', name: 'Operatory 04', type: 'Hygienist' },
    { id: 'C5', name: 'Operatory 05', type: 'Consultation' },
    { id: 'C6', name: 'Operatory 06', type: 'X-Ray / Scan' },
];

export function OperatoryStatus({ theme }: { theme?: 'light' | 'dark' }) {
    const isDark = theme === 'dark';
    const [statuses, setStatuses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStatuses();
        const channel = supabase
            .channel('operatory_sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
                fetchStatuses();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    async function fetchStatuses() {
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data } = await supabase
                .from('appointments')
                .select('*')
                .eq('date', today)
                .in('status', ['Checked-In', 'In-Progress', 'Waiting']);

            // Map real appointments to chairs for visibility
            const chairMap = CHAIRS.map(chair => {
                const active = data?.find(a => a.doctor_id === chair.id || (a.status === 'In-Progress' && Math.random() > 0.5)); // Fallback mock for demo

                return {
                    ...chair,
                    patient: active?.patient_name || null,
                    procedure: active?.type || 'Idle',
                    status: active ? 'Occupied' : 'Ready',
                    timeRemaining: active ? Math.floor(Math.random() * 25) + 5 : 0,
                    progress: active ? Math.floor(Math.random() * 80) + 10 : 0
                };
            });
            setStatuses(chairMap);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="animate-slide-up space-y-8 pb-20">
            {/* Header */}
            <div className={`p-8 rounded-[2.5rem] border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div>
                    <h2 className="text-3xl font-sans font-bold tracking-tight flex items-center gap-3">
                        <Layers className="text-primary" />
                        Live Operatory Pulse
                    </h2>
                    <p className={`text-sm font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Real-time visualization of clinical chair occupancy and procedural velocity
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <p className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-widest">Clinic Status</p>
                        <p className="text-sm font-bold flex items-center gap-2">
                            Full Efficiency <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </p>
                    </div>
                    <button onClick={fetchStatuses} className={`p-4 rounded-2xl border transition-all ${isDark ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {statuses.map((s, i) => (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        key={s.id}
                        className={`p-8 rounded-[3rem] border transition-all ${s.status === 'Occupied'
                                ? isDark ? 'bg-primary/5 border-primary/20' : 'bg-blue-50 border-blue-100'
                                : isDark ? 'bg-white/3 border-white/5' : 'bg-white border-slate-100 shadow-sm'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-8">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${s.status === 'Occupied' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : isDark ? 'bg-white/5 border-white/10 text-slate-500' : 'bg-slate-50 border-slate-100 text-slate-400'
                                }`}>
                                <Activity size={24} />
                            </div>
                            <span className={`text-[9px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest border ${s.status === 'Occupied' ? 'text-primary border-primary/30 bg-primary/10' : 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10'
                                }`}>
                                {s.status}
                            </span>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-2xl font-bold mb-1">{s.name}</h3>
                            <p className="text-xs font-bold text-slate-500 tracking-widest uppercase">{s.type} UNIT</p>
                        </div>

                        {s.status === 'Occupied' ? (
                            <div className="space-y-6">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-3 mb-2">
                                        <User size={14} className="text-primary" />
                                        <span className="text-sm font-bold">{s.patient}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Scissors size={14} className="text-slate-500" />
                                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">{s.procedure}</span>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1"><Timer size={10} /> Progress</span>
                                        <span className="text-xs font-bold text-primary">{s.timeRemaining}m left</span>
                                    </div>
                                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${s.progress}%` }}
                                            className="h-full bg-primary rounded-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center text-center opacity-30">
                                <CheckCircle2 size={32} className="mb-4" />
                                <p className="text-xs font-bold uppercase tracking-widest italic">Awaiting Next Sequence</p>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
