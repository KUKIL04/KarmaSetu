import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { InputField } from '../../components/ui/InputField';
import { OtpActionInput } from '../../components/ui/OtpActionInput';
import { AuthAPI } from '../../api/auth.api';
import { AlertCircle, Loader2, ShieldCheck, ArrowLeft, Mail, Lock, User, Phone, Globe } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    firstName: '', middleName: '', lastName: '', gender: 'Male', mobileNo: '',
    dateOfBirth: '', alternateEmail: '', password: '', confirmPassword: '',
    motherTongue: 'Hindi', securityQ1: 'What is your pets name?', securityA1: '',
    securityQ2: 'Who is your favorite player?', securityA2: '',
  });

  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [lockedEmail, setLockedEmail] = useState('');
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setIsTokenValid(false); return; }
    AuthAPI.verifyInvite(token)
      .then((res) => { setLockedEmail(res.email); setIsTokenValid(true); })
      .catch(() => setIsTokenValid(false));
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => 
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSendOtp = async (target: string, type: 'EMAIL' | 'PHONE') => await AuthAPI.sendOtp(target, type);

  const handleVerifyOtp = async (target: string, type: 'EMAIL' | 'PHONE', otp: string) => {
    const response = await AuthAPI.verifyOtp(target, type, otp);
    if (response.success && type === 'PHONE') {
      setIsPhoneVerified(true);
      return true;
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
    if (!isPhoneVerified) { setError('Please verify your Mobile Number.'); return; }
    
    setIsLoading(true);
    try {
      await AuthAPI.register({ token, ...formData });
      navigate('/login', { state: { message: 'Registration complete. Please log in.' } });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isTokenValid === null) return <AuthLayout><div className="text-center font-bold text-slate-500 animate-pulse">Verifying secure link...</div></AuthLayout>;

  if (isTokenValid === false || !token) {
    return (
      <AuthLayout>
        <div className="inner-depth p-8 text-center max-w-[400px] mx-auto">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">Invalid Link</h2>
          <p className="text-sm text-slate-500 font-medium">This invitation link is invalid or expired.</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="mb-8 text-center">
          <h2 className="text-xl font-bold text-slate-700">Sign Up</h2>
          <p className="text-sm text-slate-500 mt-1.5 font-semibold text-gamboge-600 tracking-widest uppercase">-------------------</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm text-center font-semibold">
          {error}
        </div>
      )}

      <div className="inner-depth p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
            
            {/* Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Full Name <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input type="text" name="firstName" required placeholder="First Name" value={formData.firstName} onChange={handleChange} className="embossed-input w-full px-4 py-3 rounded-xl text-sm text-slate-700 placeholder-slate-400 font-semibold" />
                <input type="text" name="middleName" placeholder="Middle Name" value={formData.middleName} onChange={handleChange} className="embossed-input w-full px-4 py-3 rounded-xl text-sm text-slate-700 placeholder-slate-400 font-semibold" />
                <input type="text" name="lastName" required placeholder="Last Name" value={formData.lastName} onChange={handleChange} className="embossed-input w-full px-4 py-3 rounded-xl text-sm text-slate-700 placeholder-slate-400 font-semibold" />
              </div>
            </div>

            {/* Demographics */}
            <InputField asSelect label="Sex" name="gender" value={formData.gender} onChange={handleChange} required>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </InputField>

            <InputField label="Date Of Birth" type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required />

            <InputField asSelect label="Mother Tongue" name="motherTongue" value={formData.motherTongue} onChange={handleChange} required>
              <option value="Hindi">Hindi</option>
              <option value="English">English</option>
              <option value="Assamese">Assamese</option>
            </InputField>

            {/* Contact details */}
            <div className="sm:col-span-2 p-4 border border-slate-300/50 rounded-2xl bg-lightgray/50 space-y-5">
              <InputField label="Corporate E-mail (Verified)" type="email" value={lockedEmail} disabled icon={<Mail />} className="opacity-70 cursor-not-allowed" />
              
              <div>
                <InputField label="Mobile No." type="tel" name="mobileNo" value={formData.mobileNo} onChange={handleChange} disabled={isPhoneVerified} required icon={<Phone />} />
                <div className="mt-3">
                  <OtpActionInput label="Phone Verification" targetValue={formData.mobileNo} onSendOtp={(target) => handleSendOtp(target, 'PHONE')} onVerifyOtp={(target, otp) => handleVerifyOtp(target, 'PHONE', otp)} required />
                </div>
              </div>
            </div>

            <InputField label="Alternate E-mail" type="email" name="alternateEmail" placeholder="backup@domain.com" value={formData.alternateEmail} onChange={handleChange} icon={<Mail />} />
            
            {/* Passwords */}
            <InputField label="Password" type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required icon={<Lock />} />
            <InputField label="Confirm Password" type="password" name="confirmPassword" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required icon={<Lock />} />

            {/* Security */}
            <div className="sm:col-span-2 space-y-4 mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InputField asSelect label="Security Question 1" name="securityQ1" value={formData.securityQ1} onChange={handleChange} required>
                  <option value="What is your pets name?">What is your pets name?</option>
                  <option value="What city were you born in?">What city were you born in?</option>
                </InputField>
                <InputField label="Answer 1" name="securityA1" value={formData.securityA1} onChange={handleChange} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InputField asSelect label="Security Question 2" name="securityQ2" value={formData.securityQ2} onChange={handleChange} required>
                  <option value="Who is your favorite player?">Who is your favorite player?</option>
                  <option value="What is your mothers maiden name?">What is your mothers maiden name?</option>
                </InputField>
                <InputField label="Answer 2" name="securityA2" value={formData.securityA2} onChange={handleChange} required />
              </div>
            </div>

          </div>

          <div className="pt-4 sm:col-span-2 flex justify-start">
            <button type="submit" disabled={isLoading || !isPhoneVerified} className="shine-btn w-full sm:w-auto px-10 flex items-center justify-center space-x-2 py-4 text-white font-bold rounded-2xl text-sm uppercase tracking-widest disabled:opacity-50">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ShieldCheck className="w-5 h-5 mr-2" />}
              <span>Complete Registration</span>
            </button>
          </div>
        </form>
      </div>
      
      <div className="mt-8 text-center">
        <Link to="/login" className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center w-full space-x-1.5 uppercase tracking-widest">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Login</span>
        </Link>
      </div>
    </AuthLayout>
  );
}