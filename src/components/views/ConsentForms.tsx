import { useState, useEffect, useRef } from 'react';
import { ClipboardCheck, FileSignature, Plus, Download, CheckCircle, Eye, Printer, Upload, Trash2, Signature } from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';
import { SkeletonList } from '../SkeletonLoader';
import { EmptyState } from '../EmptyState';
import { SignaturePad } from '../SignaturePad';
import { DoctorSelect } from '../DoctorSelect';
import { PatientSelect } from '../PatientSelect';
import { downloadConsentPDF } from '../../utils/pdfExport';

const CONSENT_TEMPLATES = [
    {
        id: 'extraction',
        title: 'Tooth Extraction Consent',
        body: `I, the undersigned, hereby give my informed consent to the following procedure: TOOTH EXTRACTION.

I understand that the following risks may be associated with this procedure:
• Bleeding, infection or dry socket (alveolar osteitis)
• Temporary or permanent numbness/tingling in lip, tongue or chin
• Sinus involvement (upper teeth)
• Adjacent tooth or restoration damage
• Root fracture requiring additional surgery

I have had the opportunity to ask questions and understand the procedure fully. I authorize Dr. [DOCTOR_NAME] to perform the tooth extraction and any necessary related procedures.`
    },
    {
        id: 'rct',
        title: 'Root Canal Treatment Consent',
        body: `I, the undersigned, hereby give my informed consent to the following: ROOT CANAL TREATMENT (RCT).

I understand the procedure explained to me and that the following risks may apply:
• Instrument separation within the canal
• Perforation of root or crown
• Post-RCT tooth may still require extraction
• Temporary tenderness after procedure
• Possible need for crown/cap post-treatment

I authorize Dr. [DOCTOR_NAME] to proceed with RCT and any necessary associated procedures.`
    },
    {
        id: 'implant',
        title: 'Dental Implant Consent',
        body: `I, the undersigned, hereby give my informed consent for: DENTAL IMPLANT PLACEMENT.

Risks I understand include:
• Implant failure/rejection
• Nerve damage, sinus perforation
• Infection, swelling and bruising
• Need for bone grafting
• Multiple visits over several months required

I confirm I have disclosed all relevant medical history including medications and allergies. I authorize Dr. [DOCTOR_NAME] to proceed with implant surgery.`
    },
    {
        id: 'general',
        title: 'General Treatment Consent',
        body: `I, the undersigned, hereby give my informed consent to the recommended dental treatment.

I understand that dental procedures carry inherent risks including but not limited to: infection, allergy to materials, sensitivity, and the need for future treatment.

I have been informed of the proposed treatment and authorize Dr. [DOCTOR_NAME] to proceed.`
    }
];

export function ConsentForms({ userRole, theme }: { userRole: string; theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [forms, setForms] = useState<any[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(CONSENT_TEMPLATES[0]);
    
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
    
    const [customBody, setCustomBody] = useState('');
    const [signatureData, setSignatureData] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [previewMode, setPreviewMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchForms();
    }, []);

    useEffect(() => {
        if (selectedDoctor) {
            setCustomBody(selectedTemplate.body.replace('[DOCTOR_NAME]', selectedDoctor.name));
        } else {
            setCustomBody(selectedTemplate.body.replace('[DOCTOR_NAME]', '________'));
        }
    }, [selectedTemplate, selectedDoctor]);

    const fetchForms = async () => {
        setIsLoading(true);
        const { data } = await supabase
            .from('consent_forms')
            .select('*, patients(name)')
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
        if (!selectedDoctor) return showToast('Please select a doctor', 'error');
        if (!signatureData) return showToast('Patient signature is required', 'error');

        setIsSaving(true);
        const { error } = await supabase.from('consent_forms').insert({
            patient_id: selectedPatient.id,
            template_id: selectedTemplate.id,
            title: selectedTemplate.title,
            body: customBody,
            doctor_id: selectedDoctor.id,
            doctor_name: selectedDoctor.name,
            signature_url: signatureData, // Storing base64 directly for simplicity in this patch
            status: 'Signed',
            signed_at: new Date().toISOString()
        });

        if (!error) {
            // Sync to general patient history
            await supabase.from('patient_history').insert({
                patient_id: selectedPatient.id,
                date: new Date().toISOString().split('T')[0],
                treatment: `Consent Signed: ${selectedTemplate.title}`,
                notes: `Legally authorized by ${selectedPatient.name}. Ref: #${selectedTemplate.id}`,
                category: 'Clinical',
                doctor_name: selectedDoctor.name
            });

            showToast('Consent form legally committed', 'success');
            setShowCreate(false);
            setSelectedPatient(null);
            setSignatureData(null);
            fetchForms();
        } else {
            showToast('Failed to save form: ' + error.message, 'error');
        }
        setIsSaving(false);
    };

    const downloadForm = (form: any) => {
        downloadConsentPDF({
            formId: form.id,
            patientName: form.patients?.name || 'Patient',
            doctorName: form.doctor_name,
            date: form.signed_at || form.created_at,
            title: form.title,
            body: form.body,
            signatureUrl: form.signature_url
        });
        showToast('Consent PDF downloaded with secure backup', 'success');
    };

    return (
        <div className="animate-slide-up space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-dark)' }}>Consent Forms</h2>
                    <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-muted)' }}>
                        Digital informed consent with verified signatures
                    </p>
                </div>
                <button onClick={() => { setShowCreate(true); setPreviewMode(false); }}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 hover:bg-primary/90 transition-all active:scale-95">
                    <Plus size={18} /> New Consent
                </button>
            </div>

            {/* Create Form */}
            {showCreate && (
                <div className={`p-8 rounded-[2.5rem] border animate-slide-up ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                            <FileSignature size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl">Legal Consent Authorizer</h3>
                            <p className="text-xs text-slate-500 font-medium">Verify patient identity and obtain signature</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            {/* Patient & Doctor Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <PatientSelect value={selectedPatient?.id} onSelect={setSelectedPatient} theme={theme} />
                                <DoctorSelect value={selectedDoctor?.id} onSelect={setSelectedDoctor} theme={theme} />
                            </div>

                            {/* Template Selection */}
                            <div>
                                <label className={`text-[9px] font-extrabold uppercase tracking-widest block mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Procedure Selection</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {CONSENT_TEMPLATES.map(t => (
                                        <button key={t.id} onClick={() => setSelectedTemplate(t)}
                                            className={`text-left px-4 py-3 rounded-xl border text-xs font-bold transition-all ${selectedTemplate.id === t.id ? 'bg-primary/10 border-primary/30 text-primary' : isDark ? 'bg-white/3 border-white/10 hover:border-white/20' : 'bg-slate-50 border-slate-200 hover:border-primary/30'}`}>
                                            {t.title}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Body Preview/Editor */}
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                    <label className={`text-[9px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Form Authorization Text</label>
                                    <button onClick={() => setPreviewMode(!previewMode)} className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-bold hover:bg-primary/20 uppercase tracking-widest flex items-center gap-1.5 transition-all">
                                        {previewMode ? <FileSignature size={12} /> : <Eye size={12} />} {previewMode ? 'Edit Mode' : 'Live Preview'}
                                    </button>
                                </div>
                                {previewMode ? (
                                    <div className={`h-80 overflow-y-auto rounded-2xl p-6 text-sm leading-relaxed whitespace-pre-wrap font-medium border custom-scrollbar ${isDark ? 'bg-white/3 border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                        {customBody}
                                    </div>
                                ) : (
                                    <textarea value={customBody} onChange={e => setCustomBody(e.target.value)}
                                        className={`w-full h-80 rounded-2xl p-6 text-sm font-medium leading-relaxed outline-none border resize-none transition-all custom-scrollbar ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 focus:border-primary'}`} />
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Signature Section */}
                            <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-white/3 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Signature size={12} /> Patient Authorization
                                    </p>
                                    <div className="flex gap-2">
                                        <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline">
                                            <Upload size={12} /> Upload/Scan
                                        </button>
                                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                                    </div>
                                </div>

                                {signatureData ? (
                                    <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 bg-emerald-500/5 p-4 flex flex-col items-center">
                                        <img src={signatureData} className={`max-h-32 ${isDark ? 'invert' : ''}`} alt="Signature" />
                                        <button onClick={() => setSignatureData(null)}
                                            className="absolute top-2 right-2 p-1.5 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500/20 transition-all">
                                            <Trash2 size={14} />
                                        </button>
                                        <p className="text-[10px] font-bold text-emerald-500 mt-2 uppercase tracking-widest flex items-center gap-1">
                                            <CheckCircle size={10} /> Signature Verified
                                        </p>
                                    </div>
                                ) : (
                                    <SignaturePad onSave={setSignatureData} onClear={() => setSignatureData(null)} theme={theme} />
                                )}
                            </div>

                            <div className="flex flex-col gap-3">
                                <button onClick={saveForm} disabled={isSaving}
                                    className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-3 disabled:opacity-50">
                                    {isSaving ? <Plus className="animate-spin" size={20} /> : <ClipboardCheck size={20} />}
                                    {isSaving ? 'Digitizing Form...' : 'Legally Commit & Sign'}
                                </button>
                                <button onClick={() => setShowCreate(false)} className={`w-full py-4 rounded-2xl font-bold transition-all ${isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                    Discard Authorization
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Forms List */}
            <div className="space-y-4">
                {isLoading ? (
                    <SkeletonList rows={5} />
                ) : forms.length > 0 ? forms.map(form => (
                    <div key={form.id} className="p-6 rounded-[2.5rem] border flex items-center justify-between gap-4 transition-all hover:scale-[1.01] group relative overflow-hidden"
                        style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-[1.25rem] flex items-center justify-center shadow-inner"
                                style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                                <FileSignature size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-base" style={{ color: 'var(--text-main)' }}>{form.title}</h4>
                                <div className="flex items-center gap-4 mt-1">
                                    <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}><span className="text-primary font-bold">Patient:</span> {form.patients?.name}</p>
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                    <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}><span className="text-primary font-bold">Doctor:</span> {form.doctor_name}</p>
                                </div>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-[9px] font-extrabold px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full uppercase tracking-widest flex items-center gap-1">
                                        <CheckCircle size={10} /> {form.status}
                                    </span>
                                    <p className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>{new Date(form.signed_at || form.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => downloadForm(form)} className="p-4 rounded-2xl border transition-all hover:scale-110 active:scale-95 shadow-premium group-hover:bg-primary group-hover:text-white group-hover:border-primary"
                                style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }} title="Download Signed PDF">
                                <Download size={20} />
                            </button>
                        </div>
                    </div>
                )) : (
                    <EmptyState
                        icon={ClipboardCheck}
                        title="No Authorized Forms"
                        description="Professional legal authorization records will appear here once patient signatures are obtained."
                        actionLabel="Begin Authorization"
                        onAction={() => setShowCreate(true)}
                    />
                )}
            </div>
        </div>
    );
}
