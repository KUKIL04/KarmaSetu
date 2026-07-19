import React, { useState, useEffect } from 'react';
import { AdminAPI } from '../../api/admin.api';
import { ShieldCheck, Users, Loader2, ShieldMinus, Search, Plus, Key, X, CheckSquare } from 'lucide-react';

export default function RolesManager() {
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [assignedUsers, setAssignedUsers] = useState<any[]>([]);
  
  // UI States
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Grant Modal States
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [unassignedUsers, setUnassignedUsers] = useState<any[]>([]); // Mock pool of users to add
  const [selectedToGrant, setSelectedToGrant] = useState<string[]>([]);

  // Create Role States
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await AdminAPI.getRoles();
        const data = Array.isArray(res) ? res : [];
        setRoles(data);
        if (data.length > 0) handleSelectRole(data[0]);
      } catch (err) {
        notify('error', 'Failed to fetch access roles.');
      } finally {
        setIsLoadingRoles(false);
      }
    };
    fetchRoles();
  }, []);

  const notify = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await AdminAPI.createRole(newRoleName, newRoleDesc);
      setRoles(prev => [res, ...prev]);
      notify('success', 'Role created successfully.');
      setIsCreateRoleModalOpen(false);
      setNewRoleName('');
      setNewRoleDesc('');
      handleSelectRole(res); // Auto-select the newly created role
    } catch (err: any) {
      notify('error', err.response?.data?.error || 'Failed to create role.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectRole = async (role: any) => {
    setSelectedRole(role);
    setIsLoadingUsers(true);
    setSearchQuery('');
    try {
      const assigned = await AdminAPI.getRoleUsers(role.id).catch(() => []);
      const authUsers = Array.isArray(assigned) ? assigned : [];
      setAssignedUsers(authUsers);
      
      const allUsers = await AdminAPI.getUsers().catch(() => []);
      const assignedIds = authUsers.map((u: any) => u.id);
      setUnassignedUsers(Array.isArray(allUsers) ? allUsers.filter((u: any) => !assignedIds.includes(u.id)) : []);
    } catch (err) {
      notify('error', `Failed to fetch users for ${role.name}`);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleRevokeRole = async (userId: string) => {
    if (!selectedRole) return;
    try {
      await AdminAPI.revokeRoleAccess(userId, selectedRole.id); // Real API Call!
      notify('success', 'Role revoked successfully.');
      setAssignedUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err: any) {
      notify('error', err.response?.data?.error || 'Failed to revoke role');
    }
  };

  const handleConfirmGrant = async () => {
    if (selectedToGrant.length === 0 || !selectedRole) return;
    try {
      await AdminAPI.grantBulkRoleAccess(selectedRole.id, selectedToGrant);
      notify('success', `Role granted to ${selectedToGrant.length} personnel.`);
      setIsGrantModalOpen(false);
      setSelectedToGrant([]);
      handleSelectRole(selectedRole);
    } catch (err: any) {
      notify('error', 'Failed to grant roles.');
    }
  };

  const filteredUsers = assignedUsers.filter(u => 
    `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUnassigned = unassignedUsers.filter(u => 
    `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(modalSearchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 relative">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Access Control (RBAC)</h1>
        <p className="text-slate-500 mt-2 font-medium">Manage custom roles and audit personnel assignments.</p>
      </div>

      {message.text && (
        <div className={`px-4 py-3 rounded-2xl text-sm font-bold uppercase tracking-widest ${message.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Roles List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between mb-6 pl-2">
            <div className="flex items-center">
              <div className="p-2 bg-lightgray rounded-lg mr-3 shadow-inner">
                <ShieldCheck className="w-5 h-5 text-gamboge-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-700 tracking-tight">Roles</h2>
            </div>
            
            <button 
              onClick={() => setIsCreateRoleModalOpen(true)}
              className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl shadow-sm transition-colors"
              title="Create New Role"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {isLoadingRoles ? (
            <div className="flex items-center text-slate-500 font-bold uppercase tracking-widest p-4">
              <Loader2 className="w-5 h-5 animate-spin mr-3" /> Loading...
            </div>
          ) : roles.length === 0 ? (
            <div className="embossed-card p-6 text-center">
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">No roles defined.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {roles.map(role => (
                <div 
                  key={role.id} 
                  onClick={() => handleSelectRole(role)}
                  className={`group relative p-5 rounded-3xl cursor-pointer transition-all duration-200 ease-in-out ${
                    selectedRole?.id === role.id 
                      ? 'inner-depth border border-slate-200/50 bg-slate-200' 
                      : 'bg-slate-50 border border-slate-200/70 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:bg-slate-100/60 hover:border-slate-300'
                  }`}
                >
                  {selectedRole?.id === role.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-10 w-1.5 bg-gamboge-500 rounded-r-full shadow-[0_0_8px_rgba(199,146,62,0.4)]"></div>
                  )}
                  
                  <div className={`transition-all duration-200 ${selectedRole?.id === role.id ? 'pl-2' : ''}`}>
                    <h4 className={`font-extrabold tracking-tight text-lg transition-colors ${selectedRole?.id === role.id ? 'text-gamboge-700' : 'text-slate-700 group-hover:text-slate-900'}`}>
                      {role.name}
                    </h4>
                    <p className="text-sm text-slate-500 font-medium mt-1 truncate">{role.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Assigned Users */}
        <div className="lg:col-span-2">
          {selectedRole ? (
            <div className="embossed-card p-8 min-h-[500px] flex flex-col">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-700 flex items-center">
                    <Users className="w-5 h-5 mr-3 text-gamboge-600" />
                    Assigned Personnel
                  </h2>
                  <p className="text-sm text-slate-500 font-medium mt-1">
                    Viewing accounts with the <strong className="text-gamboge-700">{selectedRole.name}</strong> role
                  </p>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Filter directory..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="embossed-input w-full pl-10 pr-4 py-3 rounded-2xl text-sm font-bold text-slate-700 placeholder-slate-400 outline-none"
                    />
                  </div>
                  <button 
                    onClick={() => setIsGrantModalOpen(true)}
                    className="shine-btn py-3 px-6 text-white font-bold rounded-2xl text-xs tracking-widest uppercase flex-shrink-0"
                  >
                    Grant Role
                  </button>
                </div>
              </div>

              {isLoadingUsers ? (
                <div className="flex-1 flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest">
                  <Loader2 className="w-6 h-6 animate-spin mr-3" /> Fetching Assignments...
                </div>
              ) : (
                <div className="flex-1 inner-depth p-4 rounded-3xl overflow-y-auto">
                  {filteredUsers.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 font-medium">
                      {searchQuery ? 'No personnel match your filter.' : 'No users currently assigned to this role.'}
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-300 text-slate-500 text-xs uppercase tracking-widest">
                          <th className="py-4 px-6 font-bold">Employee</th>
                          <th className="py-4 px-6 font-bold">Contact</th>
                          <th className="py-4 px-6 font-bold text-right">Action</th>
                        </tr>
                      </thead>
                        <tbody>
                        {filteredUsers.map(user => (
                          <tr key={user.id} className="border-b border-slate-300/50 hover:bg-slate-50 transition-colors">
                            <td className="py-4 px-6">
                              <div className="font-bold text-slate-700">{user.first_name} {user.last_name}</div>
                            </td>
                            <td className="py-4 px-6 text-sm text-slate-500 font-medium">{user.email}</td>
                            <td className="py-4 px-6 text-right">
                              <button 
                                onClick={() => handleRevokeRole(user.id)}
                                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-sm font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-widest transition-all flex items-center ml-auto"
                              >
                                <ShieldMinus className="w-4 h-4 mr-2" /> Revoke
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="embossed-card p-8 h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 inner-depth rounded-full flex items-center justify-center mb-4">
                <Key className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">Select a Role</h3>
              <p className="text-slate-500 text-sm font-medium">Choose an access role from the left to view and manage assigned personnel.</p>
            </div>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* GRANT ROLE MODAL                                     */}
      {/* ---------------------------------------------------- */}
      {isGrantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="embossed-card p-8 w-full max-w-lg flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center">
                  <CheckSquare className="w-5 h-5 mr-2 text-gamboge-600" /> Assign Role
                </h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                  Granting <span className="text-gamboge-700">{selectedRole?.name}</span>
                </p>
              </div>
              <button 
                onClick={() => { setIsGrantModalOpen(false); setSelectedToGrant([]); }}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative mb-4 shrink-0">
              <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search unassigned personnel..." 
                value={modalSearchQuery}
                onChange={(e) => setModalSearchQuery(e.target.value)}
                className="embossed-input w-full pl-10 pr-4 py-3 rounded-2xl text-sm font-bold text-slate-700 placeholder-slate-400 outline-none"
              />
            </div>

            <div className="inner-depth p-2 rounded-3xl flex-1 overflow-y-auto mb-6">
              {filteredUnassigned.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm font-medium">
                  {modalSearchQuery ? 'No unassigned users match.' : 'All users already have this role.'}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredUnassigned.map(user => (
                    <label 
                      key={user.id} 
                      className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="font-bold text-slate-700 text-sm">{user.first_name} {user.last_name}</div>
                        <div className="text-xs text-slate-500 font-medium">{user.email}</div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={selectedToGrant.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedToGrant(prev => [...prev, user.id]);
                          else setSelectedToGrant(prev => prev.filter(id => id !== user.id));
                        }}
                        className="w-5 h-5 rounded border-slate-300 text-gamboge-600 focus:ring-gamboge-500 accent-gamboge-600"
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex space-x-4 shrink-0">
              <button 
                onClick={() => { setIsGrantModalOpen(false); setSelectedToGrant([]); }}
                className="flex-1 py-3 text-slate-700 bg-lightgray border border-slate-300 hover:bg-slate-200 shadow-sm font-bold rounded-2xl text-sm tracking-widest uppercase transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmGrant}
                disabled={selectedToGrant.length === 0}
                className="flex-1 shine-btn py-3 text-white font-bold rounded-2xl text-sm tracking-widest uppercase disabled:opacity-50"
              >
                Assign ({selectedToGrant.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE ROLE MODAL */}
      {isCreateRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="embossed-card p-8 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center">
                 Define New Role
              </h3>
              <button onClick={() => setIsCreateRoleModalOpen(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Role Title</label>
                <input required type="text" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} className="embossed-input w-full px-4 py-3 rounded-xl text-sm font-bold text-slate-700 outline-none" placeholder="e.g. Finance Auditor" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Description</label>
                <input required type="text" value={newRoleDesc} onChange={e => setNewRoleDesc(e.target.value)} className="embossed-input w-full px-4 py-3 rounded-xl text-sm font-bold text-slate-700 outline-none" placeholder="Role responsibilities..." />
              </div>
              <div className="pt-4 flex space-x-4">
                <button type="button" onClick={() => setIsCreateRoleModalOpen(false)} className="flex-1 py-3 text-slate-700 bg-lightgray hover:bg-slate-200 shadow-sm font-bold rounded-2xl text-sm tracking-widest uppercase">Cancel</button>
                <button type="submit" disabled={isCreating} className="flex-1 shine-btn py-3 text-white font-bold rounded-2xl text-sm tracking-widest uppercase disabled:opacity-50">
                  {isCreating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}