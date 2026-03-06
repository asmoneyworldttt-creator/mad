import { useState, useEffect } from 'react';
import {
    Clock, Plus, Search,
    Bell, CheckCircle2, AlertCircle,
    User, Calendar, Clock4, Zap,
    ArrowRight, MessageSquare
} from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';
import { motion } from 'framer-motion';

export function WaitlistEngine({ theme }: { theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWaitlist();
    }, []);

    async function fetchWaitlist() {
        setLoading(true);
        // Mocking waitlist for now as it's a new clinical concept
        const mockEntries = [
            { id: 1, name: 'Robert Smith', type: 'Emergency', timePref: 'Morning', priority: 'High', waitTime: '4 days' },
            { id: 2, name: 'Alice Wong', type: 'Cleaning', timePref: 'Any', priority: 'Medium', waitTime: '12 days' },
            { id: 3, name: 'David Miller', type: 'Consultation', timePref: 'Afternoon', priority: 'Low', waitTime: '2 days' },
        ];
        setTimeout(() => {
            setEntries(mockEntries);
            setLoading(false);
        }, 800);
    }

    return (
        <div className="animate-slide-up space-y-8 pb-20">
            {/* Header */}
            <div className={`p-8 rounded-[2.5rem] border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div>
                    <h2 className="text-3xl font-sans font-bold tracking-tight flex items-center gap-3">
                        <Clock4 className="text-primary" />
                        Smart Waitlist Engine
                    </h2>
                    <p className={`text-sm font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Intelligent slot-filling and cancellation mitigation node
                    </p>
                </div>
                <button className="bg-primary text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 flex items-center gap-2 hover:scale-105 transition-all text-sm">
                    <Plus size={18} /> Add Entry
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* List */}
                <div className={`lg:col-span-2 p-10 rounded-[3rem] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div className="flex justify-between items-center mb-10">
                        <h4 className="text-xl font-bold italic">Active Wait Queue</h4>
                        <span className="text-[10px] font-extrabold text-primary px-4 py-2 bg-primary/5 rounded-xl uppercase tracking-widest">
                            {entries.length} Nodes Pending
                        </span>
                    </div>

                    <div className="space-y-4">
                        {entries.map((p, i) => (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={i}
                                className={`p-6 rounded-[2rem] border group hover:border-primary/50 transition-all flex items-center justify-between ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-800 text-white flex items-center justify-center font-bold text-lg border border-white/5">
                                        {p.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-lg">{p.name}</h5>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-extrabold uppercase border ${p.priority === 'High' ? 'text-rose-500 border-rose-500/20 bg-rose-500/5' : 'text-slate-500 border-slate-600/20 bg-slate-600/5'}`}>
                                                {p.priority} Priority
                                            </span>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">• {p.type}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="hidden md:block text-right">
                                        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Waiting For</p>
                                        <p className="text-sm font-bold">{p.waitTime}</p>
                                    </div>
                                    <button className="p-4 rounded-2xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/10">
                                        <Zap size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Automation & Insights */}
                <div className="space-y-8">
                    <div className={`p-8 rounded-[2.5rem] bg-slate-900 border border-white/10 relative overflow-hidden group shadow-2xl shadow-primary/5`}>
                        <div className="absolute -right-4 -bottom-4 p-8 opacity-10 transform group-hover:scale-125 transition-all"><Zap size={100} className="text-primary" /></div>
                        <h4 className="text-xl font-bold mb-2">Smart Matcher</h4>
                        <p className="text-xs text-slate-400 mb-8 leading-relaxed">
                            AI is currently monitoring a 4:30 PM cancellation. Identified 2 candidates with "Any" time preference.
                        </p>
                        <button className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                            Push Notifications <Bell size={14} />
                        </button>
                    </div>

                    <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                        <h4 className="text-lg font-bold mb-6">Efficiency Metrics</h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500">Waitlist Conversion</span>
                                <span className="text-sm font-bold text-emerald-500">+18%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500">Avg. Fill Time</span>
                                <span className="text-sm font-bold">42 mins</span>
                            </div>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
                                <div className="h-full bg-emerald-500 w-[72%]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
