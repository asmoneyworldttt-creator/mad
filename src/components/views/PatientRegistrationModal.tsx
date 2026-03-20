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
    isPage?: boolean;
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}

function InputField({ label, value, onChange, type = "text", placeholder = "", required = false, isDark = false }: {
    label: string; value: string; onChange: (v: string) => void;
    type?: string; placeholder?: string; required?: boolean; isDark?: boolean;
}) {
    return (
        <div className="space-y-2">
            <label className={`text-base font-bold ml-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {label}{required && <span className="text-rose-500 ml-1.5 font-bold">*</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className={cn(
                    "w-full px-6 py-4 rounded-2xl text-base font-bold outline-none transition-all border shadow-sm",
                    isDark
                        ? "bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-primary/50 focus:bg-white/8"
                        : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-300 focus:border-primary focus:bg-white shadow-inner"
                )}
            />
        </div>
    );
}

function SelectField({ label, value, onChange, options, isDark = false }: {
    label: string; value: string; onChange: (v: string) => void; options: string[]; isDark?: boolean;
}) {
    return (
        <div className="space-y-2">
            <label className={`text-base font-bold ml-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</label>
            <div className="relative">
                <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className={cn(
                        "w-full px-6 py-4 rounded-2xl text-base font-bold outline-none appearance-none transition-all border shadow-sm cursor-pointer",
                        isDark
                            ? "bg-white/5 border-white/10 text-white focus:border-primary/50"
                            : "bg-slate-50 border-slate-200 text-slate-800 focus:border-primary shadow-inner"
                    )}
                >
                    {options.map(o => <option key={o}>{o}</option>)}
                </select>
            </div>
        </div>
    );
}

function ActionButton({ icon: Icon, label, onClick, color = "text-slate-400" }: { icon: any, label: string, onClick: () => void, color?: string }) {
    return (
        <button
            onClick={onClick}
            className="p-6 border border-slate-100 dark:border-white/10 rounded-3xl hover:border-primary/30 hover:bg-primary/5 transition-all group flex flex-col items-center gap-3 bg-slate-50/50 dark:bg-white/5 w-full shadow-sm hover:shadow-md"
        >
            <div className={cn("w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-md flex items-center justify-center group-hover:scale-110 transition-transform", color)}>
                <Icon size={28} />
            </div>
            <span className="font-bold text-sm text-slate-500 group-hover:text-primary transition-colors">{label}</span>
        </button>
    );
}

const STEPS = ['Identity', 'Medical History', 'Extra Details', 'Contact & Insurance'];

export function PatientRegistrationModal({ isOpen, onClose, onSuccess, onNavigate, theme, isPage }: PatientRegistrationModalProps) {
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
                showToast('Reason for Visit is required.', 'error');
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
        const { data: generatedId, error: rpcError } = await supabase.rpc('generate_patient_id');
        const id = !rpcError && generatedId ? generatedId : `PAT-${Date.now().toString().slice(-4)}`;
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

    const Content = (
        <div className={cn("flex flex-col h-full relative overflow-hidden", !isPage && "max-h-[85vh] overflow-y-auto")}>
            {/* Ambient dynamic background orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                <motion.div 
                    animate={{ x: [0, 40, -40, 0], y: [0, 20, -20, 0] }}
                    transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
                    className="absolute top-1/4 -left-10 w-72 h-72 rounded-full bg-cyan-400/10 blur-3xl opacity-60"
                />
                <motion.div 
                    animate={{ x: [0, -30, 30, 0], y: [0, -40, 40, 0] }}
                    transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
                    className="absolute bottom-1/4 -right-10 w-80 h-80 rounded-full bg-violet-400/10 blur-3xl opacity-60"
                />
            </div>
            <div className="p-4 sm:p-8 md:p-12">
                {/* Header */}
                <header className="flex items-start justify-between mb-6 sm:mb-12">
                    <div className="flex items-center gap-3 sm:gap-6">
                        <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-[1.5rem] sm:rounded-[2rem] bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                            <User size={20} className="sm:hidden" />
                            <User size={32} className="hidden sm:block" />
                        </div>
                        <div>
                            <p className={`text-lg sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>Clinical Onboarding</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">New Registry • Phase {step + 1} of {STEPS.length}</p>
                        </div>
                    </div>
                    {!isPage && (
                        <button onClick={onClose} className="p-2 sm:p-4 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all shrink-0">
                            <XCircle size={24} className="text-slate-400" />
                        </button>
                    )}
                </header>

                {/* Stepper Indicator */}
                <div className="flex items-center gap-2 sm:gap-4 mb-6 sm:mb-12 overflow-x-auto no-scrollbar pb-1">
                    {STEPS.map((s, i) => (
                        <div key={s} className="flex-1 flex items-center gap-4">
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all",
                                step === i ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" :
                                    step > i ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-white/5 text-slate-400"
                            )}>
                                {step > i ? <CheckCircle2 size={20} /> : i + 1}
                            </div>
                            <span className={cn("text-[10px] font-black uppercase tracking-widest hidden md:block", step === i ? "text-primary" : "text-slate-400")}>{s}</span>
                            {i < STEPS.length - 1 && <div className="flex-1 h-0.5 bg-slate-200 dark:bg-white/5 mx-2" />}
                        </div>
                    ))}
                </div>

                {!newlyRegisteredId ? (
                    <div className="space-y-12">
                        {step === 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 animate-slide-up">
                                <div className="space-y-10">
                                    <div className="flex items-center gap-6 pb-6 border-b border-slate-100 dark:border-white/5">
                                        <div className="relative group">
                                            <div className="w-24 h-24 rounded-[2rem] bg-slate-100 dark:bg-white/5 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300 dark:border-white/10 group-hover:border-primary transition-all">
                                                {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" /> : <Camera className="text-slate-400" size={32} />}
                                            </div>
                                            <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 p-3 bg-primary text-white rounded-2xl shadow-lg hover:scale-110 transition-all">
                                                <Plus size={16} />
                                            </button>
                                            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handlePhotoUpload} />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-bold mb-1">Clinical Portrait</h4>
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Recommended for identity verification</p>
                                        </div>
                                    </div>
                                    <InputField label="First Name" value={identity.firstName} onChange={v => setIdentity({ ...identity, firstName: v })} required isDark={isDark} placeholder="Enter Legal Name" />
                                    <InputField label="Last Name" value={identity.lastName} onChange={v => setIdentity({ ...identity, lastName: v })} required isDark={isDark} placeholder="Enter Surname" />
                                    <SelectField label="Biological Gender" value={identity.gender} onChange={v => setIdentity({ ...identity, gender: v })} options={['Male', 'Female', 'Other']} isDark={isDark} />
                                </div>
                                <div className="space-y-10">
                                    <InputField label="Date of Birth" value={identity.dob} onChange={v => setIdentity({ ...identity, dob: v })} type="date" isDark={isDark} />
                                    <InputField label="Primary Contact Number" value={identity.phone} onChange={v => setIdentity({ ...identity, phone: v })} required isDark={isDark} placeholder="+91 XXXX XXX XXX" />
                                    <InputField label="WhatsApp Number" value={identity.whatsappNumber} onChange={v => setIdentity({ ...identity, whatsappNumber: v })} isDark={isDark} placeholder="Same as phone?" />
                                    <InputField label="Email Address" value={identity.email} onChange={v => setIdentity({ ...identity, email: v })} isDark={isDark} placeholder="clinical.updates@mail.com" />
                                </div>
                            </div>
                        )}

                        {step === 1 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 animate-slide-up">
                                <InputField label="Chief Complaint" value={medical.chiefComplaint} onChange={v => setMedical({ ...medical, chiefComplaint: v })} placeholder="Primary dental concern..." isDark={isDark} required />
                                <InputField label="Drug Allergies" value={medical.allergies} onChange={v => setMedical({ ...medical, allergies: v })} placeholder="e.g. Penicillin, Latex" isDark={isDark} />
                                <div className="space-y-2">
                                    <label className={`text-base font-bold ml-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Systemic Medical History</label>
                                    <textarea
                                        value={medical.medicalHistory}
                                        onChange={e => setMedical({ ...medical, medicalHistory: e.target.value })}
                                        className={cn("w-full px-6 py-4 rounded-3xl text-base font-bold outline-none h-40 border shadow-sm resize-none", inputCls)}
                                        placeholder="Diabetes, Hypertension, Heart conditions..."
                                    />
                                </div>
                                <div className="space-y-10">
                                    <SelectField label="Smoking Lifestyle" value={medical.smokingStatus} onChange={v => setMedical({ ...medical, smokingStatus: v })} options={['Non-Smoker', 'Occasional', 'Regular']} isDark={isDark} />
                                    <InputField label="Last Interaction with Dentist" value={medical.lastDentalVisit} onChange={v => setMedical({ ...medical, lastDentalVisit: v })} type="date" isDark={isDark} />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 animate-slide-up">
                                <InputField label="Insurance Network" value={insurance.insuranceProvider} onChange={v => setInsurance({ ...insurance, insuranceProvider: v })} placeholder="Provider name" isDark={isDark} />
                                <InputField label="Policy ID" value={insurance.policyNumber} onChange={v => setInsurance({ ...insurance, policyNumber: v })} placeholder="POL-XXX-99" isDark={isDark} />
                                <InputField label="Emergency Contact Person" value={insurance.emergencyContactName} onChange={v => setInsurance({ ...insurance, emergencyContactName: v })} placeholder="Full Name" isDark={isDark} />
                                <InputField label="Emergency Phone" value={insurance.emergencyContactPhone} onChange={v => setInsurance({ ...insurance, emergencyContactPhone: v })} placeholder="+91 XXXX XXX XXX" isDark={isDark} />
                            </div>
                        )}

                        {step === 3 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 animate-slide-up">
                                <InputField label="Occupation" value={identity.occupation} onChange={v => setIdentity({ ...identity, occupation: v })} placeholder="e.g. Software Engineer" isDark={isDark} />
                                <InputField label="Govt ID Proof" value={identity.idProof} onChange={v => setIdentity({ ...identity, idProof: v })} placeholder="e.g. Aadhar / PAN" isDark={isDark} />
                                <div className="md:col-span-2 space-y-2">
                                    <label className={`text-base font-bold ml-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Full Physical Address</label>
                                    <textarea
                                        value={identity.address}
                                        onChange={e => setIdentity({ ...identity, address: e.target.value })}
                                        className={cn("w-full px-6 py-4 rounded-3xl text-base font-bold outline-none h-32 border shadow-sm resize-none", inputCls)}
                                        placeholder="Home / Work address..."
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-10 border-t border-slate-100 dark:border-white/5">
                            <button
                                onClick={() => step > 0 && setStep(step - 1)}
                                className={cn("px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all", step === 0 ? "opacity-30 cursor-not-allowed" : "bg-slate-100 dark:bg-white/5 border dark:border-white/10 text-slate-500 hover:bg-slate-200")}
                            >
                                <div className="flex items-center gap-3">
                                    <ChevronLeft size={20} /> Phase Prior
                                </div>
                            </button>

                            <button
                                onClick={() => step < STEPS.length - 1 ? (validateStep() && setStep(step + 1)) : handleRegisterPatient()}
                                disabled={isSaving}
                                className="group relative px-12 py-5 bg-primary hover:bg-primary-hover text-white rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/30 transition-all flex items-center gap-4 active:scale-95 disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <>Recording Record...</>
                                ) : (
                                    <>
                                        {step < STEPS.length - 1 ? 'Phase Forward' : 'Commit Node'}
                                        <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20 animate-scale-in">
                        <div className="w-24 h-24 rounded-[2.5rem] bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-10 border border-emerald-500/20">
                            <CheckCircle2 size={56} />
                        </div>
                        <h3 className="text-4xl font-black mb-4 tracking-tight">Node Synchronized</h3>
                        <p className="text-slate-500 font-bold mb-12 max-w-md mx-auto">Patient <span className="text-primary font-black">#{newlyRegisteredId}</span> has been established in the clinical database.</p>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-4xl mx-auto">
                            <ActionButton icon={FileText} label="Billing" onClick={() => handleAddAction('Billing')} color="text-amber-500" />
                            <ActionButton icon={FileSignature} label="Prescription" onClick={() => handleAddAction('Prescription')} color="text-blue-500" />
                            <ActionButton icon={Calendar} label="Appointment" onClick={() => handleAddAction('Appointment')} color="text-rose-500" />
                            <ActionButton icon={HeartPulse} label="Case Note" onClick={() => handleAddAction('Case Notes')} color="text-emerald-500" />
                            <ActionButton icon={ImageIcon} label="Scan/Files" onClick={() => handleAddAction('Files')} color="text-indigo-500" />
                        </div>

                        <button onClick={onClose} className="mt-16 px-12 py-5 border-2 rounded-[2rem] font-black text-xs uppercase tracking-widest text-slate-400 hover:border-primary hover:text-primary transition-all active:scale-95">
                            Return to Registry
                        </button>
                    </div>
                )}
            </div>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(19, 91, 236, 0.15); border-radius: 10px; }
            `}</style>
        </div>
    );

    if (isPage) {
        return (
            <div className={cn(
                "w-full h-full min-h-[80vh] bg-white dark:bg-slate-900 rounded-[3.5rem] border shadow-2xl overflow-hidden mb-12",
                isDark ? "border-white/10" : "border-slate-100"
            )}>
                {Content}
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={cn(
                    "relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[3.5rem] border shadow-2xl",
                    isDark ? "bg-slate-900 border-white/10" : "bg-white border-slate-200"
                )}
            >
                {Content}
            </motion.div>
        </div>
    );
}
