import React, { useState, useEffect } from 'react';
import { TrendingUp, ArrowDown, ArrowUp, Calendar, Filter, Download } from 'lucide-react';
import axios from 'axios';

const Reports = () => {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:5000/api/stats/profit-loss?month=${month}&year=${year}`);
            setReport(res.data);
        } catch (err) {
            console.error('Error fetching P&L report', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [month, year]);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    if (loading) return <div>Loading reports...</div>;

    const netProfit = report?.net_profit || 0;
    const isProfitable = netProfit >= 0;

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem' }}>Financial Reports (P&L)</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Detailed breakdown of revenue, expenses, and net profit.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <select 
                        value={month} 
                        onChange={(e) => setMonth(parseInt(e.target.value))}
                        className="glass"
                        style={{ width: 'auto', fontWeight: 600 }}
                    >
                        {months.map((m, i) => (
                            <option key={m} value={i + 1}>{m}</option>
                        ))}
                    </select>
                    <select 
                        value={year} 
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        className="glass"
                        style={{ width: 'auto', fontWeight: 600 }}
                    >
                        {[2024, 2025, 2026].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    <button className="btn-primary" style={{ background: 'var(--secondary)' }}>
                        <Download size={18} />
                        Export
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Sales (Income)</p>
                    <h2 style={{ color: 'var(--success)' }}>₹{report?.total_sales?.toLocaleString() || 0}</h2>
                </div>
                <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Expenses</p>
                    <h2 style={{ color: 'var(--danger)' }}>₹{( (report?.total_purchases || 0) + (report?.total_salaries || 0) ).toLocaleString()}</h2>
                </div>
                <div className="card" style={{ 
                    background: isProfitable ? '#f0fdf4' : '#fef2f2',
                    borderLeft: `4px solid ${isProfitable ? 'var(--success)' : 'var(--danger)'}`
                }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Net Profit</p>
                    <h2 style={{ color: isProfitable ? 'var(--success)' : 'var(--danger)' }}>₹{netProfit.toLocaleString()}</h2>
                </div>
            </div>

            <div className="card">
                <h3 style={{ marginBottom: '1.5rem' }}>Expense Breakdown</h3>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Details</th>
                                <th>Amount</th>
                                <th>% of Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ fontWeight: 600 }}>Raw Materials (Stock)</td>
                                <td>Inventory purchases for the month</td>
                                <td style={{ fontWeight: 700 }}>₹{report?.total_purchases?.toLocaleString() || 0}</td>
                                <td>{report?.total_sales ? ((report.total_purchases / report.total_sales) * 100).toFixed(1) : 0}%</td>
                            </tr>
                            <tr>
                                <td style={{ fontWeight: 600 }}>Worker Salaries</td>
                                <td>Based on attendance logs</td>
                                <td style={{ fontWeight: 700 }}>₹{report?.total_salaries?.toLocaleString() || 0}</td>
                                <td>{report?.total_sales ? ((report.total_salaries / report.total_sales) * 100).toFixed(1) : 0}%</td>
                            </tr>
                            <tr style={{ background: '#f8fafc' }}>
                                <td colSpan={2} style={{ fontWeight: 700, textAlign: 'right' }}>Total Expenses</td>
                                <td style={{ fontWeight: 800, color: 'var(--danger)' }}>₹{( (report?.total_purchases || 0) + (report?.total_salaries || 0) ).toLocaleString()}</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ marginTop: '2.5rem' }} className="card glass">
                <h3 style={{ marginBottom: '1rem' }}>Historical Performance</h3>
                <div style={{ height: '300px', width: '100%', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border)' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Interactive P&L Chart Coming Soon (Recharts Integration)</p>
                </div>
            </div>
        </div>
    );
};

export default Reports;
