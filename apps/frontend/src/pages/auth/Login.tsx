import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { InputField } from '../../components/ui/InputField';
import { AuthAPI } from '../../api/auth.api';
import { useAuth } from '../../hooks/useAuth';
import { Loader2, Mail, Lock, Building2, ArrowRight } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({ email: '', password: '', tenantId: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(location.state?.message || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await AuthAPI.login(formData.email, formData.password, formData.tenantId);
      login(response.accessToken, response.refreshToken, response.user);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials or Workspace ID');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="max-w-[540px] mx-auto">
        <div className="mb-8 text-center">
            <h2 className="text-xl font-bold text-slate-700">Welcome Back</h2>
            <p className="text-sm text-slate-500 mt-1.5">Authenticate to access your secure workspace.</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm text-center font-semibold">
            {error}
          </div>
        )}

        <div className="inner-depth p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <InputField label="Workspace ID" name="tenantId" placeholder="Enter Tenant UUID" value={formData.tenantId} onChange={handleChange} required icon={<Building2 />} />
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
        </div>
      </div>
    </AuthLayout>
  );
}