import React, { useEffect, useState } from 'react';
import { 
  DollarSign, 
  Package, 
  Users, 
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import axios from 'axios';

const StatCard = ({ title, value, icon: Icon, color, trend, trendValue }: any) => (
  <div className="card animate-fade">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>{title}</p>
        <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{value}</h3>
      </div>
      <div style={{ 
        background: `${color}15`, 
        color: color, 
        padding: '10px', 
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={24} />
      </div>
    </div>
    {trend && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1rem', fontSize: '0.75rem' }}>
        {trend === 'up' ? <ArrowUpRight size={14} color="var(--success)" /> : <ArrowDownRight size={14} color="var(--danger)" />}
        <span style={{ color: trend === 'up' ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{trendValue}</span>
        <span style={{ color: 'var(--text-muted)' }}>from last month</span>
      </div>
    )}
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/stats/dashboard');
        setStats(res.data);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem' }}>Welcome back, Vinay! 👋</h1>
        <p style={{ color: 'var(--text-muted)' }}>Here's what's happening at Vinay's Kitchen today.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <StatCard 
          title="Today's Sales" 
          value={loading ? '...' : `₹${stats?.today_sales || 0}`} 
          icon={DollarSign} 
          color="#f59e0b"
          trend="up"
          trendValue="12%"
        />
        <StatCard 
          title="Active Workers" 
          value={loading ? '...' : stats?.worker_count || 0} 
          icon={Users} 
          color="#4f46e5" 
        />
        <StatCard 
          title="Low Stock Items" 
          value={loading ? '...' : stats?.low_stock_count || 0} 
          icon={Package} 
          color="#ef4444" 
        />
        <StatCard 
          title="Monthly Profit" 
          value="₹45,200" 
          icon={TrendingUp} 
          color="#10b981"
          trend="up"
          trendValue="8%"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>Recent Sales</h3>
            <button style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.875rem', background: 'none' }}>View All</button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Morning Breakfast Bulk</td>
                  <td>Oct 24, 2024</td>
                  <td>₹2,450</td>
                  <td><span className="badge badge-success">Paid</span></td>
                </tr>
                <tr>
                  <td>Lunch Parcel Service</td>
                  <td>Oct 24, 2024</td>
                  <td>₹1,200</td>
                  <td><span className="badge badge-success">Paid</span></td>
                </tr>
                <tr>
                  <td>Evening Snacks</td>
                  <td>Oct 23, 2024</td>
                  <td>₹850</td>
                  <td><span className="badge badge-warning">Pending</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Inventory Alerts</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '12px', padding: '12px', background: '#fff7ed', borderRadius: '12px', border: '1px solid #ffedd5' }}>
              <AlertTriangle color="#f97316" size={20} />
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem' }}>Rice Stock Low</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#9a3412' }}>Only 5kg remaining. Minimum: 20kg</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', padding: '12px', background: '#fff1f2', borderRadius: '12px', border: '1px solid #ffe4e6' }}>
              <AlertTriangle color="#e11d48" size={20} />
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem' }}>Milk Out of Stock</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#9f1239' }}>Order immediately for tomorrow's prep.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
