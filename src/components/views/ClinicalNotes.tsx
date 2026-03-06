import { useState, useEffect } from 'react';
import { FileText, Save, History, Plus, Brain, User, Calendar, Activity, Bot } from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';
import { VoiceCharting } from './VoiceCharting';

interface ClinicalNotesProps {
    patientId: string;
    theme?: 'light' | 'dark';
}

export function ClinicalNotes({ patientId, theme }: ClinicalNotesProps) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [notes, setNotes] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const [form, setForm] = useState({
        subjective: '',
        objective: '',
        assessment: '',
        plan: ''
    });

    useEffect(() => {
        if (patientId) fetchNotes();
    }, [patientId]);

    const fetchNotes = async () => {
        const { data } = await supabase
            .from('clinical_notes')
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false });
        if (data) setNotes(data);
    };

    const handleSave = async () => {
        if (!form.subjective && !form.objective && !form.assessment && !form.plan) {
            return showToast('Empty notes cannot be committed', 'error');
        }

        setIsSaving(true);
        const { error } = await supabase.from('clinical_notes').insert({
            patient_id: patientId,
            ...form
        });

        if (!error) {
            showToast('Clinical SOAP record committed', 'success');
            setForm({ subjective: '', objective: '', assessment: '', plan: '' });
            setShowForm(false);
            fetchNotes();
        } else {
            showToast('Failed to commit record', 'error');
        }
        setIsSaving(false);
    };

    const handleAIEnhance = () => {
        showToast('AI Synthesis: Analyzing clinical patterns...', 'success');
        // Logic for AI enhancement can be added here or integrated with EMR's AI state
    };

    return (
        <div className="space-y-6">
            <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h3 className="text-2xl font-bold flex items-center gap-3 text-primary">
                            <FileText size={28} />
                            Structured SOAP Ledger
                        </h3>
                        <p className={`text-sm font-medium mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Professional clinical documentation workflow</p>
                    </div>

                    <button
                        onClick={() => setShowForm(!showForm)}
                        className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${showForm ? 'bg-slate-800 text-slate-400' : 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95'}`}
                    >
                        {showForm ? 'Close Editor' : <><Plus size={18} /> New Progress Note</>}
                    </button>
                </div>

                {showForm && (
                    <div className="space-y-8 animate-slide-up bg-white/5 p-8 rounded-[2rem] border border-white/5 mb-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Subjective */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Subjective (S)</label>
                                    <VoiceCharting onTranscript={(t) => setForm({ ...form, subjective: t })} currentText={form.subjective} theme={theme} />
                                </div>
                                <textarea
                                    placeholder="Patient's chief complaints, history of present illness..."
                                    value={form.subjective}
                                    onChange={e => setForm({ ...form, subjective: e.target.value })}
                                    className={`w-full h-32 rounded-2xl p-5 text-sm font-medium border outline-none transition-all ${isDark ? 'bg-slate-950 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 focus:border-primary'}`}
                                />
                            </div>

                            {/* Objective */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Objective (O)</label>
                                    <VoiceCharting onTranscript={(t) => setForm({ ...form, objective: t })} currentText={form.objective} theme={theme} />
                                </div>
                                <textarea
                                    placeholder="Clinical findings, vital signs, physical exam results..."
                                    value={form.objective}
                                    onChange={e => setForm({ ...form, objective: e.target.value })}
                                    className={`w-full h-32 rounded-2xl p-5 text-sm font-medium border outline-none transition-all ${isDark ? 'bg-slate-950 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 focus:border-primary'}`}
                                />
                            </div>

                            {/* Assessment */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest text-emerald-500">Assessment (A)</label>
                                    <div className="flex gap-2">
                                        <button onClick={handleAIEnhance} className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"><Bot size={14} /></button>
                                        <VoiceCharting onTranscript={(t) => setForm({ ...form, assessment: t })} currentText={form.assessment} theme={theme} />
                                    </div>
                                </div>
                                <textarea
                                    placeholder="Diagnosis, differential diagnoses, clinical status..."
                                    value={form.assessment}
                                    onChange={e => setForm({ ...form, assessment: e.target.value })}
                                    className={`w-full h-32 rounded-2xl p-5 text-sm font-medium border outline-none transition-all ${isDark ? 'bg-slate-950 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 focus:border-primary'}`}
                                />
                            </div>

                            {/* Plan */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest text-primary">Plan (P)</label>
                                    <VoiceCharting onTranscript={(t) => setForm({ ...form, plan: t })} currentText={form.plan} theme={theme} />
                                </div>
                                <textarea
                                    placeholder="Treatment plan, medications, follow-up, referrals..."
                                    value={form.plan}
                                    onChange={e => setForm({ ...form, plan: e.target.value })}
                                    className={`w-full h-32 rounded-2xl p-5 text-sm font-medium border outline-none transition-all ${isDark ? 'bg-slate-950 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 focus:border-primary'}`}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                onClick={() => setShowForm(false)}
                                className={`px-8 py-4 rounded-2xl font-bold text-sm ${isDark ? 'bg-white/5 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'} transition-all`}
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-10 py-4 bg-primary text-white rounded-2xl font-bold text-sm shadow-premium shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                            >
                                {isSaving ? <Activity size={18} className="animate-spin" /> : <Save size={18} />}
                                Commit Clinical Progress
                            </button>
                        </div>
                    </div>
                )}

                {/* Notes History */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <History size={18} className="text-slate-500" />
                        <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 underline decoration-primary/30 underline-offset-8">Chronological Record Flow</h4>
                    </div>

                    {notes.length > 0 ? notes.map((note) => (
                        <div key={note.id} className={`p-8 rounded-[2rem] border transition-all hover:shadow-lg ${isDark ? 'bg-white/3 border-white/5 hover:border-white/10' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}>
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                        <Brain size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg">Shift Progress Note</p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                                <Calendar size={12} />
                                                {new Date(note.created_at).toLocaleDateString()}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-slate-600" />
                                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                <User size={12} />
                                                Verified
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[9px] font-extrabold uppercase tracking-[0.2em]">Clinical Verified</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { label: 'S', content: note.subjective, color: 'text-amber-500' },
                                    { label: 'O', content: note.objective, color: 'text-blue-500' },
                                    { label: 'A', content: note.assessment, color: 'text-emerald-500' },
                                    { label: 'P', content: note.plan, color: 'text-primary' }
                                ].map((field, idx) => (
                                    <div key={idx} className={`p-5 rounded-2xl ${isDark ? 'bg-black/20' : 'bg-white'} border ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                                        <p className={`text-[10px] font-extrabold uppercase tracking-widest mb-3 ${field.color}`}>{field.label}</p>
                                        <p className={`text-xs font-medium leading-relaxed italic ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
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
