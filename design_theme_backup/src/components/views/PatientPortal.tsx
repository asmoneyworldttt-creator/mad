import { useState, useEffect } from 'react';
import {
    Calendar, FileText, Heart, WalletCards,
    Gift, History, ArrowRight, Download,
    ChevronRight, Star, Clock, Activity, ShieldCheck, Video
} from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';
import { motion } from 'framer-motion';

export function PatientPortal({ theme }: { theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [patientData, setPatientData] = useState<any>(null);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [finances, setFinances] = useState({ revenue: 0, pending: 0 });
    const [loyalty, setLoyalty] = useState({ points: 850, tier: 'Silver' });

    useEffect(() => {
        const syncSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                fetchPatientContext(session.user);
            }
        };
        syncSession();
    }, []);

    const fetchPatientContext = async (user: any) => {
        try {
            const patientId = user.user_metadata?.patient_id || '666870-1'; // Check metadata first
            const { data: patient } = await supabase
                .from('patients')
                .select('*')
                .eq('id', patientId)
                .single();

            if (patient) {
                setPatientData(patient);
                setLoyalty({ points: patient.loyalty_points || 850, tier: 'Silver' });
            }

            const { data: apts } = await supabase
                .from('appointments')
                .select('*')
                .eq('patient_id', patientId)
                .order('date', { ascending: false });

            if (apts) setAppointments(apts);

        } catch (error) {
            showToast('Logic Error: Failed to retrieve secure patient vault', 'error');
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles: Record<string, string> = {
            'Completed': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            'Scheduled': 'bg-primary/10 text-primary border-primary/20',
            'Cancelled': 'bg-rose-500/10 text-rose-500 border-rose-500/20'
        };
        return (
            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-extrabold uppercase tracking-widest border ${styles[status] || styles['Scheduled']}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="animate-slide-up space-y-8 pb-32">
            {/* Header / Profile Summary */}
            <div className={`p-10 rounded-[3rem] border flex flex-col md:flex-row items-center justify-between gap-8 ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-[2.5rem] overflow-hidden border-2 border-primary/20 p-1">
                            <img
                                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200"
                                className="w-full h-full object-cover rounded-[2rem]"
                                alt="Patient"
                            />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-2xl border-4 border-slate-900 flex items-center justify-center text-white shadow-lg">
                            <ShieldCheck size={20} />
                        </div>
                    </div>
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl font-bold tracking-tight">{patientData?.name || 'Jane Doe'}</h2>
                        <div className="flex items-center gap-3 mt-2 justify-center md:justify-start">
                            <span className="text-xs font-bold text-slate-500">ID: #{patientData?.id || '666870-1'}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-700" />
                            <span className="text-xs font-extrabold text-primary uppercase tracking-widest">Premium Member</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                    <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'} flex flex-col items-center`}>
                        <Gift className="text-amber-500 mb-2" size={24} />
                        <p className="text-2xl font-bold">{loyalty.points}</p>
                        <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">{loyalty.tier} Points</p>
                    </div>
                    <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'} flex flex-col items-center`}>
                        <Heart className="text-rose-500 mb-2" size={24} />
                        <p className="text-2xl font-bold">Health</p>
                        <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Optimized</p>
                    </div>
                </div>
            </div>

            {/* Upcoming Tele-Consult Alert if any */}
            {(appointments.some(a => a.type?.toLowerCase().includes('consult') || a.type?.toLowerCase().includes('tele'))) && (
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-8 rounded-[3rem] bg-emerald-500 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-emerald-500/20 border-4 border-white/20"
                >
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[2rem] bg-white/20 flex items-center justify-center animate-pulse">
                            <Video size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold italic">Tele-Consultation Node Ready</h3>
                            <p className="text-sm opacity-80 font-medium">Dr. Jenkins is waiting in the secure virtual lobby.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => (window as any).setActiveTab('teledentistry')}
                        className="px-10 py-5 bg-white text-emerald-600 rounded-[2rem] font-bold shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                    >
                        Enter Virtual Clinic <ArrowRight size={20} />
                    </button>
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Health Timeline */}
                <div className={`lg:col-span-2 p-10 rounded-[3rem] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <h4 className="text-xl font-bold mb-10 flex items-center gap-3">
                        <Activity className="text-primary" />
                        Clinical Journey
                    </h4>
                    <div className="space-y-6 relative before:absolute before:left-8 before:top-4 before:bottom-0 before:w-px before:bg-white/5">
                        {appointments.length > 0 ? appointments.slice(0, 4).map((apt, i) => (
                            <div key={i} className={`ml-16 p-6 rounded-[2rem] border transition-all hover:bg-white/5 relative ${isDark ? 'bg-white/3 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                                <div className="absolute -left-[3.25rem] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary border-4 border-slate-900 shadow-neon" />
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-[9px] font-extrabold text-primary uppercase tracking-widest mb-1">{apt.date}</p>
                                        <h5 className="font-bold text-lg">{apt.type}</h5>
                                        <p className="text-xs text-slate-500 font-medium">Performed by Dr. Jenkins</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <StatusBadge status={apt.status} />
                                        {(apt.status === 'Completed' || apt.status === 'Visited') && (
                                            <button className="p-3 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-all">
                                                <Download size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="py-20 text-center text-slate-500 italic">No health artifacts committed to the timeline.</div>
                        )}
                    </div>
                </div>

                {/* Right Widgets: Quick Actions & Stats */}
                <div className="space-y-8">
                    {/* Financial Summary */}
                    <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                        <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <WalletCards className="text-primary" size={20} /> Financial Status
                        </h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 rounded-2xl bg-white/5 border border-white/5">
                                <span className="text-xs font-bold text-slate-400">Next Installment</span>
                                <span className="font-bold">₹0.00</span>
                            </div>
                            <div className="flex justify-between items-center p-4 rounded-2xl bg-white/5 border border-white/5">
                                <span className="text-xs font-bold text-slate-400">Available Credits</span>
                                <span className="font-bold text-emerald-500">₹2,400.00</span>
                            </div>
                        </div>
                        <button className="w-full mt-6 py-4 rounded-2xl bg-primary text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-primary-hover transition-all">
                            View All Invoices <ArrowRight size={14} />
                        </button>
                    </div>

                    {/* Quick Resources */}
                    <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                        <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <FileText className="text-primary" size={20} /> Essential Nodes
                        </h4>
                        <div className="space-y-2">
                            {['Active Treatment Plan', 'Post-Op Instructions', 'Membership Benefits'].map((item, i) => (
                                <button key={i} className="w-full p-4 rounded-xl hover:bg-white/5 flex items-center justify-between group transition-all">
                                    <span className="text-xs font-bold text-slate-300 group-hover:text-primary transition-colors">{item}</span>
                                    <ChevronRight size={14} className="text-slate-600 group-hover:text-primary transition-all" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Booking Prompt */}
                    <div className={`p-8 rounded-[2.5rem] bg-gradient-to-br from-primary to-blue-600 text-white relative overflow-hidden group`}>
                        <div className="absolute -right-4 -bottom-4 p-8 opacity-20 transform group-hover:scale-125 transition-all"><Calendar size={100} /></div>
                        <h4 className="text-xl font-bold mb-2">Ready for a checkup?</h4>
                        <p className="text-xs opacity-80 mb-6 leading-relaxed">Early detection ensures preservation. Book your next maintenance node in 3 seconds.</p>
                        <button className="px-6 py-3 bg-white text-primary rounded-xl font-bold text-xs shadow-lg active:scale-95 transition-all">
                            Book Appointment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
