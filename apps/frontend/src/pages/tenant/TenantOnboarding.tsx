import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { InputField } from '../../components/ui/InputField';
import { OtpActionInput } from '../../components/ui/OtpActionInput';
import { TenantAPI } from '../../api/tenant.api';
import { AuthAPI } from '../../api/auth.api'; 
import { Loader2, Building2, ShieldCheck, Copy, Check, Mail, Phone, Lock, User, Globe, Palette, Image as ImageIcon, Calendar } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';

export default function TenantOnboarding() {
  const [formData, setFormData] = useState({
    companyName: '', customDomain: '', logoUrl: '', themeColor: '#C7923E',
    adminFirstName: '', adminLastName: '', adminEmail: '', adminMobile: '',
    adminPassword: '', confirmPassword: '', adminGender: 'Male', adminDob: '',
    adminMotherTongue: 'English', securityQ1: 'What is your pets name?', securityA1: '',
    securityQ2: 'Who is your favorite player?', securityA2: '',
  });

  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [successData, setSuccessData] = useState<{ tenantId: string; adminEmail: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCopy = () => {
    if (successData) {
      navigator.clipboard.writeText(successData.tenantId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendOtp = async (target: string, type: 'EMAIL' | 'PHONE') => await AuthAPI.sendOtp(target, type);

  const handleVerifyOtp = async (target: string, type: 'EMAIL' | 'PHONE', otp: string) => {
    const response = await AuthAPI.verifyOtp(target, type, otp);
    if (response.success) {
      if (type === 'EMAIL') setIsEmailVerified(true);
      if (type === 'PHONE') setIsPhoneVerified(true);
      return true;
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.adminPassword !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!isEmailVerified || !isPhoneVerified) {
      setError('You must verify both your Email and Mobile Number before proceeding.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await TenantAPI.registerTenant(formData);
      setSuccessData({ tenantId: response.tenant.id, adminEmail: response.admin.email });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to register workspace');
    } finally {
      setIsLoading(false);
    }
  };

  // --- SUCCESS VIEW ---
  if (successData) {
    return (
      <AuthLayout>
        <div className="max-w-[540px] mx-auto text-center">
          <div className="embossed-card p-8">
            <ShieldCheck className="w-16 h-16 text-green-500 mx-auto mb-4 drop-shadow-sm" />
            <h2 className="text-2xl font-bold text-slate-700 mb-2 tracking-tight">Workspace Created!</h2>
            <p className="text-slate-500 mb-6 text-sm font-medium leading-relaxed">
              Your organization has been successfully provisioned. Please save your Workspace ID below. You will need it to log in.
            </p>
            
            <div className="inner-depth p-6 mb-8 text-left space-y-5 rounded-2xl">
              <div>
                <p className="text-xs text-gamboge-600 uppercase font-bold tracking-widest mb-1">Master Admin Email</p>
                <p className="text-slate-700 font-bold">{successData.adminEmail}</p>
              </div>
              <div>
                <p className="text-xs text-gamboge-600 uppercase font-bold tracking-widest mb-1">Workspace ID (Tenant ID)</p>
                <div className="flex items-center justify-between bg-lightgray p-3 rounded-xl shadow-inner mt-1">
                  <code className="text-slate-700 font-bold text-sm truncate mr-4">{successData.tenantId}</code>
                  <button onClick={handleCopy} className="text-slate-400 hover:text-gamboge-600 transition-colors">
                    {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
            
            <Link to="/login" className="shine-btn w-full flex justify-center py-4 rounded-2xl font-bold text-white uppercase tracking-widest">
              Proceed to Login
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // --- REGISTRATION FORM VIEW ---
  return (
    <AuthLayout>
      <div className="max-w-4xl mx-auto">
        
        <div className="mb-8 text-center">
          <h2 className="text-xl font-bold text-slate-700">Provision Organization</h2>
          <p className="text-sm text-slate-500 mt-1.5 font-semibold text-gamboge-600 tracking-widest uppercase">--- Tenant Setup ---</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm text-center font-semibold">
            {error}
          </div>
        )}

        <div className="inner-depth p-6 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-10">
            
            {/* Section 1: Organization Details */}
            <div>
              <div className="flex items-center mb-6">
                <div className="p-2 bg-lightgray rounded-lg mr-3 shadow-inner"><Building2 className="w-5 h-5 text-gamboge-600" /></div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Organization Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <InputField label="Company Name" name="companyName" value={formData.companyName} onChange={handleChange} required icon={<Building2 />} />
                <InputField label="Custom Domain (Optional)" name="customDomain" placeholder="e.g. yourcompany.com" value={formData.customDomain} onChange={handleChange} icon={<Globe />} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Logo URL (Optional)" name="logoUrl" placeholder="https://..." value={formData.logoUrl} onChange={handleChange} icon={<ImageIcon />} />
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Brand Theme Color</label>
                  <div className="flex space-x-3 group relative">
                    <div className="absolute left-4 top-3.5 bg-lightgray rounded-lg z-10 pointer-events-none">
                       <Palette className="w-5 h-5 text-slate-400 group-focus-within:text-gamboge-500 transition-colors" />
                    </div>
                    <input 
                      type="color" 
                      name="themeColor" 
                      value={formData.themeColor} 
                      onChange={handleChange} 
                      className="h-[52px] w-16 rounded-2xl cursor-pointer embossed-input p-1.5 pl-12"
                    />
                    <input 
                      type="text" 
                      name="themeColor" 
                      value={formData.themeColor} 
                      onChange={handleChange} 
                      className="flex-1 embossed-input px-4 rounded-2xl text-sm font-bold text-slate-700 uppercase tracking-widest outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-slate-300/50" />

            {/* Section 2: Master Admin Details */}
            <div>
              <div className="flex items-center mb-6">
                <div className="p-2 bg-lightgray rounded-lg mr-3 shadow-inner"><User className="w-5 h-5 text-gamboge-600" /></div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Master Administrator</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <InputField label="First Name" name="adminFirstName" value={formData.adminFirstName} onChange={handleChange} required />
                <InputField label="Last Name" name="adminLastName" value={formData.adminLastName} onChange={handleChange} required />
                <InputField asSelect label="Sex" name="adminGender" value={formData.adminGender} onChange={handleChange} required>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </InputField>
              </div>

              {/* OTP Verification Block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6 p-6 border border-slate-300/50 rounded-3xl bg-lightgray/30 shadow-inner">
                <div className="space-y-4">
                  <InputField label="E-mail" type="email" name="adminEmail" value={formData.adminEmail} onChange={handleChange} required disabled={isEmailVerified} icon={<Mail />} />
                  <OtpActionInput 
                    label="Email Verification" 
                    targetValue={formData.adminEmail} 
                    onSendOtp={(target) => handleSendOtp(target, 'EMAIL')} 
                    onVerifyOtp={(target, otp) => handleVerifyOtp(target, 'EMAIL', otp)}
                    required 
                  />
                </div>
                <div className="space-y-4">
                  <InputField label="Mobile No." name="adminMobile" value={formData.adminMobile} onChange={handleChange} required disabled={isPhoneVerified} icon={<Phone />} />
                  <OtpActionInput 
                    label="Mobile Verification" 
                    targetValue={formData.adminMobile} 
                    onSendOtp={(target) => handleSendOtp(target, 'PHONE')} 
                    onVerifyOtp={(target, otp) => handleVerifyOtp(target, 'PHONE', otp)}
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <InputField label="Date Of Birth" type="date" name="adminDob" value={formData.adminDob} onChange={handleChange} required icon={<Calendar />} />
                <InputField label="Password" type="password" name="adminPassword" value={formData.adminPassword} onChange={handleChange} required icon={<Lock />} />
                <InputField label="Confirm Password" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required icon={<Lock />} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputField asSelect label="Mother Tongue" name="adminMotherTongue" value={formData.adminMotherTongue} onChange={handleChange} required>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Assamese">Assamese</option>
                </InputField>
                <div className="space-y-3">
                  <InputField asSelect label="Security Question 1" name="securityQ1" value={formData.securityQ1} onChange={handleChange} required>
                    <option value="What is your pets name?">What is your pets name?</option>
                  </InputField>
                  <InputField label="Answer" name="securityA1" value={formData.securityA1} onChange={handleChange} required />
                </div>
                <div className="space-y-3">
                  <InputField asSelect label="Security Question 2" name="securityQ2" value={formData.securityQ2} onChange={handleChange} required>
                    <option value="Who is your favorite player?">Who is your favorite player?</option>
                  </InputField>
                  <InputField label="Answer" name="securityA2" value={formData.securityA2} onChange={handleChange} required />
                </div>
              </div>
            </div>

            <div className="pt-8 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <Link to="/login" className="text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-widest transition-colors">
                Already have a workspace? Sign in
              </Link>
              <button
                type="submit"
                disabled={isLoading || !isEmailVerified || !isPhoneVerified}
                className="shine-btn w-full sm:w-auto px-10 flex items-center justify-center space-x-2 py-4 text-white font-bold rounded-2xl text-sm uppercase tracking-widest disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ShieldCheck className="w-5 h-5 mr-2" />}
                <span>Provision Organization</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthLayout>
  );
}