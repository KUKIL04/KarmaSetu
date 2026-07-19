import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { UserAPI } from '../../api/user.api';
import { Clock, RefreshCw, LogOut, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';

export default function WaitingRoom() {
  // 1. Extract tenantSettings from Auth Context
  const { user, logout, tenantSettings } = useAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState('');

  const handleCheckStatus = async () => {
    setIsChecking(true);
    setMessage('');
    try {
      const profile = await UserAPI.getProfile();
      
      if (profile.status === 'ACTIVE') {
        logout(); 
        navigate('/login', { 
          state: { message: 'Security clearance updated! Please sign in again to synchronize your access.' } 
        });
      } else {
        setMessage('Your account is still pending HR approval.');
      }
    } catch (error) {
      setMessage('Failed to synchronize with backend. Please try again.');
    } finally {
      setIsChecking(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  return (
    <AuthLayout>
      <div className="max-w-[540px] mx-auto text-center">
        
        {/* Dynamic Tenant Branding */}
        <div className="mb-8">
          <div className="w-16 h-16 embossed-badge rounded-full flex items-center justify-center mx-auto mb-4 bg-lightgray overflow-hidden shadow-sm">
            <img 
              src={tenantSettings?.logoUrl 
                    ? (tenantSettings.logoUrl.startsWith('http') ? tenantSettings.logoUrl : `${import.meta.env.VITE_API_URL?.replace('/api/v1', '')}${tenantSettings.logoUrl}`) 
                    : "/logo.png"} 
              alt="Company Logo" 
              className="w-full h-full object-cover p-1"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            {tenantSettings?.name || 'Workspace'}
          </h2>
          <p className="text-sm text-slate-500 mt-1.5 font-semibold text-gamboge-600 tracking-widest uppercase">
            ID: {user?.firstName} {user?.lastName}
          </p>
        </div>

        {message && (
          <div className="mb-6 bg-slate-200 border border-slate-300 text-slate-700 px-4 py-3 rounded-2xl text-sm font-semibold">
            {message}
          </div>
        )}

        <div className="inner-depth p-8">
          <Clock className="w-16 h-16 text-gamboge-500 mx-auto mb-6 animate-pulse" />
          <p className="text-slate-600 mb-8 text-sm leading-relaxed font-medium">
            Your identity has been verified. Your account is currently awaiting module assignments and activation from your workspace administrator.
          </p>

          <div className="space-y-4">
            <button 
              onClick={handleCheckStatus}
              disabled={isChecking}
              className="shine-btn w-full flex items-center justify-center space-x-2 py-4 text-white font-bold rounded-2xl text-sm tracking-widest uppercase disabled:opacity-50"
            >
              {isChecking ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <ShieldCheck className="w-5 h-5 mr-2" />}
              <span>{isChecking ? 'Verifying...' : 'Check Status'}</span>
            </button>
            
            <button 
              onClick={logout}
              className="w-full flex items-center justify-center space-x-2 py-4 text-slate-600 bg-lightgray shadow-sm hover:shadow-md border border-slate-300 font-bold rounded-2xl text-sm tracking-widest uppercase transition-all"
            >
              <LogOut className="w-5 h-5 mr-2" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}