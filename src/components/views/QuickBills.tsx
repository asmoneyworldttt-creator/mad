
import { useState, useEffect, useRef } from 'react'; import { Search, Plus, Save, IndianRupee, Calendar, Printer, List, Receipt, ChevronRight, X, Download, FileText } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { supabase } from '../../supabase';
import { SkeletonList } from '../SkeletonLoader';
import { EmptyState } from '../EmptyState';
import { downloadInvoicePDF, downloadDentalCertificatePDF } from '../../utils/pdfExport';
import { CustomSelect } from '../ui/CustomControls';

type UserRole = 'master' | 'admin' | 'staff' | 'patient';
const INR = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
const PAYMENT_METHODS = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Insurance', 'Cheque'];

export function QuickBills({ userRole, theme, setActiveTab }: { userRole: UserRole; theme?: 'light' | 'dark'; setActiveTab?: (tab: string) => void }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [view, setView] = useState<'form' | 'history'>('form');

    // ── Search & patient ──
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [patientInfo, setPatientInfo] = useState({ id: '', name: '', phone: '', address: '' });

    // ── Bill history ──
    const [bills, setBills] = useState<any[]>([]);
    const [isLoadingBills, setIsLoadingBills] = useState(false);

    // ── Form ──
    const [clinicInfo, setClinicInfo] = useState({ location: 'Main Clinic – Downtown', doctor: 'Dr. S. Jenkins', date: new Date().toISOString().split('T')[0] });
    const [treatmentInfo, setTreatmentInfo] = useState({ complaint: '', treatmentDone: '', observationNotes: '', medicine: '' });
    const [selectedTreatments, setSelectedTreatments] = useState<{ treatment: string; tooth: string; cost: number; status: string }[]>([]);
    const [generateCertificate, setGenerateCertificate] = useState(false);
    const [certificateInfo, setCertificateInfo] = useState({ chiefComplaint: '', clinicalFindings: '', remarks: '' });
    const [billingInfo, setBillingInfo] = useState({ fees: 0, profFee: 0, discount: 0, gstRate: 0, paymentMethod: 'Cash', paymentStatus: 'Paid' as 'Paid' | 'Unpaid' | 'Partial' });
    const [followUpInfo, setFollowUpInfo] = useState({ remarks: '', advice: '', referTo: '', followUpDate: '', followUpTime: '' });
    const [isSaving, setIsSaving] = useState(false);
    const invoiceRef = useRef<any>(null);

    const [fetchedTreatments, setFetchedTreatments] = useState<string[]>([]); // To provide dropdown standard treatments

    // ── Computed totals ──
    const subtotal = selectedTreatments.reduce((acc, t) => acc + (Number(t.cost) || 0), 0) + billingInfo.fees;
    const gstAmount = Math.round((subtotal - billingInfo.discount) * billingInfo.gstRate / 100);
    const totalPayable = subtotal - billingInfo.discount + gstAmount;

    useEffect(() => {
        // Load standard treatments from somewhere or make a local array
        setFetchedTreatments([
            'Oral examination', 'Scaling & polishing', 'Composite restoration', 'Glass ionomer restoration', 'Root Canal Treatment', 'Simple extraction', 'Surgical extraction', 'Crown (PFM)', 'Crown (Zirconia)', 'Bridges', 'Denture', 'Veneers', 'Implant placement'
        ]);
    }, []);

    useEffect(() => {
        if (searchQuery.length > 2) {
            supabase.from('patients').select('*').or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,id.ilike.%${searchQuery}%`).limit(5)
                .then(({ data }) => setSearchResults(data || []));
        } else setSearchResults([]);
    }, [searchQuery]);

    const fetchBills = async () => {
        setIsLoadingBills(true);
        const { data: billsData } = await supabase.from('bills').select('*').order('date', { ascending: false }).limit(50);
        
        const mapped: any[] = [];
        if (billsData && billsData.length > 0) {
            const patientIds = [...new Set(billsData.map(b => b.patient_id))];
            const { data: ptData } = await supabase.from('patients').select('id, name, phone').in('id', patientIds);

            billsData.forEach(b => {
                mapped.push({
                    ...b,
                    patients: ptData?.find(pt => pt.id === b.patient_id)
                });
            });
            setBills(mapped);
        } else {
            setBills([]);
        }
        setIsLoadingBills(false);
    };

    useEffect(() => { if (view === 'history') fetchBills(); }, [view]);

    const handleSelectPatient = (p: any) => {
        setSelectedPatient(p);
        setPatientInfo({ id: p.id, name: p.name, phone: p.phone || '', address: p.address || '' });
        setSearchQuery('');
        setSearchResults([]);
    };

    const getInvoiceNumber = () => `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const handleSave = async () => {
        if (!selectedPatient && !patientInfo.name) return showToast('Select or enter patient info', 'error');
        if (billingInfo.profFee > totalPayable) return showToast('Professional fee cannot exceed total bill!', 'error');
        setIsSaving(true);

        const patientId = selectedPatient?.id || `PT-${Math.floor(Math.random() * 100000)}`;
        const date = clinicInfo.date;
        const invoiceNo = getInvoiceNumber();

        const treatmentsStr = selectedTreatments.length > 0 ? selectedTreatments.map(t => `${t.treatment}${t.tooth ? ` (${t.tooth})` : ''}`).join(', ') : (treatmentInfo.treatmentDone || 'General Consultation');

        const notesStr = (treatmentInfo.observationNotes ? `${treatmentInfo.observationNotes}\n` : '') +
                        (generateCertificate ? `[Certificate]: true\n[Complaint]: ${certificateInfo.chiefComplaint}\n[Findings]: ${certificateInfo.clinicalFindings}\n[CertRemarks]: ${certificateInfo.remarks}\n` : '') +
                        `[FollowUp]: ${followUpInfo.followUpDate || ''} ${followUpInfo.followUpTime || ''}`;

        const { data: billData, error: billError } = await supabase.from('bills').insert({
            patient_id: patientId,
            patient_name: patientInfo.name,
            amount: totalPayable,
            status: billingInfo.paymentStatus.toLowerCase(),
            date,
            prof_fee: billingInfo.profFee,
            discount: billingInfo.discount,
            payment_method: billingInfo.paymentMethod,
            treatment_name: treatmentsStr,
            complaint: treatmentInfo.complaint,
            notes: notesStr,
            doctor_name: clinicInfo.doctor,
            invoice_number: invoiceNo,
        }).select().single();

        // Also sync to general patient history for the Overview tab
        await supabase.from('patient_history').insert({
            patient_id: patientId,
            date,
            treatment: `Bill Generated: ${invoiceNo}`,
            category: 'Financial',
            cost: totalPayable,
            notes: `Treatment: ${treatmentsStr}. Method: ${billingInfo.paymentMethod}`,
            doctor_name: clinicInfo.doctor
        });

        if (followUpInfo.followUpDate) {
            await supabase.from('appointments').insert({
                id: `APT-${Math.floor(Math.random() * 100000)}`,
                name: patientInfo.name,
                time: followUpInfo.followUpTime || '10:00 AM',
                type: 'Follow-up',
                status: 'Confirmed',
                date: followUpInfo.followUpDate,
            });
        }

        setIsSaving(false);
        if (billError) { showToast('Error saving bill: ' + billError.message, 'error'); return; }

        showToast(`Bill ${invoiceNo} saved!`, 'success');

        // ── AUTO DOWNLOAD SECTION ──
        handleDownloadInvoice({ id: invoiceNo, amount: totalPayable, date, invoice_number: invoiceNo, treatment_name: treatmentsStr });

        if (generateCertificate) {
            // Import if missing from top: downloadDentalCertificatePDF
            const downloadFn = (window as any).downloadDentalCertificatePDF || downloadDentalCertificatePDF;
            if (typeof downloadFn === 'function') {
                setTimeout(() => {
                    downloadFn({
                        patientName: patientInfo.name,
                        patientPhone: patientInfo.phone,
                        patientAge: selectedPatient?.age,
                        patientGender: selectedPatient?.gender,
                        patientId: selectedPatient?.id,
                        date: date,
                        clinicName: 'DentiSphere Clinic',
                        clinicLocation: clinicInfo.location,
                        doctorName: clinicInfo.doctor,
                        chiefComplaint: certificateInfo.chiefComplaint,
                        clinicalFindings: certificateInfo.clinicalFindings,
                        procedures: selectedTreatments.length > 0 ? selectedTreatments : [{ tooth: '—', treatment: treatmentInfo.treatmentDone || 'Dental Treatment', status: 'Completed', cost: billingInfo.fees }],
                        remarks: certificateInfo.remarks
                    });
                    showToast('Dental Certificate PDF downloaded!', 'success');
                }, 1000);
            }
        }

        // Reset
        setTreatmentInfo({ complaint: '', treatmentDone: '', observationNotes: '', medicine: '' });
        setBillingInfo({ fees: 0, profFee: 0, discount: 0, gstRate: 0, paymentMethod: 'Cash', paymentStatus: 'Paid' });
        setFollowUpInfo({ remarks: '', advice: '', referTo: '', followUpDate: '', followUpTime: '' });
        setSelectedPatient(null);
        setPatientInfo({ id: '', name: '', phone: '', address: '' });
        setSelectedTreatments([]);
        setGenerateCertificate(false);
        setCertificateInfo({ chiefComplaint: '', clinicalFindings: '', remarks: '' });
    };

    const handleDownloadInvoice = (bill: any) => {
        downloadInvoicePDF({
            invoiceNumber: bill.invoice_number || bill.id || `INV-${Date.now()}`,
            date: bill.date || new Date().toISOString().split('T')[0],
            patientName: bill.patients?.name || patientInfo.name || 'Patient',
            patientPhone: bill.patients?.phone || patientInfo.phone,
            patientAddress: patientInfo.address,
            clinicName: 'DentiSphere Clinic',
            clinicLocation: clinicInfo.location,
            doctorName: bill.doctor_name || clinicInfo.doctor,
            treatmentName: bill.treatment_name || 'General Consultation',
            grossAmount: bill.amount || totalPayable,
            discount: bill.discount || billingInfo.discount,
            gstRate: billingInfo.gstRate,
            gstAmount: bill.gst_amount || gstAmount,
            totalAmount: bill.amount || totalPayable,
            paymentMethod: bill.payment_method || billingInfo.paymentMethod,
            paymentStatus: bill.status || billingInfo.paymentStatus,
        });
        showToast('Invoice PDF downloaded!', 'success');
    };

    const handleDownloadCertificateFromHistory = (bill: any) => {
        const notes = bill.notes || '';
        const complaint = notes.match(/\[Complaint\]:\s*([\s\S]*?)(?=\n\[|$)/)?.[1]?.trim() || '';
        const findings = notes.match(/\[Findings\]:\s*([\s\S]*?)(?=\n\[|$)/)?.[1]?.trim() || '';
        const remarks = notes.match(/\[CertRemarks\]:\s*([\s\S]*?)(?=\n\[|$)/)?.[1]?.trim() || '';

        const procedures = bill.treatment_name?.split(', ').map((it: string) => {
            const toothMatch = it.match(/\((.*?)\)/);
            return { treatment: it.replace(/\(.*?\)/, '').trim(), tooth: toothMatch ? toothMatch[1] : '—', status: 'Completed', cost: 0 };
        }) || [];

        const downloadFn = (window as any).downloadDentalCertificatePDF || downloadDentalCertificatePDF;
        if (typeof downloadFn === 'function') {
            downloadFn({
                patientName: bill.patients?.name || bill.patient_name || 'Patient',
                patientPhone: bill.patients?.phone || '',
                date: bill.date,
                clinicName: 'DentiSphere Clinic',
                clinicLocation: clinicInfo.location,
                doctorName: bill.doctor_name || clinicInfo.doctor,
                chiefComplaint: complaint || bill.complaint || '',
                clinicalFindings: findings || '',
                procedures: procedures.length > 0 ? procedures : [{ tooth: '—', treatment: bill.treatment_name || 'Treatment', status: 'Completed', cost: 0 }],
                remarks: remarks || ''
            });
            showToast('Health Certificate downloaded!', 'success');
        } else {
            showToast('Certificate exporter not ready', 'error');
        }
    };

    // ─── BILL HISTORY VIEW ───
    if (view === 'history') {
        const statusColor: any = { paid: 'text-emerald-600 bg-emerald-50 border-emerald-200', unpaid: 'text-rose-500 bg-rose-50 border-rose-200', partial: 'text-amber-500 bg-amber-50 border-amber-200' };
        return (
            <div className="animate-slide-up space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-dark)' }}>Financial Records</h2>
                        <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-muted)' }}>Consolidated ledger of all clinical transactions</p>
                    </div>
                    <button onClick={() => setView('form')} className="flex items-center gap-3 px-8 py-3.5 bg-primary text-white rounded-2xl font-bold text-sm shadow-premium hover:scale-[1.03] active:scale-95 transition-all">
                        <Plus size={20} /> Generate Invoice
                    </button>
                </div>
                <div className="rounded-[2rem] border overflow-hidden shadow-premium" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-sm font-bold border-b" style={{ background: 'var(--card-bg-alt)', color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}>
                                <tr>
                                    {['Transaction ID', 'Patient Detail', 'Assigned Treatment', 'Settled Amount', 'Payment Method', 'Lifecycle Status', 'Date', ''].map(h => (
                                        <th key={h} className="px-6 py-5 whitespace-nowrap uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                                {isLoadingBills ? (
                                    <tr><td colSpan={8} className="p-6">
                                        <SkeletonList rows={6} />
                                    </td></tr>
                                ) : bills.map(b => (
                                    <tr key={b.id} className="transition-all hover:bg-black/5 dark:hover:bg-white/5 border-b last:border-0" style={{ borderColor: 'var(--border-color)' }}>
                                        <td className="px-6 py-5 font-bold text-primary text-sm">{b.invoice_number || b.id?.slice(0, 10)}</td>
                                        <td className="px-6 py-5 font-bold text-sm" style={{ color: 'var(--text-main)' }}>{b.patients?.name || '—'}</td>
                                        <td className="px-6 py-5 text-sm max-w-[200px] truncate font-medium" style={{ color: 'var(--text-muted)' }}>{b.treatment_name || '—'}</td>
                                        <td className="px-6 py-5 font-bold text-base" style={{ color: 'var(--text-main)' }}>{INR(b.amount || 0)}</td>
                                        <td className="px-6 py-5 text-sm font-bold" style={{ color: 'var(--text-muted)' }}>{b.payment_method || '—'}</td>
                                          <td className="px-6 py-5">
                                              <span className={`px-4 py-1.5 rounded-full text-xs font-bold border shadow-sm ${b.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : b.status === 'Unpaid' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                                  {b.status}
                                              </span>
                                          </td>
                                         <td className="px-6 py-5 text-sm font-bold" style={{ color: 'var(--text-muted)' }}>{new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                        <td className="px-6 py-5 flex items-center gap-1.5">
                                            <button onClick={() => handleDownloadInvoice(b)}
                                                className="p-2.5 rounded-xl border transition-all hover:scale-105 shadow-sm"
                                                style={{ background: 'var(--primary-soft)', borderColor: 'var(--border-color)', color: 'var(--primary)' }}
                                                title="Download Invoice">
                                                <Download size={18} />
                                            </button>
                                            {b.notes?.includes('[Certificate]: true') && (
                                                <button onClick={() => handleDownloadCertificateFromHistory(b)}
                                                    className="p-2.5 rounded-xl border transition-all hover:scale-105 shadow-sm bg-amber-500/5 text-amber-500 border-amber-500/20"
                                                    title="Download Treatment Certificate">
                                                    <FileText size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {!isLoadingBills && bills.length === 0 && (
                                    <tr><td colSpan={8} className="py-20 text-center">
                                        <EmptyState
                                            icon={Receipt}
                                            title="No Invoices Found"
                                            description="No clinical transactions have been recorded in this node yet."
                                            actionLabel="Generate New Bill"
                                            onAction={() => setView('form')}
                                        />
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    // ─── BILL FORM VIEW ───
    const inputCls = `w-full px-4 py-3.5 rounded-2xl border font-bold text-sm outline-none transition-all focus:ring-4 focus:ring-primary/10 shadow-inner`;
    const labelCls = 'text-sm font-bold px-1.5 mb-2.5 block';
    const cardCls = `p-6 md:p-8 rounded-[2rem] border shadow-premium`;

    return (
        <div className="animate-slide-up space-y-6 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className={`text-2xl md:text-3xl font-bold tracking-tight`} style={{ color: 'var(--text-dark)' }}>Clinical Invoicing</h2>
                    <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-muted)' }}>Generate patient financial ledger and treatment records</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setView('history')} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm border transition-all hover:scale-105 active:scale-95 shadow-sm`} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                        <List size={18} /> View History
                    </button>
                    <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-2xl font-bold text-sm shadow-premium shadow-primary/20 hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-50">
                        {isSaving ? <div className="w-5 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
                        Save & Export
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                    {/* General Info */}
                    <div className={cardCls} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                        <p className="text-xs font-bold text-primary flex items-center gap-2 mb-4">Clinic Information</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className={labelCls} style={{ color: 'var(--text-muted)' }}>Date</label>
                                <input type="date" value={clinicInfo.date} onChange={e => setClinicInfo({ ...clinicInfo, date: e.target.value })} className={inputCls} style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} />
                            </div>
                            <div>
                                <label className={labelCls} style={{ color: 'var(--text-muted)' }}>Doctor</label>
                                <CustomSelect
                                    value={clinicInfo.doctor}
                                    onChange={val => setClinicInfo({ ...clinicInfo, doctor: val })}
                                    options={[
                                        'Dr. S. Jenkins',
                                        'Dr. Michael Chen',
                                        'Dr. Mark Sloan'
                                    ]}
                                />
                            </div>
                            <div>
                                <label className={labelCls} style={{ color: 'var(--text-muted)' }}>Center</label>
                                <CustomSelect
                                    value={clinicInfo.location}
                                    onChange={val => setClinicInfo({ ...clinicInfo, location: val })}
                                    options={[
                                        'Main Clinic – Downtown',
                                        'Branch – Northside'
                                    ]}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Patient Search */}
                    <div className={cardCls} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                        <div className="flex justify-between items-center mb-4 px-2">
                            <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>Patient Information</p>
                            {selectedPatient && <button onClick={() => { setSelectedPatient(null); setPatientInfo({ id: '', name: '', phone: '', address: '' }); }} className="text-xs font-bold text-rose-500 hover:scale-105 transition-transform flex items-center gap-1"><X size={14} /> Clear patient</button>}
                        </div>
                        <div className="relative mb-4">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                            <input type="text" placeholder="Search patient..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className={`${inputCls} pl-10`} style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} />
                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 p-1.5 rounded-2xl shadow-xl z-[100] border backdrop-blur-xl" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                                    {searchResults.map(p => (
                                        <button key={p.id} onClick={() => handleSelectPatient(p)} className="w-full text-left px-4 py-3 rounded-xl hover:bg-primary/5 flex items-center gap-3 transition-all">
                                            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-[10px]">{p.name?.charAt(0)}</div>
                                            <div>
                                                <p className="font-bold text-xs" style={{ color: 'var(--text-dark)' }}>{p.name}</p>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{p.phone}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {selectedPatient && (
                            <div className="flex items-center gap-3 p-3.5 rounded-2xl mb-4 border animate-pulse-subtle" style={{ background: 'var(--primary-soft)', borderColor: 'var(--primary-glow)' }}>
                                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-black shadow-md">{selectedPatient.name?.charAt(0)}</div>
                                <div>
                                    <p className="font-black text-primary text-sm">{selectedPatient.name}</p>
                                    <p className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>{selectedPatient.phone} • ID: {selectedPatient.id}</p>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls} style={{ color: 'var(--text-muted)' }}>Name</label>
                                <input type="text" value={patientInfo.name} onChange={e => setPatientInfo({ ...patientInfo, name: e.target.value })} placeholder="Temporary" className={inputCls} style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} />
                            </div>
                            <div>
                                <label className={labelCls} style={{ color: 'var(--text-muted)' }}>Contact</label>
                                <input type="tel" value={patientInfo.phone} onChange={e => setPatientInfo({ ...patientInfo, phone: e.target.value })} className={inputCls} style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} />
                            </div>
                            <div className="col-span-2">
                                <label className={labelCls} style={{ color: 'var(--text-muted)' }}>Address</label>
                                <input type="text" value={patientInfo.address} onChange={e => setPatientInfo({ ...patientInfo, address: e.target.value })} placeholder="Billing address..." className={inputCls} style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} />
                            </div>
                        </div>
                    </div>

                    {/* Treatment Details & Certificate */}
                    <div className={cardCls} style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                        <p className="text-xs font-bold text-primary flex items-center gap-2 mb-4">Treatment & Procedures</p>
                        <div className="space-y-4">
                            <div>
                                <label className={labelCls} style={{ color: 'var(--text-muted)' }}>Reason for visit (Chief Complaint)</label>
                                <input type="text" value={treatmentInfo.complaint} onChange={e => setTreatmentInfo({ ...treatmentInfo, complaint: e.target.value })} className={inputCls} placeholder="e.g. Toothache, Swelling..." style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} />
                            </div>

                            <div className="border-t border-dashed pt-4 border-black/5">
                                <label className={labelCls} style={{ color: 'var(--text-muted)' }}>Add Specific Procedure</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                                    <div className="sm:col-span-1">
                                        <CustomSelect 
                                            value="" 
                                            onChange={(val) => {
                                                if (!val) return;
                                                setSelectedTreatments([...selectedTreatments, { treatment: val, tooth: '—', cost: 0, status: 'Completed' }]);
                                            }} 
                                            options={fetchedTreatments} 
                                        />
                                    </div>
                                    <input type="text" placeholder="Custom Procedure..." className={inputCls} style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)' }} onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const val = (e.target as HTMLInputElement).value;
                                            if (val) {
                                                setSelectedTreatments([...selectedTreatments, { treatment: val, tooth: '—', cost: 0, status: 'Completed' }]);
                                                (e.target as HTMLInputElement).value = '';
                                            }
                                        }
                                    }} />
                                </div>

                                {selectedTreatments.length > 0 && (
                                    <div className="space-y-2 mb-4">
                                        {selectedTreatments.map((t, i) => (
                                            <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border flex items-center justify-between gap-3 text-sm">
                                                <div className="flex-1">
                                                    <p className="font-bold">{t.treatment}</p>
                                                    <div className="flex gap-4 mt-1">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-[10px] text-slate-400">Tooth:</span>
                                                            <input type="text" value={t.tooth} onChange={e => {
                                                                const list = [...selectedTreatments];
                                                                list[i].tooth = e.target.value;
                                                                setSelectedTreatments(list);
                                                            }} className="w-16 bg-transparent border-b border-black/10 px-1 outline-none font-bold text-center text-xs" />
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-[10px] text-slate-400">Cost (₹):</span>
                                                            <input type="number" value={t.cost || ''} onChange={e => {
                                                                const list = [...selectedTreatments];
                                                                list[i].cost = parseFloat(e.target.value) || 0;
                                                                setSelectedTreatments(list);
                                                            }} className="w-20 bg-transparent border-b border-black/10 px-1 outline-none font-bold text-center text-xs text-primary" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <button onClick={() => setSelectedTreatments(selectedTreatments.filter((_, idx) => idx !== i))} className="text-rose-500 hover:scale-110"><X size={16} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className={labelCls} style={{ color: 'var(--text-muted)' }}>General Procedure Details</label>
                                <textarea rows={2} value={treatmentInfo.treatmentDone} onChange={e => setTreatmentInfo({ ...treatmentInfo, treatmentDone: e.target.value })} className={`${inputCls} resize-none`} placeholder="Specify anything extra..." style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} />
                            </div>

                            <div className="border-t border-dashed pt-4 border-black/5 mt-4">
                                <label className="flex items-center gap-3 cursor-pointer text-sm font-bold">
                                    <input type="checkbox" checked={generateCertificate} onChange={e => setGenerateCertificate(e.target.checked)} className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4" />
                                    Generate Treatment Certificate (Medical Report)
                                </label>

                                {generateCertificate && (
                                    <div className="mt-4 p-5 rounded-2xl bg-primary/5 border border-primary/20 space-y-4 animate-slide-up">
                                        <p className="text-xs font-bold text-primary">Certificate Configuration</p>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 block">Clinical Findings</label>
                                            <input type="text" value={certificateInfo.clinicalFindings} onChange={e => setCertificateInfo({ ...certificateInfo, clinicalFindings: e.target.value })} className={inputCls} placeholder="Intra oral finding details..." />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 block">Procedure/Instructions For Certificate</label>
                                            <textarea rows={2} value={certificateInfo.remarks} onChange={e => setCertificateInfo({ ...certificateInfo, remarks: e.target.value })} className={`${inputCls} resize-none`} placeholder="Specific clinical remarks..." />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Follow-up */}
                    <div className={cardCls}>
                        <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-4">Follow-up & Advice</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className={labelCls}>Advice / Remarks</label>
                                <textarea rows={2} value={followUpInfo.advice} onChange={e => setFollowUpInfo({ ...followUpInfo, advice: e.target.value })} className={`${inputCls} resize-none`} />
                            </div>
                            <div>
                                <label className={labelCls}>Follow-up Date</label>
                                <input type="date" value={followUpInfo.followUpDate} onChange={e => setFollowUpInfo({ ...followUpInfo, followUpDate: e.target.value })} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Time</label>
                                <input type="time" value={followUpInfo.followUpTime} onChange={e => setFollowUpInfo({ ...followUpInfo, followUpTime: e.target.value })} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Refer To</label>
                                <input type="text" value={followUpInfo.referTo} onChange={e => setFollowUpInfo({ ...followUpInfo, referTo: e.target.value })} className={inputCls} placeholder="Specialist / Department" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── RIGHT: Billing + Invoice Summary ─── */}
                <div className="space-y-4">
                    <div className={`${cardCls} sticky top-6`}>
                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-4">Invoice</p>

                        <div className="space-y-3">
                            <div>
                                <label className={labelCls}>Gross Fees (₹)</label>
                                <div className={`flex items-center rounded-xl border overflow-hidden ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                                    <span className={`px-3 text-slate-400 ${isDark ? 'border-white/10' : 'border-r border-slate-200'} flex items-center py-2 border-r`}><IndianRupee size={12} /></span>
                                    <input type="number" value={billingInfo.fees || ''} onChange={e => setBillingInfo({ ...billingInfo, fees: parseFloat(e.target.value) || 0 })} className={`flex-1 px-3 py-2 bg-transparent font-bold text-[11px] outline-none ${isDark ? 'text-white' : 'text-slate-700'}`} placeholder="0" />
                                </div>
                            </div>

                            <div>
                                <label className={labelCls}>Prof. Fee (₹)</label>
                                <div className={`flex items-center rounded-xl border overflow-hidden ${isDark ? 'border-primary/20 bg-primary/5' : 'border-primary/20 bg-primary/5'}`}>
                                    <span className="px-3 text-primary border-r border-primary/20 flex items-center py-2"><IndianRupee size={12} /></span>
                                    <input type="number" value={billingInfo.profFee || ''} onChange={e => setBillingInfo({ ...billingInfo, profFee: parseFloat(e.target.value) || 0 })} className="flex-1 px-3 py-2 bg-transparent font-bold text-[11px] outline-none text-primary" placeholder="0" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelCls}>Discount (₹)</label>
                                    <input type="number" value={billingInfo.discount || ''} onChange={e => setBillingInfo({ ...billingInfo, discount: parseFloat(e.target.value) || 0 })} className={inputCls} placeholder="0" />
                                </div>
                                <div>
                                    <label className={labelCls}>GST %</label>
                                    <select value={billingInfo.gstRate} onChange={e => setBillingInfo({ ...billingInfo, gstRate: parseFloat(e.target.value) })} className={inputCls}>
                                        <option value={0}>0%</option>
                                        <option value={5}>5%</option>
                                        <option value={12}>12%</option>
                                        <option value={18}>18%</option>
                                    </select>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label className={labelCls}>Method</label>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {PAYMENT_METHODS.map(m => (
                                        <button key={m} onClick={() => setBillingInfo({ ...billingInfo, paymentMethod: m })}
                                            className={`py-1.5 text-[9px] font-extrabold rounded-lg border transition-all ${billingInfo.paymentMethod === m ? 'bg-primary text-white border-primary shadow-md' : isDark ? 'bg-white/5 border-white/10 text-slate-400 hover:border-primary/30' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}>
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Status */}
                            <div>
                                <label className={labelCls}>Status</label>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {(['Paid', 'Unpaid', 'Partial'] as const).map(s => (
                                        <button key={s} onClick={() => setBillingInfo({ ...billingInfo, paymentStatus: s })}
                                            className={`py-1.5 text-[9px] font-extrabold rounded-lg border transition-all ${billingInfo.paymentStatus === s ? 'bg-primary text-white border-primary shadow-md' : isDark ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-white text-slate-400 border-slate-100'}`}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Totals */}
                        <div className={`mt-4 pt-4 border-t space-y-1.5 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                            <div className="flex justify-between text-[11px]"><span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Gross</span><span className="font-bold">{INR(subtotal)}</span></div>
                            {billingInfo.discount > 0 && <div className="flex justify-between text-[11px]"><span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Discount</span><span className="font-bold text-rose-500">− {INR(billingInfo.discount)}</span></div>}
                            {billingInfo.gstRate > 0 && <div className="flex justify-between text-[11px]"><span className={isDark ? 'text-slate-400' : 'text-slate-500'}>GST ({billingInfo.gstRate}%)</span><span className="font-bold">{INR(gstAmount)}</span></div>}
                            <div className={`flex justify-between items-center p-3 rounded-xl mt-1.5 ${isDark ? 'bg-primary/10 border border-primary/20' : 'bg-primary/5 border border-primary/10'}`}>
                                <span className="font-extrabold text-primary text-xs">Total</span>
                                <span className="text-xl font-extrabold text-primary">{INR(totalPayable)}</span>
                            </div>
                        </div>

                        <button onClick={handleSave} disabled={isSaving} className="w-full mt-3 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-xs">
                            {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Printer size={16} /> Save & Print</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
