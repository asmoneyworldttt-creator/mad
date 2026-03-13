import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, TrendingUp, BarChart2 } from 'lucide-react';

interface RiskEngineProps {
    patient: any;
    toothChartData: Record<string, any>;
    vitals: any[];
    theme?: 'light' | 'dark';
}

interface RiskFactor {
    label: string;
    score: number;
    maxScore: number;
    severity: 'low' | 'medium' | 'high';
    detail: string;
}

export function DentalRiskScore({ patient, toothChartData, vitals, theme }: RiskEngineProps) {
    const isDark = theme === 'dark';
    const [factors, setFactors] = useState<RiskFactor[]>([]);
    const [totalScore, setTotalScore] = useState(0);
    const [riskLevel, setRiskLevel] = useState<'Low' | 'Moderate' | 'High' | 'Critical'>('Low');

    useEffect(() => {
        computeRisk();
    }, [patient, toothChartData, vitals]);

    const computeRisk = () => {
        const newFactors: RiskFactor[] = [];
        let total = 0;

        // 1. Tooth conditions
        const teethWithIssues = Object.values(toothChartData).filter((t: any) => t.condition && t.condition !== 'Healthy');
        const criticalConditions = teethWithIssues.filter((t: any) => ['Abscess', 'Fractured', 'Pulpal Involvement'].includes(t.condition));
        const toothScore = Math.min(teethWithIssues.length * 5 + criticalConditions.length * 10, 30);
        newFactors.push({
            label: 'Dental Pathology',
            score: toothScore,
            maxScore: 30,
            severity: toothScore >= 20 ? 'high' : toothScore >= 10 ? 'medium' : 'low',
            detail: `${teethWithIssues.length} tooth/teeth with conditions, ${criticalConditions.length} critical`
        });
        total += toothScore;

        // 2. Blood pressure
        const latestVitals = vitals[0];
        let bpScore = 0;
        if (latestVitals?.bp_systolic) {
            if (latestVitals.bp_systolic > 160) bpScore = 20;
            else if (latestVitals.bp_systolic > 140) bpScore = 10;
            else if (latestVitals.bp_systolic > 120) bpScore = 5;
        }
        newFactors.push({
            label: 'Cardiovascular Risk',
            score: bpScore,
            maxScore: 20,
            severity: bpScore >= 15 ? 'high' : bpScore >= 8 ? 'medium' : 'low',
            detail: latestVitals ? `BP ${latestVitals.bp_systolic}/${latestVitals.bp_diastolic} mmHg` : 'No vitals recorded'
        });
        total += bpScore;

        // 3. Known allergies
        const allergies = patient?.allergies ? patient.allergies.split(',').filter(Boolean) : [];
        const allergyScore = Math.min(allergies.length * 8, 20);
        newFactors.push({
            label: 'Allergy Burden',
            score: allergyScore,
            maxScore: 20,
            severity: allergyScore >= 16 ? 'high' : allergyScore >= 8 ? 'medium' : 'low',
            detail: allergies.length > 0 ? allergies.join(', ') : 'No allergies on record'
        });
        total += allergyScore;

        // 4. Medical conditions
        const hasMedConditions = !!(patient?.medical_conditions);
        const hasMedications = !!(patient?.current_medications);
        const medScore = (hasMedConditions ? 10 : 0) + (hasMedications ? 5 : 0);
        newFactors.push({
            label: 'Systemic Comorbidities',
            score: medScore,
            maxScore: 15,
            severity: medScore >= 12 ? 'high' : medScore >= 5 ? 'medium' : 'low',
            detail: hasMedConditions ? patient.medical_conditions : 'None on record'
        });
        total += medScore;

        // 5. SpO2
        let spo2Score = 0;
        if (latestVitals?.spo2) {
            if (latestVitals.spo2 < 90) spo2Score = 15;
            else if (latestVitals.spo2 < 95) spo2Score = 8;
        }
        newFactors.push({
            label: 'Oxygen Saturation',
            score: spo2Score,
            maxScore: 15,
            severity: spo2Score >= 12 ? 'high' : spo2Score >= 5 ? 'medium' : 'low',
            detail: latestVitals?.spo2 ? `SpO2: ${latestVitals.spo2}%` : 'Not measured'
        });
        total += spo2Score;

        setFactors(newFactors);
        setTotalScore(total);

        if (total >= 60) setRiskLevel('Critical');
        else if (total >= 35) setRiskLevel('High');
        else if (total >= 15) setRiskLevel('Moderate');
        else setRiskLevel('Low');
    };

    const maxTotal = 100;
    const pct = Math.round((totalScore / maxTotal) * 100);

    const riskStyles = {
        Low: { color: 'text-emerald-400', bg: 'bg-emerald-500', bar: 'bg-emerald-500', border: 'border-emerald-500/20', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
        Moderate: { color: 'text-amber-400', bg: 'bg-amber-500', bar: 'bg-amber-500', border: 'border-amber-500/20', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
        High: { color: 'text-rose-400', bg: 'bg-rose-500', bar: 'bg-rose-500', border: 'border-rose-500/20', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
        Critical: { color: 'text-red-500', bg: 'bg-red-600', bar: 'bg-red-600', border: 'border-red-500/40', badge: 'bg-red-500/20 text-red-400 border-red-500/30' },
    };
    const style = riskStyles[riskLevel];

    return (
        <div className={`p-5 rounded-2xl border transition-all ${isDark ? `bg-slate-900 ${style.border}` : `bg-white border-slate-100 shadow-sm`}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${style.badge}`}>
                        <Shield size={16} />
                    </div>
                    <div>
                        <h4 className="font-bold text-xs">Dental Risk Score</h4>
                        <p className={`text-[8px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>AI-computed safety profile</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className={`text-xl font-bold ${style.color}`}>{totalScore}<span className="text-[10px] font-medium opacity-50">/100</span></p>
                    <span className={`text-[7px] font-extrabold px-1.5 py-0.5 rounded-full border uppercase tracking-widest ${style.badge}`}>
                        {riskLevel} Risk
                    </span>
                </div>
            </div>

            {/* Progress Arc */}
            <div className={`w-full h-3 rounded-full mb-6 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                <div
                    className={`h-full rounded-full transition-all duration-1000 ${style.bar}`}
                    style={{ width: `${pct}%` }}
                />
            </div>

            {/* Risk Factors */}
            <div className="space-y-3">
                {factors.map((f, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${f.severity === 'high' ? 'bg-rose-400' : f.severity === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                                <p className="text-xs font-bold truncate">{f.label}</p>
                                <p className={`text-[10px] font-extrabold shrink-0 ml-2 ${f.severity === 'high' ? 'text-rose-400' : f.severity === 'medium' ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {f.score}/{f.maxScore}
                                </p>
                            </div>
                            <p className={`text-[10px] truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{f.detail}</p>
                            <div className={`w-full h-1.5 rounded-full mt-1 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                                <div
                                    className={`h-full rounded-full ${f.severity === 'high' ? 'bg-rose-400' : f.severity === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                    style={{ width: `${(f.score / f.maxScore) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {riskLevel === 'Critical' || riskLevel === 'High' ? (
                <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2">
                    <AlertTriangle size={14} className="text-rose-400 shrink-0" />
                    <p className="text-[10px] font-bold text-rose-400">
                        {riskLevel === 'Critical' ? 'CRITICAL: Consult physician before invasive procedures. Medical clearance required.' : 'HIGH: Pre-procedure medical history review strongly recommended.'}
                    </p>
                </div>
            ) : riskLevel === 'Low' ? (
                <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                    <p className="text-[10px] font-bold text-emerald-400">LOW RISK: Patient is cleared for standard dental procedures.</p>
                </div>
            ) : null}
        </div>
    );
}
