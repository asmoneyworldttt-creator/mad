import { useState, useEffect } from 'react';
import {
    Truck, Plus, Search, Phone, Mail,
    Globe, MapPin, Package, Clock,
    AlertCircle, CheckCircle2, MoreVertical,
    ExternalLink, CreditCard
} from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';
import { motion } from 'framer-motion';

export function SupplierManagement({ theme }: { theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSuppliers();
    }, []);

    async function fetchSuppliers() {
        setLoading(true);
        try {
            // Check for inventory_suppliers or similar, fallback to mock
            const { data } = await supabase.from('suppliers').select('*');
            if (data) setSuppliers(data);
            else {
                setSuppliers([
                    { id: 1, name: 'DentalCorp Solutions', contact: 'John Smith', phone: '+91 98765 43210', category: 'Consumables', status: 'Preferred' },
                    { id: 2, name: 'MediEquip India', contact: 'Priya Verma', phone: '+91 88888 77777', category: 'Heavy Equipment', status: 'Active' },
                    { id: 3, name: 'OrthoTech Dental', contact: 'Rahul Das', phone: '+91 76543 21098', category: 'Orthodontics', status: 'Under Review' },
                    { id: 4, name: 'Apex Lab Supplies', contact: 'Anita Rao', phone: '+91 99999 00000', category: 'Labs', status: 'Preferred' },
                ]);
            }
        } catch (e) {
            showToast('Failed to retrieve supply nodes', 'error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="animate-slide-up space-y-8 pb-20">
            {/* Header */}
            <div className={`p-8 rounded-[2.5rem] border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div>
                    <h2 className="text-3xl font-sans font-bold tracking-tight flex items-center gap-3">
                        <Truck className="text-primary" />
                        Supply Chain Nexus
                    </h2>
                    <p className={`text-sm font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Managing global procurement and vendor relations for seamless inventory flow
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="bg-primary text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-2">
                        <Plus size={18} /> Add New Supplier
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Active Vendors', value: '18', icon: Truck, color: 'text-primary' },
                    { label: 'Pending Deliveries', value: '4', icon: Package, color: 'text-amber-500' },
                    { label: 'Monthly Spend', value: '₹1.2L', icon: CreditCard, color: 'text-emerald-500' }
                ].map((s, i) => (
                    <div key={i} className={`p-6 rounded-[2rem] border relative overflow-hidden group ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                        <div className={`absolute -right-4 -top-4 p-8 opacity-5 group-hover:scale-125 transition-transform ${s.color}`}><s.icon size={60} /></div>
                        <p className={`text-[9px] font-extrabold uppercase tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{s.label}</p>
                        <h4 className="text-2xl font-bold">{s.value}</h4>
                    </div>
                ))}
            </div>

            {/* Supplier List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {suppliers.map((s, i) => (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className={`p-6 rounded-[2.5rem] border group transition-all hover:bg-white/[0.02] ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-primary border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                                    <Globe size={24} />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold">{s.name}</h4>
                                    <span className="text-[10px] font-extrabold text-primary uppercase tracking-[0.2em]">{s.category}</span>
                                </div>
                            </div>
                            <span className={`text-[9px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest border ${s.status === 'Preferred' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' :
                                    s.status === 'Active' ? 'text-primary bg-primary/10 border-primary/20' :
                                        'text-amber-500 bg-amber-500/10 border-amber-500/20'
                                }`}>
                                {s.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                                <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1"><Phone size={10} /> Primary Link</p>
                                <p className="text-xs font-bold">{s.phone}</p>
                            </div>
                            <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                                <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1"><User size={10} className="w-2.5 h-2.5" /> POC</p>
                                <p className="text-xs font-bold">{s.contact}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="flex gap-2">
                                <button className={`p-3 rounded-xl border transition-all ${isDark ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-primary'}`}>
                                    <Mail size={16} />
                                </button>
                                <button className={`p-3 rounded-xl border transition-all ${isDark ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-primary'}`}>
                                    <MapPin size={16} />
                                </button>
                            </div>
                            <button className="flex items-center gap-2 text-primary font-bold text-xs hover:underline">
                                View Order History <ExternalLink size={14} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

const User = ({ size, className }: { size: number, className: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);
