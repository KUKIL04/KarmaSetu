import React, { useState, useEffect } from 'react';
import { AdminAPI } from '../../api/admin.api';
import { InputField } from '../../components/ui/InputField';
import { ShieldCheck, Key, Plus, Loader2 } from 'lucide-react';

export default function RolesManager() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchRBACData();
  }, []);

  const fetchRBACData = async () => {
    setIsLoading(true);
    try {
      // In a real flow, these would hit the backend endpoints we map next
      const [rolesRes, permsRes] = await Promise.all([
        AdminAPI.getRoles().catch(() => []), 
        AdminAPI.getPermissions().catch(() => [])
      ]);
      setRoles(Array.isArray(rolesRes) ? rolesRes : []);
      setPermissions(Array.isArray(permsRes) ? permsRes : []);
    } catch (err) {
      console.error("Failed to sync RBAC data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const notify = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await AdminAPI.createRole(roleName, roleDesc);
      setRoleName('');
      setRoleDesc('');
      notify('success', 'Role created successfully.');
      fetchRBACData();
    } catch (err: any) {
      notify('error', err.response?.data?.error || 'Failed to create role');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Access Control (RBAC)</h1>
        <p className="text-slate-500 mt-2 font-medium">Define custom roles and manage granular platform permissions.</p>
      </div>

      {message.text && (
        <div className={`px-4 py-3 rounded-2xl text-sm font-bold uppercase tracking-widest ${message.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Create Role Panel */}
        <div className="lg:col-span-1 space-y-8">
          <div className="embossed-card p-8">
            <h2 className="text-xl font-bold text-slate-700 mb-6 flex items-center">
              <div className="p-2 bg-lightgray rounded-lg mr-3 shadow-inner">
                <Plus className="w-5 h-5 text-gamboge-600" />
              </div>
              New Role
            </h2>
            <form onSubmit={handleCreateRole} className="space-y-4">
              <InputField label="Role Name" placeholder="e.g. Host Admin" value={roleName} onChange={(e) => setRoleName(e.target.value)} required />
              <InputField label="Description" placeholder="Access level details" value={roleDesc} onChange={(e) => setRoleDesc(e.target.value)} />
              <button type="submit" className="shine-btn w-full py-4 text-white font-bold rounded-2xl text-sm tracking-widest uppercase mt-4">
                Create Role
              </button>
            </form>
          </div>
        </div>

        {/* Existing Roles Matrix */}
        <div className="lg:col-span-2 embossed-card p-8">
          <h2 className="text-xl font-bold text-slate-700 mb-6 flex items-center">
            <div className="p-2 bg-lightgray rounded-lg mr-3 shadow-inner">
              <ShieldCheck className="w-5 h-5 text-gamboge-600" />
            </div>
            Role Directory
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-500 font-bold uppercase tracking-widest">
              <Loader2 className="w-6 h-6 animate-spin mr-3" /> Syncing Matrix...
            </div>
          ) : roles.length === 0 ? (
             <div className="inner-depth p-8 text-center rounded-3xl">
                <Key className="w-10 h-10 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">No custom roles defined yet.</p>
             </div>
          ) : (
            <div className="space-y-4">
              {roles.map(role => (
                <div key={role.id} className="inner-depth p-5 rounded-3xl flex justify-between items-center group">
                  <div>
                    <h4 className="font-extrabold text-slate-800 tracking-tight text-lg">{role.name}</h4>
                    <p className="text-sm text-slate-500 font-medium mt-1">{role.description}</p>
                  </div>
                  <button className="px-6 py-3 bg-lightgray border border-slate-300 rounded-2xl text-xs font-bold text-slate-600 uppercase tracking-widest shadow-sm hover:text-gamboge-600 transition-colors">
                    Manage Permissions
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}