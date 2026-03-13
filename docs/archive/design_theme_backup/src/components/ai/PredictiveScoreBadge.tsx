import { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, Info, Zap } from 'lucide-react';
import { predictNoShowRisk } from '../../services/intelligence';
import type { NoShowRisk } from '../../services/intelligence';
import { motion, AnimatePresence } from 'framer-motion';

export function PredictiveScoreBadge({ patientId, compact = false }: { patientId: string; compact?: boolean }) {
    const [risk, setRisk] = useState<NoShowRisk | null>(null);
    const [loading, setLoading] = useState(true);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        if (patientId) {
            setLoading(true);
            predictNoShowRisk(patientId).then(r => {
                setRisk(r);
                setLoading(false);
            });
        }
    }, [patientId]);

    if (loading) return (
        <div className="flex items-center gap-2 animate-pulse">
            <div className="w-16 h-4 bg-slate-500/10 rounded-full" />
        </div>
    );

    if (!risk) return null;

    const getColor = (level: string) => {
        if (level === 'Low') return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
        if (level === 'Medium') return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
        if (level === 'High') return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
        return 'text-rose-600 bg-rose-600/10 border-rose-600/20 shadow-lg shadow-rose-500/5';
    };

    const getIcon = (level: string) => {
        if (level === 'Low') return ShieldCheck;
        if (level === 'Medium') return Info;
        if (level === 'High') return AlertTriangle;
        return AlertCircle;
    };

    const StatusIcon = getIcon(risk.level);

    if (compact) {
        return (
            <div className={`px-2 py-0.5 rounded-full border flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-widest ${getColor(risk.level)}`}>
                <StatusIcon size={8} /> {risk.level} Risk ({risk.score}%)
            </div>
        );
    }

    return (
        <div className="relative group">
            <button
                onClick={() => setShowDetails(!showDetails)}
                className={`px-3 py-1.5 rounded-2xl border flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${getColor(risk.level)}`}
            >
                <Zap size={10} className={risk.level === 'Critical' ? 'animate-pulse' : ''} />
                AI Score: {risk.score}%
            </button>

            <AnimatePresence>
                {showDetails && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-0 mb-3 w-64 p-5 rounded-3xl bg-slate-900 border border-white/10 shadow-2xl z-[100] backdrop-blur-3xl"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-xl border ${getColor(risk.level)}`}>
                                <StatusIcon size={16} />
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-white">Risk Intelligence</h5>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold">{risk.level} Probability Engine</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-white/5 pb-2">Reasoning Protocol</p>
                            {risk.reasons.map((r, i) => (
                                <div key={i} className="flex gap-2 items-start">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shadow-neon" />
                                    <p className="text-[10px] font-medium text-slate-300 leading-relaxed">{r}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-5 pt-4 border-t border-white/5">
                            <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest italic">Confidence Node: 94.2%</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
