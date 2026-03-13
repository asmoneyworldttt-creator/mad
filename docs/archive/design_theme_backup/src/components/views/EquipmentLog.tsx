import { useState, useEffect } from 'react';
import {
    Wrench, AlertTriangle, CheckCircle2, Plus,
    Search, Calendar, Settings2,
    RefreshCw, Clock, History, FileText
} from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';
import { motion, AnimatePresence } from 'framer-motion';

export function EquipmentLog({ theme }: { theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [equipment, setEquipment] = useState<any[]>([]);
    const [maintenanceLogs, setMaintenanceLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState<'inventory' | 'history'>('inventory');

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            // In a real app, we'd have an equipment table. 
            // Mocking data for now but connecting to a potential 'equipment' table
            const { data: equip } = await supabase.from('equipment').select('*');
            if (equip) setEquipment(equip);
            else {
                // Mock seed for demo
                setEquipment([
                    { id: 1, name: 'Dental Chair Unit A1', status: 'Operational', lastService: '2026-02-15', nextService: '2026-05-15', health: 95 },
                    { id: 2, name: 'Autoclave X-800', status: 'Operational', lastService: '2026-03-01', nextService: '2026-04-01', health: 88 },
                    { id: 3, name: 'Digital X-Ray Sensor', status: 'Needs Calibration', lastService: '2025-12-10', nextService: '2026-03-05', health: 45 },
                    { id: 4, name: 'Suction Motor B', status: 'Operational', lastService: '2026-01-20', nextService: '2026-04-20', health: 92 },
                ]);
            }

            const { data: logs } = await supabase.from('maintenance_logs').select('*').order('date', { ascending: false });
            if (logs) setMaintenanceLogs(logs);
        } catch (e) {
            showToast('Failed to load maintenance records', 'error');
        } finally {
            setLoading(false);
        }
    }

    const getStatusColor = (status: string) => {
        if (status === 'Operational') return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
        if (status === 'Needs Calibration') return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
        if (status === 'Down / Repair') return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
        return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    };

    return (
        <div className="animate-slide-up space-y-8 pb-20">
            {/* Header */}
            <div className={`p-8 rounded-[2.5rem] border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div>
                    <h2 className="text-3xl font-sans font-bold tracking-tight flex items-center gap-3">
                        <Wrench className="text-primary" />
                        Asset & Maintenance Vault
                    </h2>
                    <p className={`text-sm font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Ensuring zero-downtime operations through predictive clinical logistics
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`flex items-center p-1 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                        <button
                            onClick={() => setActiveView('inventory')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeView === 'inventory' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}
                        >
                            Active Assets
                        </button>
                        <button
                            onClick={() => setActiveView('history')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeView === 'history' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}
                        >
                            Maintenance Log
                        </button>
                    </div>
                    <button onClick={fetchData} className={`p-4 rounded-2xl border transition-all ${isDark ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500'}`}><RefreshCw size={20} /></button>
                    <button className="bg-primary text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-2">
                        <Plus size={18} /> Register Asset
                    </button>
                </div>
            </div>

            {/* Health Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Assets', value: '24', icon: Settings2, color: 'text-primary' },
                    { label: 'Healthy Units', value: '21', icon: CheckCircle2, color: 'text-emerald-500' },
                    { label: 'Alerting Units', value: '3', icon: AlertTriangle, color: 'text-rose-500' },
                    { label: 'Next Major Service', value: '05 Mar', icon: Calendar, color: 'text-amber-500' }
                ].map((s, i) => (
                    <div key={i} className={`p-6 rounded-[2rem] border relative overflow-hidden group ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                        <div className={`absolute -right-4 -top-4 p-8 opacity-5 group-hover:scale-125 transition-transform ${s.color}`}><s.icon size={60} /></div>
                        <p className={`text-[9px] font-extrabold uppercase tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{s.label}</p>
                        <h4 className="text-2xl font-bold">{s.value}</h4>
                    </div>
                ))}
            </div>

            {/* Active Assets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeView === 'inventory' ? equipment.map((item, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className={`p-6 rounded-[2.5rem] border group transition-all hover:scale-[1.02] ${isDark ? 'bg-slate-900 border-white/5 hover:border-primary/30' : 'bg-white border-slate-100 shadow-sm'}`}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-primary border transition-colors ${isDark ? 'bg-white/5 border-white/10 group-hover:bg-primary/5' : 'bg-slate-50 border-slate-100'}`}>
                                <Wrench size={20} />
                            </div>
                            <span className={`text-[9px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest border ${getStatusColor(item.status)}`}>
                                {item.status}
                            </span>
                        </div>
                        <h4 className="text-lg font-bold mb-1">{item.name}</h4>
                        <p className="text-xs text-slate-500 font-medium mb-6">Serial: #DX-{item.id}092-B</p>

                        <div className="space-y-4 mb-6">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Device Health</span>
                                    <span className={`text-xs font-bold ${item.health < 60 ? 'text-rose-500' : 'text-emerald-500'}`}>{item.health}%</span>
                                </div>
                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.health}%` }}
                                        className={`h-full rounded-full ${item.health < 60 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                            <div>
                                <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Last Serviced</p>
                                <p className="text-xs font-bold text-slate-300 flex items-center gap-1"><Clock size={10} /> {item.lastService}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Next Service</p>
                                <p className="text-xs font-bold text-primary flex items-center gap-1"><Calendar size={10} /> {item.nextService}</p>
                            </div>
                        </div>

                        <button className="w-full mt-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-slate-400 hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-95">
                            Schedule Technical Audit
                        </button>
                    </motion.div>
                )) : (
                    <div className="lg:col-span-3">
                        <div className={`rounded-[2.5rem] border overflow-hidden ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                            <table className="w-full text-left">
                                <thead className={isDark ? 'bg-white/5' : 'bg-slate-50'}>
                                    <tr>
                                        <th className="p-6 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Date</th>
                                        <th className="p-6 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Eqipment</th>
                                        <th className="p-6 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Action Taken</th>
                                        <th className="p-6 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Technician</th>
                                        <th className="p-6 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Cost</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {[1, 2, 3].map((_, i) => (
                                        <tr key={i} className="hover:bg-white/5 transition-all">
                                            <td className="p-6 text-xs font-bold text-slate-400">01 Mar 2026</td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                    <span className="font-bold text-sm">Autoclave X-800</span>
                                                </div>
                                            </td>
                                            <td className="p-6 text-sm text-slate-400">Regular filtration check and pressure calibration.</td>
                                            <td className="p-6 text-sm font-bold">TechSupport Global</td>
                                            <td className="p-6 font-bold text-emerald-500">₹4,500</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {maintenanceLogs.length === 0 && (
                                <div className="p-20 text-center text-slate-500 italic">No formal technical logs committed.</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
