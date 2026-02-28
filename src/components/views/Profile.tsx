import { MapPin, Phone, Mail, Award, Edit3, Image as ImageIcon } from 'lucide-react';
import { useToast } from '../Toast';

export function Profile() {
    const { showToast } = useToast();

    return (
        <div className="animate-slide-up space-y-8">
            {/* Header Banner */}
            <div className="relative w-full h-48 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <img src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1200" alt="Clinic Office" className="w-full h-full object-cover opacity-30 mix-blend-overlay" />
                <button onClick={() => showToast('Cover photo edit opened')} className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2">
                    <ImageIcon size={14} /> Update Cover
                </button>
            </div>

            {/* Profile Details section */}
            <div className="flex flex-col md:flex-row gap-8 px-6 -mt-16 relative z-10 w-full">
                <div className="flex flex-col items-center flex-shrink-0 w-48">
                    <div className="w-32 h-32 rounded-full border-4 border-background bg-white overflow-hidden shadow-premium relative group">
                        <img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300" alt="Doctor" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                            <Edit3 className="text-white" size={24} onClick={() => showToast('Avatar upload opened')} />
                        </div>
                    </div>

                    <div className="mt-6 w-full space-y-4">
                        <div className="bg-surface rounded-xl p-4 border border-slate-200 shadow-sm text-center">
                            <p className="font-display font-bold text-lg text-text-dark">12+</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Years Exp.</p>
                        </div>
                        <div className="bg-primary/5 rounded-xl p-4 border border-primary/20 shadow-sm text-center">
                            <p className="font-display font-bold text-lg text-primary">4.8/5</p>
                            <p className="text-[10px] text-primary/80 font-bold uppercase tracking-wider">Patient Rating</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-w-0 bg-surface rounded-2xl p-6 border border-slate-200 shadow-sm relative pt-12 md:pt-6">
                    <button onClick={() => showToast('Edit Profile Mode')} className="absolute top-6 right-6 p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all outline-none">
                        <Edit3 size={18} />
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-3xl font-display font-bold text-text-dark tracking-tight">Dr. Sarah Jenkins</h2>
                        <div className="bg-success/10 text-success border border-success/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-success rounded-full" /> Verified
                        </div>
                    </div>

                    <p className="text-lg font-medium text-primary mb-6">Chief Cardiologist & Interventional Specialist</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 mb-8 border-b border-slate-100 pb-8">
                        <div className="flex items-center gap-3 text-slate-600 font-medium">
                            <Phone size={18} className="text-slate-400" /> +91 98765 43210
                        </div>
                        <div className="flex items-center gap-3 text-slate-600 font-medium">
                            <Mail size={18} className="text-slate-400" /> dr.sarah@cityclinic.com
                        </div>
                        <div className="flex items-start gap-3 text-slate-600 font-medium sm:col-span-2">
                            <MapPin size={18} className="text-slate-400 mt-1 flex-shrink-0" />
                            <span>45, Health Avenue Sector 14, Bangalore, 560014 <br /><span className="text-xs text-primary font-bold cursor-pointer hover:underline">View on Map</span></span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-display font-bold text-text-dark text-lg mb-4 flex items-center gap-2">
                                <Award size={20} className="text-primary" /> Qualifications
                            </h3>
                            <ul className="space-y-4 pl-8 border-l-2 border-slate-100 ml-3">
                                <li className="relative">
                                    <div className="w-3 h-3 bg-white border-2 border-primary rounded-full absolute -left-10 top-1.5" />
                                    <p className="font-bold text-slate-700">MD in Cardiology</p>
                                    <p className="text-sm text-slate-500 font-medium">AIIMS, New Delhi • 2012</p>
                                </li>
                                <li className="relative">
                                    <div className="w-3 h-3 bg-white border-2 border-slate-300 rounded-full absolute -left-10 top-1.5" />
                                    <p className="font-bold text-slate-700">MBBS</p>
                                    <p className="text-sm text-slate-500 font-medium">KMC, Manipal • 2008</p>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-display font-bold text-text-dark text-lg mb-4">Registration & Legal</h3>
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-200/60">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reg. Number</span>
                                    <span className="font-mono text-text-dark font-bold">MCI-847291</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">State Council</span>
                                    <span className="font-medium text-text-dark text-sm">Karnataka Medical Council</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
