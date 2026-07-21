import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { UserAPI } from '../../api/user.api';
import { AuthAPI } from '../../api/auth.api';
import { LayoutGrid, LogOut, User, Component, ShieldCheck, RefreshCw, ArrowRightLeft, Building2, X, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function ModuleApp() {
  const { user, login, logout, tenantSettings } = useAuth();
  const navigate = useNavigate();
  const [modules, setModules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Switch Workspace State ---
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [availableWorkspaces, setAvailableWorkspaces] = useState<any[]>([]);
  const [switchTempToken, setSwitchTempToken] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  
  // NEW: State to track if they have multiple workspaces
  const [hasMultipleWorkspaces, setHasMultipleWorkspaces] = useState(false);

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

  // NEW: Silently check for other workspaces on mount
  useEffect(() => {
    AuthAPI.getAvailableWorkspaces().then(res => {
      if (res.tenants && res.tenants.length > 0) {
        setHasMultipleWorkspaces(true);
        // Pre-load the workspaces to make the modal instant
        setAvailableWorkspaces(res.tenants);
        setSwitchTempToken(res.tempToken);
      }
    }).catch(() => console.error("Failed to pre-fetch workspaces"));
  }, []);

  // --- Execute Workspace Switch ---
  const handleWorkspaceSelect = async (tenantId: string) => {
    if (!switchTempToken) return;
    setIsSwitching(true);
    try {
      const oldRefreshToken = localStorage.getItem('refreshToken') || undefined;
      const response = await AuthAPI.selectWorkspace(switchTempToken, tenantId, oldRefreshToken);
      
      // Update global context with new credentials & instantly refetch branding
      login(response.accessToken, response.refreshToken, response.user);
      
      setIsSwitchModalOpen(false);
      
      // If their status in the new workspace is PENDING, router will catch it on reload
      window.location.reload(); 
    } catch (error) {
      console.error("Failed to switch workspace", error);
      setIsSwitching(false);
    }
  };

  return (
    <div 
      className="min-h-screen text-slate-700 p-4 sm:p-8 font-sans transition-all duration-300 relative"
      style={{
        backgroundColor: '#f8fafc',
        backgroundImage: `
          linear-gradient(135deg, color-mix(in srgb, var(--theme-500) 6%, transparent) 0%, transparent 100%),
          url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1.5' fill='%23cbd5e1' fill-opacity='0.4'/%3E%3C/svg%3E")
        `,
        backgroundAttachment: 'fixed'
      }}
    >
      
      {/* Top Navigation Bar */}
      <nav className="max-w-7xl mx-auto embossed-card p-4 mb-10 flex items-center justify-between bg-white/80 backdrop-blur-md">
        <div className="flex items-center space-x-4 ml-2">
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
          <span className="text-xl font-extrabold tracking-tight text-slate-800 uppercase">
            {tenantSettings?.name || 'WORKSPACE'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4 mr-2">
          <div className="hidden md:flex items-center text-xs font-bold text-slate-600 uppercase tracking-widest bg-lightgray px-4 py-2 rounded-xl shadow-inner border border-slate-200">
            <User className="w-4 h-4 mr-2 text-gamboge-600" />
            {user?.firstName} {user?.lastName}
          </div>
          
          {user?.isAdmin && (
            <Link to="/admin" className="text-xs font-bold text-gamboge-600 hover:text-gamboge-700 uppercase tracking-widest transition-colors flex items-center bg-gamboge-50 px-3 py-2 rounded-lg border border-gamboge-100">
              <ShieldCheck className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          {/* WORKSPACE SWITCH BUTTON - Conditionally Rendered */}
          {hasMultipleWorkspaces && (
            <button 
              onClick={() => setIsSwitchModalOpen(true)} 
              title="Switch Workspace"
              className="flex items-center text-xs font-bold text-slate-500 hover:text-gamboge-600 uppercase tracking-widest transition-colors px-2 py-2 rounded-lg hover:bg-slate-100"
            >
              <ArrowRightLeft className="w-4 h-4 sm:mr-1" />
              <span className="hidden lg:inline">Switch Workspace</span>
            </button>
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

      {/* WORKSPACE SWITCH MODAL */}
      {isSwitchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Switch Workspace</h2>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">Select an environment</p>
              </div>
              <button 
                onClick={() => setIsSwitchModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto neumorphic-scrollbar space-y-3">
              {isSwitching && availableWorkspaces.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin mb-4 text-gamboge-500" />
                  <p className="text-sm font-bold uppercase tracking-widest">Scanning Environments...</p>
                </div>
              ) : availableWorkspaces.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 font-medium">You do not belong to any other active workspaces.</p>
                </div>
              ) : (
                availableWorkspaces.map((tenant) => (
                  <button
                    key={tenant.tenantId}
                    onClick={() => handleWorkspaceSelect(tenant.tenantId)}
                    disabled={isSwitching}
                    className="w-full bg-lightgray hover:bg-slate-50 border border-slate-200/60 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center group text-left disabled:opacity-50"
                  >
                    <div className="w-10 h-10 inner-depth rounded-xl mr-4 flex flex-shrink-0 items-center justify-center bg-white">
                      {tenant.logoUrl ? (
                        <img src={tenant.logoUrl.startsWith('http') ? tenant.logoUrl : `${import.meta.env.VITE_API_URL?.replace('/api/v1', '')}${tenant.logoUrl}`} alt={tenant.companyName} className="w-6 h-6 object-contain" />
                      ) : (
                        <Building2 className="w-5 h-5 text-slate-400 group-hover:text-gamboge-500 transition-colors" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-700 truncate">{tenant.companyName}</h3>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate uppercase">{tenant.tenantId.split('-')[0]}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-gamboge-500 transform group-hover:translate-x-1 transition-all" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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