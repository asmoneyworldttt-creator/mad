import { FileText, Download, Share2, Plus, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '../Toast';
import { supabase } from '../../supabase';
import { Modal } from '../../components/Modal';

export function Prescriptions() {
    const { showToast } = useToast();
    const [isPrescModalOpen, setIsPrescModalOpen] = useState(false);
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [newPresc, setNewPresc] = useState({
        patientName: '',
        medicineNotes: ''
    });

    useEffect(() => {
        fetchPrescriptions();
    }, []);

    const fetchPrescriptions = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('prescriptions')
            .select('*, patients(name)')
            .order('created_at', { ascending: false });
        if (error) {
            showToast('Error fetching prescriptions', 'error');
            console.error(error);
        } else if (data) {
            setPrescriptions(data);
        }
        setIsLoading(false);
    };

    const handleSavePrescription = async (sendWhatsApp = false) => {
        if (!newPresc.patientName) return showToast('Patient name is required', 'error');

        // First, try to find the patient by name or create a new one
        let patientId = null;
        const { data: existingPatients, error: patientSearchError } = await supabase
            .from('patients')
            .select('id')
            .ilike('name', newPresc.patientName);

        if (patientSearchError) {
            showToast('Error searching for patient', 'error');
            console.error(patientSearchError);
            return;
        }

        if (existingPatients && existingPatients.length > 0) {
            patientId = existingPatients[0].id;
        } else {
            const { data: newPatient, error: newPatientError } = await supabase
                .from('patients')
                .insert({ name: newPresc.patientName })
                .select('id');
            if (newPatientError) {
                showToast('Error creating new patient', 'error');
                console.error(newPatientError);
                return;
            }
            patientId = newPatient[0].id;
        }

        if (!patientId) {
            showToast('Could not determine patient ID', 'error');
            return;
        }

        const { error } = await supabase.from('prescriptions').insert({
            patient_id: patientId,
            medication_data: { notes: newPresc.medicineNotes },
            created_at: new Date().toISOString()
        });

        if (error) {
            showToast('Error saving prescription', 'error');
            console.error(error);
        } else {
            showToast(sendWhatsApp ? 'Prescription sent via WhatsApp!' : 'Prescription saved to EMR.', 'success');
            setIsPrescModalOpen(false);
            setNewPresc({ patientName: '', medicineNotes: '' }); // Clear form
            fetchPrescriptions();
        }
    };

    return (
        <>
            <div className="animate-slide-up space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-display font-bold text-text-dark tracking-tight">e-Prescriptions</h2>
                        <p className="text-text-muted font-medium">Draft, send, and track digital prescriptions.</p>
                    </div>
                    <button
                        onClick={() => setIsPrescModalOpen(true)}
                        className="bg-primary hover:bg-primary-hover text-white shadow-premium px-5 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 w-full md:w-auto"
                    >
                        <Plus size={16} /> New Prescription
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Rx List */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="relative w-full">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search prescriptions by patient name or ID..."
                                className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-sm transition-all text-text-dark font-medium placeholder-slate-400"
                            />
                        </div>

                        {prescriptions.map((rx, idx) => (
                            <div key={rx.id || idx} className="bg-surface border border-slate-200 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-premium transition-shadow cursor-pointer group mb-4">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-text-dark group-hover:text-primary transition-colors text-lg">{rx.patients?.name || 'Manual Entry'}</p>
                                        <p className="text-sm font-medium text-slate-500">Prescription created on {new Date(rx.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col md:items-end gap-2 w-full md:w-auto">
                                    <p className="text-xs font-bold text-slate-400 font-mono tracking-widest">{rx.id.slice(0, 8)}...</p>
                                    <div className="flex items-center gap-2 text-xs font-bold">
                                        <span className="bg-success/10 text-success px-2 py-1 rounded-md border border-success/20">Active</span>
                                        <button onClick={(e) => { e.stopPropagation(); showToast('Downloading PDF...'); }} className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-500"><Download size={14} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); showToast('Link copied / WhatsApp prompt opened'); }} className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-500"><Share2 size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {prescriptions.length === 0 && !isLoading && (
                            <div className="p-10 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
                                No prescriptions found. Click "New Prescription" to start.
                            </div>
                        )}
                    </div>

                    {/* Rx Widget */}
                    <div className="space-y-6">
                        <div className="bg-surface border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="font-display font-bold text-lg text-text-dark mb-4">Quick Draft Patterns</h3>
                            <div className="space-y-3">
                                <button className="w-full p-4 border border-slate-200 rounded-xl text-left hover:border-primary hover:bg-primary/5 transition-all group">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-sm text-text-dark group-hover:text-primary">Post-Extraction Regimen</span>
                                        <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">3 Meds</span>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium">Amoxicillin + Clavulanic Acid, Ketorolac, Pantoprazole</p>
                                </button>
                                <button className="w-full p-4 border border-slate-200 rounded-xl text-left hover:border-primary hover:bg-primary/5 transition-all group">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-sm text-text-dark group-hover:text-primary">Acute Pulpitis Pain</span>
                                        <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">2 Meds</span>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium">Aceclofenac + Paracetamol, Chlorhexidine Mouthwash</p>
                                </button>
                            </div>
                        </div>

                        <div className="bg-alert/5 border border-alert/20 rounded-2xl p-6 shadow-sm">
                            <div className="flex gap-3 mb-2">
                                <div className="mt-1 w-2 h-2 rounded-full bg-alert animate-pulse" />
                                <h3 className="font-bold text-alert">Pending Signatures</h3>
                            </div>
                            <p className="text-sm font-medium text-slate-600 mb-4 pl-5">You have 2 drafted prescriptions waiting for digital signature review.</p>
                            <button onClick={() => showToast('Opening bulk sign window...')} className="w-full py-2 bg-white border border-alert text-alert hover:bg-alert hover:text-white transition-colors text-sm font-bold rounded-lg shadow-sm">Review & Sign</button>
                        </div>
                    </div>
                </div>
            </div>

            <Modal isOpen={isPrescModalOpen} onClose={() => setIsPrescModalOpen(false)} title="Write New Prescription">
                <div className="space-y-4">
                    <input type="text" placeholder="Patient Name..." value={newPresc.patientName} onChange={e => setNewPresc({ ...newPresc, patientName: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 mb-2" />
                    <textarea placeholder="e.g. Paracetamol 500mg, twice a day after meals" value={newPresc.medicineNotes} onChange={e => setNewPresc({ ...newPresc, medicineNotes: e.target.value })} className="w-full h-32 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-600" />
                    <div className="flex gap-2 mt-4">
                        <button onClick={() => handleSavePrescription(false)} className="flex-1 py-2 bg-text-dark text-white rounded-lg text-sm font-bold shadow-md">Save to EMR</button>
                        <button onClick={() => handleSavePrescription(true)} className="flex-1 py-2 bg-success text-white rounded-lg text-sm font-bold shadow-md">Save & Send WhatsApp</button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
