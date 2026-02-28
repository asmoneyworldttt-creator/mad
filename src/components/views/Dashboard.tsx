import { motion } from 'framer-motion';
import { ArrowUpRight, ChevronRight, Clock, Activity, FileText } from 'lucide-react';
import { useState } from 'react';
import { Modal } from '../../components/Modal';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'Mon', revenue: 4000 },
    { name: 'Tue', revenue: 3000 },
    { name: 'Wed', revenue: 2000 },
    { name: 'Thu', revenue: 2780 },
    { name: 'Fri', revenue: 1890 },
    { name: 'Sat', revenue: 2390 },
    { name: 'Sun', revenue: 3490 },
];

function StatCard({ title, value, change, trend, delay }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            className="bg-surface border border-slate-200 p-6 rounded-2xl relative overflow-hidden group shadow-sm hover:shadow-premium transition-shadow"
        >
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
            <p className="text-sm text-text-muted mb-2 font-medium">{title}</p>
            <div className="flex items-end gap-3">
                <h3 className="text-3xl font-display font-bold text-text-dark">{value}</h3>
                <span className={`text-xs font-bold mb-1 flex items-center gap-1 ${trend === 'up' ? 'text-success bg-success/10' : 'text-alert bg-alert/10'} px-2 py-0.5 rounded-full`}>
                    {trend === 'up' ? <ArrowUpRight size={14} /> : null}
                    {change}
                </span>
            </div>
        </motion.div>
    );
}

function LiveQueue() {
    const queue = [
        { name: 'Michael Chen', time: '10:15 AM', status: 'Engaged', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100', condition: 'Routine Checkup' },
        { name: 'Emma Watson', time: '10:45 AM', status: 'Checked-In', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100', condition: 'Follow-up' },
        { name: 'David Smith', time: '11:00 AM', status: 'Confirmed', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100', condition: 'ECG Review' }
    ];

    return (
        <div className="bg-surface border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-bold text-lg text-text-dark">Live Waiting Room</h3>
                <button className="text-primary text-sm font-bold hover:text-primary-hover flex items-center gap-1 bg-primary/5 px-3 py-1 rounded-full">
                    Manage Queue <ChevronRight size={16} />
                </button>
            </div>

            <div className="space-y-3">
                {queue.map((p, i) => (
                    <div key={i} className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${p.status === 'Engaged' ? 'border-primary/30 bg-primary/5 shadow-sm' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}`}>
                        <div className="flex items-center gap-4">
                            <img src={p.avatar} className="w-10 h-10 rounded-full object-cover shadow-sm bg-white" alt={p.name} />
                            <div>
                                <p className="text-sm font-bold text-text-dark mb-0.5">{p.name}</p>
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                    <span className="flex items-center gap-1 text-slate-400"><Clock size={12} /> {p.time}</span>
                                    <span>•</span>
                                    <span>{p.condition}</span>
                                </div>
                            </div>
                        </div>

                        <div className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest ${p.status === 'Engaged' ? 'bg-primary text-white shadow-premium shadow-primary/30 animate-pulse' :
                            p.status === 'Checked-In' ? 'bg-alert/10 text-alert border border-alert/20' :
                                'bg-white text-slate-400 border border-slate-200'
                            }`}>
                            {p.status}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function RevenueChart() {
    return (
        <div className="bg-surface border border-slate-200 rounded-2xl p-6 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-display font-bold text-lg text-text-dark">Revenue Analytics</h3>
                    <p className="text-xs text-text-muted mt-1">Collections over the last 7 days</p>
                </div>
                <select className="bg-slate-50 border border-slate-200 text-sm font-medium text-slate-600 rounded-lg px-3 py-1.5 outline-none">
                    <option>This Week</option>
                    <option>This Month</option>
                </select>
            </div>
            <div className="flex-1 min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dx={-10} tickFormatter={(val) => `$${val}`} />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            cursor={{ stroke: '#CBD5E1', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

import { useToast } from '../../components/Toast';

export function Dashboard() {
    const { showToast } = useToast();
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
    const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
    const [isPrescModalOpen, setIsPrescModalOpen] = useState(false);

    return (
        <>
            <div className="animate-slide-up space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-display font-bold text-text-dark tracking-tight mb-2">Good morning, Dr. Jenkins</h2>
                        <p className="text-text-muted font-medium">Here is what's happening at City Cardiovascular Clinic today.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setIsReportModalOpen(true)} className="px-5 py-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-sm font-bold text-text-dark shadow-sm transition-all flex items-center gap-2">
                            <FileText size={16} className="text-slate-400" />
                            Generate Report
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Today's Appointments" value="24" change="4 Added" trend="up" delay={0.1} />
                    <StatCard title="Total Revenue" value="₹42,500" change="+12%" trend="up" delay={0.2} />
                    <StatCard title="Pending Lab Reports" value="7" change="3 Urgent" trend="down" delay={0.3} />
                    <StatCard title="New Patients" value="5" change="Consistent" trend="up" delay={0.4} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <LiveQueue />
                        <RevenueChart />
                    </div>
                    <div className="space-y-6">
                        <div className="bg-primary-light border border-primary/20 rounded-2xl p-6 relative overflow-hidden shadow-sm">
                            <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary mb-4 shadow-sm">
                                <Activity size={20} />
                            </div>
                            <h3 className="font-display font-bold text-lg text-primary-hover mb-2">Smart Recall Engine</h3>
                            <p className="text-sm font-medium text-primary/80 mb-6">You have 12 patients due for their 6-month checkup this week.</p>
                            <button onClick={() => setIsWhatsAppModalOpen(true)} className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl shadow-premium transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                                Send WhatsApp Reminders
                            </button>
                        </div>

                        <div className="bg-surface border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="font-display font-bold text-lg text-text-dark mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setIsSlotModalOpen(true)} className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex flex-col items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><Clock size={16} /></div>
                                    <span className="text-xs font-bold text-slate-600">Block Slot</span>
                                </button>
                                <button onClick={() => setIsPrescModalOpen(true)} className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex flex-col items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><FileText size={16} /></div>
                                    <span className="text-xs font-bold text-slate-600">Write Presc.</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Generate Detailed Report">
                <div className="space-y-4">
                    <p className="text-sm text-text-muted">Select report parameters to generate a comprehensive PDF summary.</p>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600">
                        <option>Financial Summary (This Month)</option>
                        <option>Patient Demographic Report</option>
                        <option>Appointment Attendance & No-shows</option>
                    </select>
                    <button onClick={() => {
                        const blob = new Blob(['Mock PDF Content'], { type: 'application/pdf' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'MedPro_Report.pdf';
                        a.click();
                        URL.revokeObjectURL(url);
                        showToast('PDF Report downloaded successfully!', 'success');
                        setIsReportModalOpen(false);
                    }} className="w-full py-2 bg-primary text-white rounded-lg text-sm font-bold mt-4">Generate & Download PDF</button>
                </div>
            </Modal>

            <Modal isOpen={isWhatsAppModalOpen} onClose={() => setIsWhatsAppModalOpen(false)} title="WhatsApp Automation Engine">
                <div className="space-y-4">
                    <p className="text-sm text-text-muted">Configure your automated recall messages.</p>
                    <textarea className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-600" defaultValue="Hello {Name}, this is a reminder from City Cardiovascular Clinic for your 6-month checkup. Please reply to this message to confirm." />
                    <button onClick={() => {
                        showToast('Messages queued for 12 patients!', 'success');
                        setIsWhatsAppModalOpen(false);
                    }} className="w-full py-2 bg-success text-white rounded-lg text-sm font-bold mt-4 flex items-center justify-center gap-2">Dispatch Campaign</button>
                </div>
            </Modal>

            <Modal isOpen={isSlotModalOpen} onClose={() => setIsSlotModalOpen(false)} title="Block Slot / New Booking">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Date</label>
                            <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Time</label>
                            <input type="time" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Patient Name / Type</label>
                        <input type="text" placeholder="John Doe or 'Reserved for admin'" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600" />
                    </div>
                    <button onClick={() => {
                        showToast('Slot confirmed and locked on the calendar.', 'success');
                        setIsSlotModalOpen(false);
                    }} className="w-full py-2 bg-primary text-white rounded-lg text-sm font-bold mt-4">Confirm Slot Block</button>
                </div>
            </Modal>

            <Modal isOpen={isPrescModalOpen} onClose={() => setIsPrescModalOpen(false)} title="Write New Prescription">
                <div className="space-y-4">
                    <input type="text" placeholder="Search Patient..." className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 mb-2" />
                    <textarea placeholder="e.g. Paracetamol 500mg, twice a day after meals" className="w-full h-32 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-600" />
                    <div className="flex gap-2 mt-4">
                        <button onClick={() => {
                            showToast('Prescription saved to records.', 'success');
                            setIsPrescModalOpen(false);
                        }} className="flex-1 py-2 bg-text-dark text-white rounded-lg text-sm font-bold">Save to EMR</button>
                        <button onClick={() => {
                            showToast('Prescription sent via WhatsApp to patient.', 'success');
                            setIsPrescModalOpen(false);
                        }} className="flex-1 py-2 bg-success text-white rounded-lg text-sm font-bold">Save & Send WhatsApp</button>
                    </div>
                </div>
            </Modal>

        </>
    );
}
