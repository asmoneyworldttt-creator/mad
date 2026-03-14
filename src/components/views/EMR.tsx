
import React, { useState, useEffect } from 'react';
import {
    Search, FileText, Activity,
    ChevronRight, History as HistoryIcon, Image as ImageIcon, Plus, Save, Sparkles, Database, Trash2, Camera, Bot, User, HeartPulse, X
} from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { RealisticDentition } from './Dentition3D';
import { useToast } from '../Toast';
import { supabase } from '../../supabase';
import { useGlobalChat } from '../ai/GlobalAIAssistant/useGlobalChat';
import { VitalSignsPanel } from './VitalSignsPanel';
import { DentalRiskScore } from './DentalRiskScore';
import { VoiceCharting } from './VoiceCharting';
import { PhotoGallery } from './PhotoGallery';
import { ClinicalNotes } from './ClinicalNotes';

type UserRole = 'master' | 'admin' | 'staff' | 'patient';

export function EMR({ userRole, setActiveTab, theme }: { userRole: UserRole; setActiveTab: (tab: string) => void; theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();

    // Core EMR State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [emrTab, setEmrTab] = useState('odontogram');

    // Tooth Mapping State
    const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
    const [toothNote, setToothNote] = useState('');
    const [toothCondition, setToothCondition] = useState('Healthy');
    const [toothSurfaces, setToothSurfaces] = useState<string[]>([]);
    const [toothChartData, setToothChartData] = useState<any>({});

    // Patient Detail State
    const [patientHistory, setPatientHistory] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [vitals, setVitals] = useState<any[]>([]);

    // AI Agent State
    const [aiQuery, setAiQuery] = useState('');
    const { messages: aiMessages, isTyping: isAIAnalyzing, sendMessage: sendAIQuery } = useGlobalChat();

    // File State
    const [patientFiles, setPatientFiles] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const conditionsList = [
        "Healthy", "Decayed", "Missing", "Filled", "Fractured", "Impacted", "Sensitive",
        "Crown placed", "RCT done", "Bridge abutment", "Implant", "Gingival recession", "Mobility", "Abscess"
    ];

    useEffect(() => {
        if (selectedPatient) {
            fetchPatientData();
        }
    }, [selectedPatient]);

    const fetchPatientData = async () => {
        if (!selectedPatient) return;

        // Fetch history from appointments
        const { data: history } = await supabase
            .from('appointments')
            .select('*')
            .eq('patient_id', selectedPatient.id)
            .order('created_at', { ascending: false });
        if (history) {
            setPatientHistory(history.map(h => ({ date: h.created_at, treatment: h.type, notes: h.notes || 'Routine checkup' })));
        } else {
            setPatientHistory([]);
        }

        // Fetch vital signs
        const { data: vitalsData } = await supabase
            .from('vital_signs')
            .select('*')
            .eq('patient_id', selectedPatient.id)
            .order('recorded_at', { ascending: false })
            .limit(5);
        if (vitalsData) {
            setVitals(vitalsData);
        } else {
            setVitals([]);
        }

        // Fetch files from bucket
        const { data: files, error: storageError } = await supabase.storage
            .from('patient-records')
            .list(`${selectedPatient.id}/`);

        if (!storageError && files) {
            setPatientFiles(files);
        } else {
            setPatientFiles([]);
        }
    };

    const handleSearch = async (e: any) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length > 0) {
            // Updated search logic to handle ID search correctly and avoid crashes
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .or(`name.ilike.%${query}%,phone.ilike.%${query}%,id.ilike.%${query}%`)
                .limit(8);

            if (!error) setSearchResults(data || []);
        } else {
            setSearchResults([]);
        }
    };

    const selectPatient = async (patient: any) => {
        setSelectedPatient(patient);
        setSearchQuery('');
        setSearchResults([]);
        setToothChartData(patient.tooth_chart_data || {});
        setSelectedTooth(null);
    };

    const handleToothSelect = (num: number) => {
        const current = num === selectedTooth ? null : num;
        setSelectedTooth(current);
        if (current) {
            const data = toothChartData[current] || {};
            setToothCondition(data.condition || 'Healthy');
            setToothSurfaces(data.surfaces || []);
            setToothNote(data.note || '');
        }
    };

    const handleSaveNote = async () => {
        if (!selectedPatient || !selectedTooth) return;
        setIsSaving(true);

        const updatedChart = {
            ...toothChartData,
            [selectedTooth]: {
                condition: toothCondition,
                surfaces: toothSurfaces,
                note: toothNote,
                updated_at: new Date().toISOString()
            }
        };

        const { error } = await supabase
            .from('patients')
            .update({ tooth_chart_data: updatedChart })
            .eq('id', selectedPatient.id);

        if (error) {
            showToast('Error saving clinical note', 'error');
        } else {
            setToothChartData(updatedChart);
            showToast(`Note saved for Tooth #${selectedTooth}`, 'success');
        }
        setIsSaving(false);
    };

    const handleAIQuery = async () => {
        if (!aiQuery) return;

        let contextInfo = `Patient context: ${selectedPatient?.name}\n`;
        const teethWithIssues = Object.entries(toothChartData).filter(([_, data]: [any, any]) => data.condition !== 'Healthy');
        teethWithIssues.forEach(([num, data]: [any, any]) => {
            contextInfo += `Tooth #${num}: ${data.condition}\n`;
        });

        const fullPrompt = `${contextInfo}\nQuestion: ${aiQuery}`;
        setAiQuery('');
        await sendAIQuery(fullPrompt, undefined);
    };

    const tabs = [
        { id: 'odontogram', label: '3D Chart', icon: Activity },
        { id: 'soap', label: 'History', icon: FileText },
        { id: 'vitals', label: 'Vitals', icon: HeartPulse },
        { id: 'history', label: 'Visits', icon: HistoryIcon },
        { id: 'ai', label: 'AI', icon: Sparkles },
        { id: 'gallery', label: 'Images', icon: Camera },
        { id: 'files', label: 'Vault', icon: Database }
    ];

    return (
        <div className={`animate-slide-up space-y-3 px-1 sm:px-0 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            <div className={`p-3 md:p-4 rounded-xl border shadow-sm transition-all`} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={14} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearch}
                        placeholder="Search patient records..."
                        className={`w-full pl-9 pr-4 py-1.5 rounded-lg border outline-none font-bold text-xs transition-all`}
                        style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                    />
                    {searchResults.length > 0 && (
                        <div className={`absolute top-full mt-1 w-full rounded-xl border shadow-xl overflow-hidden z-[100] animate-slide-up`}
                            style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                            {searchResults.map(p => (
                                <button key={p.id} onClick={() => selectPatient(p)} className={`w-full text-left p-2.5 hover:bg-primary/5 transition-all flex items-center justify-between border-b last:border-0`}
                                    style={{ borderColor: 'var(--border-color)' }}>
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0">{p.name.charAt(0)}</div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-[11px] truncate" style={{ color: 'var(--text-main)' }}>{p.name}</p>
                                            <p className="text-[9px] text-slate-400 font-bold truncate">ID: {p.id.slice(0, 8)} • {p.phone}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={14} className="text-slate-300" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {selectedPatient && (
                    <div className="mt-3 pt-3 border-t flex flex-col md:flex-row items-start md:items-center justify-between gap-3" style={{ borderColor: 'var(--border-color)' }}>
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-primary" style={{ background: 'var(--primary-soft)', border: '1px solid var(--primary-glow)' }}>
                                <User size={18} />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-dark)' }}>{selectedPatient.name}</h2>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{selectedPatient.id.slice(0, 16)} • FDI Compliant</p>
                            </div>
                            <button onClick={() => setSelectedPatient(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 ml-2"><X size={14} /></button>
                        </div>
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto">
                            <div className={`p-1 rounded-xl border flex gap-0.5`} style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)' }}>
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setEmrTab(tab.id)}
                                        className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase flex items-center gap-1 transition-all shrink-0 ${emrTab === tab.id ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-primary'}`}
                                    >
                                        <tab.icon size={11} /> {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {selectedPatient ? (
                <main className="space-y-3 pb-20">
                    {emrTab === 'odontogram' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                            <div className={`md:col-span-2 rounded-2xl border shadow-sm overflow-hidden relative group transition-all h-[400px] sm:h-[500px] ${theme === 'dark' ? 'bg-slate-950 border-white/10' : 'bg-slate-900 border-slate-100'}`}>
                                <Canvas shadows camera={{ position: [10, 5, 10], fov: 40 }}>
                                    <Environment preset="city" />
                                    <ambientLight intensity={0.6} />
                                    <RealisticDentition selectedTooth={selectedTooth} onSelectTooth={handleToothSelect} toothChartData={toothChartData} />
                                    <OrbitControls enablePan={false} minDistance={5} maxDistance={20} />
                                </Canvas>
                                {selectedTooth && (
                                    <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-primary/90 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest">
                                        Selected: Tooth #{selectedTooth}
                                    </div>
                                )}
                            </div>

                            <div className={`rounded-xl p-4 border shadow-sm flex flex-col min-h-[400px] ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100'}`}>
                                {selectedTooth ? (
                                    <div className="space-y-4 animate-slide-up">
                                        <h4 className="text-sm font-bold flex items-center gap-2 uppercase tracking-wide">
                                            <Database size={16} className="text-primary" /> Record Node #{selectedTooth}
                                        </h4>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold text-slate-500 uppercase">Condition</label>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                {conditionsList.slice(0, 10).map(c => (
                                                    <button
                                                        key={c}
                                                        onClick={() => setToothCondition(c)}
                                                        className={`p-1.5 rounded-lg border text-[9px] font-bold uppercase transition-all ${toothCondition === c ? 'bg-primary border-primary text-white shadow-sm' : 'bg-transparent border-slate-100 dark:border-white/5 text-slate-400 hover:border-primary/50'}`}
                                                    >
                                                        {c}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold text-slate-500 uppercase">Clinical Notes</label>
                                            <textarea
                                                value={toothNote}
                                                onChange={e => setToothNote(e.target.value)}
                                                className={`w-full h-20 rounded-xl p-3 text-[11px] font-medium outline-none border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}
                                                placeholder="Enter clinical findings..."
                                            />
                                        </div>
                                        <button onClick={handleSaveNote} disabled={isSaving} className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-[11px] flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95">
                                            {isSaving ? <Activity className="animate-spin" size={14} /> : <Save size={14} />} Save Charting
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 py-10">
                                        <Activity size={32} className="mb-4" />
                                        <p className="text-xs font-bold">Select tooth for charting</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {emrTab === 'soap' && selectedPatient && <ClinicalNotes patientId={selectedPatient.id} theme={theme} />}
                    {emrTab === 'vitals' && selectedPatient && <VitalSignsPanel patient={selectedPatient} theme={theme} />}
                    {emrTab === 'gallery' && selectedPatient && <PhotoGallery patientId={selectedPatient.id} theme={theme} />}
                </main>
            ) : (
                <div className="py-24 text-center max-w-sm mx-auto animate-slide-up px-4">
                    <div className="w-20 h-20 rounded-3xl bg-primary/5 flex items-center justify-center text-primary/20 mx-auto mb-6 border border-primary/10">
                        <Database size={40} />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Initialize Patient EMR</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Use the retrieval hub above to select a patient record to begin clinical charting and diagnostics.</p>
                </div>
            )}
        </div>
    );
}
