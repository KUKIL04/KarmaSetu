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
  Menu
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function AdminLayout() {
  const { logout, tenantSettings } = useAuth();
  const navigate = useNavigate();
  
  // Default to collapsed for the clean, icon-only look
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Helper to calculate a dark, high-contrast opposite color
  const getInvertedSvgColor = (hex: string) => {
    if (!hex) return '%23334155'; // Dark slate fallback
    
    let cleanHex = hex.replace('#', '');
    // Handle 3-character hex codes (e.g., #fff)
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(c => c + c).join('');
    }
    if (cleanHex.length !== 6) return '%23334155'; 
    
    // 1. Invert RGB values
    let r = 255 - parseInt(cleanHex.slice(0, 2), 16);
    let g = 255 - parseInt(cleanHex.slice(2, 4), 16);
    let b = 255 - parseInt(cleanHex.slice(4, 6), 16);
    
    // 2. Darken the inverted color by 20% to ensure it pops against light backgrounds
    r = Math.floor(r * 0.8);
    g = Math.floor(g * 0.8);
    b = Math.floor(b * 0.8);
    
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `%23${toHex(r)}${toHex(g)}${toHex(b)}`; 
  };

  const svgDotColor = getInvertedSvgColor(tenantSettings?.themeColor || '');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setIsMobile(true);
        setIsCollapsed(true);
        setIsMobileOpen(false); 
      } else {
        // Tablet & Desktop: Sidebar defaults to the collapsed (icon-only) state
        setIsMobile(false);
        setIsCollapsed(true);
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

  const handleNavClick = () => {
    if (isMobile) setIsMobileOpen(false);
  };

  const navLinks = [
    { to: "/admin", icon: PlusCircle, label: "Provisioning", end: true },
    { to: "/admin/directory", icon: Users, label: "Users" },
    { to: "/admin/roles", icon: Key, label: "Access Roles" },
    { to: "/admin/modules", icon: Layers, label: "Module Map" },
    { to: "/admin/audits", icon: Activity, label: "System Audits" },
    { to: "/admin/security", icon: ShieldAlert, label: "Live Sessions" },
    { to: "/admin/settings", icon: Settings, label: "Workspace Settings" },
  ];

  const minimized = isMobile ? false : isCollapsed;

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center mb-2 rounded-xl text-sm font-bold tracking-widest uppercase transition-all whitespace-nowrap overflow-hidden ${
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
             <button
               onClick={() => setIsMobileOpen(true)}
               className="p-2 mr-3 text-slate-500 hover:text-gamboge-600 bg-white rounded-xl border border-slate-300 shadow-sm transition-transform hover:scale-105"
               title="Open Menu"
             >
               <Menu className="w-5 h-5" />
             </button>
             {/* Company Logo Integration */}
            <div className={`embossed-badge rounded-full flex items-center justify-center mx-auto mr-2 bg-lightgray overflow-hidden transition-all ${minimized ? 'w-8 h-8' : 'w-12 h-12'}`}>
              <img 
                src={tenantSettings?.logoUrl 
                      ? (tenantSettings.logoUrl.startsWith('http') ? tenantSettings.logoUrl : `${import.meta.env.VITE_API_URL?.replace('/api/v1', '')}${tenantSettings.logoUrl}`) 
                      : "/logo.png"} 
                alt="Company Logo" 
                className="w-full h-full object-cover p-1"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                  e.currentTarget.insertAdjacentHTML('afterend', '<span class="text-gamboge-500 font-extrabold text-xs">LOGO</span>');
                }}
              />
            </div>
            {/* Dynamic Organization Name */}
            <span className="font-extrabold text-slate-800 tracking-tight text-sm truncate max-w-[150px]">
              {tenantSettings?.name ? `${tenantSettings.name.toUpperCase()}` : 'WORKSPACE'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => navigate('/')} 
              className="p-2 text-slate-500 hover:text-gamboge-600 bg-white rounded-xl border border-slate-300 shadow-sm transition-transform hover:scale-105"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={handleLogout} 
              className="p-2 text-red-500 hover:text-red-600 bg-white rounded-xl border border-slate-300 shadow-sm transition-transform hover:scale-105"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>
      )}

      {/* ----------------------------- */}
      {/* HOVER-EXPANDING SIDEBAR       */}
      {/* ----------------------------- */}
      <aside 
        onMouseEnter={() => !isMobile && setIsCollapsed(false)}
        onMouseLeave={() => !isMobile && setIsCollapsed(true)}
        className={`
          embossed-card rounded-none border-y-0 border-l-0 min-h-screen flex flex-col transition-all duration-300 ease-in-out bg-white
          ${isMobile 
            ? `fixed inset-y-0 left-0 z-40 ${isMobileOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full'}` 
            : `relative z-30 ${isCollapsed ? 'w-24' : 'w-72 absolute h-full shadow-[20px_0_40px_-10px_rgba(0,0,0,0.1)]'}`
          }
        `}
      >
        <div className={`p-6 text-center border-b border-slate-200 mb-6 transition-all ${minimized ? 'px-2' : ''}`}>
          
          {/* Company Logo Integration */}
          <div className={`embossed-badge rounded-full flex items-center justify-center mx-auto mb-4 bg-lightgray overflow-hidden transition-all ${minimized ? 'w-12 h-12' : 'w-16 h-16'}`}>
            <img 
              src={tenantSettings?.logoUrl 
                    ? (tenantSettings.logoUrl.startsWith('http') ? tenantSettings.logoUrl : `${import.meta.env.VITE_API_URL?.replace('/api/v1', '')}${tenantSettings.logoUrl}`) 
                    : "/logo.png"} 
              alt="Company Logo" 
              className="w-full h-full object-cover p-1"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                e.currentTarget.insertAdjacentHTML('afterend', '<span class="text-gamboge-500 font-extrabold text-xs">LOGO</span>');
              }}
            />
          </div>
          
          <div className={`transition-opacity duration-300 ${minimized ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
            {/* Dynamic Organization Name */}
            <h2 className="text-xl font-extrabold tracking-tight text-slate-800 truncate px-2" title={tenantSettings?.name}>
              {tenantSettings?.name?.toUpperCase() || 'WORKSPACE'}
            </h2>
            <div className="h-1 w-12 rounded-full mx-auto mt-2" style={{ backgroundColor: 'var(--theme-500)' }}></div>
          </div>
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
                title={minimized ? link.label : ''}
              >
                <Icon className={`w-5 h-5 shrink-0 ${minimized ? '' : 'mr-3'}`} />
                <span className={`transition-opacity duration-300 ${minimized ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                  {link.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Actions & Branding */}
        {!isMobile && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/50">
            <button 
              onClick={() => navigate('/')} 
              className={`w-full flex items-center mb-2 rounded-xl text-sm font-bold tracking-widest uppercase text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 transition-all ${minimized ? 'justify-center p-3' : 'justify-start px-4 py-3'}`}
              title={minimized ? "Workspace Hub" : ""}
            >
              <LayoutGrid className="w-5 h-5 shrink-0" />
              <span className={`ml-3 transition-opacity duration-300 ${minimized ? 'opacity-0 w-0 hidden' : 'opacity-100 whitespace-nowrap'}`}>
                Workspace Hub
              </span>
            </button>
            <button 
              onClick={handleLogout} 
              className={`w-full flex items-center rounded-xl text-sm font-bold tracking-widest uppercase text-red-500 hover:bg-red-50 transition-all ${minimized ? 'justify-center p-3' : 'justify-start px-4 py-3'}`}
              title={minimized ? "Sign Out" : ""}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span className={`ml-3 transition-opacity duration-300 ${minimized ? 'opacity-0 w-0 hidden' : 'opacity-100 whitespace-nowrap'}`}>
                Sign Out
              </span>
            </button>

            {/* KARMASETU PLATFORM BRANDING */}
            <div className={`mt-5 text-center overflow-hidden transition-all duration-300 ${minimized ? 'h-0 opacity-0' : 'h-auto opacity-100'}`}>
              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                Powered by <br/>
                <span style={{ color: 'var(--theme-500)' }} className="text-xs tracking-[0.25em] drop-shadow-sm">KARMASETU</span>
              </p>
            </div>
          </div>
        )}
      </aside>

      {/* ----------------------------- */}
      {/* MAIN CONTENT AREA             */}
      {/* ----------------------------- */}
      <main 
        className={`flex-1 overflow-y-auto transition-all duration-300 relative ${isMobile ? 'pt-24 p-4' : 'p-8 lg:p-12'}`}
        style={{
          backgroundColor: 'color-mix(in srgb, var(--theme-500) 15%, #f8fafc)',
          backgroundImage: `
            linear-gradient(135deg, color-mix(in srgb, var(--theme-500) 6%, transparent) 0%, transparent 100%),
            url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1.5' fill='${svgDotColor}' fill-opacity='0.6'/%3E%3C/svg%3E")
          `,
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}