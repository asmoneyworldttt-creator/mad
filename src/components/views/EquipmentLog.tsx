import { useState, useEffect } from 'react';
import {
    Wrench, AlertTriangle, CheckCircle2, Plus,
    Search, Calendar, Settings2,
    RefreshCw, Clock
} from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';
import { motion } from 'framer-motion';
import { Modal } from '../Modal';

export function EquipmentLog({ theme }: { theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [equipment, setEquipment] = useState<any[]>([]);
    const [maintenanceLogs, setMaintenanceLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState<'inventory' | 'history'>('inventory');

    // Add Asset Modal
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newAsset, setNewAsset] = useState({ name: '', status: 'Operational', last_service: '', next_service: '', health: 100 });

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const { data: equip } = await supabase.from('equipment').select('*').order('created_at', { ascending: false });
            if (equip) setEquipment(equip);

            const { data: logs } = await supabase.from('maintenance_logs').select('*').order('date', { ascending: false });
            if (logs) setMaintenanceLogs(logs);
        } catch (e) {
            showToast('Failed to load maintenance records', 'error');
        } finally {
            setLoading(false);
        }
    }

    const handleAddAsset = async () => {
        if (!newAsset.name) return showToast('Asset Name is required', 'error');

        const { error } = await supabase.from('equipment').insert({
            name: newAsset.name,
            status: newAsset.status,
            health: newAsset.health,
            last_service: newAsset.last_service || null,
            next_service: newAsset.next_service || null
        });

        if (!error) {
            showToast('Asset registered successfully', 'success');
            setIsAddModalOpen(false);
            setNewAsset({ name: '', status: 'Operational', last_service: '', next_service: '', health: 100 });
            fetchData();
        } else {
            showToast('Error registering asset: ' + error.message, 'error');
        }
    };

    const getStatusColor = (status: string) => {
        if (status === 'Operational') return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
        if (status === 'Needs Calibration') return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
        if (status === 'Down / Repair') return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
        return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    };

    // Calculate Summary Metrics
    const healthyCount = equipment.filter(e => e.status === 'Operational').length;
    const alertCount = equipment.filter(e => e.status !== 'Operational').length;

    return (
        <div className="animate-slide-up space-y-8 pb-20">
            {/* Header */}
            <div className={`p-8 rounded-[2.5rem] border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div>
                    <h2 className="text-3xl font-sans font-bold tracking-tight flex items-center gap-3">
                        <Wrench className="text-primary" />
                        Asset Vault
                    </h2>
                    <p className={`text-sm font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Ensuring zero-downtime operations through clinical logistics management
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
                    <button onClick={() => setIsAddModalOpen(true)} className="bg-primary text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-2">
                        <Plus size={18} /> Register Asset
                    </button>
                </div>
            </div>

            {/* Health Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Assets', value: equipment.length.toString(), icon: Settings2, color: 'text-primary' },
                    { label: 'Healthy Units', value: healthyCount.toString(), icon: CheckCircle2, color: 'text-emerald-500' },
                    { label: 'Alerting Units', value: alertCount.toString(), icon: AlertTriangle, color: 'text-rose-500' }
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
                {activeView === 'inventory' ? (
                    equipment.length > 0 ? equipment.map((item, i) => (
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

                            <div className="space-y-4 mb-6">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Device Health</span>
                                        <span className={`text-xs font-bold ${item.health < 60 ? 'text-rose-500' : 'text-emerald-500'}`}>{item.health}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <div className={`h-full rounded-full ${item.health < 60 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${item.health}%` }} />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                <div>
                                    <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Last Serviced</p>
                                    <p className="text-xs font-bold text-slate-400 flex items-center gap-1"><Clock size={10} /> {item.last_service || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Next Service</p>
                                    <p className="text-xs font-bold text-primary flex items-center gap-1"><Calendar size={10} /> {item.next_service || 'N/A'}</p>
                                </div>
                            </div>
                        </motion.div>
                    )) : <div className="p-20 text-center opacity-40 italic lg:col-span-3">No assets registered yet. Click "Register Asset" to build list.</div>
                ) : (
                    <div className="lg:col-span-3">
                        <div className={`rounded-[2.5rem] border overflow-hidden ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                            <table className="w-full text-left">
                                <thead className={isDark ? 'bg-white/5' : 'bg-slate-50'}>
                                    <tr>
                                        <th className="p-6 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Date</th>
                                        <th className="p-6 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Eqipment</th>
                                        <th className="p-6 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Action Taken</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {maintenanceLogs.map((log, i) => (
                                        <tr key={i} className="hover:bg-white/5 transition-all">
                                            <td className="p-6 text-xs font-bold">{log.date}</td>
                                            <td className="p-6 text-sm font-bold">{log.equipment_id}</td>
                                            <td className="p-6 text-sm">{log.action_taken}</td>
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

            {/* Register Asset Modal */}
            {isAddModalOpen && (
                <Modal isOpen={true} onClose={() => setIsAddModalOpen(false)} title="Register Asset">
                    <div className="space-y-4 p-4">
                        <div>
                            <label className="block text-xs font-bold mb-1">Asset Name</label>
                            <input type="text" value={newAsset.name} onChange={e => setNewAsset({ ...newAsset, name: e.target.value })} className="w-full p-2 border rounded-lg" placeholder="Dental Chair Unit A1" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1">Status</label>
                            <select value={newAsset.status} onChange={e => setNewAsset({ ...newAsset, status: e.target.value })} className="w-full p-2 border rounded-lg">
                                <option value="Operational">Operational</option>
                                <option value="Needs Calibration">Needs Calibration</option>
                                <option value="Down / Repair">Down / Repair</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1">Device Health %</label>
                            <input type="number" value={newAsset.health} onChange={e => setNewAsset({ ...newAsset, health: parseInt(e.target.value) })} className="w-full p-2 border rounded-lg" min="0" max="100" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-bold mb-1">Last Service</label>
                                <input type="date" value={newAsset.last_service} onChange={e => setNewAsset({ ...newAsset, last_service: e.target.value })} className="w-full p-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1">Next Service</label>
                                <input type="date" value={newAsset.next_service} onChange={e => setNewAsset({ ...newAsset, next_service: e.target.value })} className="w-full p-2 border rounded-lg" />
                            </div>
                        </div>
                        <button onClick={handleAddAsset} className="w-full bg-primary text-white p-2 rounded-lg font-bold">Register</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
