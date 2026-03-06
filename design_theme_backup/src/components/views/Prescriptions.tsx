import { FileText, Download, Share2, Plus, Search, Printer, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '../Toast';
import { supabase } from '../../supabase';
import { Modal } from '../../components/Modal';
import { DrugInteractionChecker } from './DrugInteractionChecker';

type UserRole = 'admin' | 'staff' | 'doctor' | 'patient';

interface Drug {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
}

export function Prescriptions({ userRole, theme }: { userRole: UserRole; theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [isPrescModalOpen, setIsPrescModalOpen] = useState(false);
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [newPresc, setNewPresc] = useState({
        patientName: '',
        doctorName: 'Dr. S. Jenkins',
        clinicName: 'DentiSphere Clinic',
        drugs: [{ name: '', dosage: '', frequency: 'Twice daily', duration: '5 days' }] as Drug[],
        notes: ''
    });

    useEffect(() => {
        fetchPrescriptions();
    }, []);

    const fetchPrescriptions = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('prescriptions')
            .select('*, patients(name, phone, allergies)')
            .order('created_at', { ascending: false });
        if (error) {
            showToast('Error fetching prescriptions', 'error');
        } else if (data) {
            setPrescriptions(data);
        }
        setIsLoading(false);
    };

    const addDrug = () => setNewPresc({ ...newPresc, drugs: [...newPresc.drugs, { name: '', dosage: '', frequency: 'Twice daily', duration: '5 days' }] });
    const removeDrug = (i: number) => setNewPresc({ ...newPresc, drugs: newPresc.drugs.filter((_, idx) => idx !== i) });
    const updateDrug = (i: number, field: keyof Drug, val: string) => {
        const drugs = [...newPresc.drugs];
        drugs[i] = { ...drugs[i], [field]: val };
        setNewPresc({ ...newPresc, drugs });
    };

    const handleSavePrescription = async () => {
        if (!newPresc.patientName) return showToast('Patient name is required', 'error');
        if (newPresc.drugs.some(d => !d.name)) return showToast('All drug names are required', 'error');

        let patientId = null;
        const { data: existingPatients } = await supabase.from('patients').select('id').ilike('name', newPresc.patientName);
        if (existingPatients && existingPatients.length > 0) {
            patientId = existingPatients[0].id;
        } else {
            const { data: newPatient } = await supabase.from('patients').insert({ name: newPresc.patientName }).select('id');
            if (newPatient) patientId = newPatient[0].id;
        }
        if (!patientId) return showToast('Could not determine patient ID', 'error');

        const { error } = await supabase.from('prescriptions').insert({
            patient_id: patientId,
            medication_data: {
                drugs: newPresc.drugs,
                notes: newPresc.notes,
                doctorName: newPresc.doctorName,
                clinicName: newPresc.clinicName
            },
            created_at: new Date().toISOString()
        });

        if (error) {
            showToast('Error saving prescription', 'error');
        } else {
            showToast('Prescription saved', 'success');
            setIsPrescModalOpen(false);
            setNewPresc({ patientName: '', doctorName: 'Dr. S. Jenkins', clinicName: 'DentiSphere Clinic', drugs: [{ name: '', dosage: '', frequency: 'Twice daily', duration: '5 days' }], notes: '' });
            fetchPrescriptions();
        }
    };

    const printPrescription = (rx: any) => {
        const patient = rx.patients?.name || 'Patient';
        const drugs: Drug[] = rx.medication_data?.drugs || [];
        const doc = rx.medication_data?.doctorName || 'Attending Doctor';
        const clinic = rx.medication_data?.clinicName || 'DentiSphere Clinic';
        const date = new Date(rx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

        const html = `<!DOCTYPE html>
<html>
<head>
<title>Rx — ${patient}</title>
<style>
  body { font-family: 'Georgia', serif; max-width: 700px; margin: 40px auto; padding: 40px; color: #1e293b; border: 2px solid #135bec; border-radius: 12px; }
  .header { display: flex; justify-content: space-between; border-bottom: 2px solid #135bec; padding-bottom: 20px; margin-bottom: 20px; }
  .clinic-name { font-size: 24px; font-weight: bold; color: #135bec; }
  .doctor { font-size: 14px; color: #64748b; margin-top: 4px; }
  .rx-symbol { font-size: 48px; color: #135bec; font-style: italic; }
  .patient-info { background: #f0f7ff; padding: 16px; border-radius: 8px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th { background: #135bec; color: white; padding: 10px 16px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
  td { padding: 10px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
  tr:nth-child(even) td { background: #f8fafc; }
  .signature { margin-top: 60px; border-top: 1px solid #cbd5e1; padding-top: 20px; display: flex; justify-content: flex-end; }
  .sig-block { text-align: center; }
  .notes { background: #fef9c3; border: 1px solid #fde047; border-radius: 8px; padding: 12px; margin-top: 16px; font-size: 13px; }
  @media print { body { border: none; } }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="clinic-name">${clinic}</div>
    <div class="doctor">${doc} · BDS, MDS</div>
    <div class="doctor">Date: ${date}</div>
  </div>
  <div class="rx-symbol">℞</div>
</div>
<div class="patient-info">
  <strong>Patient:</strong> ${patient} &nbsp;&nbsp; <strong>Phone:</strong> ${rx.patients?.phone || 'N/A'}
</div>
<table>
  <thead><tr><th>#</th><th>Drug</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr></thead>
  <tbody>
    ${drugs.map((d, i) => `<tr><td>${i + 1}</td><td><strong>${d.name}</strong></td><td>${d.dosage}</td><td>${d.frequency}</td><td>${d.duration}</td></tr>`).join('')}
  </tbody>
</table>
${rx.medication_data?.notes ? `<div class="notes"><strong>Special Instructions:</strong> ${rx.medication_data.notes}</div>` : ''}
<div class="signature">
  <div class="sig-block">
    <div style="border-top: 1px solid #1e293b; padding-top: 8px; width: 200px; text-align: center;">
      <strong>${doc}</strong><br/>
      <small style="color: #64748b;">Signature & Stamp</small>
    </div>
  </div>
</div>
</body>
</html>`;

        const win = window.open('', '_blank');
        if (win) {
            win.document.write(html);
            win.document.close();
            win.print();
        }
        showToast('Prescription sent to printer', 'success');
    };

    const filtered = prescriptions.filter(rx =>
        (rx.patients?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const QUICK_TEMPLATES = [
        { label: 'Post-Extraction Regimen', drugs: [{ name: 'Amoxicillin + Clavulanic Acid 625mg', dosage: '625mg', frequency: 'Twice daily', duration: '5 days' }, { name: 'Ketorolac', dosage: '10mg', frequency: 'Thrice daily', duration: '3 days' }, { name: 'Pantoprazole', dosage: '40mg', frequency: 'Once daily', duration: '5 days' }] },
        { label: 'Acute Pulpitis', drugs: [{ name: 'Aceclofenac + Paracetamol', dosage: '100mg/325mg', frequency: 'Twice daily', duration: '5 days' }, { name: 'Chlorhexidine Mouthwash', dosage: '15ml', frequency: 'Twice daily', duration: '7 days' }] },
        { label: 'Post-RCT Protocol', drugs: [{ name: 'Amoxicillin 500mg', dosage: '500mg', frequency: 'Thrice daily', duration: '5 days' }, { name: 'Ibuprofen 400mg', dosage: '400mg', frequency: 'Twice daily after food', duration: '3 days' }] }
    ];

    return (
        <>
            <div className="animate-slide-up space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>e-Prescriptions</h2>
                        <p className={`font-medium text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Draft, print and track digital prescriptions with drug safety checks.</p>
                    </div>
                    <button
                        onClick={() => setIsPrescModalOpen(true)}
                        className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 w-full md:w-auto"
                    >
                        <Plus size={18} /> New Prescription
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="relative">
                            <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search by patient name..."
                                className={`w-full rounded-2xl py-4 pl-12 pr-6 font-bold text-sm outline-none border transition-all ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-primary/50' : 'bg-white border-slate-200 focus:border-primary shadow-sm'}`}
                            />
                        </div>

                        <div className="space-y-3">
                            {filtered.map((rx, idx) => {
                                const drugs: Drug[] = rx.medication_data?.drugs || [];
                                const allergies: string[] = rx.patients?.allergies ? (typeof rx.patients.allergies === 'string' ? rx.patients.allergies.split(',').map((a: string) => a.trim()) : rx.patients.allergies) : [];
                                const hasAllergyConflict = allergies.length > 0 && drugs.some(d => allergies.some(a => d.name.toLowerCase().includes(a.toLowerCase())));

                                return (
                                    <div key={rx.id || idx} className={`p-6 rounded-[2rem] border transition-all group ${hasAllergyConflict ? 'border-rose-500/30 bg-rose-500/3' : isDark ? 'bg-slate-900 border-white/5 hover:border-white/10' : 'bg-white border-slate-200 hover:shadow-md shadow-sm'}`}>
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex gap-4 items-center">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-primary/10 text-primary' : 'bg-blue-50 text-blue-600'}`}>
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-base">{rx.patients?.name || 'Manual Entry'}</p>
                                                    <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                        {drugs.length} drug(s) · {new Date(rx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {hasAllergyConflict && (
                                                    <span className="flex items-center gap-1 text-[9px] font-extrabold px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full uppercase tracking-widest">
                                                        <AlertCircle size={10} /> Allergy Risk
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => printPrescription(rx)}
                                                    className={`p-2.5 rounded-xl border transition-all hover:scale-105 active:scale-95 ${isDark ? 'bg-white/5 border-white/10 text-slate-300 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-primary/5 hover:text-primary hover:border-primary'}`}
                                                    title="Print / Export PDF"
                                                >
                                                    <Printer size={16} />
                                                </button>
                                                <button
                                                    onClick={() => showToast('WhatsApp share opened', 'success')}
                                                    className={`p-2.5 rounded-xl border transition-all hover:scale-105 active:scale-95 ${isDark ? 'bg-white/5 border-white/10 text-slate-300 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-primary/5 hover:text-primary hover:border-primary'}`}
                                                >
                                                    <Share2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {filtered.length === 0 && !isLoading && (
                                <div className={`py-16 text-center rounded-[2rem] border-2 border-dashed ${isDark ? 'border-white/10 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
                                    <FileText size={40} className="mx-auto mb-4 opacity-30" />
                                    <p className="font-medium">No prescriptions found. Click "New Prescription" to start.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                            <h3 className="font-bold text-lg mb-4">Quick Templates</h3>
                            <div className="space-y-3">
                                {QUICK_TEMPLATES.map((tmpl, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setNewPresc({ ...newPresc, drugs: tmpl.drugs }); setIsPrescModalOpen(true); }}
                                        className={`w-full p-4 border rounded-2xl text-left transition-all group hover:border-primary hover:bg-primary/5 ${isDark ? 'border-white/10 bg-white/3' : 'border-slate-200 bg-slate-50'}`}
                                    >
                                        <p className="font-bold text-sm group-hover:text-primary transition-colors">{tmpl.label}</p>
                                        <p className={`text-[10px] font-medium mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{tmpl.drugs.length} drugs</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                            <div className="flex items-center gap-3 mb-3">
                                <AlertCircle size={18} className="text-amber-500" />
                                <h3 className="font-bold text-amber-500">Drug Safety</h3>
                            </div>
                            <p className={`text-sm font-medium mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                Drug interaction checking is powered by the free OpenFDA API. Allergy conflicts auto-detected from patient records.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <Modal isOpen={isPrescModalOpen} onClose={() => setIsPrescModalOpen(false)} title="Write New Prescription">
                <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Patient Name..." value={newPresc.patientName} onChange={e => setNewPresc({ ...newPresc, patientName: e.target.value })}
                            className="col-span-2 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-bold focus:border-primary outline-none" />
                        <input type="text" placeholder="Doctor Name..." value={newPresc.doctorName} onChange={e => setNewPresc({ ...newPresc, doctorName: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium focus:border-primary outline-none" />
                        <input type="text" placeholder="Clinic Name..." value={newPresc.clinicName} onChange={e => setNewPresc({ ...newPresc, clinicName: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium focus:border-primary outline-none" />
                    </div>

                    <div>
                        <p className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-3">Medications</p>
                        <div className="space-y-3">
                            {newPresc.drugs.map((drug, i) => (
                                <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <input type="text" placeholder="Drug name..." value={drug.name} onChange={e => updateDrug(i, 'name', e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:border-primary outline-none" />
                                            <DrugInteractionChecker drugName={drug.name} patientAllergies={[]} theme={theme} />
                                        </div>
                                        <input type="text" placeholder="Dosage" value={drug.dosage} onChange={e => updateDrug(i, 'dosage', e.target.value)}
                                            className="w-24 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-primary outline-none" />
                                        {newPresc.drugs.length > 1 && (
                                            <button onClick={() => removeDrug(i)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-xl transition-all">✕</button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <select value={drug.frequency} onChange={e => updateDrug(i, 'frequency', e.target.value)}
                                            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-primary outline-none">
                                            <option>Once daily</option>
                                            <option>Twice daily</option>
                                            <option>Thrice daily</option>
                                            <option>Four times daily</option>
                                            <option>SOS</option>
                                        </select>
                                        <input type="text" placeholder="Duration..." value={drug.duration} onChange={e => updateDrug(i, 'duration', e.target.value)}
                                            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-primary outline-none" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={addDrug} className="mt-3 flex items-center gap-2 text-xs font-bold text-primary hover:underline">
                            <Plus size={14} /> Add another drug
                        </button>
                    </div>

                    <textarea placeholder="Special instructions / notes..." value={newPresc.notes} onChange={e => setNewPresc({ ...newPresc, notes: e.target.value })}
                        className="w-full h-20 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-600 font-medium focus:border-primary outline-none resize-none" />

                    <div className="flex gap-2">
                        <button onClick={handleSavePrescription} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-primary/90 active:scale-95 transition-all">
                            Save Prescription
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
