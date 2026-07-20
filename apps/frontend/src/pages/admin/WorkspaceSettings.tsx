import React, { useState, useEffect, useCallback } from 'react';
import { AdminAPI } from '../../api/admin.api';
import { InputField } from '../../components/ui/InputField';
import { Building2, Globe, Palette, Save, Loader2, Settings, UploadCloud, CheckCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../../hooks/useAuth';

export default function WorkspaceSettings() {
  const [formData, setFormData] = useState({
    name: '',
    customDomain: '',
    logoUrl: '',
    themeColor: '#C7923E',
  });

  const { refreshBranding } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await AdminAPI.getSettings();
      if (data) {
        setFormData({
          name: data.name || '',
          customDomain: data.custom_domain || '',
          logoUrl: data.logo_url || '',
          themeColor: data.theme_color || '#C7923E',
        });
      }
    } catch (err) {
      notify('error', 'Failed to fetch workspace configurations.');
    } finally {
      setIsLoading(false);
    }
  };

  const notify = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Drag and Drop Handler
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await AdminAPI.uploadLogo(file);
      if (res.logoUrl) {
        setFormData(prev => ({ ...prev, logoUrl: res.logoUrl }));
        notify('success', 'Logo uploaded successfully. Remember to save your settings.');
      }
    } catch (err: any) {
      notify('error', err.response?.data?.error || 'Failed to upload logo');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.svg'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await AdminAPI.updateSettings(formData);
      notify('success', 'Workspace settings updated successfully.');
      await refreshBranding();
    } catch (err: any) {
      notify('error', err.response?.data?.error || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Workspace Settings</h1>
        <p className="text-slate-500 mt-2 font-medium">Manage corporate identity, themes, and tenant configurations.</p>
      </div>

      {message.text && (
        <div className={`px-4 py-3 rounded-2xl text-sm font-bold uppercase tracking-widest ${message.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
          {message.text}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-slate-500 font-bold uppercase tracking-widest">
          <Loader2 className="w-6 h-6 animate-spin mr-3" /> Loading Configurations...
        </div>
      ) : (
        <div className="embossed-card p-8 sm:p-10">
          <h2 className="text-xl font-bold text-slate-700 mb-8 flex items-center border-b border-slate-300/50 pb-4">
            <div className="p-2 bg-lightgray rounded-lg mr-3 shadow-inner">
              <Settings className="w-5 h-5 text-gamboge-600" />
            </div>
            Branding & Identity
          </h2>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InputField 
                label="Company Name" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                required 
                icon={<Building2 />} 
              />
              
              <InputField 
                label="Custom Domain" 
                name="customDomain" 
                placeholder="app.yourcompany.com" 
                value={formData.customDomain} 
                onChange={handleChange} 
                icon={<Globe />} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* File Upload Dropzone */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">
                  Corporate Logo
                </label>
                <div 
                  {...getRootProps()} 
                  className={`inner-depth p-6 rounded-3xl flex flex-col items-center justify-center text-center cursor-pointer transition-all border-2 ${
                    isDragActive ? 'border-gamboge-500 bg-gamboge-50/50' : 'border-transparent hover:bg-slate-100'
                  }`}
                >
                  <input {...getInputProps()} />
                  
                  {isUploading ? (
                    <Loader2 className="w-8 h-8 text-gamboge-500 animate-spin mb-2" />
                  ) : formData.logoUrl ? (
                    <div className="relative group">
                      <img 
                        src={formData.logoUrl.startsWith('http') ? formData.logoUrl : `${import.meta.env.VITE_API_URL?.replace('/api/v1', '')}${formData.logoUrl}`} 
                        alt="Logo Preview" 
                        className="h-16 object-contain mb-2 rounded-lg"
                      />
                      <div className="absolute inset-0 bg-slate-900/50 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="text-white text-[10px] font-bold uppercase tracking-widest">Replace</span>
                      </div>
                    </div>
                  ) : (
                    <UploadCloud className={`w-10 h-10 mb-3 ${isDragActive ? 'text-gamboge-600' : 'text-slate-400'}`} />
                  )}
                  
                  <p className="text-sm font-bold text-slate-700">
                    {isDragActive ? 'Drop image here...' : formData.logoUrl ? 'Update Logo' : 'Drag & Drop Logo'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-1">PNG, JPG, SVG (Max 5MB)</p>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">
                  Brand Theme Color
                </label>
                <div className="flex space-x-3 group relative">
                  <div className="absolute left-4 top-3 bg-lightgray rounded-lg z-10 pointer-events-none">
                     <Palette className="w-5 h-5 text-slate-400 group-focus-within:text-gamboge-500 transition-colors" />
                  </div>
                  <input 
                    type="color" 
                    name="themeColor" 
                    value={formData.themeColor} 
                    onChange={handleChange} 
                    className="h-[52px] w-16 rounded-2xl cursor-pointer embossed-input p-1.5 pl-8"
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

            <div className="pt-6 border-t border-slate-300/50 flex justify-end">
              <button 
                type="submit" 
                disabled={isSaving}
                className="shine-btn flex items-center py-4 px-10 text-white font-bold rounded-2xl text-sm tracking-widest uppercase disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                <span>Save Configuration</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}