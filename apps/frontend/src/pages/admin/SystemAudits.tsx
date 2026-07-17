import React, { useState, useEffect } from 'react';
import { AdminAPI } from '../../api/admin.api';
import { Activity, Loader2 } from 'lucide-react';

export default function SystemAudits() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await AdminAPI.getAuditLogs();
        setLogs(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch audit logs", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">System Audits</h1>
        <p className="text-slate-500 mt-2 font-medium">Immutable security logs, authentication events, and administrative actions.</p>
      </div>

      <div className="embossed-card p-8">
        <h2 className="text-xl font-bold text-slate-700 mb-6 flex items-center">
          <div className="p-2 bg-lightgray rounded-lg mr-3 shadow-inner">
            <Activity className="w-5 h-5 text-gamboge-600" />
          </div>
          Recent Activity (Last 50 Events)
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-slate-500 font-bold uppercase tracking-widest">
            <Loader2 className="w-6 h-6 animate-spin mr-3" /> Fetching Logs...
          </div>
        ) : (
          /* Added max-h-[600px], overflow-y-auto, and relative positioning */
          <div className="inner-depth p-1 rounded-3xl overflow-x-auto max-h-[600px] overflow-y-auto relative bg-slate-50/50">
            <table className="w-full text-left border-collapse">
              {/* Added sticky positioning and backdrop blur to the header */}
              <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10 shadow-sm">
                <tr className="text-slate-500 text-xs uppercase tracking-widest">
                  <th className="py-4 px-6 font-bold border-b border-slate-300">Timestamp</th>
                  <th className="py-4 px-6 font-bold border-b border-slate-300">Event Type</th>
                  <th className="py-4 px-6 font-bold border-b border-slate-300">Actor</th>
                  <th className="py-4 px-6 font-bold border-b border-slate-300">IP Address</th>
                  <th className="py-4 px-6 font-bold border-b border-slate-300">Metadata</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">No audit events recorded yet.</td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id} className="border-b border-slate-300/50 hover:bg-slate-100 transition-colors">
                      <td className="py-5 px-6 text-xs text-slate-500 font-bold whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="py-5 px-6">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold tracking-widest uppercase bg-lightgray text-gamboge-700 shadow-inner">
                          {log.event_type}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-sm text-slate-700 font-bold">
                        {log.actor_email || 'SYSTEM'}
                      </td>
                      <td className="py-5 px-6 text-sm text-slate-500 font-mono font-medium">
                        {log.ip_address || 'N/A'}
                      </td>
                      <td className="py-5 px-6">
                        <pre className="text-[10px] text-slate-500 bg-slate-200/50 p-2 rounded-lg overflow-x-auto max-w-xs font-mono border border-slate-300 shadow-inner">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
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