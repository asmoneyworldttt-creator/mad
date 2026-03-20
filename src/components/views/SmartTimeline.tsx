import { useState, useMemo } from 'react';
import { 
    Clock, Calendar, FileText, Activity, Wrench, Image, Heart, AlertTriangle, 
    CheckCircle2, DollarSign, Lock, FlaskConical, Filter, Eye, PhoneCall 
} from 'lucide-react';
import { motion } from 'framer-motion';

export function SmartTimelineTab({ patient, bills = [], plans = [], prescriptions = [], labOrders = [], vitals = [], activeTab, theme }: any) {
    const isDark = theme === 'dark';
    const [filter, setFilter] = useState('All');

    // Summary Calculations
    const totalVisits = bills.length; // Approximate from bills or use appointments if passed
    const activePlans = plans.filter((p: any) => p.status === 'Active').length;
    const outstandingBalance = bills.reduce((acc: number, b: any) => acc + (b.status !== 'Paid' ? parseFloat(b.amount) : 0), 0);

    const filterOptions = ['All', 'Treatments', 'Plans', 'Lab Orders', 'Prescriptions', 'X-rays', 'Invoices', 'Follow-ups'];

    // Sample Timeline Items representing Real / Derived data structures securely framing
    const timelineItems = useMemo(() => {
        let items: any[] = [];
        
        // Invoices / Bills
        bills.forEach((b: any) => {
             items.push({
                 type: 'Invoice',
                 date: b.date,
                 title: `Invoice ${b.invoice_number || b.id.slice(0,4)}`,
                 subtitle: b.treatment_name || 'Procedural Appointment',
                 amount: `₹${b.amount}`,
                 status: b.status,
                 borderColor: 'border-l-yellow-500',
                 leftIcon: FileText
             });
        });

        // Plans
        plans.forEach((p: any) => {
             items.push({
                  type: 'Plan',
                  date: p.created_at?.split('T')[0] || '',
                  title: p.title || 'Treatment Plan',
                  subtitle: `Estimated cost: ₹${p.total_cost}`,
                  status: p.status,
                  borderColor: 'border-l-blue-500',
                  leftIcon: FileSignature
             });
        });

        // Vitals
        vitals.slice(0,3).forEach((v: any) => {
             items.push({
                  type: 'Vitals',
                  date: v.recorded_at?.split('T')[0] || '',
                  title: 'Vitals Checked',
                  subtitle: `BP: ${v.bp_systolic || '---'}/${v.bp_diastolic || '---'} | SpO2: ${v.spo2 || '---'}%`,
                  borderColor: 'border-l-red-500',
                  leftIcon: Heart
             });
        });

        // Lab Orders
        (labOrders || []).forEach((l: any) => {
             items.push({
                  type: 'Lab Orders',
                  date: l.order_date?.split('T')[0] || '',
                  title: `Lab Order: ${l.vendor_name || 'Generic Lab'}`,
                  subtitle: `Status: ${l.order_status || 'Pending'}`,
                  borderColor: 'border-l-indigo-500',
                  leftIcon: FlaskConical
             });
        });

        // Prescriptions
        (prescriptions || []).forEach((p: any) => {
             items.push({
                  type: 'Prescriptions',
                  date: p.created_at?.split('T')[0] || '',
                  title: `Prescription Record rx-${p.id?.slice(0,4)}`,
                  subtitle: `Medications Checklist`,
                  borderColor: 'border-l-emerald-500',
                  leftIcon: FileText
             });
        });

        // Registration Marker
        if (patient.created_at) {
            items.push({
                 type: 'Registration',
                 date: patient.created_at.split('T')[0],
                 title: 'Patient Registered',
                 subtitle: `Profile Activated`,
                 borderColor: 'border-l-slate-400',
                 leftIcon: CheckCircle2
            });
        }

        return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [bills, plans, vitals, patient]);

    const filteredItems = filter === 'All' ? timelineItems : timelineItems.filter(i => i.type.includes(filter));

    return (
        <div className="space-y-6 pt-2">
            {/* ── Summary Strip ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Visits', value: totalVisits, icon: Activity, color: 'text-primary' },
                    { label: 'Active Plans', value: activePlans, icon: Lock, color: 'text-blue-500' },
                    { label: 'Pending Follow-ups', value: 0, icon: Clock, color: 'text-amber-500' },
                    { label: 'Outstanding Balance', value: `₹${outstandingBalance.toLocaleString()}`, icon: DollarSign, color: 'text-rose-500' }
                ].map((s, i) => (
                    <div key={i} className={`p-4 rounded-xl border relative overflow-hidden group backdrop-blur-md ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                        <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{s.label}</p>
                        <h4 className="text-xl font-black">{s.value}</h4>
                    </div>
                ))}
            </div>

            {/* ── Filter Bar ── */}
            <div className={`p-2 rounded-2xl border overflow-x-auto no-scrollbar backdrop-blur-md ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'}`}>
                <div className="flex items-center gap-1.5 min-w-max">
                    {filterOptions.map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all shrink-0 ${filter === f ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'}`}>{f}</button>
                    ))}
                </div>
            </div>

            {/* ── Timeline Body ── */}
            <div className="space-y-4 relative pl-4 border-l border-dashed border-slate-200 dark:border-white/10 ml-2 pt-2">
                {filteredItems.map((item, i) => {
                    const Icon = item.leftIcon;
                    return (
                        <div key={i} className={`p-4 rounded-xl border-l-4 ${item.borderColor} backdrop-blur-md relative ${isDark ? 'bg-slate-900 border-t border-b border-r border-white/5' : 'bg-white border text-slate-800'}`}>
                            <div className="absolute -left-6 top-4 w-4 h-4 rounded-full bg-primary border-4 border-white dark:border-slate-900" />
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500"><Icon size={16} /></div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400">{item.date}</p>
                                        <h5 className="text-sm font-black">{item.title}</h5>
                                        <p className="text-xs font-medium text-slate-500 line-clamp-1">{item.subtitle}</p>
                                    </div>
                                </div>
                                {item.amount && <p className="text-sm font-black text-primary">{item.amount}</p>}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}

const FileSignature = (props: any) => <FileText {...props} />;
