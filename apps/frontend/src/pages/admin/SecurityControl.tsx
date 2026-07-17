import React, { useState, useEffect } from 'react';
import { AdminAPI } from '../../api/admin.api';
import { ShieldAlert, Loader2, PowerOff, Clock } from 'lucide-react';

export default function SecurityControl() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const data = await AdminAPI.getActiveSessions();
      setSessions(Array.isArray(data) ? data : []);
    } catch (error) {
      notify('error', 'Failed to fetch active network sessions.');
    } finally {
      setIsLoading(false);
    }
  };

  const notify = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleRevoke = async (tokenId: string) => {
    try {
      await AdminAPI.revokeSession(tokenId);
      notify('success', 'Session forcibly terminated.');
      setSessions(prev => prev.filter(s => s.id !== tokenId));
    } catch (err: any) {
      notify('error', err.response?.data?.error || 'Failed to terminate session');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Active Sessions</h1>
        <p className="text-slate-500 mt-2 font-medium">Monitor active devices and force-logout compromised accounts.</p>
      </div>

      {message.text && (
        <div className={`px-4 py-3 rounded-2xl text-sm font-bold uppercase tracking-widest ${message.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
          {message.text}
        </div>
      )}

      <div className="embossed-card p-8">
        <h2 className="text-xl font-bold text-slate-700 mb-6 flex items-center">
          <div className="p-2 bg-lightgray rounded-lg mr-3 shadow-inner">
            <ShieldAlert className="w-5 h-5 text-gamboge-600" />
          </div>
          Live Network Tokens
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-slate-500 font-bold uppercase tracking-widest">
            <Loader2 className="w-6 h-6 animate-spin mr-3" /> Scanning Network...
          </div>
        ) : (
          /* Applied max-h-[600px] and vertical scrolling here */
          <div className="inner-depth p-1 rounded-3xl overflow-x-auto max-h-[600px] overflow-y-auto relative bg-slate-50/50">
            <table className="w-full text-left border-collapse">
              {/* Made the header sticky with a frosted glass effect */}
              <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10 shadow-sm">
                <tr className="text-slate-500 text-xs uppercase tracking-widest">
                  <th className="py-4 px-6 font-bold border-b border-slate-300">User</th>
                  <th className="py-4 px-6 font-bold border-b border-slate-300">Session Created</th>
                  <th className="py-4 px-6 font-bold border-b border-slate-300">Token Expiry</th>
                  <th className="py-4 px-6 font-bold border-b border-slate-300 text-right">Kill Switch</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500 font-medium">No active sessions found on the network.</td>
                  </tr>
                ) : (
                  sessions.map(session => (
                    <tr key={session.id} className="border-b border-slate-300/50 hover:bg-slate-100 transition-colors">
                      <td className="py-5 px-6">
                        <div className="font-bold text-slate-700">{session.first_name} {session.last_name}</div>
                        <div className="text-xs text-slate-500 font-medium mt-1">{session.email}</div>
                      </td>
                      <td className="py-5 px-6 text-sm text-slate-600 font-medium flex items-center mt-2">
                        <Clock className="w-4 h-4 mr-2 text-slate-400" />
                        {formatDate(session.created_at)}
                      </td>
                      <td className="py-5 px-6 text-sm text-gamboge-700 font-mono font-bold">
                        {formatDate(session.expires_at)}
                      </td>
                      <td className="py-5 px-6 text-right">
                        <button 
                          onClick={() => handleRevoke(session.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-sm font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-widest transition-all flex items-center ml-auto"
                        >
                          <PowerOff className="w-4 h-4 mr-2" /> Kill Session
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