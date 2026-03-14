import { FileText, Download, Plus, Search, Printer, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '../Toast';
import { supabase } from '../../supabase';
import { Modal } from '../../components/Modal';
import { DrugInteractionChecker } from './DrugInteractionChecker';
import { CustomSelect } from '../ui/CustomControls';
import { downloadPrescriptionPDF } from '../../utils/pdfExport';

type UserRole = 'master' | 'admin' | 'staff' | 'patient';

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
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);

    const [newPresc, setNewPresc] = useState({
        doctorName: 'Dr. Sarah Jenkins',
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

    const handlePatientSearch = async (val: string) => {
        setSearchQuery(val);
        if (val.length < 2) return setSearchResults([]);
        const { data } = await supabase.from('patients').select('*').ilike('name', `%${val}%`).limit(5);
        setSearchResults(data || []);
    };

    const selectPatient = (p: any) => {
        setSelectedPatient(p);
        setSearchQuery(p.name);
        setSearchResults([]);
    };

    const addDrug = () => setNewPresc({ ...newPresc, drugs: [...newPresc.drugs, { name: '', dosage: '', frequency: 'Twice daily', duration: '5 days' }] });
    const removeDrug = (i: number) => setNewPresc({ ...newPresc, drugs: newPresc.drugs.filter((_, idx) => idx !== i) });
    const updateDrug = (i: number, field: keyof Drug, val: string) => {
        const drugs = [...newPresc.drugs];
        drugs[i] = { ...drugs[i], [field]: val };
        setNewPresc({ ...newPresc, drugs });
    };

    const handleSavePrescription = async () => {
        if (!selectedPatient) return showToast('Please select a patient', 'error');
        if (newPresc.drugs.some(d => !d.name)) return showToast('All drug names are required', 'error');

        const { error } = await supabase.from('prescriptions').insert({
            patient_id: selectedPatient.id,
            medication_data: {
                drugs: newPresc.drugs,
                notes: newPresc.notes,
                doctorName: newPresc.doctorName,
                clinicName: newPresc.clinicName
            }
        });

        if (error) {
            showToast('Error saving prescription', 'error');
        } else {
            showToast('Prescription saved successfully!', 'success');
            setIsPrescModalOpen(false);
            setNewPresc({ doctorName: 'Dr. Sarah Jenkins', clinicName: 'DentiSphere Clinic', drugs: [{ name: '', dosage: '', frequency: 'Twice daily', duration: '5 days' }], notes: '' });
            setSelectedPatient(null);
            setSearchQuery('');
            fetchPrescriptions();
        }
    };

    const filtered = prescriptions.filter(rx =>
        (rx.patients?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rx.patients?.phone || '').includes(searchQuery)
    );

    const QUICK_TEMPLATES = [
        { label: 'Post-Extraction Regimen', drugs: [{ name: 'Amoxicillin + Clavulanic Acid 625mg', dosage: '625mg', frequency: 'Twice daily', duration: '5 days' }, { name: 'Ketorolac', dosage: '10mg', frequency: 'Thrice daily', duration: '3 days' }, { name: 'Pantoprazole', dosage: '40mg', frequency: 'Once daily', duration: '5 days' }] },
        { label: 'Acute Pulpitis', drugs: [{ name: 'Aceclofenac + Paracetamol', dosage: '100mg/325mg', frequency: 'Twice daily', duration: '5 days' }, { name: 'Chlorhexidine Mouthwash', dosage: '15ml', frequency: 'Twice daily', duration: '7 days' }] },
        { label: 'Post-RCT Protocol', drugs: [{ name: 'Amoxicillin 500mg', dosage: '500mg', frequency: 'Thrice daily', duration: '5 days' }, { name: 'Ibuprofen 400mg', dosage: '400mg', frequency: 'Twice daily after food', duration: '3 days' }] }
    ];

    return (
        <>
            <div className="animate-slide-up space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 className={`text-2xl md:text-3xl font-bold tracking-tight`} style={{ color: 'var(--text-dark)' }}>Clinical prescriptions</h2>
                        <p className="text-base font-medium mt-1" style={{ color: 'var(--text-muted)' }}>Secure digital vault for patient medicine records</p>
                    </div>
                    <button
                        onClick={() => setIsPrescModalOpen(true)}
                        className="bg-primary hover:scale-105 active:scale-95 text-white shadow-premium px-8 py-3.5 rounded-2xl font-bold text-sm transition-all w-full md:w-auto flex items-center justify-center gap-3"
                    >
                        <Plus size={20} /> Authorize New Rx
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="relative">
                            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                             <input
                                 type="text"
                                 value={searchQuery}
                                 onChange={e => setSearchQuery(e.target.value)}
                                 placeholder="Lookup patient records..."
                                 className={`w-full rounded-2xl py-4.5 pl-14 pr-6 font-bold text-base outline-none border transition-all focus:ring-4 focus:ring-primary/10 shadow-inner`}
                                 style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                             />
                        </div>

                        <div className="space-y-4">
                            {filtered.map((rx, idx) => {
                                const drugs: Drug[] = rx.medication_data?.drugs || [];
                                const allergies: string[] = rx.patients?.allergies ? (typeof rx.patients.allergies === 'string' ? rx.patients.allergies.split(',').map((a: string) => a.trim()) : rx.patients.allergies) : [];
                                const hasAllergyConflict = allergies.length > 0 && drugs.some(d => allergies.some(a => d.name.toLowerCase().includes(a.toLowerCase())));

                                return (
                                    <div key={rx.id || idx} 
                                        className={`p-6 rounded-[2rem] border transition-all duration-300 relative overflow-hidden group hover:shadow-xl ${hasAllergyConflict ? 'ring-2 ring-rose-500/30' : ''}`}
                                        style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                                        <div className="flex items-center justify-between gap-4 relative z-10">
                                            <div className="flex gap-4 items-center">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}
                                                    style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                                                    <FileText size={24} />
                                                </div>
                                                 <div>
                                                     <p className="font-bold text-lg transition-colors" style={{ color: 'var(--text-dark)' }}>{rx.patients?.name || 'Walk-in Patient'}</p>
                                                     <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                                         {drugs.length} Items Prescribed • {new Date(rx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                     </p>
                                                 </div>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                 {hasAllergyConflict && (
                                                     <span className="flex items-center gap-2 text-xs font-black px-3 py-1.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl uppercase tracking-widest animate-pulse">
                                                         <AlertCircle size={16} /> Allergy Alert
                                                     </span>
                                                 )}
                                                <button
                                                    onClick={() => {
                                                        downloadPrescriptionPDF({
                                                            patientName: rx.patients?.name || 'Patient',
                                                            patientPhone: rx.patients?.phone,
                                                            patientAllergies: rx.patients?.allergies || '',
                                                            doctorName: rx.medication_data?.doctorName || 'Attending Doctor',
                                                            clinicName: rx.medication_data?.clinicName || 'DentiSphere Clinic',
                                                            date: rx.created_at,
                                                            drugs: rx.medication_data?.drugs || [],
                                                            notes: rx.medication_data?.notes,
                                                            rxId: rx.id?.slice(0, 8),
                                                        });
                                                        showToast('PDF Exported', 'success');
                                                    }}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all hover:scale-105 active:scale-95 text-xs font-bold ${isDark ? 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20' : 'bg-primary/5 border-primary/20 text-primary hover:bg-primary/10'}`}
                                                >
                                                    <Download size={16} /> Export Rx
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const drugs: Drug[] = rx.medication_data?.drugs || [];
                                                        const msg = `Hello ${rx.patients?.name || 'Patient'},\n\nYour prescription from DentiSphere:\n${drugs.map(d => `• ${d.name} ${d.dosage} — ${d.frequency} for ${d.duration}`).join('\n')}\n\nPlease follow as directed.`;
                                                        const phone = rx.patients?.phone?.replace(/\D/g, '');
                                                        window.open(`https://wa.me/${phone ? '91' + phone : ''}?text=${encodeURIComponent(msg)}`, '_blank');
                                                        showToast('Opening WhatsApp', 'success');
                                                    }}
                                                    className={`p-1.5 rounded-lg border transition-all hover:scale-105 active:scale-95 ${isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'}`}
                                                >
                                                    <Printer size={14} />
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

                    <div className="space-y-4">
                        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                            <h3 className="font-bold text-sm mb-3">Quick Templates</h3>
                            <div className="space-y-2">
                                {QUICK_TEMPLATES.map((tmpl, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { 
                                            setNewPresc({ ...newPresc, drugs: tmpl.drugs }); 
                                            setIsPrescModalOpen(true); 
                                        }}
                                        className={`w-full p-3 border rounded-xl text-left transition-all group hover:border-primary hover:bg-primary/5 ${isDark ? 'border-white/10 bg-white/3' : 'border-slate-200 bg-slate-50'}`}
                                    >
                                         <p className="font-bold text-xs group-hover:text-primary transition-colors">{tmpl.label}</p>
                                         <p className={`text-[10px] font-bold mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{tmpl.drugs.length} drugs</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle size={16} className="text-amber-500" />
                                <h3 className="font-bold text-xs text-amber-500">Drug Safety</h3>
                            </div>
                            <p className={`text-[10px] font-bold leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                Interaction checking powered by OpenFDA API. Conflicts detected automatically.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <Modal isOpen={isPrescModalOpen} onClose={() => setIsPrescModalOpen(false)} title="Write New Prescription">
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                    <div className="relative">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Search Patient</label>
                        <input type="text" placeholder="Start typing patient name..." value={searchQuery} onChange={e => handlePatientSearch(e.target.value)}
                            className="w-full rounded-xl px-4 py-3 text-sm font-bold outline-none border transition-all focus:ring-2 focus:ring-primary/20" 
                            style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} />
                        {searchResults.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                                {searchResults.map(p => (
                                    <button key={p.id} onClick={() => selectPatient(p)} className="w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors border-b border-slate-50 last:border-none">
                                        <p className="text-sm font-bold text-slate-800">{p.name}</p>
                                        <p className="text-[10px] text-slate-500">{p.phone} • {p.email || 'No email'}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                        {selectedPatient && (
                            <div className="mt-2 flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-xs">{selectedPatient.name[0]}</div>
                                    <div>
                                        <p className="text-xs font-bold text-primary">{selectedPatient.name}</p>
                                        <p className="text-[10px] text-primary/60">{selectedPatient.phone}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedPatient(null)} className="text-[10px] font-bold text-rose-500 hover:underline">Clear</button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Practitioner</label>
                            <CustomSelect 
                                value={newPresc.doctorName}
                                onChange={val => setNewPresc({ ...newPresc, doctorName: val })}
                                options={['Dr. Sarah Jenkins', 'Dr. Michael Chen', 'Dr. Priya Sharma']}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Center</label>
                            <CustomSelect 
                                value={newPresc.clinicName}
                                onChange={val => setNewPresc({ ...newPresc, clinicName: val })}
                                options={['DentiSphere Main', 'DentiSphere North', 'DentiSphere East']}
                            />
                        </div>
                    </div>

                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2">Medication details</p>
                        <div className="space-y-3">
                            {newPresc.drugs.map((drug, i) => (
                                <div key={i} className="p-4 rounded-2xl space-y-3 shadow-sm border border-slate-100" style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)' }}>
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <input type="text" placeholder="Drug name..." value={drug.name} onChange={e => updateDrug(i, 'name', e.target.value)}
                                                className="w-full rounded-xl px-3 py-2.5 text-xs font-bold outline-none border" style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} />
                                            <DrugInteractionChecker drugName={drug.name} patientAllergies={selectedPatient?.allergies || []} theme={theme} />
                                        </div>
                                        <input type="text" placeholder="Mg/Ml" value={drug.dosage} onChange={e => updateDrug(i, 'dosage', e.target.value)}
                                            className="w-24 rounded-xl px-3 py-2.5 text-xs font-bold outline-none border" style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} />
                                        {newPresc.drugs.length > 1 && (
                                            <button onClick={() => removeDrug(i)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all">×</button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <CustomSelect 
                                            value={drug.frequency} 
                                            onChange={val => updateDrug(i, 'frequency', val)}
                                            options={[
                                                'Once daily (1-0-0)',
                                                'Twice daily (1-0-1)',
                                                'Thrice daily (1-1-1)',
                                                'Four times daily',
                                                'SOS (When needed)'
                                            ]}
                                        />
                                        <input type="text" placeholder="Duration (e.g. 5 days)" value={drug.duration} onChange={e => updateDrug(i, 'duration', e.target.value)}
                                            className="rounded-xl px-3 py-2.5 text-xs font-bold outline-none border" style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={addDrug} className="mt-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary hover:underline px-1">
                            <Plus size={14} /> Add medication
                        </button>
                    </div>

                    <textarea placeholder="Clinical notes or special instructions..." value={newPresc.notes} onChange={e => setNewPresc({ ...newPresc, notes: e.target.value })}
                        className="w-full h-24 rounded-2xl p-4 text-sm font-medium outline-none border resize-none" style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} />

                    <button onClick={handleSavePrescription} className="w-full py-4 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold text-sm shadow-xl shadow-primary/20 hover:translate-y-[-2px] active:translate-y-[0] transition-all">
                        Finalize & Authorize Rx
                    </button>
                </div>
            </Modal>
        </>
    );
}
