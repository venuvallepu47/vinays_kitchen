import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { ToastContainer } from './components/ui/Toast';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Sales } from './pages/Sales';
import { Vendors } from './pages/Vendors';
import { VendorProfile } from './pages/VendorProfile';
import { Materials } from './pages/Materials';
import { MaterialDetail } from './pages/MaterialDetail';
import { Workers } from './pages/Workers';
import { WorkerProfile } from './pages/WorkerProfile';
import { Attendance } from './pages/Attendance';
import { Expenses } from './pages/Expenses';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

function App() {
    return (
        <AuthProvider>
            <ToastProvider>
                <Routes>
                    {/* Public */}
                    <Route path="/login" element={<Login />} />

                    {/* Protected with layout (Bottom Nav + Top Bar) */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<AppLayout />}>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/sales" element={<Sales />} />
                            <Route path="/vendors" element={<Vendors />} />
                            <Route path="/workers" element={<Workers />} />
                            <Route path="/materials" element={<Materials />} />
                            <Route path="/attendance" element={<Attendance />} />
                            <Route path="/expenses" element={<Expenses />} />
                            <Route path="/reports" element={<Reports />} />
                            <Route path="/settings" element={<Settings />} />
                        </Route>

                        {/* Full-screen detail pages (own TopBar, no BottomNav in layout) */}
                        <Route path="/vendors/:id" element={<VendorProfile />} />
                        <Route path="/workers/:id" element={<WorkerProfile />} />
                        <Route path="/materials/:id" element={<MaterialDetail />} />
                    </Route>

                    {/* Catch-all */}
                    <Route path="*" element={<Login />} />
                </Routes>

                <ToastContainer />
            </ToastProvider>
        </AuthProvider>
    );
}

export default App;
