import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Package, TrendingDown, Trash2, Pencil, Banknote, CreditCard, Building2, Search, Filter, ChevronDown } from 'lucide-react';
import { DateInput } from '../components/ui/DateInput';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { formatCurrency, formatCurrencyFull, formatDate, today } from '../utils/format';
import { useToast } from '../contexts/ToastContext';
import { TopBar } from '../components/layout/TopBar';
import { cn } from '../utils/cn';
import api from '../utils/api';

const FALLBACK_UNITS = ['kg', 'g', 'ltr', 'ml', 'pieces', 'packets', 'bundles', 'dozens', 'Bags', 'Cartons'];

const PAYMENT_MODES = [
    { id: 'cash', label: 'Cash', icon: Banknote },
    { id: 'upi',  label: 'UPI',  icon: CreditCard },
    { id: 'bank', label: 'Bank', icon: Building2 },
];

function PaymentModeChips({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <div className="flex gap-2">
            {PAYMENT_MODES.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" onClick={() => onChange(id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-sm font-black transition-all border ${
                        value === id
                            ? 'bg-green-600 text-white border-green-600 shadow-lg shadow-green-500/20'
                            : 'bg-white text-slate-500 border-slate-200 active:bg-slate-50'
                    }`}>
                    <Icon size={15} strokeWidth={2.5} /> {label}
                </button>
            ))}
        </div>
    );
}

export function MaterialDetail() {
    const { id } = useParams();
    const { toast } = useToast();
    const [material, setMaterial] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [units, setUnits] = useState<string[]>(FALLBACK_UNITS);
    const [purchases, setPurchases] = useState<any[]>([]);
    const [usage, setUsage] = useState<any[]>([]);
    const [vendors, setVendors] = useState<any[]>([]);
    const [tab, setTab] = useState<'purchases' | 'usage'>('purchases');
    const [showPurchase, setShowPurchase] = useState(false);
    const [showUsage, setShowUsage] = useState(false);
    const [showEdit, setShowEdit] = useState(false);

    const [purchaseForm, setPurchaseForm] = useState({ vendor_id: '', quantity: '', price_per_unit: '', purchase_date: today(), notes: '', paid_amount: '', payment_mode: 'cash' });
    const [usageForm, setUsageForm] = useState({ quantity_used: '', usage_date: today(), notes: '' });
    const [editForm, setEditForm] = useState({ name: '', unit: 'kg', min_stock: '0', conversion_factor: '', base_unit: '' });

    const [showEditPurchase, setShowEditPurchase] = useState(false);
    const [editPurchaseForm, setEditPurchaseForm] = useState({ 
        id: 0, 
        vendor_id: '', 
        quantity: '', 
        price_per_unit: '', 
        purchase_date: '', 
        notes: '', 
        bill_id: null as number | null,
        paid_amount: '',
        payment_mode: 'cash',
        bill_items: [] as any[] // to keep bill integrity on update
    });

    const [showEditUsage, setShowEditUsage] = useState(false);
    const [editUsageForm, setEditUsageForm] = useState({ id: 0, quantity_used: '', usage_date: '', notes: '' });

    const [deletePurchaseId, setDeletePurchaseId] = useState<number | null>(null);
    const [deleteUsageId, setDeleteUsageId] = useState<number | null>(null);

    // Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStart, setFilterStart] = useState('');
    const [filterEnd, setFilterEnd] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const fetchAll = useCallback(async () => {
        try {
            const [mats, vends, purcs, usgs, settingsRes] = await Promise.all([
                api.get('/materials'),
                api.get('/vendors'),
                api.get(`/materials/${id}/purchases`),
                api.get(`/materials/${id}/usage`),
                api.get('/settings').catch(() => ({ data: {} }))
            ]);
            const mat = mats.data.find((m: any) => String(m.id) === id);
            setMaterial(mat);
            setEditForm({
                name: mat?.name || '',
                unit: mat?.unit || 'kg',
                min_stock: mat?.min_stock || '0',
                conversion_factor: mat?.conversion_factor ? String(mat.conversion_factor) : '',
                base_unit: mat?.base_unit || '',
            });
            setVendors(vends.data);
            setPurchases(purcs.data);
            setUsage(usgs.data);
            if (settingsRes.data.material_units) setUnits(settingsRes.data.material_units);
        } catch { toast('Failed to load material', 'error'); }
    }, [id, toast]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handlePurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // For bag/carton materials, quantity is stored in primary unit (bags/cartons).
            // The backend applies conversion_factor when computing stock.
            const res = await api.post(`/materials/${id}/purchase`, {
                ...purchaseForm,
                quantity: purchaseForm.quantity,
            });

            const merged = res.data?.merged;
            toast(merged ? 'Added to existing bill (merged)' : 'Purchase logged & bill created');
            setShowPurchase(false);
            setPurchaseForm({ vendor_id: '', quantity: '', price_per_unit: '', purchase_date: today(), notes: '', paid_amount: '', payment_mode: 'cash' });
            fetchAll();
        } catch {
            toast('Failed to log purchase', 'error');
            setPurchaseForm(f => ({ ...f, paid_amount: '', payment_mode: 'cash' }));
        }
        finally { setSaving(false); }
    };

    const handleEditPurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editPurchaseForm.bill_id) {
                // If it's a bill, we update the whole bill via PUT /vendor-bills/:id
                // We must update the specific item within the bill items list
                const updatedItems = editPurchaseForm.bill_items.map(it => {
                    // bill item might have different ID but we match by material_id in this context if it's the one being edited
                    // Better: editPurchaseForm stores which specific bill item matches this purchase
                    if (String(it.material_id) === id) { // This assumes one entry of this material per bill
                        return { 
                            ...it, 
                            quantity: editPurchaseForm.quantity, 
                            price_per_unit: editPurchaseForm.price_per_unit 
                        };
                    }
                    return it;
                });

                await api.put(`/vendor-bills/${editPurchaseForm.bill_id}`, {
                    bill_date: editPurchaseForm.purchase_date,
                    items: updatedItems,
                    paid_amount: parseFloat(editPurchaseForm.paid_amount || '0'),
                    payment_mode: editPurchaseForm.payment_mode,
                    notes: editPurchaseForm.notes
                });
            } else {
                // Direct purchase update
                await api.put(`/purchases/${editPurchaseForm.id}`, editPurchaseForm);
            }
            toast('Purchase updated');
            setShowEditPurchase(false);
            fetchAll();
        } catch (err) { 
            console.error('Update purchase error:', err);
            toast('Failed to update', 'error'); 
        } finally { setSaving(false); }
    };

    const openEditPurchase = async (p: any) => {
        let billData: any = null;
        if (p.bill_id) {
            try {
                const res = await api.get(`/vendor-bills/${p.bill_id}`);
                billData = res.data;
            } catch { toast('Failed to load bill details', 'error'); }
        }

        setEditPurchaseForm({
            id: p.id,
            vendor_id: p.vendor_id || '',
            quantity: p.quantity,
            price_per_unit: p.price_per_unit,
            purchase_date: p.purchase_date ? String(p.purchase_date).split('T')[0] : today(),
            notes: (billData ? billData.notes : p.notes) || '',
            bill_id: p.bill_id || null,
            paid_amount: billData ? String(billData.paid_amount) : '',
            payment_mode: billData ? (billData.payment_mode || 'cash') : 'cash',
            bill_items: billData ? billData.items : []
        });
        setShowEditPurchase(true);
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

    const handleEditUsage = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put(`/usage/${editUsageForm.id}`, editUsageForm);
            toast('Usage updated');
            setShowEditUsage(false);
            fetchAll();
        } catch { toast('Failed to update', 'error'); }
    };

    const openEditUsage = (u: any) => {
        setEditUsageForm({ id: u.id, quantity_used: u.quantity_used, usage_date: u.usage_date ? String(u.usage_date).split('T')[0] : today(), notes: u.notes || '' });
        setShowEditUsage(true);
    };

    const confirmDeleteUsage = async () => {
        if (!deleteUsageId) return;
        try { await api.delete(`/usage/${deleteUsageId}`); toast('Deleted'); fetchAll(); }
        catch { toast('Failed', 'error'); }
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

    const confirmDeletePurchase = async () => {
        if (!deletePurchaseId) return;
        try { await api.delete(`/purchases/${deletePurchaseId}`); toast('Deleted'); fetchAll(); }
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
    const cf    = parseFloat(material.conversion_factor || 0);
    const isBagOrCarton = cf > 0 && (
        material.unit?.toLowerCase().includes('bag') ||
        material.unit?.toLowerCase().includes('carton')
    );
    // min_stock is in primary unit (cartons/bags); convert to base units for comparison
    const minStockBase = parseFloat(material.min_stock || 0) * (isBagOrCarton ? cf : 1);
    const isLow = stock <= minStockBase;
    // Display helpers
    const stockBaseUnit    = isBagOrCarton ? (material.base_unit || 'units') : material.unit;
    const stockInPrimary   = isBagOrCarton && cf > 0 ? (stock / cf) : null;

    const inputCls = "w-full h-12 px-4 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 shadow-sm";
    const labelCls = "text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1";

    return (
        <div className="min-h-dvh bg-slate-50 flex flex-col max-w-md mx-auto shadow-xl overflow-hidden pb-24">
            <TopBar title={material.name} showBack rightAction={
                <button onClick={() => setShowEdit(true)} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"><Pencil size={18} /></button>
            } />
            <main className="flex-1 min-h-0 overflow-y-auto">
                <div className="p-4 space-y-4 pb-safe">
                    {/* Stock Card */}
                    <div className={cn('rounded-[32px] p-6 border shadow-sm relative overflow-hidden', isLow ? 'bg-white border-danger-200' : 'bg-white border-success-200')}>
                        <div className={cn('absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-10', isLow ? 'bg-danger-500' : 'bg-success-500')} />
                        <p className={cn('text-[10px] font-black uppercase tracking-widest mb-1 relative z-10', isLow ? 'text-danger-600' : 'text-success-600')}>Current Inventory Level</p>
                        <p className={cn('text-4xl font-black relative z-10 leading-tight', isLow ? 'text-danger-900' : 'text-success-900')}>
                            {stock.toFixed(2)} <span className="text-xl font-bold opacity-60 ml-0.5">{stockBaseUnit}</span>
                        </p>
                        {stockInPrimary !== null && (
                            <p className="text-sm font-bold opacity-50 mt-1 relative z-10">
                                ≈ {stockInPrimary.toFixed(1)} {material.unit}
                            </p>
                        )}
                        {isLow && (
                            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-danger-50 text-danger-700 rounded-full border border-danger-100 relative z-10">
                                <span className="w-1.5 h-1.5 rounded-full bg-danger-600 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-tighter">
                                    Below Threshold ({material.min_stock} {material.unit})
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setShowPurchase(true)} className="h-14 bg-primary-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 active:scale-95 transition-all">
                            <Plus size={18} /> Purchase
                        </button>
                        <button onClick={() => setShowUsage(true)} className="h-14 bg-white border border-slate-200 text-slate-900 font-black rounded-2xl flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all">
                            <TrendingDown size={18} className="text-orange-600" /> Usage Log
                        </button>
                    </div>

                    {/* Filter Bar */}
                    <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className="w-full px-5 py-3 flex items-center justify-between active:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Filter size={16} className={cn("transition-colors", (filterStart || filterEnd || searchQuery) ? "text-primary-600" : "text-slate-400")} />
                                <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Filter History</span>
                                {(filterStart || filterEnd || searchQuery) && (
                                    <span className="flex h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                {(filterStart || filterEnd || searchQuery) && (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSearchQuery('');
                                            setFilterStart('');
                                            setFilterEnd('');
                                        }}
                                        className="text-[10px] font-black text-primary-600 uppercase tracking-tighter hover:underline"
                                    >
                                        Clear
                                    </button>
                                )}
                                <ChevronDown size={16} className={cn("text-slate-300 transition-transform duration-300", showFilters && "rotate-180")} />
                            </div>
                        </button>

                        <div className={cn(
                            "px-5 transition-all duration-300 ease-in-out overflow-hidden",
                            showFilters ? "max-h-96 pb-5 opacity-100" : "max-h-0 opacity-0"
                        )}>
                            <div className="space-y-4 pt-2">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                    <input 
                                        placeholder="Search by vendor, notes..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full h-11 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:border-primary-500 transition-all outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <DateInput 
                                        label="From Date"
                                        value={filterStart}
                                        onChange={e => setFilterStart(e.target.value)}
                                    />
                                    <DateInput 
                                        label="To Date"
                                        value={filterEnd}
                                        onChange={e => setFilterEnd(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-slate-200/50 rounded-2xl p-1.5">
                        {(['purchases', 'usage'] as const).map(t => (
                            <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2.5 text-xs font-black rounded-xl transition-all capitalize uppercase tracking-widest', tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400')}>
                                {t === 'purchases' ? 'Purchases' : 'Usage History'}
                            </button>
                        ))}
                    </div>

                    {tab === 'purchases' ? (
                        <div className="space-y-2">
                            {(() => {
                                const filtered = purchases.filter(p => {
                                    const dateMatch = (!filterStart || p.purchase_date >= filterStart) && 
                                                      (!filterEnd   || p.purchase_date <= filterEnd);
                                    const search = searchQuery.toLowerCase();
                                    const textMatch = !search || 
                                                      (p.vendor_name || 'Generic Vendor').toLowerCase().includes(search) ||
                                                      (p.notes || '').toLowerCase().includes(search);
                                    return dateMatch && textMatch;
                                });

                                if (filtered.length === 0) return (
                                    <div className="bg-white rounded-[32px] border border-slate-100 py-12 flex flex-col items-center gap-3 text-center px-6">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                                            <Package size={22} className="text-slate-200" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">No matching purchase records</p>
                                            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search query</p>
                                        </div>
                                    </div>
                                );

                                return filtered.map((p: any) => (
                                    <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-3 active:bg-slate-50 transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <p className="text-sm font-black text-slate-900">{p.quantity} {material.unit}</p>
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">from</span>
                                                <p className="text-xs font-bold text-primary-600 truncate">{p.vendor_name || 'Generic Vendor'}</p>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic tracking-tight">{formatCurrencyFull(p.price_per_unit)}/{material.unit} · {formatDate(p.purchase_date)}</p>
                                            {p.notes && <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 italic">{p.notes}</p>}
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="flex flex-col items-end gap-1">
                                                <p className="text-base font-black text-slate-900">{formatCurrency(p.total_amount)}</p>
                                                {p.vendor_id && (
                                                    <span className={cn(
                                                        "text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter",
                                                        parseFloat(p.paid_amount || '0') >= parseFloat(p.bill_total || '0')
                                                            ? "bg-green-100 text-green-700"
                                                            : parseFloat(p.paid_amount || '0') > 0
                                                                ? "bg-blue-100 text-blue-700"
                                                                : "bg-orange-100 text-orange-700"
                                                    )}>
                                                        {parseFloat(p.paid_amount || '0') >= parseFloat(p.bill_total || '0') 
                                                            ? 'Paid' 
                                                            : parseFloat(p.paid_amount || '0') > 0 
                                                                ? 'Partial' 
                                                                : 'Credit'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-end gap-1.5 mt-2">
                                                <button onClick={() => openEditPurchase(p)} 
                                                    className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 active:text-primary-600 transition-all active:scale-90">
                                                    <Pencil size={18} />
                                                </button>
                                                <button onClick={() => setDeletePurchaseId(p.id)} 
                                                    className="p-2.5 rounded-xl hover:bg-danger-50 text-slate-400 active:text-danger-600 transition-all active:scale-90">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {(() => {
                                const filtered = usage.filter(u => {
                                    const dateMatch = (!filterStart || u.usage_date >= filterStart) && 
                                                      (!filterEnd   || u.usage_date <= filterEnd);
                                    const search = searchQuery.toLowerCase();
                                    const textMatch = !search || (u.notes || '').toLowerCase().includes(search);
                                    return dateMatch && textMatch;
                                });

                                if (filtered.length === 0) return (
                                    <div className="bg-white rounded-[32px] border border-slate-100 py-12 flex flex-col items-center gap-3 text-center px-6">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                                            <TrendingDown size={22} className="text-slate-200" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">No matching usage logs</p>
                                            <p className="text-xs text-slate-400 mt-1">Adjust filters to see consumption history</p>
                                        </div>
                                    </div>
                                );

                                return filtered.map((u: any) => {
                                    const qty = parseFloat(u.quantity_used);
                                    const containerEq = isBagOrCarton && cf > 0
                                        ? `≈ ${(qty / cf).toFixed(1)} ${material.unit.toLowerCase()}`
                                        : null;
                                    return (
                                        <div key={u.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-3 active:bg-slate-50 transition-colors">
                                            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                                                <TrendingDown size={16} className="text-orange-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-slate-900">
                                                    Used <span className="text-orange-600">{Number.isInteger(qty) ? qty : qty.toFixed(2)} {stockBaseUnit}</span>
                                                    {containerEq && <span className="text-slate-400 font-bold text-xs ml-1">({containerEq})</span>}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">{formatDate(u.usage_date)}{u.notes && ` · ${u.notes}`}</p>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button onClick={() => openEditUsage(u)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"><Pencil size={14} /></button>
                                                <button onClick={() => setDeleteUsageId(u.id)} className="p-2 rounded-lg hover:bg-danger-50 text-slate-400 transition-colors"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    )}
                </div>
            </main>

            {/* Log Purchase Modal */}
            <Modal isOpen={showPurchase} onClose={() => {
                setShowPurchase(false);
                setPurchaseForm({ vendor_id: '', quantity: '', price_per_unit: '', purchase_date: today(), notes: '', paid_amount: '', payment_mode: 'cash' });
            }} title="Log Material Purchase">
                <form onSubmit={handlePurchase} className="space-y-5 pt-3">
                    <div className="bg-slate-50 p-5 rounded-[32px] border border-slate-100 space-y-5">
                        <div>
                            <label className={labelCls}>Supplier / Vendor</label>
                            <select value={purchaseForm.vendor_id} onChange={e => setPurchaseForm(f => ({ ...f, vendor_id: e.target.value, paid_amount: '', payment_mode: 'cash' }))} className={inputCls}>
                                <option value="">General Purchase</option>
                                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Quantity ({material.unit})</label>
                                <input required type="number" min="0.01" step="0.01" placeholder="0.00"
                                    value={purchaseForm.quantity}
                                    onChange={e => setPurchaseForm(f => ({ ...f, quantity: e.target.value }))}
                                    className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Price / {material.unit}</label>
                                <input required type="number" min="0" step="0.01" placeholder="₹0.00"
                                    value={purchaseForm.price_per_unit}
                                    onChange={e => setPurchaseForm(f => ({ ...f, price_per_unit: e.target.value }))}
                                    className={inputCls} />
                            </div>
                        </div>
                        {isBagOrCarton && cf > 0 && purchaseForm.quantity && (
                            <div className="bg-indigo-50 py-2.5 px-4 rounded-2xl border border-indigo-100 text-center">
                                <p className="text-xs font-black text-indigo-600">
                                    = {(parseFloat(purchaseForm.quantity) * cf).toFixed(0)} {material.base_unit || 'units'} added to stock
                                </p>
                            </div>
                        )}

                                    <div className="grid grid-cols-1 gap-5">

                            <DateInput
                                label="Purchase Date"
                                value={purchaseForm.purchase_date}
                                onChange={e => setPurchaseForm(f => ({ ...f, purchase_date: e.target.value }))}
                            />

                            <div>
                                <label className={labelCls}>Transaction Notes</label>
                                <textarea placeholder="Optional details..." value={purchaseForm.notes} onChange={e => setPurchaseForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                                    className="w-full px-5 py-3 bg-white border border-slate-200 rounded-3xl text-base font-bold text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 resize-none" />
                            </div>
                        </div>
                    </div>

                    {/* Payment section — only for vendor purchases */}
                    {purchaseForm.vendor_id && (
                        <div className="bg-slate-50 p-5 rounded-[32px] border border-slate-100 space-y-4">
                            <div>
                                <label className={labelCls}>Amount Paid (₹)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-base">₹</span>
                                    <input type="number" step="0.01" min="0" placeholder="0.00"
                                        value={purchaseForm.paid_amount}
                                        onChange={e => setPurchaseForm(f => ({ ...f, paid_amount: e.target.value }))}
                                        className="w-full h-12 pl-9 pr-4 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 shadow-sm" />
                                </div>
                                {(() => {
                                    const total = parseFloat(purchaseForm.quantity || '0') * parseFloat(purchaseForm.price_per_unit || '0');
                                    return total > 0 ? (
                                        <button type="button"
                                            onClick={() => setPurchaseForm(f => ({ ...f, paid_amount: total.toFixed(2) }))}
                                            className="mt-2 text-[10px] font-black text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl active:bg-green-100 transition-colors">
                                            Full Payment · {formatCurrencyFull(total)}
                                        </button>
                                    ) : null;
                                })()}
                            </div>
                            {parseFloat(purchaseForm.paid_amount || '0') > 0 && (
                                <div>
                                    <label className={labelCls}>Payment Mode *</label>
                                    <PaymentModeChips value={purchaseForm.payment_mode} onChange={v => setPurchaseForm(f => ({ ...f, payment_mode: v }))} />
                                </div>
                            )}
                            <p className="text-[10px] text-slate-400 font-bold px-1">
                                Purchases from the same vendor on the same day within 2 hours are merged into one bill automatically.
                            </p>
                        </div>
                    )}

                    <button type="submit" disabled={saving} className="w-full py-4.5 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-500/20 active:scale-95 transition-all disabled:opacity-60">
                        {saving ? 'Saving…' : 'Confirm & Log Purchase'}
                    </button>
                </form>
            </Modal>

            {/* Edit Purchase Modal */}
            <Modal isOpen={showEditPurchase} onClose={() => setShowEditPurchase(false)} title="Update Purchase Log">
                <form onSubmit={handleEditPurchase} className="space-y-5 pt-3">
                    <div className="bg-slate-50 p-5 rounded-[32px] border border-slate-100 space-y-5">
                        <div>
                            <label className={labelCls}>Supplier / Vendor</label>
                            <select value={editPurchaseForm.vendor_id} onChange={e => setEditPurchaseForm(f => ({ ...f, vendor_id: e.target.value }))} className={inputCls}>
                                <option value="">General Purchase</option>
                                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Quantity ({material.unit})</label>
                                <input required type="number" min="0.01" step="0.01" value={editPurchaseForm.quantity} onChange={e => setEditPurchaseForm(f => ({ ...f, quantity: e.target.value }))} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Price / Unit</label>
                                <input required type="number" min="0" step="0.01" value={editPurchaseForm.price_per_unit} onChange={e => setEditPurchaseForm(f => ({ ...f, price_per_unit: e.target.value }))} className={inputCls} />
                            </div>
                        </div>
                        <DateInput 
                            label="Purchase Date"
                            value={editPurchaseForm.purchase_date}
                            onChange={e => setEditPurchaseForm(f => ({ ...f, purchase_date: e.target.value }))}
                        />
                        <div>
                            <label className={labelCls}>Notes</label>
                            <textarea value={editPurchaseForm.notes} onChange={e => setEditPurchaseForm(f => ({ ...f, notes: e.target.value }))} rows={1} className="w-full px-5 py-3 bg-white border border-slate-200 rounded-3xl text-base font-bold text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 resize-none" />
                        </div>

                        {editPurchaseForm.bill_id && (
                            <div className="border-t border-slate-200 pt-5 space-y-4">
                                <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest px-1">Bill Payment Information</p>
                                <div>
                                    <label className={labelCls}>Amount Paid (₹)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-base">₹</span>
                                        <input type="number" step="0.01" min="0" placeholder="0.00" value={editPurchaseForm.paid_amount}
                                            onChange={e => setEditPurchaseForm(f => ({ ...f, paid_amount: e.target.value }))}
                                            className="w-full h-12 pl-9 pr-4 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 shadow-sm" />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>Payment Mode</label>
                                    <PaymentModeChips value={editPurchaseForm.payment_mode} onChange={mode => setEditPurchaseForm(f => ({ ...f, payment_mode: mode }))} />
                                </div>
                            </div>
                        )}
                    </div>
                    <button type="submit" disabled={saving} className="w-full py-4.5 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-500/20 active:scale-95 transition-all outline-none disabled:opacity-60">
                        {saving ? 'Updating…' : 'Update Purchase Entry'}
                    </button>
                </form>
            </Modal>

            {/* Log Usage Modal */}
            <Modal isOpen={showUsage} onClose={() => { setShowUsage(false); setUsageForm({ quantity_used: '', usage_date: today(), notes: '' }); }} title="Log Consumption">
                <form onSubmit={handleUsage} className="space-y-5 pt-3">
                    <div className="bg-slate-50 p-5 rounded-[32px] border border-slate-100 space-y-5">
                        {/* Natural prompt */}
                        <div className="text-center pb-1">
                            <p className="text-base font-black text-slate-700">
                                How many <span className="text-orange-600">{stockBaseUnit}</span> of{' '}
                                <span className="text-slate-900">{material.name}</span> used?
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5 font-bold">
                                {isBagOrCarton
                                    ? `Enter in ${stockBaseUnit} — we'll calculate ${material.unit.toLowerCase()} for you`
                                    : `Enter the quantity consumed`}
                            </p>
                        </div>

                        {/* Big single input */}
                        <div className="relative">
                            <input
                                required
                                type="number"
                                min="0.01"
                                step="0.01"
                                inputMode="decimal"
                                placeholder={isBagOrCarton
                                    ? `e.g. ${cf > 0 ? Math.round(cf * 0.5) : 10}`
                                    : `e.g. ${material.unit?.toLowerCase() === 'kg' ? '2.5' : '5'}`}
                                value={usageForm.quantity_used}
                                onChange={e => setUsageForm(f => ({ ...f, quantity_used: e.target.value }))}
                                className="w-full h-16 px-5 pr-24 bg-white border-2 border-slate-200 rounded-2xl text-2xl font-black text-slate-900 focus:border-orange-400 focus:shadow-lg focus:shadow-orange-500/10 transition-all outline-none shadow-sm"
                            />
                            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-base font-black text-slate-400 pointer-events-none">
                                {stockBaseUnit}
                            </span>
                        </div>

                        {/* Live container preview */}
                        {isBagOrCarton && cf > 0 && usageForm.quantity_used && parseFloat(usageForm.quantity_used) > 0 && (
                            <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 flex items-center justify-between">
                                <span className="text-xs font-black text-orange-700 uppercase tracking-widest">Container equiv.</span>
                                <span className="text-sm font-black text-orange-900">
                                    ≈ {(parseFloat(usageForm.quantity_used) / cf).toFixed(2)} {material.unit.toLowerCase()}
                                </span>
                            </div>
                        )}

                        <DateInput
                            label="Date of Usage"
                            value={usageForm.usage_date}
                            onChange={e => setUsageForm(f => ({ ...f, usage_date: e.target.value }))}
                        />

                        <div>
                            <label className={labelCls}>Notes (optional)</label>
                            <textarea
                                placeholder={`e.g. Morning prep, ${material.name.toLowerCase()} for batter`}
                                value={usageForm.notes}
                                onChange={e => setUsageForm(f => ({ ...f, notes: e.target.value }))}
                                rows={2}
                                className="w-full px-5 py-3 bg-white border border-slate-200 rounded-3xl text-base font-bold text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 resize-none"
                            />
                        </div>
                    </div>

                    <button type="submit" className="w-full py-4.5 bg-orange-600 text-white font-black rounded-2xl shadow-xl shadow-orange-500/20 active:scale-95 transition-all">
                        Confirm Consumption
                    </button>
                </form>
            </Modal>

            {/* Edit Usage Modal */}
            <Modal isOpen={showEditUsage} onClose={() => setShowEditUsage(false)} title="Edit Consumption Entry">
                <form onSubmit={handleEditUsage} className="space-y-5 pt-3">
                    <div className="bg-slate-50 p-5 rounded-[32px] border border-slate-100 space-y-5">
                        <div>
                            <label className={labelCls}>{stockBaseUnit} Consumed</label>
                            <div className="relative">
                                <input required type="number" min="0.01" step="0.01" inputMode="decimal"
                                    value={editUsageForm.quantity_used}
                                    onChange={e => setEditUsageForm(f => ({ ...f, quantity_used: e.target.value }))}
                                    className="w-full h-14 px-5 pr-20 bg-white border-2 border-slate-200 rounded-2xl text-xl font-black text-slate-900 focus:border-orange-400 transition-all outline-none shadow-sm" />
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400 pointer-events-none">{stockBaseUnit}</span>
                            </div>
                            {isBagOrCarton && cf > 0 && editUsageForm.quantity_used && parseFloat(editUsageForm.quantity_used) > 0 && (
                                <p className="text-xs font-black text-orange-600 mt-2 px-1">
                                    ≈ {(parseFloat(editUsageForm.quantity_used) / cf).toFixed(2)} {material.unit.toLowerCase()}
                                </p>
                            )}
                        </div>
                        <DateInput 
                            label="Usage Date"
                            value={editUsageForm.usage_date}
                            onChange={e => setEditUsageForm(f => ({ ...f, usage_date: e.target.value }))}
                        />
                        <div>
                            <label className={labelCls}>Notes</label>
                            <textarea value={editUsageForm.notes} onChange={e => setEditUsageForm(f => ({ ...f, notes: e.target.value }))} rows={1} className="w-full px-5 py-3 bg-white border border-slate-200 rounded-3xl text-base font-bold text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 resize-none" />
                        </div>
                    </div>
                    <button type="submit" className="w-full py-4.5 bg-orange-600 text-white font-black rounded-2xl shadow-xl shadow-orange-500/20 active:scale-95 transition-all">
                        Update Consumption Entry
                    </button>
                </form>
            </Modal>

            {/* Edit Material Modal */}
            <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Master Material Settings">
                <form onSubmit={handleEdit} className="space-y-5 pt-3">
                    <div className="bg-slate-50 p-5 rounded-[32px] border border-slate-100 space-y-5">
                        <div>
                            <label className={labelCls}>Display Name</label>
                            <input required value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Standard Unit</label>
                                <select value={editForm.unit} onChange={e => {
                                    const unit = e.target.value;
                                    const base = unit.toLowerCase().includes('bag') ? 'kg' : unit.toLowerCase().includes('carton') ? 'units' : '';
                                    setEditForm(f => ({ ...f, unit, base_unit: base, conversion_factor: '' }));
                                }} className={inputCls}>
                                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Minimum Threshold</label>
                                <input type="number" min="0" step="0.01" value={editForm.min_stock} onChange={e => setEditForm(f => ({ ...f, min_stock: e.target.value }))} className={inputCls} />
                            </div>
                        </div>

                        {(editForm.unit?.toLowerCase().includes('bag') || editForm.unit?.toLowerCase().includes('carton')) && (
                             <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                <label className={labelCls}>
                                    {editForm.unit.toLowerCase().includes('bag') ? 'KGs per Bag' : 'Units per Carton'}
                                </label>
                                <input required type="number" min="0.01" step="0.01"
                                    placeholder={editForm.unit.toLowerCase().includes('bag') ? "e.g. 25" : "e.g. 12"}
                                    value={editForm.conversion_factor}
                                    onChange={e => setEditForm(f => ({ ...f, conversion_factor: e.target.value }))}
                                    className={inputCls} />
                             </div>
                        )}
                    </div>
                    <button type="submit" className="w-full py-4.5 bg-slate-900 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all">
                        Apply Master Changes
                    </button>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={deletePurchaseId !== null}
                onClose={() => setDeletePurchaseId(null)}
                onConfirm={confirmDeletePurchase}
                title="Delete Purchase Log"
                message="Are you sure you want to delete this purchase entry?"
            />
            <ConfirmModal
                isOpen={deleteUsageId !== null}
                onClose={() => setDeleteUsageId(null)}
                onConfirm={confirmDeleteUsage}
                title="Delete Usage Log"
                message="Are you sure you want to delete this usage entry?"
            />
        </div>
    );
}
