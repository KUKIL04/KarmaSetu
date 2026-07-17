import React, { useState, useEffect } from 'react';
import { AdminAPI } from '../../api/admin.api';
import { Users, Loader2, Activity, Ban, KeyRound, ShieldAlert } from 'lucide-react';

export default function DirectoryControl() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const usersRes = await AdminAPI.getUsers();
      setUsers(Array.isArray(usersRes) ? usersRes : []);
    } catch (err) {
      notify('error', 'Failed to fetch directory data.');
    } finally {
      setIsLoading(false);
    }
  };

  const notify = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await AdminAPI.updateUserStatus(userId, newStatus);
      notify('success', `User account is now ${newStatus}`);
      fetchUsers();
    } catch (err: any) {
      notify('error', err.response?.data?.error || 'Failed to update user status');
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!window.confirm("Are you sure you want to trigger a forced password reset?")) return;
    try {
      await AdminAPI.triggerPasswordReset(userId);
      notify('success', 'Password reset link dispatched to user.');
    } catch (err: any) {
      notify('error', err.response?.data?.error || 'Failed to trigger reset');
    }
  };

  const handleClearLockout = async (userId: string) => {
    try {
      await AdminAPI.clearSecurityLockout(userId);
      notify('success', 'Security lockout cleared. User can re-attempt login.');
    } catch (err: any) {
      notify('error', err.response?.data?.error || 'Failed to clear lockout');
    }
  };

  const managedUsers = users.filter(u => u.status !== 'PENDING');

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Directory Control</h1>
        <p className="text-slate-500 mt-2 font-medium">Manage active accounts, revoke access, and handle credential recoveries.</p>
      </div>

      {message.text && (
        <div className={`px-4 py-3 rounded-2xl text-sm font-bold uppercase tracking-widest ${message.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
          {message.text}
        </div>
      )}

      <div className="embossed-card p-8">
        <h2 className="text-xl font-bold text-slate-700 mb-6 flex items-center">
          <div className="p-2 bg-lightgray rounded-lg mr-3 shadow-inner">
            <Users className="w-5 h-5 text-gamboge-600" />
          </div>
          Active Directory
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-slate-500 font-bold uppercase tracking-widest">
            <Loader2 className="w-6 h-6 animate-spin mr-3" /> Loading Directory...
          </div>
        ) : (
          <div className="inner-depth p-4 rounded-3xl overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-300 text-slate-500 text-xs uppercase tracking-widest">
                  <th className="py-4 px-6 font-bold">Employee</th>
                  <th className="py-4 px-6 font-bold">Contact</th>
                  <th className="py-4 px-6 font-bold">Status</th>
                  <th className="py-4 px-6 font-bold text-right">Credential Ops</th>
                  <th className="py-4 px-6 font-bold text-right">Access Control</th>
                </tr>
              </thead>
              <tbody>
                {managedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">No active users in the directory.</td>
                  </tr>
                ) : (
                  managedUsers.map(user => (
                    <tr key={user.id} className="border-b border-slate-300/50 hover:bg-slate-50 transition-colors">
                      <td className="py-5 px-6 font-bold text-slate-700">
                        {user.first_name} {user.last_name}
                      </td>
                      <td className="py-5 px-6 text-sm text-slate-500 font-medium">
                        {user.email}
                      </td>
                      <td className="py-5 px-6">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold tracking-widest uppercase ${
                          user.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-700 shadow-inner' 
                            : 'bg-red-100 text-red-600 shadow-inner'
                        }`}>
                          {user.status === 'ACTIVE' ? <Activity className="w-4 h-4 mr-1.5"/> : <Ban className="w-4 h-4 mr-1.5"/>}
                          {user.status}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-right space-x-2">
                        <button 
                          onClick={() => handleResetPassword(user.id)}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 shadow-sm font-bold py-2.5 px-3 rounded-xl text-xs uppercase tracking-widest transition-all inline-flex items-center"
                          title="Force Password Reset"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleClearLockout(user.id)}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 shadow-sm font-bold py-2.5 px-3 rounded-xl text-xs uppercase tracking-widest transition-all inline-flex items-center"
                          title="Clear Security Lockout"
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="py-5 px-6 text-right">
                        <button 
                          onClick={() => handleToggleStatus(user.id, user.status)}
                          className={`font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-widest shadow-sm transition-all ${
                            user.status === 'ACTIVE' 
                              ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200' 
                              : 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'
                          }`}
                        >
                          {user.status === 'ACTIVE' ? 'Suspend' : 'Restore'}
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