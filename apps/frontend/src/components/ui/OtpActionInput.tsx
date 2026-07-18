import React, { useState } from 'react';
import { Loader2, CheckCircle2, Send, KeyRound } from 'lucide-react';

interface OtpActionInputProps {
  label: string;
  targetValue: string;
  onSendOtp: (target: string) => Promise<void>;
  onVerifyOtp: (target: string, otp: string) => Promise<boolean>;
  required?: boolean;
}

export function OtpActionInput({ label, targetValue, onSendOtp, onVerifyOtp }: OtpActionInputProps) {
  const [step, setStep] = useState<'IDLE' | 'SENT' | 'VERIFIED'>('IDLE');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!targetValue) return;
    setIsLoading(true);
    try {
      await onSendOtp(targetValue);
      setStep('SENT');
    } catch (err) {
      // Handle error via parent notification
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length < 4) return;
    setIsLoading(true);
    try {
      const success = await onVerifyOtp(targetValue, otp);
      if (success) setStep('VERIFIED');
    } catch (err) {
      // Handle error via parent notification
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'VERIFIED') {
    return (
      <div className="flex items-center text-sm font-bold text-green-600 bg-green-50 px-4 py-3 rounded-xl border border-green-200 uppercase tracking-widest">
        <CheckCircle2 className="w-5 h-5 mr-2" /> Verified
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full">
      {step === 'IDLE' ? (
        <button
          type="button"
          onClick={handleSend}
          disabled={!targetValue || isLoading}
          className="flex-1 shrink-0 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-widest transition-colors flex items-center justify-center disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
          Send OTP
        </button>
      ) : (
        <>
          <div className="relative flex-1 min-w-0">
            <KeyRound className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
            <input
              type="text"
              maxLength={6}
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="embossed-input w-full pl-10 pr-4 py-3 rounded-xl text-sm font-bold text-slate-700 placeholder-slate-400 outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleVerify}
            disabled={otp.length < 4 || isLoading}
            className="shrink-0 bg-gamboge-600 hover:bg-gamboge-500 text-white font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-widest transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Verify'}
          </button>
        </>
      )}
    </div>
  );
}