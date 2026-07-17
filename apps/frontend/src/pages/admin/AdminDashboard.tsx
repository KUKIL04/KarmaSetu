import React, { useState, useEffect } from 'react';
import { AdminAPI } from '../../api/admin.api';
import { InputField } from '../../components/ui/InputField';
import { Link as LinkIcon, LayoutGrid, Check, Copy, Loader2 } from 'lucide-react';

export default function ProvisioningManager() {
  const [modules, setModules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Forms
  const [inviteEmail, setInviteEmail] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [moduleName, setModuleName] = useState('');
  const [moduleDesc, setModuleDesc] = useState('');

  useEffect(() => { fetchModules(); }, []);

  const fetchModules = async () => {
    try {
      const modulesRes = await AdminAPI.getModules();
      setModules(Array.isArray(modulesRes) ? modulesRes : []);
    } catch (err) {
      notify('error', 'Failed to fetch modules');
    } finally {
      setIsLoading(false);
    }
  };

  const notify = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await AdminAPI.inviteUser(inviteEmail);
      let linkToShare = res.inviteLink;
      if (!linkToShare.includes('http')) {
        linkToShare = `${window.location.origin}/register?token=${res.inviteLink}`;
      }
      setGeneratedLink(linkToShare);
      setInviteEmail('');
      notify('success', 'Invitation link generated.');
    } catch (err: any) {
      notify('error', err.response?.data?.error || 'Failed to generate invite');
    }
  };

  const handleRegisterModule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await AdminAPI.registerModule(moduleName, moduleDesc);
      setModuleName('');
      setModuleDesc('');
      notify('success', 'Module registered successfully.');
      fetchModules();
    } catch (err: any) {
      notify('error', err.response?.data?.error || 'Failed to register module');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Provisioning & Assets</h1>
        <p className="text-slate-500 mt-2 font-medium">Generate secure invites and register new workspace modules.</p>
      </div>

      {message.text && (
        <div className={`px-4 py-3 rounded-2xl text-sm font-bold uppercase tracking-widest ${message.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Generate Invite Panel */}
        <div className="embossed-card p-8 h-fit">
          <h2 className="text-xl font-bold text-slate-700 mb-6 flex items-center">
            <div className="p-2 bg-lightgray rounded-lg mr-3 shadow-inner"><LinkIcon className="w-5 h-5 text-gamboge-600" /></div>
            Generate Invitation
          </h2>
          <form onSubmit={handleGenerateInvite} className="space-y-4">
            <InputField label="Employee Email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
            <button type="submit" className="shine-btn w-full py-4 text-white font-bold rounded-2xl text-sm tracking-widest uppercase mt-4">
              Create Secure Link
            </button>
          </form>

          {generatedLink && (
            <div className="mt-6 p-5 inner-depth rounded-2xl">
              <p className="text-xs text-slate-500 mb-2 font-bold uppercase tracking-widest">Share this link:</p>
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-300">
                <code className="text-gamboge-700 text-sm truncate mr-4 font-semibold">{generatedLink}</code>
                <button onClick={() => { navigator.clipboard.writeText(generatedLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="text-slate-400 hover:text-slate-700 p-2">
                  {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Module Management */}
        <div className="space-y-8">
          <div className="embossed-card p-8">
            <h2 className="text-xl font-bold text-slate-700 mb-6 flex items-center">
              <div className="p-2 bg-lightgray rounded-lg mr-3 shadow-inner"><LayoutGrid className="w-5 h-5 text-gamboge-600" /></div>
              Register Module
            </h2>
            <form onSubmit={handleRegisterModule} className="space-y-4">
              <InputField label="Module Name" value={moduleName} onChange={(e) => setModuleName(e.target.value)} required />
              <InputField label="Description" value={moduleDesc} onChange={(e) => setModuleDesc(e.target.value)} />
              <button type="submit" className="w-full py-4 text-slate-700 bg-lightgray border border-slate-300 hover:bg-slate-200 shadow-sm font-bold rounded-2xl text-sm tracking-widest uppercase mt-4 transition-colors">
                Add Asset
              </button>
            </form>
          </div>

          {/* Active Modules List */}
          <div className="embossed-card p-8">
            <h3 className="text-lg font-bold text-slate-700 mb-4 tracking-tight">Active Workspace Modules</h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {isLoading ? (
                <div className="flex items-center text-slate-500 font-bold"><Loader2 className="w-4 h-4 animate-spin mr-2"/> Loading...</div>
              ) : modules.length === 0 ? (
                <p className="text-slate-500 text-sm font-medium">No modules registered.</p>
              ) : (
                modules.map(mod => (
                  <div key={mod.id} className="p-4 inner-depth rounded-2xl">
                    <h4 className="font-bold text-gamboge-700 tracking-tight">{mod.name}</h4>
                    <p className="text-sm text-slate-500 font-medium mt-1">{mod.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}