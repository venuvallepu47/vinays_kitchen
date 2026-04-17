import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Settings as SettingsIcon,
  Search,
  Plus
} from 'lucide-react';

// Lazy load pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const HR = React.lazy(() => import('./pages/HR'));
const Inventory = React.lazy(() => import('./pages/Inventory'));
const Sales = React.lazy(() => import('./pages/Sales'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Settings = React.lazy(() => import('./pages/Settings'));

const Sidebar = ({ isOpen, toggle }: any) => (
  <div className={`sidebar ${isOpen ? 'open' : ''}`}>
    <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img src="/logo.png" alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }} />
        <h2 style={{ color: 'white', fontSize: '1.25rem', margin: 0 }}>Vinay's Kitchen</h2>
      </div>
      <button className="mobile-only" onClick={toggle} style={{ background: 'none', color: 'white' }}>
        <XCircle size={24} />
      </button>
    </div>
    
    <nav style={{ flex: 1 }}>
      <NavLink to="/dashboard" onClick={toggle} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
        <LayoutDashboard size={20} />
        Dashboard
      </NavLink>
      <NavLink to="/sales" onClick={toggle} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
        <ShoppingCart size={20} />
        Sales Management
      </NavLink>
      <NavLink to="/inventory" onClick={toggle} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
        <Package size={20} />
        Inventory/Stock
      </NavLink>
      <NavLink to="/hr" onClick={toggle} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
        <Users size={20} />
        HR & Attendance
      </NavLink>
      <NavLink to="/reports" onClick={toggle} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
        <TrendingUp size={20} />
        P&L Reports
      </NavLink>
    </nav>

    <div style={{ marginTop: 'auto', borderTop: '1px solid #334155', paddingTop: '1.5rem' }}>
      <NavLink to="/settings" onClick={toggle} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
        <SettingsIcon size={20} />
        Settings
      </NavLink>
    </div>
  </div>
);

const Header = ({ toggleSidebar }: any) => (
  <header style={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '1.5rem',
    background: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: '16px',
    boxShadow: 'var(--shadow-sm)'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <button className="mobile-only" onClick={toggleSidebar} style={{ background: 'none', color: 'var(--text-main)', padding: '5px' }}>
        <Menu size={24} />
      </button>
      <div className="desktop-only" style={{ position: 'relative', width: '300px' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          placeholder="Search everything..." 
          style={{ paddingLeft: '40px', background: '#f1f5f9', border: 'none' }}
        />
      </div>
    </div>
    
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <button className="btn-primary desktop-only" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
        <Plus size={18} />
        Quick Action
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ textAlign: 'right' }} className="desktop-only">
          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem' }}>Vinay Admin</p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Owner</p>
        </div>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}></div>
      </div>
    </div>
  </header>
);

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <Router>
      <div className="layout">
        <Sidebar isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(false)} />
        {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}
        <main className="main-content">
          <Header toggleSidebar={() => setIsSidebarOpen(true)} />
          <React.Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/hr" element={<HR />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </React.Suspense>
        </main>
      </div>
    </Router>
  );
}

export default App;
