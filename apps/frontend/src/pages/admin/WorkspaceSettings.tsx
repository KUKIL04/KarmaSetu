import React, { useState, useEffect } from 'react';
import { AdminAPI } from '../../api/admin.api';
import { InputField } from '../../components/ui/InputField';
import { Building2, Globe, Palette, Image as ImageIcon, Save, Loader2, Settings } from 'lucide-react';

export default function WorkspaceSettings() {
  const [formData, setFormData] = useState({
    name: '',
    customDomain: '',
    logoUrl: '',
    themeColor: '#C7923E',
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await AdminAPI.updateSettings(formData);
      notify('success', 'Workspace settings updated successfully.');
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
              <InputField 
                label="Logo URL" 
                name="logoUrl" 
                placeholder="https://..." 
                value={formData.logoUrl} 
                onChange={handleChange} 
                icon={<ImageIcon />} 
              />
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">
                  Brand Theme Color
                </label>
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