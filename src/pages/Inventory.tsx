import React, { useState, useEffect } from 'react';
import { Package, Plus, Archive, TrendingUp, AlertCircle, ShoppingCart } from 'lucide-react';
import axios from 'axios';

const Inventory = () => {
    const [materials, setMaterials] = useState<any[]>([]);
    const [purchases, setPurchases] = useState<any[]>([]);
    const [showAddMaterial, setShowAddMaterial] = useState(false);
    const [showAddPurchase, setShowAddPurchase] = useState(false);
    
    const [newMaterial, setNewMaterial] = useState({ name: '', unit: 'kg', min_stock: '' });
    const [newPurchase, setNewPurchase] = useState({ 
        material_id: '', 
        quantity: '', 
        price_per_unit: '', 
        purchase_date: new Date().toISOString().split('T')[0],
        supplier_name: ''
    });

    const fetchData = async () => {
        try {
            const [mRes, pRes] = await Promise.all([
                axios.get('http://localhost:5000/api/inventory/stock'),
                axios.get('http://localhost:5000/api/purchases')
            ]);
            setMaterials(mRes.data);
            setPurchases(pRes.data);
        } catch (err) {
            console.error('Error fetching inventory data', err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddMaterial = async (e: any) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/materials', newMaterial);
            setShowAddMaterial(false);
            setNewMaterial({ name: '', unit: 'kg', min_stock: '' });
            fetchData();
        } catch (err) {
            console.error('Error adding material', err);
        }
    };

    const handleAddPurchase = async (e: any) => {
        e.preventDefault();
        const total_amount = parseFloat(newPurchase.quantity) * parseFloat(newPurchase.price_per_unit);
        try {
            await axios.post('http://localhost:5000/api/purchases', { ...newPurchase, total_amount });
            setShowAddPurchase(false);
            setNewPurchase({ material_id: '', quantity: '', price_per_unit: '', purchase_date: new Date().toISOString().split('T')[0], supplier_name: '' });
            fetchData();
        } catch (err) {
            console.error('Error adding purchase', err);
        }
    };

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem' }}>Inventory & Stock</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Track raw materials, stock levels, and purchase history.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-primary" style={{ background: 'var(--secondary)' }} onClick={() => setShowAddMaterial(true)}>
                        <Plus size={20} />
                        Add Material
                    </button>
                    <button className="btn-primary" onClick={() => setShowAddPurchase(true)}>
                        <ShoppingCart size={20} />
                        Record Purchase
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem' }}>Current Stock Levels</h3>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Material</th>
                                    <th>Stock</th>
                                    <th>Min. Required</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {materials.map(m => {
                                    const isLow = parseFloat(m.total_purchased) < parseFloat(m.min_stock);
                                    return (
                                        <tr key={m.id}>
                                            <td style={{ fontWeight: 600 }}>{m.name}</td>
                                            <td>{m.total_purchased} {m.unit}</td>
                                            <td>{m.min_stock} {m.unit}</td>
                                            <td>
                                                {isLow ? (
                                                    <span className="badge badge-danger">Low Stock</span>
                                                ) : (
                                                    <span className="badge badge-success">Optimal</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem' }}>Recent Purchases</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {purchases.slice(0, 5).map(p => (
                            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid var(--border)' }}>
                                <div>
                                    <p style={{ margin: 0, fontWeight: 600 }}>{p.material_name}</p>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.quantity} {p.unit} from {p.supplier_name || 'Counter'}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ margin: 0, fontWeight: 700 }}>₹{p.total_amount}</p>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(p.purchase_date).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Add Material Modal */}
            {showAddMaterial && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="card" style={{ maxWidth: '400px', width: '90%' }}>
                        <h3>Add New Raw Material</h3>
                        <form onSubmit={handleAddMaterial} style={{ marginTop: '1.5rem' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Material Name</label>
                                <input type="text" required value={newMaterial.name} onChange={(e) => setNewMaterial({...newMaterial, name: e.target.value})} placeholder="e.g. Rice, Milk, Oil" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Unit</label>
                                    <select value={newMaterial.unit} onChange={(e) => setNewMaterial({...newMaterial, unit: e.target.value})}>
                                        <option value="kg">kg</option>
                                        <option value="ltr">ltr</option>
                                        <option value="packets">packets</option>
                                        <option value="pcs">pcs</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Min. Stock</label>
                                    <input type="number" required value={newMaterial.min_stock} onChange={(e) => setNewMaterial({...newMaterial, min_stock: e.target.value})} placeholder="Alert level" />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="btn-primary" style={{ flex: 1, background: '#e2e8f0', color: 'var(--text-main)' }} onClick={() => setShowAddMaterial(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Material</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Record Purchase Modal */}
            {showAddPurchase && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="card" style={{ maxWidth: '450px', width: '90%' }}>
                        <h3>Record Material Purchase</h3>
                        <form onSubmit={handleAddPurchase} style={{ marginTop: '1.5rem' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Select Material</label>
                                <select required value={newPurchase.material_id} onChange={(e) => setNewPurchase({...newPurchase, material_id: e.target.value})}>
                                    <option value="">Choose material...</option>
                                    {materials.map(m => (
                                        <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Quantity</label>
                                    <input type="number" step="0.01" required value={newPurchase.quantity} onChange={(e) => setNewPurchase({...newPurchase, quantity: e.target.value})} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Price/Unit (₹)</label>
                                    <input type="number" step="0.01" required value={newPurchase.price_per_unit} onChange={(e) => setNewPurchase({...newPurchase, price_per_unit: e.target.value})} />
                                </div>
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Supplier / Notes</label>
                                <input type="text" value={newPurchase.supplier_name} onChange={(e) => setNewPurchase({...newPurchase, supplier_name: e.target.value})} placeholder="Vendor name" />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="btn-primary" style={{ flex: 1, background: '#e2e8f0', color: 'var(--text-main)' }} onClick={() => setShowAddPurchase(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Log Purchase</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
