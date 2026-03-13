import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle, Info, Loader2 } from 'lucide-react';

interface DrugInteractionCheckerProps {
    drugName: string;
    patientAllergies: string[];
    theme?: 'light' | 'dark';
}

const OPENFDA_BASE = 'https://api.fda.gov/drug/label.json';

export function DrugInteractionChecker({ drugName, patientAllergies, theme }: DrugInteractionCheckerProps) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'safe' | 'warning' | 'critical' | 'error'>('idle');
    const [warnings, setWarnings] = useState<string[]>([]);
    const [interactions, setInteractions] = useState<string[]>([]);
    const [contraindications, setContraindications] = useState<string[]>([]);
    const debounceRef = useRef<any>(null);

    useEffect(() => {
        if (!drugName || drugName.length < 3) {
            setStatus('idle');
            setWarnings([]);
            return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            checkDrug(drugName);
        }, 700);

        return () => clearTimeout(debounceRef.current);
    }, [drugName]);

    const checkDrug = async (name: string) => {
        setStatus('loading');
        setWarnings([]);
        setInteractions([]);
        setContraindications([]);

        try {
            const res = await fetch(`${OPENFDA_BASE}?search=openfda.brand_name:"${encodeURIComponent(name)}"&limit=1`);
            if (!res.ok) throw new Error('Not found');
            const data = await res.json();
            const label = data.results?.[0];
            if (!label) { setStatus('safe'); return; }

            const newWarnings = label.warnings_and_cautions?.[0]?.substring(0, 200) || '';
            const newInteractions = label.drug_interactions?.[0]?.substring(0, 200) || '';
            const newContraind = label.contraindications?.[0]?.substring(0, 200) || '';

            setWarnings(newWarnings ? [newWarnings] : []);
            setInteractions(newInteractions ? [newInteractions] : []);
            setContraindications(newContraind ? [newContraind] : []);

            // Check against patient allergies
            const allergyMatch = patientAllergies.some(allergy =>
                name.toLowerCase().includes(allergy.toLowerCase()) ||
                (newWarnings + newContraind).toLowerCase().includes(allergy.toLowerCase())
            );

            if (allergyMatch) {
                setStatus('critical');
            } else if (newWarnings || newContraind) {
                setStatus('warning');
            } else {
                setStatus('safe');
            }
        } catch {
            setStatus('idle');
        }
    };

    const isDark = theme === 'dark';

    if (status === 'idle') return null;

    if (status === 'loading') return (
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400 font-medium">
            <Loader2 size={12} className="animate-spin" />
            Checking OpenFDA database...
        </div>
    );

    if (status === 'safe') return (
        <div className="mt-2 flex items-center gap-2 text-xs text-emerald-500 font-bold">
            <CheckCircle size={12} /> No known interactions found in OpenFDA
        </div>
    );

    return (
        <div className={`mt-2 p-3 rounded-xl border text-xs font-medium animate-slide-up ${status === 'critical' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
            <div className="flex items-center gap-2 font-bold mb-1">
                {status === 'critical' ? <AlertTriangle size={12} className="animate-pulse" /> : <Info size={12} />}
                {status === 'critical' ? '🚨 CRITICAL: Allergy conflict detected' : '⚠️ Warnings found in FDA label'}
            </div>
            {warnings[0] && <p className="opacity-80 line-clamp-2">{warnings[0]}...</p>}
            {contraindications[0] && <p className="opacity-80 line-clamp-2 mt-1">{contraindications[0]}...</p>}
        </div>
    );
}
