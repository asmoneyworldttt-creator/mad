import { useState, useEffect } from 'react';
import {
    TrendingUp, Users, Activity,
    ArrowUpRight, BarChart3,
    Globe, PieChart, Target, Star,
    UserPlus, ShieldCheck, Mail, Lock, Building,
    CalendarDays, LayoutPanelLeft, ChevronRight, X,
    Plus, Shield, CreditCard, Clock,    CheckCircle2, Terminal
} from 'lucide-react';
import { Modal } from '../Modal';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';
import {
    XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomSelect } from '../ui/CustomControls';

export function MasterPanel({ theme }: { theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 0, netProfit: 0, patientGrowth: 0,
        activeStaff: 0, avgTicket: 0, conversionRate: 0
    });
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [topDoctors, setTopDoctors] = useState<any[]>([]);
    const [activeView, setActiveView] = useState<'analytics' | 'clinics' | 'logs' | 'requests'>('analytics');
    const [admins, setAdmins] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<any>(null);
    const [isAdminDetailsOpen, setIsAdminDetailsOpen] = useState(false);
    
    const [newAdmin, setNewAdmin] = useState({ name: '', clinic: '', owner_name: '' });

    const fetchMasterData = async () => {
        setLoading(true);
        try {
            // Fetch Global Stats
            const { data: globalBills } = await supabase.from('bills').select('amount, date, doctor_name');
            const totalRev = globalBills?.reduce((acc, b) => acc + (Number(b.amount) || 0), 0) || 0;
            
            const { data: globalAccounts } = await supabase.from('accounts').select('amount').eq('type', 'expense');
            const totalExp = globalAccounts?.reduce((acc, a) => acc + (Number(a.amount) || 0), 0) || 0;
            
            const { count: staffCount } = await supabase.from('staff').select('*', { count: 'exact', head: true });

            // Fetch Clinic Nodes Registry
            const { data: clinicsData } = await supabase.from('clinics').select(`
                *,
                subscriptions (*),
                patients (count),
                staff (count),
                bills (amount)
            `);

            if (clinicsData) {
                const formattedAdmins = clinicsData.map(c => {
                    const sub = c.subscriptions?.[0];
                    const clinicRevenue = c.bills?.reduce((acc: number, b: any) => acc + (Number(b.amount) || 0), 0) || 0;
                    return {
                        id: c.id,
                        clinic: c.name,
                        name: c.owner_name || 'Clinic Owner',
                        package: sub?.package_type || 'Unsubscribed',
                        status: c.status,
                        validity: sub?.validity_end ? new Date(sub.validity_end).toLocaleDateString() : 'N/A',
                        patientsCount: c.patients?.[0]?.count || 0,
                        staffCount: c.staff?.[0]?.count || 0,
                        revenue: clinicRevenue,
                        branches: c.branches_count || 1
                    };
                });
                setAdmins(formattedAdmins);
            }

            // Fetch Requests
            const { data: requestsData } = await supabase
                .from('purchase_requests')
                .select(`*, clinics(name)`)
                .eq('status', 'pending');
            setRequests(requestsData || []);

            // Fetch Logs
            const { data: logsData } = await supabase.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(20);
            setLogs(logsData || []);

            setStats({
                totalRevenue: totalRev,
                netProfit: totalRev - totalExp,
                patientGrowth: 15, // Mocked for now
                activeStaff: staffCount || 0,
                avgTicket: globalBills?.length ? Math.round(totalRev / globalBills.length) : 0,
                conversionRate: 72, // Mocked for now
            });
            
        } catch (err) {
            console.error(err);
            showToast('Logic execution error: Registry out of sync.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleApproveRequest = async (request: any) => {
        try {
            const validityDays = request.package_type === 'Yearly' ? 365 : 28; // Requirement says 28-day monthly
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + validityDays);

            // 1. Update/Insert Subscription
            const { error: subError } = await supabase
                .from('subscriptions')
                .upsert({
                    clinic_id: request.clinic_id,
                    package_type: request.package_type,
                    validity_start: new Date().toISOString(),
                    validity_end: endDate.toISOString(),
                    status: 'active'
                });

            if (subError) throw subError;

            // 2. Mark Request as Approved
            const { error: reqError } = await supabase
                .from('purchase_requests')
                .update({ status: 'approved' })
                .eq('id', request.id);

            if (reqError) throw reqError;

            // 3. Log the action
            await supabase.from('admin_logs').insert({
                clinic_id: request.clinic_id,
                action: 'SUBSCRIBE',
                details: `Approved ${request.package_type} package for ${request.clinics?.name}`,
                performed_by: (await supabase.auth.getUser()).data.user?.id
            });

            showToast(`Node ${request.clinics?.name} upgraded to ${request.package_type}.`, 'success');
            fetchMasterData();
        } catch (err: any) {
            showToast(err.message, 'error');
        }
    };

    const handleAction = async (adminId: string, action: 'activate' | 'deactivate' | 'block' | 'unlock' | 'delete') => {
        const statusMap: Record<string, string> = {
            activate: 'active',
            deactivate: 'deactivated',
            block: 'blocked',
            unlock: 'active',
            delete: 'deleted'
        };

        try {
            const { error } = await supabase
                .from('clinics')
                .update({ status: statusMap[action] })
                .eq('id', adminId);

            if (error) throw error;

            // Log the action
            await supabase.from('admin_logs').insert({
                clinic_id: adminId,
                action: action.toUpperCase(),
                details: `Admin ${action}d via Master Panel`,
                performed_by: (await supabase.auth.getUser()).data.user?.id
            });

            showToast(`Protocol ${action} executed successfully.`, 'success');
            fetchMasterData();
        } catch (err: any) {
            showToast(err.message, 'error');
        }
    };

    const handleAddAdmin = async () => {
        if (!newAdmin.name || !newAdmin.clinic) {
            showToast('Incomplete parameters for node provisioning.', 'error');
            return;
        }
        
        try {
            // In a real scenario, we'd create a user first, but here we just provision the clinic entry
            const { data: clinic, error: clinicError } = await supabase
                .from('clinics')
                .insert([{ 
                    name: newAdmin.clinic, 
                    owner_name: newAdmin.owner_name,
                    status: 'active' 
                }])
                .select()
                .single();

            if (clinicError) throw clinicError;

            showToast(`Node ${newAdmin.clinic} provisioned at cluster entry.`, 'success');
            setIsAddModalOpen(false);
            fetchMasterData();
        } catch (err: any) {
            showToast(err.message, 'error');
        }
    };

    useEffect(() => { fetchMasterData(); }, []);

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Master Control Header */}
            <div className={`p-5 md:p-6 rounded-2xl border shadow-xl relative overflow-hidden group transition-all duration-700 ${isDark ? 'bg-slate-900/50 border-white/5' : 'bg-white border-slate-100'}`}>
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transition-transform group-hover:scale-110 duration-1000">
                    <ShieldCheck size={100} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-6 h-1 bg-primary rounded-full shadow-[0_0_8px_#135bec]" />
                            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Master Panel</p>
                        </div>
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight mb-1" style={{ color: isDark ? 'white' : 'var(--text-dark)' }}>Clinic Administration</h1>
                        <p className="text-xs font-medium text-slate-400">Network overview and system performance.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsAddModalOpen(true)} className="bg-primary hover:scale-105 active:scale-95 text-white text-[10px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg shadow-lg transition-all flex items-center gap-2">
                            <Plus size={16} /> Add Clinic
                        </button>
                    </div>
                </div>
            </div>

            {/* Matrix Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                {[
                    { label: 'Network Revenue', val: `₹${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: '#135bec' },
                    { label: 'Economic Margin', val: `₹${stats.netProfit.toLocaleString()}`, icon: Activity, color: '#10b981' },
                    { label: 'Patient Cluster', val: `${stats.patientGrowth}%`, icon: Users, color: '#8b5cf6' },
                    { label: 'Doctor Nodes', val: stats.activeStaff, icon: UserPlus, color: '#ec4899' },
                    { label: 'Mean Ticket', val: `₹${stats.avgTicket}`, icon: Target, color: '#f59e0b' },
                    { label: 'Logic Conv.', val: `${stats.conversionRate}%`, icon: PieChart, color: '#06b6d4' },
                ].map((s, idx) => (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        key={idx} 
                        className={`p-4 rounded-xl border shadow-md relative overflow-hidden group hover:-translate-y-1 transition-all cursor-default ${isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-100'}`}
                    >
                        <div className="absolute top-[-10%] right-[-10%] w-16 h-16 rounded-full opacity-[0.03] transition-transform group-hover:scale-110 duration-500" style={{ backgroundColor: s.color }} />
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${s.color}15`, color: s.color }}>
                            <s.icon size={18} />
                        </div>
                        <p className="text-[10px] font-bold text-slate-500/80 mb-0.5 uppercase tracking-wider">{s.label}</p>
                        <h4 className="text-lg font-bold tracking-tight" style={{ color: isDark ? 'white' : 'var(--text-dark)' }}>{s.val}</h4>
                    </motion.div>
                ))}
            </div>

            <div className={`p-5 md:p-6 rounded-2xl border shadow-xl relative overflow-hidden ${isDark ? 'bg-slate-900/50 border-white/5' : 'bg-white border-slate-100'}`}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-1.5 p-1 rounded-lg border bg-slate-100/50" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                        {['analytics', 'clinics', 'logs', 'requests'].map((v) => (
                            <button
                                key={v}
                                onClick={() => setActiveView(v as any)}
                                className={`px-4 md:px-5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${activeView === v ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {v === 'analytics' ? 'Analytics' : v === 'clinics' ? 'Clinics' : v === 'logs' ? 'History' : 'Requests'}
                                {v === 'requests' && requests.length > 0 && (
                                    <span className="ml-2 bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[8px]">{requests.length}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {activeView === 'requests' ? (
                    <div className="space-y-6">
                        {requests.length > 0 ? requests.map((req) => (
                            <div key={req.id} className={`p-5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all hover:border-primary/20 ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                        <CreditCard size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-bold tracking-tight" style={{ color: isDark ? 'white' : 'var(--text-dark)' }}>{req.clinics?.name}</h4>
                                        <p className="text-xs font-medium text-slate-500 mt-0.5">Requesting {req.package_type} activation</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right mr-2">
                                        <p className="text-[10px] font-semibold text-slate-400 mb-1">Received</p>
                                        <p className="text-xs font-bold" style={{ color: isDark ? 'white' : 'var(--text-dark)' }}>{new Date(req.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleApproveRequest(req)}
                                        className="px-6 py-3 rounded-lg bg-emerald-500 text-white text-xs font-semibold shadow-md"
                                    >
                                        Approve request
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="h-[300px] flex flex-col items-center justify-center opacity-30">
                                <Globe size={64} className="mb-6 animate-spin-slow" />
                                <p className="text-xs font-black uppercase tracking-[0.3em]">No pending requests</p>
                            </div>
                        )}
                    </div>
                ) : activeView === 'clinics' ? (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-xs font-semibold text-slate-500 border-b border-white/5">
                                    <th className="px-8 py-6">Clinic Name</th>
                                    <th className="px-8 py-6">Status</th>
                                    <th className="px-8 py-6">Plan</th>
                                    <th className="px-8 py-6">Stats</th>
                                    <th className="px-8 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {admins.map((a) => (
                                    <tr key={a.id} className="group hover:bg-white/[0.02] transition-all cursor-pointer" onClick={() => { setSelectedAdmin(a); setIsAdminDetailsOpen(true); }}>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                                    <Building size={18} className="text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm" style={{ color: isDark ? 'white' : 'var(--text-dark)' }}>{a.clinic}</p>
                                                    <p className="text-[10px] font-medium text-slate-500">{a.id.split('-')[0]}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${a.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                <span className="text-[10px] font-bold text-slate-400 capitalize">{a.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className="text-[10px] font-semibold px-3 py-1 rounded-lg border border-primary/10 bg-primary/5 text-primary">{a.package}</span>
                                            <p className="text-[10px] text-slate-500 font-medium mt-1">{a.validity}</p>
                                        </td>
                                        <td className="px-8 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="text-center">
                                                    <p className="text-sm font-bold" style={{ color: isDark ? 'white' : 'var(--text-dark)' }}>{a.patientsCount}</p>
                                                    <p className="text-xs text-slate-500 font-medium">Patients</p>
                                                </div>
                                                <div className="w-px h-6 bg-white/10" />
                                                <div className="text-center">
                                                    <p className="text-sm font-bold" style={{ color: isDark ? 'white' : 'var(--text-dark)' }}>{a.revenue.toLocaleString()}</p>
                                                    <p className="text-xs text-slate-500 font-medium">Revenue</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all" onClick={e => e.stopPropagation()}>
                                                {a.status === 'active' ? (
                                                    <button onClick={() => handleAction(a.id, 'deactivate')} className="p-2 rounded-lg bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white transition-all"><Lock size={14} /></button>
                                                ) : (
                                                    <button onClick={() => handleAction(a.id, 'activate')} className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"><Shield size={14} /></button>
                                                )}
                                                <button onClick={() => handleAction(a.id, 'block')} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"><X size={14} /></button>
                                                <button onClick={() => handleAction(a.id, 'delete')} className="p-2 rounded-lg bg-slate-500/10 text-slate-500 hover:bg-slate-500 hover:text-white transition-all"><Plus size={14} className="rotate-45" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : activeView === 'logs' ? (
                    <div className="space-y-4">
                        {logs.map((log, i) => (
                            <div key={i} className={`p-5 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl ${log.action === 'BLOCK' ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
                                        <Terminal size={16} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold" style={{ color: isDark ? 'white' : 'var(--text-dark)' }}>{log.action} action performed</p>
                                        <p className="text-xs text-slate-400 font-medium">{log.details}</p>
                                    </div>
                                </div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{new Date(log.created_at).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Existing Analytics View logic... */
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                         <div className="h-[400px]">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-8 ml-2">Economic Throughput</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#135bec" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#135bec" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.5rem', color: 'white', fontWeight: 900 }} />
                                    <Area type="monotone" dataKey="revenue" stroke="#135bec" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>

            {/* Admin Provisioning Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Clinic">
                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Clinic Domain</label>
                            <input value={newAdmin.clinic} onChange={e => setNewAdmin({...newAdmin, clinic: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-5 text-white font-bold" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Admin Email</label>
                            <input value={newAdmin.name} onChange={e => setNewAdmin({...newAdmin, name: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-5 text-white font-bold" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Owner Full Name</label>
                            <input value={newAdmin.owner_name} onChange={e => setNewAdmin({...newAdmin, owner_name: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-5 text-white font-bold" />
                        </div>
                    </div>
                    <button onClick={handleAddAdmin} className="w-full py-5 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs">Create Clinic Account</button>
                </div>
            </Modal>

            {/* Deep Data Details Modal */}
            <Modal isOpen={isAdminDetailsOpen} onClose={() => setIsAdminDetailsOpen(false)} title={`${selectedAdmin?.clinic} - Clinic Details`}>
                <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5">
                            <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Total Patients</p>
                            <p className="text-2xl font-black text-primary italic">{selectedAdmin?.patientsCount}</p>
                        </div>
                        <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5">
                            <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Total Staff</p>
                            <p className="text-2xl font-black text-primary italic">{selectedAdmin?.staffCount}</p>
                        </div>
                        <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5">
                            <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Total Revenue</p>
                            <p className="text-2xl font-black text-primary italic">₹{selectedAdmin?.revenue.toLocaleString()}</p>
                        </div>
                        <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5">
                            <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Branches</p>
                            <p className="text-2xl font-black text-primary italic">{selectedAdmin?.branches}</p>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

