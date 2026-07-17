import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  PlusCircle, 
  UserCheck, 
  Users, 
  Activity, 
  LogOut, 
  LayoutGrid,
  Key,
  Layers,
  ShieldAlert,
  Settings
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-4 py-3 mb-2 rounded-xl text-sm font-bold tracking-widest uppercase transition-all ${
      isActive 
        ? 'bg-lightgray text-gamboge-600 shadow-inner border border-slate-300' 
        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
    }`;

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-800">
      
      {/* Sidebar Navigation */}
      <aside className="w-72 embossed-card rounded-none border-y-0 border-l-0 min-h-screen flex flex-col z-20">
        <div className="p-8 text-center border-b border-slate-300/50 mb-6">
          <div className="w-16 h-16 embossed-badge rounded-full flex items-center justify-center mx-auto mb-4 bg-lightgray">
            <ShieldCheck className="w-8 h-8 text-gamboge-500" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-800">HR COMMAND</h2>
          <div className="h-1 w-12 bg-gamboge-500 rounded-full mx-auto mt-2"></div>
        </div>

        <nav className="flex-1 px-4 overflow-y-auto">
          <NavLink to="/admin" end className={navItemClass}>
            <PlusCircle className="w-5 h-5 mr-3" /> Provisioning
          </NavLink>
          <NavLink to="/admin/approvals" className={navItemClass}>
            <UserCheck className="w-5 h-5 mr-3" /> Approvals
          </NavLink>
          <NavLink to="/admin/directory" className={navItemClass}>
            <Users className="w-5 h-5 mr-3" /> Directory
          </NavLink>
          <NavLink to="/admin/roles" className={navItemClass}>
            <Key className="w-5 h-5 mr-3" /> Access Roles
          </NavLink>
          <NavLink to="/admin/modules" className={navItemClass}>
            <Layers className="w-5 h-5 mr-3" /> Module Map
          </NavLink>
          <NavLink to="/admin/audits" className={navItemClass}>
            <Activity className="w-5 h-5 mr-3" /> System Audits
          </NavLink>
          <NavLink to="/admin/security" className={navItemClass}>
            <ShieldAlert className="w-5 h-5 mr-3" /> Live Sessions
          </NavLink>
          <NavLink to="/admin/settings" className={navItemClass}>
            <Settings className="w-5 h-5 mr-3" /> Workspace Settings
          </NavLink>
        </nav>

        <div className="p-4 border-t border-slate-300/50">
          <button onClick={() => navigate('/')} className="w-full flex items-center px-4 py-3 mb-2 rounded-xl text-sm font-bold tracking-widest uppercase text-slate-500 hover:text-gamboge-600 transition-all">
            <LayoutGrid className="w-5 h-5 mr-3" /> Workspace Hub
          </button>
          <button onClick={handleLogout} className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-bold tracking-widest uppercase text-red-500 hover:bg-red-50 transition-all">
            <LogOut className="w-5 h-5 mr-3" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area (Dynamic Outlet) */}
      <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}