import React, { useState, useEffect } from 'react';
import { Plus, Receipt, Trash2, Home, Zap, Droplets, Flame, Bus, Wrench, CreditCard, Search, Pencil } from 'lucide-react';
import { DateInput } from '../components/ui/DateInput';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { ListSkeleton } from '../components/ui/Skeleton';
import { formatCurrency, formatDate, today, formatDateInput } from '../utils/format';
import { AmountDisplay } from '../components/ui/AmountDisplay';
import { useToast } from '../contexts/ToastContext';
import api from '../utils/api';

const FALLBACK_CATEGORIES = ['Rent', 'Electricity', 'Water', 'Gas', 'Maintenance', 'Transport', 'Miscellaneous'];

const CATEGORY_ICONS: Record<string, any> = {
    Rent: { icon: Home, color: 'bg-red-50 text-red-600' },
    Electricity: { icon: Zap, color: 'bg-yellow-50 text-yellow-600' },
    Water: { icon: Droplets, color: 'bg-blue-50 text-blue-600' },
    Gas: { icon: Flame, color: 'bg-orange-50 text-orange-600' },
    Maintenance: { icon: Wrench, color: 'bg-slate-100 text-slate-600' },
    Transport: { icon: Bus, color: 'bg-purple-50 text-purple-600' },
    Miscellaneous: { icon: Receipt, color: 'bg-slate-50 text-slate-500' },
};

export function Expenses() {
    const { toast } = useToast();
    const [expenses, setExpenses] = useState<any[]>([]);
    const [categories, setCategories] = useState<string[]>(FALLBACK_CATEGORIES);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [query, setQuery] = useState('');
    const [form, setForm] = useState({ category: 'Rent', amount: '', expense_date: today(), notes: '' });
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const fetchExpenses = async () => {
        try {
            const [expRes, setRes] = await Promise.all([
                api.get('/expenses'),
                api.get('/settings').catch(() => ({ data: {} }))
            ]);
            setExpenses(expRes.data);
            if (setRes.data.expense_categories) {
                setCategories(setRes.data.expense_categories);
                if (setRes.data.expense_categories.length > 0 && !setRes.data.expense_categories.includes(form.category)) {
                    setForm(f => ({ ...f, category: setRes.data.expense_categories[0] }));
                }
            }
        } catch { toast('Failed to load expenses', 'error'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchExpenses(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editId) {
                await api.put(`/expenses/${editId}`, form);
                toast('Expense updated');
            } else {
                await api.post('/expenses', form);
                toast('Expense added');
            }
            handleCloseModal();
            fetchExpenses();
        } catch { toast('Failed to save expense', 'error'); }
    };

    const handleEdit = (exp: any) => {
        setEditId(exp.id);
        setForm({
            category: exp.category,
            amount: exp.amount.toString(),
            expense_date: formatDateInput(exp.expense_date),
            notes: exp.notes || ''
        });
        setShowAdd(true);
    };

    const handleCloseModal = () => {
        setShowAdd(false);
        setEditId(null);
        setForm({ category: categories[0] || 'Rent', amount: '', expense_date: today(), notes: '' });
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try { await api.delete(`/expenses/${deleteId}`); toast('Deleted'); setDeleteId(null); fetchExpenses(); }
        catch { toast('Failed', 'error'); }
    };

    const filtered = expenses.filter(e => 
        e.category.toLowerCase().includes(query.toLowerCase()) || 
        (e.notes && e.notes.toLowerCase().includes(query.toLowerCase()))
    );

    const totalExpenses = filtered.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    return (
        <div className="pb-24 space-y-4">
            {/* Header Summary */}
            <div className="px-4 pt-4">
                <div className="bg-danger-600 rounded-3xl p-6 text-white shadow-lg shadow-danger-100">
                    <p className="text-xs font-bold text-danger-100 uppercase tracking-widest mb-1 opacity-80">Total Expenses</p>
                    <p className="text-3xl font-black">
                        <AmountDisplay amount={totalExpenses} className="block" exactClassName="block text-white/50 text-[11px] font-semibold mt-0.5 tabular-nums" />
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-medium text-danger-100">
                            <CreditCard size={14} />
                            <span>{filtered.length} items logged</span>
                        </div>
                        <button onClick={() => setShowAdd(true)} className="h-9 px-4 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all outline-none border border-white/20">
                            <Plus size={15} /> Add Expense
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="px-4">
                <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        value={query} 
                        onChange={e => setQuery(e.target.value)} 
                        placeholder="Search category or note..."
                        className="w-full h-11 pl-10 pr-4 bg-white border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-danger-500/20 shadow-sm"
                    />
                </div>
            </div>

            {loading ? <div className="px-4"><ListSkeleton /></div> : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4 px-4 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                        <Receipt size={32} className="text-slate-300" />
                    </div>
                    <div>
                        <p className="text-base font-bold text-slate-700">No expenses found</p>
                        <p className="text-sm text-slate-400 mt-1">Ready to log rent, fuel, or repairs</p>
                    </div>
                </div>
            ) : (
                <div className="px-4 space-y-2">
                    {filtered.map(exp => {
                        const cat = CATEGORY_ICONS[exp.category] || CATEGORY_ICONS.Miscellaneous;
                        const Icon = cat.icon;
                        return (
                            <div key={exp.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4 active:bg-slate-50 transition-colors">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${cat.color}`}>
                                    <Icon size={22} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-900 truncate mb-0.5">{exp.notes || exp.category}</p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs text-slate-400 font-medium">{formatDate(exp.expense_date)}</p>
                                                {exp.notes && (
                                                    <>
                                                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                        <p className="text-xs text-slate-400 font-medium uppercase tracking-tight">{exp.category}</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-base font-black text-danger-600 leading-none">{formatCurrency(exp.amount)}</p>
                                            <div className="flex items-center justify-end gap-1.5 mt-2.5">
                                                <button onClick={() => handleEdit(exp)} 
                                                    className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 active:text-primary-600 active:scale-90 transition-all outline-none">
                                                    <Pencil size={18} />
                                                </button>
                                                <button onClick={() => setDeleteId(exp.id)} 
                                                    className="p-2.5 rounded-xl hover:bg-danger-50 text-slate-400 active:text-danger-600 active:scale-90 transition-all outline-none">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal isOpen={showAdd} onClose={handleCloseModal} title={editId ? "Update Expense Detail" : "Log New Operating Expense"}>
                <form onSubmit={handleSubmit} className="space-y-5 pt-3">
                    <div className="bg-slate-50 p-5 rounded-[32px] border border-slate-100 space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">Expense Category *</label>
                                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                    className="w-full h-12 px-4 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 shadow-sm">
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">Amount (₹) *</label>
                                <input required type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                                    className="w-full h-12 px-4 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 shadow-sm" />
                            </div>
                        </div>

                        <DateInput 
                            label="Expense Date *"
                            required
                            value={form.expense_date}
                            onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))}
                        />

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">Additional Notes</label>
                            <textarea placeholder="e.g. Monthly shop rent payment" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-3xl text-base font-bold text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 resize-none shadow-sm" />
                        </div>
                    </div>
                    
                    <button type="submit" className="w-full py-4.5 bg-danger-600 text-white font-black rounded-2xl shadow-xl shadow-danger-500/20 active:scale-95 transition-all outline-none">
                        {editId ? "Update Expense Record" : "Confirm & Save Expense"}
                    </button>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Expense"
                message="Are you sure you want to delete this expense record?"
            />
        </div>
    );
}

