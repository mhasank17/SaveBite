import React, { useEffect, useState } from 'react';
import adminApi from '../../services/adminApi';
import LoadingState from '../../components/common/LoadingState';

interface AdminAuditLogsPageProps {
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const AdminAuditLogsPage: React.FC<AdminAuditLogsPageProps> = ({ onShowToast }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAuditLogs();
      setLogs(data);
    } catch {
      onShowToast('error', 'Failed to load governance audit logs.', 'Connection Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (loading) return <LoadingState message="Loading governance audit logs..." />;

  return (
    <div className="flex flex-col gap-6 pb-12">
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
        <h1 className="text-2xl font-bold text-slate-900">Governance & Audit Logs</h1>
        <p className="text-sm text-slate-500 mt-1">
          Immutable event log of administrative approvals, merchant KYC updates, dispute resolutions, and payout dispatches.
        </p>
      </section>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-xs uppercase font-bold text-slate-500 tracking-wider">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Action Event</th>
                <th className="py-3.5 px-4">Actor ID</th>
                <th className="py-3.5 px-4">Event Details & Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                    {new Date(l.createdAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-800">
                      {l.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                    {l.actorId || 'SuperAdmin'}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-700 max-w-md">
                    {typeof l.details === 'string'
                      ? l.details
                      : l.details?.message ||
                        l.details?.adminNotes ||
                        JSON.stringify(l.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAuditLogsPage;
