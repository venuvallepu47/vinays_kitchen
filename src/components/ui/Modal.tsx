import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
    if (!isOpen) return null;

    return createPortal(
        <>
            <div className="fixed inset-0 z-[990] bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
            <div className="fixed left-0 right-0 bottom-0 z-[1000] max-w-md mx-auto animate-slide-up pb-safe">
                <div className={cn('bg-white rounded-t-3xl shadow-2xl border border-slate-100/80 overflow-hidden', className)}>
                    <div className="flex justify-center pt-3 pb-1">
                        <div className="w-8 h-1 bg-slate-200 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                        <h2 className="text-base font-bold text-slate-900">{title}</h2>
                        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="px-5 py-4 max-h-[75vh] overflow-y-auto">
                        {children}
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}
