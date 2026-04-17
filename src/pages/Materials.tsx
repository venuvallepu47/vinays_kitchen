import React, { useState, useEffect } from 'react';
import { Plus, Search, Package, AlertTriangle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ListSkeleton } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../contexts/ToastContext';
import { cn } from '../utils/cn';
import api from '../utils/api';

const UNITS = ['kg', 'g', 'ltr', 'ml', 'pieces', 'packets', 'bundles', 'dozens'];

export function Materials() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [materials, setMaterials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ name: '', unit: 'kg', min_stock: '0' });

    const fetchMaterials = async () => {
        try {
            const res = await api.get('/materials');
            setMaterials(res.data);
        } catch { toast('Failed to load materials', 'error'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchMaterials(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/materials', form);
            toast('Material added');
            setShowAdd(false);
            setForm({ name: '', unit: 'kg', min_stock: '0' });
            fetchMaterials();
        } catch { toast('Failed to add material', 'error'); }
    };

    const filtered = materials.filter(m => m.name.toLowerCase().includes(query.toLowerCase()));

    return (
        <div className="pb-24">
            <div className="px-4 pt-4 pb-3 flex gap-2">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search materials…"
                        className="w-full h-10 pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors" />
                </div>
                <button onClick={() => setShowAdd(true)} className="h-10 px-4 bg-primary-600 text-white text-sm font-bold rounded-xl flex items-center gap-1.5 active:bg-primary-700 shrink-0">
                    <Plus size={16} /> Add
                </button>
            </div>

            {loading ? <div className="px-4"><ListSkeleton /></div> : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 px-4 text-center">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <Package size={24} className="text-slate-400" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-700">No materials yet</p>
                        <p className="text-xs text-slate-400 mt-1">Add ingredients and supplies to track your stock</p>
                    </div>
                    {!query && <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 text-white text-xs font-bold rounded-xl"><Plus size={14} /> Add Material</button>}
                </div>
            ) : (
                <div className="px-4 space-y-2">
                    {filtered.map(mat => {
                        const stock = parseFloat(mat.current_stock || 0);
                        const minStock = parseFloat(mat.min_stock || 0);
                        const isLow = stock <= minStock;
                        return (
                            <div key={mat.id} onClick={() => navigate(`/materials/${mat.id}`)}
                                className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 flex items-center gap-3 cursor-pointer active:bg-slate-50 transition-colors">
                                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', isLow ? 'bg-danger-50' : 'bg-orange-50')}>
                                    {isLow
                                        ? <AlertTriangle size={18} className="text-danger-500" />
                                        : <Package size={18} className="text-orange-600" />
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900 truncate">{mat.name}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Min: {minStock} {mat.unit}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className={cn('text-sm font-black', isLow ? 'text-danger-600' : 'text-slate-700')}>
                                        {stock.toFixed(2)} {mat.unit}
                                    </p>
                                    {isLow && <span className="text-[9px] font-bold bg-danger-100 text-danger-700 px-2 py-0.5 rounded-full uppercase">Low</span>}
                                </div>
                                <ChevronRight size={16} className="text-slate-300 shrink-0" />
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Material">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Material Name *</label>
                        <input required placeholder="e.g. Rice, Onions, Idly Batter" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Unit</label>
                        <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500">
                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Minimum Stock Alert</label>
                        <input type="number" min="0" step="0.01" value={form.min_stock} onChange={e => setForm(f => ({ ...f, min_stock: e.target.value }))}
                            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
                    </div>
                    <button type="submit" className="w-full py-3.5 bg-primary-600 text-white font-bold rounded-2xl">Add Material</button>
                </form>
            </Modal>
        </div>
    );
}
