import React, { useState, useEffect } from 'react';
import { SuperAdminAPI } from '../../api/superadmin.api';
import { Users, Search, ShieldAlert, ShieldCheck, Loader2, Power } from 'lucide-react';

export default function GlobalUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await SuperAdminAPI.listGlobalUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch global users", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBlacklist = async (userId: string, currentStatus: boolean, email: string) => {
    const confirmMsg = currentStatus 
      ? `Are you sure you want to RESTORE platform access for ${email}?`
      : `WARNING: Blacklisting ${email} will instantly kill all active sessions and block them from EVERY workspace. Proceed?`;

    if (!window.confirm(confirmMsg)) return;

    setProcessingId(userId);
    try {
      await SuperAdminAPI.blacklistUser(userId, !currentStatus);
      // Optimistically update the UI
      setUsers(users.map(u => 
        u.id === userId ? { ...u, is_blacklisted: !currentStatus } : u
      ));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update blacklist status');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Global Identity Matrix</h1>
          <p className="text-slate-400 mt-2 text-sm font-medium">
            Manage all human identities and global network access across the entire platform.
          </p>
        </div>
        
        <div className="relative w-full md:w-96">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Search className="w-5 h-5 text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Search by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-white rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
            <p className="text-xs font-bold uppercase tracking-widest">Scanning Identities...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 text-xs uppercase tracking-widest">
                  <th className="py-5 px-6 font-bold w-1/3">Identity</th>
                  <th className="py-5 px-6 font-bold">Workspace Map</th>
                  <th className="py-5 px-6 font-bold">Network Status</th>
                  <th className="py-5 px-6 font-bold text-right">Kill Switch</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500 text-sm font-medium">
                      No identities match your query.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center mr-4 shrink-0">
                            <Users className="w-5 h-5 text-indigo-400" />
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">{user.first_name} {user.last_name}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{user.email}</div>
                            <div className="text-[9px] text-slate-600 font-mono mt-1 uppercase">ID: {user.id.split('-')[0]}</div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-slate-800 text-slate-300 border border-slate-700">
                          {user.workspace_count} Tenant{user.workspace_count !== '1' ? 's' : ''}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        {!user.is_blacklisted ? (
                          <div className="flex items-center text-xs font-bold text-emerald-400 uppercase tracking-wider">
                            <ShieldCheck className="w-4 h-4 mr-1.5" /> Clear
                          </div>
                        ) : (
                          <div className="flex items-center text-xs font-bold text-red-400 uppercase tracking-wider animate-pulse">
                            <ShieldAlert className="w-4 h-4 mr-1.5" /> Blocked
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button 
                          onClick={() => handleToggleBlacklist(user.id, user.is_blacklisted, user.email)}
                          disabled={processingId === user.id}
                          className={`inline-flex items-center justify-center p-2 rounded-xl border text-white font-bold transition-all disabled:opacity-50
                            ${user.is_blacklisted 
                              ? 'bg-slate-800 border-slate-700 hover:bg-emerald-600 hover:border-emerald-500' 
                              : 'bg-slate-950 border-slate-800 hover:bg-red-600 hover:border-red-500'}`}
                          title={user.is_blacklisted ? "Lift Blacklist" : "Execute Blacklist"}
                        >
                          {processingId === user.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Power className="w-5 h-5" />
                          )}
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