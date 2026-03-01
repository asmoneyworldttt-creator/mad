import { useState } from 'react';
import { Search, Plus, Save, IndianRupee, Calendar } from 'lucide-react';
import { useToast } from '../../components/Toast';

export function QuickBills() {
    const { showToast } = useToast();
    const [patientInfo, setPatientInfo] = useState({ id: '', name: '', phone: '' });
    const [treatmentInfo, setTreatmentInfo] = useState({
        complaint: '',
        treatmentDone: '',
        observationNotes: '',
        medicine: ''
    });
    const [billingInfo, setBillingInfo] = useState({
        fees: 0,
        discount: 0,
        total: 0
    });
    const [followUpInfo, setFollowUpInfo] = useState({
        remarks: '',
        advice: '',
        referTo: '',
        followUpDate: '',
        followUpTime: ''
    });

    const handleSave = () => {
        showToast('Bill saved successfully!', 'success');
        if (followUpInfo.followUpDate) {
            showToast('Follow-up appointment booked for ' + followUpInfo.followUpDate, 'success');
        }
    };

    return (
        <div className="animate-slide-up space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold text-text-dark tracking-tight">Quick Bills</h2>
                    <p className="text-text-muted font-medium">Generate billing and follow-up rapidly.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={handleSave}
                        className="bg-primary hover:bg-primary-hover text-white shadow-premium px-5 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 flex-1 md:flex-none"
                    >
                        <Save size={16} /> Save Bill
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <div className="bg-surface border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-display font-bold text-lg text-text-dark mb-4 border-b border-slate-100 pb-2">General Info</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">Date</label>
                                <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" defaultValue={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">Clinic Location</label>
                                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm">
                                    <option>Main Clinic - Downtown</option>
                                    <option>Branch - Northside</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-bold text-slate-500 mb-1 block">Doctor Name</label>
                                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" defaultValue="Dr. Sarah Jenkins" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-display font-bold text-lg text-text-dark mb-4 border-b border-slate-100 pb-2 flex justify-between items-center">
                            Patient Info
                            <button className="text-xs text-primary font-bold flex items-center gap-1 hover:underline"><Plus size={14} /> New</button>
                        </h3>
                        <div className="space-y-4">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="text" placeholder="Search mobile or name..." className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Patient Name</label>
                                    <input type="text" value={patientInfo.name} onChange={(e) => setPatientInfo({ ...patientInfo, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Phone</label>
                                    <input type="tel" value={patientInfo.phone} onChange={(e) => setPatientInfo({ ...patientInfo, phone: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-display font-bold text-lg text-text-dark mb-4 border-b border-slate-100 pb-2">Treatment Details</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">Complaint</label>
                                <input type="text" value={treatmentInfo.complaint} onChange={(e) => setTreatmentInfo({ ...treatmentInfo, complaint: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">Treatment Done</label>
                                <textarea rows={2} value={treatmentInfo.treatmentDone} onChange={(e) => setTreatmentInfo({ ...treatmentInfo, treatmentDone: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"></textarea>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">Observation Notes</label>
                                <textarea rows={2} value={treatmentInfo.observationNotes} onChange={(e) => setTreatmentInfo({ ...treatmentInfo, observationNotes: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"></textarea>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">Medicine/Prescription</label>
                                <textarea rows={2} value={treatmentInfo.medicine} onChange={(e) => setTreatmentInfo({ ...treatmentInfo, medicine: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-surface border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-display font-bold text-lg text-text-dark mb-4 border-b border-slate-100 pb-2">Billing</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-bold text-slate-600">Fees (₹)</label>
                                <input type="number" value={billingInfo.fees} onChange={(e) => setBillingInfo({ ...billingInfo, fees: parseFloat(e.target.value) || 0, total: (parseFloat(e.target.value) || 0) - billingInfo.discount })} className="w-32 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-right" />
                            </div>
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-bold text-slate-600">Discount (₹)</label>
                                <input type="number" value={billingInfo.discount} onChange={(e) => setBillingInfo({ ...billingInfo, discount: parseFloat(e.target.value) || 0, total: billingInfo.fees - (parseFloat(e.target.value) || 0) })} className="w-32 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-right" />
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                                <label className="text-lg font-bold text-text-dark">Total Price</label>
                                <div className="text-2xl font-bold text-primary flex items-center">
                                    <IndianRupee size={20} className="mr-1" />
                                    {billingInfo.total}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-display font-bold text-lg text-text-dark mb-4 border-b border-slate-100 pb-2">Follow-up & Advice</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">Remarks</label>
                                <input type="text" value={followUpInfo.remarks} onChange={(e) => setFollowUpInfo({ ...followUpInfo, remarks: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">Advice</label>
                                <textarea rows={2} value={followUpInfo.advice} onChange={(e) => setFollowUpInfo({ ...followUpInfo, advice: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"></textarea>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">Refer To (Category/Doctor)</label>
                                <input type="text" value={followUpInfo.referTo} onChange={(e) => setFollowUpInfo({ ...followUpInfo, referTo: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Calendar size={12} /> Follow-up Date</label>
                                    <input type="date" value={followUpInfo.followUpDate} onChange={(e) => setFollowUpInfo({ ...followUpInfo, followUpDate: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Time</label>
                                    <input type="time" value={followUpInfo.followUpTime} onChange={(e) => setFollowUpInfo({ ...followUpInfo, followUpTime: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
