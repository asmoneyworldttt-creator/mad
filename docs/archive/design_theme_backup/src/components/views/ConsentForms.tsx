import { useState, useEffect } from 'react';
import { ClipboardCheck, FileSignature, Plus, Download, CheckCircle, Eye, Printer } from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';

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
    const [patientSearch, setPatientSearch] = useState('');
    const [patientResults, setPatientResults] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [doctorName, setDoctorName] = useState('Dr. S. Jenkins');
    const [customBody, setCustomBody] = useState('');
    const [signatureConfirmed, setSignatureConfirmed] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);

    useEffect(() => {
        fetchForms();
    }, []);

    useEffect(() => {
        setCustomBody(selectedTemplate.body.replace('[DOCTOR_NAME]', doctorName));
    }, [selectedTemplate, doctorName]);

    const fetchForms = async () => {
        const { data } = await supabase
            .from('consent_forms')
            .select('*, patients(name)')
            .order('created_at', { ascending: false });
        if (data) setForms(data);
    };

    const searchPatients = async (q: string) => {
        setPatientSearch(q);
        if (q.length < 2) { setPatientResults([]); return; }
        const { data } = await supabase.from('patients').select('id, name, phone').ilike('name', `%${q}%`).limit(5);
        if (data) setPatientResults(data);
    };

    const saveForm = async () => {
        if (!selectedPatient) return showToast('Please select a patient', 'error');
        if (!signatureConfirmed) return showToast('Patient signature confirmation is required', 'error');

        const { error } = await supabase.from('consent_forms').insert({
            patient_id: selectedPatient.id,
            template_id: selectedTemplate.id,
            title: selectedTemplate.title,
            body: customBody,
            doctor_name: doctorName,
            status: 'Signed',
            signed_at: new Date().toISOString()
        });
        if (!error) {
            showToast('Consent form saved & signed', 'success');
            setShowCreate(false);
            setSelectedPatient(null);
            setPatientSearch('');
            setSignatureConfirmed(false);
            fetchForms();
        } else {
            showToast('Failed to save form', 'error');
        }
    };

    const printForm = (form: any) => {
        const html = `<!DOCTYPE html>
<html>
<head>
<title>${form.title} — ${form.patients?.name}</title>
<style>
  body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; color: #1e293b; padding: 40px; border: 2px solid #135bec; border-radius: 12px; }
  h1 { color: #135bec; font-size: 22px; margin-bottom: 4px; }
  .subtitle { color: #64748b; font-size: 14px; margin-bottom: 24px; }
  .body { white-space: pre-wrap; font-size: 14px; line-height: 1.8; color: #334155; }
  .patient-row { background: #f0f7ff; padding: 12px 16px; border-radius: 8px; margin: 20px 0; font-size: 14px; }
  .sig-row { display: flex; justify-content: space-between; margin-top: 60px; }
  .sig-block { text-align: center; min-width: 200px; }
  .sig-line { border-top: 1px solid #1e293b; padding-top: 8px; margin-top: 50px; font-size: 13px; }
  @media print { body { border: none; } }
</style>
</head>
<body>
  <h1>${form.title}</h1>
  <div class="subtitle">DentiSphere Clinic · ${form.doctor_name} · Date: ${new Date(form.signed_at || form.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
  <div class="patient-row"><strong>Patient:</strong> ${form.patients?.name} &nbsp;&nbsp; <strong>Status:</strong> ${form.status}</div>
  <div class="body">${form.body}</div>
  <div class="sig-row">
    <div class="sig-block"><div class="sig-line">Patient Signature</div></div>
    <div class="sig-block"><div class="sig-line">${form.doctor_name}</div></div>
  </div>
</body>
</html>`;
        const win = window.open('', '_blank');
        if (win) { win.document.write(html); win.document.close(); win.print(); }
    };

    return (
        <div className="animate-slide-up space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Consent Forms</h2>
                    <p className={`text-sm font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Digital informed consent with audit trail
                    </p>
                </div>
                <button onClick={() => { setShowCreate(true); setPreviewMode(false); }}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 hover:bg-primary/90 transition-all active:scale-95">
                    <Plus size={18} /> New Form
                </button>
            </div>

            {/* Create Form */}
            {showCreate && (
                <div className={`p-8 rounded-[2rem] border animate-slide-up ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="flex items-center gap-3 mb-6">
                        <FileSignature size={24} className="text-primary" />
                        <h3 className="font-bold text-lg">New Consent Form</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Patient Search */}
                        <div className="relative md:col-span-2">
                            <label className={`text-[9px] font-extrabold uppercase tracking-widest block mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Patient</label>
                            <input placeholder="Search patient name..." value={patientSearch} onChange={e => searchPatients(e.target.value)}
                                className={`w-full rounded-2xl px-5 py-4 font-bold text-sm outline-none border transition-all ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 focus:border-primary'}`} />
                            {selectedPatient && <p className="text-xs font-bold text-primary mt-1 pl-1">✓ {selectedPatient.name}</p>}
                            {patientResults.length > 0 && (
                                <div className={`absolute top-full mt-2 w-full z-50 rounded-2xl border shadow-xl overflow-hidden ${isDark ? 'bg-slate-800 border-white/10' : 'bg-white border-slate-100'}`}>
                                    {patientResults.map(p => (
                                        <div key={p.id} onClick={() => { setSelectedPatient(p); setPatientSearch(p.name); setPatientResults([]); }}
                                            className={`px-5 py-4 cursor-pointer text-sm font-bold ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                                            {p.name} <span className={`font-normal text-xs ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>· {p.phone}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Template Selection */}
                        <div>
                            <label className={`text-[9px] font-extrabold uppercase tracking-widest block mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Consent Template</label>
                            <div className="space-y-2">
                                {CONSENT_TEMPLATES.map(t => (
                                    <button key={t.id} onClick={() => setSelectedTemplate(t)}
                                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-bold transition-all ${selectedTemplate.id === t.id ? 'bg-primary/10 border-primary/30 text-primary' : isDark ? 'bg-white/3 border-white/10 hover:border-white/20' : 'bg-slate-50 border-slate-200 hover:border-primary/30'}`}>
                                        {t.title}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Body Preview/Editor */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className={`text-[9px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Form Content</label>
                                <button onClick={() => setPreviewMode(!previewMode)} className="text-[9px] font-bold text-primary hover:underline uppercase tracking-widest flex items-center gap-1">
                                    <Eye size={10} /> {previewMode ? 'Edit' : 'Preview'}
                                </button>
                            </div>
                            {previewMode ? (
                                <div className={`h-64 overflow-y-auto rounded-2xl p-5 text-xs leading-relaxed whitespace-pre-wrap font-medium border ${isDark ? 'bg-white/3 border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                    {customBody}
                                </div>
                            ) : (
                                <textarea value={customBody} onChange={e => setCustomBody(e.target.value)}
                                    className={`w-full h-64 rounded-2xl p-5 text-xs font-medium leading-relaxed outline-none border resize-none transition-all ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 focus:border-primary'}`} />
                            )}
                        </div>

                        {/* Doctor Name */}
                        <div>
                            <label className={`text-[9px] font-extrabold uppercase tracking-widest block mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Doctor Name</label>
                            <input value={doctorName} onChange={e => setDoctorName(e.target.value)}
                                className={`w-full rounded-2xl px-5 py-4 font-bold text-sm outline-none border transition-all ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 focus:border-primary'}`} />
                        </div>

                        {/* Signature Checkbox */}
                        <div className={`md:col-span-2 p-5 rounded-2xl border cursor-pointer transition-all ${signatureConfirmed ? 'bg-emerald-500/10 border-emerald-500/30' : isDark ? 'bg-white/3 border-white/10 hover:border-white/20' : 'bg-slate-50 border-slate-200 hover:border-primary/30'}`}
                            onClick={() => setSignatureConfirmed(!signatureConfirmed)}>
                            <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border-2 transition-all ${signatureConfirmed ? 'bg-emerald-500 border-emerald-500' : isDark ? 'border-white/20' : 'border-slate-300'}`}>
                                    {signatureConfirmed && <CheckCircle size={18} className="text-white" />}
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Patient Signature Obtained</p>
                                    <p className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        I confirm that the patient has read, understood, and signed this consent form in person.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button onClick={saveForm} className="px-8 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
                            <ClipboardCheck size={16} /> Save & Sign
                        </button>
                        <button onClick={() => setShowCreate(false)} className={`px-8 py-3 rounded-2xl font-bold transition-all ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Forms List */}
            <div className="space-y-4">
                {forms.map(form => (
                    <div key={form.id} className={`p-6 rounded-[2rem] border flex items-center justify-between gap-4 transition-all group ${isDark ? 'bg-slate-900 border-white/5 hover:border-white/10' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-primary/10 text-primary' : 'bg-blue-50 text-blue-600'}`}>
                                <FileSignature size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">{form.title}</h4>
                                <div className="flex items-center gap-3 mt-0.5">
                                    <p className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{form.patients?.name}</p>
                                    <span className="text-[9px] font-extrabold px-2.5 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full uppercase tracking-widest">✓ {form.status}</span>
                                    <p className={`text-[9px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{new Date(form.signed_at || form.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => printForm(form)} className={`p-3 rounded-xl border transition-all hover:scale-105 active:scale-95 ${isDark ? 'bg-white/5 border-white/10 text-slate-300 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-primary/5 hover:text-primary hover:border-primary/20'}`} title="Print / Export PDF">
                            <Printer size={16} />
                        </button>
                    </div>
                ))}
                {forms.length === 0 && (
                    <div className={`py-20 text-center rounded-[2rem] border-2 border-dashed ${isDark ? 'border-white/5 text-slate-600' : 'border-slate-200 text-slate-400'}`}>
                        <ClipboardCheck size={40} className="mx-auto mb-4 opacity-30" />
                        <p className="font-medium">No consent forms yet. Click "New Form" to start.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
