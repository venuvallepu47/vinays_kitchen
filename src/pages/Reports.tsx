import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, getISTDate } from '../utils/format';
import { cn } from '../utils/cn';
import api from '../utils/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function Reports() {
    const istNow = getISTDate();
    const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
    const [month, setMonth] = useState(istNow.getMonth() + 1);
    const [year, setYear] = useState(istNow.getFullYear());
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({ period });
            if (period === 'monthly') {
                query.append('month', month.toString());
                query.append('year', year.toString());
            }
            if (period === 'yearly') query.append('year', year.toString());
            
            const res = await api.get(`/stats/profit-loss?${query.toString()}`);
            setReport(res.data);
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => { fetchReport(); }, [period, month, year]);

    const isProfitable = (report?.net_profit || 0) >= 0;

    const ExpenseRow = ({ label, amount, pct }: { label: string; amount: number; pct: number }) => (
        <div className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800">{label}</p>
                <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-danger-400 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
            </div>
            <div className="text-right shrink-0">
                <p className="text-sm font-black text-slate-700">{formatCurrency(amount)}</p>
                <p className="text-[10px] text-slate-400">{pct.toFixed(1)}%</p>
            </div>
        </div>
    );

    return (
        <div className="pb-24">
            <div className="px-4 pt-4 pb-3">
                {/* Period Toggle */}
                <div className="flex bg-slate-100 rounded-[20px] p-1.5 mb-4 shadow-inner">
                    {(['monthly', 'yearly'] as const).map(p => (
                        <button key={p} onClick={() => setPeriod(p)} className={cn('flex-1 py-2.5 text-[11px] font-black rounded-[14px] transition-all capitalize tracking-wider', period === p ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400')}>
                            {p}
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex gap-3">
                    {period === 'monthly' && (
                        <>
                            <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="flex-1 h-12 px-4 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-900 shadow-sm focus:shadow-md transition-all outline-none focus:border-primary-500 appearance-none">
                                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                            </select>
                            <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="w-32 h-12 px-4 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-900 shadow-sm focus:shadow-md transition-all outline-none focus:border-primary-500 appearance-none">
                                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </>
                    )}
                    {period === 'yearly' && (
                        <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="flex-1 h-12 px-4 bg-white border border-slate-200 rounded-2xl text-base font-black text-slate-900 shadow-sm focus:shadow-md transition-all outline-none focus:border-primary-500 appearance-none">
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-10 h-10 border-3 border-primary-500/20 border-t-primary-600 rounded-full animate-spin" />
                </div>
            ) : report && (
                <div className="px-4 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {/* Net Profit Hero */}
                    <div className={cn(
                        'rounded-[32px] p-8 text-center relative overflow-hidden transition-all shadow-lg',
                        isProfitable 
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/10' 
                            : 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-rose-500/10'
                    )}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full -ml-8 -mb-8 blur-xl" />
                        
                        <div className="flex justify-center mb-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                {isProfitable
                                    ? <TrendingUp size={28} className="text-white" />
                                    : <TrendingDown size={28} className="text-white" />
                                }
                            </div>
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">
                             Business Net {isProfitable ? 'Profit' : 'Loss'}
                        </p>
                        <p className="text-4xl font-black tracking-tight mb-2">
                            {formatCurrency(Math.abs(report.net_profit))}
                        </p>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/10 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
                            {MONTHS[month-1]} {year} Performance
                        </div>
                    </div>

                    {/* Financial Summaries */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col items-center text-center">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                                <TrendingUp size={18} className="text-emerald-600" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Revenue</p>
                            <p className="text-lg font-black text-slate-900 mb-4">{formatCurrency(report.total_sales)}</p>
                            
                            <div className="w-full space-y-2 pt-3 border-t border-slate-50">
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-slate-400">CASH</span>
                                    <span className="text-slate-700">{formatCurrency(report.cash_sales || 0)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-slate-400">UPI QR</span>
                                    <span className="text-slate-700">{formatCurrency(report.upi_sales || 0)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col items-center text-center">
                            <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center mb-3">
                                <TrendingDown size={18} className="text-rose-600" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Costs</p>
                            <p className="text-lg font-black text-slate-900 mb-4">{formatCurrency(report.total_costs)}</p>
                            
                            <p className="text-[10px] text-slate-300 font-bold italic leading-tight px-1">
                                All operating costs for this period.
                            </p>
                        </div>
                    </div>

                    {/* Expense Breakdown */}
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                                <BarChart3 size={18} className="text-slate-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-900">Expense Analysis</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Percentage of total sales</p>
                            </div>
                        </div>
                        
                        {report.total_sales > 0 ? (
                            <div className="space-y-6">
                                <ExpenseRow label="Raw Materials (Stock)" amount={report.total_purchases} pct={report.total_sales ? (report.total_purchases / report.total_sales) * 100 : 0} />
                                <ExpenseRow label="Salary Payments" amount={report.total_salaries} pct={report.total_sales ? (report.total_salaries / report.total_sales) * 100 : 0} />
                                <ExpenseRow label="Fixed Expenses" amount={report.total_expenses} pct={report.total_sales ? (report.total_expenses / report.total_sales) * 100 : 0} />
                            </div>
                        ) : (
                            <div className="py-8 flex flex-col items-center gap-2">
                                <div className="w-full h-1 bg-slate-50 rounded-full" />
                                <p className="text-xs text-slate-400 font-bold italic mt-2">Insufficient sales data to run breakdown</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
