import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { UserAPI } from '../../api/user.api';
import { LayoutGrid, LogOut, User, Building2, Component, ShieldCheck, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ModuleApp() {
  const { user, logout } = useAuth();
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
    <div className="min-h-screen text-slate-700 p-4 sm:p-8 font-sans">
      
      {/* Top Navigation Bar (Floating Neumorphic Pill) */}
      <nav className="max-w-7xl mx-auto embossed-card p-4 mb-10 flex items-center justify-between">
        <div className="flex items-center space-x-4 ml-2">
          <div className="w-10 h-10 embossed-badge rounded-full flex items-center justify-center bg-lightgray">
            <Building2 className="w-5 h-5 text-gamboge-500" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-800">DRISHTEE HUB</span>
        </div>
        
        <div className="flex items-center space-x-4 sm:space-x-6 mr-2">
          <div className="hidden sm:flex items-center text-xs font-bold text-slate-600 uppercase tracking-widest bg-lightgray px-4 py-2 rounded-xl shadow-inner">
            <User className="w-4 h-4 mr-2 text-gamboge-600" />
            {user?.firstName} {user?.lastName}
          </div>
          
          {user?.isAdmin && (
            <Link to="/admin" className="text-xs font-bold text-gamboge-600 hover:text-gamboge-700 uppercase tracking-widest transition-colors flex items-center">
              <ShieldCheck className="w-4 h-4 mr-1" /> Admin
            </Link>
          )}

          <button onClick={logout} className="flex items-center text-xs font-bold text-slate-500 hover:text-red-500 uppercase tracking-widest transition-colors">
            <LogOut className="w-4 h-4 mr-1" />
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content Dashboard */}
      <main className="max-w-7xl mx-auto">
        <div className="mb-10 pl-2">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome Back, {user?.firstName}
          </h1>
          <p className="text-slate-300 mt-2 text-sm font-medium tracking-wide">
            Your account is fully activated. Select an application module below to begin your session.
          </p>
        </div>

        {isLoading ? (
          <div className="text-gamboge-400 font-bold tracking-widest uppercase flex items-center pl-2">
             <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading workspace modules...
          </div>
        ) : modules.length === 0 ? (
          <div className="embossed-card p-10 text-center max-w-2xl mx-auto mt-16">
            <div className="inner-depth w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <LayoutGrid className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">No Modules Assigned</h3>
            <p className="text-slate-500 text-sm font-medium">
              You currently do not have access to any workspace applications. Please contact your administrator to provision access for your role.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {modules.map((mod) => (
              <div key={mod.id} className="embossed-card p-6 cursor-pointer group hover:-translate-y-1 transition-transform duration-300">
                <div className="w-14 h-14 inner-depth rounded-2xl flex items-center justify-center mb-6 group-hover:bg-lightgray transition-colors">
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
    </div>
  );
}