
import { Bell, Check, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NotificationModal({ isOpen, onClose, theme }: NotificationModalProps & { theme?: 'light' | 'dark' }) {
    const [notifications, setNotifications] = useState([
        { id: 1, title: 'New Appointment', message: 'John Doe has booked a consultation for 10:00 AM.', time: '5 mins ago', read: false },
        { id: 2, title: 'Lab Result Ready', message: 'Lab report for PT-4921 has been uploaded.', time: '1 hour ago', read: false },
        { id: 3, title: 'Inventory Alert', message: 'Dental Floss stock is running low (5 units left).', time: '2 hours ago', read: true },
    ]);

    const markAsRead = (id: number) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const deleteNotification = (id: number) => {
        setNotifications(notifications.filter(n => n.id !== id));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className={`w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ${theme === 'light'
                        ? 'bg-white border border-slate-200'
                        : 'bg-slate-900/90 border border-white/10 backdrop-blur-xl'
                    }`}
            >
                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className={`text-2xl font-bold font-sans ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Notifications</h2>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-xl transition-colors ${theme === 'light' ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-white/10 text-slate-400'
                                }`}
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100/10">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{notifications.length} Total</p>
                            {notifications.length > 0 && (
                                <button onClick={clearAll} className="text-xs font-bold text-primary hover:underline transition-all">Clear All</button>
                            )}
                        </div>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {notifications.length > 0 ? notifications.map(n => (
                                <div
                                    key={n.id}
                                    className={`p-4 rounded-2xl border transition-all relative group ${n.read
                                            ? (theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-white/5 border-white/10')
                                            : (theme === 'light' ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-primary/10 border-primary/30 shadow-lg shadow-primary/20')
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`text-sm font-bold ${n.read ? (theme === 'light' ? 'text-slate-700' : 'text-slate-300') : 'text-primary'}`}>{n.title}</h4>
                                        <span className="text-[10px] font-bold text-slate-400">{n.time}</span>
                                    </div>
                                    <p className={`text-xs leading-relaxed pr-8 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>{n.message}</p>

                                    <div className="absolute right-4 bottom-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!n.read && (
                                            <button onClick={() => markAsRead(n.id)} className="p-1.5 bg-success/10 text-success rounded-lg hover:bg-success hover:text-white transition-colors">
                                                <Check size={14} />
                                            </button>
                                        )}
                                        <button onClick={() => deleteNotification(n.id)} className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${theme === 'light' ? 'bg-slate-50 text-slate-200' : 'bg-white/5 text-white/10'}`}>
                                        <Bell size={32} />
                                    </div>
                                    <p className="text-slate-400 font-bold italic">No new notifications</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl shadow-premium transition-all active:scale-[0.98]"
                    >
                        Close Panel
                    </button>
                </div>
            </div>
        </div>
    );
}
