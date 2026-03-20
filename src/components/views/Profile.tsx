import { MapPin, Phone, Mail, Award, Edit3, Image as ImageIcon, Check, X } from 'lucide-react';
import { useToast } from '../Toast';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase';
import { motion } from 'framer-motion';

type UserRole = 'master' | 'admin' | 'staff' | 'patient';

export function Profile({ userRole, theme }: { userRole: UserRole; theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const [profileData, setProfileData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);
    
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            if (userRole === 'staff') {
                 const { data } = await supabase.from('staff').select('*').eq('id', user.id).maybeSingle();
                 if (data) {
                    setProfileData(data);
                    setEditForm(data);
                 }
            } else {
                 const { data: clinic } = await supabase.from('clinics').select('name').eq('owner_id', user.id).maybeSingle();
                 const preset = { 
                     name: clinic?.name || "Clinic Admin", 
                     role: "Management", 
                     email: user.email,
                     mobile: user.user_metadata?.mobile || '',
                     profile_photo_url: user.user_metadata?.avatar_url || '',
                     cover_photo_url: user.user_metadata?.cover_url || ''
                 };
                 setProfileData(preset);
                 setEditForm(preset);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchProfile();
    }, [userRole]);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            
            showToast(`Uploading ${type}...`, 'info');
            const fileExt = file.name.split('.').pop();
            const filePath = `profiles/${user.id}-${type}-${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('clinical-assets')
                .upload(filePath, file, { upsert: true });
                
            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabase.storage
                .from('clinical-assets')
                .getPublicUrl(filePath);
                
            if (publicUrl) {
                if (userRole === 'staff') {
                    await supabase.from('staff').update({ [type === 'avatar' ? 'profile_photo_url' : 'cover_photo_url']: publicUrl }).eq('id', user.id);
                } else {
                    await supabase.auth.updateUser({ data: { [type === 'avatar' ? 'avatar_url' : 'cover_url']: publicUrl } });
                }
                showToast(`${type === 'avatar' ? 'Profile' : 'Cover'} photo updated!`, 'success');
                fetchProfile(); // Refresh
            }
        } catch (err: any) {
            showToast(err.message, 'error');
        }
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            
            if (userRole === 'staff') {
                await supabase.from('staff').update({
                    name: editForm.name,
                    mobile: editForm.mobile,
                    qualifications: editForm.qualifications,
                    degree: editForm.degree,
                    grad_year: editForm.grad_year,
                    license_number: editForm.license_number
                }).eq('id', user.id);
            } else {
                await supabase.auth.updateUser({ data: { mobile: editForm.mobile } });
                // If admin, update clinic name
                await supabase.from('clinics').update({ name: editForm.name }).eq('owner_id', user.id);
            }
            showToast('Profile updated!', 'success');
            setIsEditing(false);
            fetchProfile();
        } catch (err: any) {
            showToast(err.message, 'error');
        }
        setIsSaving(false);
    };

    if (loading) return <div className="p-12 text-center text-slate-400">Loading Profile...</div>;

    return (
        <div className="animate-slide-up space-y-8 relative overflow-hidden">
            {/* Ambient dynamic background orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                <motion.div 
                    animate={{ x: [0, 40, -40, 0], y: [0, 20, -20, 0] }}
                    transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
                    className="absolute top-1/4 -left-10 w-64 h-64 rounded-full bg-cyan-400/10 blur-3xl opacity-60"
                />
                <motion.div 
                    animate={{ x: [0, -30, 30, 0], y: [0, -40, 40, 0] }}
                    transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
                    className="absolute bottom-1/4 -right-10 w-72 h-72 rounded-full bg-violet-400/10 blur-3xl opacity-60"
                />
            </div>

            {/* Upload Inputs */}
            <input type="file" ref={avatarInputRef} hidden accept="image/*" onChange={e => handlePhotoUpload(e, 'avatar')} />
            <input type="file" ref={coverInputRef} hidden accept="image/*" onChange={e => handlePhotoUpload(e, 'cover')} />

            {/* Header Banner */}
            <div className="relative w-full h-48 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <img src={profileData?.cover_photo_url || "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1200"} alt="Cover" className="w-full h-full object-cover opacity-30 mix-blend-overlay" />
                <button onClick={() => coverInputRef.current?.click()} className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2">
                    <ImageIcon size={14} /> Update Cover
                </button>
            </div>

            {/* Profile Details section */}
            <div className="flex flex-col md:flex-row gap-6 px-4 md:px-6 -mt-16 relative z-10 w-full">
                <div className="flex flex-col items-center flex-shrink-0 w-full md:w-48">
                    <div className="w-32 h-32 rounded-full border-4 relative group cursor-pointer overflow-hidden shadow-premium" style={{ borderColor: 'var(--bg-page)', background: 'var(--card-bg)' }}>
                        <img src={profileData?.profile_photo_url || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300"} alt="Avatar" className="w-full h-full object-cover" />
                        <div onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Edit3 className="text-white" size={24} />
                        </div>
                    </div>

                    <div className="mt-6 w-full grid grid-cols-2 md:grid-cols-1 gap-2">
                        <div className="rounded-xl p-3 border backdrop-blur-md text-center" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                            <p className="font-bold text-lg" style={{ color: 'var(--text-dark)' }}>{profileData?.grad_year ? (new Date().getFullYear() - parseInt(profileData.grad_year)) + '+' : '12+'}</p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Years Exp.</p>
                        </div>
                        <div className="rounded-xl p-3 border backdrop-blur-md text-center" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                            <p className="font-bold text-lg text-primary">4.8/5</p>
                            <p className="text-[9px] text-primary/80 font-bold uppercase tracking-wider">Rating</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-w-0 rounded-2xl p-6 border backdrop-blur-md relative pt-12 md:pt-6" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                    <div className="absolute top-6 right-6 flex gap-1.5">
                        {isEditing ? (
                            <>
                                <button onClick={() => setIsEditing(false)} className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"><X size={16} /></button>
                                <button onClick={handleSaveProfile} disabled={isSaving} className="p-1.5 rounded-lg bg-primary text-white shadow-sm hover:opacity-90 transition-all"><Check size={16} /></button>
                            </>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all"><Edit3 size={16} /></button>
                        )}
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                        {isEditing ? (
                            <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="bg-slate-50 dark:bg-white/5 border dark:border-white/10 rounded-md px-2 py-1 text-xl font-bold w-3/4 outline-none" style={{ color: 'var(--text-dark)' }} />
                        ) : (
                            <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-dark)' }}>{profileData?.name || 'Clinic Profile'}</h2>
                        )}
                        <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1"><div className="w-1 h-1 bg-emerald-500 rounded-full" /> Verified</span>
                    </div>

                    <p className="text-base font-bold text-primary mb-4">{profileData?.role || 'Management'}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 mb-6 border-b dark:border-white/5 pb-6">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold text-xs">
                            <Phone size={14} className="text-slate-400" />
                            {isEditing ? (
                                <input value={editForm.mobile} onChange={e => setEditForm({...editForm, mobile: e.target.value})} className="bg-transparent border-b border-slate-300 outline-none w-full" />
                            ) : (
                                profileData?.mobile || '+91 -'
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold text-xs">
                            <Mail size={14} className="text-slate-400" /> {profileData?.email}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-bold text-sm mb-3 flex items-center gap-1.5" style={{ color: 'var(--text-dark)' }}><Award size={16} className="text-primary" /> Qualifications</h3>
                            <div className="space-y-2 pl-4 border-l-2 border-primary/20 ml-2">
                                {isEditing ? (
                                    <>
                                        <input value={editForm.qualifications} onChange={e => setEditForm({...editForm, qualifications: e.target.value})} placeholder="Degrees" className="w-full bg-slate-50 dark:bg-white/5 border dark:border-white/10 rounded-md px-2 py-1 text-xs outline-none mb-1" />
                                        <input value={editForm.degree} onChange={e => setEditForm({...editForm, degree: e.target.value})} placeholder="Specialty" className="w-full bg-slate-50 dark:bg-white/5 border dark:border-white/10 rounded-md px-2 py-1 text-xs outline-none mb-1" />
                                        <input value={editForm.grad_year} onChange={e => setEditForm({...editForm, grad_year: e.target.value})} placeholder="Start Year" className="w-full bg-slate-50 dark:bg-white/5 border dark:border-white/10 rounded-md px-2 py-1 text-xs outline-none" />
                                    </>
                                ) : (
                                    <div>
                                        <p className="font-bold text-xs" style={{ color: 'var(--text-dark)' }}>{profileData?.qualifications || 'Full Profile Configuration'}</p>
                                        <p className="text-[10px] text-slate-500 font-medium">{profileData?.degree || '-'} • Appointed {profileData?.grad_year || '-'}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--text-dark)' }}>Registration & Legal</h3>
                            <div className="p-3 rounded-xl border" style={{ background: 'var(--card-bg-alt)', borderColor: 'var(--border-color)' }}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-bold text-slate-500">Reg. Number</span>
                                    {isEditing ? (
                                        <input value={editForm.license_number} onChange={e => setEditForm({...editForm, license_number: e.target.value})} className="bg-transparent border-b text-right border-slate-300 outline-none text-xs font-bold" />
                                    ) : (
                                        <span className="font-bold text-xs" style={{ color: 'var(--text-dark)' }}>{profileData?.license_number || '-'}</span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-500">State Council</span>
                                    <span className="font-bold text-xs" style={{ color: 'var(--text-dark)' }}>Dental Council</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


