import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Search, ShoppingBag, Trash2, Pencil } from 'lucide-react';
import { DateInput } from '../components/ui/DateInput';
import { ListSkeleton } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { formatCurrency, formatDate, today } from '../utils/format';
import { useToast } from '../contexts/ToastContext';
import { cn } from '../utils/cn';
import api from '../utils/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function Sales() {
    const location = useLocation();
    const { toast } = useToast();
    
    // Parse query params for initial filters
    const searchParams = new URLSearchParams(location.search);
    const initialMonth = searchParams.get('month');
    const initialYear = searchParams.get('year');

    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    
    // Filters
    const [filterType, setFilterType] = useState<'month' | 'date' | 'all'>(initialMonth ? 'month' : 'all');
    const [filterMonth, setFilterMonth] = useState(initialMonth ? parseInt(initialMonth) : new Date().getMonth() + 1);
    const [filterYear, setFilterYear] = useState(initialYear ? parseInt(initialYear) : new Date().getFullYear());
    const [filterDate, setFilterDate] = useState(today());

    // CRUD state
    const [showAdd, setShowAdd] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState({ date: today(), cash_amount: '', upi_amount: '', notes: '' });
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Filter by payment mix (entries with at least some of X)
    const [filterMethod, setFilterMethod] = useState<'all' | 'Cash' | 'UPI'>('all');

    const fetchSales = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (filterType === 'month') {
                params.month = filterMonth;
                params.year = filterYear;
            } else if (filterType === 'date') {
                params.date = filterDate;
            }
            const res = await api.get('/sales', { params });
            setSales(res.data);
        } catch { toast('Failed to load sales', 'error'); }
        finally { setLoading(false); }
    }, [filterType, filterMonth, filterYear, filterDate, toast]);

    useEffect(() => { fetchSales(); }, [fetchSales]);

    const openAdd = () => { setForm({ date: today(), cash_amount: '', upi_amount: '', notes: '' }); setEditing(null); setShowAdd(true); };
    const openEdit = (sale: any) => { 
        setForm({ 
            date: sale.date?.split('T')[0] || today(), 
            cash_amount: sale.cash_amount.toString(), 
            upi_amount: sale.upi_amount.toString(),
            notes: sale.notes || ''
        }); 
        setEditing(sale); 
        setShowAdd(true); 
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = {
                ...form,
                cash_amount: parseFloat(form.cash_amount || '0'),
                upi_amount: parseFloat(form.upi_amount || '0')
            };

            if (editing) {
                await api.put(`/sales/${editing.id}`, data);
                toast('Sale updated');
            } else {
                await api.post('/sales', data);
                toast('Sale added');
            }
            setShowAdd(false);
            fetchSales();
        } catch { toast('Failed to save sale', 'error'); }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/sales/${deleteId}`);
            toast('Sale deleted');
            setDeleteId(null);
            fetchSales();
        } catch (err: any) {
            const msg = err.response?.data?.error || 'Failed to delete sale';
            toast(msg, 'error');
        }
    };

    const filtered = sales.filter(s => {
        const matchesQuery = (s.notes || '').toLowerCase().includes(query.toLowerCase()) || 
                            String(parseFloat(s.cash_amount) + parseFloat(s.upi_amount)).includes(query);
        const matchesMethod = filterMethod === 'all' || 
                             (filterMethod === 'Cash' && parseFloat(s.cash_amount) > 0) ||
                             (filterMethod === 'UPI' && parseFloat(s.upi_amount) > 0);
        return matchesQuery && matchesMethod;
    });

    const filterActive = filterType !== 'all' || filterMethod !== 'all';

    return (
        <div className="pb-24">
            <div className="px-4 pt-4 pb-3 flex flex-col gap-3">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search sales…"
                            className="w-full h-10 pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors" />
                    </div>
                    <button onClick={openAdd} className="h-10 px-4 bg-primary-600 text-white text-sm font-bold rounded-xl flex items-center gap-1.5 active:bg-primary-700 shrink-0 shadow-sm transition-all active:scale-95">
                        <Plus size={16} /> Add Sale
                    </button>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        <button onClick={() => setFilterType('all')} className={cn('h-9 px-4 rounded-xl text-[10px] uppercase tracking-wider font-black transition-all border shrink-0', filterType === 'all' ? 'bg-primary-600 border-primary-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500')}>All Time</button>
                        <button onClick={() => setFilterType('month')} className={cn('h-9 px-4 rounded-xl text-[10px] uppercase tracking-wider font-black transition-all border shrink-0', filterType === 'month' ? 'bg-primary-600 border-primary-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500')}>Month</button>
                        <button onClick={() => setFilterType('date')} className={cn('h-9 px-4 rounded-xl text-[10px] uppercase tracking-wider font-black transition-all border shrink-0', filterType === 'date' ? 'bg-primary-600 border-primary-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500')}>Date</button>
                        <div className="w-[1px] h-6 bg-slate-200 shrink-0 mx-1" />
                        <button onClick={() => setFilterMethod(filterMethod === 'Cash' ? 'all' : 'Cash')} className={cn('h-9 px-3 rounded-xl text-[10px] uppercase tracking-wider font-black transition-all border shrink-0', filterMethod === 'Cash' ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500')}>Has Cash</button>
                        <button onClick={() => setFilterMethod(filterMethod === 'UPI' ? 'all' : 'UPI')} className={cn('h-9 px-3 rounded-xl text-[10px] uppercase tracking-wider font-black transition-all border shrink-0', filterMethod === 'UPI' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500')}>Has UPI</button>
                    </div>

                    {(filterType !== 'all') && (
                        <div className="bg-slate-50 rounded-2xl p-3 flex gap-2 border border-slate-100 animate-in fade-in slide-in-from-top-1">
                            {filterType === 'month' && (
                                <>
                                    <select value={filterMonth} onChange={e => setFilterMonth(parseInt(e.target.value))} 
                                        className="flex-1 h-9 px-3 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:outline-none">
                                        {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                                    </select>
                                    <select value={filterYear} onChange={e => setFilterYear(parseInt(e.target.value))} 
                                        className="w-24 h-9 px-3 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:outline-none">
                                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </>
                            )}
                            {filterType === 'date' && (
                                <DateInput 
                                    value={filterDate} 
                                    onChange={e => setFilterDate(e.target.value)}
                                    className="h-9 px-3 text-xs rounded-xl"
                                    containerClassName="flex-1"
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {loading ? <div className="px-4 pt-2"><ListSkeleton /></div> : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 px-4 text-center">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <ShoppingBag size={24} className="text-slate-400" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-700">No sales records found</p>
                        <p className="text-xs text-slate-400 mt-1">{filterActive ? 'Try adjusting your filters' : 'Add today\'s counter amount to get started'}</p>
                    </div>
                </div>
            ) : (
                <div className="px-4 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filtered.length} Entries</p>
                        <p className="text-sm font-black text-slate-900">{formatCurrency(filtered.reduce((sum, s) => sum + parseFloat(s.cash_amount) + parseFloat(s.upi_amount), 0))}</p>
                    </div>
                    {filtered.map(sale => {
                        const total = parseFloat(sale.cash_amount) + parseFloat(sale.upi_amount);
                        return (
                            <div key={sale.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 relative overflow-hidden group active:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center shrink-0 border border-primary-100/50">
                                        <ShoppingBag size={18} className="text-primary-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-900 truncate mb-1">{sale.notes || 'Daily Counter'}</p>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-xs text-slate-400 font-medium">{formatDate(sale.date)}</p>
                                                    <div className="flex items-center gap-2">
                                                        {parseFloat(sale.cash_amount) > 0 && <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase tracking-tighter">Cash</span>}
                                                        {parseFloat(sale.upi_amount) > 0 && <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[9px] font-bold uppercase tracking-tighter">UPI</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-base font-black text-slate-900 leading-none">{formatCurrency(total)}</p>
                                                <div className="flex items-center justify-end gap-1.5 mt-2.5">
                                                    <button onClick={() => openEdit(sale)} 
                                                        className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 active:text-primary-600 active:scale-90 transition-all outline-none">
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button onClick={() => setDeleteId(sale.id)} 
                                                        className="p-2.5 rounded-xl hover:bg-danger-50 text-slate-400 active:text-danger-600 active:scale-90 transition-all outline-none">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Quick Breakdown Bar */}
                                        <div className="mt-3 flex gap-2 items-center">
                                            <div className="flex-1 h-1 bg-slate-50 rounded-full overflow-hidden flex">
                                                <div className="h-full bg-emerald-500" style={{ width: `${(parseFloat(sale.cash_amount) / total) * 100}%` }} />
                                                <div className="h-full bg-indigo-500" style={{ width: `${(parseFloat(sale.upi_amount) / total) * 100}%` }} />
                                            </div>
                                            <p className="text-[9px] font-bold text-slate-400 tabular-nums">
                                                {formatCurrency(sale.cash_amount)} + {formatCurrency(sale.upi_amount)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title={editing ? 'Update Sales Record' : 'Log Daily Counter'}>
                <form onSubmit={handleSubmit} className="space-y-5 pt-3">
                    <div className="bg-slate-50 p-5 rounded-[32px] border border-slate-100 space-y-5">
                        <DateInput 
                            label="Record Date *"
                            required
                            value={form.date}
                            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-emerald-500/5 p-4 rounded-3xl border border-emerald-500/10">
                                <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2 block">💵 Cash In-Hand</label>
                                <input type="number" min="0" step="1" placeholder="₹0" value={form.cash_amount} onChange={e => setForm(f => ({ ...f, cash_amount: e.target.value }))}
                                    className="w-full h-11 bg-white border border-emerald-200 rounded-xl text-base font-black text-slate-900 focus:shadow-md transition-all outline-none focus:border-emerald-500 px-3" />
                            </div>
                            
                            <div className="bg-indigo-500/5 p-4 rounded-3xl border border-indigo-500/10">
                                <label className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-2 block">📱 UPI / QR</label>
                                <input type="number" min="0" step="1" placeholder="₹0" value={form.upi_amount} onChange={e => setForm(f => ({ ...f, upi_amount: e.target.value }))}
                                    className="w-full h-11 bg-white border border-indigo-200 rounded-xl text-base font-black text-slate-900 focus:shadow-md transition-all outline-none focus:border-indigo-500 px-3" />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">Description / Notes</label>
                            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Optional sale summary..."
                                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-3xl text-base font-bold text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 resize-none shadow-sm" />
                        </div>
                    </div>
                    
                    <div className="bg-slate-900 p-6 rounded-[32px] text-white shadow-xl">
                        <div className="flex justify-between items-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Sales Amount</p>
                            <p className="text-2xl font-black">{formatCurrency(parseFloat(form.cash_amount || '0') + parseFloat(form.upi_amount || '0'))}</p>
                        </div>
                        <button type="submit" className="w-full py-4.5 bg-primary-600 text-white font-black rounded-2xl mt-5 active:scale-95 transition-all shadow-lg shadow-primary-500/20 outline-none">
                            {editing ? 'Update Sales Record' : 'Confirm & Save Counter'}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Sale"
                message="Are you sure you want to delete this sale entry?"
            />
        </div>
    );
}
