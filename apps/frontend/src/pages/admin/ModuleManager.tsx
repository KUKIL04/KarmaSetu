import React, { useState, useEffect } from 'react';
import { AdminAPI } from '../../api/admin.api';
import { LayoutGrid, Users, Loader2, ShieldMinus, Search } from 'lucide-react';

export default function ModuleManager() {
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModule, setSelectedModule] = useState<any | null>(null);
  const [authorizedUsers, setAuthorizedUsers] = useState<any[]>([]);
  
  const [isLoadingModules, setIsLoadingModules] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // 1. Fetch modules on load
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

  // 2. Fetch users when a module is selected
  const handleSelectModule = async (mod: any) => {
    setSelectedModule(mod);
    setIsLoadingUsers(true);
    setSearchQuery('');
    try {
      // Stubbed backend call - will hit our new endpoint
      const users = await AdminAPI.getModuleUsers(mod.id).catch(() => []);
      setAuthorizedUsers(Array.isArray(users) ? users : []);
    } catch (err) {
      notify('error', `Failed to fetch users for ${mod.name}`);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // 3. Revoke Access Action
  const handleRevokeAccess = async (userId: string) => {
    if (!selectedModule) return;
    try {
      await AdminAPI.revokeModuleAccess(userId, selectedModule.id);
      notify('success', 'Access revoked successfully.');
      // Remove from local state immediately for snappy UI
      setAuthorizedUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err: any) {
      notify('error', err.response?.data?.error || 'Failed to revoke access');
    }
  };

  const filteredUsers = authorizedUsers.filter(u => 
    `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
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
          <div className="flex items-center mb-6 pl-2">
            <div className="p-2 bg-lightgray rounded-lg mr-3 shadow-inner">
              <LayoutGrid className="w-5 h-5 text-gamboge-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-700 tracking-tight">Assets</h2>
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
                  className={`p-5 rounded-3xl cursor-pointer transition-all ${
                    selectedModule?.id === mod.id 
                      ? 'inner-depth border-2 border-gamboge-500/50' 
                      : 'embossed-card hover:-translate-y-1'
                  }`}
                >
                  <h4 className={`font-extrabold tracking-tight text-lg ${selectedModule?.id === mod.id ? 'text-gamboge-700' : 'text-slate-700'}`}>
                    {mod.name}
                  </h4>
                  <p className="text-sm text-slate-500 font-medium mt-1 truncate">{mod.description}</p>
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

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search personnel..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="embossed-input w-full pl-10 pr-4 py-3 rounded-2xl text-sm font-bold text-slate-700 placeholder-slate-400 outline-none"
                  />
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
                      {searchQuery ? 'No personnel match your search.' : 'No users currently have access to this module.'}
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
    </div>
  );
}