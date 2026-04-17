import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Package } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { formatCurrency, formatDate } from '../utils/format';
import { useToast } from '../contexts/ToastContext';
import { TopBar } from '../components/layout/TopBar';
import api from '../utils/api';

export function VendorProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [data, setData] = useState<any>(null);
    const [showEdit, setShowEdit] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '', address: '' });

    const fetchData = async () => {
        try {
            const res = await api.get(`/vendors/${id}`);
            setData(res.data);
            setForm({ name: res.data.vendor.name, phone: res.data.vendor.phone || '', address: res.data.vendor.address || '' });
        } catch { toast('Failed to load vendor', 'error'); }
    };

    useEffect(() => { fetchData(); }, [id]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put(`/vendors/${id}`, form);
            toast('Vendor updated');
            setShowEdit(false);
            fetchData();
        } catch { toast('Failed to update', 'error'); }
    };

    const handleDelete = async () => {
        if (!confirm('Delete this vendor? This cannot be undone.')) return;
        try {
            await api.delete(`/vendors/${id}`);
            toast('Vendor deleted');
            navigate('/vendors');
        } catch { toast('Failed to delete', 'error'); }
    };

    if (!data) return (
        <div className="h-dvh bg-slate-50 flex flex-col max-w-md mx-auto shadow-xl overflow-hidden">
            <TopBar title="Vendor Profile" showBack />
            <div className="flex-1 pt-16 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-600 rounded-full animate-spin" />
            </div>
        </div>
    );

    const vendor = data.vendor;
    const purchases = data.purchases || [];

    return (
        <div className="h-dvh bg-slate-50 flex flex-col max-w-md mx-auto shadow-xl overflow-hidden">
            <TopBar title={vendor.name} showBack rightAction={
                <div className="flex items-center gap-1">
                    <button onClick={() => setShowEdit(true)} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"><Pencil size={18} /></button>
                    <button onClick={handleDelete} className="p-2 rounded-full hover:bg-danger-50 text-danger-500 transition-colors"><Trash2 size={18} /></button>
                </div>
            } />
            <div className="flex-1 pt-16 pb-4 overflow-y-auto">
                <div className="p-4 space-y-4">
                    {/* Profile Card */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center">
                                <span className="text-xl font-black text-orange-700">{vendor.name.charAt(0)}</span>
                            </div>
                            <div>
                                <p className="text-base font-bold text-slate-900">{vendor.name}</p>
                                <p className="text-sm text-slate-400">{vendor.phone || 'No phone'}</p>
                                {vendor.address && <p className="text-xs text-slate-400 mt-0.5">{vendor.address}</p>}
                            </div>
                        </div>
                        <div className="bg-orange-50 rounded-xl p-4">
                            <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1">Total Purchased</p>
                            <p className="text-2xl font-black text-orange-800">{formatCurrency(parseFloat(vendor.total_purchased || 0))}</p>
                        </div>
                    </div>

                    {/* Purchase History */}
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Purchase History</p>
                        {purchases.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-10 flex flex-col items-center gap-2 text-center">
                                <Package size={24} className="text-slate-300" />
                                <p className="text-sm font-bold text-slate-500">No purchases from this vendor</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {purchases.map((p: any) => (
                                    <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 flex items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-900 truncate">{p.material_name}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{p.quantity} {p.unit} · {formatDate(p.purchase_date)}</p>
                                        </div>
                                        <p className="text-sm font-black text-slate-700 shrink-0">{formatCurrency(p.total_amount)}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Vendor">
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Name *</label>
                        <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Phone</label>
                        <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Address</label>
                        <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={2}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none" />
                    </div>
                    <button type="submit" className="w-full py-3.5 bg-primary-600 text-white font-bold rounded-2xl">Update Vendor</button>
                </form>
            </Modal>
        </div>
    );
}
