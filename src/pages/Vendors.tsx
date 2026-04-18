import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Truck, Phone, ChevronRight } from 'lucide-react';
import { ListSkeleton } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import { formatCurrency } from '../utils/format';
import { useToast } from '../contexts/ToastContext';
import api from '../utils/api';

export function Vendors() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [vendors, setVendors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '', address: '' });

    const fetchVendors = async () => {
        try {
            const res = await api.get('/vendors');
            setVendors(res.data);
        } catch { toast('Failed to load vendors', 'error'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchVendors(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/vendors', form);
            toast('Vendor added');
            setShowAdd(false);
            setForm({ name: '', phone: '', address: '' });
            fetchVendors();
        } catch { toast('Failed to add vendor', 'error'); }
    };

    const filtered = vendors.filter(v =>
        v.name.toLowerCase().includes(query.toLowerCase()) ||
        (v.phone || '').includes(query)
    );

    return (
        <div className="pb-24">
            <div className="px-4 pt-4 pb-3 flex flex-col gap-3">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search suppliers…"
                            className="w-full h-10 pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors" />
                    </div>
                    <button onClick={() => setShowAdd(true)} className="h-10 px-4 bg-primary-600 text-white text-sm font-bold rounded-xl flex items-center gap-1.5 active:bg-primary-700 shrink-0 shadow-sm transition-all active:scale-95">
                        <Plus size={16} /> Add Vendor
                    </button>
                </div>
            </div>

            {loading ? <div className="px-4"><ListSkeleton /></div> : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 px-4 text-center">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <Truck size={24} className="text-slate-400" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-700">{query ? 'No suppliers found' : 'No suppliers registered'}</p>
                        <p className="text-xs text-slate-400 mt-1">Keep track of your material sources in one place</p>
                    </div>
                    {!query && (
                        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-primary-500/20 active:scale-95 transition-all">
                            <Plus size={14} /> Add First Supplier
                        </button>
                    )}
                </div>
            ) : (
                <div className="px-4 space-y-3">
                    <div className="flex items-center justify-between mb-1 px-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filtered.length} Suppliers</p>
                    </div>
                    {filtered.map(vendor => {
                        const outstanding = parseFloat(vendor.outstanding || 0);
                        return (
                        <div key={vendor.id} onClick={() => navigate(`/vendors/${vendor.id}`)}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 flex items-center gap-3 cursor-pointer active:bg-slate-50 transition-all active:scale-[0.98] group">
                            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100/50">
                                <span className="text-lg font-black text-orange-700">{vendor.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate mb-0.5">{vendor.name}</p>
                                <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                    <Phone size={10} className="text-slate-300" /> {vendor.phone || 'No phone'}
                                </p>
                            </div>
                            <div className="text-right shrink-0 space-y-1">
                                {outstanding > 0 ? (
                                    <>
                                        <p className="text-sm font-black text-red-600">{formatCurrency(outstanding)}</p>
                                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-tight">Due</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm font-black text-green-600">{formatCurrency(parseFloat(vendor.total_credit || 0))}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">All Paid</p>
                                    </>
                                )}
                            </div>
                            <ChevronRight size={16} className="text-slate-300 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                        );
                    })}
                </div>
            )}

            <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="New Supplier Registration">
                <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                    <div className="bg-slate-50 p-5 rounded-[32px] border border-slate-100 space-y-5">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">Supplier Name *</label>
                            <input required placeholder="e.g. Raju Wholesale Mart" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 shadow-sm" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">Phone Number</label>
                            <input placeholder="Enter contact number" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 shadow-sm" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">Business Address</label>
                            <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={2} placeholder="Market, Shop number, etc."
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 shadow-sm resize-none" />
                        </div>
                    </div>
                    <button type="submit" className="w-full py-4.5 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-500/20 active:scale-95 transition-all outline-none">
                        Register Supplier
                    </button>
                </form>
            </Modal>
        </div>
    );
}
