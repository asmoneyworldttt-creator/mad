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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-[4px] animate-in fade-in duration-300 overflow-hidden touch-none" style={{ overscrollBehavior: 'contain' }}>
            <div
                className={`bg-white rounded-[2.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] w-full ${maxWidth} overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 border border-white/40 shadow-primary/20 relative mx-auto my-auto`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-8 pb-4 bg-white/50 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-50">
                    <h3 className="font-sans font-bold text-2xl text-text-dark tracking-tight pr-8">{title}</h3>
                    <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-[1.25rem] transition-all active:scale-90 flex-shrink-0">
                        <X size={24} strokeWidth={2.5} />
                    </button>
                </div>
                <div className="p-8 pt-6 overflow-y-auto custom-scrollbar flex-1 bg-white scroll-smooth pb-12">
                    {children}
                </div>
            </div>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background-color: #CBD5E1;
                  border-radius: 20px;
                  border: 2px solid transparent;
                }
                @media (max-width: 640px) {
                  .custom-scrollbar::-webkit-scrollbar {
                    width: 0;
                  }
                }
            `}</style>
        </div>
    );
}

