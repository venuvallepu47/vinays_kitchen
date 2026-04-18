import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, CalendarDays, ChevronRight, ShoppingBag, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { formatCurrency, formatDate, getISTDate } from '../utils/format';
import api from '../utils/api';

export function Dashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchStats = async () => {
        try {
            setError(false);
            const res = await api.get('/stats/dashboard');
            setStats(res.data);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStats(); }, []);

    if (loading) return <div className="p-4"><DashboardSkeleton /></div>;

    if (error) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4 px-4">
            <div className="w-14 h-14 rounded-2xl bg-danger-50 flex items-center justify-center">
                <AlertCircle size={28} className="text-danger-500" />
            </div>
            <p className="text-slate-500 text-sm">Could not connect to server</p>
            <button onClick={fetchStats} className="px-5 py-2 bg-primary-600 text-white text-sm font-bold rounded-xl">Retry</button>
        </div>
    );

    const s = stats || {};

    return (
        <div className="pb-24">
            {/* Hero Banner */}
            <div className="bg-gradient-to-b from-amber-800 via-amber-700 to-orange-600 px-4 pt-5 pb-8 relative overflow-hidden">
                <div className="absolute -top-10 -right-8 w-36 h-36 rounded-full bg-white/[0.05] pointer-events-none" />
                <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/[0.05] pointer-events-none" />

                {/* Quick Actions */}
                <div className="flex gap-3 mb-6 relative">
                    <button
                        onClick={() => navigate('/sales')}
                        className="flex-1 h-11 flex items-center justify-center gap-2 bg-white/15 active:bg-white/25 border border-white/20 rounded-2xl text-white text-sm font-bold transition-all active:scale-[0.97]"
                    >
                        <Plus size={16} strokeWidth={2.5} />
                        Add Sale
                    </button>
                    <button
                        onClick={() => navigate('/attendance')}
                        className="flex-1 h-11 flex items-center justify-center gap-2 bg-white/15 active:bg-white/25 border border-white/20 rounded-2xl text-white text-sm font-bold transition-all active:scale-[0.97]"
                    >
                        <CalendarDays size={16} />
                        Attendance
                    </button>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3 relative">
                    <button
                        onClick={() => {
                            const d = getISTDate();
                            d.setDate(d.getDate() - 1);
                            navigate(`/sales?date=${d.toISOString().split('T')[0]}`);
                        }}
                        className="bg-white/10 rounded-2xl p-4 border border-white/10 text-left active:bg-white/20 transition-all active:scale-[0.98]"
                    >
                        <p className="text-amber-200 text-[10px] font-bold uppercase tracking-widest mb-1.5">Yesterday's Counter</p>
                        <p className="text-white text-[22px] font-black leading-none">{formatCurrency(s.yesterday_sales || 0)}</p>
                        <p className="text-amber-300/70 text-[10px] mt-1.5">total sales yesterday</p>
                    </button>
                    <button
                        onClick={() => {
                            const d = getISTDate();
                            navigate(`/sales?month=${d.getMonth() + 1}&year=${d.getFullYear()}`);
                        }}
                        className="bg-white/10 rounded-2xl p-4 border border-white/10 text-left active:bg-white/20 transition-all active:scale-[0.98]"
                    >
                        <p className="text-amber-200 text-[10px] font-bold uppercase tracking-widest mb-1.5">This Month</p>
                        <p className="text-white text-[22px] font-black leading-none">{formatCurrency(s.month_sales || 0)}</p>
                        <p className="text-amber-300/70 text-[10px] mt-1.5">total revenue →</p>
                    </button>
                </div>
            </div>

            {/* Floating Stat Cards */}
            <div className="px-4 -mt-4 relative z-10 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-3.5 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                                <TrendingUp size={14} className="text-primary-700" />
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Workers Today</p>
                        </div>
                        <p className="text-lg font-black text-slate-900">{s.workers_present_today || 0} Present</p>
                    </div>
                    <button
                        onClick={() => navigate('/materials')}
                        className="bg-white rounded-2xl border border-slate-100 shadow-lg p-3.5 flex flex-col gap-2 text-left active:bg-slate-50 active:scale-[0.97] transition-all"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-danger-50 flex items-center justify-center shrink-0">
                                <AlertCircle size={14} className="text-danger-500" />
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Low Stock</p>
                        </div>
                        <p className="text-lg font-black text-slate-900">{s.low_stock_count || 0} Items</p>
                    </button>
                </div>

                {/* Monthly Revenue Mix */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-5">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Revenue Mix</p>
                        <p className="text-[10px] font-black text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                            {((parseFloat(s.upi_sales || 0) / (parseFloat(s.month_sales) || 1)) * 100).toFixed(0)}% Digital
                        </p>
                    </div>
                    
                    <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden flex mb-4">
                        <div 
                            className="h-full bg-emerald-500 transition-all duration-1000" 
                            style={{ width: `${(parseFloat(s.cash_sales || 0) / (parseFloat(s.month_sales) || 1)) * 100}%` }} 
                        />
                        <div 
                            className="h-full bg-indigo-500 transition-all duration-1000" 
                            style={{ width: `${(parseFloat(s.upi_sales || 0) / (parseFloat(s.month_sales) || 1)) * 100}%` }} 
                        />
                    </div>

                    <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                        <div className="flex items-center gap-2.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Cash</p>
                                <p className="text-sm font-black text-slate-900">{formatCurrency(s.cash_sales || 0)}</p>
                            </div>
                        </div>
                        <div className="w-[1px] h-8 bg-slate-200" />
                        <div className="flex items-center gap-2.5 text-right">
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">UPI Payments</p>
                                <p className="text-sm font-black text-slate-900">{formatCurrency(s.upi_sales || 0)}</p>
                            </div>
                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Sales */}
            <div className="px-4 mt-6">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-slate-900">Recent Sales</h2>
                    <button onClick={() => navigate('/sales')} className="text-xs font-semibold text-primary-700 flex items-center gap-0.5 active:text-primary-900">
                        View All <ChevronRight size={13} />
                    </button>
                </div>

                {(!s.recent_sales || s.recent_sales.length === 0) ? (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-10 flex flex-col items-center gap-3 text-center px-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                            <ShoppingBag size={22} className="text-slate-400" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-700">No sales yet</p>
                            <p className="text-xs text-slate-400 mt-1">Add today's counter amount to get started</p>
                        </div>
                        <button
                            onClick={() => navigate('/sales')}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 text-white text-xs font-bold rounded-xl active:bg-primary-700"
                        >
                            <Plus size={14} /> Add Sale
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {s.recent_sales.map((sale: any) => (
                            <div key={sale.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-success-50 flex items-center justify-center shrink-0">
                                    <ShoppingBag size={16} className="text-success-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900">{sale.notes || 'Daily Counter'}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(sale.date)}</p>
                                </div>
                                <p className="text-sm font-black text-success-700">
                                    {formatCurrency(parseFloat(sale.cash_amount) + parseFloat(sale.upi_amount))}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
