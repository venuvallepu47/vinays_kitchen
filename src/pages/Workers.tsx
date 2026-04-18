import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users, Phone, Pencil, Trash2, Calendar, Wallet } from 'lucide-react';
import { DateInput } from '../components/ui/DateInput';
import { ListSkeleton } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { formatCurrency, formatDateInput, today } from '../utils/format';
import { useToast } from '../contexts/ToastContext';
import { cn } from '../utils/cn';
import api from '../utils/api';

export function Workers() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [workers, setWorkers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [form, setForm] = useState({ name: '', phone: '', salary_per_day: '', joining_date: today() });

    const fetchWorkers = async () => {
        try {
            const res = await api.get('/workers');
            setWorkers(res.data);
        } catch { toast('Failed to load workers', 'error'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchWorkers(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editId) {
                await api.put(`/workers/${editId}`, form);
                toast('Worker updated');
            } else {
                await api.post('/workers', form);
                toast('Worker added');
            }
            handleCloseModal();
            fetchWorkers();
        } catch { toast('Failed to save worker', 'error'); }
    };

    const handleEdit = (e: React.MouseEvent, worker: any) => {
        e.stopPropagation();
        setEditId(worker.id);
        setForm({
            name: worker.name,
            phone: worker.phone || '',
            salary_per_day: worker.salary_per_day.toString(),
            joining_date: formatDateInput(worker.joining_date)
        });
        setShowAdd(true);
    };

    const handleDelete = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/workers/${deleteId}`);
            toast('Worker removed');
            setDeleteId(null);
            fetchWorkers();
        } catch (err: any) {
            const msg = err.response?.data?.error || 'Failed to remove worker';
            toast(msg, 'error');
        }
    };

    const handleCloseModal = () => {
        setShowAdd(false);
        setEditId(null);
        setForm({ name: '', phone: '', salary_per_day: '', joining_date: today() });
    };

    const filtered = workers.filter(w =>
        w.name.toLowerCase().includes(query.toLowerCase()) ||
        (w.phone || '').includes(query)
    );

    const totalDue = filtered.reduce((sum, w) => sum + parseFloat(w.balance_due || 0), 0);
    const totalStaff = filtered.length;

    return (
        <div className="pb-24 space-y-4">
            {/* Header Summary */}
            <div className="px-4 pt-4">
                <div className="bg-primary-600 rounded-3xl p-6 text-white shadow-lg shadow-primary-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-primary-100 uppercase tracking-widest mb-1 opacity-80">Salary Due Today</p>
                            <p className="text-3xl font-black">{formatCurrency(totalDue)}</p>
                        </div>
                        <div className="bg-white/20 p-2.5 rounded-2xl">
                            <Users size={24} />
                        </div>
                    </div>
                    <div className="mt-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="text-xs font-medium text-primary-100 flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                                <Wallet size={12} /> {totalStaff} Staff Members
                            </div>
                        </div>
                        <button onClick={() => setShowAdd(true)} className="h-9 px-4 bg-white text-primary-700 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform">
                            <Plus size={15} /> Add Staff
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="px-4">
                <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        value={query} 
                        onChange={e => setQuery(e.target.value)} 
                        placeholder="Search by name or phone..."
                        className="w-full h-11 pl-10 pr-4 bg-white border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 shadow-sm"
                    />
                </div>
            </div>

            {loading ? <div className="px-4"><ListSkeleton /></div> : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4 px-4 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                        <Users size={32} className="text-slate-300" />
                    </div>
                    <div>
                        <p className="text-base font-bold text-slate-700">No staff found</p>
                        <p className="text-sm text-slate-400 mt-1">Ready to add your kitchen team members</p>
                    </div>
                </div>
            ) : (
                <div className="px-4 space-y-3">
                    {filtered.map(worker => {
                        const balance = parseFloat(worker.balance_due || 0);
                        return (
                            <div key={worker.id} onClick={() => navigate(`/workers/${worker.id}`)}
                                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4 active:bg-slate-50 transition-colors cursor-pointer group">
                                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0 border border-primary-100/50">
                                    <span className="text-lg font-black text-primary-600">{worker.name.charAt(0).toUpperCase()}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-900 truncate mb-1">{worker.name}</p>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                                    <Phone size={11} className="text-slate-300" /> {worker.phone || 'No phone'}
                                                </p>
                                                <p className="text-xs text-slate-400 font-medium flex items-center gap-1 text-primary-600/70">
                                                    <Calendar size={11} /> {worker.days_present_month || 0}d Worked
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className={cn('text-sm font-black mb-2 leading-none', balance > 0 ? 'text-danger-600' : 'text-success-600')}>
                                                {balance > 0 ? formatCurrency(balance) : 'Settled'}
                                            </p>
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={(e) => handleEdit(e, worker)} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all">
                                                    <Pencil size={13} />
                                                </button>
                                                <button onClick={(e) => handleDelete(e, worker.id)} className="w-8 h-8 rounded-lg bg-danger-50 text-danger-400 flex items-center justify-center hover:bg-danger-100 active:scale-95 transition-all">
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal isOpen={showAdd} onClose={handleCloseModal} title={editId ? "Update Staff Information" : "Register New Staff Member"}>
                <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                    <div className="bg-slate-50 p-5 rounded-[32px] border border-slate-100 space-y-5">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">Full Name *</label>
                            <input required placeholder="e.g. Rahul Kumar" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 shadow-sm" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">Phone Number</label>
                            <input placeholder="Enter contact number" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 shadow-sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">Daily Salary *</label>
                                <input required type="number" min="0" step="1" placeholder="₹500" value={form.salary_per_day} onChange={e => setForm(f => ({ ...f, salary_per_day: e.target.value }))}
                                    className="w-full h-12 px-4 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-900 focus:shadow-md transition-all outline-none focus:border-primary-500 shadow-sm" />
                            </div>
                            <DateInput 
                                label="Joining Date"
                                value={form.joining_date}
                                onChange={e => setForm(f => ({ ...f, joining_date: e.target.value }))}
                            />
                        </div>
                    </div>
                    <button type="submit" className="w-full py-4.5 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-500/20 active:scale-95 transition-all outline-none">
                        {editId ? "Update Staff Profile" : "Create Staff Profile"}
                    </button>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Remove Worker"
                message="Are you sure you want to remove this staff member? This will hide them from the active list."
            />
        </div>
    );
}

