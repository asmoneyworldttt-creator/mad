import { useState, useEffect } from 'react';
import { Search, Plus, Save, IndianRupee, Calendar } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { supabase } from '../../supabase';

export function QuickBills() {
    const { showToast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);

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

    useEffect(() => {
        if (searchQuery.length > 2) {
            const searchPatients = async () => {
                const { data } = await supabase
                    .from('patients')
                    .select('*')
                    .or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
                    .limit(5);
                setSearchResults(data || []);
            };
            searchPatients();
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    const handleSelectPatient = (p: any) => {
        setSelectedPatient(p);
        setPatientInfo({ id: p.id, name: p.name, phone: p.phone });
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleSave = async () => {
        if (!selectedPatient && !patientInfo.name) {
            showToast('Please select or enter patient info.', 'error');
            return;
        }

        const patientId = selectedPatient?.id || `PT-${Math.floor(Math.random() * 100000)}`;
        const date = new Date().toISOString().split('T')[0];

        // 1. Save Bill
        const { error: billError } = await supabase.from('bills').insert({
            id: `BIL-${Math.floor(Math.random() * 100000)}`,
            patient_id: patientId,
            amount: billingInfo.total,
            status: 'paid',
            date: date
        });

        // 2. Save Treatment History
        const { error: historyError } = await supabase.from('patient_history').insert({
            id: `HST-${Math.floor(Math.random() * 100000)}`,
            patient_id: patientId,
            date: date,
            treatment: treatmentInfo.treatmentDone || 'General Consultation',
            category: 'General',
            cost: billingInfo.total,
            notes: treatmentInfo.observationNotes
        });

        // 3. Save Follow-up Appointment if needed
        if (followUpInfo.followUpDate) {
            await supabase.from('appointments').insert({
                id: `APT-${Math.floor(Math.random() * 100000)}`,
                name: patientInfo.name,
                time: followUpInfo.followUpTime || '10:00 AM',
                type: 'Follow-up',
                status: 'Confirmed',
                date: followUpInfo.followUpDate
            });
            showToast('Follow-up appointment booked!', 'success');
        }

        if (billError || historyError) {
            showToast('Error saving bill record.', 'error');
        } else {
            showToast('Quick Bill & History saved successfully!', 'success');
            // Reset form
            setTreatmentInfo({ complaint: '', treatmentDone: '', observationNotes: '', medicine: '' });
            setBillingInfo({ fees: 0, discount: 0, total: 0 });
            setFollowUpInfo({ remarks: '', advice: '', referTo: '', followUpDate: '', followUpTime: '' });
            setSelectedPatient(null);
            setPatientInfo({ id: '', name: '', phone: '' });
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
                                <input
                                    type="text"
                                    placeholder="Search mobile or name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-9 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-sm"
                                />
                                {searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                        {searchResults.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => handleSelectPatient(p)}
                                                className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 transition-colors border-b border-slate-50 last:border-0"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                                    {p.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-700">{p.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{p.phone} • {p.id}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {selectedPatient && (
                                <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                                            {selectedPatient.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-primary">{selectedPatient.name}</p>
                                            <p className="text-xs text-slate-500">{selectedPatient.phone}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedPatient(null)} className="text-xs font-bold text-slate-400 hover:text-red-500">Change</button>
                                </div>
                            )}
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
