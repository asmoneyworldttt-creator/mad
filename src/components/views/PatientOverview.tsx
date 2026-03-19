import { useState, useMemo, useEffect } from 'react';
import { CustomSelect } from '../ui/CustomControls';
import imageCompression from 'browser-image-compression';
import { useToast } from '../../components/Toast';
import { supabase } from '../../supabase';
import {
    Activity,
    FileText,
    IndianRupee,
    MessageSquare,
    Calendar,
    Image as ImageIcon,
    MoreHorizontal,
    FileSignature,
    Printer,
    Download,
    Share2,
    Eye,
    History,
    Mail,
    PhoneCall,
    Edit3,
    Trash,
    ChevronLeft,
    Save,
    Plus,
    ArrowRightLeft,
    FlaskConical,
    ClipboardCheck,
    Heart,
    AlertTriangle,
    Trash2,
    Signature,
    CheckCircle
} from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { RealisticDentition } from './Dentition3D';
import { VitalSignsPanel } from './VitalSignsPanel';
import { 
    downloadInvoicePDF, 
    downloadDentalCertificatePDF, 
    downloadTreatmentPlanPDF, 
    downloadLabOrderPDF,
    downloadPrescriptionPDF,
    downloadMedicalClearancePDF,
    downloadClinicalNotesPDF,
    type TreatmentPlanData
} from '../../utils/pdfExport';

const ToothSelector = ({ selected, onSelect, patientAge }: { selected: string, onSelect: (tooth: string) => void, patientAge?: number }) => {
    const [chartType, setChartType] = useState<'adult' | 'pediatric'>('adult');

    useEffect(() => {
        if (patientAge !== undefined && patientAge !== null) {
            setChartType(Number(patientAge) < 18 ? 'pediatric' : 'adult');
        }
    }, [patientAge]);

    const adultRow1 = ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'];
    const adultRow2 = ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38'];

    const pediaRow1 = ['55', '54', '53', '52', '51', '61', '62', '63', '64', '65'];
    const pediaRow2 = ['85', '84', '83', '82', '81', '71', '72', '73', '74', '75'];

    const row1 = chartType === 'adult' ? adultRow1 : pediaRow1;
    const row2 = chartType === 'adult' ? adultRow2 : pediaRow2;

    return (
        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/10 mt-2">
            <div className="flex justify-between items-center mb-2 px-1">
                <p className="text-[9px] font-black text-slate-400 uppercase">Select Tooth Number</p>
                <div className="flex gap-1 border border-slate-200 dark:border-white/10 rounded-lg p-0.5 bg-white dark:bg-white/5">
                    <button type="button" onClick={() => setChartType('adult')} className={`px-2 py-0.5 rounded-md text-[8px] font-bold transition-all ${chartType === 'adult' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Adult</button>
                    <button type="button" onClick={() => setChartType('pediatric')} className={`px-2 py-0.5 rounded-md text-[8px] font-bold transition-all ${chartType === 'pediatric' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Pediatric</button>
                </div>
            </div>
            <div className={`flex justify-center gap-1 mb-1 overflow-x-auto py-1 ${chartType === 'pediatric' ? 'px-4' : ''}`}>
                {row1.map(t => (
                    <button type="button" key={t} onClick={() => onSelect(t)} className={`w-7 h-9 text-[10px] font-bold rounded-lg border flex items-center justify-center flex-shrink-0 transition-all ${selected === t ? 'bg-primary text-white border-primary shadow-md scale-105' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 hover:border-primary/40'}`}>
                        {t}
                    </button>
                ))}
            </div>
            <div className={`flex justify-center gap-1 overflow-x-auto py-1 ${chartType === 'pediatric' ? 'px-4' : ''}`}>
                {row2.map(t => (
                    <button type="button" key={t} onClick={() => onSelect(t)} className={`w-7 h-9 text-[10px] font-bold rounded-lg border flex items-center justify-center flex-shrink-0 transition-all ${selected === t ? 'bg-primary text-white border-primary shadow-md scale-105' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 hover:border-primary/40'}`}>
                        {t}
                    </button>
                ))}
            </div>
        </div>
    );
};

type PatientView = 'overview' | 'treatment_plan' | 'bill_detail';

export function PatientOverview({ onBack, patient, theme, setActiveTab: setGlobalActiveTab }: { onBack: () => void, patient: any, theme?: 'light' | 'dark', setActiveTab?: (tab: string) => void }) {
    const [activeTab, setActiveTab] = useState('home');
    const { showToast } = useToast();
    const [view, setView] = useState<PatientView>('overview');
    const [selectedBill, setSelectedBill] = useState<any>(null);

    const handleDownloadCertificateFromHistory = (bill: any) => {
        const notes = bill.notes || '';
        const complaint = notes.match(/\[Complaint\]:\s*([\s\S]*?)(?=\n\[|$)/)?.[1]?.trim() || '';
        const findings = notes.match(/\[Findings\]:\s*([\s\S]*?)(?=\n\[|$)/)?.[1]?.trim() || '';
        const remarks = notes.match(/\[CertRemarks\]:\s*([\s\S]*?)(?=\n\[|$)/)?.[1]?.trim() || '';
        const followUp = notes.match(/\[FollowUp\]:\s*([\s\S]*?)(?=\n\[|$)/)?.[1]?.trim() || '';
        const advice = notes.match(/\[Advice\]:\s*([\s\S]*?)(?=\n\[|$)/)?.[1]?.trim() || '';

        const procedures = bill.treatment_name?.split(', ').map((it: string) => {
            const toothMatch = it.match(/\((.*?)\)/);
            return { treatment: it.replace(/\(.*?\)/, '').trim(), tooth: toothMatch ? toothMatch[1] : '—', status: 'Completed', cost: 0 };
        }) || [];

        downloadDentalCertificatePDF({
            patientName: patient.name || 'Patient',
            patientPhone: patient.phone || '',
            patientAge: patient.age,
            patientGender: patient.gender,
            patientId: patient.id,
            date: bill.date || new Date().toISOString().split('T')[0],
            clinicName: 'DentiSphere Clinic',
            clinicLocation: 'Main Center',
            doctorName: bill.doctor_name || 'Attending Doctor',
            chiefComplaint: complaint,
            clinicalFindings: findings,
            procedures: procedures,
            remarks: (remarks || '') + (advice ? `\nAdvice: ${advice}` : '') + (followUp ? `\nFollow-up: ${followUp}` : '')
        });
    };
    const [toothChartData, setToothChartData] = useState<any>({});
    const [photos, setPhotos] = useState<{ name: string, url: string }[]>([]);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
    
    // Real data states
    const [patientBills, setPatientBills] = useState<any[]>([]);
    const [patientPlans, setPatientPlans] = useState<any[]>([]);
    const [patientLabOrders, setPatientLabOrders] = useState<any[]>([]);
    const [patientPrescriptions, setPatientPrescriptions] = useState<any[]>([]);
    const [patientNotes, setPatientNotes] = useState<any[]>([]);
    const [patientVitals, setPatientVitals] = useState<any[]>([]);
    const [patientConsents, setPatientConsents] = useState<any[]>([]);
    const [patientMedicalClearances, setPatientMedicalClearances] = useState<any[]>([]);
    const [patientHistory, setPatientHistory] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [clinicalSubTab, setClinicalSubTab] = useState<'soap' | 'vitals' | 'consents' | 'medical_clearance'>('soap');
    
    // Follow-up State
    const [followUpData, setFollowUpData] = useState({ date: '', doctor: 'Dr. Sarah Jenkins', nextTreatment: '', message: '' });
    const [isSavingFollowUp, setIsSavingFollowUp] = useState(false);

    useEffect(() => {
        if (!followUpData.date && !followUpData.nextTreatment) return;
        setFollowUpData(prev => ({
            ...prev,
            message: `Hello ${patient.name}, this is a reminder regarding your upcoming visit with ${prev.doctor} for ${prev.nextTreatment || 'treatment'} on ${prev.date}.`
        }));
    }, [followUpData.date, followUpData.doctor, followUpData.nextTreatment, patient.name]);
    
    // SOAP Note Modal State
    const [isSoapModalOpen, setIsSoapModalOpen] = useState(false);
    const [newNote, setNewNote] = useState({ subjective: '', objective: '', assessment: '', plan: '', doctor_name: 'Dr. Sarah Jenkins' });
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [advisedTreatments, setAdvisedTreatments] = useState<{ tooth: string, treatment: string, status?: string }[]>([]);
    const [advisedLabOrders, setAdvisedLabOrders] = useState<{ tooth: string, item: string, status?: string }[]>([]);
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [newAdvice, setNewAdvice] = useState({ tooth: '', treatment: '' });
    const [newLabAdvice, setNewLabAdvice] = useState({ tooth: '', item: '' });
    
    // New Treatment Done states
    const [treatmentsDone, setTreatmentsDone] = useState<{ tooth: string, treatment: string, status: string }[]>([]);
    const [newTreatmentDone, setNewTreatmentDone] = useState({ tooth: '', treatment: '', status: 'Completed' });
    const [expandedHistory, setExpandedHistory] = useState<string[]>([]);
    const [doctorsList, setDoctorsList] = useState<string[]>([]);

    const groupedHistory = useMemo(() => {
        if (!patientHistory) return [];
        const groups: Record<string, any[]> = {};
        patientHistory.filter(visit => visit.category !== 'FollowUp').forEach(visit => {
            const key = `${visit.date}_${visit.treatment}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(visit);
        });
        return Object.entries(groups).map(([key, items]) => ({
            key,
            ...items[0],
            items
        }));
    }, [patientHistory]);

    const standardTreatments = [
        'Oral examination', 'Periodontal charting', 'Pulp vitality testing', 
        'Intraoral periapical radiograph (IOPA)', 'Bitewing radiograph', 'Occlusal radiograph', 
        'Orthopantomogram (OPG)', 'CBCT', 'Study models / intraoral scan', 
        'Oral prophylaxis (Scaling & polishing)', 'Fluoride therapy', 'Pit & fissure sealants', 
        'Desensitization therapy', 'Oral hygiene instruction', 'Composite restoration', 
        'Glass ionomer restoration', 'Temporary restoration', 'Core build-up', 'Post & core', 
        'Pulpotomy', 'Pulpectomy', 'RCT – Started (Access opening + BMP initiated)', 
        'Same RCT – Dressing / Cleaning & shaping visit', 'RCT – Completed (Obturation done)', 
        'Retreatment RCT', 'Apexification', 'Apicoectomy', 'Scaling & root planing', 
        'Gingivectomy', 'Flap surgery', 'Crown lengthening', 'Bone graft / GTR', 
        'Simple extraction', 'Surgical extraction', 'Impacted tooth removal', 'Frenectomy', 
        'Biopsy', 'Alveoloplasty', 'Crown (PFM / Zirconia / E-max)', 'Fixed partial denture (Bridge)', 
        'Removable partial denture', 'Complete denture', 'Veneers', 'Full mouth rehabilitation', 
        'Implant placement', 'Immediate implant placement', 'Healing abutment placement', 
        'Implant crown / bridge', 'Sinus lift', 'Ridge augmentation', 'Removable orthodontic appliance', 
        'Fixed orthodontic treatment (Braces)', 'Clear aligners', 'Retainers', 'Space maintainer', 
        'Stainless steel crown (Primary teeth)', 'Habit breaking appliance', 'Normal scaling', 'Deep scaling',
        'Deep filling', 'RVG'
    ];
    const standardLabs = ['Crown', 'Bridge', 'Precision Denture', 'Inlay', 'Onlay', 'Veneer', 'Post & Core', 'Denture', 'Bite Block', 'Special Tray', 'Bleaching Tray', 'Night Guard'];

    const treatmentCounts = useMemo(() => {
        if (!patientHistory) return {};
        return patientHistory.reduce((acc: any, curr: any) => {
            acc[curr.treatment] = (acc[curr.treatment] || 0) + 1;
            return acc;
        }, {});
    }, [patientHistory]);

    const repeatedTreatments = Object.entries(treatmentCounts).filter(([_, count]: any) => count > 1);

    const fetchData = async () => {
        if (!patient?.id) return;
        setIsLoadingData(true);
        
        const [
            { data: bills },
            { data: plans },
            { data: labOrders },
            { data: prescriptions },
            { data: notes },
            { data: vitals },
            { data: consents },
            { data: medClearances },
            { data: history }
        ] = await Promise.all([
            supabase.from('bills').select('*').eq('patient_id', patient.id).order('date', { ascending: false }),
            supabase.from('treatment_plans').select('*').eq('patient_id', patient.id).order('created_at', { ascending: false }),
            supabase.from('lab_orders').select('*').eq('patient_id', patient.id).order('order_date', { ascending: false }),
            supabase.from('prescriptions').select('*').eq('patient_id', patient.id).order('created_at', { ascending: false }),
            supabase.from('clinical_notes').select('*').eq('patient_id', patient.id).order('created_at', { ascending: false }),
            supabase.from('vital_signs').select('*').eq('patient_id', patient.id).order('recorded_at', { ascending: false }),
            supabase.from('consent_forms').select('*').eq('patient_id', patient.id).order('created_at', { ascending: false }),
            supabase.from('medical_clearances').select('*').eq('patient_id', patient.id).order('created_at', { ascending: false }),
            supabase.from('patient_history').select('*').eq('patient_id', patient.id).order('date', { ascending: false })
        ]);

        setPatientBills(bills || []);
                 let mappedPlans = plans || [];
         if (plans && plans.length > 0) {
             const planIds = plans.map((p: any) => p.id);
             const { data: itemsData } = await supabase.from('treatment_plan_items').select('*').in('plan_id', planIds);
             mappedPlans = plans.map((p: any) => ({
                 ...p,
                 treatment_plan_items: itemsData?.filter((item: any) => item.plan_id === p.id) || []
             }));
         }

        setPatientPlans(mappedPlans);
        setPatientLabOrders(labOrders || []);
        setPatientPrescriptions(prescriptions || []);
        setPatientNotes(notes || []);
        setPatientVitals(vitals || []);
        setPatientConsents(consents || []);
        setPatientMedicalClearances(medClearances || []);
        setPatientHistory(history || []);
        if (Array.isArray(arguments[0]) && arguments[0].length > 9) {
             const doctors = arguments[0][9]?.data;
             if (doctors) setDoctorsList(doctors.map((d: any) => d.name));
        } else {
             const { data: doctors } = await supabase.from('staff').select('name').or('role.eq.Doctor,role.eq.Associate Dentist');
             if (doctors) setDoctorsList(doctors.map(d => d.name));
        }
        setIsLoadingData(false);
    };

    const loadToothChart = async () => {
        const { data } = await supabase
            .from('patients')
            .select('tooth_chart_data')
            .eq('id', patient.id)
            .single();

        if (data?.tooth_chart_data) {
            setToothChartData(data.tooth_chart_data);
        } else {
            setToothChartData({});
        }
    };

    const fetchPhotos = async () => {
        if (!patient?.id) return;
        const { data, error } = await supabase.storage.from('clinical-assets').list(`photos/${patient.id}`);
        if (data) {
            const list = data.map(f => {
                const { data: { publicUrl } } = supabase.storage.from('clinical-assets').getPublicUrl(`photos/${patient.id}/${f.name}`);
                return { name: f.name, url: publicUrl };
            });
            setPhotos(list);
        }
    };

    useEffect(() => {
        fetchData();
        loadToothChart();
        if (activeTab === 'gallery') fetchPhotos();

        // Real-time subscriptions for clinical/financial sync
        const channel = supabase.channel(`patient_sync_${patient.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bills', filter: `patient_id=eq.${patient.id}` }, fetchData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'treatment_plans', filter: `patient_id=eq.${patient.id}` }, fetchData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'lab_orders', filter: `patient_id=eq.${patient.id}` }, fetchData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'clinical_notes', filter: `patient_id=eq.${patient.id}` }, fetchData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'vital_signs', filter: `patient_id=eq.${patient.id}` }, fetchData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'consent_forms', filter: `patient_id=eq.${patient.id}` }, fetchData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'medical_clearances', filter: `patient_id=eq.${patient.id}` }, fetchData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'prescriptions', filter: `patient_id=eq.${patient.id}` }, fetchData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'patient_history', filter: `patient_id=eq.${patient.id}` }, fetchData)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [patient.id]);

    useEffect(() => {
        if (activeTab === 'gallery') fetchPhotos();
    }, [activeTab]);

    const handleSaveNote = async () => {
        if (!newNote.subjective && !newNote.objective && !newNote.assessment && !newNote.plan && advisedTreatments.length === 0 && advisedLabOrders.length === 0 && treatmentsDone.length === 0) {
            return; // Needs content
        }
        setIsSavingNote(true);
        const planData = JSON.stringify({
            text: newNote.plan,
            advised: advisedTreatments,
            advised_labs: advisedLabOrders,
            treatments_done: treatmentsDone // Save this new field!
        });

        const noteObj = {
            patient_id: patient.id,
            subjective: newNote.subjective,
            objective: newNote.objective,
            assessment: newNote.assessment,
            plan: planData,
            doctor_name: newNote.doctor_name
        };

        const { data: noteData, error: noteError } = isEditingNote && editingNoteId
            ? await supabase.from('clinical_notes').update(noteObj).eq('id', editingNoteId).select('id').single()
            : await supabase.from('clinical_notes').insert(noteObj).select('id').single();

        if (noteError) {
            showToast(noteError.message, 'error');
            setIsSavingNote(false);
            return;
        }

        // AUTO SYNC TO TREATMENT plan if treatments advised (Only new inserts, skip on edits for duplicate prevention if desired, or let build logic)
        if (!isEditingNote && advisedTreatments.length > 0) {
            const { data: planData, error: planError } = await supabase.from('treatment_plans').insert({
                patient_id: patient.id,
                title: `Plan from Note - ${new Date().toLocaleDateString()}`,
                status: 'Draft',
                total_cost: 0,
                paid_amount: 0
            }).select('id').single();

            if (!planError && planData) {
                const items = advisedTreatments.map(a => ({
                    plan_id: planData.id,
                    treatment_name: a.treatment,
                    tooth_reference: a.tooth,
                    cost: 0,
                    status: 'Pending'
                }));
                await supabase.from('treatment_plan_items').insert(items);
            }
        }

        if (treatmentsDone.length > 0) {
            const historyItems = treatmentsDone.map(t => ({
                patient_id: patient.id,
                date: new Date().toISOString().split('T')[0],
                treatment: t.treatment,
                notes: `Tooth: ${t.tooth}. Status: ${t.status || 'Completed'}`,
                category: 'Clinical',
                metadata: { from_clinical_note: true, status: t.status }
            }));
            await supabase.from('patient_history').insert(historyItems);
        }

        const adviceStr = advisedTreatments.map(a => `${a.tooth}: ${a.treatment}`).join(', ');
        await supabase.from('patient_history').insert({
            patient_id: patient.id,
            date: new Date().toISOString().split('T')[0],
            treatment: 'SOAP Note Recorded',
            notes: `Subj: ${newNote.subjective.substring(0, 30)}... Advice: ${adviceStr.substring(0, 50)}`,
            category: 'Clinical',
            doctor_name: newNote.doctor_name
        });

        setIsSoapModalOpen(false);
        setIsEditingNote(false);
        setEditingNoteId(null);
        setNewNote({ subjective: '', objective: '', assessment: '', plan: '', doctor_name: 'Dr. Sarah Jenkins' });
        setAdvisedTreatments([]);
        setAdvisedLabOrders([]);
        setTreatmentsDone([]); // Clear new field!
        fetchData();
        setIsSavingNote(false);
    };

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
        if (tabId === 'emr') loadToothChart();
        if (['billing', 'treatment_plans', 'lab_orders', 'prescriptions', 'clinical'].includes(tabId)) fetchData();
    };

    const totalDue = useMemo(() => {
        if (!patient) return 0;
        const totalBilled = patientBills.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
        const totalPaid = Number(patient.total_spent) || 0; 
        return Math.max(0, totalBilled - totalPaid);
    }, [patientBills, patient.total_spent]);

    const stats = useMemo(() => {
        const completedPlans = patientPlans.flatMap(p => p.treatment_plan_items || []).filter(i => i.status === 'Completed').length;
        const completedLabs = patientLabOrders.filter(l => l.order_status === 'Ready' || l.order_status === 'Delivered').length;
        const paidBills = patientBills.filter(b => b.status === 'Paid').length;

        const activePlans = patientPlans.filter(p => p.status === 'Active').length;
        const pendingLabs = patientLabOrders.filter(l => l.order_status === 'Pending' || l.order_status === 'In-Transit').length;

        const unpaidBills = patientBills.filter(b => b.status === 'Unpaid' || b.status === 'Partially Paid').length;
        
        return {
            completed: completedPlans + completedLabs + paidBills,
            inProgress: activePlans + pendingLabs,
            pending: unpaidBills
        };
    }, [patientPlans, patientLabOrders, patientBills]);

    const patientLifecycle = useMemo(() => {
        if (!patient || !patient.last_visit) return { status: 'New', color: 'bg-primary/10 text-primary border-primary/20' };

        const daysSinceVisit = Math.floor((Date.now() - new Date(patient.last_visit).getTime()) / (1000 * 3600 * 24));

        if (daysSinceVisit <= 90) return { status: 'Active', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
        if (daysSinceVisit <= 180) return { status: 'Dormant', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
        return { status: 'Lost', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
    }, [patient?.last_visit]);

    const handleDownloadReport = (format: 'pdf' | 'csv' | 'excel') => {
        if (format === 'pdf') {
            // Use standard report PDF or just generate a summary
            showToast('Generating Patient Summary PDF...', 'info');
            // For now, let's keep it simple or hook into a summary PDF
        }
        
        let content = '';
        const timestamp = new Date().toISOString().split('T')[0];
        const safeName = patient.name.replace(/\s+/g, '_');
        const filename = `${safeName}_Report_${timestamp}`;

        if (format === 'pdf') {
            // Simplified PDF-like text for now
            content = `DENTORA CLINICAL REPORT\n========================\n\nPATIENT: ${patient.name} ${patient.last_name || ''}\nID: ${patient.id}\nDATE: ${timestamp}\n\nRECORDS SUMMARY:\n` +
                patientHistory.map((v: any) => `- ${v.date}: ${v.treatment} (₹${v.cost})`).join('\n') +
                `\n\nOUTSTANDING BALANCE: ₹${totalDue}`;
            const blob = new Blob([content], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } else {
            const headers = ['Date', 'Treatment', 'Cost', 'Notes'];
            const rows = patientHistory.map((v: any) => 
                `"${v.date}","${v.treatment}","${v.cost}","${(v.notes || '').replace(/"/g, '""')}"`
            );
            content = [headers.join(','), ...rows].join('\n');
            const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/vnd.ms-excel' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.${format === 'csv' ? 'csv' : 'xls'}`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    const handleShareWhatsApp = (plan: any) => {
        const text = `*Treatment Plan: ${plan.title}*\nPatient: ${patient.name}\nTotal Cost: ₹${plan.total_cost}\nStatus: ${plan.status}\n\nProcedures:\n${(plan.treatment_plan_items || []).map((it: any) => `- ${it.treatment_name} (${it.tooth_reference || 'all'})`).join('\n')}\n\nPlease contact us for any questions.`;
        const encoded = encodeURIComponent(text);
        window.open(`https://wa.me/${patient.phone?.replace(/\D/g, '')}?text=${encoded}`, '_blank');
    };

    const tabs = [
        { id: 'home', label: 'Home', icon: Activity },
        { id: 'clinical', label: 'Clinical Notes', icon: ClipboardCheck },
        { id: 'followup', label: 'Follow-up', icon: Calendar },
        { id: 'billing', label: 'Invoices', icon: FileText },
        { id: 'treatment_plans', label: 'Plans', icon: FileSignature },
        { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
        { id: 'lab_orders', label: 'Labs', icon: FlaskConical },
        { id: 'appointments', label: 'Appointments', icon: Calendar },
        { id: 'emr', label: 'EMR/Chart', icon: Activity },
        { id: 'gallery', label: 'Gallery', icon: ImageIcon },
        { id: 'messages', label: 'Chat', icon: MessageSquare },
    ];

    if (!patient) return null;

    if (view === 'bill_detail' && selectedBill) {
        return (
            <div className={`animate-slide-up space-y-10 pb-12 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                <div className="flex items-center gap-6">
                    <button onClick={() => setView('overview')} className="p-4 border rounded-2xl transition-all shadow-premium" style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className={`text-3xl md:text-4xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Formal Invoice</h2>
                        <p className="text-lg font-medium mt-1" style={{ color: 'var(--text-muted)' }}>Official ledger entry for {patient.name}</p>
                    </div>
                </div>

                <div className="p-12 rounded-[3.5rem] border shadow-premium max-w-5xl shadow-primary/5 mx-auto" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                    <div className="flex justify-between items-start mb-16">
                        <div>
                            <p className="text-base font-bold text-slate-400 mb-3 uppercase tracking-widest">Transaction Number</p>
                            <h4 className="text-5xl font-sans font-bold text-primary">{selectedBill.invoice_number || selectedBill.id.slice(0, 8)}</h4>
                        </div>
                        <div className="text-right">
                            <p className="text-base font-bold text-slate-400 mb-3 uppercase tracking-widest">Date of Issuance</p>
                            <p className="text-2xl font-bold">{selectedBill.date}</p>
                        </div>
                    </div>

                    <div className="p-10 rounded-[2.5rem] border shadow-inner" style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)' }}>
                        <table className="w-full">
                            <thead>
                                <tr className="text-base font-bold text-slate-400 border-b border-white/5">
                                    <th className="text-left pb-6">Clinical Service / Description</th>
                                    <th className="text-right pb-6">Ledger Amount</th>
                                </tr>
                            </thead>
                            <tbody style={{ color: 'var(--text-main)', borderColor: 'var(--border-color)' }}>
                                <tr className="text-lg font-bold" style={{ borderTop: '1px solid var(--border-color)' }}>
                                    <td className="py-8">{selectedBill.treatment_name || 'Restorative Procedure'}</td>
                                    <td className="py-8 text-right">₹{Number(selectedBill.amount).toLocaleString()}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr className="border-t-4 border-primary/50">
                                    <td className="pt-10 text-2xl font-bold">Aggregate Settlement</td>
                                    <td className="pt-10 text-5xl font-sans font-bold text-primary text-right">₹{selectedBill.amount.toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-16">
                        <button onClick={() => handleShareWhatsApp({ title: `Invoice ${selectedBill.invoice_number}`, total_cost: selectedBill.amount, status: selectedBill.status })} className={`flex items-center justify-center gap-4 py-6 rounded-3xl font-bold text-lg shadow-premium transition-all active:scale-95 ${theme === 'dark' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                            <MessageSquare size={24} /> Forward to WhatsApp
                        </button>
                        <button onClick={() => downloadInvoicePDF({
                            invoiceNumber: selectedBill.invoice_number || selectedBill.id.slice(0, 8),
                            date: selectedBill.date,
                            patientName: patient.name,
                            clinicName: 'DentiSphere Clinic',
                            clinicLocation: 'Main Center',
                            doctorName: selectedBill.doctor_name || 'Attending Doctor',
                            treatmentName: selectedBill.treatment_name || 'Dental Treatment',
                            grossAmount: selectedBill.amount,
                            discount: selectedBill.discount || 0,
                            gstRate: 0,
                            gstAmount: 0,
                            totalAmount: selectedBill.amount,
                            paymentMethod: selectedBill.payment_method || 'Cash',
                            paymentStatus: selectedBill.status
                        })} className="flex items-center justify-center gap-4 py-6 bg-slate-900 text-white rounded-3xl font-bold text-lg shadow-premium hover:bg-black transition-all active:scale-95">
                            <Printer size={24} /> Print Secure Copy
                        </button>
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div className={`animate-slide-up space-y-8 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            <div className="p-3 md:p-4 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-3" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button onClick={onBack} className="p-2 rounded-lg transition-all" style={{ background: 'var(--card-bg-alt)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        <ChevronLeft size={16} />
                    </button>
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-2xl shadow-xl shadow-primary/30">
                            {patient.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h3 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-dark)' }}>{patient.name}</h3>
                                <span className={`${patientLifecycle.color} text-sm font-bold px-3 py-1 rounded-full border shadow-sm`}>{patientLifecycle.status}</span>
                            </div>
                            <p className="text-base font-medium mt-1" style={{ color: 'var(--text-muted)' }}>
                                {patient.gender}, {patient.age}y • Blood Group: <span className="text-rose-500 font-bold">{patient.blood_group || 'O+'}</span> • ID: <span className="font-bold text-primary">#{patient.id.slice(0, 8)}</span>
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={() => handleDownloadReport('pdf')} className="flex-1 px-6 py-3 bg-primary text-white rounded-2xl font-bold text-base shadow-premium hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                        <Download size={20} /> Export Patient Report
                    </button>
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto border-b border-white/5 pb-0.5 custom-scrollbar scroll-smooth">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`flex items-center gap-2.5 px-5 py-4 border-b-2 text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${isActive ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                        >
                            <Icon size={18} /> {tab.label}
                        </button>
                    );
                })}
            </div>

            <main className="space-y-10 pb-20">
                {activeTab === 'home' && (
                    <div className="space-y-6">
                        {/* ── Treatment & Lab Status Matrix Category Row ── */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 shadow-premium flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 mb-1">Completed Treatments / Bills</p>
                                    <h5 className="text-3xl font-black text-emerald-600">{stats.completed} Items</h5>
                                </div>
                                <div className="p-4 bg-emerald-500 rounded-2xl text-white"><CheckCircle size={24} /></div>
                            </div>
                            <div className="p-6 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 shadow-premium flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 mb-1">In-Progress Plans / Lab Orders</p>
                                    <h5 className="text-3xl font-black text-indigo-600">{stats.inProgress} Items</h5>
                                </div>
                                <div className="p-4 bg-indigo-500 rounded-2xl text-white"><History size={24} /></div>
                            </div>
                            <div className="p-6 rounded-[2rem] bg-amber-500/10 border border-amber-500/20 shadow-premium flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 mb-1">Pending Due Invoices</p>
                                    <h5 className="text-3xl font-black text-amber-600">{stats.pending} Items</h5>
                                </div>
                                <div className="p-4 bg-amber-500 rounded-2xl text-white"><AlertTriangle size={24} /></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="p-6 rounded-[2rem]" style={{ background: 'var(--card-bg-alt)', border: '1px solid var(--border-color)' }}>
                                    <h4 className="text-base font-bold mb-4" style={{ color: 'var(--text-muted)' }}>Contact Details</h4>
                                    <div className="flex items-center gap-4 text-base font-bold">
                                        <div className="flex-1">
                                            <p className="text-slate-400 mb-1 text-xs uppercase tracking-wider">Home Address</p>
                                            <p className="leading-relaxed">{patient.address || 'Standard Location Area, Chennai'}</p>
                                        </div>
                                    </div>
                                    <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap gap-8">
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Mobile Number</p>
                                            <p className="text-lg font-bold text-primary">{patient.phone}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Email Communication</p>
                                            <p className="text-lg font-bold truncate max-w-[180px]">{patient.email || 'None Provided'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 rounded-[2rem]" style={{ background: 'var(--card-bg-alt)', border: '1px solid var(--border-color)' }}>
                                    <h4 className="text-base font-bold mb-4" style={{ color: 'var(--text-muted)' }}>Medical Conditions & Allergies</h4>
                                    {patient.allergies ? (
                                        <div className="flex flex-wrap gap-2.5 mb-5">
                                            <span className="px-4 py-1.5 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20 text-sm font-bold">{patient.allergies}</span>
                                        </div>
                                    ) : (
                                        <p className="text-sm font-medium text-slate-400 mb-4">No reported allergies recorded.</p>
                                    )}
                                    {patient.medical_notes && (
                                        <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-900/50 text-slate-700 dark:text-white/80 text-base font-medium leading-relaxed italic border dark:border-white/5 shadow-inner">
                                            "{patient.medical_notes}"
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Latest Vital Signs Card */}
                            {patientVitals.length > 0 && (
                                <div className="p-6 rounded-[2rem]" style={{ background: 'var(--card-bg-alt)', border: '1px solid var(--border-color)' }}>
                                    <h4 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}><Heart size={18} className="text-red-500" /> Latest Vital Signs</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-2xl text-center border dark:border-white/5">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Blood Pressure</p>
                                            <p className="text-lg font-black text-primary">{patientVitals[0].systolic}/{patientVitals[0].diastolic}</p>
                                            <p className="text-[8px] text-slate-400">mmHg</p>
                                        </div>
                                        <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-2xl text-center border dark:border-white/5">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Heart Rate</p>
                                            <p className="text-lg font-black text-red-500">{patientVitals[0].pulse}</p>
                                            <p className="text-[8px] text-slate-400">bpm</p>
                                        </div>
                                        <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-2xl text-center border dark:border-white/5">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Temperature</p>
                                            <p className="text-lg font-black text-amber-500">{patientVitals[0].temperature}</p>
                                            <p className="text-[8px] text-slate-400">°C</p>
                                        </div>
                                        <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-2xl text-center border dark:border-white/5">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">SPO2 Status</p>
                                            <p className="text-lg font-black text-emerald-500">{patientVitals[0].spo2}</p>
                                            <p className="text-[8px] text-slate-400">% Saturation</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xl font-bold flex items-center gap-3" style={{ color: 'var(--text-dark)' }}>
                                        <History size={24} className="text-primary" /> Patient Visit History
                                    </h4>
                                    <button className="text-[11px] font-black text-primary uppercase tracking-widest hover:underline">View All Records</button>
                                </div>
                                <div className="space-y-4">
                                    {groupedHistory.map((visit: any, i: number) => {
                                        const isExpanded = expandedHistory.includes(visit.key);
                                        const hasMultiple = visit.items.length > 1;

                                        return (
                                            <div key={i} onClick={() => { if (hasMultiple) setExpandedHistory(prev => prev.includes(visit.key) ? prev.filter(k => k !== visit.key) : [...prev, visit.key]); }} className={`p-7 rounded-[2.5rem] transition-all hover:scale-[1.01] overflow-hidden relative group shadow-sm ${hasMultiple ? 'cursor-pointer' : ''}`} style={{ background: 'var(--card-bg-alt)', border: '1.5px solid var(--border-color)' }}>
                                                <div className="flex justify-between items-center mb-6">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                                                            {visit.treatment.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h5 className="font-bold text-xl mb-1 flex items-center gap-1.5">
                                                                {visit.treatment}
                                                                {hasMultiple && <span className="text-[10px] font-black bg-blue-500/10 text-blue-500 px-2 py-1 rounded-lg">x {visit.items.length}</span>}
                                                            </h5>
                                                            <p className="text-sm font-bold text-slate-500 flex items-center gap-1.5"><Calendar size={14} /> {visit.date}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-3xl font-sans font-bold text-primary mb-1">₹{(visit.items.reduce((acc: number, item: any) => acc + (Number(item.cost) || 0), 0)).toLocaleString()}</p>
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${hasMultiple ? (isExpanded ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500') : 'text-emerald-500 bg-emerald-500/10'} px-3 py-1 rounded-full`}>
                                                            {hasMultiple ? (isExpanded ? 'Collapse' : 'Expand') : 'Recorded'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {(!hasMultiple || isExpanded) && (
                                                    <div className="space-y-2 mt-2">
                                                        {visit.items.map((it: any, idx: number) => (
                                                            <div key={idx} className="p-5 rounded-2xl text-base font-medium italic leading-relaxed border" style={{ background: 'var(--bg-page)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                                                                {hasMultiple && <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex justify-between"><span>Record #{idx+1}</span> <span>₹{it.cost || 0}</span></div>}
                                                                "{it.notes}"
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="p-8 rounded-[2.5rem]" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                                <h4 className="text-base font-bold mb-6 text-primary flex items-center gap-2 uppercase tracking-widest">
                                    <Activity size={18} /> Visit Frequency
                                </h4>
                                {repeatedTreatments.map(([name, count]: any) => (
                                    <div key={name} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 mb-3 hover:bg-white/10 transition-all">
                                        <span className="text-base font-bold">{name}</span>
                                        <span className="px-4 py-1.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20">{count}X</span>
                                    </div>
                                ))}
                            </div>

                            <div className={`p-6 rounded-[2rem] border shadow-sm relative overflow-hidden group flex flex-col justify-between ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'}`}>
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <p className="text-[10px] font-black text-rose-500 mb-1 uppercase tracking-widest">Financial Node</p>
                                            <h4 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-500'}`}>Outstanding Balance</h4>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                                            <IndianRupee size={20} />
                                        </div>
                                    </div>
                                    <h5 className={`text-4xl font-sans font-black mb-8 tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>₹{totalDue.toLocaleString()}</h5>
                                    <div className="flex gap-3 mt-auto">
                                        <button onClick={() => setActiveTab('payment')} className="flex-1 py-4 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/30 transition-all active:scale-95">Settle Now</button>
                                        <button onClick={() => setView('bill_detail')} className={`p-4 border rounded-xl flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                            <FileText size={20} />
                                        </button>
                                    </div>
                                </div>
                                <Activity size={80} className="absolute -right-8 -bottom-8 opacity-[0.03] rotate-12 group-hover:scale-110 transition-transform duration-700" />
                            </div>
                        </div>
                    </div>
                    </div>
                )}

                {activeTab === 'followup' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h4 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>Scheduled Follow-ups</h4>
                        </div>
                        
                        <div className="p-8 rounded-[2.5rem]" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                            <h5 className="font-sans font-bold text-lg mb-6 border-b pb-2" style={{ color: 'var(--text-dark)', borderColor: 'var(--border-color)' }}>Create New Follow-up</h5>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--text-muted)' }}>Next Follow-up Date</label>
                                    <input type="date" value={followUpData.date} onChange={e => setFollowUpData({ ...followUpData, date: e.target.value })} className="w-full rounded-xl px-4 py-3 text-sm" style={{ background: 'var(--bg-page)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--text-muted)' }}>Doctor Name</label>
                                    <CustomSelect 
                                        value={followUpData.doctor} 
                                        onChange={(val: string) => setFollowUpData({ ...followUpData, doctor: val })} 
                                        options={doctorsList.length > 0 ? doctorsList : ['Dr. Sarah Jenkins']} 
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--text-muted)' }}>WhatsApp Number</label>
                                    <input type="text" value={patient.phone || ''} disabled className="w-full rounded-xl px-4 py-3 text-sm opacity-60" style={{ background: 'var(--bg-page)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--text-muted)' }}>Next Treatment</label>
                                    <input type="text" placeholder="e.g. Crown Fitment" value={followUpData.nextTreatment} onChange={e => setFollowUpData({ ...followUpData, nextTreatment: e.target.value })} className="w-full rounded-xl px-4 py-3 text-sm" style={{ background: 'var(--bg-page)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--text-muted)' }}>Follow-up Message</label>
                                    <textarea rows={3} value={followUpData.message} onChange={e => setFollowUpData({ ...followUpData, message: e.target.value })} className="w-full rounded-xl px-4 py-3 text-sm" style={{ background: 'var(--bg-page)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} placeholder="Pre-typed message will load here..."></textarea>
                                </div>
                            </div>
                            
                            <button onClick={async () => {
                                if (!followUpData.date) return showToast('Please select a date', 'error');
                                setIsSavingFollowUp(true);
                                const { error } = await supabase.from('patient_history').insert({
                                    id: crypto.randomUUID(),
                                    patient_id: patient.id,
                                    date: followUpData.date,
                                    treatment: followUpData.nextTreatment || 'Follow-up',
                                    notes: followUpData.message,
                                    category: 'FollowUp',
                                    doctor_name: followUpData.doctor
                                });
                                if (error) showToast(error.message, 'error');
                                else {
                                    showToast('Follow-up scheduled!', 'success');
                                    setFollowUpData({ date: '', doctor: 'Dr. Sarah Jenkins', nextTreatment: '', message: '' });
                                    fetchData();
                                }
                                setIsSavingFollowUp(false);
                            }} disabled={isSavingFollowUp} className="mt-6 w-full py-3.5 bg-primary hover:scale-[1.01] active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2">
                                {isSavingFollowUp ? 'Scheduling...' : 'Schedule Follow-up'}
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <h5 className="font-sans font-bold text-lg" style={{ color: 'var(--text-dark)' }}>Existing Follow-ups</h5>
                            {patientHistory.filter(h => h.category === 'FollowUp').length === 0 ? (
                                <p className="text-sm font-medium text-slate-400">No scheduled follow-ups found.</p>
                            ) : (
                                <div className="space-y-3">
                                    {patientHistory.filter(h => h.category === 'FollowUp').map((h, i) => (
                                        <div key={i} className="p-5 rounded-2xl border flex justify-between items-center transition-all bg-white dark:bg-slate-900/40" style={{ borderColor: 'var(--border-color)' }}>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">{h.date}</p>
                                                <p className="font-bold text-sm tracking-tight" style={{ color: 'var(--text-dark)' }}>{h.treatment}</p>
                                                <p className="text-xs font-medium text-slate-400 mt-1 italic">"{h.notes}"</p>
                                            </div>
                                            <button onClick={() => {
                                                const text = h.notes || '';
                                                const url = `https://wa.me/${patient.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
                                                window.open(url, '_blank');
                                            }} className="p-3 bg-emerald-500 rounded-xl text-white hover:scale-105 active:scale-95 transition-all shadow-md">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.3-.149-1.777-.878-2.046-.977-.269-.1-.466-.149-.663.149-.197.3-.765.977-.937 1.173-.171.196-.341.221-.644.072-.303-.15-1.279-.471-2.435-1.503-.9-.801-1.507-1.792-1.683-2.09-.175-.299-.019-.461.13-.609.134-.133.302-.349.453-.524.15-.174.2-.299.3-.498.1-.2.05-.375-.025-.524-.075-.149-.663-1.599-.908-2.189-.244-.589-.492-.51-.663-.51h-.552c-.197 0-.518.074-.789.373-.27.299-1.033 1.009-1.033 2.46 0 1.45 1.056 2.85 1.205 3.05.149.196 2.073 3.166 5.02 4.444.7.304 1.248.485 1.674.622.703.221 1.343.19 1.85.114.565-.084 1.777-.726 2.025-1.425.249-.699.249-1.295.174-1.424-.075-.129-.269-.196-.569-.345z"/></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'billing' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h4 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>Financial Invoices</h4>
                            <p className="text-sm font-bold text-slate-500">Showing {patientBills.length} records</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {patientBills.map(bill => (
                                <div key={bill.id} className="p-8 rounded-[2.5rem] group transition-all hover:scale-[1.02] shadow-sm" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <h5 className="text-lg font-bold">INV-{bill.invoice_number || bill.id.slice(0, 4)}</h5>
                                            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">{new Date(bill.date).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-extrabold uppercase border ${bill.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                                            {bill.status}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-400 mb-6 line-clamp-1">{bill.treatment_name || 'Restorative Treatment'}</p>
                                    <div className="flex items-center justify-between pt-6 border-t border-black/5">
                                        <p className="text-2xl font-sans font-bold text-primary">₹{bill.amount}</p>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setSelectedBill(bill); setView('bill_detail'); }} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-primary transition-all">
                                                <Eye size={16} />
                                            </button>
                                            <button onClick={() => downloadInvoicePDF({
                                                invoiceNumber: bill.invoice_number || bill.id.slice(0, 8),
                                                date: bill.date,
                                                patientName: patient.name,
                                                clinicName: 'DentiSphere Clinic',
                                                clinicLocation: 'Main Center',
                                                doctorName: bill.doctor_name || 'Attending Doctor',
                                                treatmentName: bill.treatment_name || 'Dental Treatment',
                                                grossAmount: bill.amount,
                                                discount: bill.discount || 0,
                                                gstRate: 0,
                                                gstAmount: 0,
                                                totalAmount: bill.amount,
                                                paymentMethod: bill.payment_method || 'Cash',
                                                paymentStatus: bill.status
                                            })} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-primary transition-all">
                                                <Download size={16} />
                                            </button>
                                            {bill.notes?.includes('[Certificate]: true') && (
                                                <button onClick={() => handleDownloadCertificateFromHistory(bill)} title="Download Certificate" className="p-2.5 rounded-xl border bg-emerald-500/10 border-emerald-500/20 text-emerald-600 hover:scale-105 transition-all">
                                                    <FileText size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {patientBills.length === 0 && (
                                <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                                    <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                                    <p className="font-bold text-slate-400">No invoices found for this patient.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'treatment_plans' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h4 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>Clinical Treatment Plans</h4>
                            <button onClick={() => setView('treatment_plan')} className="px-6 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 flex items-center gap-2">
                                <Plus size={16} /> New Plan
                            </button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {patientPlans.map(plan => (
                                <div key={plan.id} className="p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden group" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h5 className="text-xl font-bold mb-1">{plan.title}</h5>
                                            <p className="text-xs font-bold text-slate-400">{new Date(plan.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => downloadTreatmentPlanPDF({
                                                date: new Date(plan.created_at).toLocaleDateString(),
                                                patientName: patient.name,
                                                patientPhone: patient.phone || '',
                                                planTitle: plan.title,
                                                items: (plan.treatment_plan_items || []).map((it: any) => ({
                                                    treatment_name: it.treatment_name,
                                                    tooth_reference: it.tooth_reference || 'All',
                                                    cost: it.cost || 0,
                                                    status: it.status || 'Pending'
                                                })),
                                                totalCost: plan.total_cost,
                                                notes: plan.notes || ''
                                            })} className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-primary transition-all">
                                                <Download size={16} />
                                            </button>
                                            <button onClick={() => handleShareWhatsApp(plan)} className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 hover:bg-emerald-100 transition-all">
                                                <Share2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-4 mb-8">
                                        {(plan.treatment_plan_items || []).slice(0, 3).map((item: any) => (
                                            <div key={item.id} className="flex justify-between items-center text-sm font-medium">
                                                <span className="text-slate-600">Tooth {item.tooth_reference || 'All'}: {item.treatment_name}</span>
                                                <span className="font-bold">₹{item.cost}</span>
                                            </div>
                                        ))}
                                        {plan.treatment_plan_items?.length > 3 && (
                                            <p className="text-xs font-bold text-primary">+{plan.treatment_plan_items.length - 3} more procedures</p>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between pt-6 border-t border-black/5 mt-auto">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Estimated Budget</p>
                                            <p className="text-3xl font-sans font-black text-primary">₹{plan.total_cost.toLocaleString()}</p>
                                        </div>
                                        <span className={`px-4 py-2 rounded-xl text-xs font-bold border ${plan.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-100 text-slate-500'}`}>
                                            {plan.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {patientPlans.length === 0 && (
                                <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                                    <FileSignature size={48} className="mx-auto text-slate-300 mb-4" />
                                    <p className="font-bold text-slate-400">No active treatment plans.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'lab_orders' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h4 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>Lab History & Orders</h4>
                        </div>

                        {/* Recommended From Clinical Notes section */}
                        {(() => {
                            const recLabs: any[] = [];
                            patientNotes.forEach(n => {
                                try {
                                    const parsed = JSON.parse(n.plan);
                                    if (parsed?.advised_labs) recLabs.push(...parsed.advised_labs);
                                } catch (e) { }
                            });
                            if (recLabs.length === 0) return null;

                            return (
                                <div className="p-6 rounded-[2rem] border bg-emerald-500/5 border-emerald-500/10 mb-6">
                                    <h5 className="text-sm font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2"><FlaskConical size={16} /> Recommended / Advised from Clinical Notes</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {recLabs.map((l, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl text-xs font-bold border border-emerald-500/20 shadow-sm flex items-center gap-1.5">
                                                <span className="text-slate-400"># {l.tooth}:</span> {l.item}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {patientLabOrders.map(order => {
                                const meta = order.metadata || {};
                                return (
                                    <div key={order.id} className="p-8 rounded-[2.5rem] shadow-sm relative group bg-white border border-slate-100" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <FlaskConical size={14} className="text-primary" />
                                                    <h5 className="font-bold text-lg">{order.vendor_name}</h5>
                                                </div>
                                                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">{new Date(order.order_date).toLocaleDateString()} • {meta.time || 'N/A'}</p>
                                            </div>
                                            <button onClick={() => downloadLabOrderPDF({
                                                orderId: order.id,
                                                date: order.order_date,
                                                patientName: patient.name,
                                                patientPhone: patient.phone || '',
                                                doctorName: meta.doctor || 'Dr. Sarah Jenkins',
                                                vendorName: order.vendor_name,
                                                teeth: meta.selectedTeeth || [],
                                                prosthesis: meta.prosthesis || [],
                                                preOp: meta.preOp || [],
                                                surfaceCluster: meta.surfaceCluster || '',
                                                ponticType: meta.ponticType || '',
                                                shades: meta.shades || {},
                                                deliveryNotes: meta.delivery?.notes || '',
                                                status: order.order_status,
                                                deliveryDates: {
                                                    trial: meta.delivery?.trial,
                                                    bisque: meta.delivery?.bisque,
                                                    final: meta.delivery?.final
                                                }
                                            })} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-primary transition-all">
                                                <Download size={16} />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div className="p-4 bg-slate-50 rounded-2xl">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Teeth</p>
                                                <p className="text-sm font-bold text-primary">{meta.selectedTeeth?.join(', ') || 'N/A'}</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-2xl">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Prosthesis</p>
                                                <p className="text-sm font-bold truncate">{meta.prosthesis?.join(', ') || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-6 border-t border-black/5">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${order.order_status === 'Ready' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                {order.order_status}
                                            </span>
                                            <p className="text-lg font-bold text-slate-700">₹{meta.totalAmount || 0}</p>
                                        </div>
                                    </div>
                                );
                            })}
                            {patientLabOrders.length === 0 && (
                                <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                                    <FlaskConical size={48} className="mx-auto text-slate-300 mb-4" />
                                    <p className="font-bold text-slate-400">No lab orders found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'prescriptions' && (
                    <div className="space-y-6">
                         <div className="flex justify-between items-center px-4">
                            <h4 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>Medication Records</h4>
                            <p className="text-sm font-bold text-slate-500">{patientPrescriptions.length} Records found</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {patientPrescriptions.map(rx => (
                                <div key={rx.id} className="p-8 rounded-[2.5rem] bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all group" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                                <FileText size={24} />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-lg">Rx-{rx.id.slice(0, 8).toUpperCase()}</h5>
                                                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">{new Date(rx.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => downloadPrescriptionPDF({
                                                patientName: patient.name,
                                                patientPhone: patient.phone || '',
                                                doctorName: rx.medication_data?.doctorName || 'Dr. Sarah Jenkins',
                                                clinicName: rx.medication_data?.clinicName || 'DentiSphere Clinic',
                                                date: rx.created_at,
                                                drugs: rx.medication_data?.drugs || [],
                                                notes: rx.medication_data?.notes,
                                                rxId: rx.id.slice(0, 8)
                                            })} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-primary transition-all">
                                                <Download size={18} />
                                            </button>
                                            <button onClick={() => {
                                                const drugs = rx.medication_data?.drugs || [];
                                                const msg = `Hello ${patient.name},\n\nYour prescription from DentiSphere:\n${drugs.map((d: any) => `• ${d.name} ${d.dosage} — ${d.frequency}`).join('\n')}\n\nPlease follow as directed.`;
                                                const phone = patient.phone?.replace(/\D/g, '');
                                                window.open(`https://wa.me/${phone ? '91' + phone : ''}?text=${encodeURIComponent(msg)}`, '_blank');
                                            }} className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 hover:bg-emerald-100 transition-all">
                                                <MessageSquare size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {(rx.medication_data?.drugs || []).slice(0, 2).map((d: any, i: number) => (
                                            <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                                                <span className="text-sm font-bold">{d.name}</span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase">{d.frequency}</span>
                                            </div>
                                        ))}
                                        {rx.medication_data?.drugs?.length > 2 && (
                                            <p className="text-[10px] font-bold text-slate-400 text-center">+ {rx.medication_data.drugs.length - 2} more medications</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {patientPrescriptions.length === 0 && (
                            <div className="py-20 text-center bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                                <FileText size={48} className="mx-auto mb-4 text-slate-300" />
                                <p className="text-slate-500 font-bold">No prescriptions recorded for this patient yet.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'emr' && (
                    <div className="space-y-8">
                        <div className="rounded-[3rem] p-1 border shadow-2xl relative overflow-hidden h-[600px]" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                            <Canvas shadows camera={{ position: [0, 8, 15], fov: 45 }}>
                                <Environment preset="city" />
                                <ambientLight intensity={0.6} />
                                <RealisticDentition selectedTooth={null} toothChartData={toothChartData} onSelectTooth={() => { }} />
                                <OrbitControls enablePan={false} minDistance={10} maxDistance={25} />
                            </Canvas>
                             <div className="absolute top-8 left-8 flex gap-3">
                                <div className="px-6 py-3 bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/10 text-xs font-bold text-white">Clinical View v4.0</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {Object.entries(toothChartData).map(([tooth, data]: [string, any]) => (
                                <div key={tooth} className="p-8 rounded-[2.5rem] border shadow-sm" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[10px] font-extrabold bg-primary/10 text-primary px-3 py-1 rounded-lg uppercase tracking-widest"># {tooth}</span>
                                        <span className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>{data.condition}</span>
                                    </div>
                                    <p className="text-xs font-medium italic mt-4 opacity-60" style={{ color: 'var(--text-muted)' }}>"{data.note}"</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'clinical' && (
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 p-1.5 bg-slate-100/50 dark:bg-white/5 rounded-2xl w-fit border border-slate-200 dark:border-white/10">
                            <button onClick={() => setClinicalSubTab('soap')} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${clinicalSubTab === 'soap' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-primary'}`}>Clinical Notes</button>
                            <button onClick={() => setClinicalSubTab('vitals')} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${clinicalSubTab === 'vitals' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-primary'}`}>Vital Signs</button>
                            <button onClick={() => setClinicalSubTab('consents')} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${clinicalSubTab === 'consents' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-primary'}`}>Consent Forms</button>
                            <button onClick={() => setClinicalSubTab('medical_clearance')} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${clinicalSubTab === 'medical_clearance' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-primary'}`}>Medical Clearance</button>
                        </div>

                        {clinicalSubTab === 'soap' && (
                            <div className="space-y-4">
                                <div className="flex justify-end mb-2">
                                    <button onClick={() => setIsSoapModalOpen(true)} className="bg-primary text-white px-4 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all shadow-lg shadow-primary/20 hover:scale-105 active:scale-95">
                                        <Plus size={14} /> New Clinical Note
                                    </button>
                                </div>
                                {patientNotes.length > 0 ? patientNotes.map(note => (
                                    <div key={note.id} className="p-8 rounded-[2.5rem] border shadow-sm" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h5 className="text-xl font-bold mb-1">Clinical Record: {new Date(note.created_at).toLocaleDateString()}</h5>
                                                <p className="text-xs font-bold text-primary flex items-center gap-2 uppercase tracking-widest"><ClipboardCheck size={12} /> Dr. {note.doctor_name}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => {
                                                    setIsEditingNote(true);
                                                    setEditingNoteId(note.id);
                                                    setNewNote({
                                                        subjective: note.subjective || '',
                                                        objective: note.objective || '',
                                                        assessment: note.assessment || '',
                                                        plan: '',
                                                        doctor_name: note.doctor_name || 'Dr. Sarah Jenkins'
                                                    });
                                                    try {
                                                        const parsed = JSON.parse(note.plan);
                                                        setNewNote(prev => ({ ...prev, plan: parsed.text || '' }));
                                                        setAdvisedTreatments(parsed.advised || []);
                                                        setAdvisedLabOrders(parsed.advised_labs || []);
                                                        setTreatmentsDone(parsed.treatments_done || []); // Load state flaws trigger!
                                                    } catch (e) {
                                                        setNewNote(prev => ({ ...prev, plan: note.plan || '' }));
                                                    }
                                                    setIsSoapModalOpen(true);
                                                }} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1 transition-all border dark:border-white/5 shadow-sm">
                                                    Update
                                                </button>
                                                <button onClick={() => {
                                                    let advised = [];
                                                    let advisedLabs = [];
                                                    let treatmentsDoneListed = [];
                                                    let description = note.plan;
                                                    try {
                                                         const parsed = JSON.parse(note.plan);
                                                         if (parsed && typeof parsed === 'object') {
                                                             if (parsed.text !== undefined) description = parsed.text;
                                                             advised = parsed.advised || [];
                                                             advisedLabs = parsed.advised_labs || [];
                                                             treatmentsDoneListed = parsed.treatments_done || [];
                                                         }
                                                    } catch (e) {}
                                                    downloadClinicalNotesPDF({
                                                        patientName: patient.name,
                                                        patientAge: patient.age?.toString(),
                                                        patientGender: patient.gender,
                                                        patientId: patient.id,
                                                        date: note.created_at,
                                                        clinicName: 'DentiSphere Clinic',
                                                        clinicLocation: 'Main Center',
                                                        doctorName: note.doctor_name,
                                                        subjective: note.subjective,
                                                        objective: note.objective,
                                                        assessment: note.assessment,
                                                        plan: description,
                                                        advisedTreatments: advised,
                                                        advisedLabs: advisedLabs,
                                                        treatmentsDone: treatmentsDoneListed
                                                    });
                                                }} className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1 transition-all border border-primary/20 shadow-sm">
                                                     <Download size={12} /> PDF
                                                </button>
                                                <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">Permanent Record</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Chief Complaint</p>
                                                    <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-muted)' }}>{note.subjective}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Intra Oral Examination (IOE)</p>
                                                    <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-muted)' }}>{note.objective}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Assessment</p>
                                                    <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-muted)' }}>{note.assessment}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Plan</p>
                                                    {(() => {
                                                        let description = note.plan;
                                                        let advised = note.advised_treatments || [];
                                                        let advisedLabs = [];
                                                        let treatmentsDoneListed = [];
                                                        try {
                                                            const parsed = JSON.parse(note.plan);
                                                            if (parsed && typeof parsed === 'object') {
                                                                if (parsed.text !== undefined) description = parsed.text;
                                                                if (parsed.advised) advised = parsed.advised;
                                                                if (parsed.advised_labs) advisedLabs = parsed.advised_labs;
                                                                if (parsed.treatments_done) treatmentsDoneListed = parsed.treatments_done;
                                                            }
                                                        } catch (e) { /* Fallback to raw string */ }

                                                        return (
                                                            <>
                                                                <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-muted)' }}>{description}</p>
                                                                {advised && advised.length > 0 && (
                                                                    <div className="mt-2 border-t pt-2 border-dashed border-slate-200 dark:border-slate-700">
                                                                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Advised / Recommended Treatments</p>
                                                                        <div className="space-y-1">
                                                                            {advised.map((a: any, i: number) => (
                                                                                <div key={i} className="flex justify-between items-center text-xs font-black">
                                                                                    <span><span className="text-slate-400">Tooth {a.tooth}:</span> {a.treatment}</span>
                                                                                    <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider ${a.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : a.status === 'In Progress' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>{a.status || 'Pending'}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {advisedLabs && advisedLabs.length > 0 && (
                                                                    <div className="mt-2 border-t pt-1 border-dashed border-slate-200 dark:border-slate-700">
                                                                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Advised Lab Orders</p>
                                                                        <div className="space-y-1">
                                                                            {advisedLabs.map((a: any, i: number) => (
                                                                                <div key={i} className="flex justify-between items-center text-xs font-black">
                                                                                    <span><span className="text-slate-400">Tooth {a.tooth}:</span> {a.item}</span>
                                                                                    <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider ${a.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : a.status === 'In Progress' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>{a.status || 'Pending'}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                 {treatmentsDoneListed && treatmentsDoneListed.length > 0 && (
                                                                     <div className="mt-2 border-t pt-1 border-dashed border-slate-200 dark:border-slate-700">
                                                                         <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-1">Treatments Done</p>
                                                                         <div className="space-y-1">
                                                                             {treatmentsDoneListed.map((t: any, i: number) => (
                                                                                 <div key={i} className="flex justify-between items-center text-xs font-black">
                                                                                     <span><span className="text-slate-400">Tooth {t.tooth || 'All'}:</span> {t.treatment}</span>
                                                                                     <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider ${t.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : t.status === 'In Progress' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>{t.status || 'Completed'}</span>
                                                                                 </div>
                                                                             ))}
                                                                         </div>
                                                                     </div>
                                                                 )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-20 text-center bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                                        <ClipboardCheck size={48} className="mx-auto mb-4 text-slate-300" />
                                        <p className="text-slate-500 font-bold">No clinical notes recorded yet.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {clinicalSubTab === 'vitals' && (
                            <div className="space-y-4">
                                <VitalSignsPanel patient={patient} theme={theme} />
                                {patientVitals.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {patientVitals.map(v => (
                                            <div key={v.id} className={`p-8 rounded-[2.5rem] border transition-all ${v.bp_systolic > 140 || v.spo2 < 95 ? 'border-rose-500/30 bg-rose-500/5' : 'border-slate-200 dark:border-white/10 dark:bg-white/3 bg-white'}`}>
                                                <div className="flex justify-between items-center mb-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${v.bp_systolic > 140 ? 'bg-rose-500 text-white animate-pulse' : 'bg-primary/10 text-primary'}`}>
                                                            <Heart size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{new Date(v.recorded_at).toLocaleDateString()}</p>
                                                            <p className="text-xs font-bold uppercase tracking-tighter">logged by {v.doctor_name}</p>
                                                        </div>
                                                    </div>
                                                    {(v.bp_systolic > 140 || v.spo2 < 95) && <AlertTriangle size={20} className="text-rose-500" />}
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-4 rounded-2xl bg-slate-900/5 dark:bg-white/5 border border-black/5">
                                                        <p className="text-[9px] font-extrabold text-slate-400 uppercase mb-1">Blood Pressure</p>
                                                        <p className="text-lg font-black">{v.bp_systolic || '---'}/{v.bp_diastolic || '---'}</p>
                                                        <p className="text-[8px] font-bold text-slate-400">mmHg</p>
                                                    </div>
                                                    <div className="p-4 rounded-2xl bg-slate-900/5 dark:bg-white/5 border border-black/5">
                                                        <p className="text-[9px] font-extrabold text-slate-400 uppercase mb-1">Pulse Rate</p>
                                                        <p className="text-lg font-black">{v.pulse || '---'}</p>
                                                        <p className="text-[8px] font-bold text-slate-400">BPM</p>
                                                    </div>
                                                    <div className="p-4 rounded-2xl bg-slate-900/5 dark:bg-white/5 border border-black/5">
                                                        <p className="text-[9px] font-extrabold text-slate-400 uppercase mb-1">Blood Oxygen</p>
                                                        <p className="text-lg font-black">{v.spo2 || '---'}%</p>
                                                        <p className="text-[8px] font-bold text-slate-400">SpO2</p>
                                                    </div>
                                                    <div className="p-4 rounded-2xl bg-slate-900/5 dark:bg-white/5 border border-black/5">
                                                        <p className="text-[9px] font-extrabold text-slate-400 uppercase mb-1">Temperature</p>
                                                        <p className="text-lg font-black">{v.temp || '--'}°C</p>
                                                        <p className="text-[8px] font-bold text-slate-400">Body Temp</p>
                                                    </div>
                                                </div>
                                                {v.notes && (
                                                    <div className="mt-4 p-4 rounded-xl bg-slate-100 dark:bg-black/20 text-[10px] font-medium italic text-slate-500 leading-relaxed border border-black/5">
                                                        "{v.notes}"
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-20 text-center bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                                        <Heart size={48} className="mx-auto mb-4 text-slate-300" />
                                        <p className="text-slate-500 font-bold">No vital signs recorded yet.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {clinicalSubTab === 'consents' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {patientConsents.length > 0 ? patientConsents.map(form => (
                                    <div key={form.id} className="p-8 rounded-[2.5rem] border shadow-sm group hover:scale-[1.02] transition-all" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                                    <FileSignature size={24} />
                                                </div>
                                                <div>
                                                    <h5 className="font-bold text-lg">{form.title}</h5>
                                                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">{new Date(form.created_at).toLocaleDateString()} • {form.status}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => {
                                                // Minimal print logic for now within Overview
                                                const win = window.open('', '_blank');
                                                if (win) {
                                                    win.document.write(`<html><body style="font-family:serif; padding:50px;"><h1>${form.title}</h1><p>${form.body}</p><hr/><p>Digitally Signed by ${patient.name}</p></body></html>`);
                                                    win.document.close();
                                                    win.print();
                                                }
                                            }} className="p-3 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 opacity-0 group-hover:opacity-100 transition-all active:scale-95">
                                                <Printer size={18} />
                                            </button>
                                        </div>
                                        <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-xl border border-black/5 mb-4">
                                            <p className="text-[11px] font-bold text-slate-500 leading-relaxed line-clamp-3 italic opacity-60">
                                                {form.body}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-bold text-slate-400">Auth: Dr. {form.doctor_name}</p>
                                            <span className="text-[9px] font-black px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full uppercase tracking-widest flex items-center gap-1">
                                                <CheckCircle size={10} /> Verified Signed
                                            </span>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                                        <FileSignature size={48} className="mx-auto mb-4 text-slate-300" />
                                        <p className="text-slate-500 font-bold">No digital consent forms signed yet.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {clinicalSubTab === 'medical_clearance' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {patientMedicalClearances.length > 0 ? patientMedicalClearances.map(form => (
                                    <div key={form.id} className="p-8 rounded-[2.5rem] border shadow-sm group hover:scale-[1.02] transition-all" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                                    <ClipboardCheck size={24} />
                                                </div>
                                                <div>
                                                    <h5 className="font-bold text-lg">Clearance: To {form.physician_name}</h5>
                                                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">{new Date(form.created_at).toLocaleDateString()} • {form.status}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => downloadMedicalClearancePDF({
                                                formId: form.id,
                                                date: form.signed_at || form.created_at,
                                                patientName: patient.name,
                                                patientAge: patient.age?.toString() || 'N/A',
                                                doctorName: form.doctor_name,
                                                physicianName: form.physician_name,
                                                provisionalDiagnosis: form.provisional_diagnosis,
                                                proposedTreatment: form.proposed_treatment,
                                                medicalHistory: form.medical_history,
                                                currentMedications: form.current_medications,
                                                fitnessStatus: form.fitness_status,
                                                specialInstructions: form.special_instructions,
                                                signatureUrl: form.signature_url
                                            })} className="p-3 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 opacity-0 group-hover:opacity-100 transition-all active:scale-95">
                                                <Printer size={18} />
                                            </button>
                                        </div>
                                        <div className="space-y-2 mb-4">
                                            <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
                                                <p className="text-[9px] font-black uppercase text-slate-400">Diagnosis/Treatment</p>
                                                <p className="text-xs font-bold">{form.provisional_diagnosis || 'N/A'}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="flex-1 p-2 bg-slate-50 dark:bg-white/5 rounded-lg text-center">
                                                    <p className="text-[8px] font-bold text-slate-400">FITNESS</p>
                                                    <p className="text-[10px] font-black text-primary">{form.fitness_status || 'Pending'}</p>
                                                </div>
                                                <div className="flex-1 p-2 bg-slate-50 dark:bg-white/5 rounded-lg text-center">
                                                    <p className="text-[8px] font-bold text-slate-400">STATUS</p>
                                                    <p className="text-[10px] font-black text-amber-500">{form.status}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                                        <ClipboardCheck size={48} className="mx-auto mb-4 text-slate-300" />
                                        <p className="text-slate-500 font-bold">No medical clearances issued yet.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'gallery' && (
                    <div className="space-y-10">
                        <div className="flex justify-between items-center">
                            <h4 className="text-2xl font-sans font-bold" style={{ color: 'var(--text-dark)' }}>Patient Photos</h4>
                            <label className={`bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase cursor-pointer transition-all active:scale-95 shadow-premium flex items-center gap-2 ${isUploadingPhoto ? 'opacity-50 pointer-events-none' : ''}`}>
                                <Plus size={18} /> {isUploadingPhoto ? 'Uploading...' : 'Upload Clinical Photo'}
                                <input type="file" accept="image/*" className="sr-only" disabled={isUploadingPhoto} onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    setIsUploadingPhoto(true);
                                    showToast('Compressing photo...', 'info');

                                    try {
                                        const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true };
                                        const compressedFile = await imageCompression(file, options);

                                        showToast('Uploading clinical photo...', 'info');
                                        const filename = `${Date.now()}_${file.name}`;
                                        const { data, error } = await supabase.storage.from('clinical-assets').upload(`photos/${patient.id}/${filename}`, compressedFile);

                                        if (data) {
                                            showToast('Photo uploaded to Clinical Vault!', 'success');
                                            fetchPhotos();
                                        } else {
                                            showToast(error.message, 'error');
                                        }
                                    } catch (err) {
                                        showToast('Upload failed', 'error');
                                    } finally {
                                        setIsUploadingPhoto(false);
                                    }
                                }} />
                            </label>
                        </div>

                        {photos.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {photos.map((p, i) => (
                                    <div key={i} className="aspect-square rounded-[2rem] bg-slate-100 overflow-hidden relative group border border-slate-200" style={{ background: 'var(--card-bg-alt)' }}>
                                        <img src={p.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={p.name} />
                                        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                            <button onClick={() => setPreviewPhoto(p.url)} className="p-3 bg-white rounded-xl text-primary shadow-xl hover:scale-105 active:scale-95 transition-all"><Eye size={20} /></button>
                                            <button onClick={async () => {
                                                if (confirm('Are you sure you want to delete this photo?')) {
                                                    const { error } = await supabase.storage.from('clinical-assets').remove([`photos/${patient.id}/${p.name}`]);
                                                    if (!error) {
                                                        showToast('Photo removed', 'success');
                                                        fetchPhotos();
                                                    } else {
                                                        showToast(error.message, 'error');
                                                    }
                                                }
                                            }} className="p-3 bg-white rounded-xl text-red-500 shadow-xl hover:scale-105 active:scale-95 transition-all"><Trash size={20} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                                <ImageIcon size={48} className="mx-auto mb-4 text-slate-300" />
                                <p className="text-slate-500 font-bold">No clinical photos uploaded yet.</p>
                            </div>
                        )}

                        {previewPhoto && (
                            <div className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-4 animate-fade-in" onClick={() => setPreviewPhoto(null)}>
                                <div className="max-w-4xl max-h-[90vh] relative" onClick={e => e.stopPropagation()}>
                                    <img src={previewPhoto} className="max-w-full max-h-[85vh] rounded-3xl object-contain shadow-2xl" alt="Preview Photo" />
                                    <button onClick={() => setPreviewPhoto(null)} className="absolute -top-12 right-0 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all">✕</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'messages' && (
                    <div className="max-w-3xl mx-auto space-y-6">
                        <div className="p-8 rounded-[2.5rem] border shadow-sm" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                            <h4 className="text-xl font-bold mb-6" style={{ color: 'var(--text-dark)' }}>Patient Communication</h4>
                            <div className="space-y-4">
                                <a href={`https://wa.me/${patient.phone?.replace(/\D/g, '')}`} target="_blank" className="flex items-center justify-between p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center">
                                            <MessageSquare size={24} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-emerald-600">WhatsApp</p>
                                            <p className="text-xs text-emerald-600/60">Send a message</p>
                                        </div>
                                    </div>
                                    <ArrowRightLeft className="text-emerald-500 group-hover:translate-x-1 transition-transform" />
                                </a>
                                <a href={`tel:${patient.phone}`} className="flex items-center justify-between p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center">
                                            <PhoneCall size={24} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-blue-600">Call Patient</p>
                                            <p className="text-xs text-blue-600/60">Open phone dialer</p>
                                        </div>
                                    </div>
                                    <ArrowRightLeft className="text-blue-500 group-hover:translate-x-1 transition-transform" />
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'appointments' && (
                    <div className="space-y-10">
                        <div className="flex justify-between items-center">
                            <h4 className="text-2xl font-sans font-bold" style={{ color: 'var(--text-dark)' }}>Upcoming Appointments</h4>
                            <button onClick={() => showToast('Redirecting to global calendar...', 'info')} className="bg-primary text-white px-8 py-3 rounded-2xl font-bold text-xs uppercase shadow-premium transition-all active:scale-95">
                                Schedule New
                            </button>
                        </div>
                        <div className="bg-white/5 border border-white/5 rounded-[3rem] p-12 text-center" style={{ background: 'var(--card-bg-alt)' }}>
                            <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
                            <p className="font-bold italic" style={{ color: 'var(--text-muted)' }}>No upcoming appointments for this patient.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'payment' && (
                    <div className="max-w-4xl mx-auto space-y-10">
                        <div className="p-10 rounded-[3rem] bg-primary text-white shadow-2xl relative overflow-hidden">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest mb-4 opacity-70">Total Outstanding Balance</p>
                            <h5 className="text-6xl font-sans font-bold mb-10">₹{totalDue.toLocaleString()}</h5>
                            <div className="flex gap-4">
                                <button onClick={() => showToast('Transaction processing via Digital Shield...', 'info')} className="bg-white text-primary px-10 py-5 rounded-3xl font-bold text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Settle Now</button>
                                <button className="px-8 py-5 border border-white/20 rounded-3xl flex items-center justify-center hover:bg-white/10 transition-all"><Share2 size={24} /></button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'more' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div onClick={() => setView('treatment_plan')} className={`p-10 rounded-[3rem] border shadow-sm hover:shadow-2xl hover:translate-y-[-4px] transition-all cursor-pointer group ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'}`} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                            <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 text-primary flex items-center justify-center mb-8 shadow-inner group-hover:bg-primary group-hover:text-white transition-all">
                                <Activity size={32} />
                            </div>
                            <h4 className="text-xl font-bold mb-2" style={{ color: 'var(--text-dark)' }}>Treatment Plan</h4>
                            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Create a plan for your patient.</p>
                        </div>
                        <div onClick={() => setActiveTab('payment')} className={`p-10 rounded-[3rem] border shadow-sm hover:shadow-2xl hover:translate-y-[-4px] transition-all cursor-pointer group ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'}`} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                            <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-8 shadow-inner group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                <IndianRupee size={32} />
                            </div>
                            <h4 className="text-xl font-bold mb-2" style={{ color: 'var(--text-dark)' }}>Payments</h4>
                            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Collect payment from patient.</p>
                        </div>
                    </div>
                )}
                {isSoapModalOpen && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                        <div className={`p-8 rounded-[2.5rem] w-full max-w-xl shadow-2xl animate-scale-up space-y-4 max-h-[85vh] overflow-y-auto ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`} style={{ border: '1px solid var(--border-color)' }}>
                            <div className="flex justify-between items-center mb-2 border-b pb-4" style={{ borderColor: 'var(--border-color)' }}>
                                <h3 className="font-black text-xl tracking-tight">New Clinical Note</h3>
                                <button onClick={() => setIsSoapModalOpen(false)} className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}>×</button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Practitioner</label>
                                    <div className="relative">
                                        <select value={newNote.doctor_name} onChange={e => setNewNote({ ...newNote, doctor_name: e.target.value })} className={`w-full px-5 py-3 rounded-2xl border font-bold text-sm outline-none ${theme === 'dark' ? 'bg-slate-800 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                                            {doctorsList.length > 0 ? doctorsList.map((d, i) => (
                                                <option key={i} value={`Dr. ${d}`}>{`Dr. ${d}`}</option>
                                            )) : (
                                                <>
                                                    <option value="Dr. Sarah Jenkins">Dr. Sarah Jenkins</option>
                                                    <option value="Dr. Michael Chen">Dr. Michael Chen</option>
                                                    <option value="Dr. Mark Sloan">Dr. Mark Sloan</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Chief Complaint</label>
                                    <textarea value={newNote.subjective} onChange={e => setNewNote({ ...newNote, subjective: e.target.value })} className="w-full h-16 rounded-2xl p-4 text-xs font-bold outline-none border transition-all" placeholder="Patient reports..." />
                                </div>
                                
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Intra Oral Examination (IOE)</label>
                                    <textarea value={newNote.objective} onChange={e => setNewNote({ ...newNote, objective: e.target.value })} className="w-full h-16 rounded-2xl p-4 text-xs font-bold outline-none border transition-all" placeholder="I/O exam reveals..." />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Assessment (Diagnosis)</label>
                                    <textarea value={newNote.assessment} onChange={e => setNewNote({ ...newNote, assessment: e.target.value })} className={`w-full h-16 rounded-2xl p-4 text-xs font-bold outline-none border transition-all ${theme === 'dark' ? 'bg-slate-800 border-white/10' : 'bg-slate-50 border-slate-200'}`} placeholder="Diagnosis details..." />
                                </div>



                                {/* ── Advised Treatments Row ── */}
                                <div className="border border-dashed border-slate-200 dark:border-slate-700 p-4 rounded-2xl">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Advised Treatments</label>
                                    <div className="flex gap-2 mb-2">
                                        <select value={newAdvice.treatment} onChange={e => setNewAdvice({ ...newAdvice, treatment: e.target.value, tooth: '' })} className="flex-1 px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border dark:border-white/10 rounded-xl outline-none">
                                            <option value="">Select Treatment...</option>
                                            {standardTreatments.map((t, i) => <option key={i} value={t}>{t}</option>)}
                                        </select>
                                        <button onClick={() => {
                                            if (newAdvice.treatment) {
                                                setAdvisedTreatments([...advisedTreatments, newAdvice]);
                                                setNewAdvice({ tooth: '', treatment: '' });
                                            }
                                        }} className="p-2.5 rounded-xl bg-emerald-500 text-white flex items-center justify-center"><Plus size={16} /></button>
                                    </div>
                                    {newAdvice.treatment && (
                                        <ToothSelector selected={newAdvice.tooth} onSelect={t => setNewAdvice({ ...newAdvice, tooth: t })} patientAge={patient.age} />
                                    )}
                                    
                                    {advisedTreatments.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                            {advisedTreatments.map((a: any, i) => (
                                                <div key={i} className="flex justify-between items-center bg-slate-100 dark:bg-white/5 p-2 rounded-xl">
                                                    <span className="text-xs font-black"><span className="text-slate-400"># {a.tooth || 'All'}:</span> {a.treatment}</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <select value={a.status || 'Pending'} onChange={(e) => { const updated = [...advisedTreatments]; updated[i].status = e.target.value; setAdvisedTreatments(updated); }} className="px-2 py-1 bg-slate-200 dark:bg-slate-700/50 rounded-lg text-[9px] font-bold outline-none border border-slate-300 dark:border-white/10">
                                                            <option value="Pending">Pending</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option>
                                                        </select>
                                                        <button onClick={() => setAdvisedTreatments(advisedTreatments.filter((_, idx) => idx !== i))} className="text-rose-500 hover:text-rose-600"><Trash2 size={12} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* ── Advised Lab Orders Row ── */}
                                <div className="border border-dashed border-slate-200 dark:border-slate-700 p-4 rounded-2xl">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Advised Lab Orders</label>
                                    <div className="flex gap-2 mb-2">
                                        <select value={newLabAdvice.item} onChange={e => setNewLabAdvice({ ...newLabAdvice, item: e.target.value, tooth: '' })} className="flex-1 px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border dark:border-white/10 rounded-xl outline-none">
                                            <option value="">Select Lab Item...</option>
                                            {standardLabs.map((l, i) => <option key={i} value={l}>{l}</option>)}
                                        </select>
                                        <button onClick={() => {
                                            if (newLabAdvice.item) {
                                                setAdvisedLabOrders([...advisedLabOrders, { ...newLabAdvice, status: 'Pending' }]);
                                                setNewLabAdvice({ tooth: '', item: '' });
                                            }
                                        }} className="p-2.5 rounded-xl bg-blue-500 text-white flex items-center justify-center"><Plus size={16} /></button>
                                    </div>
                                    {newLabAdvice.item && (
                                        <ToothSelector selected={newLabAdvice.tooth} onSelect={t => setNewLabAdvice({ ...newLabAdvice, tooth: t })} patientAge={patient.age} />
                                    )}
                                    
                                    {advisedLabOrders.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                            {advisedLabOrders.map((a: any, i) => (
                                                <div key={i} className="flex justify-between items-center bg-slate-100 dark:bg-white/5 p-2 rounded-xl">
                                                    <span className="text-xs font-black"><span className="text-slate-400"># {a.tooth || 'All'}:</span> {a.item}</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <select value={a.status || 'Pending'} onChange={(e) => { const updated = [...advisedLabOrders]; updated[i].status = e.target.value; setAdvisedLabOrders(updated); }} className="px-2 py-1 bg-slate-200 dark:bg-slate-700/50 rounded-lg text-[9px] font-bold outline-none border border-slate-300 dark:border-white/10">
                                                            <option value="Pending">Pending</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option>
                                                        </select>
                                                        <button onClick={() => setAdvisedLabOrders(advisedLabOrders.filter((_, idx) => idx !== i))} className="text-rose-500 hover:text-rose-600"><Trash2 size={12} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* ── Treatment Done Row ── */}
                                <div className="border border-dashed border-slate-200 dark:border-slate-700 p-4 rounded-2xl">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Treatment Done</label>
                                    <div className="flex gap-2 mb-2">
                                        <select value={newTreatmentDone.treatment} onChange={e => setNewTreatmentDone({ ...newTreatmentDone, treatment: e.target.value, tooth: '' })} className="flex-1 px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border dark:border-white/10 rounded-xl outline-none">
                                            <option value="">Select Treatment...</option>
                                            {standardTreatments.map((t, i) => <option key={i} value={t}>{t}</option>)}
                                        </select>
                                        <select value={newTreatmentDone.status} onChange={e => setNewTreatmentDone({ ...newTreatmentDone, status: e.target.value })} className="px-2 py-1 text-[10px] font-bold bg-slate-50 dark:bg-slate-800 border dark:border-white/10 rounded-lg outline-none">
                                            <option value="Completed">Completed</option><option value="Pending">Pending</option><option value="In Progress">In Progress</option>
                                        </select>
                                        <button onClick={() => {
                                            if (newTreatmentDone.treatment) {
                                                setTreatmentsDone([...treatmentsDone, newTreatmentDone]);
                                                setNewTreatmentDone({ tooth: '', treatment: '', status: 'Completed' });
                                            }
                                        }} className="p-2.5 rounded-xl bg-violet-500 text-white flex items-center justify-center"><Plus size={16} /></button>
                                    </div>
                                    {newTreatmentDone.treatment && (
                                        <ToothSelector selected={newTreatmentDone.tooth} onSelect={t => setNewTreatmentDone({ ...newTreatmentDone, tooth: t })} patientAge={patient.age} />
                                    )}
                                    
                                    {treatmentsDone.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                            {treatmentsDone.map((t: any, i) => (
                                                <div key={i} className="flex justify-between items-center bg-slate-100 dark:bg-white/5 p-2 rounded-xl">
                                                    <span className="text-xs font-black"><span className="text-slate-400"># {t.tooth || 'All'}:</span> {t.treatment}</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-extrabold border uppercase ${t.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : t.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>{t.status}</span>
                                                        <button onClick={() => setTreatmentsDone(treatmentsDone.filter((_, idx) => idx !== i))} className="text-rose-500 hover:text-rose-600"><Trash2 size={12} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button onClick={handleSaveNote} disabled={isSavingNote} className="w-full py-4 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2">
                                    {isSavingNote ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />} Save Record
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
