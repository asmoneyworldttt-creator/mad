
import { useState, useEffect } from 'react';
import { Bell, Send, Phone, MessageCircle, Calendar, CheckCircle2, Clock, RefreshCw, Search, Plus } from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';

type UserRole = 'master' | 'admin' | 'staff' | 'patient';

const STATUS_COLOR: any = {
    Sent: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    Pending: 'text-amber-500 bg-amber-50 border-amber-100',
    Failed: 'text-rose-500 bg-rose-50 border-rose-200',
};

const TYPE_COLOR: any = {
    WhatsApp: 'text-emerald-600 bg-emerald-50',
    SMS: 'text-blue-600 bg-blue-50',
    Call: 'text-violet-600 bg-violet-50',
};

export function ReminderCenter({ userRole, theme }: { userRole: UserRole; theme?: 'light' | 'dark' }) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [tab, setTab] = useState<'today' | 'upcoming' | 'sent'>('today');
    const [appointments, setAppointments] = useState<any[]>([]);
    const [reminders, setReminders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sending, setSending] = useState<string | null>(null);

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const dayAfter = new Date(Date.now() + 172800000).toISOString().split('T')[0];

    useEffect(() => { fetchData(); }, [tab]);

    const fetchData = async () => {
        setIsLoading(true);
        let aptQuery = supabase.from('appointments').select('*').order('date', { ascending: true });

        if (tab === 'today') aptQuery = aptQuery.eq('date', today);
        else if (tab === 'upcoming') aptQuery = aptQuery.gte('date', tomorrow).lte('date', dayAfter);

        const [{ data: apts }, { data: rems }] = await Promise.all([
            aptQuery,
            supabase.from('appointment_reminders').select('*').order('created_at', { ascending: false }).limit(50)
        ]);

        setAppointments(apts || []);
        setReminders(rems || []);
        setIsLoading(false);
    };

    const buildWhatsAppMessage = (apt: any) =>
        `Hello ${apt.name},\n\nThis is a reminder for your dental appointment:\n📅 Date: ${new Date(apt.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}\n⏰ Time: ${apt.time}\n🦷 Type: ${apt.type}\n\nPlease arrive 10 minutes early. For any changes, call us.\n\n— DentiSphere Clinic`;

    const handleSendWhatsApp = async (apt: any) => {
        setSending(apt.id);
        const msg = buildWhatsAppMessage(apt);
        const phone = apt.phone?.replace(/\D/g, '') || '';
        const url = `https://wa.me/${phone ? '91' + phone : ''}?text=${encodeURIComponent(msg)}`;

        // Log the reminder
        await supabase.from('appointment_reminders').insert({
            appointment_id: apt.id,
            patient_name: apt.name,
            patient_phone: apt.phone || '',
            appointment_date: apt.date,
            appointment_time: apt.time,
            appointment_type: apt.type,
            reminder_type: 'WhatsApp',
            status: 'Sent',
            sent_at: new Date().toISOString(),
            message_body: msg,
        });

        window.open(url, '_blank');
        showToast(`WhatsApp reminder sent to ${apt.name}`, 'success');
        setSending(null);
        fetchData();
    };

    const handleSendSMS = (apt: any) => {
        const msg = `Reminder: Your dental appointment is on ${apt.date} at ${apt.time}. Type: ${apt.type}. - DentiSphere`;
        const url = `sms:${apt.phone || ''}?body=${encodeURIComponent(msg)}`;
        window.open(url);
        showToast('SMS app opened', 'success');
    };

    const handleCall = (apt: any) => {
        if (!apt.phone) { showToast('No phone number on record', 'error'); return; }
        window.open(`tel:${apt.phone}`);
    };

    const handleSendBulk = async () => {
        const pending = filtered.filter(a => a.status !== 'Cancelled');
        if (!pending.length) { showToast('No appointments to remind', 'error'); return; }
        showToast(`Opening WhatsApp for ${pending.length} patient(s)...`, 'success');
        for (const apt of pending.slice(0, 5)) {
            await handleSendWhatsApp(apt);
            await new Promise(r => setTimeout(r, 400));
        }
    };

    const filtered = appointments.filter(a =>
        a.name?.toLowerCase().includes(search.toLowerCase()) ||
        (a.phone || '').includes(search)
    );

    const sentToday = reminders.filter(r => r.sent_at?.startsWith(today));
    const pending = appointments.filter(a => a.status === 'Confirmed').length;

    const inputCls = `w-full px-4 py-3 rounded-2xl border font-medium text-sm outline-none transition-all ${isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-700 shadow-sm focus:border-primary'}`;

    return (
        <div className="animate-slide-up space-y-6 pb-10">
            {/* Header */}
            <div className={`p-6 rounded-[2.5rem] border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div>
                    <h2 className={`text-2xl font-bold tracking-tight flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Bell size={20} className="text-primary" />
                        </div>
                        Reminder Center
                    </h2>
                    <p className="text-sm font-medium text-slate-400 mt-1 ml-[52px]">Send WhatsApp, SMS & call reminders for upcoming appointments</p>
                </div>
                <button onClick={handleSendBulk} className="flex items-center gap-2 px-6 py-3.5 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95 transition-all">
                    <Send size={16} /> Bulk Remind (WhatsApp)
                </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Today's Appointments", value: appointments.filter(a => !tab || tab === 'today').length, icon: Calendar, color: 'text-primary bg-primary/10' },
                    { label: 'Confirmed', value: pending, icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50' },
                    { label: 'Reminders Sent Today', value: sentToday.length, icon: Send, color: 'text-blue-500 bg-blue-50' },
                    { label: 'Pending Reminders', value: Math.max(0, filtered.length - sentToday.length), icon: Clock, color: 'text-amber-500 bg-amber-50' },
                ].map((s, i) => (
                    <div key={i} className={`p-5 rounded-[1.8rem] border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                            <s.icon size={18} />
                        </div>
                        <p className="text-2xl font-bold">{s.value}</p>
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Tabs + Search */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className={`flex gap-1 p-1 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                    {[
                        { key: 'today', label: "Today" },
                        { key: 'upcoming', label: '2-Day Ahead' },
                        { key: 'sent', label: 'Sent Log' },
                    ].map(t => (
                        <button key={t.key} onClick={() => setTab(t.key as any)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === t.key ? 'bg-primary text-white shadow-md shadow-primary/20' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                            {t.label}
                        </button>
                    ))}
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search patient..." value={search} onChange={e => setSearch(e.target.value)} className={`${inputCls} pl-10`} />
                    </div>
                    <button onClick={fetchData} className={`p-3 rounded-2xl border transition-all ${isDark ? 'bg-white/5 border-white/10 text-slate-300 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}><RefreshCw size={16} /></button>
                </div>
            </div>

            {/* Sent Log Tab */}
            {tab === 'sent' ? (
                <div className={`rounded-[2rem] border overflow-hidden ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div className={`px-6 py-4 border-b flex justify-between items-center ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                        <h3 className="font-bold">Reminder History</h3>
                        <span className={`text-xs font-bold px-3 py-1 rounded-lg ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{reminders.length} total</span>
                    </div>
                    <div className="divide-y divide-slate-100/10">
                        {reminders.map(r => (
                            <div key={r.id} className={`px-6 py-4 flex items-center gap-4 ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${TYPE_COLOR[r.reminder_type] || 'bg-slate-100 text-slate-500'}`}>
                                    {r.reminder_type === 'WhatsApp' ? <MessageCircle size={16} /> : r.reminder_type === 'SMS' ? <MessageCircle size={16} /> : <Phone size={16} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm">{r.patient_name}</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        {r.appointment_date} at {r.appointment_time} · {r.appointment_type}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border ${STATUS_COLOR[r.status] || ''}`}>{r.status}</span>
                                    <span className="text-[10px] text-slate-400">{r.sent_at ? new Date(r.sent_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                                </div>
                            </div>
                        ))}
                        {reminders.length === 0 && !isLoading && (
                            <div className="py-16 text-center">
                                <Bell size={40} className="mx-auto mb-3 opacity-20" />
                                <p className="text-slate-400 font-medium">No reminders sent yet</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Appointments List */
                <div className={`rounded-[2rem] border overflow-hidden ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div className={`px-6 py-4 border-b flex justify-between items-center ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                        <h3 className="font-bold">{tab === 'today' ? "Today's Appointments" : 'Next 2 Days'}</h3>
                        <span className={`text-xs font-bold px-3 py-1 rounded-lg ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{filtered.length} appointments</span>
                    </div>

                    {isLoading ? (
                        <div className="py-16 text-center">
                            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-slate-400">Loading appointments...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-16 text-center">
                            <Calendar size={40} className="mx-auto mb-3 opacity-20" />
                            <p className="font-bold text-slate-400">No appointments for this period</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100/10">
                            {filtered.map(apt => {
                                const alreadySent = reminders.some(r => r.appointment_id === apt.id);
                                const statusColor: any = {
                                    Confirmed: 'text-emerald-500 bg-emerald-50 border-emerald-100',
                                    Scheduled: 'text-blue-500 bg-blue-50 border-blue-100',
                                    Cancelled: 'text-rose-400 bg-rose-50 border-rose-100',
                                    Completed: 'text-slate-400 bg-slate-50 border-slate-100',
                                };
                                return (
                                    <div key={apt.id} className={`px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'} transition-all`}>
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                            {apt.name?.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-bold text-sm">{apt.name}</p>
                                                {alreadySent && (
                                                    <span className="flex items-center gap-1 text-[9px] font-extrabold text-emerald-500 bg-emerald-50 border-emerald-100 border px-2 py-0.5 rounded-full uppercase tracking-widest">
                                                        <CheckCircle2 size={9} /> Reminded
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                {apt.phone || 'No phone'} · {apt.time} · {apt.type}
                                                {apt.date !== today && <span className="ml-2 text-amber-500 font-bold">{apt.date}</span>}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border ${statusColor[apt.status] || 'bg-slate-100 text-slate-400 border-slate-200'}`}>{apt.status}</span>
                                            <button
                                                onClick={() => handleSendWhatsApp(apt)}
                                                disabled={sending === apt.id}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 text-white text-[11px] font-bold shadow-sm hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50"
                                                title="Send WhatsApp reminder"
                                            >
                                                {sending === apt.id ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <MessageCircle size={13} />}
                                                WA
                                            </button>
                                            <button onClick={() => handleSendSMS(apt)} className={`p-2 rounded-xl border transition-all ${isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-blue-50 border-blue-100 text-blue-500 hover:bg-blue-100'}`} title="SMS"><MessageCircle size={14} /></button>
                                            <button onClick={() => handleCall(apt)} className={`p-2 rounded-xl border transition-all ${isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-violet-50 border-violet-100 text-violet-500 hover:bg-violet-100'}`} title="Call"><Phone size={14} /></button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Message preview box */}
            {filtered.length > 0 && tab !== 'sent' && (
                <div className={`p-5 rounded-[2rem] border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">WhatsApp Message Preview</p>
                    <pre className={`text-sm font-medium whitespace-pre-wrap leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {buildWhatsAppMessage(filtered[0])}
                    </pre>
                </div>
            )}
        </div>
    );
}
