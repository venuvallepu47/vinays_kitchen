import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Pencil, Trash2, CalendarCheck, Banknote } from 'lucide-react';
import { DateInput } from '../components/ui/DateInput';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { formatCurrency, formatDate, today, formatDateInput } from '../utils/format';
import { AmountDisplay } from '../components/ui/AmountDisplay';
import { useToast } from '../contexts/ToastContext';
import { TopBar } from '../components/layout/TopBar';
import { cn } from '../utils/cn';
import api from '../utils/api';

const STATUS_COLORS: Record<string, string> = {
    'Present':  'bg-success-100 text-success-700',
    'Absent':   'bg-danger-100 text-danger-700',
    'Half-day': 'bg-warning-100 text-warning-700',
};

export function WorkerProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [data, setData] = useState<any>(null);
    const [showEdit, setShowEdit] = useState(false);
    const [showPay, setShowPay] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', phone: '', salary_per_day: '' });
    const [payForm, setPayForm] = useState({ amount: '', payment_date: today(), notes: '' });
    const [tab, setTab] = useState<'attendance' | 'payments'>('attendance');

    const [showEditPay, setShowEditPay] = useState(false);
    const [editPayForm, setEditPayForm] = useState({ id: 0, amount: '', payment_date: '', notes: '' });

    const [deletePaymentId, setDeletePaymentId] = useState<number | null>(null);
    const [showDeleteWorker, setShowDeleteWorker] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const res = await api.get(`/workers/${id}`);
            setData(res.data);
            setEditForm({ name: res.data.worker.name, phone: res.data.worker.phone || '', salary_per_day: res.data.worker.salary_per_day });
        } catch { toast('Failed to load worker', 'error'); }
    }, [id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put(`/workers/${id}`, editForm);
            toast('Worker updated');
            setShowEdit(false);
            fetchData();
        } catch { toast('Failed', 'error'); }
    };

    const handlePay = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/salary-payments', { ...payForm, worker_id: id });
            toast('Payment recorded');
            setShowPay(false);
            setPayForm({ amount: '', payment_date: today(), notes: '' });
            fetchData();
        } catch { toast('Failed', 'error'); }
    };

    const handleEditPay = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put(`/salary-payments/${editPayForm.id}`, editPayForm);
            toast('Payment updated');
            setShowEditPay(false);
            fetchData();
        } catch { toast('Failed to update', 'error'); }
    };

    const openEditPay = (p: any) => {
        setEditPayForm({ id: p.id, amount: p.amount, payment_date: formatDateInput(p.payment_date), notes: p.notes || '' });
        setShowEditPay(true);
    };

    const confirmDeletePayment = async () => {
        if (!deletePaymentId) return;
        try { await api.delete(`/salary-payments/${deletePaymentId}`); toast('Deleted'); fetchData(); }
        catch { toast('Failed', 'error'); }
    };

    const confirmDeleteWorker = async () => {
        try { await api.delete(`/workers/${id}`); toast('Worker removed'); navigate('/workers'); }
        catch { toast('Failed', 'error'); }
    };

    if (!data) return (
        <div className="h-dvh bg-slate-50 flex flex-col max-w-md mx-auto shadow-xl overflow-hidden">
            <TopBar title="Worker Profile" showBack />
            <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-600 rounded-full animate-spin" />
            </div>
        </div>
    );

    const { worker, attendance, payments, stats } = data;
    const daysWorked = parseFloat(stats?.days_worked || 0);
    const paidThisMonth = parseFloat(stats?.paid_this_month || 0);
    const earned = daysWorked * parseFloat(worker.salary_per_day);
    const balance = earned - paidThisMonth;

    return (
        <div className="h-dvh bg-slate-50 flex flex-col max-w-md mx-auto shadow-xl overflow-hidden">
            <TopBar title={worker.name} showBack rightAction={
                <div className="flex items-center gap-1">
                    <button onClick={() => setShowEdit(true)} className="p-2 rounded-full hover:bg-slate-100 text-slate-500"><Pencil size={18} /></button>
                    <button onClick={() => setShowDeleteWorker(true)} className="p-2 rounded-full hover:bg-danger-50 text-danger-500"><Trash2 size={18} /></button>
                </div>
            } />
            <main className="flex-1 min-h-0 overflow-y-auto">
                <div className="p-4 space-y-4 pb-safe">
                    {/* Profile Card */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                                <span className="text-xl font-black text-blue-700">{worker.name.charAt(0)}</span>
                            </div>
                            <div>
                                <p className="text-base font-bold text-slate-900">{worker.name}</p>
                                <p className="text-sm text-slate-400">{worker.phone || 'No phone'}</p>
                                <p className="text-sm font-semibold text-primary-700">₹{worker.salary_per_day}/day</p>
                            </div>
                        </div>
                        {/* Salary Summary */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-slate-50 rounded-xl p-3 text-center">
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Days Worked</p>
                                <p className="text-base font-black text-slate-900 mt-1">{daysWorked}</p>
                            </div>
                            <div className="bg-success-50 rounded-xl p-3 text-center">
                                <p className="text-[10px] text-success-600 font-bold uppercase">Earned</p>
                                <p className="text-base font-black text-success-700 mt-1">
                                    <AmountDisplay amount={earned} className="block" exactClassName="block text-[9px] font-semibold text-slate-400 mt-0.5 tabular-nums" />
                                </p>
                            </div>
                            <div className={cn('rounded-xl p-3 text-center', balance > 0 ? 'bg-danger-50' : 'bg-success-50')}>
                                <p className={cn('text-[10px] font-bold uppercase', balance > 0 ? 'text-danger-600' : 'text-success-600')}>Balance</p>
                                <p className={cn('text-base font-black mt-1', balance > 0 ? 'text-danger-700' : 'text-success-700')}>
                                    <AmountDisplay amount={Math.abs(balance)} className="block" exactClassName="block text-[9px] font-semibold text-slate-400 mt-0.5 tabular-nums" />
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Pay Button */}
                    <button onClick={() => setShowPay(true)} className="w-full h-12 bg-success-600 text-white text-sm font-bold rounded-2xl flex items-center justify-center gap-2 active:bg-success-700">
                        <Banknote size={16} /> Record Salary Payment
                    </button>

                    {/* Tabs */}
                    <div className="flex bg-slate-100 rounded-2xl p-1">
                        {(['attendance', 'payments'] as const).map(t => (
                            <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 text-xs font-bold rounded-xl transition-all capitalize', tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400')}>
                                {t === 'attendance' ? 'Attendance' : 'Payments'}
                            </button>
                        ))}
                    </div>

                    {tab === 'attendance' ? (
                        <div className="space-y-2">
                            {attendance.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-slate-100 py-8 text-center">
                                    <CalendarCheck size={22} className="text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm font-bold text-slate-400">No attendance recorded</p>
                                </div>
                            ) : attendance.map((a: any) => (
                                <div key={a.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 flex items-center justify-between">
                                    <p className="text-sm font-bold text-slate-900">{formatDate(a.date)}</p>
                                    <span className={cn('text-xs font-bold px-3 py-1 rounded-full', STATUS_COLORS[a.status] || 'bg-slate-100 text-slate-600')}>{a.status}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {payments.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-slate-100 py-8 text-center">
                                    <Banknote size={22} className="text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm font-bold text-slate-400">No payments recorded</p>
                                </div>
                            ) : payments.map((p: any) => (
                                <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-900">{formatDate(p.payment_date)}</p>
                                        {p.notes && <p className="text-xs text-slate-400 mt-0.5">{p.notes}</p>}
                                    </div>
                                    <p className="text-sm font-black text-success-700">{formatCurrency(p.amount)}</p>
                                    <div className="flex items-center">
                                        <button onClick={() => openEditPay(p)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"><Pencil size={14} /></button>
                                        <button onClick={() => setDeletePaymentId(p.id)} className="p-1.5 rounded-lg hover:bg-danger-50 text-slate-400 hover:text-danger-500 transition-colors"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Edit Modal */}
            <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Update Staff Information">
                <form onSubmit={handleEdit} className="space-y-5 pt-3">
                    <div className="bg-slate-50 p-5 rounded-[32px] border border-slate-100 space-y-5">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">Full Name *</label>
                            <input required value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 shadow-sm" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">Phone Number</label>
                            <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 shadow-sm" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">Daily Salary (₹) *</label>
                            <input required type="number" min="0" step="0.01" value={editForm.salary_per_day} onChange={e => setEditForm(f => ({ ...f, salary_per_day: e.target.value }))}
                                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 shadow-sm" />
                        </div>
                    </div>
                    <button type="submit" className="w-full py-4.5 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-500/20 active:scale-95 transition-all outline-none">
                        Update Member Information
                    </button>
                </form>
            </Modal>

            {/* Pay Modal */}
            <Modal isOpen={showPay} onClose={() => setShowPay(false)} title="Record Salary Payment">
                <div className="mb-4 bg-slate-100/50 rounded-2xl p-4 flex justify-between items-center border border-slate-200/50 shadow-inner">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Total Balance Due</p>
                    <p className={cn('text-lg font-black text-right', balance > 0 ? 'text-danger-600' : 'text-success-600')}>
                        <AmountDisplay amount={Math.abs(balance)} className="block" exactClassName="block text-[9px] font-semibold text-slate-400 mt-0.5 tabular-nums" />
                    </p>
                </div>
                <form onSubmit={handlePay} className="space-y-5">
                    <div className="bg-slate-50 p-5 rounded-[32px] border border-slate-100 space-y-5">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">Payment Amount (₹) *</label>
                            <input required type="number" min="0.01" step="0.01" placeholder="0" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))}
                                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 shadow-sm" />
                        </div>
                        <DateInput 
                            label="Payment Date"
                            value={payForm.payment_date}
                            onChange={e => setPayForm(f => ({ ...f, payment_date: e.target.value }))}
                        />
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">Payment Notes</label>
                            <textarea placeholder="e.g. Weekly salary advance" value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-3xl text-base font-bold text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 resize-none shadow-sm" />
                        </div>
                    </div>
                    <button type="submit" className="w-full py-4.5 bg-success-600 text-white font-black rounded-2xl shadow-xl shadow-success-500/20 active:scale-95 transition-all outline-none">
                        Confirm Payment
                    </button>
                </form>
            </Modal>

            {/* Edit Pay Modal */}
            <Modal isOpen={showEditPay} onClose={() => setShowEditPay(false)} title="Update Payment Record">
                <form onSubmit={handleEditPay} className="space-y-5 pt-3">
                    <div className="bg-slate-50 p-5 rounded-[32px] border border-slate-100 space-y-5">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">Amount (₹) *</label>
                            <input required type="number" min="0.01" step="0.01" placeholder="0" value={editPayForm.amount} onChange={e => setEditPayForm(f => ({ ...f, amount: e.target.value }))}
                                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 shadow-sm" />
                        </div>
                        <DateInput 
                            label="Payment Date"
                            value={editPayForm.payment_date}
                            onChange={e => setEditPayForm(f => ({ ...f, payment_date: e.target.value }))}
                        />
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">Notes</label>
                            <textarea placeholder="e.g. Corrected salary entry" value={editPayForm.notes} onChange={e => setEditPayForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-3xl text-base font-bold text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 resize-none shadow-sm" />
                        </div>
                    </div>
                    <button type="submit" className="w-full py-4.5 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-500/20 active:scale-95 transition-all outline-none">
                        Update Transaction
                    </button>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={deletePaymentId !== null}
                onClose={() => setDeletePaymentId(null)}
                onConfirm={confirmDeletePayment}
                title="Delete Salary Payment"
                message="Are you sure you want to delete this salary payment record?"
            />
            <ConfirmModal
                isOpen={showDeleteWorker}
                onClose={() => setShowDeleteWorker(false)}
                onConfirm={confirmDeleteWorker}
                title="Remove Worker"
                message="Are you sure you want to permanently remove this worker and their history?"
            />
        </div>
    );
}
