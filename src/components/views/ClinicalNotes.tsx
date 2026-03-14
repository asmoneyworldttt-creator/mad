import { useState, useEffect } from 'react';
import { FileText, Save, History, Plus, Brain, User, Calendar, Activity, Bot, Sparkles, ChevronDown } from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';
import { VoiceCharting } from './VoiceCharting';
import { useGlobalChat } from '../ai/GlobalAIAssistant/useGlobalChat';
import { DoctorSelect } from '../DoctorSelect';
import { PatientSelect } from '../PatientSelect';

interface ClinicalNotesProps {
    patientId?: string;
    theme?: 'light' | 'dark';
}

export function ClinicalNotes({ patientId: initialPatientId, theme }: ClinicalNotesProps) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [notes, setNotes] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    
    const [selectedPatient, setSelectedPatient] = useState<any>(initialPatientId ? { id: initialPatientId } : null);
    const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

    const [form, setForm] = useState({
        subjective: '',
        objective: '',
        assessment: '',
        plan: ''
    });

    useEffect(() => {
        if (initialPatientId) {
            setSelectedPatient({ id: initialPatientId, name: '' });
            fetchNotes(initialPatientId);
        } else {
            fetchAllNotes();
        }
    }, [initialPatientId]);

    const fetchNotes = async (pid: string) => {
        const { data } = await supabase
            .from('clinical_notes')
            .select('*')
            .eq('patient_id', pid)
            .order('created_at', { ascending: false });
        if (data) setNotes(data);
    };

    const fetchAllNotes = async () => {
        const { data } = await supabase
            .from('clinical_notes')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
        if (data) setNotes(data);
    };

    const handleSave = async () => {
        if (!selectedPatient) return showToast('Please select a patient', 'error');
        if (!selectedDoctor) return showToast('Please select an attending doctor', 'error');
        if (!form.subjective && !form.objective && !form.assessment && !form.plan) {
            return showToast('Empty notes cannot be committed', 'error');
        }

        setIsSaving(true);
        const { error } = await supabase.from('clinical_notes').insert({
            patient_id: selectedPatient.id,
            doctor_id: selectedDoctor.id,
            doctor_name: selectedDoctor.name,
            ...form
        });

        // Also sync to general patient history for the Overview tab
        if (!error) {
            await supabase.from('patient_history').insert({
                patient_id: selectedPatient.id,
                date: new Date().toISOString().split('T')[0],
                treatment: 'Clinical SOAP Note',
                notes: `Assessment: ${form.assessment.slice(0, 50)}...`,
                category: 'Clinical',
                doctor_name: selectedDoctor.name
            });
        }

        if (!error) {
            showToast('Clinical SOAP record committed', 'success');
            setForm({ subjective: '', objective: '', assessment: '', plan: '' });
            setShowForm(false);
            if (selectedPatient) fetchNotes(selectedPatient.id);
            else fetchAllNotes();
        } else {
            showToast('Failed to commit record: ' + error.message, 'error');
        }
        setIsSaving(false);
    };

    const { sendMessage: sendAIQuery, isTyping: isAIAnalyzing } = useGlobalChat();

    const handleAIEnhance = async () => {
        if (!form.subjective) {
            return showToast('Enter patient symptoms in Subjective (S) first.', 'error');
        }

        showToast('AI Synthesis: Analyzing clinical patterns...', 'success');
        
        const prompt = `Based on these patient symptoms (Subjective): "${form.subjective}", 
        please suggest a professional clinical Assessment (A) and a treatment Plan (P). 
        Format your response EXACTLY as:
        Assessment: [Your assessment here]
        Plan: [Your plan here]`;

        const responseText = await sendAIQuery(prompt, { patientId: selectedPatient?.id });
        
        if (responseText && responseText.length > 5) {
            // Robust extraction: fallback to raw text if tags aren't found
            const aMatch = responseText.match(/(?:Assessment|A):?\s*(.*?)(?=\s*(?:Plan|P):?|$)/is);
            const pMatch = responseText.match(/(?:Plan|P):?\s*(.*)/is);

            const newAssessment = aMatch ? aMatch[1].trim() : (responseText.includes('Plan') ? responseText.split(/Plan:?/i)[0].trim() : responseText.trim());
            const newPlan = pMatch ? pMatch[1].trim() : (responseText.includes('Plan') ? responseText.split(/Plan:?/i)[1].trim() : '');

            setForm(prev => ({
                ...prev,
                assessment: newAssessment || prev.assessment,
                plan: newPlan || prev.plan
            }));
            
            showToast('Clinical synthesis applied.', 'success');
        } else {
            showToast('AI synthesis failed. Try again.', 'error');
        }
    };


    return (
        <div className="animate-slide-up space-y-3">
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-sm font-bold flex items-center gap-2 text-primary">
                            <FileText size={18} />
                            Clinical SOAP Ledger
                        </h3>
                        <p className={`text-[9px] font-bold mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Professional clinical documentation workflow</p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className={`px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 ${showForm ? 'bg-slate-800 text-slate-400' : 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95'}`}
                    >
                        {showForm ? 'Close Editor' : <><Plus size={12} /> New Record</>}
                    </button>
                </div>

                {showForm && (
                    <div className="space-y-4 animate-slide-up bg-white/5 p-4 rounded-2xl border border-white/5 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {!initialPatientId && <PatientSelect value={selectedPatient?.id} onSelect={setSelectedPatient} theme={theme} />}
                            <DoctorSelect value={selectedDoctor?.id} onSelect={setSelectedDoctor} theme={theme} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Subjective (S)</label>
                                    <VoiceCharting onTranscript={(t) => setForm({ ...form, subjective: t })} currentText={form.subjective} theme={theme} />
                                </div>
                                <textarea
                                    placeholder="Chief complaints..."
                                    value={form.subjective}
                                    onChange={e => setForm({ ...form, subjective: e.target.value })}
                                    className={`w-full h-16 rounded-xl p-2.5 text-[10px] font-bold border outline-none transition-all ${isDark ? 'bg-slate-950 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 focus:border-primary'}`}
                                />
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Objective (O)</label>
                                    <VoiceCharting onTranscript={(t) => setForm({ ...form, objective: t })} currentText={form.objective} theme={theme} />
                                </div>
                                <textarea
                                    placeholder="Clinical findings..."
                                    value={form.objective}
                                    onChange={e => setForm({ ...form, objective: e.target.value })}
                                    className={`w-full h-16 rounded-xl p-2.5 text-[10px] font-bold border outline-none transition-all ${isDark ? 'bg-slate-950 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 focus:border-primary'}`}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest text-emerald-500">Assessment (A)</label>
                                    <div className="flex gap-1.5">
                                         <button 
                                             onClick={handleAIEnhance} 
                                             disabled={isAIAnalyzing}
                                             className={`p-1 rounded-lg transition-all ${isAIAnalyzing ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'}`}
                                             title="AI Symptoms Analysis"
                                         >
                                             {isAIAnalyzing ? <Activity size={10} className="animate-spin" /> : <Sparkles size={10} />}
                                         </button>
                                         <VoiceCharting onTranscript={(t) => setForm({ ...form, assessment: t })} currentText={form.assessment} theme={theme} />
                                     </div>
                                </div>
                                <textarea
                                    placeholder="Diagnosis, differential..."
                                    value={form.assessment}
                                    onChange={e => setForm({ ...form, assessment: e.target.value })}
                                    className={`w-full h-20 rounded-xl p-3 text-[11px] font-bold border outline-none transition-all ${isDark ? 'bg-slate-950 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 focus:border-primary'}`}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest text-primary">Plan (P)</label>
                                    <VoiceCharting onTranscript={(t) => setForm({ ...form, plan: t })} currentText={form.plan} theme={theme} />
                                </div>
                                <textarea
                                    placeholder="Treatment plan, follow-up..."
                                    value={form.plan}
                                    onChange={e => setForm({ ...form, plan: e.target.value })}
                                    className={`w-full h-20 rounded-xl p-3 text-[11px] font-bold border outline-none transition-all ${isDark ? 'bg-slate-950 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 focus:border-primary'}`}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setShowForm(false)}
                                className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest ${isDark ? 'bg-white/5 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'} transition-all`}
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-6 py-2 bg-primary text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-premium shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSaving ? <Activity size={12} className="animate-spin" /> : <Save size={12} />}
                                Commit Note
                            </button>
                        </div>
                    </div>
                )}

                {/* Notes History */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <History size={14} className="text-slate-500" />
                        <h4 className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 underline decoration-primary/30 underline-offset-4">Chronological Record Flow</h4>
                    </div>

                    {notes.length > 0 ? notes.map((note) => (
                        <div key={note.id} className={`p-4 rounded-2xl border transition-all hover:shadow-lg ${isDark ? 'bg-white/3 border-white/5 hover:border-white/10' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}>
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                        <Brain size={14} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-xs">Progress Note</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="flex items-center gap-0.5 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                                <Calendar size={10} />
                                                {new Date(note.created_at).toLocaleDateString()}
                                            </span>
                                            <span className="w-0.5 h-0.5 rounded-full bg-slate-600" />
                                            <span className="flex items-center gap-0.5 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                                <User size={10} />
                                                Verified
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[7px] font-black uppercase tracking-widest">Signed</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                {[
                                    { label: 'S', content: note.subjective, color: 'text-amber-500' },
                                    { label: 'O', content: note.objective, color: 'text-blue-500' },
                                    { label: 'A', content: note.assessment, color: 'text-emerald-500' },
                                    { label: 'P', content: note.plan, color: 'text-primary' }
                                ].map((field, idx) => (
                                    <div key={idx} className={`p-3 rounded-xl ${isDark ? 'bg-black/20' : 'bg-white'} border ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                                        <p className={`text-[8px] font-black uppercase tracking-widest mb-1.5 ${field.color}`}>{field.label}</p>
                                        <p className={`text-[10px] font-medium leading-relaxed italic ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {field.content || 'N/A'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )) : (
                        <div className="py-20 text-center border-2 border-dashed border-slate-100/10 rounded-[3rem] flex flex-col items-center">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-primary/5 flex items-center justify-center text-primary/30 mb-4">
                                <FileText size={32} />
                            </div>
                            <p className="font-medium text-slate-500">No clinical notes recorded for this patient context.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
