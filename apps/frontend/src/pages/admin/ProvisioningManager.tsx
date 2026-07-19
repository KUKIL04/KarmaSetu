import React, { useState, useEffect } from 'react';
import { AdminAPI } from '../../api/admin.api';
import { InputField } from '../../components/ui/InputField';
import { Link as LinkIcon, Check, Copy, Loader2, UserCheck } from 'lucide-react';

export default function ProvisioningManager() {
  // Invite States
  const [inviteEmail, setInviteEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  // Queue & Asset States
  const [users, setUsers] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Controlled state for checkbox selections
  const [selections, setSelections] = useState<Record<string, { modules: string[], roles: string[] }>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoadingQueue(true);
    try {
      const [usersRes, modulesRes, rolesRes] = await Promise.all([
        AdminAPI.getUsers().catch(() => []),
        AdminAPI.getModules().catch(() => []),
        AdminAPI.getRoles().catch(() => [])
      ]);
      setUsers(Array.isArray(usersRes) ? usersRes : []);
      setModules(Array.isArray(modulesRes) ? modulesRes : []);
      setRoles(Array.isArray(rolesRes) ? rolesRes : []);
    } catch (err) {
      notify('error', 'Failed to fetch provisioning data.');
    } finally {
      setIsLoadingQueue(false);
    }
  };

  const notify = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await AdminAPI.inviteUser(inviteEmail);
      let linkToShare = res.inviteLink;
      if (!linkToShare.includes('http')) {
        linkToShare = `${window.location.origin}/register?token=${res.inviteLink}`;
      }
      setGeneratedLink(linkToShare);
      setInviteEmail('');
      notify('success', 'Invitation link generated and dispatched to mail.');
    } catch (err: any) {
      notify('error', err.response?.data?.error || 'Failed to generate invite');
    }
    finally {
      setIsGenerating(false);
    }
  };

  // Custom handler for the new Checkbox UI
  const handleCheckboxChange = (userId: string, type: 'modules' | 'roles', itemId: string, checked: boolean) => {
    setSelections(prev => {
      const userSels = prev[userId] || { modules: [], roles: [] };
      const updatedType = checked 
        ? [...userSels[type], itemId] 
        : userSels[type].filter(id => id !== itemId);
        
      return { ...prev, [userId]: { ...userSels, [type]: updatedType } };
    });
  };

  const handleApproveUser = async (userId: string) => {
    const userSelections = selections[userId] || { modules: [], roles: [] };
    try {
      // Passes both arrays to the upgraded backend endpoint
      await AdminAPI.grantAccess(userId, userSelections.modules, userSelections.roles);
      notify('success', 'User activated and assets assigned.');
      
      setSelections(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      fetchData(); 
    } catch (err: any) {
      notify('error', err.response?.data?.error || 'Failed to approve user');
    }
  };

  const pendingUsers = users.filter(u => u.status === 'PENDING');

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Provisioning & Approvals</h1>
        <p className="text-slate-500 mt-2 font-medium">Generate secure invites and provision workspace access to pending employees.</p>
      </div>

      {message.text && (
        <div className={`px-4 py-3 rounded-2xl text-sm font-bold uppercase tracking-widest ${message.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
          {message.text}
        </div>
      )}

      {/* Generate Invite Panel */}
      <div className="embossed-card p-8 w-full lg:w-1/2">
        <h2 className="text-xl font-bold text-slate-700 mb-6 flex items-center">
          <div className="p-2 bg-lightgray rounded-lg mr-3 shadow-inner">
            <LinkIcon className="w-5 h-5 text-gamboge-600" />
          </div>
          Generate Invitation
        </h2>
        <form onSubmit={handleGenerateInvite} className="space-y-4">
          <InputField label="Employee Email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
          <button 
            type="submit" 
            disabled={isGenerating || !inviteEmail}
            className="shine-btn w-full flex justify-center items-center py-4 text-white font-bold rounded-2xl text-sm tracking-widest uppercase mt-4 disabled:opacity-50"
          >
            {isGenerating ? (
              <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Dispatching Invite...</>
            ) : (
              'Create Secure Link'
            )}
          </button>
        </form>

        {generatedLink && (
          <div className="mt-6 p-5 inner-depth rounded-2xl animate-in fade-in slide-in-from-top-4">
            <p className="text-xs text-slate-500 mb-2 font-bold uppercase tracking-widest">Share this link:</p>
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-300">
              <code className="text-gamboge-700 text-sm truncate mr-4 font-semibold">{generatedLink}</code>
              <button onClick={() => { navigator.clipboard.writeText(generatedLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="text-slate-400 hover:text-slate-700 p-2 shrink-0">
                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Approvals Queue */}
      <div className="embossed-card p-8">
        <h2 className="text-xl font-bold text-slate-700 mb-6 flex items-center">
          <div className="p-2 bg-lightgray rounded-lg mr-3 shadow-inner">
            <UserCheck className="w-5 h-5 text-gamboge-600" />
          </div>
          Waiting Room Approvals ({pendingUsers.length})
        </h2>

        {isLoadingQueue ? (
          <div className="flex items-center justify-center py-12 text-slate-500 font-bold uppercase tracking-widest">
            <Loader2 className="w-6 h-6 animate-spin mr-3" /> Loading Queue...
          </div>
        ) : (
          <div className="inner-depth p-4 rounded-3xl overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-300 text-slate-500 text-xs uppercase tracking-widest">
                  <th className="py-4 px-6 font-bold w-1/4">Employee</th>
                  <th className="py-4 px-6 font-bold w-1/4">Assign Roles</th>
                  <th className="py-4 px-6 font-bold w-1/4">Assign Modules</th>
                  <th className="py-4 px-6 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500 font-medium">
                      No users currently in the waiting room.
                    </td>
                  </tr>
                ) : (
                  pendingUsers.map(user => (
                    <tr key={user.id} className="border-b border-slate-300/50 hover:bg-slate-50 transition-colors">
                      <td className="py-5 px-6">
                        <div className="font-bold text-slate-700">{user.first_name} {user.last_name}</div>
                        <div className="text-xs text-slate-500 font-medium">{user.email}</div>
                        <div className="text-[10px] text-gamboge-600 font-mono mt-1 font-bold">ID: {user.id.split('-')[0]}</div>
                      </td>
                      
                      {/* Sleek Pill UI for Roles */}
                      <td className="py-5 px-6 align-top">
                        <div className="flex flex-wrap gap-2 max-w-[280px]">
                          {roles.map(role => {
                            const isSelected = selections[user.id]?.roles?.includes(role.id);
                            return (
                              <button
                                key={role.id}
                                onClick={() => handleCheckboxChange(user.id, 'roles', role.id, !isSelected)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                  isSelected 
                                    ? 'bg-gamboge-100 border-gamboge-500 text-gamboge-700 shadow-sm' 
                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-100'
                                }`}
                              >
                                {role.name}
                              </button>
                            );
                          })}
                          {roles.length === 0 && <span className="text-xs text-slate-400 font-medium">No roles available</span>}
                        </div>
                      </td>

                      {/* Sleek Pill UI for Modules */}
                      <td className="py-5 px-6 align-top">
                        <div className="flex flex-wrap gap-2 max-w-[280px]">
                          {modules.map(mod => {
                            const isSelected = selections[user.id]?.modules?.includes(mod.id);
                            return (
                              <button
                                key={mod.id}
                                onClick={() => handleCheckboxChange(user.id, 'modules', mod.id, !isSelected)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                  isSelected 
                                    ? 'bg-gamboge-100 border-gamboge-500 text-gamboge-700 shadow-sm' 
                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-100'
                                }`}
                              >
                                {mod.name}
                              </button>
                            );
                          })}
                          {modules.length === 0 && <span className="text-xs text-slate-400 font-medium">No modules available</span>}
                        </div>
                      </td>

                      <td className="py-5 px-6 text-right align-middle">
                        <button 
                          onClick={() => handleApproveUser(user.id)}
                          className="bg-green-100 hover:bg-green-200 text-green-700 shadow-sm font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-widest transition-all"
                        >
                          Activate
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}