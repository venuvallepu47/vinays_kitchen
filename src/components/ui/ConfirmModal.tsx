import { Modal } from './Modal';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
}

export function ConfirmModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = 'Delete', 
    cancelText = 'Cancel' 
}: ConfirmModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-6">
                <p className="text-sm text-slate-600">{message}</p>
                <div className="flex gap-3">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }} 
                        className="flex-1 py-3 text-sm font-bold text-white bg-danger-600 rounded-xl hover:bg-danger-700 transition-colors"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
