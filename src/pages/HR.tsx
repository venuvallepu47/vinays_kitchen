import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Calendar, DollarSign, CheckCircle2, XCircle, Clock } from 'lucide-react';
import axios from 'axios';

const HR = () => {
    const [workers, setWorkers] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newWorker, setNewWorker] = useState({ name: '', phone: '', salary_per_day: '' });

    const fetchWorkers = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/workers');
            setWorkers(res.data);
        } catch (err) {
            console.error('Error fetching workers', err);
        }
    };

    const fetchAttendance = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/attendance?date=${selectedDate}`);
            setAttendance(res.data);
        } catch (err) {
            console.error('Error fetching attendance', err);
        }
    };

    useEffect(() => {
        fetchWorkers();
    }, []);

    useEffect(() => {
        fetchAttendance();
    }, [selectedDate]);

    const handleAddWorker = async (e: any) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/workers', newWorker);
            setShowAddModal(false);
            setNewWorker({ name: '', phone: '', salary_per_day: '' });
            fetchWorkers();
        } catch (err) {
            console.error('Error adding worker', err);
        }
    };

    const logAttendance = async (worker_id: number, status: string) => {
        try {
            await axios.post('http://localhost:5000/api/attendance', {
                logs: [{ worker_id, date: selectedDate, status }]
            });
            fetchAttendance();
        } catch (err) {
            console.error('Error logging attendance', err);
        }
    };

    const getStatusForWorker = (workerId: number) => {
        const entry = attendance.find(a => a.worker_id === workerId);
        return entry ? entry.status : null;
    };

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem' }}>HR & Attendance</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage your team and track their daily presence.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                    <UserPlus size={20} />
                    Add New Worker
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0 }}>Daily Attendance</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar size={18} color="var(--text-muted)" />
                            <input 
                                type="date" 
                                value={selectedDate} 
                                onChange={(e) => setSelectedDate(e.target.value)}
                                style={{ width: 'auto', border: 'none', background: '#f1f5f9', fontWeight: 600 }}
                            />
                        </div>
                    </div>

                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Worker Name</th>
                                    <th>Daily Rate</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {workers.map(worker => {
                                    const status = getStatusForWorker(worker.id);
                                    return (
                                        <tr key={worker.id}>
                                            <td style={{ fontWeight: 600 }}>{worker.name}</td>
                                            <td>₹{worker.salary_per_day}</td>
                                            <td>
                                                {status ? (
                                                    <span className={`badge ${status === 'Present' ? 'badge-success' : status === 'Half-day' ? 'badge-warning' : 'badge-danger'}`}>
                                                        {status}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Not Logged</span>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button 
                                                        onClick={() => logAttendance(worker.id, 'Present')}
                                                        style={{ background: status === 'Present' ? 'var(--success)' : '#f1f5f9', color: status === 'Present' ? 'white' : 'inherit', padding: '6px', borderRadius: '8px' }}
                                                        title="Present"
                                                    >
                                                        <CheckCircle2 size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => logAttendance(worker.id, 'Half-day')}
                                                        style={{ background: status === 'Half-day' ? 'var(--primary)' : '#f1f5f9', color: status === 'Half-day' ? 'white' : 'inherit', padding: '6px', borderRadius: '8px' }}
                                                        title="Half-day"
                                                    >
                                                        <Clock size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => logAttendance(worker.id, 'Absent')}
                                                        style={{ background: status === 'Absent' ? 'var(--danger)' : '#f1f5f9', color: status === 'Absent' ? 'white' : 'inherit', padding: '6px', borderRadius: '8px' }}
                                                        title="Absent"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem' }}>Salary Overview</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Calculated for current month.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {workers.slice(0, 3).map(worker => (
                            <div key={worker.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid var(--border)' }}>
                                <div>
                                    <p style={{ margin: 0, fontWeight: 600 }}>{worker.name}</p>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Daily: ₹{worker.salary_per_day}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ margin: 0, fontWeight: 700, color: 'var(--success)' }}>₹{parseFloat(worker.salary_per_day) * 15}</p>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>15 days worked</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="btn-primary" style={{ width: '100%', marginTop: '1.5rem', background: 'var(--secondary)' }}>
                        Generate Monthly Salaries
                    </button>
                </div>
            </div>

            {showAddModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyCenter: 'center', zIndex: 100 }}>
                    <div className="card" style={{ maxWidth: '400px', width: '90%' }}>
                        <h3>Add New Worker</h3>
                        <form onSubmit={handleAddWorker} style={{ marginTop: '1.5rem' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Full Name</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={newWorker.name}
                                    onChange={(e) => setNewWorker({...newWorker, name: e.target.value})}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Phone Number</label>
                                <input 
                                    type="text" 
                                    value={newWorker.phone}
                                    onChange={(e) => setNewWorker({...newWorker, phone: e.target.value})}
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Daily Salary (₹)</label>
                                <input 
                                    type="number" 
                                    required 
                                    value={newWorker.salary_per_day}
                                    onChange={(e) => setNewWorker({...newWorker, salary_per_day: e.target.value})}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="btn-primary" style={{ flex: 1, background: '#e2e8f0', color: 'var(--text-main)' }} onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Worker</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HR;
