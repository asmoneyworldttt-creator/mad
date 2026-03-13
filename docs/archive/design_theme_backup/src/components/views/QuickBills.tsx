
import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Save, IndianRupee, Calendar, Printer, List, Receipt, ChevronRight, X } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { supabase } from '../../supabase';

type UserRole = 'admin' | 'staff' | 'doctor' | 'patient';
const INR = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
const PAYMENT_METHODS = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Insurance', 'Cheque'];

export function QuickBills({ userRole, theme }: { userRole: UserRole; theme?: 'light' | 'dark' }) {
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
    const [billingInfo, setBillingInfo] = useState({ fees: 0, profFee: 0, discount: 0, gstRate: 0, paymentMethod: 'Cash', paymentStatus: 'Paid' as 'Paid' | 'Unpaid' | 'Partial' });
    const [followUpInfo, setFollowUpInfo] = useState({ remarks: '', advice: '', referTo: '', followUpDate: '', followUpTime: '' });
    const [isSaving, setIsSaving] = useState(false);
    const invoiceRef = useRef<any>(null);

    // ── Computed totals ──
    const subtotal = billingInfo.fees;
    const gstAmount = Math.round((subtotal - billingInfo.discount) * billingInfo.gstRate / 100);
    const totalPayable = subtotal - billingInfo.discount + gstAmount;

    useEffect(() => {
        if (searchQuery.length > 2) {
            supabase.from('patients').select('*').or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`).limit(5)
                .then(({ data }) => setSearchResults(data || []));
        } else setSearchResults([]);
    }, [searchQuery]);

    const fetchBills = async () => {
        setIsLoadingBills(true);
        const { data } = await supabase.from('bills').select('*, patients(name, phone)').order('date', { ascending: false }).limit(50);
        setBills(data || []);
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

        const { error: billError } = await supabase.from('bills').insert({
            id: invoiceNo,
            patient_id: patientId,
            amount: totalPayable,
            status: billingInfo.paymentStatus.toLowerCase(),
            date,
            prof_fee: billingInfo.profFee,
            discount: billingInfo.discount,
            payment_method: billingInfo.paymentMethod,
            treatment_name: treatmentInfo.treatmentDone || 'General Consultation',
            complaint: treatmentInfo.complaint,
            notes: treatmentInfo.observationNotes,
            doctor_name: clinicInfo.doctor,
            invoice_number: invoiceNo,
        });

        await supabase.from('patient_history').insert({
            id: `HST-${Math.floor(Math.random() * 100000)}`,
            patient_id: patientId,
            date,
            treatment: treatmentInfo.treatmentDone || 'General Consultation',
            category: 'General',
            cost: totalPayable,
            notes: treatmentInfo.observationNotes,
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
        // Auto-print invoice
        printInvoice({ id: invoiceNo, amount: totalPayable, date, invoice_number: invoiceNo });
        // Reset
        setTreatmentInfo({ complaint: '', treatmentDone: '', observationNotes: '', medicine: '' });
        setBillingInfo({ fees: 0, profFee: 0, discount: 0, gstRate: 0, paymentMethod: 'Cash', paymentStatus: 'Paid' });
        setFollowUpInfo({ remarks: '', advice: '', referTo: '', followUpDate: '', followUpTime: '' });
        setSelectedPatient(null);
        setPatientInfo({ id: '', name: '', phone: '', address: '' });
    };

    const printInvoice = (bill: any) => {
        const pName = bill.patients?.name || patientInfo.name || 'Patient';
        const pPhone = bill.patients?.phone || patientInfo.phone || '';
        const pAddr = patientInfo.address || '';
        const doc = bill.doctor_name || clinicInfo.doctor;
        const loc = clinicInfo.location;
        const bDate = new Date(bill.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
        const treatment = bill.treatment_name || 'General Consultation';
        const gross = bill.amount || totalPayable;
        const disc = bill.discount || billingInfo.discount;
        const gst = bill.gst_amount || gstAmount;
        const net = bill.amount || totalPayable;
        const invNo = bill.invoice_number || bill.id;
        const method = bill.payment_method || billingInfo.paymentMethod;
        const status = bill.status || billingInfo.paymentStatus;

        const html = `<!DOCTYPE html>
<html>
<head>
<title>Invoice ${invNo}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', sans-serif; max-width: 750px; margin: 40px auto; padding: 40px; color: #1e293b; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #135bec; padding-bottom: 24px; margin-bottom: 28px; }
  .clinic-brand { }
  .clinic-name { font-size: 26px; font-weight: 800; color: #135bec; letter-spacing: -0.5px; }
  .clinic-sub { font-size: 13px; color: #64748b; margin-top: 4px; }
  .invoice-badge { text-align: right; }
  .invoice-title { font-size: 32px; font-weight: 900; color: #135bec; opacity: 0.15; letter-spacing: 2px; text-transform: uppercase; }
  .invoice-no { font-size: 13px; font-weight: 700; color: #135bec; margin-top: 6px; }
  .invoice-date { font-size: 12px; color: #94a3b8; margin-top: 4px; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
  .party-block { background: #f8fafc; border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0; }
  .party-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 8px; }
  .party-name { font-size: 15px; font-weight: 700; color: #1e293b; }
  .party-detail { font-size: 12px; color: #64748b; margin-top: 3px; line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; margin: 0 0 28px; border-radius: 12px; overflow: hidden; }
  thead tr { background: #135bec; color: white; }
  th { padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; text-align: left; }
  td { padding: 12px 16px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:nth-child(even) td { background: #f8fafc; }
  .totals { display: flex; justify-content: flex-end; margin-bottom: 28px; }
  .totals-block { width: 280px; }
  .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9; }
  .total-row.grand { font-size: 18px; font-weight: 800; color: #135bec; border-bottom: none; padding-top: 12px; margin-top: 4px; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
  .badge-paid { background: #d1fae5; color: #065f46; }
  .badge-unpaid { background: #fee2e2; color: #991b1b; }
  .badge-partial { background: #fef3c7; color: #92400e; }
  .footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 28px; border-top: 2px solid #f1f5f9; margin-top: 16px; }
  .sig-block { text-align: center; }
  .sig-line { width: 180px; border-top: 1px solid #1e293b; padding-top: 8px; font-size: 12px; font-weight: 700; }
  .watermark { font-size: 10px; color: #cbd5e1; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
  <div class="header">
    <div class="clinic-brand">
      <div class="clinic-name">DentiSphere</div>
      <div class="clinic-sub">${loc}</div>
      <div class="clinic-sub" style="margin-top:2px">Attending: ${doc}</div>
    </div>
    <div class="invoice-badge">
      <div class="invoice-title">Invoice</div>
      <div class="invoice-no"># ${invNo}</div>
      <div class="invoice-date">${bDate}</div>
    </div>
  </div>
  <div class="parties">
    <div class="party-block">
      <div class="party-label">Bill To</div>
      <div class="party-name">${pName}</div>
      <div class="party-detail">${pPhone}${pAddr ? '<br>' + pAddr : ''}</div>
    </div>
    <div class="party-block">
      <div class="party-label">Payment</div>
      <div class="party-name">${method}</div>
      <div class="party-detail" style="margin-top:6px">
        <span class="badge badge-${status.toLowerCase()}">${status}</span>
      </div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th><th>Description</th><th>Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>${treatment}</td>
        <td>₹${gross.toLocaleString('en-IN')}</td>
      </tr>
    </tbody>
  </table>
  <div class="totals">
    <div class="totals-block">
      <div class="total-row"><span>Gross Amount</span><span>₹${gross.toLocaleString('en-IN')}</span></div>
      ${disc ? `<div class="total-row"><span>Discount</span><span>− ₹${disc.toLocaleString('en-IN')}</span></div>` : ''}
      ${gst ? `<div class="total-row"><span>GST (${billingInfo.gstRate}%)</span><span>₹${gst.toLocaleString('en-IN')}</span></div>` : ''}
      <div class="total-row grand"><span>Net Payable</span><span>₹${net.toLocaleString('en-IN')}</span></div>
    </div>
  </div>
  <div class="footer">
    <div class="watermark">Generated by DentiSphere • ${new Date().toLocaleString('en-IN')}</div>
    <div class="sig-block">
      <div class="sig-line">${doc}</div>
      <div style="font-size:11px; color:#94a3b8; margin-top:4px">Signature &amp; Seal</div>
    </div>
  </div>
</body>
</html>`;
        const win = window.open('', '_blank');
        if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 600); }
    };

    // ─── BILL HISTORY VIEW ───
    if (view === 'history') {
        const statusColor: any = { paid: 'text-emerald-600 bg-emerald-50 border-emerald-200', unpaid: 'text-rose-500 bg-rose-50 border-rose-200', partial: 'text-amber-500 bg-amber-50 border-amber-200' };
        return (
            <div className="animate-slide-up space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Bills History</h2>
                        <p className="text-sm text-slate-400 font-medium mt-1">All issued invoices sorted by date</p>
                    </div>
                    <button onClick={() => setView('form')} className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all">
                        <Plus size={16} /> New Bill
                    </button>
                </div>
                <div className={`rounded-[2rem] border overflow-hidden ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className={`text-[11px] font-extrabold uppercase tracking-widest ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-50 text-slate-400'}`}>
                                <tr>
                                    {['Invoice #', 'Patient', 'Treatment', 'Amount', 'Method', 'Status', 'Date', ''].map(h => (
                                        <th key={h} className="px-5 py-4 whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-50'}`}>
                                {isLoadingBills ? (
                                    <tr><td colSpan={8} className="py-16 text-center">
                                        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                                        <p className="text-slate-400">Loading bills...</p>
                                    </td></tr>
                                ) : bills.map(b => (
                                    <tr key={b.id} className={`transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                                        <td className="px-5 py-4 font-bold text-primary text-sm">{b.invoice_number || b.id?.slice(0, 12)}</td>
                                        <td className="px-5 py-4 font-bold text-sm">{b.patients?.name || '—'}</td>
                                        <td className="px-5 py-4 text-sm text-slate-500 max-w-[160px] truncate">{b.treatment_name || '—'}</td>
                                        <td className="px-5 py-4 font-bold text-sm">{INR(b.amount || 0)}</td>
                                        <td className="px-5 py-4 text-sm text-slate-400">{b.payment_method || '—'}</td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${statusColor[b.status?.toLowerCase()] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                {b.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-slate-400">{new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                        <td className="px-5 py-4">
                                            <button onClick={() => printInvoice(b)} className={`p-2 rounded-xl border transition-all hover:scale-105 ${isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-primary hover:border-primary'}`}>
                                                <Printer size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {!isLoadingBills && bills.length === 0 && (
                                    <tr><td colSpan={8} className="py-16 text-center text-slate-400">
                                        <Receipt size={40} className="mx-auto mb-3 opacity-20" />
                                        <p className="font-medium">No bills found</p>
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
    const inputCls = `w-full px-4 py-3 rounded-2xl border font-medium text-sm outline-none transition-all ${isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-primary/50' : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary/10'}`;
    const labelCls = 'text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5 block';
    const cardCls = `p-6 rounded-[2rem] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`;

    return (
        <div className="animate-slide-up space-y-6 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Quick Bills</h2>
                    <p className="text-sm text-slate-400 font-medium mt-1">Generate GST invoices and patient billing instantly</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setView('history')} className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm border transition-all ${isDark ? 'bg-white/5 border-white/10 text-slate-300 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        <List size={16} /> History
                    </button>
                    <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50">
                        {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                        Save & Print Invoice
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ─── LEFT: Patient + Treatment ─── */}
                <div className="lg:col-span-2 space-y-5">
                    {/* General Info */}
                    <div className={cardCls}>
                        <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-4">Clinic & Visit Info</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className={labelCls}>Date</label>
                                <input type="date" value={clinicInfo.date} onChange={e => setClinicInfo({ ...clinicInfo, date: e.target.value })} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Doctor</label>
                                <input type="text" value={clinicInfo.doctor} onChange={e => setClinicInfo({ ...clinicInfo, doctor: e.target.value })} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Clinic Location</label>
                                <select value={clinicInfo.location} onChange={e => setClinicInfo({ ...clinicInfo, location: e.target.value })} className={inputCls}>
                                    <option>Main Clinic – Downtown</option>
                                    <option>Branch – Northside</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Patient Search */}
                    <div className={cardCls}>
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Patient</p>
                            {selectedPatient && <button onClick={() => { setSelectedPatient(null); setPatientInfo({ id: '', name: '', phone: '', address: '' }); }} className="text-xs text-rose-400 hover:text-rose-500 flex items-center gap-1"><X size={12} /> Clear</button>}
                        </div>
                        <div className="relative mb-4">
                            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="Search by name or mobile..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className={`${inputCls} pl-10`} />
                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                                    {searchResults.map(p => (
                                        <button key={p.id} onClick={() => handleSelectPatient(p)} className="w-full text-left px-5 py-3 hover:bg-slate-50 flex items-center gap-3 border-b border-slate-100 last:border-0">
                                            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">{p.name?.charAt(0)}</div>
                                            <div>
                                                <p className="font-bold text-sm text-slate-700">{p.name}</p>
                                                <p className="text-[10px] text-slate-400">{p.phone}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {selectedPatient && (
                            <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-2xl mb-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold">{selectedPatient.name?.charAt(0)}</div>
                                <div>
                                    <p className="font-bold text-primary text-sm">{selectedPatient.name}</p>
                                    <p className="text-xs text-slate-400">{selectedPatient.phone} · ID: {selectedPatient.id}</p>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Patient Name</label>
                                <input type="text" value={patientInfo.name} onChange={e => setPatientInfo({ ...patientInfo, name: e.target.value })} placeholder="Enter if not registered" className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Phone</label>
                                <input type="tel" value={patientInfo.phone} onChange={e => setPatientInfo({ ...patientInfo, phone: e.target.value })} className={inputCls} />
                            </div>
                            <div className="col-span-2">
                                <label className={labelCls}>Address (for invoice)</label>
                                <input type="text" value={patientInfo.address} onChange={e => setPatientInfo({ ...patientInfo, address: e.target.value })} placeholder="Optional" className={inputCls} />
                            </div>
                        </div>
                    </div>

                    {/* Treatment Details */}
                    <div className={cardCls}>
                        <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-4">Treatment Details</p>
                        <div className="space-y-4">
                            <div>
                                <label className={labelCls}>Chief Complaint</label>
                                <input type="text" value={treatmentInfo.complaint} onChange={e => setTreatmentInfo({ ...treatmentInfo, complaint: e.target.value })} className={inputCls} placeholder="e.g. Toothache, sensitivity..." />
                            </div>
                            <div>
                                <label className={labelCls}>Treatment Done</label>
                                <textarea rows={2} value={treatmentInfo.treatmentDone} onChange={e => setTreatmentInfo({ ...treatmentInfo, treatmentDone: e.target.value })} className={`${inputCls} resize-none`} placeholder="e.g. RCT, Scaling, Extraction..." />
                            </div>
                            <div>
                                <label className={labelCls}>Clinical Notes / Observations</label>
                                <textarea rows={2} value={treatmentInfo.observationNotes} onChange={e => setTreatmentInfo({ ...treatmentInfo, observationNotes: e.target.value })} className={`${inputCls} resize-none`} />
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
                <div className="space-y-5">
                    <div className={`${cardCls} sticky top-6`}>
                        <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-5">Billing & Invoice</p>

                        <div className="space-y-4">
                            <div>
                                <label className={labelCls}>Gross Fees (₹)</label>
                                <div className={`flex items-center rounded-2xl border overflow-hidden ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                                    <span className={`px-4 text-slate-400 ${isDark ? 'border-white/10' : 'border-r border-slate-200'} flex items-center py-3 border-r`}><IndianRupee size={14} /></span>
                                    <input type="number" value={billingInfo.fees || ''} onChange={e => setBillingInfo({ ...billingInfo, fees: parseFloat(e.target.value) || 0 })} className={`flex-1 px-3 py-3 bg-transparent font-bold text-sm outline-none ${isDark ? 'text-white' : 'text-slate-700'}`} placeholder="0" />
                                </div>
                            </div>

                            <div>
                                <label className={labelCls}>Doctor Prof. Fee (₹)</label>
                                <div className={`flex items-center rounded-2xl border overflow-hidden ${isDark ? 'border-primary/20 bg-primary/5' : 'border-primary/20 bg-primary/5'}`}>
                                    <span className="px-4 text-primary border-r border-primary/20 flex items-center py-3"><IndianRupee size={14} /></span>
                                    <input type="number" value={billingInfo.profFee || ''} onChange={e => setBillingInfo({ ...billingInfo, profFee: parseFloat(e.target.value) || 0 })} className="flex-1 px-3 py-3 bg-transparent font-bold text-sm outline-none text-primary" placeholder="0" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Discount (₹)</label>
                                    <input type="number" value={billingInfo.discount || ''} onChange={e => setBillingInfo({ ...billingInfo, discount: parseFloat(e.target.value) || 0 })} className={inputCls} placeholder="0" />
                                </div>
                                <div>
                                    <label className={labelCls}>GST %</label>
                                    <select value={billingInfo.gstRate} onChange={e => setBillingInfo({ ...billingInfo, gstRate: parseFloat(e.target.value) })} className={inputCls}>
                                        <option value={0}>0% (Exempt)</option>
                                        <option value={5}>5% GST</option>
                                        <option value={12}>12% GST</option>
                                        <option value={18}>18% GST</option>
                                    </select>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label className={labelCls}>Payment Method</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {PAYMENT_METHODS.map(m => (
                                        <button key={m} onClick={() => setBillingInfo({ ...billingInfo, paymentMethod: m })}
                                            className={`py-2.5 text-[10px] font-extrabold rounded-xl border transition-all ${billingInfo.paymentMethod === m ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : isDark ? 'bg-white/5 border-white/10 text-slate-400 hover:border-primary/30' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}>
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Status */}
                            <div>
                                <label className={labelCls}>Payment Status</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['Paid', 'Unpaid', 'Partial'] as const).map(s => (
                                        <button key={s} onClick={() => setBillingInfo({ ...billingInfo, paymentStatus: s })}
                                            className={`py-2.5 text-[10px] font-extrabold rounded-xl border transition-all ${billingInfo.paymentStatus === s ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : isDark ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-white text-slate-400 border-slate-100'}`}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Totals */}
                        <div className={`mt-5 pt-5 border-t space-y-2 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                            <div className="flex justify-between text-sm"><span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Gross</span><span className="font-bold">{INR(subtotal)}</span></div>
                            {billingInfo.discount > 0 && <div className="flex justify-between text-sm"><span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Discount</span><span className="font-bold text-rose-500">− {INR(billingInfo.discount)}</span></div>}
                            {billingInfo.gstRate > 0 && <div className="flex justify-between text-sm"><span className={isDark ? 'text-slate-400' : 'text-slate-500'}>GST ({billingInfo.gstRate}%)</span><span className="font-bold">{INR(gstAmount)}</span></div>}
                            <div className={`flex justify-between items-center p-4 rounded-2xl mt-2 ${isDark ? 'bg-primary/10 border border-primary/20' : 'bg-primary/5 border border-primary/10'}`}>
                                <span className="font-extrabold text-primary">Net Payable</span>
                                <span className="text-2xl font-extrabold text-primary">{INR(totalPayable)}</span>
                            </div>
                        </div>

                        <button onClick={handleSave} disabled={isSaving} className="w-full mt-4 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                            {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Printer size={18} /> Save & Print Invoice</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
