import React, { useState, useEffect } from 'react';
import { AdminAPI } from '../../api/admin.api';
import { UserCheck, Loader2 } from 'lucide-react';

export default function ApprovalsQueue() {
  const [users, setUsers] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, modulesRes] = await Promise.all([
        AdminAPI.getUsers(),
        AdminAPI.getModules()
      ]);
      setUsers(Array.isArray(usersRes) ? usersRes : []);
      setModules(Array.isArray(modulesRes) ? modulesRes : []);
    } catch (err) {
      notify('error', 'Failed to fetch pending approvals.');
    } finally {
      setIsLoading(false);
    }
  };

  const notify = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleApproveUser = async (userId: string, selectedModules: string[]) => {
    try {
      await AdminAPI.grantAccess(userId, selectedModules);
      notify('success', 'User activated and modules assigned.');
      fetchData(); // Refresh the list
    } catch (err: any) {
      notify('error', err.response?.data?.error || 'Failed to approve user');
    }
  };

  const pendingUsers = users.filter(u => u.status === 'PENDING');

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Waiting Room Approvals</h1>
        <p className="text-slate-500 mt-2 font-medium">Verify identities and provision workspace access to pending employees.</p>
      </div>

      {message.text && (
        <div className={`px-4 py-3 rounded-2xl text-sm font-bold uppercase tracking-widest ${message.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
          {message.text}
        </div>
      )}

      <div className="embossed-card p-8">
        <h2 className="text-xl font-bold text-slate-700 mb-6 flex items-center">
          <div className="p-2 bg-lightgray rounded-lg mr-3 shadow-inner">
            <UserCheck className="w-5 h-5 text-gamboge-600" />
          </div>
          Pending Queue ({pendingUsers.length})
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-slate-500 font-bold uppercase tracking-widest">
            <Loader2 className="w-6 h-6 animate-spin mr-3" /> Loading Queue...
          </div>
        ) : (
          <div className="inner-depth p-4 rounded-3xl overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-slate-500 text-xs uppercase tracking-widest">
                  <th className="py-4 px-6 font-bold">Employee</th>
                  <th className="py-4 px-6 font-bold">Contact</th>
                  <th className="py-4 px-6 font-bold">Assign Assets</th>
                  <th className="py-4 px-6 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500 font-medium">No users currently in the waiting room.</td>
                  </tr>
                ) : (
                  pendingUsers.map(user => (
                    <tr key={user.id} className="border-b border-slate-300/50 hover:bg-slate-50 transition-colors">
                      <td className="py-5 px-6">
                        <div className="font-bold text-slate-700">{user.first_name} {user.last_name}</div>
                        <div className="text-xs text-gamboge-600 font-mono mt-1 font-semibold">ID: {user.id.split('-')[0]}</div>
                      </td>
                      <td className="py-5 px-6 text-sm text-slate-500 font-medium">{user.email}</td>
                      <td className="py-5 px-6">
                        <select 
                          multiple 
                          className="w-full bg-lightgray border border-slate-300 text-slate-700 rounded-xl text-sm p-2 max-h-24 outline-none focus:border-gamboge-500 shadow-inner font-medium"
                          id={`select-${user.id}`}
                        >
                          {modules.map(mod => <option key={mod.id} value={mod.id} className="p-1">{mod.name}</option>)}
                        </select>
                        <p className="text-xs text-slate-400 mt-2 font-semibold">Hold Ctrl/Cmd to select multiple</p>
                      </td>
                      <td className="py-5 px-6 text-right">
                        <button 
                          onClick={() => {
                            const selectElement = document.getElementById(`select-${user.id}`) as HTMLSelectElement;
                            const selectedValues = Array.from(selectElement.selectedOptions).map(opt => opt.value);
                            handleApproveUser(user.id, selectedValues);
                          }}
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