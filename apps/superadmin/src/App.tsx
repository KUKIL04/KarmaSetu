// apps/superadmin/src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SuperAdminLayout from './components/layout/SuperAdminLayout';
import PlatformOverview from './pages/dashboard/PlatformOverview';
import TenantList from './pages/tenants/TenantList';
import TenantDetails from './pages/tenants/TenantDetails';
import GlobalUsers from './pages/users/GlobalUsers';
import AuditLedger from './pages/audits/AuditLedger';
import SystemTelemetry from './pages/dashboard/SystemTelemetry';
import AdminLogin from './pages/auth/AdminLogin';
import ProtectedAdminRoute from './components/layout/ProtectedAdminRoute';
import { AdminAuthProvider } from './hooks/useAdminAuth';

export default function App() {
  return (
    <AdminAuthProvider>
      <Router>
        <Routes>
          {/* Public Login for Platform Owners */}
          <Route path="/login" element={<AdminLogin />} />

          {/* Protected Control Plane Routes */}
          <Route element={<ProtectedAdminRoute />}>
            <Route element={<SuperAdminLayout />}>
              <Route path="/" element={<PlatformOverview />} />
              <Route path="/tenants" element={<TenantList />} />
              <Route path="/tenants/:tenantId" element={<TenantDetails />}/>
              <Route path="/users" element={<GlobalUsers />} />
              <Route path="/audits" element={<AuditLedger />} />
              <Route path="/telemetry" element={<SystemTelemetry />} />
              {/* Future routes: /users, /billing, /security, /audits */}
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AdminAuthProvider>
  );
}