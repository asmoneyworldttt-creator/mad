import { useState, useEffect, useRef } from 'react';
import { FileSignature, Plus, Download, CheckCircle, Eye, Printer, Upload, Trash2, Signature, FileText, ClipboardCheck } from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';
import { SkeletonList } from '../SkeletonLoader';
import { EmptyState } from '../EmptyState';
import { SignaturePad } from '../SignaturePad';
import { DoctorSelect } from '../DoctorSelect';
import { PatientSelect } from '../PatientSelect';
import { downloadMedicalClearancePDF } from '../../utils/pdfExport';

export function MedicalClearance({ userRole, theme }: { userRole: string; theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [forms, setForms] = useState<any[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    
    // Form States
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
    const [physicianName, setPhysicianName] = useState('');
    const [provisionalDiagnosis, setProvisionalDiagnosis] = useState('');
    const [proposedTreatment, setProposedTreatment] = useState('');
    const [medicalHistory, setMedicalHistory] = useState('');
    const [currentMedications, setCurrentMedications] = useState('');
    
    // Physician Feedback (Filled when received)
    const [fitnessStatus, setFitnessStatus] = useState('Pending');
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [status, setStatus] = useState('Pending'); // Overall Tracker: Pending / Received

    const [signatureData, setSignatureData] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [previewMode, setPreviewMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchForms();
    }, []);

    const fetchForms = async () => {
        setIsLoading(true);
        const { data } = await supabase
            .from('medical_clearances')
            .select('*, patients(name, age)') // Pull patient name and age
            .order('created_at', { ascending: false });
        if (data) setForms(data);
        setIsLoading(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSignatureData(reader.result as string);
                showToast('Signature scanned successfully', 'success');
            };
            reader.readAsDataURL(file);
        }
    };

    const saveForm = async () => {
        if (!selectedPatient) return showToast('Please select a patient', 'error');
        if (!selectedDoctor) return showToast('Please select a referring doctor', 'error');

        setIsSaving(true);
        const { error } = await supabase.from('medical_clearances').insert({
            patient_id: selectedPatient.id,
            doctor_id: selectedDoctor.id,
            doctor_name: selectedDoctor.name,
            physician_name: physicianName,
            provisional_diagnosis: provisionalDiagnosis,
            proposed_treatment: proposedTreatment,
            medical_history: medicalHistory,
            current_medications: currentMedications,
            fitness_status: fitnessStatus,
            special_instructions: specialInstructions,
            status: status,
            signature_url: signatureData,
            signed_at: new Date().toISOString()
        });

        if (!error) {
            await supabase.from('patient_history').insert({
                patient_id: selectedPatient.id,
                date: new Date().toISOString().split('T')[0],
                treatment: `Medical Clearance Requested: To ${physicianName}`,
                notes: `Referred by Dr. ${selectedDoctor.name}. Status: ${status}`,
                category: 'Clinical',
                doctor_name: selectedDoctor.name
            });

            showToast('Medical Clearance Record Saved', 'success');
            setShowCreate(false);
            resetForm();
            fetchForms();
        } else {
            showToast('Failed to save record: ' + error.message, 'error');
        }
        setIsSaving(false);
    };

    const resetForm = () => {
        setSelectedPatient(null);
        setPhysicianName('');
        setProvisionalDiagnosis('');
        setProposedTreatment('');
        setMedicalHistory('');
        setCurrentMedications('');
        setFitnessStatus('Pending');
        setSpecialInstructions('');
        setStatus('Pending');
        setSignatureData(null);
    };

    const downloadForm = (form: any) => {
        downloadMedicalClearancePDF({
            formId: form.id,
            date: form.signed_at || form.created_at,
            patientName: form.patients?.name || 'Patient',
            patientAge: form.patients?.age?.toString() || 'N/A',
            doctorName: form.doctor_name,
            physicianName: form.physician_name,
            provisionalDiagnosis: form.provisional_diagnosis,
            proposedTreatment: form.proposed_treatment,
            medicalHistory: form.medical_history,
            currentMedications: form.current_medications,
            fitnessStatus: form.fitness_status,
            specialInstructions: form.special_instructions,
            signatureUrl: form.signature_url
        });
        showToast('Medical Clearance PDF downloaded', 'success');
    };

    return (
        <div className="animate-slide-up space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-dark)' }}>Medical Opinion & Clearance</h2>
                    <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-muted)' }}>
                        Physician referrals and evaluation management
                    </p>
                </div>
                <button onClick={() => { setShowCreate(true); setPreviewMode(false); }}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 hover:bg-primary/90 transition-all active:scale-95">
                    <Plus size={18} /> New Request
                </button>
            </div>

            {showCreate && (
                <div className={`p-8 rounded-[2.5rem] border animate-slide-up ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl">Generate Medical Request</h3>
                            <p className="text-xs text-slate-500 font-medium">Create a clearance letter for external Physicians</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-5">
                            {/* 1. Header Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <PatientSelect value={selectedPatient?.id} onSelect={setSelectedPatient} theme={theme} />
                                <DoctorSelect value={selectedDoctor?.id} onSelect={setSelectedDoctor} theme={theme} />
                            </div>

                            <div>
                                <label className={`text-[9px] font-extrabold uppercase tracking-widest block mb-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>To (Physician / Specialist Details)</label>
                                <input type="text" value={physicianName} onChange={e => setPhysicianName(e.target.value)} placeholder="e.g. Dr. Jane Doe (Cardiologist)"
                                    className={`w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none transition-all ${isDark ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-200 focus:border-primary'}`} />
                            </div>

                            {/* 2. Textareas for inputs */}
                            <div className="space-y-4">
                                <div>
                                    <label className={`text-[9px] font-extrabold uppercase tracking-widest block mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Provisional Diagnosis</label>
                                    <textarea value={provisionalDiagnosis} onChange={e => setProvisionalDiagnosis(e.target.value)} placeholder="What was observed clinically..."
                                        className={`w-full h-20 rounded-xl p-4 text-xs font-bold outline-none border resize-none transition-all ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 focus:border-primary'}`} />
                                </div>
                                <div>
                                    <label className={`text-[9px] font-extrabold uppercase tracking-widest block mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Proposed Dental Treatment</label>
                                    <textarea value={proposedTreatment} onChange={e => setProposedTreatment(e.target.value)} placeholder="e.g. Extraction / root canal / surgery..."
                                        className={`w-full h-20 rounded-xl p-4 text-xs font-bold outline-none border resize-none transition-all ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 focus:border-primary'}`} />
                                </div>
                                <div>
                                    <label className={`text-[9px] font-extrabold uppercase tracking-widest block mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Medical History</label>
                                    <textarea value={medicalHistory} onChange={e => setMedicalHistory(e.target.value)} placeholder="Diabetes, Hypertension, etc..."
                                        className={`w-full h-20 rounded-xl p-4 text-xs font-bold outline-none border resize-none transition-all ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 focus:border-primary'}`} />
                                </div>
                                <div>
                                    <label className={`text-[9px] font-extrabold uppercase tracking-widest block mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Current Medications</label>
                                    <textarea value={currentMedications} onChange={e => setCurrentMedications(e.target.value)} placeholder="Drugs being taken currently..."
                                        className={`w-full h-20 rounded-xl p-4 text-xs font-bold outline-none border resize-none transition-all ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 focus:border-primary'}`} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* 3. Physician Evaluation Checklist / Tracking */}
                            <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-white/3 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <Eye size={12} /> External Feedback Tracking
                                </p>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold block mb-1">Clearance Status</label>
                                        <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2 rounded-xl border font-bold text-xs bg-transparent">
                                            <option value="Pending">Pending</option>
                                            <option value="Received">Received</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="text-xs font-bold block mb-1">Fitness Evaluation (Placeholder for input/printing)</label>
                                        <select value={fitnessStatus} onChange={e => setFitnessStatus(e.target.value)} className="w-full px-3 py-2 rounded-xl border font-bold text-xs bg-transparent">
                                            <option value="Pending">Pending Evaluation</option>
                                            <option value="Fit">Fit for surgery</option>
                                            <option value="Fit with precautions">Fit with precautions</option>
                                            <option value="Unfit">Unfit</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold block mb-1">Special Instructions / Notes</label>
                                        <textarea value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)} placeholder="Antibiotics, stopping blood thinners, etc..."
                                            className="w-full h-16 rounded-xl border p-3 text-xs font-bold bg-transparent resize-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Digital Signature Canvas (Fallback / Audit) */}
                            <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-white/3 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Signature size={12} /> Authorization Cache
                                    </p>
                                </div>
                                {signatureData ? (
                                    <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 bg-emerald-500/5 p-3 flex flex-col items-center">
                                        <img src={signatureData} className={`max-h-24 ${isDark ? 'invert' : ''}`} alt="Signature" />
                                        <button onClick={() => setSignatureData(null)} className="absolute top-1 right-1 p-1 bg-rose-500/10 text-rose-500 rounded-lg"><Trash2 size={12} /></button>
                                    </div>
                                ) : (
                                    <SignaturePad onSave={setSignatureData} onClear={() => setSignatureData(null)} theme={theme} />
                                )}
                            </div>

                            <div className="flex flex-col gap-3">
                                <button onClick={saveForm} disabled={isSaving}
                                    className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-3 disabled:opacity-50">
                                    {isSaving ? <ClipboardCheck className="animate-spin" size={20} /> : <FileText size={20} />}
                                    {isSaving ? 'Logging Request...' : 'Log Clearance Record'}
                                </button>
                                <button onClick={() => setShowCreate(false)} className={`w-full py-4 rounded-2xl font-bold transition-all ${isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* List View */}
            <div className="space-y-4">
                {isLoading ? (
                    <SkeletonList rows={5} />
                ) : forms.length > 0 ? forms.map(form => (
                    <div key={form.id} className="p-6 rounded-[2.5rem] border flex items-center justify-between gap-4 transition-all hover:scale-[1.01] group relative overflow-hidden"
                        style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-[1.25rem] flex items-center justify-center shadow-inner"
                                style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                                <FileText size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-base" style={{ color: 'var(--text-main)' }}>Referral to: {form.physician_name}</h4>
                                <div className="flex items-center gap-4 mt-1">
                                    <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}><span className="text-primary font-bold">Patient:</span> {form.patients?.name}</p>
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                    <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}><span className="text-primary font-bold">From:</span> Dr. {form.doctor_name}</p>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`text-[9px] font-extrabold px-3 py-1 bg-opacity-10 border rounded-full uppercase tracking-widest flex items-center gap-1 ${form.status === 'Received' ? 'bg-emerald-500 border-emerald-500/20 text-emerald-500' : 'bg-amber-500 border-amber-500/20 text-amber-500'}`}>
                                        <CheckCircle size={10} /> {form.status}
                                    </span>
                                    <span className={`text-[9px] font-extrabold px-3 py-1 bg-slate-500/10 border border-slate-500/30 text-slate-500 rounded-full uppercase tracking-widest`}>
                                        {form.fitness_status}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => downloadForm(form)} className="p-4 rounded-xl border bg-primary text-white shadow-xl hover:scale-110 active:scale-95 transition-all text-xs font-bold flex items-center gap-2" title="Print Letter to PDF">
                                <Printer size={16} /> Print Letter
                            </button>
                        </div>
                    </div>
                )) : (
                    <EmptyState
                        icon={ClipboardCheck}
                        title="No Medical Clearance Records"
                        description="Professional referral requests for external physicians will appear here once generated."
                        actionLabel="Initiate Request"
                        onAction={() => setShowCreate(true)}
                    />
                )}
            </div>
        </div>
    );
}
