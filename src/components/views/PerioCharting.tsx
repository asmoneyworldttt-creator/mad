import { useState } from 'react';
import {
    Activity, ArrowRight, Save,
    TrendingUp, AlertCircle, History,
    CheckCircle2, Plus, ArrowLeft
} from 'lucide-react';
import { motion } from 'framer-motion';

export function PerioCharting({ theme, patientId }: { theme?: 'light' | 'dark', patientId?: string }) {
    const isDark = theme === 'dark';
    const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
    const [measurements, setMeasurements] = useState<Record<number, any>>({});
    const [activeView, setActiveView] = useState<'chart' | 'trends'>('chart');

    const TOOTH_NUMBERS = Array.from({ length: 32 }, (_, i) => i + 1);

    const updateMeasurement = (num: number, field: string, value: string) => {
        setMeasurements(prev => ({
            ...prev,
            [num]: { ...prev[num], [field]: value }
        }));
    };

    return (
        <div className="animate-slide-up space-y-8 pb-20">
            {/* Header */}
            <div className={`p-8 rounded-[2.5rem] border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div>
                    <h2 className="text-3xl font-sans font-bold tracking-tight flex items-center gap-3">
                        <TrendingUp className="text-primary" />
                        Perio-Diagnostic Engine
                    </h2>
                    <p className={`text-sm font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Tracking gingival biotypes and periodontal attachment levels over time
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`flex items-center p-1 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                        <button
                            onClick={() => setActiveView('chart')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeView === 'chart' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}
                        >
                            Active Chart
                        </button>
                        <button
                            onClick={() => setActiveView('trends')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeView === 'trends' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}
                        >
                            Historical Trends
                        </button>
                    </div>
                    <button className="bg-primary text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 flex items-center gap-2 hover:scale-105 transition-all text-sm">
                        <Save size={18} /> Commit Record
                    </button>
                </div>
            </div>

            {activeView === 'chart' ? (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Tooth Grid */}
                    <div className={`lg:col-span-3 p-10 rounded-[3rem] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                        <div className="grid grid-cols-8 md:grid-cols-16 gap-3 mb-12">
                            {TOOTH_NUMBERS.map(num => (
                                <button
                                    key={num}
                                    onClick={() => setSelectedTooth(num)}
                                    className={`aspect-square rounded-2xl border flex items-center justify-center font-bold text-xs transition-all ${selectedTooth === num
                                            ? 'bg-primary border-primary text-white shadow-lg'
                                            : (measurements[num]?.probing > 3)
                                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                                                : isDark ? 'bg-white/5 border-white/5 hover:border-primary/50' : 'bg-slate-50 border-slate-100 hover:border-primary'
                                        }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>

                        {selectedTooth ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <h4 className="text-xl font-bold flex items-center gap-3">
                                        <Plus className="text-primary" /> Tooth #{selectedTooth} Biometrics
                                    </h4>
                                    <button onClick={() => setSelectedTooth(null)} className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest hover:text-primary transition-colors">Deselect</button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-3 block">Probing Depth (mm)</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3].map(site => (
                                                <input
                                                    key={site}
                                                    type="number"
                                                    placeholder="0"
                                                    className={`w-full py-3 rounded-xl border text-center font-bold text-sm bg-transparent outline-none focus:border-primary ${isDark ? 'border-white/10' : 'border-slate-200'}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-3 block">Gingival Margin</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3].map(site => (
                                                <input
                                                    key={site}
                                                    type="number"
                                                    placeholder="0"
                                                    className={`w-full py-3 rounded-xl border text-center font-bold text-sm bg-transparent outline-none focus:border-primary ${isDark ? 'border-white/10' : 'border-slate-200'}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-3 block">Mobility / Bleeding</label>
                                        <div className="flex gap-3">
                                            <button className={`flex-1 py-3 rounded-xl border text-[10px] font-bold uppercase transition-all ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-100'}`}>BOP</button>
                                            <button className={`flex-1 py-3 rounded-xl border text-[10px] font-bold uppercase transition-all ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-100'}`}>Mobility</button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="py-20 text-center border-2 border-dashed border-slate-100/10 rounded-[2.5rem] opacity-40">
                                <p className="text-sm font-medium italic">Select a clinical index (tooth) to input biometric data nodes.</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                            <h4 className="text-lg font-bold mb-6 italic">Quick Indices</h4>
                            <div className="space-y-3">
                                {[
                                    { label: 'Plaque Score', value: '24%' },
                                    { label: 'Bleeding index', value: '18%' },
                                    { label: 'Recession Ratio', value: '5%' }
                                ].map((idx, i) => (
                                    <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-white/5">
                                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">{idx.label}</span>
                                        <span className="text-sm font-bold">{idx.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={`p-8 rounded-[2.5rem] border bg-gradient-to-br from-rose-500 to-rose-600 text-white`}>
                            <AlertCircle className="mb-4" />
                            <h4 className="text-lg font-bold mb-2">Clinical Warning</h4>
                            <p className="text-[10px] font-medium opacity-80 leading-relaxed">
                                Abnormal pocket depth (&gt;5mm) detected in sextant 03. Recommend immediate scaling and root planing sequence.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={`p-10 rounded-[3rem] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div className="flex items-center gap-3 mb-10">
                        <History className="text-primary" />
                        <h4 className="text-xl font-bold">Attachment Level Trajectory</h4>
                    </div>

                    <div className="h-96 flex items-end gap-1 px-4 border-b border-l border-white/5 mb-10">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div
                                    className="w-full bg-primary/20 rounded-t-xl transition-all group-hover:bg-primary group-hover:scale-x-110"
                                    style={{ height: `${Math.random() * 80 + 20}%` }}
                                />
                                <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-widest">{['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}</span>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 italic">Baseline (Jan 26)</p>
                            <p className="text-xl font-bold">18mm Avg</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 italic">Current (Mar 26)</p>
                            <p className="text-xl font-bold text-emerald-500">14mm Avg</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 italic">Improvement</p>
                            <div className="flex items-center gap-2 text-emerald-500">
                                <TrendingUp size={16} />
                                <p className="text-xl font-bold">22.4%</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
