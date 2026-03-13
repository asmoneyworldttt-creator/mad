import { useState, useEffect } from 'react';
import {
    Search, Bell, ChevronRight, Star, Clock,
    Calendar, MessageSquare, Play, Video,
    Plus, Sparkles, Activity
} from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';
import { motion } from 'framer-motion';

export function PatientPortal({ theme }: { theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const [patientData, setPatientData] = useState<any>(null);
    const [activeService, setActiveService] = useState('All');

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
            const patientId = user.user_metadata?.patient_id || '666870-1';
            const { data: patient } = await supabase
                .from('patients')
                .select('*')
                .eq('id', patientId)
                .single();
            if (patient) setPatientData(patient);
        } catch (error) {
            console.error(error);
        }
    };

    const GlassIcon = ({ icon: Icon, color }: { icon: any, color: string }) => (
        <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden",
            "bg-white/40 backdrop-blur-md border border-white/50 shadow-sm"
        )}>
            <div className={cn("absolute inset-0 opacity-20 bg-current", color)} />
            <Icon className={cn("relative z-10", color)} size={24} />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-white/40 blur-md rounded-full" />
        </div>
    );

    const services = [
        { id: 'Surgery', label: 'Surgery', icon: Sparkles, color: 'text-rose-500', img: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=300' },
        { id: 'Cleaning', label: 'Cleaning', icon: Play, color: 'text-emerald-500', img: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&q=80&w=300' },
        { id: 'Braces', label: 'Braces', icon: Star, color: 'text-blue-500', img: 'https://images.unsplash.com/photo-1594911772125-07fc7a2d8d9f?auto=format&fit=crop&q=80&w=300' },
        { id: 'Checkup', label: 'Checkup', icon: Calendar, color: 'text-amber-500', img: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=300' },
    ];

    return (
        <div className="animate-slide-up space-y-10 pb-32">
            {/* Consumer Header */}
            <header className="flex items-center justify-between px-2 pt-2">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[2rem] border-4 border-white shadow-xl overflow-hidden relative group">
                        <img
                            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150"
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            alt="Profile"
                        />
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-primary mb-1">Clinic Ready</p>
                        <h2 className="text-2xl font-black tracking-tight text-slate-800">
                            Hi, {patientData?.name?.split(' ')[0] || 'Martin'}!
                        </h2>
                    </div>
                </div>
                <button className="w-14 h-14 rounded-3xl glass-premium flex items-center justify-center text-slate-500 relative">
                    <Bell size={24} />
                    <span className="absolute top-4 right-4 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                </button>
            </header>

            {/* Hero Bento: Next Appointment */}
            <div className="bento-card p-10 bg-primary text-white border-none shadow-2xl shadow-primary/30 relative overflow-hidden group">
                <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
                <div className="relative z-10 flex justify-between items-start">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 px-4 py-1.5 bg-white/20 rounded-full w-fit">
                            <Clock size={16} />
                            <span className="text-xs font-semibold">In 24 Hours</span>
                        </div>
                        <div>
                            <h3 className="text-3xl font-black leading-none mb-2">Morning Cleaning</h3>
                            <p className="opacity-80 font-bold text-sm">Tomorrow • 09:30 AM • Room 12</p>
                        </div>
                        <button className="px-8 py-4 bg-white text-primary rounded-2xl font-bold text-sm shadow-xl shadow-slate-900/10 hover:scale-105 active:scale-95 transition-all">
                            Prepare Case
                        </button>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-24 h-24 rounded-[2.5rem] bg-white/20 flex items-center justify-center relative">
                            <Activity size={48} className="animate-pulse" />
                            <div className="absolute inset-0 bg-white/10 blur-xl rounded-full animate-ping" />
                        </div>
                        <span className="text-xs font-semibold opacity-70">Health Sync</span>
                    </div>
                </div>
            </div>

            {/* Service Selection Bento Grid */}
            <div className="space-y-6">
                <div className="flex justify-between items-end px-2">
                    <h3 className="text-2xl font-black tracking-tight text-slate-800 leading-none">
                        Clinical<br /><span className="text-primary">Services</span>
                    </h3>
                    <button className="text-xs font-semibold text-slate-400 hover:text-primary transition-colors">See All</button>
                </div>

                <div className="bento-grid">
                    {services.map((service, idx) => (
                        <div key={idx} className="bento-card p-6 flex flex-col justify-between group cursor-pointer overflow-hidden border-white/60">
                            <div className="flex justify-between items-start relative z-10">
                                <GlassIcon icon={service.icon} color={service.color} />
                                <ChevronRight className="text-slate-300 group-hover:text-primary transition-colors" />
                            </div>
                            <div className="mt-8 relative z-10">
                                <h4 className="font-extrabold text-lg text-slate-800">{service.label}</h4>
                                <p className={cn("text-xs font-semibold mt-1", service.color)}>Primary Care</p>
                            </div>
                            <img
                                src={service.img}
                                className="absolute -bottom-10 -right-10 w-32 h-32 object-cover opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-700 rounded-full"
                                alt=""
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Specialists - Premium List */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold px-2 flex items-center gap-3">
                    <Sparkles className="text-primary" size={20} />
                    Top Practitioners
                </h3>
                <div className="space-y-4">
                    {[1, 2].map((_, i) => (
                        <div key={i} className="bento-card p-6 flex items-center justify-between border-white/60">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-3xl overflow-hidden shadow-lg border-2 border-white">
                                    <img
                                        src={`https://images.unsplash.com/photo-${i === 0 ? '1559839734-2b71f15890c2' : '1612349317150-e413f6a5b16d'}?auto=format&fit=crop&q=80&w=150`}
                                        className="w-full h-full object-cover"
                                        alt="Specialist"
                                    />
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-slate-800">Dr. {i === 0 ? 'Jenny Wilson' : 'Michael Scott'}</h4>
                                    <p className="text-xs text-slate-400 font-medium">Dental Specialist • AI Certified</p>
                                    <div className="flex items-center gap-1.5 mt-2">
                                        <div className="flex text-amber-500"><Star size={10} fill="currentColor" /></div>
                                        <span className="text-[10px] font-black text-slate-600">4.9 (3.8k Active Sessions)</span>
                                    </div>
                                </div>
                            </div>
                            <button className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-110 transition-transform">
                                <Calendar size={20} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
