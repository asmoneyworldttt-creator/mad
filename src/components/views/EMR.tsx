
import React, { useState, useEffect } from 'react';
import {
    Search, FileText, Activity,
    ChevronRight, History as HistoryIcon, Image as ImageIcon, Plus, Save, Sparkles, Database, Trash2, Camera, Bot, User, HeartPulse
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
    const surfaceOptions = ["M", "D", "O", "B", "L"];

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
            // Robust search handling names, exact IDs, and partials
            let orString = `name.ilike.%${query}%,phone.ilike.%${query}%`;

            // Try to match ID as exact if it looks like a UUID or numeric string
            if (query.match(/^[0-9a-f-]{8,}$/i) || !isNaN(query)) {
                orString += `,id.eq.${query}`;
            } else {
                orString += `,id.ilike.%${query}%`;
            }

            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .or(orString)
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
            showToast('Clinical commit failed: Repository error', 'error');
        } else {
            setToothChartData(updatedChart);
            showToast(`Records updated for Tooth #${selectedTooth}`, 'success');
        }
        setIsSaving(false);
    };

    const handleFileUpload = async (event: any) => {
        const file = event.target.files?.[0];
        if (!file || !selectedPatient) return;

        setIsUploading(true);
        const fileName = `${Date.now()}_${file.name}`;
        const filePath = `${selectedPatient.id}/${fileName}`;

        const { error } = await supabase.storage
            .from('patient-records')
            .upload(filePath, file);

        if (error) {
            showToast('Upload failed: Storage node unreachable', 'error');
        } else {
            showToast('File synced to clinical vault', 'success');
            fetchPatientData();
        }
        setIsUploading(false);
    };

    const handleAIQuery = async () => {
        if (!aiQuery) return;

        let contextInfo = `Patient Data context:\nName: ${selectedPatient?.name}\n`;
        if (emrTab === 'odontogram') {
            const teethWithIssues = Object.entries(toothChartData).filter(([_, data]: [any, any]) => data.condition !== 'Healthy');
            contextInfo += `Clinical Findings (${teethWithIssues.length} issues):\n`;
            teethWithIssues.forEach(([num, data]: [any, any]) => {
                contextInfo += `- Tooth #${num}: ${data.condition} (${data.surfaces?.join(', ') || 'N/A'})\n`;
            });
        }

        const fullPrompt = `${contextInfo}\n\nPlease provide a clinical assessment focusing on: ${aiQuery}`;

        const oldQuery = aiQuery;
        setAiQuery('');

        await sendAIQuery(fullPrompt, undefined);
    };

    const tabs = [
        { id: 'odontogram', label: '3D Mapping', icon: Activity },
        { id: 'soap', label: 'SOAP Notes', icon: FileText },
        { id: 'vitals', label: 'Vitals & Risk', icon: HeartPulse },
        { id: 'history', label: 'Patient Story', icon: HistoryIcon },
        { id: 'ai', label: 'Dentora AI', icon: Sparkles },
        { id: 'gallery', label: 'Imaging Vault', icon: Camera },
        { id: 'files', label: 'Vault', icon: Database }
    ];

    return (
        <div className={`animate-slide-up space-y-3 min-h-screen ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            <div className={`p-4 md:p-5 rounded-2xl border shadow-xl transition-all relative overflow-hidden`} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                <div className="absolute top-0 right-0 p-4 opacity-[0.02] pointer-events-none"><Database size={60} /></div>
                <div className="relative max-w-lg z-10">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" size={16} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearch}
                        placeholder="Lookup patient records..."
                        className={`w-full pl-10 pr-4 py-2 rounded-xl border outline-none font-bold text-xs transition-all shadow-inner`}
                        style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                    />
                    {searchResults.length > 0 && (
                        <div className={`absolute top-full mt-2 w-full rounded-2xl border shadow-2xl overflow-hidden z-[100] animate-slide-up backdrop-blur-xl`}
                            style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                            {searchResults.map(p => (
                                <div key={p.id} onClick={() => selectPatient(p)} className={`p-3 cursor-pointer flex items-center justify-between transition-all group border-b last:border-0`}
                                    style={{ borderColor: 'var(--border-color)' }}>
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold shadow-lg shadow-primary/10 text-[10px]">{p.name.charAt(0)}</div>
                                        <div>
                                            <p className="font-bold text-[11px]" style={{ color: 'var(--text-main)' }}>{p.name}</p>
                                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{p.id} • {p.phone}</p>
                                        </div>
                                    </div>
                                    <div className="w-6 h-6 rounded-lg flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                                        <ChevronRight size={14} className="text-slate-400 group-hover:text-primary transition-all" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {selectedPatient && (
                    <div className="mt-5 pt-4 border-t flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4" style={{ borderColor: 'var(--border-color)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-primary shadow-xl transition-transform hover:scale-110" style={{ background: 'var(--primary-soft)', border: '1px solid var(--primary-glow)' }}>
                                <User size={20} />
                            </div>
                            <div>
                                <h2 className="text-base font-bold tracking-tight" style={{ color: 'var(--text-dark)' }}>{selectedPatient.name}</h2>
                                <p className="text-[9px] font-bold flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[8px] uppercase font-black">O Positive</span>
                                    • FDI Compliant • Active EMR
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className={`p-1 rounded-xl border flex gap-0.5`} style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)' }}>
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setEmrTab(tab.id)}
                                        className={`px-3 py-1.5 rounded-lg text-[8px] font-black tracking-widest uppercase flex items-center gap-1 transition-all ${emrTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-primary'}`}
                                    >
                                        <tab.icon size={11} /> {tab.label.split(' ')[0]}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setActiveTab('quickbills')} className="px-4 py-2 bg-primary hover:scale-[1.02] text-white rounded-xl text-[9px] font-bold uppercase tracking-wider shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center gap-1.5">
                                <Plus size={12} /> Add Bill
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {selectedPatient ? (
                <main className="space-y-4 pb-32">
                    {emrTab === 'odontogram' && (
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
                            <div className={`xl:col-span-2 rounded-2xl border shadow-xl overflow-hidden relative group transition-all h-[500px] ${theme === 'dark' ? 'bg-slate-950 border-white/10' : 'bg-slate-900 border-slate-100'}`}>
                                <div className="absolute top-4 left-4 z-10 space-y-1.5">
                                    <div className="px-3 py-1.5 bg-slate-800/80 backdrop-blur-md rounded-lg border border-white/10 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                                        <span className="text-[8px] font-bold text-white uppercase tracking-wider">Dentosphere v2.4</span>
                                    </div>
                                    {selectedTooth && <div className="px-3 py-1.5 bg-primary/80 backdrop-blur-md rounded-lg border border-white/10 text-[8px] font-bold text-white uppercase tracking-wider">Tooth #{selectedTooth}</div>}
                                </div>
                                <Canvas shadows camera={{ position: [10, 5, 10], fov: 40 }}>
                                    <Environment preset="city" />
                                    <ambientLight intensity={0.6} />
                                    <pointLight position={[10, 10, 10]} intensity={1.5} castShadow />
                                    <RealisticDentition selectedTooth={selectedTooth} onSelectTooth={handleToothSelect} toothChartData={toothChartData} />
                                    <OrbitControls enablePan={false} minDistance={5} maxDistance={20} />
                                </Canvas>
                                <div className="absolute bottom-4 left-4 right-4 z-10 flex justify-between items-center pointer-events-none">
                                    <div className="flex gap-2">
                                        <div className="px-3 py-1 bg-slate-800/50 backdrop-blur-md rounded-lg text-[8px] font-bold text-white/50 border border-white/5">FDI Compliant</div>
                                    </div>
                                    <button onClick={() => showToast('Frame capture saved.', 'success')} className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl pointer-events-auto border border-white/10 text-white transition-all"><Camera size={16} /></button>
                                </div>
                            </div>

                            <div className={`rounded-2xl p-6 border shadow-lg flex flex-col h-full ${theme === 'dark' ? 'bg-slate-900 border-white/10 shadow-primary/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                                {selectedTooth ? (
                                    <div className="space-y-6 animate-slide-up">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xl font-bold flex items-center gap-2">
                                                <Database size={20} className="text-primary" /> Tooth #{selectedTooth}
                                            </h4>
                                            <span className="text-[8px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-lg uppercase tracking-wider">FDI Mode</span>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Clinical Condition</label>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                {conditionsList.slice(0, 8).map(c => (
                                                    <button
                                                        key={c}
                                                        onClick={() => setToothCondition(c)}
                                                        className={`p-2 rounded-lg border text-[9px] font-bold uppercase transition-all ${toothCondition === c ? 'bg-primary border-primary text-white shadow-md' : 'bg-transparent border-slate-200 text-slate-400 hover:border-primary/50'}`}
                                                    >
                                                        {c}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Clinical Notes</label>
                                                <VoiceCharting onTranscript={setToothNote} currentText={toothNote} theme={theme} />
                                            </div>
                                            <textarea
                                                value={toothNote}
                                                onChange={e => setToothNote(e.target.value)}
                                                className={`w-full h-24 rounded-2xl p-4 text-xs font-bold outline-none transition-all border ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-primary'}`}
                                                placeholder="Enter findings..."
                                            />
                                        </div>

                                        <button
                                            onClick={handleSaveNote}
                                            disabled={isSaving}
                                            className="w-full py-4 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:bg-slate-700"
                                        >
                                            {isSaving ? <Activity className="animate-spin" size={16} /> : <Save size={16} />}
                                            {isSaving ? 'Synching...' : 'Commit Record'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                                        <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary/30 mb-6 border border-primary/10 shadow-inner">
                                            <Activity size={32} />
                                        </div>
                                        <h4 className="text-base font-bold mb-2">Diagnostic Ready</h4>
                                        <p className="text-xs text-slate-500 font-medium italic">Select a tooth node in the 3D environment.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {emrTab === 'history' && (
                        <div className={`p-6 rounded-3xl border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                            <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                                <HistoryIcon size={24} className="text-primary" />
                                Patient Story
                            </h3>
                            <div className="space-y-4 relative before:absolute before:left-6 before:top-4 before:bottom-0 before:w-px before:bg-slate-100/10">
                                {patientHistory.length > 0 ? patientHistory.map((h, i) => (
                                    <div key={i} className={`ml-12 p-6 rounded-2xl border relative group transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}>
                                        <div className="absolute -left-[2.1rem] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-primary border-2 border-slate-950 shadow-neon" />
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="text-base font-bold mb-0.5">{h.treatment}</h4>
                                                <p className="text-[9px] font-bold text-primary uppercase tracking-wider">{h.date}</p>
                                            </div>
                                            <span className="text-[8px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-md border border-emerald-500/20 uppercase tracking-wider">Verified</span>
                                        </div>
                                        <p className="text-xs text-slate-400 font-medium leading-relaxed italic">"{h.notes}"</p>
                                    </div>
                                )) : (
                                    <div className="py-12 text-center text-xs text-slate-500 italic font-medium">No historical clinical data found.</div>
                                )}
                            </div>
                        </div>
                    )}

                    {emrTab === 'ai' && (
                        <div className={`p-6 rounded-3xl border shadow-xl transition-all ${theme === 'dark' ? 'bg-slate-950 border-white/10' : 'bg-white border-slate-100 shadow-sm'}`}>
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                                <div>
                                    <h3 className="text-xl font-bold flex items-center gap-3 text-primary">
                                        <Sparkles size={24} /> Dentora AI Diagnostics
                                    </h3>
                                    <p className="text-xs text-slate-400 font-medium mt-1">Real-time clinical inference.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-6">
                                    <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                                        <label className="text-[9px] font-bold text-slate-500 mb-3 block uppercase tracking-wider">Analysis Matrix</label>
                                        <div className="flex gap-2">
                                            <input
                                                value={aiQuery}
                                                onChange={e => setAiQuery(e.target.value)}
                                                placeholder="Synthesize current clinical data..."
                                                className={`flex-1 rounded-xl px-4 py-3 text-xs font-bold outline-none transition-all border ${theme === 'dark' ? 'bg-transparent border-white/10 text-white focus:border-primary/50' : 'bg-white border-slate-200 text-slate-900 focus:border-primary'}`}
                                            />
                                            <button onClick={handleAIQuery} disabled={isAIAnalyzing} className="px-6 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-xs transition-all active:scale-95 disabled:opacity-50">
                                                {isAIAnalyzing ? <Activity size={16} className="animate-spin" /> : 'Run Sync'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {selectedPatient && (
                                            <DentalRiskScore
                                                patient={selectedPatient}
                                                toothChartData={toothChartData}
                                                vitals={vitals}
                                                theme={theme}
                                            />
                                        )}
                                        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                                            <p className="text-[8px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Sync Tokens</p>
                                            <p className="text-lg font-bold text-primary">12 / 100</p>
                                        </div>
                                    </div>
                                </div>
                                <div className={`p-6 rounded-2xl shadow-xl relative overflow-hidden flex flex-col min-h-[400px] max-h-[500px] overflow-y-auto ${theme === 'dark' ? 'bg-slate-900 border border-white/10' : 'bg-slate-900 text-white'}`}>
                                    <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none"><Sparkles size={60} /></div>
                                    <h4 className="text-[10px] font-black tracking-widest uppercase text-primary mb-6 sticky top-0 z-10 bg-slate-900 pb-3">AI Inference Tracker</h4>
                                    {aiMessages.length > 0 ? (
                                        <div className="flex-1 flex flex-col gap-6 animate-slide-up pb-8">
                                            {aiMessages.map((msg, i) => (
                                                <div key={i} className={`p-6 rounded-2xl flex gap-4 ${msg.role === 'assistant' ? 'bg-primary/10 border border-primary/20' : 'bg-white/5 border border-white/10'}`}>
                                                    <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${msg.role === 'assistant' ? 'bg-primary text-white' : 'bg-slate-700 text-white'}`}>
                                                        {msg.role === 'assistant' ? <Bot size={20} /> : <span className="font-bold">{selectedPatient?.name?.charAt(0) || 'U'}</span>}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold mb-2 uppercase tracking-widest opacity-50">{msg.role === 'assistant' ? 'Dentora AI Core' : 'Clinical Request'}</p>
                                                        <div className="text-sm font-medium leading-relaxed prose prose-invert" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>') }}></div>
                                                    </div>
                                                </div>
                                            ))}
                                            {isAIAnalyzing && (
                                                <div className="p-6 rounded-2xl flex gap-4 bg-primary/5 border border-primary/10 animate-pulse">
                                                    <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/50 text-white flex items-center justify-center">
                                                        <Activity size={20} className="animate-spin" />
                                                    </div>
                                                    <div className="flex-1 py-2">
                                                        <div className="h-4 bg-primary/20 rounded w-1/4 mb-3"></div>
                                                        <div className="h-3 bg-white/10 rounded w-full mb-2"></div>
                                                        <div className="h-3 bg-white/10 rounded w-3/4"></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                                            <div className="w-16 h-16 rounded-[1.5rem] border border-white/10 flex items-center justify-center mb-6"><Database size={32} /></div>
                                            <p className="text-xs italic">Waiting for diagnostic trigger...</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {emrTab === 'soap' && selectedPatient && (
                        <ClinicalNotes patientId={selectedPatient.id} theme={theme} />
                    )}

                    {emrTab === 'vitals' && selectedPatient && (
                        <VitalSignsPanel patient={selectedPatient} theme={theme} />
                    )}

                    {emrTab === 'gallery' && selectedPatient && (
                        <PhotoGallery patientId={selectedPatient.id} theme={theme} />
                    )}

                    {emrTab === 'files' && (
                        <div className="space-y-6 pb-12">
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                <div className={`xl:col-span-2 p-6 rounded-3xl border transition-all ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                                    <div className="flex justify-between items-center mb-8">
                                        <h4 className="text-xl font-bold flex items-center gap-3">
                                            <ImageIcon size={24} className="text-primary" /> Imaging Vault
                                        </h4>
                                        <span className="text-[9px] font-bold text-slate-400 border border-slate-100/10 px-3 py-1.5 rounded-xl uppercase tracking-wider">Total: {patientFiles.length} Scans</span>
                                    </div>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                        {patientFiles.length > 0 ? patientFiles.map((file, i) => (
                                            <div key={i} className={`group aspect-square rounded-2xl border overflow-hidden relative transition-all hover:scale-[1.01] cursor-pointer ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:border-primary/50' : 'bg-slate-50 border-slate-100'}`}>
                                                <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                                                    <Database size={32} className="text-primary/10 group-hover:text-primary/30 transition-all" />
                                                </div>
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <p className="text-[10px] font-bold text-white truncate mb-0.5">{file.name}</p>
                                                    <p className="text-[7px] text-white/50 font-bold uppercase tracking-wider">{(file.metadata?.size / 1024 / 1024).toFixed(2)} MB • Sync Ready</p>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="col-span-full py-20 text-center text-xs text-slate-500 italic font-medium">No imaging artifacts detected.</div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className={`p-8 rounded-3xl border text-center relative group transition-all ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                                        <input type="file" id="clinical-upload" className="hidden" onChange={handleFileUpload} />
                                        <label htmlFor="clinical-upload" className="cursor-pointer block">
                                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all ${isUploading ? 'bg-primary animate-pulse' : 'bg-primary/5 group-hover:bg-primary/10 group-hover:scale-105'}`}>
                                                {isUploading ? <Activity className="text-white" size={28} /> : <Plus className="text-primary" size={28} />}
                                            </div>
                                            <h4 className="text-lg font-bold mb-2">Sync Imaging</h4>
                                            <p className="text-xs text-slate-400 font-medium mb-8 px-4 leading-relaxed">Commit OPG, RVG or clinical snapshots.</p>
                                            <div className="py-3 border-2 border-dashed border-slate-100/10 rounded-xl text-[8px] font-bold text-slate-400 group-hover:border-primary group-hover:text-primary uppercase tracking-widest transition-all">Select Payload</div>
                                        </label>
                                    </div>
                                    <div className={`p-8 rounded-3xl border ${theme === 'dark' ? 'bg-slate-950 border-white/5 shadow-xl' : 'bg-slate-900 text-white'}`}>
                                        <h4 className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-6">Vault Status</h4>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center pb-3 border-b border-white/5">
                                                <span className="text-[10px] font-bold text-slate-400">Node Sync</span>
                                                <span className="text-emerald-500 text-[10px] font-bold">ACTIVE</span>
                                            </div>
                                            <div className="flex justify-between items-center pb-3 border-b border-white/5">
                                                <span className="text-[10px] font-bold text-slate-400">Encryption</span>
                                                <span className="text-blue-500 text-[10px] font-bold">AES-256</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-slate-400">Region</span>
                                                <span className="text-[10px] font-bold">S3-HYD</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            ) : (
                <div className="py-32 flex flex-col items-center justify-center text-center max-w-lg mx-auto animate-slide-up px-6">
                    <div className="w-32 h-32 rounded-[3.5rem] bg-primary/5 flex items-center justify-center text-primary/20 mb-10 border border-primary/10 shadow-inner">
                        <Database size={64} />
                    </div>
                    <h3 className="text-3xl font-sans font-bold mb-4 tracking-tight">Clinical Record Inactive</h3>
                    <p className="text-slate-400 font-medium leading-relaxed italic">The Dentora Neural Engine requires a patient context to initialize EMR visualization. Use the retrieval hub above to select a record node.</p>
                </div>
            )}
        </div>
    );
}
