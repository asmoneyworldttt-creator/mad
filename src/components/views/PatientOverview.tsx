
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
    Save
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
                    <button onClick={() => setView('overview')} className={`p-3 border rounded-2xl transition-all shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-white/10 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-3xl font-sans font-bold tracking-tight">Proposed Treatment Plan</h2>
                        <p className="text-slate-500 font-medium">Create a clinical protocol for {patient.name}</p>
                    </div>
                </div>

                <div className={`p-10 rounded-[2.5rem] border shadow-xl ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">Main Diagnosis</label>
                                <input type="text" className={`w-full border rounded-2xl px-6 py-4 text-sm font-bold outline-none transition-all focus:ring-4 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-primary'}`} placeholder="Enter clinical finding..." />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">Chief Complaint</label>
                                <textarea rows={4} className={`w-full border rounded-2xl px-6 py-4 text-sm font-bold outline-none transition-all focus:ring-4 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-primary'}`} placeholder="Describe patient's pain/issue..."></textarea>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">Estimated Cost (INR)</label>
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                    <input type="number" className={`w-full border rounded-2xl pl-12 pr-6 py-4 text-sm font-bold outline-none transition-all focus:ring-4 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-primary'}`} placeholder="0.00" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">Proposed Treatments</label>
                                <textarea rows={4} className={`w-full border rounded-2xl px-6 py-4 text-sm font-bold outline-none transition-all focus:ring-4 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-primary'}`} placeholder="List procedures (e.g., RCT, Crown)..."></textarea>
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
                    <button onClick={() => setView('overview')} className={`p-3 border rounded-2xl transition-all shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-white/10 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-3xl font-sans font-bold tracking-tight">Invoice Details</h2>
                        <p className="text-slate-500 font-medium">Viewing ledger entry for {patient.name}</p>
                    </div>
                </div>

                <div className={`p-10 rounded-[2.5rem] border shadow-xl max-w-4xl ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
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

                    <div className={`p-8 rounded-[2rem] border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                        <table className="w-full">
                            <thead>
                                <tr className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-white/5">
                                    <th className="text-left pb-4">Service Description</th>
                                    <th className="text-right pb-4">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                <tr className="text-sm font-bold">
                                    <td className="py-6">Clinical Consultation & Radiography</td>
                                    <td className="py-6 text-right">₹800.00</td>
                                </tr>
                                <tr className="text-sm font-bold">
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
            <div className={`p-8 rounded-[2.5rem] border flex flex-col md:flex-row justify-between items-center gap-6 ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div className="flex items-center gap-6 w-full md:w-auto">
                    <button onClick={onBack} className={`p-3 border rounded-2xl transition-all shadow-sm ${theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-[1.75rem] bg-primary text-white flex items-center justify-center font-bold text-3xl shadow-lg shadow-primary/20">
                            {patient.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-3xl font-sans font-bold tracking-tight">{patient.name}</h3>
                                <span className={`${patientLifecycle.color} text-[9px] font-extrabold px-3 py-1 rounded-full border uppercase tracking-widest`}>{patientLifecycle.status}</span>
                            </div>
                            <p className="text-slate-400 font-medium mt-1">
                                {patient.gender}, {patient.age}y • Blood: <span className="text-rose-500 font-extrabold">{patient.blood_group || 'O+'}</span> • ID: {patient.id}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={() => handleDownloadReport('pdf')} className="flex-1 px-8 py-4 bg-primary text-white rounded-[1.25rem] font-extrabold text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
                        <Download size={18} /> Export Clinical Artifact
                    </button>
                </div>
            </div>

            <div className="flex gap-1 overflow-x-auto border-b border-white/5 pb-2 custom-scrollbar">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`flex items-center gap-3 px-8 py-5 border-b-2 text-xs font-extrabold uppercase tracking-widest transition-all whitespace-nowrap ${isActive ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                        >
                            <Icon size={16} /> {tab.label}
                        </button>
                    );
                })}
            </div>

            <main className="space-y-10 pb-20">
                {activeTab === 'home' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-2 space-y-10">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className={`p-8 rounded-[2.5rem] border shadow-sm ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                                    <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-6">Demographic Ledger</h4>
                                    <div className="flex items-center gap-4 text-sm font-bold">
                                        <div className="flex-1">
                                            <p className="text-slate-400 mb-1">Residence</p>
                                            <p>{patient.address || 'Standard Location Area'}</p>
                                        </div>
                                    </div>
                                    <div className="mt-8 pt-8 border-t border-white/5 flex gap-8">
                                        <div>
                                            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Mobile</p>
                                            <p className="text-sm font-bold text-primary">{patient.phone}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Email</p>
                                            <p className="text-sm font-bold">{patient.email || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className={`p-8 rounded-[2.5rem] border shadow-sm ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                                    <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-6">Pathology Overlays</h4>
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        <span className="px-4 py-2 bg-rose-500/10 text-rose-500 rounded-xl text-[10px] font-extrabold uppercase tracking-widest border border-rose-500/20 shadow-sm">Hypertension</span>
                                        <span className="px-4 py-2 bg-amber-500/10 text-amber-500 rounded-xl text-[10px] font-extrabold uppercase tracking-widest border border-amber-500/20 shadow-sm">Allergy: Penicillin</span>
                                    </div>
                                    <div className="p-4 bg-slate-900 text-white rounded-2xl text-[11px] font-medium leading-relaxed opacity-60">
                                        Observed history of localized gingivitis. Patient reports sensitivity at Q3 quadrant.
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xl font-bold flex items-center gap-3">
                                        <History size={24} className="text-primary" /> Recent Clinical Events
                                    </h4>
                                    <button className="text-[10px] font-extrabold text-primary uppercase tracking-widest hover:underline">Longitudinal View</button>
                                </div>
                                <div className="space-y-4">
                                    {(patient.patient_history || []).map((visit: any, i: number) => (
                                        <div key={i} className={`p-8 rounded-[2.5rem] border transition-all hover:scale-[1.01] overflow-hidden relative group ${theme === 'dark' ? 'bg-white/5 border-white/5 hover:border-primary/30' : 'bg-white border-slate-100 shadow-sm'}`}>
                                            <div className="flex justify-between items-center mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl group-hover:bg-primary group-hover:text-white transition-all">
                                                        {visit.treatment.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h5 className="font-bold text-lg">{visit.treatment}</h5>
                                                        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">{visit.date}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-sans font-bold text-primary">₹{visit.cost}</p>
                                                    <span className="text-[9px] font-extrabold text-emerald-500 uppercase tracking-widest">Synced Node</span>
                                                </div>
                                            </div>
                                            <div className={`p-6 rounded-[1.5rem] text-sm font-medium italic leading-relaxed ${theme === 'dark' ? 'bg-slate-950/50 text-slate-400' : 'bg-slate-50 text-slate-600'}`}>
                                                "{visit.notes}"
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-10">
                            <div className={`p-10 rounded-[2.5rem] border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                                <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-8">Clinical Frequency</h4>
                                {repeatedTreatments.map(([name, count]: any) => (
                                    <div key={name} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 mb-3">
                                        <span className="text-xs font-bold">{name}</span>
                                        <span className="px-3 py-1 bg-primary text-white text-[9px] font-extrabold rounded-full">{count}X</span>
                                    </div>
                                ))}
                            </div>

                            <div className="p-10 rounded-[2.5rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden group">
                                <div className="relative z-10">
                                    <p className="text-[10px] font-extrabold text-primary uppercase tracking-widest mb-4">Financial Liability</p>
                                    <h5 className="text-5xl font-sans font-bold mb-10">₹{totalDue.toLocaleString()}</h5>
                                    <div className="flex gap-3">
                                        <button onClick={() => setActiveTab('payment')} className="flex-1 py-4 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95">Settle Ledger</button>
                                        <button onClick={() => setView('bill_detail')} className="w-14 h-14 border border-white/20 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all">
                                            <FileText size={20} />
                                        </button>
                                    </div>
                                </div>
                                <Activity size={120} className="absolute -right-8 -bottom-8 opacity-5 rotate-12 group-hover:scale-110 transition-transform duration-700" />
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
                            <div key={bill.id} className={`p-8 rounded-[2.5rem] border shadow-sm group transition-all hover:scale-[1.02] ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
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
                        <div className={`rounded-[3rem] p-1 border shadow-2xl relative overflow-hidden h-[600px] ${theme === 'dark' ? 'bg-slate-950 border-white/10' : 'bg-slate-900 border-slate-100'}`}>
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
                                <div key={tooth} className={`p-8 rounded-[2.5rem] border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[10px] font-extrabold bg-primary/10 text-primary px-3 py-1 rounded-lg uppercase tracking-widest"># {tooth}</span>
                                        <span className="text-xs font-bold">{data.condition}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium italic mt-4 opacity-60">"{data.note}"</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'more' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div onClick={() => setView('treatment_plan')} className={`p-10 rounded-[3rem] border shadow-sm hover:shadow-2xl hover:translate-y-[-4px] transition-all cursor-pointer group ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'}`}>
                            <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 text-primary flex items-center justify-center mb-8 shadow-inner group-hover:bg-primary group-hover:text-white transition-all">
                                <Activity size={32} />
                            </div>
                            <h4 className="text-xl font-bold mb-2">Protocol Engine</h4>
                            <p className="text-xs text-slate-500 font-medium">Design professional treatment plans.</p>
                        </div>
                        <div onClick={() => setActiveTab('payment')} className={`p-10 rounded-[3rem] border shadow-sm hover:shadow-2xl hover:translate-y-[-4px] transition-all cursor-pointer group ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'}`}>
                            <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-8 shadow-inner group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                <IndianRupee size={32} />
                            </div>
                            <h4 className="text-xl font-bold mb-2">Settlement Hub</h4>
                            <p className="text-xs text-slate-500 font-medium">Capture incoming transactions.</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

