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
            <div className="px-4 pt-4 pb-3 flex gap-2">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search vendors…"
                        className="w-full h-10 pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors" />
                </div>
                <button onClick={() => setShowAdd(true)} className="h-10 px-4 bg-primary-600 text-white text-sm font-bold rounded-xl flex items-center gap-1.5 active:bg-primary-700 shrink-0">
                    <Plus size={16} /> Add
                </button>
            </div>

            {loading ? <div className="px-4"><ListSkeleton /></div> : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 px-4 text-center">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <Truck size={24} className="text-slate-400" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-700">{query ? 'No vendors found' : 'No vendors yet'}</p>
                        <p className="text-xs text-slate-400 mt-1">Add your first supplier to get started</p>
                    </div>
                    {!query && <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 text-white text-xs font-bold rounded-xl"><Plus size={14} /> Add Vendor</button>}
                </div>
            ) : (
                <div className="px-4 space-y-2">
                    {filtered.map(vendor => (
                        <div key={vendor.id} onClick={() => navigate(`/vendors/${vendor.id}`)}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 flex items-center gap-3 cursor-pointer active:bg-slate-50 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                                <span className="text-sm font-black text-orange-700">{vendor.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">{vendor.name}</p>
                                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                    <Phone size={10} /> {vendor.phone || 'No phone'}
                                </p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-sm font-black text-slate-700">{formatCurrency(parseFloat(vendor.total_purchased || 0))}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">total bought</p>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 shrink-0" />
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Vendor">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Vendor Name *</label>
                        <input required placeholder="e.g. Raju Wholesale" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Phone</label>
                        <input placeholder="9876543210" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Address</label>
                        <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={2} placeholder="Vendor address"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none" />
                    </div>
                    <button type="submit" className="w-full py-3.5 bg-primary-600 text-white font-bold rounded-2xl active:bg-primary-700 transition-colors">Add Vendor</button>
                </form>
            </Modal>
        </div>
    );
}
