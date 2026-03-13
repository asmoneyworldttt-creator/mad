
import { useState, useMemo } from 'react';

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
    ArrowRightLeft
} from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { RealisticDentition } from './Dentition3D';

type PatientView = 'overview' | 'treatment_plan' | 'bill_detail';

export function PatientOverview({ onBack, patient, theme }: { onBack: () => void, patient: any, theme?: 'light' | 'dark' }) {
    const [activeTab, setActiveTab] = useState('home');
    const { showToast } = useToast();
    const [view, setView] = useState<PatientView>('overview');
    const [selectedBill, setSelectedBill] = useState<any>(null);
    const [toothChartData, setToothChartData] = useState<any>({});

    const treatmentCounts = useMemo(() => {
        if (!patient) return {};
        return (patient.patient_history || []).reduce((acc: any, curr: any) => {
            acc[curr.treatment] = (acc[curr.treatment] || 0) + 1;
            return acc;
        }, {});
    }, [patient?.patient_history]);

    const repeatedTreatments = Object.entries(treatmentCounts).filter(([_, count]: any) => count > 1);

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

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
        if (tabId === 'emr') loadToothChart();
    };

    const totalDue = useMemo(() => {
        if (!patient) return 0;
        const billed = (patient.patient_history || []).reduce((acc: number, curr: any) => acc + (Number(curr.cost) || 0), 0);
        const spent = Number(patient.total_spent) || 0;
        return Math.max(0, billed - spent);
    }, [patient]);

    const patientLifecycle = useMemo(() => {
        if (!patient || !patient.last_visit) return { status: 'New', color: 'bg-primary/10 text-primary border-primary/20' };

        const daysSinceVisit = Math.floor((Date.now() - new Date(patient.last_visit).getTime()) / (1000 * 3600 * 24));

        if (daysSinceVisit <= 90) return { status: 'Active', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
        if (daysSinceVisit <= 180) return { status: 'Dormant', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
        return { status: 'Lost', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
    }, [patient?.last_visit]);

    const handleDownloadReport = (format: 'pdf' | 'excel') => {
        showToast(`Preparing ${format.toUpperCase()} report for ${patient.name}...`, 'success');

        let content = '';
        if (format === 'excel') {
            const headers = ['Date', 'Treatment', 'Cost (₹)', 'Notes'];
            const rows = (patient.patient_history || []).map((visit: any) =>
                `"${visit.date}","${visit.treatment}","${visit.cost}","${(visit.notes || '').replace(/"/g, '""')}"`
            );
            content = [headers.join(','), ...rows].join('\n');
        } else {
            content = `CLINICAL SUMMARY: ${patient.name}\n\nBalance: ₹${totalDue}\n\nVisits:\n` +
                (patient.patient_history || []).map((v: any) => `- ${v.date}: ${v.treatment} (₹${v.cost})`).join('\n');
        }

        const blob = new Blob([content], { type: format === 'pdf' ? 'text/plain' : 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${patient.name.replace(/\s+/g, '_')}_EMR_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'csv'}`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`Clinical records exported successfully!`, 'success');
    };

    const tabs = [
        { id: 'home', label: 'Home', icon: Activity },
        { id: 'billing', label: 'Billing', icon: FileText },
        { id: 'payment', label: 'Payment', icon: IndianRupee },
        { id: 'messages', label: 'Messages', icon: MessageSquare },
        { id: 'appointments', label: 'Appointments', icon: Calendar },
        { id: 'gallery', label: 'Gallery', icon: ImageIcon },
        { id: 'emr', label: 'Tooth Chart', icon: Activity },
        { id: 'more', label: 'More', icon: MoreHorizontal }
    ];

    if (!patient) return null;

    if (view === 'treatment_plan') {
        return (
            <div className={`animate-slide-up space-y-8 pb-10 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('overview')} className="p-3 border rounded-2xl transition-all shadow-sm" style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h2 className={`text-3xl font-sans font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Proposed Treatment Plan</h2>
                        <p className="font-medium" style={{ color: 'var(--text-muted)' }}>Create a clinical protocol for {patient.name}</p>
                    </div>
                </div>

                <div className="p-10 rounded-[2.5rem] border shadow-xl shadow-primary/5" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-extrabold text-slate-500 mb-2 block uppercase tracking-widest">Clinical Identification</label>
                                <input type="text" className="w-full border rounded-2xl px-6 py-4 text-sm font-bold outline-none transition-all focus:ring-4"
                                    style={{ background: 'var(--card-bg-alt)', border: '1.5px solid var(--border-color)', color: 'var(--text-main)' }} placeholder="Primary identification..." />
                            </div>
                            <div>
                                <label className="text-[10px] font-extrabold text-slate-500 mb-2 block uppercase tracking-widest">Primary Patient Concern</label>
                                <textarea rows={4} className="w-full border rounded-2xl px-6 py-4 text-sm font-bold outline-none transition-all focus:ring-4"
                                    style={{ background: 'var(--card-bg-alt)', border: '1.5px solid var(--border-color)', color: 'var(--text-main)' }} placeholder="Describe the concern..."></textarea>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-extrabold text-slate-500 mb-2 block uppercase tracking-widest">Total Estimated Amount (₹)</label>
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                    <input type="number" className="w-full border rounded-2xl pl-12 pr-6 py-4 text-sm font-bold outline-none transition-all focus:ring-4"
                                        style={{ background: 'var(--card-bg-alt)', border: '1.5px solid var(--border-color)', color: 'var(--text-main)' }} placeholder="0.00" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-extrabold text-slate-500 mb-2 block uppercase tracking-widest">Recommended Actions</label>
                                <textarea rows={4} className="w-full border rounded-2xl px-6 py-4 text-sm font-bold outline-none transition-all focus:ring-4"
                                    style={{ background: 'var(--card-bg-alt)', border: '1.5px solid var(--border-color)', color: 'var(--text-main)' }} placeholder="List procedures (e.g., Fitting, Cleaning)..."></textarea>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 flex gap-4">
                        <button onClick={() => setView('overview')} className={`flex-1 py-5 rounded-3xl font-bold transition-all ${theme === 'dark' ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Cancel</button>
                        <button onClick={() => { showToast('Treatment plan saved!', 'success'); setView('overview'); }} className="flex-1 py-5 bg-primary hover:bg-primary-hover text-white rounded-3xl font-bold shadow-premium shadow-primary/20 transition-all flex items-center justify-center gap-3 active:scale-95">
                            <Save size={20} /> Save & Send to Patient
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'bill_detail' && selectedBill) {
        return (
            <div className={`animate-slide-up space-y-8 pb-10 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('overview')} className="p-3 border rounded-2xl transition-all shadow-sm" style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h2 className={`text-3xl font-sans font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Invoice Details</h2>
                        <p className="font-medium" style={{ color: 'var(--text-muted)' }}>Viewing ledger entry for {patient.name}</p>
                    </div>
                </div>

                <div className="p-10 rounded-[2.5rem] border shadow-xl max-w-4xl shadow-primary/5" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                    <div className="flex justify-between items-start mb-12">
                        <div>
                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Invoice Number</p>
                            <h4 className="text-4xl font-sans font-bold text-primary">{selectedBill.id}</h4>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Date Issued</p>
                            <p className="text-xl font-bold">{selectedBill.date}</p>
                        </div>
                    </div>

                    <div className="p-8 rounded-[2rem] border" style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)' }}>
                        <table className="w-full">
                            <thead>
                                <tr className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-white/5">
                                    <th className="text-left pb-4">Service Description</th>
                                    <th className="text-right pb-4">Amount</th>
                                </tr>
                            </thead>
                            <tbody style={{ color: 'var(--text-main)', borderColor: 'var(--border-color)' }}>
                                <tr className="text-sm font-bold" style={{ borderTop: '1px solid var(--border-color)' }}>
                                    <td className="py-6">Clinical Consultation & Radiography</td>
                                    <td className="py-6 text-right">₹800.00</td>
                                </tr>
                                <tr className="text-sm font-bold" style={{ borderTop: '1px solid var(--border-color)' }}>
                                    <td className="py-6">Composite Restoration (Esthetic)</td>
                                    <td className="py-6 text-right">₹2,700.00</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-primary">
                                    <td className="pt-8 text-xl font-bold">Total Settlement</td>
                                    <td className="pt-8 text-3xl font-sans font-bold text-primary text-right">₹{selectedBill.amount.toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12">
                        <button onClick={() => showToast('Sharing via secure channel...', 'success')} className={`flex items-center justify-center gap-3 py-5 rounded-3xl font-bold text-sm shadow-sm transition-all active:scale-95 ${theme === 'dark' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                            <MessageSquare size={20} /> Share to WhatsApp
                        </button>
                        <button onClick={() => handleDownloadReport('pdf')} className="flex items-center justify-center gap-3 py-5 bg-slate-900 text-white rounded-3xl font-bold text-sm shadow-xl transition-all active:scale-95">
                            <Printer size={20} /> Print Formal Receipt
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
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-primary/20">
                            {patient.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <h3 className="text-base font-sans font-bold tracking-tight" style={{ color: 'var(--text-dark)' }}>{patient.name}</h3>
                                <span className={`${patientLifecycle.color} text-[7px] font-extrabold px-1.5 py-0.5 rounded-full border uppercase tracking-widest`}>{patientLifecycle.status}</span>
                            </div>
                            <p className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                {patient.gender}, {patient.age}y • Blood: <span className="text-rose-500 font-extrabold">{patient.blood_group || 'O+'}</span> • Node: {patient.id.slice(0, 8)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={() => handleDownloadReport('pdf')} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-extrabold text-[8px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1.5">
                        <Download size={12} /> Export Node
                    </button>
                </div>
            </div>

            <div className="flex gap-1 overflow-x-auto border-b border-white/5 pb-0.5 custom-scrollbar">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 border-b text-[9px] font-extrabold uppercase tracking-widest transition-all whitespace-nowrap ${isActive ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                        >
                            <Icon size={12} /> {tab.label}
                        </button>
                    );
                })}
            </div>

            <main className="space-y-10 pb-20">
                {activeTab === 'home' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl" style={{ background: 'var(--card-bg-alt)', border: '1px solid var(--border-color)' }}>
                                    <h4 className="text-[8px] font-extrabold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Patient Info</h4>
                                    <div className="flex items-center gap-3 text-[12px] font-bold">
                                        <div className="flex-1">
                                            <p className="text-slate-400 mb-0.5 text-[9px]">Residence</p>
                                            <p className="truncate">{patient.address || 'Standard Location Area'}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-white/5 flex gap-4">
                                        <div>
                                            <p className="text-[8px] font-extrabold text-slate-500 uppercase tracking-widest mb-0.5">Mobile</p>
                                            <p className="text-[12px] font-bold text-primary">{patient.phone}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-extrabold text-slate-500 uppercase tracking-widest mb-0.5">Email</p>
                                            <p className="text-[12px] font-bold truncate max-w-[100px]">{patient.email || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl" style={{ background: 'var(--card-bg-alt)', border: '1px solid var(--border-color)' }}>
                                    <h4 className="text-[8px] font-extrabold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Medical Conditions</h4>
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 rounded border border-rose-500/20 text-[7px] font-extrabold uppercase tracking-widest">Hypertension</span>
                                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded border border-amber-500/20 text-[7px] font-extrabold uppercase tracking-widest">Penicillin</span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-slate-900/50 text-white/70 text-[10px] font-normal leading-tight italic">
                                        Sensitive at Q3 quadrant. Localized gingivitis.
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-dark)' }}>
                                        <History size={18} className="text-primary" /> Visit History
                                    </h4>
                                    <button className="text-[9px] font-extrabold text-primary uppercase tracking-widest hover:underline">Full History</button>
                                </div>
                                <div className="space-y-3">
                                    {(patient.patient_history || []).map((visit: any, i: number) => (
                                        <div key={i} className="p-5 rounded-2xl transition-all hover:scale-[1.01] overflow-hidden relative group" style={{ background: 'var(--card-bg-alt)', border: '1px solid var(--border-color)' }}>
                                            <div className="flex justify-between items-center mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg group-hover:bg-primary group-hover:text-white transition-all">
                                                        {visit.treatment.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h5 className="font-bold text-[15px]">{visit.treatment}</h5>
                                                        <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">{visit.date}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-sans font-bold text-primary">₹{visit.cost}</p>
                                                    <span className="text-[8px] font-extrabold text-emerald-500 uppercase tracking-widest">Recorded</span>
                                                </div>
                                            </div>
                                            <div className="p-4 rounded-xl text-[12px] font-medium italic leading-relaxed" style={{ background: 'var(--bg-page)', color: 'var(--text-muted)' }}>
                                                "{visit.notes}"
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="p-6 rounded-2xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                                <h4 className="text-[9px] font-extrabold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Visit Frequency</h4>
                                {repeatedTreatments.map(([name, count]: any) => (
                                    <div key={name} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 mb-2">
                                        <span className="text-[11px] font-bold">{name}</span>
                                        <span className="px-2 py-0.5 bg-primary text-white text-[8px] font-extrabold rounded-full">{count}X</span>
                                    </div>
                                ))}
                            </div>

                            <div className="p-6 rounded-2xl bg-slate-900 text-white shadow-2xl relative overflow-hidden group">
                                <div className="relative z-10">
                                    <p className="text-[9px] font-extrabold text-primary uppercase tracking-widest mb-2">Balance Due</p>
                                    <h5 className="text-3xl font-sans font-bold mb-6">₹{totalDue.toLocaleString()}</h5>
                                    <div className="flex gap-2">
                                        <button onClick={() => setActiveTab('payment')} className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95">Pay Now</button>
                                        <button onClick={() => setView('bill_detail')} className="w-10 h-10 border border-white/20 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all">
                                            <FileText size={16} />
                                        </button>
                                    </div>
                                </div>
                                <Activity size={80} className="absolute -right-6 -bottom-6 opacity-5 rotate-12 group-hover:scale-110 transition-transform duration-700" />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'billing' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { id: 'INV-0089', date: '12 Oct 2026', amount: 12000, status: 'Paid', items: 'Consultation, OPG, Scaling' },
                            { id: 'INV-0092', date: '25 Oct 2026', amount: 3500, status: 'Unpaid', items: 'Review, Post-op Medication' }
                        ].map(bill => (
                            <div key={bill.id} className="p-8 rounded-[2.5rem] group transition-all hover:scale-[1.02]" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                                <div className="flex justify-between items-start mb-10">
                                    <div>
                                        <h5 className="text-xl font-bold">{bill.id}</h5>
                                        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">{bill.date}</p>
                                    </div>
                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-extrabold uppercase border ${bill.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                                        {bill.status}
                                    </span>
                                </div>
                                <p className="text-sm font-bold text-slate-400 mb-8 line-clamp-1">{bill.items}</p>
                                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                    <p className="text-2xl font-sans font-bold text-primary">₹{bill.amount}</p>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setSelectedBill(bill); setView('bill_detail'); }} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-primary transition-all">
                                            <Eye size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
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
                                <div className="px-6 py-3 bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/10 text-[10px] font-extrabold text-white uppercase tracking-widest">Clinical Projection v4.0</div>
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

                {activeTab === 'gallery' && (
                    <div className="space-y-10">
                        <div className="flex justify-between items-center">
                            <h4 className="text-2xl font-sans font-bold" style={{ color: 'var(--text-dark)' }}>Patient Photos</h4>
                            <label className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase cursor-pointer transition-all active:scale-95 shadow-premium flex items-center gap-2">
                                <Plus size={18} className="inline mr-2" /> Upload Clinical Photo
                                <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        showToast('Uploading clinical photo...', 'info');
                                        // Mock upload or real Supabase Storage logic
                                        setTimeout(() => showToast('Photo uploaded to Clinical Vault!', 'success'), 1500);
                                    }
                                }} />
                            </label>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="aspect-square rounded-[2rem] bg-slate-100 overflow-hidden relative group border border-slate-200" style={{ background: 'var(--card-bg-alt)' }}>
                                    <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                                        <ImageIcon size={48} />
                                    </div>
                                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                        <button className="p-3 bg-white rounded-xl text-primary shadow-xl"><Eye size={20} /></button>
                                        <button className="p-3 bg-white rounded-xl text-red-500 shadow-xl"><Trash size={20} /></button>
                                    </div>
                                </div>
                            ))}
                            <div className="aspect-square rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-primary hover:text-primary transition-all cursor-pointer" style={{ borderColor: 'var(--border-color)' }}>
                                <Plus size={32} />
                                <span className="text-[10px] font-bold mt-2 uppercase tracking-widest">Add View</span>
                            </div>
                        </div>
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
            </main>
        </div>
    );
}

