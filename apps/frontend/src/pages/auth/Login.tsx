import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { InputField } from '../../components/ui/InputField';
import { AuthAPI } from '../../api/auth.api';
import { useAuth } from '../../hooks/useAuth';
import { Loader2, Mail, Lock, Building2, ArrowRight, ArrowLeft, ShieldAlert, AlertTriangle } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';

interface TenantOption {
  tenantId: string;
  companyName: string;
  logoUrl: string | null;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [step, setStep] = useState<'CREDENTIALS' | 'WORKSPACE_SELECT' | 'FROZEN'>('CREDENTIALS');
  const [availableTenants, setAvailableTenants] = useState<TenantOption[]>([]);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [frozenMessage, setFrozenMessage] = useState('');

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(location.state?.message || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await AuthAPI.login(formData.email, formData.password);
      
      if (response.requiresTenantSelection) {
        setAvailableTenants(response.tenants);
        setTempToken(response.tempToken);
        setStep('WORKSPACE_SELECT');
      } else {
        login(response.accessToken, response.refreshToken, response.user);
        navigate(location.state?.from?.pathname || '/', { replace: true });
      }
    } catch (err: any) {
      if (err.response?.data?.error === 'WORKSPACE_FROZEN') {
        setFrozenMessage(err.response?.data?.message || 'Your workspace access has been suspended.');
        setStep('FROZEN');
      } else {
        setError(err.response?.data?.error || 'Invalid credentials');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkspaceSelect = async (tenantId: string) => {
    if (!tempToken) return;
    setError('');
    setIsLoading(true);
    try {
      const response = await AuthAPI.selectWorkspace(tempToken, tenantId);
      login(response.accessToken, response.refreshToken, response.user);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err: any) {
      if (err.response?.data?.error === 'WORKSPACE_FROZEN') {
        setFrozenMessage(err.response?.data?.message || 'Your workspace access has been suspended.');
        setStep('FROZEN');
      } else {
        setError(err.response?.data?.error || 'Failed to access workspace');
        setStep('CREDENTIALS');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="max-w-[540px] w-full mx-auto">
        <div className="mb-8 text-center">
            <h2 className={`text-xl font-bold ${step === 'FROZEN' ? 'text-red-600' : 'text-slate-700'}`}>
              {step === 'CREDENTIALS' && 'Welcome Back'}
              {step === 'WORKSPACE_SELECT' && 'Select Workspace'}
              {step === 'FROZEN' && 'Access Suspended'}
            </h2>
            <p className="text-sm text-slate-500 mt-1.5 font-medium">
              {step === 'CREDENTIALS' && 'Authenticate to access your secure workspace.'}
              {step === 'WORKSPACE_SELECT' && `Found ${availableTenants.length} environments linked to this identity.`}
              {step === 'FROZEN' && 'Your organization\'s network access has been revoked.'}
            </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm text-center font-semibold animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <div className="inner-depth p-6 sm:p-8 relative overflow-hidden">
          
          {step === 'CREDENTIALS' && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
              <form onSubmit={handleCredentialSubmit} className="space-y-6">
                <InputField label="Corporate Email" type="email" name="email" placeholder="name@company.com" value={formData.email} onChange={handleChange} required icon={<Mail />} />
                <InputField label="Password Matrix" type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required icon={<Lock />} />

                <div className="flex items-center justify-between px-1 pt-1">
                  <Link to="/forgot-password" className="text-xs font-bold text-gamboge-600 hover:text-gamboge-700 transition-colors uppercase tracking-wider">
                    Forgot Password?
                  </Link>
                </div>

                <button type="submit" disabled={isLoading} className="shine-btn w-full flex items-center justify-center space-x-2 py-4 text-white font-bold rounded-2xl text-sm tracking-widest uppercase mt-6 disabled:opacity-75">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <><span>Authenticate</span><ArrowRight className="w-4 h-4 ml-1" /></>
                  )}
                </button>
              </form>

              {/* UPDATED: Inline Provisioning Layout */}
              <div className="mt-8 pt-6 border-t border-slate-300/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-slate-500 font-medium text-center sm:text-left">
                  New to the platform?
                </p>
                <Link 
                  to="/onboard-workspace" 
                  className="inline-flex items-center justify-center w-full sm:w-auto px-5 py-2.5 bg-lightgray hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-widest transition-colors shadow-inner border border-slate-200/50 shrink-0"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Provision Workspace
                </Link>
              </div>
            </div>
          )}

          {step === 'WORKSPACE_SELECT' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4 max-h-[400px] overflow-y-auto neumorphic-scrollbar px-1">
              {availableTenants.map((tenant) => (
                <button
                  key={tenant.tenantId}
                  onClick={() => handleWorkspaceSelect(tenant.tenantId)}
                  disabled={isLoading}
                  className="w-full bg-lightgray hover:bg-slate-50 border border-slate-200/60 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center group text-left disabled:opacity-50"
                >
                  <div className="w-12 h-12 inner-depth rounded-xl mr-4 flex flex-shrink-0 items-center justify-center bg-white">
                    {tenant.logoUrl ? (
                      <img src={tenant.logoUrl.startsWith('http') ? tenant.logoUrl : `${import.meta.env.VITE_API_URL?.replace('/api/v1', '')}${tenant.logoUrl}`} alt={tenant.companyName} className="w-8 h-8 object-contain" />
                    ) : (
                      <Building2 className="w-6 h-6 text-slate-400 group-hover:text-gamboge-500 transition-colors" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-slate-700 truncate">{tenant.companyName}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">{tenant.tenantId}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-gamboge-500 transform group-hover:translate-x-1 transition-all" />
                </button>
              ))}

              <div className="pt-4 text-center">
                <button 
                  onClick={() => setStep('CREDENTIALS')}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center w-full space-x-1.5 uppercase tracking-widest transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Use Different Account</span>
                </button>
              </div>
            </div>
          )}

          {step === 'FROZEN' && (
            <div className="animate-in zoom-in-95 duration-300 text-center py-6">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
              
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-red-500"></div>
                  <div className="bg-lightgray p-4 rounded-full border border-red-100 shadow-sm relative z-10">
                    <ShieldAlert className="w-10 h-10 text-red-500" />
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-800 mb-3 tracking-tight">Organization Suspended</h3>
              
              <div className="bg-red-50/50 border border-red-100 p-4 rounded-2xl mb-6 text-left">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-red-500 mr-3 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-700 font-bold mb-1">
                      {frozenMessage}
                    </p>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">
                      This typically occurs due to unresolved billing issues, policy violations, or an explicit mandate by your platform administrator.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 font-semibold mb-8 px-4">
                If you believe this is an error, please contact your internal IT department or corporate administrator.
              </p>

              <button 
                onClick={() => {
                  setStep('CREDENTIALS');
                  setFormData({ email: '', password: '' });
                }}
                className="w-full flex items-center justify-center space-x-2 py-4 text-slate-600 bg-white hover:bg-slate-50 shadow-sm border border-slate-200 font-bold rounded-2xl text-xs tracking-widest uppercase transition-all"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span>Return to Login</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </AuthLayout>
  );
}