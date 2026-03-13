import { useState, useEffect } from 'react';
import {
    Award,
    Gift,
    TrendingUp,
    Users,
    ArrowRight,
    Star,
    Coins,
    History,
    Zap,
    MessageSquare
} from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';

export function LoyaltyHub({ userRole, theme }: { userRole: string; theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [patients, setPatients] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalPoints: 0,
        activeMembers: 0,
        totalRewards: 0
    });
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchLoyaltyData();
    }, []);

    const fetchLoyaltyData = async () => {
        const { data } = await supabase
            .from('patients')
            .select('id, name, loyalty_points, last_visit:appointments(date)')
            .order('loyalty_points', { ascending: false });

        if (data) {
            setPatients(data);
            const total = data.reduce((acc, p) => acc + (p.loyalty_points || 0), 0);
            const active = data.filter(p => (p.loyalty_points || 0) > 0).length;
            setStats({
                totalPoints: total,
                activeMembers: active,
                totalRewards: data.filter(p => (p.loyalty_points || 0) > 1000).length
            });
        }
    };

    const addPoints = async (id: string, points: number, reason: string) => {
        const patient = patients.find(p => p.id === id);
        const currentPoints = patient?.loyalty_points || 0;

        const { error } = await supabase.from('patients')
            .update({ loyalty_points: currentPoints + points })
            .eq('id', id);

        if (!error) {
            showToast(`Awarded ${points} points for ${reason}`, 'success');
            // Log transaction in history table
            await supabase.from('loyalty_history').insert({
                patient_id: id,
                points: points,
                reason: reason
            });
            fetchLoyaltyData();
        }
    };

    const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="animate-slide-up space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Patient Rewards Engine</h2>
                    <p className={`text-sm font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Automated loyalty tiers and referral incentive tracking
                    </p>
                </div>
            </div>

            {/* Loyalty Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Circulating D-Points', value: stats.totalPoints.toLocaleString(), icon: Coins, color: 'text-amber-500' },
                    { label: 'Loyalty Participation', value: stats.activeMembers.toString(), icon: Zap, color: 'text-primary' },
                    { label: 'Reward Tier Eligible', value: stats.totalRewards.toString(), icon: Award, color: 'text-emerald-500' }
                ].map((s, i) => (
                    <div key={i} className="p-8 rounded-[2rem] border relative overflow-hidden" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: '0 1px 8px var(--glass-shadow)' }}>
                        <div className={`absolute top-0 right-0 p-8 opacity-5 ${s.color}`}><s.icon size={64} /></div>
                        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                        <h3 className="text-3xl font-bold" style={{ color: 'var(--text-dark)' }}>{s.value}</h3>
                    </div>
                ))}
            </div>

            <div className="p-8 rounded-[2.5rem] border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: '0 1px 8px var(--glass-shadow)' }}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <h3 className="text-xl font-bold">Reward Leaderboard</h3>
                    <div className="relative flex-1 max-w-md">
                        <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            placeholder="Find member..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className={`w-full rounded-2xl px-12 py-4 font-medium outline-none border transition-all text-sm`}
                            style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    {filteredPatients.map((p, i) => {
                        const level = p.loyalty_points > 2000 ? 'Platinum' : p.loyalty_points > 1000 ? 'Gold' : p.loyalty_points > 500 ? 'Silver' : 'Bronze';
                        const levelColors = {
                            Platinum: 'bg-emerald-500 shadow-emerald-500/20',
                            Gold: 'bg-amber-500 shadow-amber-500/20',
                            Silver: 'bg-slate-400 shadow-slate-400/20',
                            Bronze: 'bg-rose-400 shadow-rose-400/20'
                        };

                        return (
                            <div key={p.id} className="p-6 rounded-[2rem] border group transition-all flex items-center justify-between" style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)' }}>
                                <div className="flex items-center gap-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg text-white shadow-lg ${levelColors[level as keyof typeof levelColors]}`}>
                                        {i + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">{p.name}</h4>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs font-semibold ${level === 'Platinum' ? 'text-emerald-500' : 'text-slate-500'}`}>
                                                {level} Tier
                                            </span>
                                            <p className="text-[10px] font-medium text-slate-400">ID: {p.id.slice(0, 8)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-10">
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-amber-500 flex items-center justify-end gap-2">
                                            {p.loyalty_points || 0}
                                            <Coins size={18} />
                                        </p>
                                        <p className="text-xs font-semibold text-slate-500">Available Points</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => addPoints(p.id, 100, 'Visit Completion')} className="p-3 rounded-xl border transition-all hover:scale-105" title="Reward Completion (+100)"
                                            style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                                            <Zap size={18} />
                                        </button>
                                        <button onClick={() => addPoints(p.id, 500, 'New Referral')} className={`p-3 rounded-xl border transition-all hover:scale-105 ${isDark ? 'bg-white/5 border-white/10 text-slate-400 hover:text-emerald-500' : 'bg-white border-slate-200 text-slate-400 hover:text-emerald-500'}`} title="Referral Bonus (+500)">
                                            <Users size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
