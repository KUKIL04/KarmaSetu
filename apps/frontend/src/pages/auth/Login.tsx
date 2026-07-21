import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { InputField } from '../../components/ui/InputField';
import { AuthAPI } from '../../api/auth.api';
import { useAuth } from '../../hooks/useAuth';
import { Loader2, Mail, Lock, Building2, ArrowRight, ArrowLeft } from 'lucide-react';
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
  
  // Step Management
  const [step, setStep] = useState<'CREDENTIALS' | 'WORKSPACE_SELECT'>('CREDENTIALS');
  const [availableTenants, setAvailableTenants] = useState<TenantOption[]>([]);
  const [tempToken, setTempToken] = useState<string | null>(null);

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(location.state?.message || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Handle Step 1: Verify Credentials
  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await AuthAPI.login(formData.email, formData.password);
      
      // Check if backend requires workspace selection
      if (response.requiresTenantSelection) {
        setAvailableTenants(response.tenants);
        setTempToken(response.tempToken);
        setStep('WORKSPACE_SELECT');
      } else {
        // Only 1 workspace, backend auto-logged them in
        login(response.accessToken, response.refreshToken, response.user);
        navigate(location.state?.from?.pathname || '/', { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Step 2: Finalize Workspace Selection
  const handleWorkspaceSelect = async (tenantId: string) => {
    if (!tempToken) return;
    setError('');
    setIsLoading(true);
    try {
      const response = await AuthAPI.selectWorkspace(tempToken, tenantId);
      login(response.accessToken, response.refreshToken, response.user);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to access workspace');
      setStep('CREDENTIALS'); // Kick them back if the temp token expired
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="max-w-[540px] w-full mx-auto">
        <div className="mb-8 text-center">
            <h2 className="text-xl font-bold text-slate-700">
              {step === 'CREDENTIALS' ? 'Welcome Back' : 'Select Workspace'}
            </h2>
            <p className="text-sm text-slate-500 mt-1.5">
              {step === 'CREDENTIALS' 
                ? 'Authenticate to access your secure workspace.' 
                : `Found ${availableTenants.length} environments linked to this identity.`}
            </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm text-center font-semibold animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <div className="inner-depth p-6 sm:p-8 relative overflow-hidden">
          
          {/* STEP 1: CREDENTIALS */}
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

              <div className="mt-8 pt-6 border-t border-slate-300/50 text-center">
                <p className="text-sm text-slate-500 font-medium">Is your company new to the platform?</p>
                <Link 
                  to="/onboard-workspace" 
                  className="mt-4 inline-flex items-center justify-center w-full px-6 py-3.5 bg-lightgray hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs uppercase tracking-widest transition-colors shadow-inner border border-slate-200/50"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Provision New Organization
                </Link>
              </div>
            </div>
          )}

          {/* STEP 2: WORKSPACE SELECTION */}
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

        </div>
      </div>
    </AuthLayout>
  );
}