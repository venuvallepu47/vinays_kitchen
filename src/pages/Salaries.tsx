import { Banknote, Pencil, Trash2, Calendar, User, Search, Filter } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { DateInput } from '../components/ui/DateInput';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { formatCurrency, formatDate, formatDateInput } from '../utils/format';
import { AmountDisplay } from '../components/ui/AmountDisplay';
import { useToast } from '../contexts/ToastContext';
import api from '../utils/api';

export function Salaries() {
    const { toast } = useToast();
    const [payments, setPayments] = useState<any[]>([]);
    const [workers, setWorkers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters & Search
    const [search, setSearch] = useState('');
    const [filterWorker, setFilterWorker] = useState<string>('');
    
    // Modals
    const [showEdit, setShowEdit] = useState(false);
    const [editForm, setEditForm] = useState({ id: 0, amount: '', payment_date: '', notes: '' });
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [payRes, workRes] = await Promise.all([
                api.get('/salary-payments'),
                api.get('/workers')
            ]);
            setPayments(payRes.data);
            setWorkers(workRes.data);
        } catch {
            toast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put(`/salary-payments/${editForm.id}`, editForm);
            toast('Payment updated');
            setShowEdit(false);
            fetchAll();
        } catch { toast('Failed to update', 'error'); }
    };

    const openEdit = (p: any) => {
        setEditForm({ 
            id: p.id, 
            amount: p.amount, 
            payment_date: formatDateInput(p.payment_date),
            notes: p.notes || '' 
        });
        setShowEdit(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/salary-payments/${deleteId}`);
            toast('Payment removed');
            setDeleteId(null);
            fetchAll();
        } catch { toast('Failed to delete', 'error'); }
    };

    const filtered = payments.filter(p => {
        const matchesSearch = p.worker_name.toLowerCase().includes(search.toLowerCase()) || 
                             (p.notes && p.notes.toLowerCase().includes(search.toLowerCase()));
        const matchesWorker = !filterWorker || String(p.worker_id) === filterWorker;
        return matchesSearch && matchesWorker;
    });

    const totalPaid = filtered.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    return (
        <div className="space-y-4">
            {/* Header / Stats */}
            <div className="bg-success-600 rounded-3xl p-6 text-white shadow-lg shadow-success-200">
                <p className="text-xs font-bold text-success-100 uppercase tracking-widest mb-1 opacity-80">Total Payments</p>
                <p className="text-3xl font-black">
                    <AmountDisplay amount={totalPaid} className="block" exactClassName="block text-white/50 text-[11px] font-semibold mt-0.5 tabular-nums" />
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-success-100">
                    <Banknote size={14} />
                    <span>Showing {filtered.length} recent transactions</span>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 flex flex-col gap-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        placeholder="Search worker or notes..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                </div>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <select 
                            value={filterWorker}
                            onChange={e => setFilterWorker(e.target.value)}
                            className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:outline-none appearance-none"
                        >
                            <option value="">All Workers</option>
                            {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* History List */}
            <div className="space-y-2">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
                    ))
                ) : filtered.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-100 py-12 text-center">
                        <Banknote size={32} className="mx-auto text-slate-200 mb-3" />
                        <p className="text-sm font-bold text-slate-400">No payment history found</p>
                    </div>
                ) : filtered.map(p => (
                    <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3 active:bg-slate-50 transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-success-50 flex items-center justify-center shrink-0">
                            <User size={20} className="text-success-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-bold text-slate-900 truncate">{p.worker_name}</p>
                                <p className="text-sm font-black text-success-700">{formatCurrency(p.amount)}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <Calendar size={12} className="text-slate-400" />
                                <span className="text-xs text-slate-400 font-medium">{formatDate(p.payment_date)}</span>
                                {p.notes && (
                                    <>
                                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                                        <span className="text-xs text-slate-400 truncate max-w-[100px]">{p.notes}</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-1 border-l border-slate-50 pl-2">
                            <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                                <Pencil size={14} />
                            </button>
                            <button onClick={() => setDeleteId(p.id)} className="p-2 rounded-lg hover:bg-danger-50 text-slate-400 hover:text-danger-500 transition-colors">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Update Payment Record">
                <form onSubmit={handleEdit} className="space-y-5 pt-3">
                    <div className="bg-slate-50 p-5 rounded-[32px] border border-slate-100 space-y-5">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">Payment Amount (₹) *</label>
                            <input required type="number" min="0.01" step="0.01" value={editForm.amount} onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))}
                                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 shadow-sm" />
                        </div>
                        
                        <DateInput 
                            label="Payment Date"
                            value={editForm.payment_date}
                            onChange={e => setEditForm(f => ({ ...f, payment_date: e.target.value }))}
                        />

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">Payment Notes</label>
                            <textarea placeholder="e.g. Salary advance for April" value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-3xl text-base font-bold text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 resize-none shadow-sm" />
                        </div>
                    </div>
                    
                    <button type="submit" className="w-full py-4.5 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-500/20 active:scale-95 transition-all outline-none">
                        Update Transaction
                    </button>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Record"
                message="Are you sure you want to delete this payment record? This will affect worker balance and P&L reports."
            />
        </div>
    );
}
