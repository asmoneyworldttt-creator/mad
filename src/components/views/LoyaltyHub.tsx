import { useState, useEffect } from 'react';
import {
    Award, Gift, TrendingUp, Users, ArrowRight, Star, Coins,
    History, Zap, MessageSquare, Plus, Search, RefreshCw, PenTool,
    ShieldAlert
} from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../Modal';

export function LoyaltyHub({ userRole, theme }: { userRole: string; theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [patients, setPatients] = useState<any[]>([]);
    const [historyLogs, setHistoryLogs] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalPoints: 0, activeMembers: 0, totalRewards: 0 });
    const [search, setSearch] = useState('');
    const [activeView, setActiveView] = useState<'leaderboard' | 'history' | 'rewards'>('leaderboard');
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [pointAdjustment, setPointAdjustment] = useState({ points: '', reason: 'Visit Completion' });

    useEffect(() => {
        fetchLoyaltyData();
    }, [activeView]);

    const fetchLoyaltyData = async () => {
        const { data } = await supabase
            .from('patients')
            .select('id, name, loyalty_points')
            .order('loyalty_points', { ascending: false });

        if (data) {
            setPatients(data);
            const total = data.reduce((acc, p) => acc + (p.loyalty_points || 0), 0);
            const active = data.filter(p => (p.loyalty_points || 0) > 0).length;
            setStats({
                totalPoints: total,
                activeMembers: active,
                totalRewards: data.filter(p => (p.loyalty_points || 0) >= 1000).length
            });
        }

        // Mock history if needed
        setHistoryLogs([
            { date: '2026-03-18', patient: 'Rahul Sharma', points: '+100', reason: 'Treatment Plan complete' },
            { date: '2026-03-15', patient: 'Priya K', points: '-500', reason: 'Redeemed Free Scaling' }
        ]);
    };

    const handleAdjustPoints = async (e: any) => {
        e.preventDefault();
        if (!selectedPatient || !pointAdjustment.points) return;

        const pts = parseInt(pointAdjustment.points);
        const currentPoints = selectedPatient.loyalty_points || 0;

        const { error } = await supabase.from('patients')
            .update({ loyalty_points: currentPoints + pts })
            .eq('id', selectedPatient.id);

        if (!error) {
            showToast(`Awarded ${pts} points successfully`, 'success');
            await supabase.from('loyalty_history').insert({ patient_id: selectedPatient.id, points: pts, reason: pointAdjustment.reason }).select(); // Just insert async
            setIsAdjustModalOpen(false);
            fetchLoyaltyData();
        } else {
            showToast('Error awarding points: ' + error.message, 'error');
        }
    };

    const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    const getTier = (points: number) => {
        if (points >= 2000) return { label: 'Platinum', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
        if (points >= 1000) return { label: 'Gold', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
        if (points >= 500) return { label: 'Silver', color: 'text-slate-400 bg-slate-400/10 border-slate-400/20' };
        return { label: 'Bronze', color: 'text-rose-400 bg-rose-400/10 border-rose-400/20' };
    };

    return (
        <div className="animate-slide-up space-y-6 pb-20 relative overflow-hidden">
            {/* Ambient Backing */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                <motion.div animate={{ x: [0, 20, -20, 0], y: [0, 30, -30, 0] }} transition={{ repeat: Infinity, duration: 20, ease: "easeInOut" }} className="absolute -top-10 -left-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl opacity-60" />
            </div>

            {/* Header */}
            <div className={`p-6 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 backdrop-blur-md transition-all ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div>
                    <h2 className="text-xl md:text-2xl font-sans font-bold tracking-tight flex items-center gap-2">
                        <Award className="text-amber-500" /> Rewards Engine
                    </h2>
                    <p className={`text-xs font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Automated loyalty tiers and referral incentive triggers</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button onClick={fetchLoyaltyData} className={`p-2.5 rounded-xl border transition-all ${isDark ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}><RefreshCw size={14} /></button>
                </div>
            </div>

            {/* Sub Tabs */}
            <div className={`flex p-1 rounded-2xl shadow-lg w-max border overflow-x-auto max-w-full backdrop-blur-md`} style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)' }}>
                {[['leaderboard', 'Leaderboard', TrendingUp], ['history', 'Activity logs', History], ['rewards', 'Reward tiers', Award]].map(([tab, label, Icon]: any) => (
                    <button key={tab} onClick={() => setActiveView(tab)} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeView === tab ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-400 hover:text-primary hover:bg-primary/5'}`}><Icon size={14} /> {label}</button>
                ))}
            </div>

            {/* Loyalty Analytics Cards */}
            {activeView === 'leaderboard' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Circulating D-Points', value: stats.totalPoints.toLocaleString(), icon: Coins, color: 'text-amber-500' },
                        { label: 'Active Members', value: stats.activeMembers, icon: Zap, color: 'text-primary' },
                        { label: 'Tier Eligible', value: stats.totalRewards, icon: Award, color: 'text-emerald-500' }
                    ].map((s, i) => (
                        <div key={i} className={`p-4 rounded-xl border relative overflow-hidden group backdrop-blur-md ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                            <div className={`absolute -right-2 -top-2 p-4 opacity-5 group-hover:scale-125 transition-transform ${s.color}`}><s.icon size={40} /></div>
                            <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{s.label}</p>
                            <h4 className="text-xl font-black">{s.value}</h4>
                        </div>
                    ))}
                </div>
            )}

            {/* Main Content View Switcher */}
            <div className="grid grid-cols-1 gap-4">
                {activeView === 'leaderboard' ? (
                    <div className={`p-5 rounded-2xl border backdrop-blur-md ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Board rankings</h3>
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input placeholder="Search Member..." value={search} onChange={e => setSearch(e.target.value)} className={`w-full rounded-xl pl-9 pr-4 py-2 text-xs font-bold outline-none border transition-all ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`} />
                            </div>
                        </div>

                        <div className="space-y-3">
                            {filteredPatients.map((p, i) => {
                                const tier = getTier(p.loyalty_points || 0);
                                return (
                                    <div key={p.id} className={`p-4 rounded-xl border flex items-center justify-between group transition-all hover:scale-[1.01] ${isDark ? 'bg-slate-800/30 border-white/5' : 'bg-slate-50/50 border-slate-100'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-md bg-gradient-to-tr from-primary to-violet-500`}>{i + 1}</div>
                                            <div>
                                                <h4 className="font-bold text-sm tracking-tight">{p.name}</h4>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-widest ${tier.color}`}>{tier.label}</span>
                                                    <p className="text-[9px] font-bold text-slate-400">P-{p.id.slice(0, 5).toUpperCase()}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-md font-black text-amber-500 flex items-center justify-end gap-1">{p.loyalty_points || 0} <Coins size={14} /></p>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Balance</p>
                                            </div>
                                            <button onClick={() => { setSelectedPatient(p); setPointAdjustment({ points: '', reason: 'Visit Completion' }); setIsAdjustModalOpen(true); }} className={`p-2 rounded-lg border transition-all hover:bg-primary hover:text-white ${isDark ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}><PenTool size={14} /></button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : activeView === 'history' ? (
                     <div className={`rounded-2xl border overflow-hidden backdrop-blur-md ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                         <table className="w-full text-left">
                              <thead className={`border-b ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}><tr className="text-[9px] font-black text-slate-500 uppercase"><th className="p-4">Date</th><th className="p-4">Patient</th><th className="p-4">Audit reason</th><th className="p-4 text-right">Points</th></tr></thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                  {historyLogs.map((log, i) => (
                                      <tr key={i} className="hover:bg-slate-50/20 text-xs font-bold transition-all"><td className="p-4 text-slate-400">{log.date}</td><td className="p-4 text-slate-700 dark:text-slate-300">{log.patient}</td><td className="p-4 text-slate-500">{log.reason}</td><td className={`p-4 text-right ${log.points.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>{log.points}</td></tr>
                                  ))}
                              </tbody>
                         </table>
                     </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { name: 'Bronze', threshold: '0 - 499 Points', benefits: ['Sign-up Bonus', 'Standard queuing'], color: 'from-amber-700 to-amber-600' },
                            { name: 'Silver', threshold: '500+ Points', benefits: ['5% Discount scaling', 'Priority scheduling'], color: 'from-slate-400 to-slate-300' },
                            { name: 'Gold', threshold: '1000+ Points', benefits: ['10% General treatments', 'Free consultation'], color: 'from-amber-400 to-amber-300' },
                            { name: 'Platinum', threshold: '2000+ Points', benefits: ['15% Absolute discount', 'VIP Fast-track slot'], color: 'from-emerald-400 to-teal-400' }
                        ].map((tier, i) => (
                            <div key={i} className={`p-5 rounded-2xl border relative overflow-hidden backdrop-blur-md ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                                <div className={`h-1.5 w-full absolute top-0 left-0 bg-gradient-to-r ${tier.color}`} />
                                <h4 className="text-md font-black mb-1">{tier.name} Tier</h4>
                                <p className="text-[10px] font-bold text-slate-400 tracking-tight">{tier.threshold}</p>
                                <ul className="mt-4 space-y-2">
                                    {tier.benefits.map((b, bi) => (
                                        <li key={bi} className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5"><Star size={10} className="text-amber-500" /> {b}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Adjustment Modal Dialog */}
            <Modal isOpen={isAdjustModalOpen} onClose={() => setIsAdjustModalOpen(false)} title="Audit Customer Points" maxWidth="max-w-sm">
                <form onSubmit={handleAdjustPoints} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 mb-1 block">Patient Name</label>
                        <p className="text-xs font-black p-2 rounded-xl border bg-slate-50/50 dark:bg-white/5 dark:border-white/10">{selectedPatient?.name}</p>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 mb-1 block">Point Increment / Deletion</label>
                        <input type="number" value={pointAdjustment.points} onChange={e => setPointAdjustment({...pointAdjustment, points: e.target.value})} className={`w-full border rounded-xl px-3 py-2 text-xs font-bold ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="E.g., 100 or -50" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 mb-1 block">Log Reason</label>
                        <select value={pointAdjustment.reason} onChange={e => setPointAdjustment({...pointAdjustment, reason: e.target.value})} className={`w-full border rounded-xl px-1 py-1.5 text-xs font-bold ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`}>
                            <option value="Visit Completion">Visit Completion</option>
                            <option value="Treatment Success">Treatment Success</option>
                            <option value="Friend Referral">Friend Referral</option>
                            <option value="Coupon Redemption">Coupon Redemption</option>
                        </select>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={() => setIsAdjustModalOpen(false)} className="flex-1 py-2 rounded-xl border text-xs font-bold transition-all hover:bg-slate-50 dark:hover:bg-white/5">Cancel</button>
                        <button type="submit" className="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-bold transition-all hover:opacity-90">Confirm</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
