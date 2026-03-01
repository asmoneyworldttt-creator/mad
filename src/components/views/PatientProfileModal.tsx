import { useState } from 'react';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { Activity, FileText, IndianRupee, MessageSquare, Calendar, Image as ImageIcon, MoreHorizontal, FileSignature, Printer } from 'lucide-react';

export function PatientProfileModal({ isOpen, onClose, patient }: any) {
    const [activeTab, setActiveTab] = useState('home');
    const { showToast } = useToast();
    const [isTreatmentPlanOpen, setIsTreatmentPlanOpen] = useState(false);

    if (!patient) return null;

    const tabs = [
        { id: 'home', label: 'Home', icon: Activity },
        { id: 'billing', label: 'Billing', icon: FileText },
        { id: 'payment', label: 'Payment', icon: IndianRupee },
        { id: 'messages', label: 'Messages', icon: MessageSquare },
        { id: 'appointments', label: 'Appointments', icon: Calendar },
        { id: 'gallery', label: 'Gallery', icon: ImageIcon },
        { id: 'more', label: 'More', icon: MoreHorizontal }
    ];

    const handleGeneratePDF = () => {
        const blob = new Blob(['Mock Treatment Plan PDF Content'], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Treatment_Plan_${patient.id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Treatment Plan PDF generated and downloaded successfully!', 'success');
        setIsTreatmentPlanOpen(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Patient Profile" maxWidth="max-w-5xl">
            <div className="flex flex-col h-[70vh]">
                {/* Header Information */}
                <div className="flex justify-between items-start pb-4 border-b border-slate-100 flex-shrink-0">
                    <div className="flex gap-4 items-center">
                        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl font-display shadow-sm">
                            {patient.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <h3 className="font-display font-bold text-2xl text-text-dark">{patient.name} {patient.last_name}</h3>
                            <p className="text-sm font-medium text-slate-500">ID: {patient.id} • {patient.gender}, {patient.age}y • Blood: {patient.blood_group || 'O+'}</p>
                            <p className="text-sm font-medium text-slate-500 mt-1">Phone: {patient.phone} • WA: {patient.whatsapp_number || patient.phone}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-2 overflow-x-auto border-b border-slate-200 mt-4 custom-scrollbar flex-shrink-0">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-bold whitespace-nowrap transition-colors ${isActive ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                <Icon size={16} /> {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto pt-6 custom-scrollbar">
                    {activeTab === 'home' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider mb-2">Personal Details</h4>
                                    <p className="text-sm text-text-dark font-medium"><strong>Address:</strong> {patient.address || '123 Main St, Bangalore'}</p>
                                    <p className="text-sm text-text-dark font-medium mt-1"><strong>Email:</strong> {patient.email || 'N/A'}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider mb-2">Current Medications</h4>
                                    <p className="text-sm text-text-dark font-medium">Paracetamol 500mg, Amoxicillin</p>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-text-dark mb-4 border-b border-slate-100 pb-2">Visit & Prescription History</h4>
                                <div className="space-y-3 pr-2">
                                    {patient.patient_history && patient.patient_history.length > 0 ? patient.patient_history.map((visit: any, i: number) => (
                                        <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full inline-block mb-1">{visit.date}</span>
                                                    <h5 className="font-bold text-text-dark text-sm">{visit.treatment}</h5>
                                                </div>
                                                <span className="font-bold text-text-dark text-sm">₹{visit.cost}</span>
                                            </div>
                                            <p className="text-xs text-slate-500">{visit.notes}</p>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-slate-500 italic">No previous history available.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'billing' && (
                        <div className="space-y-4">
                            <h4 className="font-bold text-text-dark text-lg border-b border-slate-100 pb-2">Invoices & Bills</h4>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-text-dark">INV-2026-001</p>
                                    <p className="text-xs text-slate-500">Total: ₹12,000 • Consolation & X-Ray</p>
                                </div>
                                <button className="text-xs text-primary font-bold px-3 py-1.5 bg-primary/10 rounded hover:bg-primary/20 transition-colors">View Bill</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'payment' && (
                        <div className="space-y-4">
                            <h4 className="font-bold text-text-dark text-lg border-b border-slate-100 pb-2">Payment History</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                                            <th className="p-3">Date</th>
                                            <th className="p-3">Reason</th>
                                            <th className="p-3">Type</th>
                                            <th className="p-3">Remarks</th>
                                            <th className="p-3 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm font-medium">
                                        <tr className="hover:bg-slate-50">
                                            <td className="p-3">12 Oct 2026</td>
                                            <td className="p-3">Consultation</td>
                                            <td className="p-3"><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">Card</span></td>
                                            <td className="p-3 text-slate-500">Cleared</td>
                                            <td className="p-3 text-right text-text-dark">₹1,500</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'messages' && (
                        <div className="space-y-4">
                            <h4 className="font-bold text-text-dark text-lg border-b border-slate-100 pb-2">Automated Communications</h4>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="font-bold text-text-dark text-sm">Appointment Reminder (WhatsApp)</p>
                                    <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded">Sent</span>
                                </div>
                                <p className="text-xs text-slate-500">10 Oct 2026, 09:00 AM</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'appointments' && (
                        <div className="space-y-4">
                            <h4 className="font-bold text-text-dark text-lg border-b border-slate-100 pb-2">Appointment History</h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 bg-slate-50 border-l-4 border-green-500 rounded-xl shadow-sm">
                                    <div>
                                        <p className="font-bold text-text-dark">Routine Checkup</p>
                                        <p className="text-xs text-slate-500 mt-0.5"><Calendar size={12} className="inline mr-1" /> 12 Oct 2026, 10:30 AM</p>
                                    </div>
                                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded uppercase">Visited</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'gallery' && (
                        <div className="space-y-4">
                            <h4 className="font-bold text-text-dark text-lg border-b border-slate-100 pb-2 flex justify-between items-center">
                                Image Gallery
                                <button className="text-xs bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded shadow-sm transition-colors">Upload</button>
                            </h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                                    <img src="https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&q=80&w=300" className="w-full h-full object-cover" alt="Scan" />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'more' && (
                        <div className="space-y-6">
                            <h4 className="font-bold text-text-dark text-lg border-b border-slate-100 pb-2">Action Menu</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <button onClick={() => showToast('Prescription module opened', 'success')} className="p-4 border border-slate-200 rounded-xl hover:bg-primary/5 hover:border-primary transition-colors flex flex-col items-center gap-2 group">
                                    <FileSignature size={24} className="text-slate-400 group-hover:text-primary transition-colors" />
                                    <span className="text-sm font-bold text-slate-600 group-hover:text-primary">Add Prescription</span>
                                </button>
                                <button onClick={() => showToast('Payment module opened', 'success')} className="p-4 border border-slate-200 rounded-xl hover:bg-primary/5 hover:border-primary transition-colors flex flex-col items-center gap-2 group">
                                    <IndianRupee size={24} className="text-slate-400 group-hover:text-primary transition-colors" />
                                    <span className="text-sm font-bold text-slate-600 group-hover:text-primary">Add Payment</span>
                                </button>
                                <button onClick={() => showToast('Booking module opened', 'success')} className="p-4 border border-slate-200 rounded-xl hover:bg-primary/5 hover:border-primary transition-colors flex flex-col items-center gap-2 group">
                                    <Calendar size={24} className="text-slate-400 group-hover:text-primary transition-colors" />
                                    <span className="text-sm font-bold text-slate-600 group-hover:text-primary">Book Appointment</span>
                                </button>
                                <button onClick={() => setIsTreatmentPlanOpen(true)} className="p-4 border border-primary/30 bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors flex flex-col items-center gap-2 group shadow-sm">
                                    <Activity size={24} className="text-primary" />
                                    <span className="text-sm font-bold text-primary">Treatment Plan</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Nested Treatment Plan Modal */}
            {isTreatmentPlanOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col animate-slide-up">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-display font-bold text-xl text-text-dark flex items-center gap-2">
                                <Activity className="text-primary" size={20} /> Treatment Plan
                            </h3>
                            <button onClick={() => setIsTreatmentPlanOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold p-2">✕</button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">Diagnosis</label>
                                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Primary diagnosis..." />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">Complaint</label>
                                <textarea rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Patient's primary complaint..."></textarea>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">Proposed Treatment</label>
                                <textarea rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Details of the treatment plan..."></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Observation Notes</label>
                                    <textarea rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"></textarea>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Instructions</label>
                                    <textarea rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"></textarea>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 flex-wrap">
                            <button onClick={() => showToast('Sharing via Email...')} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 hidden sm:block">Email</button>
                            <button onClick={() => showToast('Sharing via WhatsApp...')} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 hidden sm:block">WhatsApp</button>
                            <button onClick={handleGeneratePDF} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-100">
                                <Printer size={16} /> Print/PDF
                            </button>
                            <button onClick={() => setIsTreatmentPlanOpen(false)} className="px-4 py-2 bg-primary hover:bg-primary-hover shadow-premium rounded-lg text-sm font-bold text-white">
                                Save Plan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}
