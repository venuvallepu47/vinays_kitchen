import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast, type ToastItem } from '../../contexts/ToastContext';
import { cn } from '../../utils/cn';

const CONFIG = {
    success: { icon: CheckCircle2, containerClass: 'bg-white border-l-4 border-success-500', iconClass: 'text-success-500', msgClass: 'text-success-700' },
    error:   { icon: XCircle,      containerClass: 'bg-white border-l-4 border-danger-500',  iconClass: 'text-danger-500',  msgClass: 'text-danger-700'  },
    warning: { icon: AlertTriangle, containerClass: 'bg-white border-l-4 border-warning-500', iconClass: 'text-warning-500', msgClass: 'text-warning-700' },
    info:    { icon: Info,          containerClass: 'bg-white border-l-4 border-primary-500', iconClass: 'text-primary-500', msgClass: 'text-primary-700' },
} as const;

function ToastCard({ toast }: { toast: ToastItem }) {
    const { dismiss } = useToast();
    const cfg = CONFIG[toast.type];
    const Icon = cfg.icon;
    return (
        <div
            className={cn('flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg max-w-[360px] w-full pointer-events-auto', cfg.containerClass)}
            style={{ animation: 'toastSlideIn 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}
            role="alert"
        >
            <Icon size={20} className={cn('flex-shrink-0 mt-0.5', cfg.iconClass)} />
            <p className={cn('flex-1 text-sm font-medium leading-snug', cfg.msgClass)}>{toast.message}</p>
            <button onClick={() => dismiss(toast.id)} className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-0.5 -mr-1 -mt-0.5">
                <X size={16} />
            </button>
        </div>
    );
}

export function ToastContainer() {
    const { toasts } = useToast();
    if (toasts.length === 0) return null;
    return (
        <div aria-live="polite" className="fixed bottom-20 left-0 right-0 z-[200] flex flex-col items-center gap-2 px-4 pointer-events-none">
            {toasts.map(t => <ToastCard key={t.id} toast={t} />)}
        </div>
    );
}
