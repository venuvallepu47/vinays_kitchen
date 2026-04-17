import React, { useState, useEffect } from 'react';
import { Plus, Receipt, Trash2 } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { ListSkeleton } from '../components/ui/Skeleton';
import { formatCurrency, formatDate, today } from '../utils/format';
import { useToast } from '../contexts/ToastContext';
import api from '../utils/api';

const CATEGORIES = ['Rent', 'Electricity', 'Water', 'Gas', 'Maintenance', 'Transport', 'Miscellaneous'];

export function Expenses() {
    const { toast } = useToast();
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ category: 'Rent', amount: '', expense_date: today(), notes: '' });

    const fetchExpenses = async () => {
        try {
            const res = await api.get('/expenses');
            setExpenses(res.data);
        } catch { toast('Failed to load expenses', 'error'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchExpenses(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/expenses', form);
            toast('Expense added');
            setShowAdd(false);
            setForm({ category: 'Rent', amount: '', expense_date: today(), notes: '' });
            fetchExpenses();
        } catch { toast('Failed to add expense', 'error'); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this expense?')) return;
        try { await api.delete(`/expenses/${id}`); toast('Deleted'); fetchExpenses(); }
        catch { toast('Failed', 'error'); }
    };

    const CATEGORY_COLORS: Record<string, string> = {
        Rent: 'bg-red-50 text-red-700',
        Electricity: 'bg-yellow-50 text-yellow-700',
        Water: 'bg-blue-50 text-blue-700',
        Gas: 'bg-orange-50 text-orange-700',
        Maintenance: 'bg-slate-100 text-slate-700',
        Transport: 'bg-purple-50 text-purple-700',
        Miscellaneous: 'bg-slate-50 text-slate-500',
    };

    return (
        <div className="pb-24">
            <div className="px-4 pt-4 pb-3 flex justify-between items-center">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">All Expenses</p>
                <button onClick={() => setShowAdd(true)} className="h-9 px-4 bg-danger-600 text-white text-sm font-bold rounded-xl flex items-center gap-1.5 active:bg-danger-700 shrink-0">
                    <Plus size={15} /> Add
                </button>
            </div>

            {loading ? <div className="px-4"><ListSkeleton /></div> : expenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 px-4 text-center">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <Receipt size={24} className="text-slate-400" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-700">No expenses yet</p>
                        <p className="text-xs text-slate-400 mt-1">Log rent, electricity, and other costs</p>
                    </div>
                </div>
            ) : (
                <div className="px-4 space-y-2">
                    {expenses.map(exp => (
                        <div key={exp.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 flex items-center gap-3">
                            <div className={`px-2 py-1 rounded-lg text-xs font-bold shrink-0 ${CATEGORY_COLORS[exp.category] || 'bg-slate-100 text-slate-600'}`}>
                                {exp.category}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900">{exp.notes || exp.category}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{formatDate(exp.expense_date)}</p>
                            </div>
                            <p className="text-sm font-black text-danger-600 shrink-0">{formatCurrency(exp.amount)}</p>
                            <button onClick={() => handleDelete(exp.id)} className="p-1.5 rounded-lg hover:bg-danger-50 text-slate-300 hover:text-danger-500"><Trash2 size={14} /></button>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Expense">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Category *</label>
                        <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500">
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Amount (₹) *</label>
                        <input required type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Date</label>
                        <input type="date" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))}
                            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Notes</label>
                        <input placeholder="e.g. Monthly shop rent" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
                    </div>
                    <button type="submit" className="w-full py-3.5 bg-danger-600 text-white font-bold rounded-2xl">Add Expense</button>
                </form>
            </Modal>
        </div>
    );
}
