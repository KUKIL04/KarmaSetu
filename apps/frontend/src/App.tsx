import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AdminRoute } from './components/layout/AdminRoute';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import WaitingRoom from './pages/dashboard/WaitingRoom';
import ModuleApp from './pages/modules/ModuleApp';
import TenantOnboarding from './pages/tenant/TenantOnboarding';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import ProvisioningManager from './pages/admin/ProvisioningManager';
import DirectoryControl from './pages/admin/DirectoryControl';
import SystemAudits from './pages/admin/SystemAudits';
import RolesManager from './pages/admin/RolesManager';
import ModuleManager from './pages/admin/ModuleManager';
import SecurityControl from './pages/admin/SecurityControl';
import WorkspaceSettings from './pages/admin/WorkspaceSettings';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/onboard-workspace" element={<TenantOnboarding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Routes (Requires Authentication) */}
        <Route element={<ProtectedRoute />}>
          
          <Route path="/waiting-room" element={<WaitingRoom />} />
          <Route path="/" element={<ModuleApp />} />

          {/* HR Admin Only Routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<ProvisioningManager />} />
              <Route path="directory" element={<DirectoryControl />} />
              <Route path="audits" element={<SystemAudits />} />
              <Route path="roles" element={<RolesManager />} />
              <Route path="modules" element={<ModuleManager />} />
              <Route path="security" element={<SecurityControl />} />
              <Route path="settings" element={<WorkspaceSettings />} />
            </Route>
          </Route>

        </Route>

        {/* Catch-all 404 redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}