import { useState, useEffect } from 'react';
import {
    Activity, TrendingUp, Save, History, Plus
} from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';

export function PerioCharting({ theme, patientId }: { theme?: 'light' | 'dark', patientId?: string }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    
    // States
    const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
    const [measurements, setMeasurements] = useState<Record<number, any>>({});
    const [activeView, setActiveView] = useState<'chart' | 'trends'>('chart');
    const [isSaving, setIsSaving] = useState(false);

    // Context / Selectors
    const [patients, setPatients] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [selectedDoctorName, setSelectedDoctorName] = useState('');

    const TOOTH_NUMBERS = Array.from({ length: 32 }, (_, i) => i + 1);

    useEffect(() => {
        fetchPatients();
        fetchDoctors();
    }, []);

    const fetchPatients = async () => {
        const { data } = await supabase.from('patients').select('id, name');
        if (data) setPatients(data);
    };

    const fetchDoctors = async () => {
        const { data } = await supabase.from('staff').select('id, name');
        if (data) setDoctors(data);
    };

    const updateMeasurement = (num: number, field: string, value: string) => {
        setMeasurements(prev => ({
            ...prev,
            [num]: { ...prev[num], [field]: value }
        }));
    };

    const handleCommit = async () => {
        if (!selectedPatientId) return showToast('Please select a patient', 'error');
        if (Object.keys(measurements).length === 0) return showToast('No measurements input mapped', 'error');

        setIsSaving(true);
        const { error } = await supabase.from('patient_history').insert({
            patient_id: selectedPatientId,
            date: new Date().toISOString().split('T')[0],
            treatment: 'Perio Charting Assessment',
            notes: `Total teeth scanned: ${Object.keys(measurements).length}. Data: ${JSON.stringify(measurements)}`,
            category: 'Clinical',
            doctor_name: selectedDoctorName || 'Staff Doctor'
        });

        if (!error) {
            showToast('Perio Charting saved to Patient History', 'success');
            setMeasurements({});
            setSelectedTooth(null);
        } else {
            showToast('Error syncing: ' + error.message, 'error');
        }
        setIsSaving(false);
    };

    return (
        <div className="animate-slide-up space-y-8 pb-20">
            {/* Header / Selectors */}
            <div className={`p-5 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
                    <div>
                        <h2 className="text-xl font-sans font-bold tracking-tight flex items-center gap-2">
                            <TrendingUp className="text-primary" size={18} />
                            Perio-Diagnostic
                        </h2>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:w-80">
                        <select 
                            value={selectedPatientId || ''} 
                            onChange={e => setSelectedPatientId(e.target.value)}
                            className="p-2 text-xs font-medium border rounded-xl outline-none"
                        >
                            <option value="">Select Patient</option>
                            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        
                        <select 
                            value={selectedDoctorName} 
                            onChange={e => { setSelectedDoctorName(e.target.value); const d = doctors.find(doc => doc.name === e.target.value); setSelectedDoctorId(d?.id || ''); }}
                            className="p-2 text-xs font-medium border rounded-xl outline-none"
                        >
                            <option value="">Select Doctor</option>
                            {doctors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <button
                        onClick={handleCommit}
                        disabled={isSaving}
                        className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center gap-1.5 hover:scale-105 transition-all text-sm disabled:opacity-50"
                    >
                        <Save size={16} /> {isSaving ? 'Saving...' : 'Commit'}
                    </button>
                </div>
            </div>

            {/* Standard layout blocks representing Tooth grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className={`lg:col-span-3 p-5 rounded-3xl border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div className="grid grid-cols-8 md:grid-cols-16 gap-2 mb-8">
                        {TOOTH_NUMBERS.map(num => (
                            <button
                                key={num}
                                onClick={() => setSelectedTooth(num)}
                                className={`aspect-square rounded-2xl border flex items-center justify-center font-bold text-xs transition-all ${selectedTooth === num
                                        ? 'bg-primary border-primary text-white shadow-lg'
                                        : (measurements[num]?.probing > 3)
                                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                                            : isDark ? 'bg-white/5' : 'bg-slate-50'
                                    }`}
                            >
                                {num}
                            </button>
                        ))}
                    </div>

                    {selectedTooth ? (
                        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex items-center justify-between mb-5">
                                <h4 className="text-sm font-bold flex items-center gap-2">
                                    <Plus className="text-primary" size={16} /> Tooth #{selectedTooth} Biometrics
                                </h4>
                                <button onClick={() => setSelectedTooth(null)} className="text-[9px] font-extrabold text-slate-500 tracking-wider">Deselect</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2 block">Probing Depth (mm)</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={measurements[selectedTooth]?.probing || ''}
                                        onChange={e => updateMeasurement(selectedTooth, 'probing', e.target.value)}
                                        className="w-full py-2 rounded-xl border text-center font-bold text-sm bg-transparent outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2 block">Gingival Margin</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={measurements[selectedTooth]?.margin || ''}
                                        onChange={e => updateMeasurement(selectedTooth, 'margin', e.target.value)}
                                        className="w-full py-2 rounded-xl border text-center font-bold text-sm bg-transparent outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2 block">Conditions</label>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => updateMeasurement(selectedTooth, 'bop', measurements[selectedTooth]?.bop ? '' : 'true')}
                                            className={`flex-1 py-2 rounded-xl border text-[10px] font-bold ${measurements[selectedTooth]?.bop ? 'bg-rose-500 text-white border-rose-500' : ''}`}
                                        >BOP</button>
                                        <input
                                            type="text"
                                            placeholder="Mobility"
                                            value={measurements[selectedTooth]?.mobility || ''}
                                            onChange={e => updateMeasurement(selectedTooth, 'mobility', e.target.value)}
                                            className="flex-1 py-1 rounded-xl border text-center font-bold text-[10px] outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-20 text-center border-2 border-dashed border-slate-100/10 rounded-[2.5rem] opacity-40">
                            <p className="text-sm font-medium italic">Select a tooth to input biometric data nodes.</p>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                        <h4 className="text-base font-bold mb-4">Quick Indices</h4>
                        <p className="text-xs text-slate-500">Inputs captured: {Object.keys(measurements).length}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
