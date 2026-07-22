import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { 
  Terminal, LayoutDashboard, Building2, Users, 
  CreditCard, Activity, Flag, Shield, LogOut, 
  Menu, X 
} from 'lucide-react';

export default function SuperAdminLayout() {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navGroups = [
    {
      label: 'Core Platform',
      items: [
        { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Tenant Fleet', path: '/tenants', icon: Building2 },
        { name: 'Global Identity', path: '/users', icon: Users },
      ]
    },
    {
      label: 'Enterprise Metrics (Beta)',
      items: [
        { name: 'Revenue & Billing', path: '/billing', icon: CreditCard, placeholder: true },
        { name: 'System Telemetry', path: '/telemetry', icon: Activity, placeholder: true },
      ]
    },
    {
      label: 'Control Plane',
      items: [
        { name: 'Feature Flags', path: '/flags', icon: Flag, placeholder: true },
        { name: 'Audit Ledger', path: '/audits', icon: Shield },
      ]
    }
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-950 text-slate-300 border-r border-slate-800 w-64 shrink-0">
      
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0">
        <Terminal className="w-6 h-6 text-indigo-500 mr-3" />
        <span className="font-extrabold text-white tracking-tight uppercase text-lg">Karmasetu OS</span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-thin scrollbar-thumb-slate-800">
        {navGroups.map((group, idx) => (
          <div key={idx}>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-3">
              {group.label}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) => `
                    flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all group
                    ${isActive 
                      ? 'bg-indigo-500/10 text-indigo-400 font-bold' 
                      : 'hover:bg-slate-900 hover:text-white'}
                  `}
                >
                  <item.icon className="w-5 h-5 mr-3 opacity-70 group-hover:opacity-100 transition-opacity" />
                  {item.name}
                  {item.placeholder && (
                     <span className="ml-auto text-[9px] font-bold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                       Soon
                     </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800 shrink-0">
        <div className="flex items-center bg-slate-900 rounded-xl p-3 border border-slate-800">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
          </div>
          <div className="ml-3 min-w-0 flex-1">
            <p className="text-sm font-bold text-white truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-[10px] text-slate-400 truncate uppercase tracking-wider">SuperAdmin</p>
          </div>
          <button 
            onClick={handleLogout}
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors ml-2 shrink-0"
            title="End Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-950 font-sans selection:bg-indigo-500/30">
      
      {/* Desktop Sidebar */}
      <div className="hidden md:block h-full">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative flex w-full max-w-xs flex-1 animate-in slide-in-from-left duration-200">
            <SidebarContent />
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 -right-12 p-2 text-slate-300 hover:text-white bg-slate-800 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Top Header (Mobile Only for Sidebar Toggle) */}
        <header className="md:hidden h-16 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center">
            <Terminal className="w-5 h-5 text-indigo-500 mr-2" />
            <span className="font-extrabold text-white tracking-tight uppercase">Karmasetu OS</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto z-10">
          <div className="p-6 md:p-8 xl:p-10 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}