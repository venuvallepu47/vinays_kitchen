import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Calendar, Trash2, TrendingUp, Filter } from 'lucide-react';
import axios from 'axios';

const Sales = () => {
    const [sales, setSales] = useState<any[]>([]);
    const [showAddSales, setShowAddSales] = useState(false);
    const [newSales, setNewSales] = useState({ 
        date: new Date().toISOString().split('T')[0], 
        amount: '', 
        description: '' 
    });

    const fetchSales = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/sales');
            setSales(res.data);
        } catch (err) {
            console.error('Error fetching sales', err);
        }
    };

    useEffect(() => {
        fetchSales();
    }, []);

    const handleAddSales = async (e: any) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/sales', newSales);
            setShowAddSales(false);
            setNewSales({ date: new Date().toISOString().split('T')[0], amount: '', description: '' });
            fetchSales();
        } catch (err) {
            console.error('Error adding sales', err);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this sales record?')) return;
        try {
            await axios.delete(`http://localhost:5000/api/sales/${id}`);
            fetchSales();
        } catch (err) {
            console.error('Error deleting sales', err);
        }
    };

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem' }}>Sales Management</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Log and track your daily tiffin shop revenue.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowAddSales(true)}>
                    <Plus size={20} />
                    Log Daily Sales
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0 }}>Sales History</h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="nav-link" style={{ padding: '8px', fontSize: '0.875rem', margin: 0 }}>
                                <Filter size={16} /> Filter
                            </button>
                        </div>
                    </div>
                    
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th>Amount</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.map(s => (
                                    <tr key={s.id}>
                                        <td style={{ fontWeight: 600 }}>{new Date(s.date).toLocaleDateString()}</td>
                                        <td>{s.description || 'Daily Tiffin Sales'}</td>
                                        <td style={{ fontWeight: 700, color: 'var(--success)' }}>₹{s.amount}</td>
                                        <td>
                                            <button 
                                                onClick={() => handleDelete(s.id)}
                                                style={{ background: 'none', color: 'var(--danger)', padding: '4px' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #fbbf24 100%)', color: 'white' }}>
                        <p style={{ opacity: 0.9, fontSize: '0.875rem', marginBottom: '0.5rem' }}>Weekly Sales</p>
                        <h2 style={{ color: 'white', fontSize: '2rem', marginBottom: '1rem' }}>₹14,580</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem' }}>
                            <TrendingUp size={16} />
                            <span>15% more than last week</span>
                        </div>
                    </div>

                    <div className="card">
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Sales Distribution</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Coming soon: Breakdown by Morning, Afternoon, and Evening sessions.</p>
                        <div style={{ height: '100px', background: '#f8fafc', borderRadius: '12px', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyCenter: 'center', border: '1px dashed var(--border)' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Chart Placeholder</span>
                        </div>
                    </div>
                </div>
            </div>

            {showAddSales && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="card" style={{ maxWidth: '400px', width: '90%' }}>
                        <h3>Record Daily Sales</h3>
                        <form onSubmit={handleAddSales} style={{ marginTop: '1.5rem' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Date</label>
                                <input 
                                    type="date" 
                                    required 
                                    value={newSales.date}
                                    onChange={(e) => setNewSales({...newSales, date: e.target.value})}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Amount (₹)</label>
                                <input 
                                    type="number" 
                                    required 
                                    placeholder="Enter total revenue"
                                    value={newSales.amount}
                                    onChange={(e) => setNewSales({...newSales, amount: e.target.value})}
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Notes / Description</label>
                                <textarea 
                                    placeholder="e.g. Morning Rush, Party Order"
                                    value={newSales.description}
                                    onChange={(e) => setNewSales({...newSales, description: e.target.value})}
                                    rows={3}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="btn-primary" style={{ flex: 1, background: '#e2e8f0', color: 'var(--text-main)' }} onClick={() => setShowAddSales(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Sales</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sales;
