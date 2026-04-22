import React, { useEffect, useState } from 'react';
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
    // bottom: how far above the keyboard the sheet should sit.
    // = window.innerHeight (layout height) - visualViewport.offsetTop - visualViewport.height
    // When keyboard is closed: 0.  When keyboard is open: ~keyboard height.
    const [keyboardBottom, setKeyboardBottom] = useState(0);
    const [vvHeight, setVvHeight] = useState(() => window.visualViewport?.height ?? window.innerHeight);

    useEffect(() => {
        if (!isOpen) return;

        const vv = window.visualViewport;
        if (!vv) return;

        const update = () => {
            const bottom = Math.max(0, window.innerHeight - vv.offsetTop - vv.height);
            setKeyboardBottom(bottom);
            setVvHeight(vv.height);
        };

        update();
        vv.addEventListener('resize', update);
        vv.addEventListener('scroll', update);

        return () => {
            vv.removeEventListener('resize', update);
            vv.removeEventListener('scroll', update);
            setKeyboardBottom(0);
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // Modal content height: 85% of the visible area above the keyboard.
    const maxContentHeight = Math.round(vvHeight * 0.82);

    return createPortal(
        <>
            <div
                className="fixed inset-0 z-[990] bg-black/40 backdrop-blur-[2px]"
                onClick={onClose}
            />
            <div
                className="fixed left-0 right-0 z-[1000] max-w-md mx-auto animate-slide-up"
                style={{ bottom: keyboardBottom, transition: 'bottom 0.2s ease-out' }}
            >
                <div className={cn('bg-white rounded-t-3xl shadow-2xl border border-slate-100/80 overflow-hidden', className)}>
                    {/* Drag handle */}
                    <div className="flex justify-center pt-3 pb-1">
                        <div className="w-8 h-1 bg-slate-200 rounded-full" />
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                        <h2 className="text-base font-bold text-slate-900">{title}</h2>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Scrollable content — height capped to visible area so nothing hides behind keyboard */}
                    <div
                        className="px-5 py-4 overflow-y-auto overscroll-contain"
                        style={{ maxHeight: maxContentHeight }}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}
