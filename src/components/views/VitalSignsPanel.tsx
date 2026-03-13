import { useState, useEffect } from 'react';
import { Heart, ChevronDown, ChevronUp, Plus, AlertTriangle, Activity, Thermometer, Wind } from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';

interface VitalSignsPanelProps {
    patient: any;
    theme?: 'light' | 'dark';
}

export function VitalSignsPanel({ patient, theme }: VitalSignsPanelProps) {
    const { showToast } = useToast();
    const [collapsed, setCollapsed] = useState(false);
    const [vitals, setVitals] = useState<any[]>([]);
    const [showLogForm, setShowLogForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        bp_systolic: '',
        bp_diastolic: '',
        pulse: '',
        spo2: '',
        notes: ''
    });

    useEffect(() => {
        if (!patient?.id) return;
        fetchVitals();

        const channel = supabase.channel(`vitals-${patient.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vital_signs', filter: `patient_id=eq.${patient.id}` },
                () => fetchVitals())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [patient?.id]);

    const fetchVitals = async () => {
        const { data } = await supabase
            .from('vital_signs')
            .select('*')
            .eq('patient_id', patient.id)
            .order('recorded_at', { ascending: false })
            .limit(5);
        if (data) setVitals(data);
    };

    const handleSave = async () => {
        if (!form.bp_systolic && !form.pulse) return showToast('Please enter at least BP or Pulse', 'error');
        setSaving(true);
        const { error } = await supabase.from('vital_signs').insert({
            patient_id: patient.id,
            bp_systolic: form.bp_systolic ? parseInt(form.bp_systolic) : null,
            bp_diastolic: form.bp_diastolic ? parseInt(form.bp_diastolic) : null,
            pulse: form.pulse ? parseInt(form.pulse) : null,
            spo2: form.spo2 ? parseInt(form.spo2) : null,
            notes: form.notes,
        });
        setSaving(false);
        if (error) showToast('Failed to save vitals', 'error');
        else {
            showToast('Vitals logged', 'success');
            setShowLogForm(false);
            setForm({ bp_systolic: '', bp_diastolic: '', pulse: '', spo2: '', notes: '' });
        }
    };

    const latest = vitals[0];
    const allergies: string[] = patient?.allergies ? (typeof patient.allergies === 'string' ? patient.allergies.split(',').map((a: string) => a.trim()) : patient.allergies) : [];
    const isDark = theme === 'dark';

    const bpWarning = latest && latest.bp_systolic > 140;
    const spo2Warning = latest && latest.spo2 < 95;
    const hasWarning = bpWarning || spo2Warning;

    return (
        <div className={`rounded-[2rem] border transition-all mb-6 overflow-hidden ${hasWarning ? 'border-rose-500/50 shadow-lg shadow-rose-500/10' : isDark ? 'border-white/10' : 'border-slate-200'} ${isDark ? 'bg-slate-900/80' : 'bg-white'}`}>
            {/* Header */}
            <div
                className={`flex items-center justify-between px-5 py-3.5 cursor-pointer ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'} transition-all`}
                onClick={() => setCollapsed(!collapsed)}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasWarning ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        <Heart size={16} className={hasWarning ? 'animate-pulse' : ''} />
                    </div>
                    <div>
                        <h4 className="font-bold text-xs tracking-wide">Safety Card & Vitals</h4>
                        {latest && <p className="text-[10px] text-slate-500 font-medium">
                            BP {latest.bp_systolic}/{latest.bp_diastolic} mmHg • Pulse {latest.pulse} bpm • SpO2 {latest.spo2}%
                        </p>}
                    </div>
                    {hasWarning && (
                        <span className="flex items-center gap-1 text-[8px] font-extrabold px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full uppercase tracking-widest animate-pulse">
                            <AlertTriangle size={8} /> Alert
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowLogForm(!showLogForm); setCollapsed(false); }}
                        className="flex items-center gap-1.5 text-[9px] font-extrabold px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg uppercase tracking-widest hover:bg-primary/20 transition-all"
                    >
                        <Plus size={10} /> Log
                    </button>
                    {collapsed ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronUp size={14} className="text-slate-400" />}
                </div>
            </div>

            {!collapsed && (
                <div className={`px-8 pb-7 border-t ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                    {/* Allergy + Conditions Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
                        <div className={`p-5 rounded-2xl ${allergies.length > 0 ? 'bg-rose-500/5 border border-rose-500/20' : isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-slate-100'}`}>
                            <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-3">Known Allergies</p>
                            {allergies.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {allergies.map((a, i) => (
                                        <span key={i} className="text-[10px] font-bold px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg">{a}</span>
                                    ))}
                                </div>
                            ) : <p className="text-xs text-slate-400 italic">None recorded</p>}
                        </div>

                        <div className={`p-5 rounded-2xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-slate-100'}`}>
                            <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-3">Medical Conditions</p>
                            {patient?.medical_conditions ? (
                                <p className="text-xs font-medium text-slate-300">{patient.medical_conditions}</p>
                            ) : <p className="text-xs text-slate-400 italic">None recorded</p>}
                        </div>

                        <div className={`p-5 rounded-2xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-slate-100'}`}>
                            <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-3">Current Medications</p>
                            {patient?.current_medications ? (
                                <p className="text-xs font-medium text-slate-300">{patient.current_medications}</p>
                            ) : <p className="text-xs text-slate-400 italic">None recorded</p>}
                        </div>
                    </div>

                    {/* BP Warning Banner */}
                    {hasWarning && (
                        <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 animate-slide-up">
                            <AlertTriangle size={20} className="text-rose-400 shrink-0" />
                            <div>
                                {bpWarning && <p className="text-sm font-bold text-rose-400">⚠️ High BP detected: {latest.bp_systolic}/{latest.bp_diastolic} mmHg — hypertension management required before proceeding.</p>}
                                {spo2Warning && <p className="text-sm font-bold text-rose-400">⚠️ Low SpO2: {latest.spo2}% — monitor oxygen levels, consider postponing invasive procedures.</p>}
                            </div>
                        </div>
                    )}

                    {/* Log Form */}
                    {showLogForm && (
                        <div className={`mt-5 p-6 rounded-2xl border animate-slide-up ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-4">Log New Vitals</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase mb-2 block flex items-center gap-1"><Activity size={10} /> Systolic BP</label>
                                    <input type="number" placeholder="120" value={form.bp_systolic} onChange={e => setForm({ ...form, bp_systolic: e.target.value })}
                                        className={`w-full rounded-xl px-4 py-3 text-sm font-bold outline-none border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200'} focus:border-primary transition-all`} />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase mb-2 block">Diastolic BP</label>
                                    <input type="number" placeholder="80" value={form.bp_diastolic} onChange={e => setForm({ ...form, bp_diastolic: e.target.value })}
                                        className={`w-full rounded-xl px-4 py-3 text-sm font-bold outline-none border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200'} focus:border-primary transition-all`} />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase mb-2 block flex items-center gap-1"><Heart size={10} /> Pulse (bpm)</label>
                                    <input type="number" placeholder="72" value={form.pulse} onChange={e => setForm({ ...form, pulse: e.target.value })}
                                        className={`w-full rounded-xl px-4 py-3 text-sm font-bold outline-none border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200'} focus:border-primary transition-all`} />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase mb-2 block flex items-center gap-1"><Wind size={10} /> SpO2 (%)</label>
                                    <input type="number" placeholder="98" value={form.spo2} onChange={e => setForm({ ...form, spo2: e.target.value })}
                                        className={`w-full rounded-xl px-4 py-3 text-sm font-bold outline-none border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200'} focus:border-primary transition-all`} />
                                </div>
                            </div>
                            <textarea placeholder="Clinical notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                                className={`w-full mt-4 rounded-xl px-4 py-3 text-sm font-bold outline-none border h-20 resize-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200'} focus:border-primary transition-all`} />
                            <div className="flex gap-3 mt-4">
                                <button onClick={handleSave} disabled={saving}
                                    className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50">
                                    {saving ? <Activity size={16} className="animate-spin" /> : <Plus size={16} />}
                                    {saving ? 'Saving...' : 'Save Vitals'}
                                </button>
                                <button onClick={() => setShowLogForm(false)} className={`px-6 py-3 rounded-xl font-bold text-sm ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'} hover:opacity-70 transition-all`}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Vitals History */}
                    {vitals.length > 0 && (
                        <div className="mt-5">
                            <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-3">Recent Readings</p>
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {vitals.slice(0, 4).map((v, i) => (
                                    <div key={i} className={`shrink-0 p-4 rounded-2xl border min-w-[160px] ${i === 0 ? 'border-primary/30 bg-primary/5' : isDark ? 'border-white/5 bg-white/3' : 'border-slate-100 bg-slate-50'}`}>
                                        <p className="text-[8px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">{new Date(v.recorded_at).toLocaleDateString()}</p>
                                        <p className="text-lg font-bold">{v.bp_systolic}/{v.bp_diastolic}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">mmHg</p>
                                        <div className="flex gap-3 mt-2">
                                            {v.pulse && <p className="text-[10px] font-bold text-rose-400">♥ {v.pulse}</p>}
                                            {v.spo2 && <p className="text-[10px] font-bold text-blue-400">O₂ {v.spo2}%</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
