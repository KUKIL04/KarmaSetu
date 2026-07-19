import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { InputField } from '../../components/ui/InputField';
import { OtpActionInput } from '../../components/ui/OtpActionInput';
import { TenantAPI } from '../../api/tenant.api';
import { AuthAPI } from '../../api/auth.api'; 
import { Loader2, Building2, ShieldCheck, Copy, Check, Mail, Phone, Lock, User, Globe, Palette, Image as ImageIcon, Calendar, ArrowRight, ArrowLeft, Briefcase, MapPin } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';

export default function TenantOnboarding() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Brand
    companyName: '', customDomain: '', logoUrl: '', themeColor: '#C7923E',
    // Compliance & Scale
    legalName: '', taxId: '', registrationNumber: '', industry: 'Education', orgSize: '1-50',
    // HQ
    addressStreet: '', addressCity: '', addressState: '', addressPincode: '',
    // Admin
    adminFirstName: '', adminMiddleName: '', adminLastName: '', adminEmail: '', adminMobile: '',
    adminPassword: '', confirmPassword: '', adminGender: 'Male', adminDob: '',
    adminMotherTongue: 'English', securityQ1: 'What is your pets name?', securityA1: '',
    securityQ2: 'Who is your favorite player?', securityA2: '',
  });

  const [isEmailOtpSent, setIsEmailOtpSent] = useState(false);
  const [isPhoneOtpSent, setIsPhoneOtpSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [successData, setSuccessData] = useState<{ tenantId: string; adminEmail: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const areContactsVerified = isEmailVerified && isPhoneVerified;

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

  const handleSendOtp = async (target: string, type: 'EMAIL' | 'PHONE') => {
    await AuthAPI.sendOtp(target, type);
    if (type === 'EMAIL') setIsEmailOtpSent(true);
    if (type === 'PHONE') setIsPhoneOtpSent(true);
  };

  const handleVerifyOtp = async (target: string, type: 'EMAIL' | 'PHONE', otp: string) => {
    const response = await AuthAPI.verifyOtp(target, type, otp);
    if (response.success) {
      if (type === 'EMAIL') setIsEmailVerified(true);
      if (type === 'PHONE') setIsPhoneVerified(true);
      return true;
    }
    return false;
  };

  const validateStep1 = () => {
    if (!formData.companyName) {
      setError('Company Name is required.');
      return false;
    }
    setError('');
    return true;
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const prevStep = () => setStep(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.adminPassword !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!areContactsVerified) {
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

  if (successData) {
    return (
      <AuthLayout>
        <div className="max-w-[540px] mx-auto w-full text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="embossed-card p-8">
            <ShieldCheck className="w-16 h-16 text-green-500 mx-auto mb-4 drop-shadow-sm" />
            <h2 className="text-2xl font-bold text-slate-700 mb-2 tracking-tight">Workspace Created!</h2>
            <p className="text-slate-500 mb-6 text-sm font-medium leading-relaxed">
              Your organization has been successfully provisioned. Please save your Workspace ID below. You will need it to log in.
            </p>
            
            <div className="inner-depth p-6 mb-8 text-left space-y-5 rounded-2xl">
              <div>
                <p className="text-xs text-gamboge-600 uppercase font-bold tracking-widest mb-1">Master Admin Email</p>
                <p className="text-slate-700 font-bold break-all">{successData.adminEmail}</p>
              </div>
              <div>
                <p className="text-xs text-gamboge-600 uppercase font-bold tracking-widest mb-1">Workspace ID (Tenant ID)</p>
                <div className="flex items-center justify-between bg-lightgray p-3 rounded-xl shadow-inner mt-1">
                  <code className="text-slate-700 font-bold text-sm truncate mr-4">{successData.tenantId}</code>
                  <button onClick={handleCopy} className="text-slate-400 hover:text-gamboge-600 transition-colors shrink-0">
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

  return (
    <AuthLayout maxWidth="max-w-7xl">
      <div className="w-full transition-all duration-300">
        
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-slate-700 tracking-tight">Provision Organization</h2>
          <div className="flex items-center justify-center space-x-2 mt-3">
            <div className={`h-2 rounded-full transition-all duration-300 ${step === 1 ? 'w-8 bg-gamboge-500' : 'w-2 bg-slate-300'}`}></div>
            <div className={`h-2 rounded-full transition-all duration-300 ${step === 2 ? 'w-8 bg-gamboge-500' : 'w-2 bg-slate-300'}`}></div>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-widest">
            Step {step} of 2: {step === 1 ? 'Corporate Identity' : 'Master Administrator'}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm text-center font-semibold animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <div className="inner-depth p-6 sm:p-10 lg:p-12 overflow-hidden relative">
          <form onSubmit={handleSubmit}>
            
            {/* STEP 1: ORGANIZATION DETAILS */}
            {step === 1 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-300">
                
                {/* Branding Section */}
                <div>
                  <div className="flex items-center mb-6">
                    <div className="p-2 bg-lightgray rounded-lg mr-3 shadow-inner"><Building2 className="w-6 h-6 text-gamboge-600" /></div>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-700 tracking-tight">Organization Profile</h3>
                      <p className="text-sm text-slate-500 font-medium">Define your corporate workspace identity.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-6">
                    <InputField label="Brand / Display Name" name="companyName" value={formData.companyName} onChange={handleChange} required icon={<Building2 />} />
                    <InputField label="Custom Domain (Optional)" name="customDomain" placeholder="e.g. app.yourcompany.com" value={formData.customDomain} onChange={handleChange} icon={<Globe />} />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Logo URL (Optional)" name="logoUrl" placeholder="https://..." value={formData.logoUrl} onChange={handleChange} icon={<ImageIcon />} />
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Brand Theme Color</label>
                      <div className="flex space-x-3 group relative">
                        <div className="absolute left-4 top-2.5 bg-lightgray rounded-lg z-10 pointer-events-none">
                           <Palette className="w-5 h-5 text-slate-400 group-focus-within:text-gamboge-500 transition-colors" />
                        </div>
                        <input 
                          type="color" name="themeColor" value={formData.themeColor} onChange={handleChange} 
                          className="h-[52px] w-16 rounded-2xl cursor-pointer embossed-input p-1.5 pl-8 shrink-0"
                        />
                        <input 
                          type="text" name="themeColor" value={formData.themeColor} onChange={handleChange} 
                          className="flex-1 min-w-0 embossed-input px-4 rounded-2xl text-sm font-bold text-slate-700 uppercase tracking-widest outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-slate-300/50" />

                {/* Legal & Compliance Section */}
                <div>
                  <div className="flex items-center mb-6">
                    <div className="p-2 bg-lightgray rounded-lg mr-3 shadow-inner"><Briefcase className="w-6 h-6 text-gamboge-600" /></div>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-700 tracking-tight">Legal & Compliance</h3>
                      <p className="text-sm text-slate-500 font-medium">Required for billing and directory verification.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    <div className="lg:col-span-3">
                      <InputField label="Registered Legal Name" name="legalName" value={formData.legalName} onChange={handleChange} placeholder="Full Registered Business Name" />
                    </div>
                    <InputField label="Tax ID / GSTIN" name="taxId" value={formData.taxId} onChange={handleChange} placeholder="E.g. 27AAAAA0000A1Z5" />
                    <InputField label="Registration No. (CIN/LLP)" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} placeholder="Company Registration Number" />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <InputField asSelect label="Industry" name="industry" value={formData.industry} onChange={handleChange}>
                        <option value="Education">Education</option>
                        <option value="Technology">Technology</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Finance">Finance</option>
                        <option value="Retail">Retail</option>
                        <option value="Other">Other</option>
                      </InputField>
                      <InputField asSelect label="Org Size" name="orgSize" value={formData.orgSize} onChange={handleChange}>
                        <option value="1-50">1-50</option>
                        <option value="51-200">51-200</option>
                        <option value="201-1000">201-1000</option>
                        <option value="1000+">1000+</option>
                      </InputField>
                    </div>
                  </div>
                </div>

                <hr className="border-slate-300/50" />

                {/* HQ Address Section */}
                <div>
                  <div className="flex items-center mb-6">
                    <div className="p-2 bg-lightgray rounded-lg mr-3 shadow-inner"><MapPin className="w-6 h-6 text-gamboge-600" /></div>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-700 tracking-tight">Corporate Headquarters</h3>
                      <p className="text-sm text-slate-500 font-medium">Primary registered operational address.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-4">
                      <InputField label="Street Address" name="addressStreet" value={formData.addressStreet} onChange={handleChange} placeholder="Building, Street, Area" />
                    </div>
                    <InputField label="City" name="addressCity" value={formData.addressCity} onChange={handleChange} />
                    <div className="lg:col-span-2">
                      <InputField label="State / Province" name="addressState" value={formData.addressState} onChange={handleChange} />
                    </div>
                    <InputField label="PIN Code" name="addressPincode" value={formData.addressPincode} onChange={handleChange} />
                  </div>
                </div>

                <div className="pt-8 flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
                  <Link to="/login" className="text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-widest transition-colors w-full sm:w-auto text-center py-2">
                    Already have a workspace? Sign in
                  </Link>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="shine-btn w-full sm:w-auto px-10 flex items-center justify-center space-x-2 py-4 text-white font-bold rounded-2xl text-sm uppercase tracking-widest"
                  >
                    <span>Next Phase</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: MASTER ADMIN DETAILS */}
            {step === 2 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-300">
                <div className="flex items-center mb-6">
                  <div className="p-2 bg-lightgray rounded-lg mr-3 shadow-inner"><User className="w-6 h-6 text-gamboge-600" /></div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-700 tracking-tight">Master Administrator</h3>
                    <p className="text-sm text-slate-500 font-medium">Configure the root security account for the workspace.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <InputField label="First Name" name="adminFirstName" value={formData.adminFirstName} onChange={handleChange} required />
                  <InputField label="Middle Name (Optional)" name="adminMiddleName" value={formData.adminMiddleName} onChange={handleChange} />
                  <InputField label="Last Name" name="adminLastName" value={formData.adminLastName} onChange={handleChange} required />
                  <InputField asSelect label="Sex" name="adminGender" value={formData.adminGender} onChange={handleChange} required>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </InputField>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6 p-6 border border-slate-300/50 rounded-3xl bg-lightgray/30 shadow-inner">
                  <div className="space-y-4">
                    <InputField label="E-mail" type="email" name="adminEmail" value={formData.adminEmail} onChange={handleChange} required disabled={isEmailOtpSent || isEmailVerified} icon={<Mail />} className={isEmailOtpSent || isEmailVerified ? "opacity-70 cursor-not-allowed" : ""} />
                    <OtpActionInput 
                      label="Email Verification" targetValue={formData.adminEmail} 
                      onSendOtp={(target) => handleSendOtp(target, 'EMAIL')} 
                      onVerifyOtp={(target, otp) => handleVerifyOtp(target, 'EMAIL', otp)} required 
                    />
                  </div>
                  <div className="space-y-4">
                    <InputField label="Mobile No." name="adminMobile" value={formData.adminMobile} onChange={handleChange} required disabled={isPhoneOtpSent || isPhoneVerified} icon={<Phone />} className={isPhoneOtpSent || isPhoneVerified ? "opacity-70 cursor-not-allowed" : ""} />
                    <OtpActionInput 
                      label="Mobile Verification" targetValue={formData.adminMobile} 
                      onSendOtp={(target) => handleSendOtp(target, 'PHONE')} 
                      onVerifyOtp={(target, otp) => handleVerifyOtp(target, 'PHONE', otp)} required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  <InputField label="Date Of Birth" type="date" name="adminDob" value={formData.adminDob} onChange={handleChange} required icon={<Calendar />} />
                  <InputField label="Password" type="password" name="adminPassword" placeholder={!areContactsVerified ? "Verify contacts to unlock" : "••••••••"} value={formData.adminPassword} onChange={handleChange} required disabled={!areContactsVerified} icon={<Lock />} />
                  <InputField label="Confirm Password" type="password" name="confirmPassword" placeholder={!areContactsVerified ? "Verify contacts to unlock" : "••••••••"} value={formData.confirmPassword} onChange={handleChange} required disabled={!areContactsVerified} icon={<Lock />} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

                <div className="pt-8 flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="w-full sm:w-auto px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl text-sm uppercase tracking-widest transition-colors flex items-center justify-center"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !areContactsVerified}
                    className="shine-btn w-full sm:w-auto px-10 flex items-center justify-center space-x-2 py-4 text-white font-bold rounded-2xl text-sm uppercase tracking-widest disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ShieldCheck className="w-5 h-5 mr-2" />}
                    <span>Provision Organization</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </AuthLayout>
  );
}