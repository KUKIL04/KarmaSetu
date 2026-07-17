import React, { useState, useEffect } from 'react';
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
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Responsive layout breakpoints
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        // Mobile: Sidebar acts as an off-canvas drawer
        setIsMobile(true);
        setIsCollapsed(true);
        setIsMobileOpen(false); 
      } else if (width < 1280) {
        // Tablet: Auto-collapsed visible sidebar
        setIsMobile(false);
        setIsCollapsed(true);
        setIsMobileOpen(false);
      } else {
        // Large Desktop: Fully expanded
        setIsMobile(false);
        setIsCollapsed(false);
        setIsMobileOpen(false);
      }
    };
    
    handleResize(); 
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleNavClick = () => {
    if (isMobile) setIsMobileOpen(false); // Auto-close drawer on mobile navigation
  };

  const navLinks = [
    { to: "/admin", icon: PlusCircle, label: "Provisioning", end: true },
    { to: "/admin/approvals", icon: UserCheck, label: "Approvals" },
    { to: "/admin/directory", icon: Users, label: "Directory" },
    { to: "/admin/roles", icon: Key, label: "Access Roles" },
    { to: "/admin/modules", icon: Layers, label: "Module Map" },
    { to: "/admin/audits", icon: Activity, label: "System Audits" },
    { to: "/admin/security", icon: ShieldAlert, label: "Live Sessions" },
    { to: "/admin/settings", icon: Settings, label: "Workspace Settings" },
  ];

  // Logic to determine if the sidebar text should be hidden
  const minimized = isMobile ? false : isCollapsed;

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center mb-2 rounded-xl text-sm font-bold tracking-widest uppercase transition-all ${
      isActive 
        ? 'bg-lightgray text-gamboge-600 shadow-inner border border-slate-300' 
        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
    } ${minimized ? 'justify-center p-3' : 'justify-start px-4 py-3'}`;

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-800 overflow-hidden">
      
      {/* ----------------------------- */}
      {/* MOBILE OVERLAY                */}
      {/* ----------------------------- */}
      {isMobile && isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-800/20 backdrop-blur-sm z-30 transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* ----------------------------- */}
      {/* MOBILE TOP HEADER             */}
      {/* ----------------------------- */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 h-16 bg-slate-50/95 backdrop-blur-md border-b border-slate-300/50 z-20 flex items-center justify-between px-4 shadow-sm">
          <div className="flex items-center">
             {/* New Mobile Hamburger Menu Button */}
             <button
               onClick={() => setIsMobileOpen(true)}
               className="p-2 mr-3 text-slate-500 hover:text-gamboge-600 bg-white rounded-xl border border-slate-300 shadow-sm transition-transform hover:scale-105"
               title="Open Menu"
             >
               <Menu className="w-5 h-5" />
             </button>
             <ShieldCheck className="w-6 h-6 text-gamboge-500 mr-2" />
             <span className="font-extrabold text-slate-800 tracking-tight text-sm">HR COMMAND</span>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => navigate('/')} 
              className="p-2 text-slate-500 hover:text-gamboge-600 bg-white rounded-xl border border-slate-300 shadow-sm transition-transform hover:scale-105"
              title="Workspace Hub"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={handleLogout} 
              className="p-2 text-red-500 hover:text-red-600 bg-white rounded-xl border border-slate-300 shadow-sm transition-transform hover:scale-105"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>
      )}

      {/* ----------------------------- */}
      {/* UNIFIED SIDEBAR               */}
      {/* ----------------------------- */}
      <aside 
        className={`
          embossed-card rounded-none border-y-0 border-l-0 min-h-screen flex flex-col transition-all duration-300 ease-in-out
          ${isMobile 
            ? `fixed inset-y-0 left-0 z-40 ${isMobileOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full'}` 
            : `relative z-20 ${isCollapsed ? 'w-24 translate-x-0' : 'w-72 translate-x-0'}`
          }
        `}
      >
        {/* Floating Toggle Button (Only visible on Desktop/Tablet) */}
        {!isMobile && (
          <button
            onClick={handleToggle}
            className="absolute -right-4 top-10 w-8 h-8 bg-slate-100 border border-slate-300 rounded-full flex items-center justify-center text-slate-500 hover:text-gamboge-600 shadow-md z-50 transition-transform hover:scale-105 cursor-pointer"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        )}

        <div className={`p-6 text-center border-b border-slate-300/50 mb-6 transition-all ${minimized ? 'px-2' : ''}`}>
          <div className={`embossed-badge rounded-full flex items-center justify-center mx-auto mb-4 bg-lightgray transition-all ${minimized ? 'w-12 h-12' : 'w-16 h-16'}`}>
            <ShieldCheck className={`text-gamboge-500 transition-all ${minimized ? 'w-6 h-6' : 'w-8 h-8'}`} />
          </div>
          
          {!minimized && (
            <div className="animate-in fade-in duration-300">
              <h2 className="text-xl font-extrabold tracking-tight text-slate-800 whitespace-nowrap">HR COMMAND</h2>
              <div className="h-1 w-12 bg-gamboge-500 rounded-full mx-auto mt-2"></div>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 overflow-y-auto overflow-x-hidden pb-4">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink 
                key={link.to}
                to={link.to} 
                end={link.end}
                onClick={handleNavClick}
                className={navItemClass} 
                title={link.label}
              >
                <Icon className={`w-5 h-5 shrink-0 ${minimized ? '' : 'mr-3'}`} />
                {!minimized && <span className="truncate">{link.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Actions (Hidden on Mobile, since they are in the top header) */}
        {!isMobile && (
          <div className="p-4 border-t border-slate-300/50">
            <button 
              onClick={() => navigate('/')} 
              className={`w-full flex items-center mb-2 rounded-xl text-sm font-bold tracking-widest uppercase text-slate-500 hover:text-gamboge-600 transition-all ${minimized ? 'justify-center p-3' : 'justify-start px-4 py-3'}`}
              title="Workspace Hub"
            >
              <LayoutGrid className="w-5 h-5 shrink-0" />
              {!minimized && <span className="ml-3 truncate">Workspace Hub</span>}
            </button>
            <button 
              onClick={handleLogout} 
              className={`w-full flex items-center rounded-xl text-sm font-bold tracking-widest uppercase text-red-500 hover:bg-red-50 transition-all ${minimized ? 'justify-center p-3' : 'justify-start px-4 py-3'}`}
              title="Sign Out"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {!minimized && <span className="ml-3 truncate">Sign Out</span>}
            </button>
          </div>
        )}
      </aside>

      {/* ----------------------------- */}
      {/* MAIN CONTENT AREA             */}
      {/* ----------------------------- */}
      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${isMobile ? 'pt-24 p-4' : 'p-8 lg:p-12'}`}>
        <Outlet />
      </main>
    </div>
  );
}