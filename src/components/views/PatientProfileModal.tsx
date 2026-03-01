import { useState, useMemo } from 'react';
import { Modal } from '../../components/Modal';
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
    Trash
} from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { RealisticDentition } from './Dentition3D';

export function PatientProfileModal({ isOpen, onClose, patient }: any) {
    const [activeTab, setActiveTab] = useState('home');
    const { showToast } = useToast();
    const [isTreatmentPlanOpen, setIsTreatmentPlanOpen] = useState(false);
    const [isBillDetailOpen, setIsBillDetailOpen] = useState(false);
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

    if (!patient) return null;

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

    const handleDownloadReport = (format: 'pdf' | 'excel') => {
        showToast(`Preparing ${format.toUpperCase()} report...`, 'success');
        const content = format === 'pdf' ? 'PDF Content' : 'ID,Name,Treatment,Cost\n1,Patient Name,Checkup,500';
        const blob = new Blob([content], { type: format === 'pdf' ? 'application/pdf' : 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Patient_Report_${patient.id}.${format === 'pdf' ? 'pdf' : 'csv'}`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`Report downloaded successfully!`, 'success');
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

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Patient Overview" maxWidth="max-w-6xl">
            <div className="flex flex-col h-[80vh]">
                {/* Header Information */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-6 pb-8 border-b border-slate-100 flex-shrink-0 px-2">
                    <div className="flex gap-6 items-center">
                        <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary/10 to-primary/5 text-primary flex items-center justify-center font-bold text-4xl font-display shadow-inner border border-primary/20">
                            {patient.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-display font-bold text-3xl text-text-dark tracking-tight">{patient.name} {patient.last_name || ''}</h3>
                                <span className="bg-green-50 text-green-600 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-tighter border border-green-100">Active Patient</span>
                            </div>
                            <p className="text-sm font-bold text-slate-500 flex items-center gap-2">
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-xs">ID: {patient.id}</span>
                                <span>• {patient.gender}, {patient.age}y • Blood: <span className="text-alert">{patient.blood_group || 'O+'}</span></span>
                            </p>
                            <div className="flex gap-4 mt-3">
                                <a href={`tel:${patient.phone}`} className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-primary transition-colors">
                                    <PhoneCall size={12} /> {patient.phone}
                                </a>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                    <Mail size={12} /> {patient.email || 'no-email@example.com'}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <button onClick={() => showToast('Starting quick call...', 'success')} className="flex-1 md:flex-none p-3 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-all border border-slate-200">
                            <PhoneCall size={20} />
                        </button>
                        <button onClick={() => showToast('Opening WhatsApp chat...', 'success')} className="flex-1 md:flex-none p-3 bg-green-50 text-green-600 rounded-2xl hover:bg-green-100 transition-all border border-green-200">
                            <MessageSquare size={20} />
                        </button>
                        <button onClick={() => handleDownloadReport('pdf')} className="flex-auto md:flex-none px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-premium shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-sm flex items-center justify-center gap-2">
                            <Download size={18} /> Download EMR
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-1 overflow-x-auto border-b border-slate-100 mt-2 custom-scrollbar flex-shrink-0">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`flex items-center gap-2 px-6 py-4 border-b-2 text-xs font-bold whitespace-nowrap transition-all uppercase tracking-widest ${isActive ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                            >
                                <Icon size={14} /> {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto pt-8 pb-4 custom-scrollbar pr-2">
                    {activeTab === 'home' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-200 shadow-inner">
                                            <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-4">Patient Bio & Address</h4>
                                            <p className="text-sm text-slate-700 font-bold leading-relaxed">{patient.address || 'No address provided in records.'}</p>
                                            <div className="mt-4 pt-4 border-t border-slate-200/50">
                                                <p className="text-xs font-bold text-slate-500">Registered on: {new Date(patient.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-200 shadow-inner">
                                            <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-4">Health Alerts</h4>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-extrabold uppercase border border-red-100">Hypertension</span>
                                                <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-extrabold uppercase border border-amber-100">Aspirin Allergy</span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 font-medium mt-4">Known smoker. History of early periodontal disease.</p>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-bold text-text-dark flex items-center gap-2">
                                                <History size={18} className="text-primary" />
                                                Recent Clinical History
                                            </h4>
                                            <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">View All Visits</button>
                                        </div>
                                        <div className="space-y-4">
                                            {patient.patient_history && patient.patient_history.length > 0 ? patient.patient_history.map((visit: any, i: number) => (
                                                <div key={i} className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors capitalize font-bold">
                                                                {visit.treatment.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <h5 className="font-bold text-text-dark text-base">{visit.treatment}</h5>
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{visit.date}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-primary text-lg">₹{visit.cost}</p>
                                                            <span className="text-[10px] font-bold text-green-500 uppercase">Paid Full</span>
                                                        </div>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 rounded-2xl border border-transparent group-hover:border-slate-100 transition-all">
                                                        <p className="text-xs text-slate-600 font-medium leading-relaxed italic">"{visit.notes}"</p>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="p-10 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                                    <p className="text-sm text-slate-400 italic">No clinical history records found.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-2 mb-6">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                <History size={16} />
                                            </div>
                                            <h4 className="font-bold text-slate-800">Repeated Treatments</h4>
                                        </div>
                                        {repeatedTreatments.length > 0 ? (
                                            <div className="space-y-3">
                                                {repeatedTreatments.map(([name, count]: any) => (
                                                    <div key={name} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                                        <span className="text-xs font-bold text-slate-600">{name}</span>
                                                        <span className="bg-primary text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">{count} Times</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400 italic text-center py-4">No recurring treatments found.</p>
                                        )}
                                    </div>

                                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                                        <div className="relative z-10">
                                            <p className="text-[10px] font-bold opacity-60 uppercase tracking-[0.2em] mb-4">Account Balance</p>
                                            <h5 className="text-4xl font-display font-bold mb-2">₹1,500 <span className="text-xs opacity-60 font-medium">Pending</span></h5>
                                            <div className="flex gap-2 mt-6">
                                                <button onClick={() => setActiveTab('payment')} className="flex-1 bg-white text-slate-900 py-2.5 rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-all">Pay Dues</button>
                                                <button onClick={() => setActiveTab('billing')} className="px-3 border border-white/20 rounded-xl hover:bg-white/10 transition-all">
                                                    <FileText size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <IndianRupee size={100} className="absolute -right-4 -bottom-4 opacity-5 rotate-12" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'billing' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h4 className="font-bold text-text-dark text-xl flex items-center gap-2"><FileText size={20} className="text-primary" /> Generated Invoices</h4>
                                <div className="flex gap-2">
                                    <button onClick={() => handleDownloadReport('excel')} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-100">
                                        <Download size={14} /> CSV
                                    </button>
                                    <button onClick={() => handleDownloadReport('pdf')} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-100">
                                        <Printer size={14} /> PDF
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { id: 'INV-001', date: '12 Oct 2026', amount: 12000, status: 'Paid', items: 'Consultation, OPG, Scaling' },
                                    { id: 'INV-002', date: '25 Oct 2026', amount: 3500, status: 'Unpaid', items: 'Review, Medication' }
                                ].map(bill => (
                                    <div key={bill.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all border-l-4 border-l-primary">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h5 className="font-bold text-slate-800">{bill.id}</h5>
                                                <p className="text-[10px] font-bold text-slate-400">{bill.date}</p>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${bill.status === 'Paid' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                {bill.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mb-6 font-medium line-clamp-1">{bill.items}</p>
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                            <p className="text-xl font-bold text-slate-800">₹{bill.amount}</p>
                                            <div className="flex gap-2">
                                                <button onClick={() => { setSelectedBill(bill); setIsBillDetailOpen(true); }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-primary rounded-xl transition-all" title="View Bill">
                                                    <Eye size={18} />
                                                </button>
                                                <button onClick={() => showToast('Share link copied!', 'success')} className="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-all" title="Share Bill">
                                                    <Share2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'payment' && (
                        <div className="space-y-6">
                            <h4 className="font-bold text-text-dark text-xl flex items-center gap-2"><IndianRupee size={20} className="text-primary" /> Payment Transactions</h4>
                            <div className="overflow-hidden rounded-3xl border border-slate-200">
                                <table className="w-full text-left border-collapse bg-white">
                                    <thead>
                                        <tr className="bg-slate-50 text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold border-b border-slate-200">
                                            <th className="p-4">Reference</th>
                                            <th className="p-4">Date</th>
                                            <th className="p-4">Method</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm font-medium">
                                        <tr className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 text-slate-800">PAY-2489</td>
                                            <td className="p-4 text-slate-500">12 Oct 2026</td>
                                            <td className="p-4"><span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border border-blue-100">UPI / QR</span></td>
                                            <td className="p-4"><span className="text-green-500 flex items-center gap-1 font-bold text-xs"><div className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Successful</span></td>
                                            <td className="p-4 text-right text-slate-900 font-bold">₹1,500</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'emr' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <h4 className="font-bold text-text-dark text-xl flex items-center gap-2"><Activity size={20} className="text-primary" /> 3D Clinical Charting</h4>
                                <div className="flex gap-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-xl flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live View
                                    </span>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-[2.5rem] p-1 shadow-inner relative overflow-hidden h-[450px] border border-slate-200">
                                <Canvas shadows camera={{ position: [0, 8, 15], fov: 45 }}>
                                    <color attach="background" args={['#f8fafc']} />
                                    <ambientLight intensity={0.6} />
                                    <Environment preset="studio" />
                                    <group position={[0, -1, 0]}>
                                        <RealisticDentition
                                            selectedTooth={null}
                                            toothChartData={toothChartData}
                                            onSelectTooth={() => { }}
                                        />
                                    </group>
                                    <OrbitControls enablePan={false} minDistance={10} maxDistance={25} />
                                </Canvas>
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/50 shadow-lg pointer-events-none flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">FDI Notation System • Drag to Rotate</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(toothChartData).length > 0 ? (
                                    Object.entries(toothChartData).map(([tooth, data]: [string, any]) => (
                                        <div key={tooth} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-2 hover:border-primary/30 transition-all">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-extrabold bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-widest">Tooth #{tooth}</span>
                                                <span className="text-xs font-bold text-slate-800">{data.condition}</span>
                                            </div>
                                            {data.surfaces?.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {data.surfaces.map((s: string) => (
                                                        <span key={s} className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded uppercase">{s}</span>
                                                    ))}
                                                </div>
                                            )}
                                            {data.note && (
                                                <p className="text-xs text-slate-500 italic mt-2 font-medium bg-slate-50/50 p-2 rounded-xl">"{data.note}"</p>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full p-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-300 mx-auto mb-4">
                                            <Activity size={32} />
                                        </div>
                                        <p className="text-sm font-bold text-slate-400 italic">No clinical findings marked in chart.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'more' && (
                        <div className="space-y-8">
                            <h4 className="font-bold text-text-dark text-xl flex items-center gap-2"><MoreHorizontal size={20} className="text-primary" /> Advanced Clinical Tools</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <button onClick={() => showToast('Prescription module opened', 'success')} className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:translate-y--1 hover:border-primary/20 transition-all flex flex-col items-center gap-4 group">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center transition-colors shadow-inner">
                                        <FileSignature size={28} />
                                    </div>
                                    <span className="text-sm font-bold text-slate-600 group-hover:text-primary uppercase tracking-widest">Add Prescription</span>
                                </button>
                                <button onClick={() => showToast('Payment module opened', 'success')} className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:translate-y--1 hover:border-primary/20 transition-all flex flex-col items-center gap-4 group">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center transition-colors shadow-inner">
                                        <IndianRupee size={28} />
                                    </div>
                                    <span className="text-sm font-bold text-slate-600 group-hover:text-primary uppercase tracking-widest">Add Payment</span>
                                </button>
                                <button onClick={() => showToast('Booking module opened', 'success')} className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:translate-y--1 hover:border-primary/20 transition-all flex flex-col items-center gap-4 group">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center transition-colors shadow-inner">
                                        <Calendar size={28} />
                                    </div>
                                    <span className="text-sm font-bold text-slate-600 group-hover:text-primary uppercase tracking-widest">Book Slot</span>
                                </button>
                                <button onClick={() => setIsTreatmentPlanOpen(true)} className="p-8 bg-primary/5 border border-primary/20 rounded-[2rem] shadow-sm hover:shadow-xl hover:translate-y--1 transition-all flex flex-col items-center gap-4 group">
                                    <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30">
                                        <Activity size={28} />
                                    </div>
                                    <span className="text-sm font-bold text-primary uppercase tracking-widest">Treatment Plan</span>
                                </button>
                            </div>

                            <div className="pt-8 border-t border-slate-100">
                                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">Dangerous Actions</h5>
                                <div className="flex gap-4">
                                    <button onClick={() => showToast('Profile editing enabled')} className="flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-600 rounded-2xl font-bold text-xs hover:bg-slate-100 transition-all">
                                        <Edit3 size={16} /> Update Details
                                    </button>
                                    <button onClick={() => showToast('Patient record archiving requested', 'error')} className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-500 rounded-2xl font-bold text-xs hover:bg-red-500 hover:text-white transition-all">
                                        <Trash size={16} /> Archive Patient
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Nested Treatment Plan Modal */}
            <Modal isOpen={isTreatmentPlanOpen} onClose={() => setIsTreatmentPlanOpen(false)} title="Proposed Treatment Plan" maxWidth="max-w-3xl">
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">Main Diagnosis</label>
                                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-primary outline-none transition-all" placeholder="Enter clinical finding..." />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">Chief Complaint</label>
                                <textarea rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-primary outline-none transition-all" placeholder="Describe patient's pain/issue..."></textarea>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">Estimated Cost (INR)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                    <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-8 py-3 text-sm focus:bg-white focus:border-primary outline-none transition-all" placeholder="0.00" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">Proposed Treatments</label>
                                <textarea rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-primary outline-none transition-all" placeholder="List procedures (e.g., RCT, Crown)..."></textarea>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center"><Download size={20} /></div>
                            <div>
                                <p className="text-xs font-bold text-primary">Generate Official Document</p>
                                <p className="text-[10px] text-slate-500">Includes clinic logo and doctor's signature</p>
                            </div>
                        </div>
                        <button onClick={() => handleDownloadReport('pdf')} className="bg-white text-primary px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm border border-primary/20 hover:bg-primary hover:text-white transition-all">PDF</button>
                    </div>
                    <div className="flex gap-3 pt-6 border-t border-slate-100">
                        <button onClick={() => setIsTreatmentPlanOpen(false)} className="flex-1 py-4 border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 transition-all">Cancel</button>
                        <button onClick={() => { showToast('Treatment plan saved!', 'success'); setIsTreatmentPlanOpen(false); }} className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/30 hover:bg-primary-hover transition-all uppercase tracking-widest text-xs">Save & Send to Patient</button>
                    </div>
                </div>
            </Modal>

            {/* Bill Details Modal */}
            <Modal isOpen={isBillDetailOpen} onClose={() => setIsBillDetailOpen(false)} title="Detailed Invoice View" maxWidth="max-w-2xl">
                {selectedBill && (
                    <div className="space-y-8 py-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Invoice Number</p>
                                <h4 className="text-2xl font-display font-bold text-slate-800">{selectedBill.id}</h4>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date Issued</p>
                                <p className="text-sm font-bold text-slate-700">{selectedBill.date}</p>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Treatment Line Items</h5>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-bold text-slate-700">Clinical Consultation</span>
                                    <span className="font-bold text-slate-900">₹500.00</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-bold text-slate-700">Digital X-Ray (IOPA)</span>
                                    <span className="font-bold text-slate-900">₹300.00</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-bold text-slate-700">Composite Restoration</span>
                                    <span className="font-bold text-slate-900">₹2,700.00</span>
                                </div>
                            </div>
                            <div className="mt-6 pt-6 border-t border-slate-200 flex justify-between items-center">
                                <span className="text-lg font-display font-bold text-slate-800">Total Amount</span>
                                <span className="text-2xl font-display font-bold text-primary">₹{selectedBill.amount.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => showToast('Sharing via WhatsApp...', 'success')} className="flex items-center justify-center gap-2 py-4 bg-green-50 text-green-600 rounded-2xl font-bold text-sm border border-green-100 hover:bg-green-100 transition-all">
                                <Share2 size={18} /> WhatsApp
                            </button>
                            <button onClick={() => handleDownloadReport('pdf')} className="flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all">
                                <Download size={18} /> Print Invoice
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </Modal>
    );
}
