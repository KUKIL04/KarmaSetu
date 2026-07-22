import React, { useState, useEffect } from 'react';
import { AdminAPI } from '../../api/admin.api';
import { Users, Loader2, Activity, Ban, KeyRound, ShieldAlert, AlertTriangle, X, UserX, UserCheck } from 'lucide-react';

export default function DirectoryControl() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Security & Access Control Modal States
  const [modal, setModal] = useState<{ 
    isOpen: boolean; 
    type: 'RESET' | 'UNLOCK' | 'TOGGLE_STATUS' | null; 
    user: any | null 
  }>({
    isOpen: false,
    type: null,
    user: null,
  });
  
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Execute confirmed security/access action
  const executeSecurityAction = async () => {
    if (!modal.user || !modal.type) return;
    setIsProcessing(true);
    try {
      if (modal.type === 'RESET') {
        await AdminAPI.triggerPasswordReset(modal.user.id);
        notify('success', 'Credentials invalidated. User notified.');
      } else if (modal.type === 'UNLOCK') {
        await AdminAPI.clearSecurityLockout(modal.user.id);
        notify('success', 'Security lockout cleared. User can login.');
      } else if (modal.type === 'TOGGLE_STATUS') {
        const newStatus = modal.user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        await AdminAPI.updateUserStatus(modal.user.id, newStatus);
        notify('success', `User account status updated to ${newStatus}`);
        fetchUsers();
      }
    } catch (err: any) {
      notify('error', err.response?.data?.error || `Failed to execute ${modal.type} action`);
    } finally {
      setIsProcessing(false);
      setModal({ isOpen: false, type: null, user: null });
    }
  };

  const managedUsers = users.filter(u => u.status !== 'PENDING');

  return (
    <div className="max-w-7xl mx-auto space-y-8 relative">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Users Control</h1>
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
                          onClick={() => setModal({ isOpen: true, type: 'RESET', user })}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 shadow-sm font-bold py-2.5 px-3 rounded-xl text-xs uppercase tracking-widest transition-all inline-flex items-center"
                          title="Force Password Reset"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setModal({ isOpen: true, type: 'UNLOCK', user })}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 shadow-sm font-bold py-2.5 px-3 rounded-xl text-xs uppercase tracking-widest transition-all inline-flex items-center"
                          title="Clear Security Lockout"
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="py-5 px-6 text-right">
                        <button 
                          onClick={() => setModal({ isOpen: true, type: 'TOGGLE_STATUS', user })}
                          className={`font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-widest shadow-sm transition-all ${
                            user.status === 'ACTIVE' 
                              ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200' 
                              : 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'
                          }`}
                        >
                          {user.status === 'ACTIVE' ? 'Revoke Access' : 'Restore Access'}
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

      {/* ---------------------------------------------------- */}
      {/* CONFIRMATION MODAL                                  */}
      {/* ---------------------------------------------------- */}
      {modal.isOpen && modal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="embossed-card p-8 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-2xl mr-4 shadow-inner ${
                  modal.type === 'RESET' || (modal.type === 'TOGGLE_STATUS' && modal.user.status === 'ACTIVE') 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-gamboge-100 text-gamboge-600'
                }`}>
                  {modal.type === 'RESET' && <AlertTriangle className="w-6 h-6" />}
                  {modal.type === 'UNLOCK' && <ShieldAlert className="w-6 h-6" />}
                  {modal.type === 'TOGGLE_STATUS' && (
                    modal.user.status === 'ACTIVE' ? <UserX className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                    {modal.type === 'RESET' && 'Force Password Reset'}
                    {modal.type === 'UNLOCK' && 'Clear Security Lockout'}
                    {modal.type === 'TOGGLE_STATUS' && (
                      modal.user.status === 'ACTIVE' ? 'Revoke Workspace Access' : 'Restore Workspace Access'
                    )}
                  </h3>
                  <p className="text-xs font-bold text-slate-500 mt-1 truncate max-w-[200px]">
                    Target: {modal.user.email}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setModal({ isOpen: false, type: null, user: null })}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="inner-depth p-4 rounded-3xl mb-6 text-sm font-medium text-slate-600 leading-relaxed">
              {modal.type === 'RESET' && (
                <>
                  This will <strong className="text-red-500">instantly terminate all active sessions</strong> and scramble the user's current password. They will receive an email forcing them to create a new credential.
                </>
              )}
              {modal.type === 'UNLOCK' && (
                <>
                  This will clear any active Redis lockouts triggered by failed login attempts, allowing the user to immediately attempt logging in again.
                </>
              )}
              {modal.type === 'TOGGLE_STATUS' && modal.user.status === 'ACTIVE' && (
                <>
                  Are you sure you want to <strong className="text-red-500">revoke access</strong> for {modal.user.first_name}? The user will be immediately blocked from signing in or accessing any workspace modules.
                </>
              )}
              {modal.type === 'TOGGLE_STATUS' && modal.user.status !== 'ACTIVE' && (
                <>
                  Are you sure you want to <strong className="text-green-600">restore access</strong> for {modal.user.first_name}? This will reactivate the account and allow normal workspace authorization.
                </>
              )}
            </div>

            <div className="flex space-x-4">
              <button 
                onClick={() => setModal({ isOpen: false, type: null, user: null })}
                className="flex-1 py-3 text-slate-700 bg-lightgray border border-slate-300 hover:bg-slate-200 shadow-sm font-bold rounded-2xl text-sm tracking-widest uppercase transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button 
                onClick={executeSecurityAction}
                disabled={isProcessing}
                className={`flex-1 py-3 text-white font-bold rounded-2xl text-sm tracking-widest uppercase disabled:opacity-50 flex justify-center items-center ${
                  modal.type === 'RESET' || (modal.type === 'TOGGLE_STATUS' && modal.user.status === 'ACTIVE') 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'shine-btn'
                }`}
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Execution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}