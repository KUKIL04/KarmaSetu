import React, { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useOtpTimer } from '../../hooks/useOtpTimer';

interface OtpActionInputProps {
  label: string;
  targetValue: string;
  onSendOtp: (target: string) => Promise<void>;
  onVerifyOtp: (target: string, otp: string) => Promise<boolean>;
  required?: boolean;
}

export const OtpActionInput: React.FC<OtpActionInputProps> = ({
  label, targetValue, onSendOtp, onVerifyOtp, required
}) => {
  const [otp, setOtp] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { isActive, startTimer, formatTime } = useOtpTimer(300);

  const handleSend = async () => {
    if (!targetValue) {
      setError('Please enter a valid target first.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await onSendOtp(targetValue);
      startTimer();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length < 6) return;
    setError('');
    setIsLoading(true);
    try {
      const success = await onVerifyOtp(targetValue, otp);
      if (success) setIsVerified(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="flex space-x-3">
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          disabled={isVerified || !isActive}
          placeholder={isVerified ? "Verified" : "6-digit OTP"}
          className={`embossed-input flex-1 px-4 py-3.5 rounded-2xl text-sm font-semibold tracking-wide text-slate-700 disabled:opacity-75 ${isVerified ? 'text-green-600' : ''}`}
        />

        <button
          type="button"
          disabled={isVerified || isLoading || (isActive && otp.length < 6)}
          onClick={isActive ? handleVerify : handleSend}
          className={`px-6 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all min-w-[140px] flex justify-center items-center ${
            isVerified 
              ? 'bg-green-100 text-green-700 shadow-inner' 
              : 'shine-btn text-white disabled:opacity-50'
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isVerified ? (
            <span className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-1" /> Verified</span>
          ) : isActive ? (
            'Verify'
          ) : (
            'Send OTP'
          )}
        </button>
      </div>
      
      <div className="flex justify-between mt-1 ml-1">
        <p className="text-xs text-red-500 font-bold tracking-wide uppercase">{error}</p>
        {isActive && !isVerified && (
          <p className="text-xs text-gamboge-600 font-bold uppercase tracking-widest">Expires: {formatTime()}</p>
        )}
      </div>
    </div>
  );
};