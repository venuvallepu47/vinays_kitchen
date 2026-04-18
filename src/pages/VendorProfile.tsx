import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Pencil, Trash2, Package, Plus, Minus,
    Banknote, CreditCard, Building2, ChevronDown, ChevronUp,
    TrendingUp, TrendingDown, Clock, ChevronRight
} from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { formatCurrency, formatDate } from '../utils/format';
import { useToast } from '../contexts/ToastContext';
import { TopBar } from '../components/layout/TopBar';
import { DateInput } from '../components/ui/DateInput';
import api from '../utils/api';

const TODAY = new Date().toISOString().split('T')[0];

type BillItem = { material_id: string; quantity: string; price_per_unit: string };
type Bill = {
    id: number; bill_date: string; total_amount: string; paid_amount: string;
    payment_mode: string; notes: string;
    items: { id: number; material_id: string; material_name: string; unit: string; quantity: string; price_per_unit: string; total_amount: string }[];
};
type Payment = { id: number; payment_date: string; amount: string; payment_mode: string; notes: string };
type Summary = { totalCredit: number; totalPaid: number; outstanding: number };

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

function BillCard({ bill, onEdit, onDelete, ...props }: { bill: Bill; onEdit: () => void; onDelete: () => void } & React.HTMLAttributes<HTMLDivElement>) {
    const [expanded, setExpanded] = useState(false);
    const total = parseFloat(bill.total_amount);
    const paid = parseFloat(bill.paid_amount || '0');
    const balance = total - paid;

    return (
        <div {...props} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <button type="button" onClick={() => setExpanded(e => !e)}
                className="w-full text-left p-4 active:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                        <Package size={17} className="text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-900">Bill #{bill.id}</p>
                        <p className="text-[11px] text-slate-400 font-bold">
                            {formatDate(bill.bill_date)} · {bill.items.length} item{bill.items.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-sm font-black text-orange-600">{formatCurrency(total)}</p>
                        <p className={`text-[10px] font-bold mt-0.5 ${balance > 0.01 ? 'text-red-400' : 'text-green-500'}`}>
                            {balance > 0.01 ? `Due ${formatCurrency(balance)}` : 'Paid'}
                        </p>
                    </div>
                    <div className="ml-1 text-slate-300">
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                </div>
            </button>

            {expanded && (
                <div className="border-t border-slate-50 px-4 pb-4 pt-3 space-y-3">
                    <div className="space-y-2">
                        {bill.items.map(item => (
                            <div key={item.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-50 last:border-0">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-800 truncate">{item.material_name}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">
                                        {item.quantity} {item.unit} × {formatCurrency(parseFloat(item.price_per_unit))}
                                    </p>
                                </div>
                                <p className="text-xs font-black text-slate-700 shrink-0">{formatCurrency(parseFloat(item.total_amount))}</p>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-1.5">
                        <div className="bg-orange-50 rounded-xl px-4 py-2 flex justify-between items-center border border-orange-100">
                            <span className="text-xs font-black text-orange-700">Bill Total</span>
                            <span className="text-sm font-black text-orange-700">{formatCurrency(total)}</span>
                        </div>
                        {paid > 0 && (
                            <div className="bg-green-50 rounded-xl px-4 py-2 flex justify-between items-center border border-green-100">
                                <span className="text-xs font-black text-green-700">
                                    Paid ({PAYMENT_MODES.find(m => m.id === bill.payment_mode)?.label || bill.payment_mode})
                                </span>
                                <span className="text-sm font-black text-green-700">{formatCurrency(paid)}</span>
                            </div>
                        )}
                        {balance > 0.01 && (
                            <div className="bg-red-50 rounded-xl px-4 py-2 flex justify-between items-center border border-red-100">
                                <span className="text-xs font-black text-red-600">Balance Due</span>
                                <span className="text-sm font-black text-red-600">{formatCurrency(balance)}</span>
                            </div>
                        )}
                    </div>

                    {bill.notes && <p className="text-[11px] text-slate-400 italic px-1">{bill.notes}</p>}

                    <div className="flex items-center gap-3 pt-1">
                        <button onClick={onEdit}
                            className="text-[10px] font-black text-primary-500 flex items-center gap-1 active:text-primary-700 transition-colors">
                            <Pencil size={11} /> Edit Bill
                        </button>
                        <span className="text-slate-200">·</span>
                        <button onClick={onDelete}
                            className="text-[10px] font-black text-red-400 flex items-center gap-1 active:text-red-600 transition-colors">
                            <Trash2 size={11} /> Delete Bill
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export function VendorProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [vendor, setVendor] = useState<any>(null);
    const [materials, setMaterials] = useState<any[]>([]);
    const [summary, setSummary] = useState<Summary>({ totalCredit: 0, totalPaid: 0, outstanding: 0 });
    const [bills, setBills] = useState<Bill[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [oldPurchases, setOldPurchases] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'ledger' | 'bills' | 'items'>('ledger');

    const [showPurchase, setShowPurchase] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showDeleteVendor, setShowDeleteVendor] = useState(false);
    const [deleteBillId, setDeleteBillId] = useState<number | null>(null);
    const [deletePaymentId, setDeletePaymentId] = useState<number | null>(null);
    const [editPaymentId, setEditPaymentId] = useState<number | null>(null);
    const [editBillId, setEditBillId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);

    // Purchase / Edit-bill form
    const [billItems, setBillItems] = useState<BillItem[]>([{ material_id: '', quantity: '', price_per_unit: '' }]);
    const [billDate, setBillDate] = useState(TODAY);
    const [billNotes, setBillNotes] = useState('');
    const [billPaidAmount, setBillPaidAmount] = useState('');
    const [billPayMode, setBillPayMode] = useState('cash');

    // Payment form (shared for create + edit)
    const [payAmount, setPayAmount] = useState('');
    const [payDate, setPayDate] = useState(TODAY);
    const [payMode, setPayMode] = useState('cash');
    const [payNotes, setPayNotes] = useState('');

    // Edit vendor form
    const [editForm, setEditForm] = useState({ name: '', phone: '', address: '' });

    const fetchAll = async () => {
        try {
            const [vendorRes, matRes, ledgerRes] = await Promise.all([
                api.get(`/vendors/${id}`),
                api.get('/materials'),
                api.get(`/vendors/${id}/ledger`),
            ]);
            setVendor(vendorRes.data.vendor);
            setEditForm({
                name: vendorRes.data.vendor.name,
                phone: vendorRes.data.vendor.phone || '',
                address: vendorRes.data.vendor.address || '',
            });
            setMaterials(matRes.data);
            setSummary(ledgerRes.data.summary);
            setBills(ledgerRes.data.bills);
            setPayments(ledgerRes.data.payments);
            setOldPurchases(ledgerRes.data.oldPurchases || []);
        } catch { toast('Failed to load data', 'error'); }
    };

    useEffect(() => { fetchAll(); }, [id]);

    const updateItem = (idx: number, field: keyof BillItem, value: string) =>
        setBillItems(items => items.map((it, i) => i === idx ? { ...it, [field]: value } : it));
    const addItem = () => setBillItems(items => [...items, { material_id: '', quantity: '', price_per_unit: '' }]);
    const removeItem = (idx: number) => setBillItems(items => items.filter((_, i) => i !== idx));
    const itemTotal = (it: BillItem) => {
        const v = parseFloat(it.quantity || '0') * parseFloat(it.price_per_unit || '0');
        return isNaN(v) ? 0 : v;
    };
    const billGrandTotal = billItems.reduce((s, it) => s + itemTotal(it), 0);

    const resetPurchaseForm = () => {
        setBillItems([{ material_id: '', quantity: '', price_per_unit: '' }]);
        setBillDate(TODAY);
        setBillNotes('');
        setBillPaidAmount('');
        setBillPayMode('cash');
        setEditBillId(null);
    };

    const openEditBill = (bill: Bill) => {
        setEditBillId(bill.id);
        setBillDate(bill.bill_date.split('T')[0]);
        setBillNotes(bill.notes || '');
        setBillPaidAmount(parseFloat(bill.paid_amount) > 0 ? bill.paid_amount : '');
        setBillPayMode(bill.payment_mode || 'cash');
        setBillItems(bill.items.map(it => ({
            material_id: String(it.id ? '' : ''), // reset — will use material_id from item
            quantity: it.quantity,
            price_per_unit: it.price_per_unit,
            // We need material_id from the bill items — stored in parent
            _material_id: (it as any).material_id,
        } as any)));
        // Re-map using correct material_id
        setBillItems(bill.items.map(it => ({
            material_id: String((it as any).material_id || ''),
            quantity: String(it.quantity),
            price_per_unit: String(it.price_per_unit),
        })));
        setShowPurchase(true);
    };

    const handleSaveBill = async (e: React.FormEvent) => {
        e.preventDefault();
        const valid = billItems.filter(it => it.material_id && parseFloat(it.quantity) > 0 && parseFloat(it.price_per_unit) > 0);
        if (valid.length === 0) { toast('Add at least one valid item', 'error'); return; }
        setSaving(true);
        try {
            const payload = {
                bill_date: billDate,
                items: valid,
                paid_amount: parseFloat(billPaidAmount || '0') || 0,
                payment_mode: billPayMode,
                notes: billNotes,
            };
            if (editBillId) {
                await api.put(`/vendor-bills/${editBillId}`, payload);
                toast('Purchase updated');
            } else {
                await api.post(`/vendors/${id}/bills`, payload);
                toast('Purchase recorded');
            }
            setShowPurchase(false);
            resetPurchaseForm();
            fetchAll();
        } catch { toast('Failed to save purchase', 'error'); }
        finally { setSaving(false); }
    };

    const openEditPayment = (p: Payment) => {
        setEditPaymentId(p.id);
        setPayAmount(p.amount);
        setPayDate(p.payment_date.split('T')[0]);
        setPayMode(p.payment_mode);
        setPayNotes(p.notes || '');
        setShowPayment(true);
    };

    const closePaymentModal = () => {
        setShowPayment(false);
        setEditPaymentId(null);
        setPayAmount(''); setPayDate(TODAY); setPayMode('cash'); setPayNotes('');
    };

    const handleSavePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!payAmount || parseFloat(payAmount) <= 0) { toast('Enter a valid amount', 'error'); return; }
        setSaving(true);
        try {
            if (editPaymentId) {
                await api.put(`/vendor-payments/${editPaymentId}`, {
                    amount: payAmount, payment_date: payDate, payment_mode: payMode, notes: payNotes,
                });
                toast('Payment updated');
            } else {
                await api.post(`/vendors/${id}/payments`, {
                    amount: payAmount, payment_date: payDate, payment_mode: payMode, notes: payNotes,
                });
                toast('Payment recorded');
            }
            closePaymentModal();
            fetchAll();
        } catch { toast('Failed to save payment', 'error'); }
        finally { setSaving(false); }
    };

    const handleUpdateVendor = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put(`/vendors/${id}`, editForm);
            toast('Vendor updated');
            setShowEdit(false);
            fetchAll();
        } catch { toast('Failed to update', 'error'); }
    };

    const confirmDeleteVendor = async () => {
        try {
            await api.delete(`/vendors/${id}`);
            toast('Vendor deleted');
            navigate('/vendors');
        } catch { toast('Failed to delete', 'error'); }
    };

    const confirmDeleteBill = async () => {
        if (!deleteBillId) return;
        try {
            await api.delete(`/vendor-bills/${deleteBillId}`);
            toast('Bill deleted');
            setDeleteBillId(null);
            fetchAll();
        } catch { toast('Failed to delete bill', 'error'); }
    };

    const confirmDeletePayment = async () => {
        if (!deletePaymentId) return;
        try {
            await api.delete(`/vendor-payments/${deletePaymentId}`);
            toast('Payment deleted');
            setDeletePaymentId(null);
            fetchAll();
        } catch { toast('Failed to delete payment', 'error'); }
    };

    if (!vendor) return (
        <div className="fixed inset-0 bg-slate-50 flex flex-col max-w-md mx-auto shadow-xl">
            <TopBar title="Vendor Profile" showBack />
            <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-600 rounded-full animate-spin" />
            </div>
        </div>
    );

    const ledgerEntries = [
        ...bills.map(b => ({ type: 'bill' as const, date: b.bill_date, data: b })),
        ...payments.map(p => ({ type: 'payment' as const, date: p.payment_date, data: p })),
        ...oldPurchases.map(p => ({ type: 'old' as const, date: p.purchase_date, data: p })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const paidLabel = PAYMENT_MODES.find(m => m.id === billPayMode)?.label || 'Cash';

    return (
        <div className="fixed inset-0 h-[100dvh] bg-slate-50 flex flex-col max-w-md mx-auto shadow-xl overflow-hidden">
            <TopBar title={vendor.name} showBack rightAction={
                <div className="flex items-center gap-1">
                    <button onClick={() => setShowEdit(true)} className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-all active:scale-90"><Pencil size={18} /></button>
                    <button onClick={() => setShowDeleteVendor(true)} className="p-2.5 rounded-xl hover:bg-red-50 text-red-400 transition-all active:scale-90"><Trash2 size={18} /></button>
                </div>
            } />

            <div className="flex-1 min-h-0 overflow-y-auto">

                {summary.outstanding > 0.01 ? (
                    <div className="mx-4 mt-4 bg-red-600 rounded-2xl px-5 py-4 flex items-center justify-between shadow-lg shadow-red-500/20">
                        <div>
                            <p className="text-[10px] font-black text-red-200 uppercase tracking-widest mb-1">Outstanding Due</p>
                            <p className="text-2xl font-black text-white">{formatCurrency(summary.outstanding)}</p>
                        </div>
                        <button onClick={() => setShowPayment(true)}
                            className="bg-white text-red-600 text-xs font-black px-4 py-2.5 rounded-xl active:scale-95 transition-all shadow-sm">
                            Pay Now
                        </button>
                    </div>
                ) : (
                    <div className="mx-4 mt-4 bg-green-600 rounded-2xl px-5 py-3.5 flex items-center gap-3 shadow-lg shadow-green-500/20">
                        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                            <Banknote size={16} className="text-white" />
                        </div>
                        <p className="text-sm font-black text-white">All clear — no outstanding dues</p>
                    </div>
                )}

                <div className="px-4 pt-3 grid grid-cols-3 gap-2">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Credit</p>
                        <p className="text-sm font-black text-orange-600">{formatCurrency(summary.totalCredit)}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Paid</p>
                        <p className="text-sm font-black text-green-600">{formatCurrency(summary.totalPaid)}</p>
                    </div>
                    <div className={`rounded-2xl border shadow-sm p-3 text-center ${summary.outstanding > 0.01 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Balance</p>
                        <p className={`text-sm font-black ${summary.outstanding > 0.01 ? 'text-red-600' : 'text-slate-400'}`}>
                            {formatCurrency(Math.max(0, summary.outstanding))}
                        </p>
                    </div>
                </div>

                <div className="px-4 pt-3 grid grid-cols-2 gap-3">
                    <button onClick={() => { resetPurchaseForm(); setShowPurchase(true); }}
                        className="flex items-center justify-center gap-2 py-3 bg-primary-600 text-white text-sm font-black rounded-2xl shadow-lg shadow-primary-500/20 active:scale-95 transition-all">
                        <Plus size={16} strokeWidth={3} /> New Purchase
                    </button>
                    <button onClick={() => { setEditPaymentId(null); setShowPayment(true); }}
                        className="flex items-center justify-center gap-2 py-3 bg-green-600 text-white text-sm font-black rounded-2xl shadow-lg shadow-green-500/20 active:scale-95 transition-all">
                        <Banknote size={16} strokeWidth={2.5} /> Pay Vendor
                    </button>
                </div>

                <div className="px-4 pt-3">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100 shrink-0">
                            <span className="text-base font-black text-orange-600">{vendor.name.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-900">{vendor.name}</p>
                            <p className="text-xs text-slate-400 font-medium truncate">
                                {vendor.phone || 'No phone'}{vendor.address ? ` · ${vendor.address}` : ''}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="px-4 pt-4">
                    <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">
                        {([
                            { key: 'ledger', label: 'Ledger' },
                            { key: 'bills',  label: `Bills (${bills.length})` },
                            { key: 'items',  label: 'Items' },
                        ] as const).map(({ key, label }) => (
                            <button key={key} onClick={() => setActiveTab(key)}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
                                    activeTab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'
                                }`}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="px-4 pt-3 pb-8 space-y-2.5">
                    {activeTab === 'ledger' && (
                        ledgerEntries.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-14 flex flex-col items-center gap-3 text-center">
                                <Package size={28} className="text-slate-200" />
                                <div>
                                    <p className="text-sm font-bold text-slate-500">No transactions yet</p>
                                    <p className="text-xs text-slate-400 mt-1">Record a purchase to start tracking</p>
                                </div>
                            </div>
                        ) : ledgerEntries.map(entry => {
                            if (entry.type === 'bill') {
                                const b = entry.data as Bill;
                                return (
                                    <div key={`bill-${b.id}`} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                                            <TrendingUp size={16} className="text-orange-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-slate-900">Purchase · Bill #{b.id}</p>
                                            <p className="text-[11px] text-slate-400 font-bold">
                                                {formatDate(b.bill_date)} · {b.items.length} item{b.items.length !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="flex flex-col items-end gap-0.5">
                                                <p className="text-sm font-black text-orange-600">+{formatCurrency(parseFloat(b.total_amount))}</p>
                                                <p className="text-[10px] font-bold text-red-400">Credit</p>
                                            </div>
                                            <div className="flex items-center justify-end gap-1.5 mt-2.5">
                                                <button onClick={() => openEditBill(b)} 
                                                    className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 active:text-primary-600 transition-all active:scale-90">
                                                    <Pencil size={18} />
                                                </button>
                                                <button onClick={() => setDeleteBillId(b.id)} 
                                                    className="p-2.5 rounded-xl hover:bg-red-50 text-slate-400 active:text-red-600 transition-all active:scale-90">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            } else if (entry.type === 'old') {
                                const p = entry.data as any;
                                return (
                                    <div key={`old-${p.id}`} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                                            <TrendingUp size={16} className="text-orange-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-slate-900 truncate">{p.material_name}</p>
                                            <p className="text-[11px] text-slate-400 font-bold">{formatDate(p.purchase_date)} · {p.quantity} {p.unit}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-black text-orange-600">+{formatCurrency(parseFloat(p.total_amount))}</p>
                                            <p className="text-[10px] font-bold text-red-400 mt-0.5">Credit</p>
                                        </div>
                                    </div>
                                );
                            } else {
                                const p = entry.data as Payment;
                                const modeLabel = PAYMENT_MODES.find(m => m.id === p.payment_mode)?.label || p.payment_mode;
                                return (
                                    <div key={`pay-${p.id}`} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
                                            <TrendingDown size={16} className="text-green-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-slate-900">Payment · {modeLabel}</p>
                                            <p className="text-[11px] text-slate-400 font-bold">{formatDate(p.payment_date)}</p>
                                            {p.notes && <p className="text-[10px] text-slate-400 italic mt-0.5 truncate">{p.notes}</p>}
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="flex flex-col items-end gap-0.5">
                                                <p className="text-sm font-black text-green-600">−{formatCurrency(parseFloat(p.amount))}</p>
                                                <p className="text-[10px] font-bold text-green-500">{modeLabel}</p>
                                            </div>
                                            <div className="flex items-center justify-end gap-1.5 mt-2.5">
                                                <button onClick={() => openEditPayment(p)} 
                                                    className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 active:text-primary-600 transition-all active:scale-90">
                                                    <Pencil size={18} />
                                                </button>
                                                <button onClick={() => setDeletePaymentId(p.id)} 
                                                    className="p-2.5 rounded-xl hover:bg-red-50 text-slate-400 active:text-red-600 transition-all active:scale-90">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                        })
                    )}

                    {activeTab === 'bills' && (
                        bills.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-14 flex flex-col items-center gap-3 text-center">
                                <Package size={28} className="text-slate-200" />
                                <p className="text-sm font-bold text-slate-500">No purchase bills yet</p>
                            </div>
                        ) : bills.map(bill => (
                            <BillCard key={bill.id} bill={bill}
                                onEdit={() => openEditBill(bill)}
                                onDelete={() => setDeleteBillId(bill.id)} />
                        ))
                    )}

                    {activeTab === 'items' && (() => {
                        const allBillItems = bills.flatMap(b =>
                            b.items.map(it => ({
                                key: `bill-${b.id}-${it.id}`,
                                material_id: it.material_id, // Ensure this exists
                                date: b.bill_date,
                                material_name: it.material_name,
                                unit: it.unit,
                                quantity: it.quantity,
                                price_per_unit: it.price_per_unit,
                                total_amount: it.total_amount,
                                ref: `Bill #${b.id}`,
                            }))
                        );
                        const legacyItems = oldPurchases.map(p => ({
                            key: `old-${p.id}`,
                            material_id: p.material_id,
                            date: p.purchase_date,
                            material_name: p.material_name,
                            unit: p.unit,
                            quantity: p.quantity,
                            price_per_unit: p.price_per_unit,
                            total_amount: p.total_amount,
                            ref: 'Direct entry',
                        }));
                        const allItems = [...allBillItems, ...legacyItems]
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                        return allItems.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-14 flex flex-col items-center gap-3 text-center">
                                <Package size={28} className="text-slate-200" />
                                <div>
                                    <p className="text-sm font-bold text-slate-500">No items yet</p>
                                    <p className="text-xs text-slate-400 mt-1">Record a purchase to see item history</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {allItems.map(item => (
                                    <button 
                                        key={item.key} 
                                        onClick={() => navigate(`/materials/${item.material_id}`)}
                                        className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3 active:scale-[0.98] hover:border-primary-200 hover:shadow-md transition-all group text-left"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 group-hover:bg-primary-50 group-hover:border-primary-100 transition-colors">
                                            <Package size={16} className="text-indigo-600 group-hover:text-primary-600 transition-colors" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-slate-900 truncate flex items-center gap-1.5">
                                                {item.material_name}
                                                <ChevronRight size={14} className="text-slate-300 group-hover:text-primary-400 transition-colors" />
                                            </p>
                                            <p className="text-[11px] text-slate-400 font-bold">{formatDate(item.date)} · {item.ref}</p>
                                            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                                {item.quantity} {item.unit} × {formatCurrency(parseFloat(item.price_per_unit))}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-black text-slate-900">{formatCurrency(parseFloat(item.total_amount))}</p>
                                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">{item.quantity} {item.unit}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* ── New / Edit Purchase Modal ── */}
            <Modal isOpen={showPurchase} onClose={() => { setShowPurchase(false); resetPurchaseForm(); }}
                title={editBillId ? `Edit Bill #${editBillId}` : 'New Purchase'}>
                <form onSubmit={handleSaveBill} className="space-y-5 pt-2">
                    <div className="bg-slate-50 p-5 rounded-[32px] border border-slate-100 space-y-4">
                        <DateInput 
                            label="Purchase Date *"
                            required
                            value={billDate}
                            onChange={e => setBillDate(e.target.value)}
                        />

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block px-1">Items Purchased *</label>
                            <div className="space-y-3">
                                {billItems.map((item, idx) => (
                                    <div key={idx} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
                                        <div className="flex gap-2">
                                            <select value={item.material_id}
                                                onChange={e => updateItem(idx, 'material_id', e.target.value)}
                                                className="flex-1 h-12 px-4 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 shadow-sm">
                                                <option value="">-- Choose Material --</option>
                                                {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                                            </select>
                                            {billItems.length > 1 && (
                                                <button type="button" onClick={() => removeItem(idx)}
                                                    className="w-12 h-12 rounded-2xl bg-red-50 text-red-400 flex items-center justify-center shrink-0 active:bg-red-100 border border-red-100 transition-colors">
                                                    <Minus size={16} strokeWidth={3} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block px-1">Qty</label>
                                                <input type="number" step="0.01" min="0" placeholder="0" value={item.quantity}
                                                    onChange={e => updateItem(idx, 'quantity', e.target.value)}
                                                    className="w-full h-12 px-3 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 shadow-sm text-center" />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block px-1">Rate ₹</label>
                                                <input type="number" step="0.01" min="0" placeholder="0" value={item.price_per_unit}
                                                    onChange={e => updateItem(idx, 'price_per_unit', e.target.value)}
                                                    className="w-full h-12 px-3 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 shadow-sm text-center" />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block px-1">Total</label>
                                                <div className="h-12 px-3 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
                                                    <span className="text-base font-black text-slate-700">{formatCurrency(itemTotal(item))}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={addItem}
                                className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-primary-200 text-primary-600 text-xs font-black active:bg-primary-50 transition-colors">
                                <Plus size={14} strokeWidth={3} /> Add Another Item
                            </button>
                        </div>

                        {/* Amount Paid section */}
                        <div className="border-t border-slate-200 pt-4 space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">
                                    Amount Paid <span className="text-slate-400 font-medium normal-case">(leave 0 for full credit)</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-base">₹</span>
                                    <input type="number" step="0.01" min="0" placeholder="0.00" value={billPaidAmount}
                                        onChange={e => setBillPaidAmount(e.target.value)}
                                        className="w-full h-12 pl-9 pr-4 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 shadow-sm" />
                                </div>
                                {billGrandTotal > 0 && (
                                    <button type="button"
                                        onClick={() => setBillPaidAmount(billGrandTotal.toFixed(2))}
                                        className="mt-2 text-[10px] font-black text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl active:bg-green-100 transition-colors">
                                        Pay Full · {formatCurrency(billGrandTotal)}
                                    </button>
                                )}
                            </div>

                            {parseFloat(billPaidAmount || '0') > 0 && (
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block px-1">How was it paid? *</label>
                                    <PaymentModeChips value={billPayMode} onChange={setBillPayMode} />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">Notes</label>
                            <input type="text" placeholder="e.g. Morning delivery, market price…" value={billNotes}
                                onChange={e => setBillNotes(e.target.value)}
                                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 shadow-sm" />
                        </div>
                    </div>

                    {/* Grand total dark card */}
                    <div className="bg-slate-900 rounded-3xl p-5 px-6 space-y-2 shadow-lg">
                        <div className="flex items-center justify-between">
                            <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Bill Total</p>
                            <p className="text-xl font-black text-white">{formatCurrency(billGrandTotal)}</p>
                        </div>
                        {parseFloat(billPaidAmount || '0') > 0 && (
                            <>
                                <div className="flex items-center justify-between">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-green-400">Paid · {paidLabel}</p>
                                    <p className="text-base font-black text-green-400">−{formatCurrency(Math.min(parseFloat(billPaidAmount), billGrandTotal))}</p>
                                </div>
                                <div className="border-t border-white/10 pt-2 flex items-center justify-between">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-red-400">Credit Balance</p>
                                    <p className="text-base font-black text-red-400">
                                        {formatCurrency(Math.max(0, billGrandTotal - parseFloat(billPaidAmount)))}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    <button type="submit" disabled={saving}
                        className="w-full py-4.5 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-500/20 active:scale-95 transition-all outline-none disabled:opacity-60">
                        {saving ? 'Saving…' : editBillId ? 'Update Purchase' : 'Save Purchase'}
                    </button>
                </form>
            </Modal>

            {/* ── Pay Vendor Modal (create + edit) ── */}
            <Modal isOpen={showPayment} onClose={closePaymentModal} title={editPaymentId ? 'Edit Payment' : 'Pay Vendor'}>
                <form onSubmit={handleSavePayment} className="space-y-5 pt-2">
                    {!editPaymentId && summary.outstanding > 0.01 && (
                        <div className="bg-red-50 rounded-3xl px-5 py-4 border border-red-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Clock size={16} className="text-red-400 shrink-0" />
                                <div>
                                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-0.5">Outstanding Due</p>
                                    <p className="text-xl font-black text-red-700 leading-none">{formatCurrency(summary.outstanding)}</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setPayAmount(Math.max(0, summary.outstanding).toFixed(2))}
                                className="text-xs font-black text-red-600 bg-white border border-red-200 px-3 py-2 rounded-xl active:bg-red-50 transition-colors shadow-sm">
                                Pay Full
                            </button>
                        </div>
                    )}

                    <div className="bg-slate-50 p-5 rounded-[32px] border border-slate-100 space-y-5">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">Amount Paid *</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-base">₹</span>
                                <input type="number" step="0.01" min="0" placeholder="0.00" required value={payAmount}
                                    onChange={e => setPayAmount(e.target.value)}
                                    className="w-full h-12 pl-9 pr-4 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 shadow-sm" />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block px-1">How did you pay? *</label>
                            <PaymentModeChips value={payMode} onChange={setPayMode} />
                        </div>

                        <DateInput 
                            label="Payment Date *"
                            required
                            value={payDate}
                            onChange={e => setPayDate(e.target.value)}
                        />

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">Notes</label>
                            <input type="text" placeholder="UPI ID, reference number…" value={payNotes}
                                onChange={e => setPayNotes(e.target.value)}
                                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 shadow-sm" />
                        </div>
                    </div>

                    <button type="submit" disabled={saving}
                        className="w-full py-4.5 bg-green-600 text-white font-black rounded-2xl shadow-xl shadow-green-500/20 active:scale-95 transition-all outline-none disabled:opacity-60">
                        {saving ? 'Saving…' : editPaymentId
                            ? `Update Payment · ${PAYMENT_MODES.find(m => m.id === payMode)?.label}`
                            : `Mark Paid · ${PAYMENT_MODES.find(m => m.id === payMode)?.label}`}
                    </button>
                </form>
            </Modal>

            {/* ── Edit Vendor Modal ── */}
            <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Update Supplier Information">
                <form onSubmit={handleUpdateVendor} className="space-y-5 pt-2">
                    <div className="bg-slate-50 p-5 rounded-[32px] border border-slate-100 space-y-4">
                        {([
                            { label: 'Supplier Name', key: 'name', required: true, placeholder: 'Vendor name' },
                            { label: 'Phone Number', key: 'phone', required: false, placeholder: 'Contact number' },
                            { label: 'Business Address', key: 'address', required: false, placeholder: 'Market, shop number…' },
                        ] as const).map(({ label, key, required, placeholder }) => (
                            <div key={key}>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">{label}{required ? ' *' : ''}</label>
                                <input required={required} placeholder={placeholder}
                                    value={editForm[key]}
                                    onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                                    className="w-full h-12 px-4 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 shadow-sm" />
                            </div>
                        ))}
                    </div>
                    <button type="submit" className="w-full py-4.5 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-500/20 active:scale-95 transition-all outline-none">
                        Update Records
                    </button>
                </form>
            </Modal>

            <ConfirmModal isOpen={showDeleteVendor} onClose={() => setShowDeleteVendor(false)}
                onConfirm={confirmDeleteVendor} title="Delete Vendor"
                message="This will delete all bills, payments, and transaction history for this vendor." />
            <ConfirmModal isOpen={deleteBillId !== null} onClose={() => setDeleteBillId(null)}
                onConfirm={confirmDeleteBill} title="Delete Bill"
                message="This will delete the bill and all its stock entries. This cannot be undone." />
            <ConfirmModal isOpen={deletePaymentId !== null} onClose={() => setDeletePaymentId(null)}
                onConfirm={confirmDeletePayment} title="Delete Payment"
                message="Are you sure you want to delete this payment record?" />
        </div>
    );
}
