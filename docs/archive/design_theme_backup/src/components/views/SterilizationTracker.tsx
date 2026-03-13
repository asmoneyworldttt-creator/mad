import { useState, useEffect } from 'react';
import {
    Thermometer,
    Timer,
    Activity,
    ShieldCheck,
    AlertTriangle,
    Plus,
    ClipboardCheck,
    CheckCircle2,
    History,
    RefreshCcw
} from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';

export function SterilizationTracker({ userRole, theme }: { userRole: string; theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [logs, setLogs] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        equipment_name: 'Autoclave Apex-X1',
        cycle_number: '',
        method: 'Autoclave',
        temperature: '134',
        pressure: '2.1',
        duration_minutes: '20',
        status: 'Passed'
    });

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        const { data } = await supabase
            .from('sterilization_logs')
            .select('*')
            .order('logged_at', { ascending: false });
        if (data) setLogs(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const { error } = await supabase.from('sterilization_logs').insert({
            ...form,
            temperature: parseFloat(form.temperature),
            pressure: parseFloat(form.pressure),
            duration_minutes: parseInt(form.duration_minutes),
            expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 day expiry
        });

        if (!error) {
            showToast('Sterilization cycle logged successfully', 'success');
            setShowForm(false);
            setForm({ ...form, cycle_number: '' });
            fetchLogs();
        } else {
            showToast('Failed to log sterilization', 'error');
        }
        setIsSubmitting(false);
    };

    return (
        <div className="animate-slide-up space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Compliance & Sterilization</h2>
                    <p className={`text-sm font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Clinical grade equipment tracking and safety logs
                    </p>
                </div>
                <button onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-600/20 hover:scale-105 hover:bg-emerald-700 transition-all active:scale-95">
                    <Plus size={18} /> Log Cycle
                </button>
            </div>

            {/* Quick Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-3">
                        <CheckCircle2 size={20} />
                    </div>
                    <p className={`text-[9px] font-extrabold uppercase tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Ready for Use</p>
                    <p className="text-2xl font-bold">Safe</p>
                </div>
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">
                        <RefreshCcw size={20} />
                    </div>
                    <p className={`text-[9px] font-extrabold uppercase tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Last Cycle</p>
                    <p className="text-lg font-bold">{logs[0] ? new Date(logs[0].logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                </div>
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-3">
                        <Thermometer size={20} />
                    </div>
                    <p className={`text-[9px] font-extrabold uppercase tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Peak Temp</p>
                    <p className="text-2xl font-bold">{logs[0]?.temperature || 0}°C</p>
                </div>
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 mb-3">
                        <ShieldCheck size={20} />
                    </div>
                    <p className={`text-[9px] font-extrabold uppercase tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Expiry Warnings</p>
                    <p className="text-2xl font-bold">0</p>
                </div>
            </div>

            {showForm && (
                <div className={`p-8 rounded-[2rem] border animate-slide-up ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                        <ClipboardCheck size={20} className="text-emerald-500" />
                        Log Sterilization Cycle
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-2">Cycle/Batch #</label>
                            <input required placeholder="e.g. BATCH-202" value={form.cycle_number} onChange={e => setForm({ ...form, cycle_number: e.target.value })}
                                className={`w-full rounded-2xl px-6 py-4 font-bold border outline-none ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`} />
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-2">Method</label>
                            <select value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}
                                className={`w-full rounded-2xl px-6 py-4 font-bold border outline-none ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                                <option>Autoclave</option>
                                <option>Dry Heat</option>
                                <option>Chemical</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-2">Temp (°C)</label>
                            <input type="number" step="0.1" value={form.temperature} onChange={e => setForm({ ...form, temperature: e.target.value })}
                                className={`w-full rounded-2xl px-6 py-4 font-bold border outline-none ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`} />
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-2">Pressure (Bar)</label>
                            <input type="number" step="0.1" value={form.pressure} onChange={e => setForm({ ...form, pressure: e.target.value })}
                                className={`w-full rounded-2xl px-6 py-4 font-bold border outline-none ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`} />
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-2">Duration (Min)</label>
                            <input type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })}
                                className={`w-full rounded-2xl px-6 py-4 font-bold border outline-none ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`} />
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-2">Result</label>
                            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                                className={`w-full rounded-2xl px-6 py-4 font-bold border outline-none ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                                <option value="Passed">Passed ✅</option>
                                <option value="Failed">Failed ❌</option>
                            </select>
                        </div>
                        <div className="md:col-span-3 flex gap-3 mt-2">
                            <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-900/20 hover:bg-emerald-700 transition-all flex items-center gap-2">
                                {isSubmitting ? <Activity size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                                Confirm & Log Cycle
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className={`px-8 py-3 rounded-2xl font-bold ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <History size={16} className="text-slate-400" />
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Validation Audit Trail</h3>
                </div>
                {logs.map((log) => (
                    <div key={log.id} className={`p-6 rounded-[2rem] border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${log.status === 'Passed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                {log.status === 'Passed' ? <ShieldCheck size={24} /> : <AlertTriangle size={24} />}
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">Batch {log.cycle_number}</h4>
                                <p className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {log.method} · {new Date(log.logged_at).toLocaleDateString()} {new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 px-4">
                            <div className="text-center">
                                <p className={`text-[9px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Temp</p>
                                <p className="text-sm font-bold">{log.temperature}°C</p>
                            </div>
                            <div className="text-center">
                                <p className={`text-[9px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Pressure</p>
                                <p className="text-sm font-bold">{log.pressure} Bar</p>
                            </div>
                            <div className="text-center">
                                <p className={`text-[9px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Time</p>
                                <p className="text-sm font-bold">{log.duration_minutes}m</p>
                            </div>
                        </div>

                        <div className="text-right">
                            <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Expiry</p>
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-extrabold border ${isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                VALID UNTIL {new Date(log.expiry_date).toLocaleDateString().toUpperCase()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
