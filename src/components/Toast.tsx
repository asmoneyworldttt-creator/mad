import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ToastType = 'success' | 'error' | 'info' | 'warning';

type ToastContextType = {
    showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const icons: Record<ToastType, any> = {
    success: CheckCircle2,
    error: XCircle,
    info: Info,
    warning: AlertTriangle,
};

const colors: Record<ToastType, { bg: string; border: string; icon: string }> = {
    success: { bg: '#0d9488', border: '#0f766e', icon: '#fff' },
    error: { bg: '#dc2626', border: '#b91c1c', icon: '#fff' },
    info: { bg: '#1a56db', border: '#1447c0', icon: '#fff' },
    warning: { bg: '#d97706', border: '#b45309', icon: '#fff' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<{ id: number; message: string; type: ToastType }[]>([]);

    // Listen for the custom event dispatched by session timeout (outside hook context)
    useEffect(() => {
        const handler = (e: CustomEvent) => {
            showToast(e.detail.msg, e.detail.type as ToastType);
        };
        window.addEventListener('dentora:toast', handler as EventListener);
        return () => window.removeEventListener('dentora:toast', handler as EventListener);
    }, []);

    const showToast = (message: string, type: ToastType = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev.slice(-3), { id, message, type }]); // max 4 at once
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };

    const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* aria-live region for screen readers */}
            <div aria-live="polite" aria-atomic="false" className="sr-only" id="toast-announcer" />
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none" role="region" aria-label="Notifications">
                <AnimatePresence>
                    {toasts.map(toast => {
                        const Icon = icons[toast.type];
                        const c = colors[toast.type];
                        return (
                            <motion.div
                                key={toast.id}
                                role="alert"
                                aria-live="assertive"
                                initial={{ opacity: 0, x: 80, scale: 0.9 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 80, scale: 0.85 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                className="pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl min-w-[280px] max-w-sm"
                                style={{ background: c.bg, border: `1px solid ${c.border}` }}
                            >
                                <Icon size={20} color={c.icon} aria-hidden="true" className="flex-shrink-0" />
                                <span className="font-bold text-sm text-white flex-1">{toast.message}</span>
                                <button
                                    onClick={() => dismiss(toast.id)}
                                    aria-label="Dismiss notification"
                                    className="ml-2 opacity-70 hover:opacity-100 transition-opacity flex-shrink-0"
                                >
                                    <X size={16} color="#fff" aria-hidden="true" />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
}
