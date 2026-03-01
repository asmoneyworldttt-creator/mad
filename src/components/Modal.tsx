import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    maxWidth?: string;
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-[2px] animate-in fade-in duration-300">
            <div className={`bg-white rounded-[2rem] shadow-2xl w-full ${maxWidth} overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-300 border border-white/20 shadow-primary/10`}>
                <div className="flex justify-between items-center p-8 pb-4">
                    <h3 className="font-display font-bold text-2xl text-text-dark tracking-tight">{title}</h3>
                    <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all active:scale-90">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-8 pt-2 overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background-color: #E2E8F0;
                  border-radius: 20px;
                }
            `}</style>
        </div>
    );
}
