import React, { useState, useEffect } from 'react';
import { Plus, Search, Package, AlertTriangle, ChevronRight, ShoppingCart, Minus, Banknote, CreditCard, Building2 } from 'lucide-react';
import { DateInput } from '../components/ui/DateInput';
import { useNavigate } from 'react-router-dom';
import { ListSkeleton } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../contexts/ToastContext';
import { formatCurrency, today } from '../utils/format';
import { Combobox } from '../components/ui/Combobox';
import { cn } from '../utils/cn';
import api from '../utils/api';

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

const TODAY = today();
const FALLBACK_UNITS = ['kg', 'g', 'ltr', 'ml', 'pieces', 'packets', 'bundles', 'dozens', 'Bags', 'Cartons'];
type StockItem = { material_id: string; vendor_id: string; quantity: string; price_per_unit: string };

const isBagUnit    = (u?: string) => u?.toLowerCase() === 'bags'    || u?.toLowerCase() === 'bag';
const isCartonUnit = (u?: string) => u?.toLowerCase() === 'cartons' || u?.toLowerCase() === 'carton';
const isContainerUnit = (u?: string) => isBagUnit(u) || isCartonUnit(u);

export function Materials() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [materials, setMaterials] = useState<any[]>([]);
    const [vendors, setVendors] = useState<any[]>([]);
    const [units, setUnits] = useState<string[]>(FALLBACK_UNITS);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [showPurchase, setShowPurchase] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '', unit: 'kg', min_stock: '0', conversion_factor: '', base_unit: ''
    });

    // Stock purchase form
    const [stockItems, setStockItems] = useState<StockItem[]>([{ material_id: '', vendor_id: '', quantity: '', price_per_unit: '' }]);
    const [stockDate, setStockDate] = useState(TODAY);
    const [stockPaidAmount, setStockPaidAmount] = useState('');
    const [stockPayMode, setStockPayMode] = useState('cash');

    const fetchMaterials = async () => {
        try {
            const [matRes, setRes, vendorRes] = await Promise.all([
                api.get('/materials'),
                api.get('/settings').catch(() => ({ data: {} })),
                api.get('/vendors'),
            ]);
            setMaterials(matRes.data);
            setVendors(vendorRes.data);
            if (setRes.data.material_units) setUnits(setRes.data.material_units);
        } catch { toast('Failed to load materials', 'error'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchMaterials(); }, []);

    // Stock purchase helpers
    const updateStockItem = (idx: number, field: keyof StockItem, value: string) =>
        setStockItems(items => items.map((it, i) => i === idx ? { ...it, [field]: value } : it));
    const addStockItem = () => setStockItems(items => [...items, { material_id: '', vendor_id: '', quantity: '', price_per_unit: '' }]);
    const removeStockItem = (idx: number) => setStockItems(items => items.filter((_, i) => i !== idx));
    const stockItemTotal = (it: StockItem) => {
        const v = parseFloat(it.quantity || '0') * parseFloat(it.price_per_unit || '0');
        return isNaN(v) ? 0 : v;
    };
    const stockGrandTotal = stockItems.reduce((s, it) => s + stockItemTotal(it), 0);

    const handleStockPurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        const valid = stockItems.filter(it => it.material_id && parseFloat(it.quantity) > 0 && parseFloat(it.price_per_unit) > 0);
        if (valid.length === 0) { toast('Add at least one valid item', 'error'); return; }
        
        setSaving(true);
        try {
            // Check for manual materials
            const items = await Promise.all(valid.map(async (it) => {
                if (!isNaN(Number(it.material_id))) {
                    return { ...it, material_id: Number(it.material_id) };
                }
                const newMatRes = await api.post('/materials', {
                    name: it.material_id,
                    unit: 'units',
                });
                return { ...it, material_id: newMatRes.data.id };
            }));

            // Group items by vendor_id
            const vendorGroups = items.reduce((acc: Record<string, any[]>, it) => {
                const vid = it.vendor_id || 'unlinked';
                if (!acc[vid]) acc[vid] = [];
                acc[vid].push(it);
                return acc;
            }, {});

            const promises = [];
            const vids = Object.keys(vendorGroups);
            let remainingPaid = parseFloat(stockPaidAmount || '0') || 0;

            for (const vid of vids) {
                const groupItems = vendorGroups[vid];
                if (vid === 'unlinked') {
                    for (const it of groupItems) {
                        promises.push(api.post('/purchases', {
                            material_id: it.material_id,
                            vendor_id: null,
                            quantity: it.quantity,
                            price_per_unit: it.price_per_unit,
                            purchase_date: stockDate,
                        }));
                    }
                } else {
                    const billPaid = remainingPaid;
                    remainingPaid = 0;
                    promises.push(api.post(`/vendors/${vid}/bills`, {
                        bill_date: stockDate,
                        items: groupItems.map(it => ({
                            material_id: it.material_id,
                            quantity: it.quantity,
                            price_per_unit: it.price_per_unit
                        })),
                        paid_amount: billPaid,
                        payment_mode: stockPayMode,
                        notes: 'Recorded from Materials page'
                    }));
                }
            }

            await Promise.all(promises);
            toast(`${valid.length} item${valid.length > 1 ? 's' : ''} added to stock`);
            setShowPurchase(false);
            setStockItems([{ material_id: '', vendor_id: '', quantity: '', price_per_unit: '' }]);
            setStockDate(TODAY);
            setStockPaidAmount('');
            setStockPayMode('cash');
            fetchMaterials();
        } catch (err) { 
            console.error('Stock purchase error:', err);
            toast('Failed to save stock', 'error'); 
        }
        finally { setSaving(false); }
    };

    const handleUnitChange = (unit: string) => {
        const base = isBagUnit(unit) ? 'kg' : isCartonUnit(unit) ? 'units' : '';
        setForm(f => ({ ...f, unit, base_unit: base, conversion_factor: '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isContainerUnit(form.unit) && !form.conversion_factor) {
            toast(`Please enter the ${isBagUnit(form.unit) ? 'KGs per bag' : 'units per carton'}`, 'error');
            return;
        }
        try {
            await api.post('/materials', {
                name: form.name,
                unit: form.unit,
                min_stock: form.min_stock,
                conversion_factor: form.conversion_factor || null,
                base_unit: form.base_unit || null,
            });
            toast('Material added');
            setShowAdd(false);
            setForm({ name: '', unit: 'kg', min_stock: '0', conversion_factor: '', base_unit: '' });
            fetchMaterials();
        } catch { toast('Failed to add material', 'error'); }
    };

    // Stock is stored in base units (kg / pieces). Show with container count alongside.
    const formatStock = (mat: any) => {
        const stock = parseFloat(mat.current_stock || 0);
        const cf    = parseFloat(mat.conversion_factor || 0);
        const bu    = mat.base_unit || mat.unit;
        if (isBagUnit(mat.unit) && cf > 0)
            return `${stock.toFixed(2)} ${bu}  (≈${(stock / cf).toFixed(1)} bags)`;
        if (isCartonUnit(mat.unit) && cf > 0)
            return `${Math.round(stock)} ${bu}  (≈${(stock / cf).toFixed(1)} cartons)`;
        return `${stock.toFixed(2)} ${mat.unit}`;
    };

    const filtered = materials.filter(m => m.name.toLowerCase().includes(query.toLowerCase()));

    const inputCls = "w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all";
    const labelCls = "text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1";

    return (
        <div className="pb-24">
            {/* Search + Action bar */}
            <div className="px-4 pt-4 pb-3 flex flex-col gap-2">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search ingredients…"
                            className="w-full h-10 pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors shadow-sm" />
                    </div>
                    <button onClick={() => setShowAdd(true)} className="h-10 px-3 bg-primary-600 text-white text-sm font-bold rounded-xl flex items-center gap-1.5 active:bg-primary-700 shrink-0 shadow-sm transition-all active:scale-95">
                        <Plus size={16} />
                    </button>
                </div>
                <button onClick={() => setShowPurchase(true)}
                    className="w-full h-10 bg-orange-600 text-white text-sm font-black rounded-xl flex items-center justify-center gap-2 active:bg-orange-700 shadow-sm transition-all active:scale-95">
                    <ShoppingCart size={15} strokeWidth={2.5} /> Record Stock Purchase
                </button>
            </div>

            {/* Material list */}
            {loading ? <div className="px-4"><ListSkeleton /></div> : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 px-4 text-center">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <Package size={24} className="text-slate-400" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-700">{query ? 'No matching supplies' : 'Inventory is empty'}</p>
                        <p className="text-xs text-slate-400 mt-1">Start tracking your ingredients and supplies here</p>
                    </div>
                    {!query && (
                        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-primary-500/10 active:scale-95 transition-all">
                            <Plus size={14} /> Add First Material
                        </button>
                    )}
                </div>
            ) : (
                <div className="px-4 space-y-3">
                    <div className="flex items-center justify-between mb-1 px-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filtered.length} Types in Stock</p>
                    </div>
                    {filtered.map(mat => {
                        const stock    = parseFloat(mat.current_stock || 0);
                        const minStock = parseFloat(mat.min_stock || 0);
                        const isLow    = stock <= minStock;
                        return (
                            <div key={mat.id} onClick={() => navigate(`/materials/${mat.id}`)}
                                className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-4 cursor-pointer active:bg-slate-50 transition-all active:scale-[0.98] group">
                                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-colors', isLow ? 'bg-danger-50 border-danger-100' : 'bg-orange-50 border-orange-100/50')}>
                                    {isLow ? <AlertTriangle size={20} className="text-danger-500" /> : <Package size={20} className="text-orange-600" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900 truncate mb-1">{mat.name}</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Threshold: {minStock} {mat.base_unit || mat.unit}</p>
                                        {isContainerUnit(mat.unit) && <div className="w-1 h-1 rounded-full bg-slate-200" />}
                                        {isContainerUnit(mat.unit) && mat.conversion_factor && (
                                            <p className="text-[10px] font-bold text-primary-500 italic">1 {mat.unit.slice(0, -1)} = {mat.conversion_factor} {mat.base_unit}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="flex flex-col items-end gap-1">
                                        <p className={cn('text-sm font-black leading-tight', isLow ? 'text-danger-600' : 'text-slate-900')}>
                                            {formatStock(mat)}
                                        </p>
                                        {isLow && <span className="text-[9px] font-black bg-danger-600 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">Refill Required</span>}
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-slate-300 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Record Stock Purchase Modal ── */}
            <Modal isOpen={showPurchase} onClose={() => { setShowPurchase(false); setStockItems([{ material_id: '', vendor_id: '', quantity: '', price_per_unit: '' }]); setStockDate(TODAY); }} title="Record Stock Purchase">
                <form onSubmit={handleStockPurchase} className="space-y-5 pt-2">
                    <div className="bg-slate-50 p-5 rounded-[32px] border border-slate-100 space-y-4">
                        <DateInput 
                            label="Purchase Date *"
                            required
                            value={stockDate}
                            onChange={e => setStockDate(e.target.value)}
                        />

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block px-1">Items Purchased *</label>
                            <div className="space-y-3">
                                {stockItems.map((item, idx) => (
                                    <div key={idx} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
                                        <div className="flex gap-2">
                                            <Combobox 
                                                className="flex-1"
                                                options={materials}
                                                value={item.material_id}
                                                placeholder="Search Material..."
                                                onChange={(val) => updateStockItem(idx, 'material_id', String(val))}
                                            />
                                            {stockItems.length > 1 && (
                                                <button type="button" onClick={() => removeStockItem(idx)}
                                                    className="w-12 h-12 rounded-2xl bg-red-50 text-red-400 flex items-center justify-center shrink-0 active:bg-red-100 border border-red-100 transition-colors">
                                                    <Minus size={16} strokeWidth={3} />
                                                </button>
                                            )}
                                        </div>
                                        <select value={item.vendor_id}
                                            onChange={e => updateStockItem(idx, 'vendor_id', e.target.value)}
                                            className="w-full h-12 px-4 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-500 focus:shadow-md transition-all outline-none focus:border-primary-500 shadow-sm">
                                            <option value="">-- No Vendor (unlinked) --</option>
                                            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                        </select>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block px-1">How much? *</label>
                                                <input type="number" step="0.01" min="0" placeholder="0" value={item.quantity}
                                                    onChange={e => updateStockItem(idx, 'quantity', e.target.value)}
                                                    className="w-full h-12 px-3 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 shadow-sm text-center" />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block px-1">Rate / Unit *</label>
                                                <input type="number" step="0.01" min="0" placeholder="0" value={item.price_per_unit}
                                                    onChange={e => updateStockItem(idx, 'price_per_unit', e.target.value)}
                                                    className="w-full h-12 px-3 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 shadow-sm text-center" />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block px-1">Total</label>
                                                <div className="h-12 px-3 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
                                                    <span className="text-base font-black text-slate-700">{formatCurrency(stockItemTotal(item))}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={addStockItem}
                                className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-orange-200 text-orange-600 text-xs font-black active:bg-orange-50 transition-colors">
                                <Plus size={14} strokeWidth={3} /> Add Another Item
                            </button>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-slate-50 p-5 rounded-[32px] border border-slate-100 space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">
                                Amount Paid <span className="text-slate-400 font-medium normal-case">(only for vendor-linked items)</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-base">₹</span>
                                <input type="number" step="0.01" min="0" placeholder="0.00" value={stockPaidAmount}
                                    onChange={e => setStockPaidAmount(e.target.value)}
                                    className="w-full h-12 pl-9 pr-4 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 shadow-sm" />
                            </div>
                            {stockGrandTotal > 0 && (
                                <button type="button"
                                    onClick={() => setStockPaidAmount(stockGrandTotal.toFixed(2))}
                                    className="mt-2 text-[10px] font-black text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl active:bg-green-100 transition-colors">
                                    Full Payment · {formatCurrency(stockGrandTotal)}
                                </button>
                            )}
                        </div>

                        {parseFloat(stockPaidAmount || '0') > 0 && (
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block px-1">Payment Mode *</label>
                                <PaymentModeChips value={stockPayMode} onChange={setStockPayMode} />
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-900 rounded-3xl p-5 px-6 flex items-center justify-between shadow-lg">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Estimated Total</p>
                            <p className="text-2xl font-black text-white leading-none">{formatCurrency(stockGrandTotal)}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                            <span className="text-white opacity-50 font-black">₹</span>
                        </div>
                    </div>

                    <button type="submit" disabled={saving}
                        className="w-full py-4.5 bg-orange-600 text-white font-black rounded-2xl shadow-xl shadow-orange-500/20 active:scale-95 transition-all outline-none disabled:opacity-60">
                        {saving ? 'Saving…' : 'Add to Stock'}
                    </button>
                </form>
            </Modal>

            {/* Add Material Modal */}
            <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="New Inventory Item">
                <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                    <div className="bg-slate-50 p-5 rounded-[32px] border border-slate-100 space-y-4">
                        <div>
                            <label className={labelCls}>Item Name *</label>
                            <input required placeholder="e.g. Basmati Rice, Refined Oil"
                                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                className={cn(inputCls, "bg-white shadow-sm font-bold")} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Standard Unit</label>
                                <select value={form.unit} onChange={e => handleUnitChange(e.target.value)} className={cn(inputCls, "bg-white shadow-sm font-black")}>
                                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>MIn. Stock Alert</label>
                                <input type="number" min="0" step="0.01"
                                    value={form.min_stock} onChange={e => setForm(f => ({ ...f, min_stock: e.target.value }))}
                                    className={cn(inputCls, "bg-white shadow-sm font-bold")} />
                            </div>
                        </div>

                        {/* Bag conversion */}
                        {isBagUnit(form.unit) && (
                            <div className="bg-orange-600/5 rounded-3xl p-5 border border-orange-200/50 space-y-3">
                                <div className="flex items-center gap-2">
                                     <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">📦</div>
                                     <p className="text-[11px] font-black text-orange-700 uppercase tracking-widest leading-none">Bag Capacity Fix</p>
                                </div>
                                <p className="text-[10px] text-orange-600/80 font-bold leading-relaxed px-1">
                                    Stock is tracked in <strong>kg</strong>. How many kilograms does one bag typically weigh?
                                </p>
                                <div className="relative">
                                    <input required type="number" min="0.01" step="0.01"
                                        placeholder="e.g. 25"
                                        value={form.conversion_factor}
                                        onChange={e => setForm(f => ({ ...f, conversion_factor: e.target.value }))}
                                        className={cn(inputCls, "bg-white border-orange-200 focus:ring-orange-500/20 font-black h-11 pr-12")} />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-orange-400 uppercase">KG / Bag</span>
                                </div>
                            </div>
                        )}

                        {/* Carton conversion */}
                        {isCartonUnit(form.unit) && (
                            <div className="bg-indigo-600/5 rounded-3xl p-5 border border-indigo-200/50 space-y-3">
                                <div className="flex items-center gap-2">
                                     <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">📦</div>
                                     <p className="text-[11px] font-black text-indigo-700 uppercase tracking-widest leading-none">Carton Pack Size</p>
                                </div>
                                <p className="text-[10px] text-indigo-600/80 font-bold leading-relaxed px-1">
                                    Stock is tracked in <strong>units</strong>. How many individual pieces are in one carton?
                                </p>
                                <div className="relative">
                                    <input required type="number" min="1" step="1"
                                        placeholder="e.g. 12"
                                        value={form.conversion_factor}
                                        onChange={e => setForm(f => ({ ...f, conversion_factor: e.target.value }))}
                                        className={cn(inputCls, "bg-white border-indigo-200 focus:ring-indigo-500/20 font-black h-11 pr-12")} />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-400 uppercase">PCS / CTN</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <button type="submit" className="w-full py-4 bg-primary-600 text-white font-black rounded-2xl shadow-lg shadow-primary-500/20 active:scale-95 transition-all outline-none">
                        Register Material
                    </button>
                </form>
            </Modal>
        </div>
    );
}
