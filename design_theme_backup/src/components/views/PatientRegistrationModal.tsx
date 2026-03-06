import { useState } from 'react';

import { useToast } from '../Toast';
import { supabase } from '../../supabase';
import { Activity, FileSignature, IndianRupee, ImageIcon, Calendar, FileText } from 'lucide-react';

interface PatientRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (id: string) => void;
    onNavigate?: (tab: string) => void;
    theme?: 'light' | 'dark';
}

export function PatientRegistrationModal({ isOpen, onClose, onSuccess, onNavigate, theme }: PatientRegistrationModalProps) {
    const { showToast } = useToast();
    const [newlyRegisteredId, setNewlyRegisteredId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [newPatient, setNewPatient] = useState({
        firstName: '', lastName: '', age: '', gender: 'Male',
        bloodGroup: '', phone: '', address: '', whatsappNumber: ''
    });

    const handleRegisterPatient = async () => {
        if (!newPatient.firstName || !newPatient.lastName || !newPatient.age || !newPatient.phone || !newPatient.address || !newPatient.whatsappNumber || !newPatient.bloodGroup) {
            showToast('Please fill all mandatory fields.', 'error');
            return;
        }

        setIsSaving(true);
        const id = `PT-${Math.floor(Math.random() * 100000)}`;
        const { error } = await supabase.from('patients').insert({
            id: id,
            name: newPatient.firstName,
            last_name: newPatient.lastName,
            age: parseInt(newPatient.age),
            gender: newPatient.gender,
            blood_group: newPatient.bloodGroup,
            phone: newPatient.phone,
            address: newPatient.address,
            whatsapp_number: newPatient.whatsappNumber,
            total_spent: 0,
            last_visit: new Date().toISOString().split('T')[0],
            email: ''
        });

        setIsSaving(false);
        if (error) {
            showToast(error.message, 'error');
        } else {
            showToast('Patient registered successfully!', 'success');
            setNewlyRegisteredId(id);
            if (onSuccess) onSuccess(id);
        }
    };

    const handleAddAction = (action: string) => {
        const tabMap: Record<string, string> = {
            'Prescription': 'prescriptions',
            'Billing': 'quickbills',
            'Files': 'emr',
            'Case Notes': 'emr',
            'Appointment': 'appointments'
        };

        const targetTab = tabMap[action];
        if (targetTab && onNavigate) {
            onNavigate(targetTab);
            onClose();
        } else {
            showToast(`Opening ${action} module for Patient ID: ${newlyRegisteredId}`, 'success');
        }
    };

    return isOpen ? (
        <div className="absolute inset-0 bg-white z-50 p-6 overflow-y-auto w-full h-full animate-slide-up pb-24">
            <div className="max-w-2xl mx-auto mt-6 border border-slate-200 shadow-xl rounded-2xl bg-white p-8">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => { onClose(); setNewlyRegisteredId(null); setNewPatient({ firstName: '', lastName: '', age: '', gender: 'Male', bloodGroup: '', phone: '', address: '', whatsappNumber: '' }); }} className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold transition-all text-slate-600">Back</button>
                    <h2 className="text-2xl font-bold font-sans">Register New Patient</h2>
                </div>
                {!newlyRegisteredId ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">First Name *</label>
                                <input type="text" value={newPatient.firstName} onChange={e => setNewPatient({ ...newPatient, firstName: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">Last Name *</label>
                                <input type="text" value={newPatient.lastName} onChange={e => setNewPatient({ ...newPatient, lastName: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">Phone Number *</label>
                                <input type="tel" value={newPatient.phone} onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">WhatsApp Number *</label>
                                <input type="tel" value={newPatient.whatsappNumber} onChange={e => setNewPatient({ ...newPatient, whatsappNumber: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none" />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">Age *</label>
                                <input type="number" value={newPatient.age} onChange={e => setNewPatient({ ...newPatient, age: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">Gender *</label>
                                <select value={newPatient.gender} onChange={e => setNewPatient({ ...newPatient, gender: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none">
                                    <option>Male</option>
                                    <option>Female</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">Blood Grp *</label>
                                <input type="text" value={newPatient.bloodGroup} onChange={e => setNewPatient({ ...newPatient, bloodGroup: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none" placeholder="e.g. O+" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Address *</label>
                            <input type="text" value={newPatient.address} onChange={e => setNewPatient({ ...newPatient, address: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none" />
                        </div>
                        <button disabled={isSaving} onClick={handleRegisterPatient} className="w-full mt-4 py-3 bg-primary hover:bg-primary-hover text-white flex items-center justify-center rounded-lg font-bold text-sm shadow-premium transition-transform active:scale-95 disabled:bg-slate-400">
                            {isSaving ? 'Registering...' : 'Complete Registration'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6 animate-fade-in text-center p-6">
                        <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-4">
                            <Activity size={32} />
                        </div>
                        <h3 className="font-sans font-bold text-2xl text-text-dark">Patient Registered</h3>
                        <p className="text-slate-500 font-medium">What would you like to do next for {newPatient.firstName}?</p>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                            <button onClick={() => handleAddAction('Prescription')} className="p-4 border border-slate-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group flex flex-col items-center gap-2">
                                <FileSignature className="text-slate-400 group-hover:text-primary transition-colors" size={24} />
                                <span className="font-bold text-sm text-slate-600 group-hover:text-primary">Add Prescription</span>
                            </button>
                            <button onClick={() => handleAddAction('Billing')} className="p-4 border border-slate-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group flex flex-col items-center gap-2">
                                <IndianRupee className="text-slate-400 group-hover:text-primary transition-colors" size={24} />
                                <span className="font-bold text-sm text-slate-600 group-hover:text-primary">Add Bill</span>
                            </button>
                            <button onClick={() => handleAddAction('Files')} className="p-4 border border-slate-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group flex flex-col items-center gap-2">
                                <ImageIcon className="text-slate-400 group-hover:text-primary transition-colors" size={24} />
                                <span className="font-bold text-sm text-slate-600 group-hover:text-primary">Add Files</span>
                            </button>
                            <button onClick={() => handleAddAction('Case Notes')} className="p-4 border border-slate-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group flex flex-col items-center gap-2">
                                <FileText className="text-slate-400 group-hover:text-primary transition-colors" size={24} />
                                <span className="font-bold text-sm text-slate-600 group-hover:text-primary">Case Notes</span>
                            </button>
                            <button onClick={() => handleAddAction('Appointment')} className="p-4 border border-slate-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group flex flex-col items-center gap-2 lg:col-span-2">
                                <Calendar className="text-slate-400 group-hover:text-primary transition-colors" size={24} />
                                <span className="font-bold text-sm text-slate-600 group-hover:text-primary">Book Appointment</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    ) : null;
}


