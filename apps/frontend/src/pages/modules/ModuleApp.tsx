import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { UserAPI } from '../../api/user.api';
import { LayoutGrid, LogOut, User, Component, ShieldCheck, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ModuleApp() {
  // 1. Extract tenantSettings
  const { user, logout, tenantSettings } = useAuth();
  const [modules, setModules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMyModules = async () => {
      try {
        const data = await UserAPI.getMyModules();
        setModules(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch assigned modules", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMyModules();
  }, []);

  return (
    // 2. Added the frosted dot-matrix background to the outer wrapper
    <div 
      className="min-h-screen text-slate-700 p-4 sm:p-8 font-sans transition-all duration-300"
      style={{
        backgroundColor: '#f8fafc',
        backgroundImage: `
          linear-gradient(135deg, color-mix(in srgb, var(--theme-500) 6%, transparent) 0%, transparent 100%),
          url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1.5' fill='%23cbd5e1' fill-opacity='0.4'/%3E%3C/svg%3E")
        `,
        backgroundAttachment: 'fixed'
      }}
    >
      
      {/* Top Navigation Bar (Floating Neumorphic Pill) */}
      <nav className="max-w-7xl mx-auto embossed-card p-4 mb-10 flex items-center justify-between bg-white/80 backdrop-blur-md">
        <div className="flex items-center space-x-4 ml-2">
          
          {/* Dynamic Company Logo */}
          <div className="w-10 h-10 embossed-badge rounded-full flex items-center justify-center bg-lightgray overflow-hidden">
            <img 
              src={tenantSettings?.logoUrl 
                    ? (tenantSettings.logoUrl.startsWith('http') ? tenantSettings.logoUrl : `${import.meta.env.VITE_API_URL?.replace('/api/v1', '')}${tenantSettings.logoUrl}`) 
                    : "/logo.png"} 
              alt="Logo" 
              className="w-full h-full object-cover p-1"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          
          {/* Dynamic Company Name */}
          <span className="text-xl font-extrabold tracking-tight text-slate-800 uppercase">
            {tenantSettings?.name || 'WORKSPACE'}
          </span>
        </div>
        
        <div className="flex items-center space-x-4 sm:space-x-6 mr-2">
          <div className="hidden sm:flex items-center text-xs font-bold text-slate-600 uppercase tracking-widest bg-lightgray px-4 py-2 rounded-xl shadow-inner border border-slate-200">
            <User className="w-4 h-4 mr-2 text-gamboge-600" />
            {user?.firstName} {user?.lastName}
          </div>
          
          {user?.isAdmin && (
            <Link to="/admin" className="text-xs font-bold text-gamboge-600 hover:text-gamboge-700 uppercase tracking-widest transition-colors flex items-center bg-gamboge-50 px-3 py-2 rounded-lg border border-gamboge-100">
              <ShieldCheck className="w-4 h-4 mr-1" /> Admin
            </Link>
          )}

          <button onClick={logout} className="flex items-center text-xs font-bold text-slate-500 hover:text-red-500 uppercase tracking-widest transition-colors px-2 py-2 rounded-lg hover:bg-red-50">
            <LogOut className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Main Content Dashboard */}
      <main className="max-w-7xl mx-auto">
        <div className="mb-10 pl-2">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Welcome Back, {user?.firstName}
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-medium tracking-wide">
            Your account is fully activated. Select an application module below to begin your session.
          </p>
        </div>

        {isLoading ? (
          <div className="text-gamboge-600 font-bold tracking-widest uppercase flex items-center pl-2">
             <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading workspace modules...
          </div>
        ) : modules.length === 0 ? (
          <div className="embossed-card p-10 text-center max-w-2xl mx-auto mt-16 bg-white/60 backdrop-blur-sm">
            <div className="inner-depth w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <LayoutGrid className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">No Modules Assigned</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              You currently do not have access to any workspace applications. Please contact your administrator to provision access for your role.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {modules.map((mod) => (
              <div key={mod.id} className="embossed-card p-6 cursor-pointer group hover:-translate-y-1 transition-transform duration-300 bg-white/80 backdrop-blur-sm">
                <div className="w-14 h-14 inner-depth rounded-2xl flex items-center justify-center mb-6 group-hover:bg-lightgray transition-colors border border-slate-100">
                  <Component className="w-7 h-7 text-gamboge-500 drop-shadow-sm" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">{mod.name}</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  {mod.description || 'Access enterprise operations and foundational records for this module.'}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
      
      {/* Platform Branding */}
      <div className="mt-16 pb-8 text-center opacity-70">
        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
          Powered by <br/>
          <span style={{ color: 'var(--theme-500)' }} className="text-xs tracking-[0.25em] drop-shadow-sm">KARMASETU</span>
        </p>
      </div>
    </div>
  );
}