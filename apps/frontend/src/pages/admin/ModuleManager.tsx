import React, { useState, useEffect } from 'react';
import { AdminAPI } from '../../api/admin.api';
import { LayoutGrid, Users, Loader2, ShieldMinus, Search, Plus, X, CheckSquare } from 'lucide-react';

export default function ModuleManager() {
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModule, setSelectedModule] = useState<any | null>(null);
  const [authorizedUsers, setAuthorizedUsers] = useState<any[]>([]);
  
  const [isLoadingModules, setIsLoadingModules] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Modal States
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [unassignedUsers, setUnassignedUsers] = useState<any[]>([]);
  const [selectedToGrant, setSelectedToGrant] = useState<string[]>([]);
  
  // Create Module States
  const [isCreateModuleModalOpen, setIsCreateModuleModalOpen] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [newModuleDesc, setNewModuleDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await AdminAPI.getModules();
        const data = Array.isArray(res) ? res : [];
        setModules(data);
        if (data.length > 0) handleSelectModule(data[0]);
      } catch (err) {
        notify('error', 'Failed to fetch workspace modules.');
      } finally {
        setIsLoadingModules(false);
      }
    };
    fetchModules();
  }, []);

  const notify = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };
  
  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await AdminAPI.registerModule(newModuleName, newModuleDesc);
      const newMod = res.module || res; // depending on your API return shape
      setModules(prev => [newMod, ...prev]);
      notify('success', 'Asset provisioned successfully.');
      setIsCreateModuleModalOpen(false);
      setNewModuleName('');
      setNewModuleDesc('');
      handleSelectModule(newMod);
    } catch (err: any) {
      notify('error', err.response?.data?.error || 'Failed to create module.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectModule = async (mod: any) => {
    setSelectedModule(mod);
    setIsLoadingUsers(true);
    setSearchQuery('');
    try {
      const users = await AdminAPI.getModuleUsers(mod.id).catch(() => []);
      const authUsers = Array.isArray(users) ? users : [];
      setAuthorizedUsers(authUsers);

      // Fetch all users to determine who is unassigned
      const allUsers = await AdminAPI.getUsers().catch(() => []);
      const authIds = authUsers.map(u => u.id);
      setUnassignedUsers(Array.isArray(allUsers) ? allUsers.filter(u => !authIds.includes(u.id)) : []);
    } catch (err) {
      notify('error', `Failed to fetch users for ${mod.name}`);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleRevokeAccess = async (userId: string) => {
    if (!selectedModule) return;
    try {
      await AdminAPI.revokeModuleAccess(userId, selectedModule.id);
      notify('success', 'Access revoked successfully.');
      setAuthorizedUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err: any) {
      notify('error', err.response?.data?.error || 'Failed to revoke access');
    }
  };

  const handleUpdateAccessLevel = async (userId: string, newLevel: string) => {
    if (!selectedModule) return;
    try {
      await AdminAPI.updateModuleAccessLevel(selectedModule.id, userId, newLevel as 'READ'|'WRITE');
      setAuthorizedUsers(prev => prev.map(u => u.id === userId ? { ...u, access_level: newLevel } : u));
      notify('success', `Access updated to ${newLevel}.`);
    } catch (err: any) {
      notify('error', 'Failed to update access level.');
    }
  };

  const handleConfirmGrant = async () => {
    if (selectedToGrant.length === 0 || !selectedModule) return;
    try {
      await AdminAPI.grantBulkModuleAccess(selectedModule.id, selectedToGrant);
      notify('success', `Access granted to ${selectedToGrant.length} personnel.`);
      setIsGrantModalOpen(false);
      setSelectedToGrant([]);
      handleSelectModule(selectedModule);
    } catch (err: any) {
      notify('error', 'Failed to grant access.');
    }
  };

  const filteredUsers = authorizedUsers.filter(u => 
    `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUnassigned = unassignedUsers.filter(u => 
    `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(modalSearchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 relative">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Module Access Mapping</h1>
        <p className="text-slate-500 mt-2 font-medium">Audit workspace applications and manage authorized personnel.</p>
      </div>

      {message.text && (
        <div className={`px-4 py-3 rounded-2xl text-sm font-bold uppercase tracking-widest ${message.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Module List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between mb-6 pl-2">
            <div className="flex items-center">
              <div className="p-2 bg-lightgray rounded-lg mr-3 shadow-inner">
                <LayoutGrid className="w-5 h-5 text-gamboge-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-700 tracking-tight">Assets</h2>
            </div>  

            <button 
              onClick={() => setIsCreateModuleModalOpen(true)}
              className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl shadow-sm transition-colors"
              title="Provision New Module"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {isLoadingModules ? (
            <div className="flex items-center text-slate-500 font-bold uppercase tracking-widest p-4">
              <Loader2 className="w-5 h-5 animate-spin mr-3" /> Loading...
            </div>
          ) : modules.length === 0 ? (
            <div className="embossed-card p-6 text-center">
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">No modules provisioned.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {modules.map(mod => (
                <div 
                  key={mod.id} 
                  onClick={() => handleSelectModule(mod)}
                  className={`group relative p-5 rounded-3xl cursor-pointer transition-all duration-200 ease-in-out ${
                    selectedModule?.id === mod.id 
                      ? 'inner-depth border border-slate-200/50 bg-slate-50/50' 
                      : 'bg-slate-50 border border-slate-200/70 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:bg-slate-100/60 hover:border-slate-300'
                  }`}
                >
                  {selectedModule?.id === mod.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-10 w-1.5 bg-gamboge-500 rounded-r-full shadow-[0_0_8px_rgba(199,146,62,0.4)]"></div>
                  )}
                  
                  <div className={`transition-all duration-200 ${selectedModule?.id === mod.id ? 'pl-2' : ''}`}>
                    <h4 className={`font-extrabold tracking-tight text-lg transition-colors ${selectedModule?.id === mod.id ? 'text-gamboge-700' : 'text-slate-700 group-hover:text-slate-900'}`}>
                      {mod.name}
                    </h4>
                    <p className="text-sm text-slate-500 font-medium mt-1 truncate">{mod.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Authorized Users */}
        <div className="lg:col-span-2">
          {selectedModule ? (
            <div className="embossed-card p-8 min-h-[500px] flex flex-col">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-700 flex items-center">
                    <Users className="w-5 h-5 mr-3 text-gamboge-600" />
                    Authorized Personnel
                  </h2>
                  <p className="text-sm text-slate-500 font-medium mt-1">
                    Viewing access list for <strong className="text-gamboge-700">{selectedModule.name}</strong>
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
                    Grant Access
                  </button>
                </div>
              </div>

              {isLoadingUsers ? (
                <div className="flex-1 flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest">
                  <Loader2 className="w-6 h-6 animate-spin mr-3" /> Fetching Access List...
                </div>
              ) : (
                <div className="flex-1 inner-depth p-4 rounded-3xl overflow-y-auto">
                  {filteredUsers.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 font-medium">
                      {searchQuery ? 'No personnel match your filter.' : 'No users currently have access to this module.'}
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-300 text-slate-500 text-xs uppercase tracking-widest">
                          <th className="py-4 px-6 font-bold">Employee</th>
                          <th className="py-4 px-6 font-bold">Permission</th>
                          <th className="py-4 px-6 font-bold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map(user => (
                          <tr key={user.id} className="border-b border-slate-300/50 hover:bg-slate-50 transition-colors">
                            <td className="py-4 px-6">
                              <div className="font-bold text-slate-700">{user.first_name} {user.last_name}</div>
                              <div className="text-xs text-slate-500 font-medium">{user.email}</div>
                            </td>
                            <td className="py-4 px-6">
                              <select 
                                value={user.access_level || 'READ'}
                                onChange={(e) => handleUpdateAccessLevel(user.id, e.target.value)}
                                className="bg-lightgray border border-slate-300 text-slate-700 rounded-xl text-xs font-bold tracking-widest uppercase p-2 outline-none focus:border-gamboge-500 shadow-inner cursor-pointer"
                              >
                                <option value="READ">Read Only</option>
                                <option value="WRITE">Read / Write</option>
                              </select>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button 
                                onClick={() => handleRevokeAccess(user.id)}
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
                <LayoutGrid className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">Select a Module</h3>
              <p className="text-slate-500 text-sm font-medium">Choose a workspace asset from the left to view and manage its authorized personnel.</p>
            </div>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* GRANT ACCESS MODAL                                   */}
      {/* ---------------------------------------------------- */}
      {isGrantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="embossed-card p-8 w-full max-w-lg flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center">
                  <CheckSquare className="w-5 h-5 mr-2 text-gamboge-600" /> Grant Access
                </h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                  Assigning <span className="text-gamboge-700">{selectedModule?.name}</span>
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
                  {modalSearchQuery ? 'No unassigned users match.' : 'All users already have access.'}
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
                Grant ({selectedToGrant.length})
              </button>
            </div>
          </div>
        </div>
      )}
      {/* CREATE MODULE MODAL */}
      {isCreateModuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="embossed-card p-8 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center">
                 Provision Module
              </h3>
              <button onClick={() => setIsCreateModuleModalOpen(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateModule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Asset Title</label>
                <input required type="text" value={newModuleName} onChange={e => setNewModuleName(e.target.value)} className="embossed-input w-full px-4 py-3 rounded-xl text-sm font-bold text-slate-700 outline-none" placeholder="e.g. Payroll Engine" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Description</label>
                <input required type="text" value={newModuleDesc} onChange={e => setNewModuleDesc(e.target.value)} className="embossed-input w-full px-4 py-3 rounded-xl text-sm font-bold text-slate-700 outline-none" placeholder="System purpose..." />
              </div>
              <div className="pt-4 flex space-x-4">
                <button type="button" onClick={() => setIsCreateModuleModalOpen(false)} className="flex-1 py-3 text-slate-700 bg-lightgray hover:bg-slate-200 shadow-sm font-bold rounded-2xl text-sm tracking-widest uppercase">Cancel</button>
                <button type="submit" disabled={isCreating} className="flex-1 shine-btn py-3 text-white font-bold rounded-2xl text-sm tracking-widest uppercase disabled:opacity-50">
                  {isCreating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Provision Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}