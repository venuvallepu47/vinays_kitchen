import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ShoppingBag, Trash2, Pencil } from 'lucide-react';
import { ListSkeleton } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import { formatCurrency, formatDate, today } from '../utils/format';
import { useToast } from '../contexts/ToastContext';
import api from '../utils/api';

export function Sales() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState({ date: today(), amount: '', notes: '' });

    const fetchSales = async () => {
        try {
            const res = await api.get('/sales');
            setSales(res.data);
        } catch { toast('Failed to load sales', 'error'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchSales(); }, []);

    const openAdd = () => { setForm({ date: today(), amount: '', notes: '' }); setEditing(null); setShowAdd(true); };
    const openEdit = (sale: any) => { setForm({ date: sale.date?.split('T')[0] || today(), amount: sale.amount, notes: sale.notes || '' }); setEditing(sale); setShowAdd(true); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editing) {
                await api.put(`/sales/${editing.id}`, form);
                toast('Sale updated');
            } else {
                await api.post('/sales', form);
                toast('Sale added');
            }
            setShowAdd(false);
            fetchSales();
        } catch { toast('Failed to save sale', 'error'); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this sale entry?')) return;
        try {
            await api.delete(`/sales/${id}`);
            toast('Sale deleted');
            fetchSales();
        } catch { toast('Failed to delete', 'error'); }
    };

    const filtered = sales.filter(s =>
        (s.notes || '').toLowerCase().includes(query.toLowerCase()) ||
        String(s.amount).includes(query)
    );

    return (
        <div className="pb-24">
            <div className="px-4 pt-4 pb-3 flex gap-2">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search sales…"
                        className="w-full h-10 pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors" />
                </div>
                <button onClick={openAdd} className="h-10 px-4 bg-primary-600 text-white text-sm font-bold rounded-xl flex items-center gap-1.5 active:bg-primary-700 shrink-0">
                    <Plus size={16} /> Add
                </button>
            </div>

            {loading ? <div className="px-4"><ListSkeleton /></div> : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 px-4 text-center">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <ShoppingBag size={24} className="text-slate-400" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-700">{query ? 'No sales found' : 'No sales yet'}</p>
                        <p className="text-xs text-slate-400 mt-1">{query ? 'Try a different search' : 'Add today\'s counter amount'}</p>
                    </div>
                    {!query && <button onClick={openAdd} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 text-white text-xs font-bold rounded-xl"><Plus size={14} /> Add Sale</button>}
                </div>
            ) : (
                <div className="px-4 space-y-2">
                    {filtered.map(sale => (
                        <div key={sale.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center shrink-0">
                                <ShoppingBag size={18} className="text-success-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">{sale.notes || 'Daily Counter'}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{formatDate(sale.date)}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <p className="text-sm font-black text-success-700">{formatCurrency(sale.amount)}</p>
                                <button onClick={() => openEdit(sale)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"><Pencil size={14} /></button>
                                <button onClick={() => handleDelete(sale.id)} className="p-1.5 rounded-lg hover:bg-danger-50 text-slate-400 hover:text-danger-500 transition-colors"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title={editing ? 'Edit Sale' : 'Record Counter Sales'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Date</label>
                        <input type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Counter Amount (₹)</label>
                        <input type="number" required min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Notes (optional)</label>
                        <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="e.g. Morning tiffin, Parcel orders"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none" />
                    </div>
                    <button type="submit" className="w-full py-3.5 bg-primary-600 text-white font-bold rounded-2xl active:bg-primary-700 transition-colors">
                        {editing ? 'Update Sale' : 'Save Sale'}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
