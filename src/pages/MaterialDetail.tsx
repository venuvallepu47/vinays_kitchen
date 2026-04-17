import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Package, TrendingDown, Trash2, Pencil } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { formatCurrency, formatDate, today } from '../utils/format';
import { useToast } from '../contexts/ToastContext';
import { TopBar } from '../components/layout/TopBar';
import { cn } from '../utils/cn';
import api from '../utils/api';

const UNITS = ['kg', 'g', 'ltr', 'ml', 'pieces', 'packets', 'bundles', 'dozens'];

export function MaterialDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [material, setMaterial] = useState<any>(null);
    const [purchases, setPurchases] = useState<any[]>([]);
    const [usage, setUsage] = useState<any[]>([]);
    const [vendors, setVendors] = useState<any[]>([]);
    const [tab, setTab] = useState<'purchases' | 'usage'>('purchases');
    const [showPurchase, setShowPurchase] = useState(false);
    const [showUsage, setShowUsage] = useState(false);
    const [showEdit, setShowEdit] = useState(false);

    const [purchaseForm, setPurchaseForm] = useState({ vendor_id: '', quantity: '', price_per_unit: '', purchase_date: today(), notes: '' });
    const [usageForm, setUsageForm] = useState({ quantity_used: '', usage_date: today(), notes: '' });
    const [editForm, setEditForm] = useState({ name: '', unit: 'kg', min_stock: '0' });

    const fetchAll = useCallback(async () => {
        try {
            const [mats, vends, purcs, usgs] = await Promise.all([
                api.get('/materials'),
                api.get('/vendors'),
                api.get(`/materials/${id}/purchases`),
                api.get(`/materials/${id}/usage`),
            ]);
            const mat = mats.data.find((m: any) => String(m.id) === id);
            setMaterial(mat);
            setEditForm({ name: mat?.name || '', unit: mat?.unit || 'kg', min_stock: mat?.min_stock || '0' });
            setVendors(vends.data);
            setPurchases(purcs.data);
            setUsage(usgs.data);
        } catch { toast('Failed to load material', 'error'); }
    }, [id]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handlePurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/purchases', { ...purchaseForm, material_id: id });
            toast('Purchase logged');
            setShowPurchase(false);
            setPurchaseForm({ vendor_id: '', quantity: '', price_per_unit: '', purchase_date: today(), notes: '' });
            fetchAll();
        } catch { toast('Failed to log purchase', 'error'); }
    };

    const handleUsage = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/usage', { ...usageForm, material_id: id });
            toast('Usage logged');
            setShowUsage(false);
            setUsageForm({ quantity_used: '', usage_date: today(), notes: '' });
            fetchAll();
        } catch { toast('Failed to log usage', 'error'); }
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put(`/materials/${id}`, editForm);
            toast('Material updated');
            setShowEdit(false);
            fetchAll();
        } catch { toast('Failed to update', 'error'); }
    };

    const handleDeletePurchase = async (pid: number) => {
        if (!confirm('Delete this purchase record?')) return;
        try { await api.delete(`/purchases/${pid}`); toast('Deleted'); fetchAll(); }
        catch { toast('Failed', 'error'); }
    };

    if (!material) return (
        <div className="h-dvh bg-slate-50 flex flex-col max-w-md mx-auto shadow-xl overflow-hidden">
            <TopBar title="Material Detail" showBack />
            <div className="flex-1 pt-16 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-600 rounded-full animate-spin" />
            </div>
        </div>
    );

    const stock = parseFloat(material.current_stock || 0);
    const isLow = stock <= parseFloat(material.min_stock || 0);

    const inputCls = "w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500";
    const labelCls = "text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block";

    return (
        <div className="h-dvh bg-slate-50 flex flex-col max-w-md mx-auto shadow-xl overflow-hidden">
            <TopBar title={material.name} showBack rightAction={
                <button onClick={() => setShowEdit(true)} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"><Pencil size={18} /></button>
            } />
            <div className="flex-1 pt-16 pb-4 overflow-y-auto">
                <div className="p-4 space-y-4">
                    {/* Stock Card */}
                    <div className={cn('rounded-2xl p-5 border', isLow ? 'bg-danger-50 border-danger-200' : 'bg-success-50 border-success-200')}>
                        <p className={cn('text-[10px] font-bold uppercase tracking-widest mb-1', isLow ? 'text-danger-600' : 'text-success-600')}>Current Stock</p>
                        <p className={cn('text-3xl font-black', isLow ? 'text-danger-800' : 'text-success-800')}>{stock.toFixed(2)} <span className="text-lg">{material.unit}</span></p>
                        {isLow && <p className="text-xs text-danger-600 font-semibold mt-1">⚠ Below minimum ({material.min_stock} {material.unit})</p>}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setShowPurchase(true)} className="h-12 bg-primary-600 text-white text-sm font-bold rounded-2xl flex items-center justify-center gap-2 active:bg-primary-700">
                            <Plus size={16} /> Log Purchase
                        </button>
                        <button onClick={() => setShowUsage(true)} className="h-12 bg-orange-100 text-orange-800 text-sm font-bold rounded-2xl flex items-center justify-center gap-2 active:bg-orange-200">
                            <TrendingDown size={16} /> Log Usage
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-slate-100 rounded-2xl p-1">
                        {(['purchases', 'usage'] as const).map(t => (
                            <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 text-xs font-bold rounded-xl transition-all capitalize', tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400')}>
                                {t === 'purchases' ? 'Purchases' : 'Usage Logs'}
                            </button>
                        ))}
                    </div>

                    {tab === 'purchases' ? (
                        <div className="space-y-2">
                            {purchases.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-slate-100 py-8 flex flex-col items-center gap-2 text-center">
                                    <Package size={22} className="text-slate-300" />
                                    <p className="text-sm font-bold text-slate-400">No purchases yet</p>
                                </div>
                            ) : purchases.map((p: any) => (
                                <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-900">{p.quantity} {material.unit} from {p.vendor_name || 'Unknown'}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">₹{p.price_per_unit}/{material.unit} · {formatDate(p.purchase_date)}</p>
                                    </div>
                                    <p className="text-sm font-black text-slate-700">{formatCurrency(p.total_amount)}</p>
                                    <button onClick={() => handleDeletePurchase(p.id)} className="p-1.5 rounded-lg hover:bg-danger-50 text-slate-300 hover:text-danger-500 transition-colors"><Trash2 size={14} /></button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {usage.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-slate-100 py-8 flex flex-col items-center gap-2 text-center">
                                    <TrendingDown size={22} className="text-slate-300" />
                                    <p className="text-sm font-bold text-slate-400">No usage logged yet</p>
                                </div>
                            ) : usage.map((u: any) => (
                                <div key={u.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-900">{u.quantity_used} {material.unit} used</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{formatDate(u.usage_date)} {u.notes && `· ${u.notes}`}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Log Purchase Modal */}
            <Modal isOpen={showPurchase} onClose={() => setShowPurchase(false)} title="Log Purchase">
                <form onSubmit={handlePurchase} className="space-y-4">
                    <div>
                        <label className={labelCls}>Vendor</label>
                        <select value={purchaseForm.vendor_id} onChange={e => setPurchaseForm(f => ({ ...f, vendor_id: e.target.value }))} className={inputCls}>
                            <option value="">Select vendor (optional)</option>
                            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Quantity ({material.unit})</label>
                            <input required type="number" min="0.01" step="0.01" placeholder="0" value={purchaseForm.quantity} onChange={e => setPurchaseForm(f => ({ ...f, quantity: e.target.value }))} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Price / {material.unit} (₹)</label>
                            <input required type="number" min="0" step="0.01" placeholder="0" value={purchaseForm.price_per_unit} onChange={e => setPurchaseForm(f => ({ ...f, price_per_unit: e.target.value }))} className={inputCls} />
                        </div>
                    </div>
                    {purchaseForm.quantity && purchaseForm.price_per_unit && (
                        <div className="bg-primary-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-primary-600 font-bold">Total: {formatCurrency(parseFloat(purchaseForm.quantity) * parseFloat(purchaseForm.price_per_unit))}</p>
                        </div>
                    )}
                    <div>
                        <label className={labelCls}>Date</label>
                        <input type="date" value={purchaseForm.purchase_date} onChange={e => setPurchaseForm(f => ({ ...f, purchase_date: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>Notes</label>
                        <input placeholder="Optional notes" value={purchaseForm.notes} onChange={e => setPurchaseForm(f => ({ ...f, notes: e.target.value }))} className={inputCls} />
                    </div>
                    <button type="submit" className="w-full py-3.5 bg-primary-600 text-white font-bold rounded-2xl">Save Purchase</button>
                </form>
            </Modal>

            {/* Log Usage Modal */}
            <Modal isOpen={showUsage} onClose={() => setShowUsage(false)} title="Log Daily Usage">
                <form onSubmit={handleUsage} className="space-y-4">
                    <div>
                        <label className={labelCls}>Quantity Used ({material.unit})</label>
                        <input required type="number" min="0.01" step="0.01" placeholder="0" value={usageForm.quantity_used} onChange={e => setUsageForm(f => ({ ...f, quantity_used: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>Date</label>
                        <input type="date" value={usageForm.usage_date} onChange={e => setUsageForm(f => ({ ...f, usage_date: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>Notes</label>
                        <input placeholder="Optional notes" value={usageForm.notes} onChange={e => setUsageForm(f => ({ ...f, notes: e.target.value }))} className={inputCls} />
                    </div>
                    <button type="submit" className="w-full py-3.5 bg-orange-600 text-white font-bold rounded-2xl">Log Usage</button>
                </form>
            </Modal>

            {/* Edit Material Modal */}
            <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Material">
                <form onSubmit={handleEdit} className="space-y-4">
                    <div>
                        <label className={labelCls}>Name</label>
                        <input required value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>Unit</label>
                        <select value={editForm.unit} onChange={e => setEditForm(f => ({ ...f, unit: e.target.value }))} className={inputCls}>
                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Min Stock Alert</label>
                        <input type="number" min="0" step="0.01" value={editForm.min_stock} onChange={e => setEditForm(f => ({ ...f, min_stock: e.target.value }))} className={inputCls} />
                    </div>
                    <button type="submit" className="w-full py-3.5 bg-primary-600 text-white font-bold rounded-2xl">Update Material</button>
                </form>
            </Modal>
        </div>
    );
}
