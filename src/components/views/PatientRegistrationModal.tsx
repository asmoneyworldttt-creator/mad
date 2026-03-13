import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    Activity, FileSignature, IndianRupee, ImageIcon,
    Calendar, FileText, XCircle, CheckCircle2,
    Smartphone, User, Briefcase, Plus, HeartPulse,
    ShieldAlert, Home, ChevronRight, ChevronLeft, Camera
} from 'lucide-react';
import { useToast } from '../Toast';
import { supabase } from '../../supabase';

interface PatientRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (id: string) => void;
    onNavigate?: (tab: string) => void;
    theme?: 'light' | 'dark';
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}

function InputField({ label, value, onChange, type = "text", placeholder = "", required = false, isDark = false }: {
    label: string; value: string; onChange: (v: string) => void;
    type?: string; placeholder?: string; required?: boolean; isDark?: boolean;
}) {
    return (
        <div className="space-y-1">
            <label className={`text-[9px] font-bold uppercase tracking-wider ml-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                {label}{required && <span className="text-rose-500 ml-1">*</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className={cn(
                    "w-full px-3 py-2 rounded-xl text-xs font-medium outline-none transition-all border",
                    isDark
                        ? "bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-primary/50 focus:bg-white/8"
                        : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-300 focus:border-primary focus:bg-white"
                )}
            />
        </div>
    );
}

function SelectField({ label, value, onChange, options, isDark = false }: {
    label: string; value: string; onChange: (v: string) => void; options: string[]; isDark?: boolean;
}) {
    return (
        <div className="space-y-1">
            <label className={`text-[9px] font-bold uppercase tracking-wider ml-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{label}</label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className={cn(
                    "w-full px-3 py-2 rounded-xl text-xs font-medium outline-none appearance-none transition-all border",
                    isDark
                        ? "bg-white/5 border-white/10 text-white focus:border-primary/50"
                        : "bg-slate-50 border-slate-200 text-slate-800 focus:border-primary"
                )}
            >
                {options.map(o => <option key={o}>{o}</option>)}
            </select>
        </div>
    );
}

function ActionButton({ icon: Icon, label, onClick, color = "text-slate-400" }: { icon: any, label: string, onClick: () => void, color?: string }) {
    return (
        <button
            onClick={onClick}
            className="p-4 border border-slate-100 rounded-2xl hover:border-primary/30 hover:bg-primary/5 transition-all group flex flex-col items-center gap-2 bg-slate-50/50 w-full"
        >
            <div className={cn("w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform", color)}>
                <Icon size={20} />
            </div>
            <span className="font-bold text-[8px] uppercase tracking-wider text-slate-500 group-hover:text-primary transition-colors">{label}</span>
        </button>
    );
}

const STEPS = ['Identity', 'Medical History', 'Insurance & Contact'];

export function PatientRegistrationModal({ isOpen, onClose, onSuccess, onNavigate, theme }: PatientRegistrationModalProps) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState(0);
    const [newlyRegisteredId, setNewlyRegisteredId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    // Step 1 — Identity
    const [identity, setIdentity] = useState({
        firstName: '', lastName: '', dob: '', gender: 'Male',
        bloodGroup: '', phone: '', email: '', whatsappNumber: '',
        occupation: '', idProof: '', address: '', city: '', state: '', pinCode: ''
    });

    // Step 2 — Medical History  
    const [medical, setMedical] = useState({
        chiefComplaint: '', allergies: '', currentMedications: '',
        medicalHistory: '', smokingStatus: 'Non-Smoker', alcoholUse: 'None',
        lastDentalVisit: '', preferredDoctor: '', referralSource: 'Walk-in'
    });

    // Step 3 — Insurance & Emergency Contact
    const [insurance, setInsurance] = useState({
        insuranceProvider: '', policyNumber: '', groupNumber: '',
        emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelation: ''
    });

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPhotoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const calcAge = (dob: string) => {
        if (!dob) return null;
        const diff = Date.now() - new Date(dob).getTime();
        return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
    };

    const validateStep = () => {
        if (step === 0) {
            if (!identity.firstName || !identity.lastName || !identity.phone) {
                showToast('First Name, Last Name and Phone are required.', 'error');
                return false;
            }
        }
        if (step === 1) {
            if (!medical.chiefComplaint) {
                showToast('Chief Complaint is required.', 'error');
                return false;
            }
        }
        return true;
    };

    const handleRegisterPatient = async () => {
        if (!identity.firstName || !identity.phone) {
            showToast('First Name and Phone are required.', 'error');
            return;
        }

        setIsSaving(true);
        const id = `PT-${crypto.randomUUID().split('-')[0].toUpperCase()}`;
        const age = calcAge(identity.dob);

        const { error } = await supabase.from('patients').insert({
            id,
            name: `${identity.firstName} ${identity.lastName}`.trim(),
            age: age,
            gender: identity.gender,
            blood_group: identity.bloodGroup,
            phone: identity.phone.trim(),
            address: [identity.address, identity.city, identity.state, identity.pinCode].filter(Boolean).join(', '),
            whatsapp_number: identity.whatsappNumber.trim(),
            total_spent: 0,
            last_visit: new Date().toISOString().split('T')[0],
            email: identity.email.trim(),
            occupation: identity.occupation.trim(),
            metadata: {
                dob: identity.dob,
                idProof: identity.idProof,
                city: identity.city,
                state: identity.state,
                pinCode: identity.pinCode,
                // Medical
                chiefComplaint: medical.chiefComplaint,
                allergies: medical.allergies,
                currentMedications: medical.currentMedications,
                medicalHistory: medical.medicalHistory,
                smokingStatus: medical.smokingStatus,
                alcoholUse: medical.alcoholUse,
                lastDentalVisit: medical.lastDentalVisit,
                preferredDoctor: medical.preferredDoctor,
                referralSource: medical.referralSource,
                // Insurance
                insuranceProvider: insurance.insuranceProvider,
                policyNumber: insurance.policyNumber,
                groupNumber: insurance.groupNumber,
                emergencyContactName: insurance.emergencyContactName,
                emergencyContactPhone: insurance.emergencyContactPhone,
                emergencyContactRelation: insurance.emergencyContactRelation,
                registered_at: new Date().toISOString()
            }
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
            showToast(`Opening ${action} for patient ${newlyRegisteredId}`, 'success');
        }
    };

    if (!isOpen) return null;

    const inputCls = isDark
        ? "bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-primary/50"
        : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-300 focus:border-primary";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={cn(
                    "relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl custom-scrollbar",
                    isDark ? "bg-slate-900/95 border-white/10" : "bg-white/98 border-slate-200"
                )}
            >
                <div className="p-4 md:p-5">
                    {/* Header */}
                    <header className="flex items-start justify-between mb-4">
                        <div>
                            <h2 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                {newlyRegisteredId ? 'Registered' : 'New Patient'}
                            </h2>
                            <p className="text-[9px] font-bold text-primary uppercase tracking-wider mt-0.5">
                                {newlyRegisteredId ? `Patient ID: ${newlyRegisteredId}` : `Step ${step + 1} of ${STEPS.length}`}
                            </p>
                        </div>
                        <button onClick={onClose} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${isDark ? 'bg-white/10 text-slate-400 hover:text-rose-400' : 'bg-slate-100 text-slate-400 hover:text-rose-500'}`}>
                            <XCircle size={16} />
                        </button>
                    </header>

                    {!newlyRegisteredId ? (
                        <div className="space-y-4">
                            {/* Step Progress */}
                            <div className="flex gap-1">
                                {STEPS.map((s, i) => (
                                    <div key={i} className={cn("flex-1 h-0.5 rounded-full transition-all", i <= step ? 'bg-primary' : isDark ? 'bg-white/10' : 'bg-slate-100')} />
                                ))}
                            </div>

                            {/* STEP 1: Identity */}
                            {step === 0 && (
                                <div className="space-y-4">
                                    {/* Photo Upload */}
                                    <div className="flex flex-col items-center gap-2 mb-1">
                                        <div
                                            className={cn("w-20 h-20 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-primary group", isDark ? 'border-white/20 bg-white/5' : 'border-slate-200 bg-slate-50')}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            {photoPreview
                                                ? <img src={photoPreview} className="w-full h-full object-cover" />
                                                : <div className="flex flex-col items-center gap-1 text-slate-400 group-hover:text-primary transition-colors">
                                                    <Camera size={24} />
                                                    <span className="text-[8px] font-bold uppercase tracking-widest">Photo</span>
                                                </div>
                                            }
                                        </div>
                                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                                        <span className={`text-[8px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Patient Photo</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Left column */}
                                        <div className="space-y-2.5">
                                            <p className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-2"><User size={12} /> Personal</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <InputField label="First Name" value={identity.firstName} onChange={v => setIdentity({ ...identity, firstName: v })} required isDark={isDark} />
                                                <InputField label="Last Name" value={identity.lastName} onChange={v => setIdentity({ ...identity, lastName: v })} required isDark={isDark} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <InputField label="DOB" type="date" value={identity.dob} onChange={v => setIdentity({ ...identity, dob: v })} isDark={isDark} />
                                                <SelectField label="Gender" value={identity.gender} onChange={v => setIdentity({ ...identity, gender: v })} options={['Male', 'Female', 'Other', 'Prefer not to say']} isDark={isDark} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <SelectField label="Blood" value={identity.bloodGroup} onChange={v => setIdentity({ ...identity, bloodGroup: v })} options={['', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']} isDark={isDark} />
                                                <InputField label="Occupation" value={identity.occupation} onChange={v => setIdentity({ ...identity, occupation: v })} isDark={isDark} />
                                            </div>
                                            <InputField label="Govt ID Proof" value={identity.idProof} onChange={v => setIdentity({ ...identity, idProof: v })} isDark={isDark} />
                                        </div>

                                        {/* Right column */}
                                        <div className="space-y-2.5">
                                            <p className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-2"><Smartphone size={12} /> Contact</p>
                                            <InputField label="Phone" type="tel" value={identity.phone} onChange={v => setIdentity({ ...identity, phone: v })} required isDark={isDark} />
                                            <div className="grid grid-cols-2 gap-2">
                                                <InputField label="WhatsApp" type="tel" value={identity.whatsappNumber} onChange={v => setIdentity({ ...identity, whatsappNumber: v })} isDark={isDark} />
                                                <InputField label="Email" type="email" value={identity.email} onChange={v => setIdentity({ ...identity, email: v })} isDark={isDark} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className={`text-[9px] font-bold uppercase tracking-wider ml-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Address</label>
                                                <textarea rows={2} value={identity.address} onChange={e => setIdentity({ ...identity, address: e.target.value })}
                                                    className={cn("w-full px-3 py-2 rounded-xl text-xs font-medium outline-none transition-all border resize-none", isDark ? "bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-primary/50" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-primary")} />
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <InputField label="City" value={identity.city} onChange={v => setIdentity({ ...identity, city: v })} isDark={isDark} />
                                                <InputField label="State" value={identity.state} onChange={v => setIdentity({ ...identity, state: v })} isDark={isDark} />
                                                <InputField label="PIN" value={identity.pinCode} onChange={v => setIdentity({ ...identity, pinCode: v })} isDark={isDark} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Medical History */}
                            {step === 1 && (
                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2"><HeartPulse size={12} /> Clinical Background</p>
                                            <div className="space-y-1.5">
                                                <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Chief Complaint <span className="text-rose-500">*</span></label>
                                                <textarea rows={3} value={medical.chiefComplaint} onChange={e => setMedical({ ...medical, chiefComplaint: e.target.value })}
                                                    className={cn("w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none border resize-none transition-all", isDark ? "bg-white/5 border-white/10 text-white focus:border-primary/50" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-primary")}
                                                    placeholder="Main reason for visit today..." />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Drug / Material Allergies</label>
                                                <textarea rows={2} value={medical.allergies} onChange={e => setMedical({ ...medical, allergies: e.target.value })}
                                                    className={cn("w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none border resize-none transition-all", isDark ? "bg-white/5 border-white/10 text-white focus:border-primary/50" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-primary")}
                                                    placeholder="Penicillin, Latex, Ibuprofen..." />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Current Medications</label>
                                                <textarea rows={2} value={medical.currentMedications} onChange={e => setMedical({ ...medical, currentMedications: e.target.value })}
                                                    className={cn("w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none border resize-none transition-all", isDark ? "bg-white/5 border-white/10 text-white focus:border-primary/50" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-primary")}
                                                    placeholder="List all current medications..." />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2"><ShieldAlert size={12} /> Health & History</p>
                                            <div className="space-y-1.5">
                                                <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Past Medical / Dental History</label>
                                                <textarea rows={3} value={medical.medicalHistory} onChange={e => setMedical({ ...medical, medicalHistory: e.target.value })}
                                                    className={cn("w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none border resize-none transition-all", isDark ? "bg-white/5 border-white/10 text-white focus:border-primary/50" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-primary")}
                                                    placeholder="Diabetes, hypertension, previous dental procedures..." />
                                            </div>
                                            <SelectField label="Smoking Status" value={medical.smokingStatus} onChange={v => setMedical({ ...medical, smokingStatus: v })} options={['Non-Smoker', 'Occasional Smoker', 'Regular Smoker', 'Ex-Smoker']} isDark={isDark} />
                                            <SelectField label="Alcohol Use" value={medical.alcoholUse} onChange={v => setMedical({ ...medical, alcoholUse: v })} options={['None', 'Occasional', 'Moderate', 'Heavy']} isDark={isDark} />
                                            <InputField label="Last Dental Visit (Approx.)" value={medical.lastDentalVisit} onChange={v => setMedical({ ...medical, lastDentalVisit: v })} placeholder="e.g. 6 months ago" isDark={isDark} />
                                            <SelectField label="Referral Source" value={medical.referralSource} onChange={v => setMedical({ ...medical, referralSource: v })} options={['Walk-in', 'Google Search', 'Social Media', 'Friend / Family Referral', 'Doctor Referral', 'Advertisement', 'Other']} isDark={isDark} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: Insurance & Emergency Contact */}
                            {step === 2 && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2"><FileText size={12} /> Insurance Details</p>
                                            <InputField label="Insurance Provider" value={insurance.insuranceProvider} onChange={v => setInsurance({ ...insurance, insuranceProvider: v })} placeholder="Star Health / ICICI Lombard..." isDark={isDark} />
                                            <InputField label="Policy Number" value={insurance.policyNumber} onChange={v => setInsurance({ ...insurance, policyNumber: v })} isDark={isDark} />
                                            <InputField label="Group / Member Number" value={insurance.groupNumber} onChange={v => setInsurance({ ...insurance, groupNumber: v })} isDark={isDark} />
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2"><Home size={12} /> Emergency Contact</p>
                                            <InputField label="Contact Full Name" value={insurance.emergencyContactName} onChange={v => setInsurance({ ...insurance, emergencyContactName: v })} isDark={isDark} />
                                            <InputField label="Contact Phone" type="tel" value={insurance.emergencyContactPhone} onChange={v => setInsurance({ ...insurance, emergencyContactPhone: v })} isDark={isDark} />
                                            <SelectField label="Relationship" value={insurance.emergencyContactRelation} onChange={v => setInsurance({ ...insurance, emergencyContactRelation: v })} options={['', 'Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Guardian', 'Other']} isDark={isDark} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="flex gap-2 pt-2">
                                {step > 0 && (
                                    <button onClick={() => setStep(s => s - 1)} className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all border", isDark ? 'border-white/10 text-slate-400 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}>
                                        <ChevronLeft size={16} /> Back
                                    </button>
                                )}
                                {step < STEPS.length - 1 ? (
                                    <button onClick={() => { if (validateStep()) setStep(s => s + 1); }} className="flex-1 py-2.5 bg-primary text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all">
                                        Continue <ChevronRight size={16} />
                                    </button>
                                ) : (
                                    <button disabled={isSaving} onClick={handleRegisterPatient} className="flex-1 py-2.5 bg-primary text-white rounded-xl font-bold text-xs shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                                        {isSaving ? 'Synching...' : 'Submit Registration'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Success Screen */
                        <div className="space-y-8 text-center py-6">
                            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto relative">
                                <CheckCircle2 size={32} />
                                <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
                            </div>
                            <div>
                                <h3 className={`text-xl font-bold tracking-tight mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>Success!</h3>
                                <p className={`text-xs font-medium max-w-xs mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Patient ID <span className="text-primary font-bold">{newlyRegisteredId}</span> active.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg mx-auto">
                                <ActionButton icon={FileSignature} label="Prescription" onClick={() => handleAddAction('Prescription')} />
                                <ActionButton icon={IndianRupee} label="Billing" onClick={() => handleAddAction('Billing')} color="text-amber-500" />
                                <ActionButton icon={FileText} label="Notes" onClick={() => handleAddAction('Case Notes')} />
                                <ActionButton icon={ImageIcon} label="EMR" onClick={() => handleAddAction('Files')} color="text-purple-500" />
                                <ActionButton icon={Calendar} label="Slot" onClick={() => handleAddAction('Appointment')} color="text-primary" />
                                <ActionButton icon={XCircle} label="Exit" onClick={onClose} color="text-rose-400" />
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(19, 91, 236, 0.15); border-radius: 10px; }
            `}</style>
        </div>
    );
}
