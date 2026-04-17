import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { cn } from '../utils/cn';
import api from '../utils/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function Reports() {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/stats/profit-loss?month=${month}&year=${year}`);
            setReport(res.data);
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => { fetchReport(); }, [month, year]);

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
                {/* Month/Year Selector */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex gap-3">
                    <select
                        value={month}
                        onChange={e => setMonth(parseInt(e.target.value))}
                        className="flex-1 h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    >
                        {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                    </select>
                    <select
                        value={year}
                        onChange={e => setYear(parseInt(e.target.value))}
                        className="w-28 h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    >
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-600 rounded-full animate-spin" />
                </div>
            ) : report && (
                <div className="px-4 space-y-4">
                    {/* Net Profit Hero */}
                    <div className={cn('rounded-2xl p-6 text-center', isProfitable ? 'bg-success-50 border border-success-200' : 'bg-danger-50 border border-danger-200')}>
                        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3', isProfitable ? 'bg-success-100' : 'bg-danger-100')}>
                            {isProfitable
                                ? <TrendingUp size={24} className="text-success-600" />
                                : <TrendingDown size={24} className="text-danger-600" />
                            }
                        </div>
                        <p className={cn('text-[11px] font-bold uppercase tracking-widest mb-1', isProfitable ? 'text-success-600' : 'text-danger-600')}>
                            Net {isProfitable ? 'Profit' : 'Loss'}
                        </p>
                        <p className={cn('text-4xl font-black', isProfitable ? 'text-success-800' : 'text-danger-800')}>
                            {formatCurrency(Math.abs(report.net_profit))}
                        </p>
                    </div>

                    {/* Revenue vs Cost */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                            <p className="text-[10px] font-bold text-success-600 uppercase tracking-widest mb-1">Revenue</p>
                            <p className="text-xl font-black text-slate-900">{formatCurrency(report.total_sales)}</p>
                            <p className="text-[10px] text-slate-400 mt-1">counter sales</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                            <p className="text-[10px] font-bold text-danger-600 uppercase tracking-widest mb-1">Total Costs</p>
                            <p className="text-xl font-black text-slate-900">{formatCurrency(report.total_costs)}</p>
                            <p className="text-[10px] text-slate-400 mt-1">all expenses</p>
                        </div>
                    </div>

                    {/* Expense Breakdown */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 size={16} className="text-slate-400" />
                            <p className="text-sm font-bold text-slate-900">Expense Breakdown</p>
                        </div>
                        {report.total_sales > 0 ? (
                            <>
                                <ExpenseRow label="Raw Materials (Stock)" amount={report.total_purchases} pct={report.total_sales ? (report.total_purchases / report.total_sales) * 100 : 0} />
                                <ExpenseRow label="Salary Payments" amount={report.total_salaries} pct={report.total_sales ? (report.total_salaries / report.total_sales) * 100 : 0} />
                                <ExpenseRow label="Rent & Other Expenses" amount={report.total_expenses} pct={report.total_sales ? (report.total_expenses / report.total_sales) * 100 : 0} />
                            </>
                        ) : (
                            <p className="text-sm text-slate-400 text-center py-4">No sales data for this period</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
