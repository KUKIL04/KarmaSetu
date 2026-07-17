import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { InputField } from '../../components/ui/InputField';
import { OtpActionInput } from '../../components/ui/OtpActionInput';
import { AuthAPI } from '../../api/auth.api';
import { Loader2, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetEmail = searchParams.get('email') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentOtp, setCurrentOtp] = useState('');
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!targetEmail) setError('No email provided. Return to forgot password.');
  }, [targetEmail]);

  const handleSendOtp = async (target: string) => await AuthAPI.forgotPassword(target);

  const handleVerifyOtp = async (target: string, otp: string) => {
    const response = await AuthAPI.verifyOtp(target, 'EMAIL', otp);
    if (response.success) {
      setIsOtpVerified(true);
      setCurrentOtp(otp);
      return true;
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!isOtpVerified) {
      setError('You must verify the OTP before resetting.');
      return;
    }
    setIsLoading(true);
    try {
      await AuthAPI.resetPassword(targetEmail, currentOtp, newPassword);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login', { state: { message: 'Password has been successfully reset. Please sign in.' } });
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout>
        <div className="max-w-[540px] mx-auto text-center">
          <div className="inner-depth p-8">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-700 mb-2">Update Successful</h2>
            <p className="text-sm text-slate-500">Redirecting to authentication node...</p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="max-w-[540px] mx-auto">
        <div className="mb-8 text-center">
            <h2 className="text-xl font-bold text-slate-700">Update Credentials</h2>
            <p className="text-sm text-slate-500 mt-1.5">Verify code sent to <strong className="text-slate-700">{targetEmail}</strong></p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm text-center font-semibold">
            {error}
          </div>
        )}

        <div className="inner-depth p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <OtpActionInput 
              label="Verification Code" 
              targetValue={targetEmail} 
              onSendOtp={handleSendOtp} 
              onVerifyOtp={handleVerifyOtp}
              required 
            />

            <InputField label="New Password" type="password" name="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={!isOtpVerified} required icon={<Lock />} />
            <InputField label="Confirm New Password" type="password" name="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={!isOtpVerified} required icon={<Lock />} />

            <button type="submit" disabled={isLoading || !isOtpVerified || !newPassword} className="shine-btn w-full flex items-center justify-center space-x-2 py-4 text-white font-bold rounded-2xl text-sm tracking-widest uppercase mt-6 disabled:opacity-75">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Confirm New Password</span>}
            </button>
          </form>
        </div>
        
        <div className="mt-8 text-center">
          <Link to="/login" className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center w-full space-x-1.5 uppercase tracking-widest">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Cancel & Return</span>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}