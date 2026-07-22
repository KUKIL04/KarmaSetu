import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { SuperAdminAPI } from '../../api/superadmin.api';
import { ArrowLeft, Building2, Activity, ShieldAlert, Power, CheckCircle2, Lock, Loader2, Database } from 'lucide-react';

export default function TenantDetails() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  
  const [tenant, setTenant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  // Fetch real-time data directly from PostgreSQL
  useEffect(() => {
    const fetchTenantData = async () => {
      if (!tenantId) return;
      try {
        const data = await SuperAdminAPI.getTenant(tenantId);
        setTenant(data);
      } catch (err: any) {
        setError('Failed to fetch workspace telemetry.');
        if (err.response?.status === 404) navigate('/tenants');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTenantData();
  }, [tenantId, navigate]);

  const handleToggleStatus = async () => {
    if (!tenant) return;
    
    const newStatus = tenant.status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
    const confirmMsg = newStatus === 'FROZEN' 
      ? `WARNING: You are about to FREEZE ${tenant.company_name}. All network requests will instantly return 403 Forbidden. Proceed?`
      : `You are about to RESTORE access to ${tenant.company_name}. Proceed?`;

    if (!window.confirm(confirmMsg)) return;

    setIsUpdating(true);
    setError('');
    try {
      const res = await SuperAdminAPI.updateTenantStatus(tenant.id, newStatus);
      setTenant({ ...tenant, status: res.tenant.status });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to execute status override.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Establishing Secure Link...</p>
      </div>
    );
  }

  if (!tenant) return null;
  const isFrozen = tenant.status === 'FROZEN';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Navigation & Header */}
      <div>
        <Link to="/tenants" className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-indigo-400 uppercase tracking-widest transition-colors mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Fleet
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-slate-800 pb-6">
          <div className="flex items-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mr-5 shrink-0 border ${isFrozen ? 'bg-red-950 border-red-900/50' : 'bg-slate-900 border-slate-800'}`}>
              <Building2 className={`w-8 h-8 ${isFrozen ? 'text-red-500' : 'text-indigo-500'}`} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">{tenant.company_name}</h1>
              <div className="flex items-center mt-2 space-x-4">
                <span className="text-sm font-mono text-slate-500">{tenant.id}</span>
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border ${isFrozen ? 'bg-red-950/50 text-red-400 border-red-900' : 'bg-emerald-950/50 text-emerald-400 border-emerald-900'}`}>
                  {tenant.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-900/50 text-red-400 px-4 py-3 rounded-xl text-sm flex items-start">
          <ShieldAlert className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Real-time Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center text-slate-400 mb-4">
            <Lock className="w-5 h-5 mr-2" />
            <h3 className="text-xs font-bold uppercase tracking-widest">Subscription Tier</h3>
          </div>
          <p className="text-2xl font-black text-white">{tenant.plan_tier?.replace('_', ' ') || 'FREE TIER'}</p>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center text-blue-400 mb-4">
            <Activity className="w-5 h-5 mr-2" />
            <h3 className="text-xs font-bold uppercase tracking-widest">Monthly Active Users</h3>
          </div>
          <p className="text-2xl font-black text-white">{tenant.mau_count || 0}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center text-emerald-400 mb-4">
            <Database className="w-5 h-5 mr-2" />
            <h3 className="text-xs font-bold uppercase tracking-widest">API Consumption</h3>
          </div>
          <p className="text-2xl font-black text-white">{tenant.api_request_count || 0}</p>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mt-12">
        <h2 className="text-lg font-bold text-white tracking-tight mb-4">Control Plane (Danger Zone)</h2>
        <div className="bg-slate-950 border border-red-900/30 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <h3 className="text-base font-bold text-white flex items-center">
                {isFrozen ? 'Restore Workspace Access' : 'Freeze Workspace'} 
              </h3>
              <p className="text-sm text-slate-500 mt-1 max-w-xl">
                {isFrozen 
                  ? 'Re-enable API access and allow users to authenticate into this workspace.' 
                  : 'Instantly write a network blockade to Redis. All active sessions will be terminated and API requests will return 403 Forbidden.'}
              </p>
            </div>
            
            <button
              onClick={handleToggleStatus}
              disabled={isUpdating}
              className={`shrink-0 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center shadow-lg disabled:opacity-50 ${
                isFrozen 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/50' 
                  : 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/50'
              }`}
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Power className="w-4 h-4 mr-2" />
              )}
              {isUpdating ? 'Executing...' : (isFrozen ? 'Activate Tenant' : 'Execute Freeze')}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}