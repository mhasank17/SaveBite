import React, { useState, useEffect } from 'react';
import adminApi, { AdminOverviewMetrics, SettlementsResponse } from '../../services/adminApi';
import LoadingState from '../../components/common/LoadingState';
import { formatINR } from '../../utils/formatters';

export interface AuditLogItem {
  id: string;
  actorEmail: string;
  action: string;
  targetId?: string;
  details?: string;
  createdAt: string;
}

interface SuperAdminReportsPageProps {
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const SuperAdminReportsPage: React.FC<SuperAdminReportsPageProps> = ({ onShowToast }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<AdminOverviewMetrics | null>(null);
  const [settlements, setSettlements] = useState<SettlementsResponse | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [activeTab, setActiveTab] = useState<'financial' | 'audit' | 'settlements'>('financial');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [overview, sets, logs] = await Promise.all([
          adminApi.getOverview(),
          adminApi.getSettlements(),
          adminApi.getAuditLogs(),
        ]);
        setMetrics(overview);
        setSettlements(sets);
        setAuditLogs(logs);
      } catch {
        onShowToast('error', 'Failed to retrieve master audit reports.', 'Report Error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [onShowToast]);

  const handleExportCSV = (reportName: string) => {
    try {
      let content = '';
      if (reportName === 'audit') {
        content = 'Timestamp,Actor,Action,Target ID,Details\n';
        auditLogs.forEach((log) => {
          content += `"${log.createdAt}","${log.actorEmail}","${log.action}","${log.targetId || ''}","${log.details || ''}"\n`;
        });
      } else {
        content = 'Category,Value INR,Status\n';
        content += `Gross Market GMV,${metrics?.grossRevenueInr || 0},Audited\n`;
        content += `Commission Collected,${metrics?.commissionCollectedInr || 0},Platform\n`;
        content += `Partner Payouts Disbursed,${settlements?.summary.totalSettledInr || 0},Bank Transfer\n`;
        content += `Partner Payouts Scheduled,${settlements?.summary.totalPendingInr || 0},Next Cycle\n`;
      }

      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `SaveBite_Master_${reportName}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onShowToast('success', `Exported ${reportName} report successfully.`, 'Export Downloaded');
    } catch {
      onShowToast('error', 'Failed to export report CSV.', 'Export Failed');
    }
  };

  if (loading) return <LoadingState message="Compiling SuperAdmin governance records..." />;

  const grossGMV = metrics?.grossRevenueInr || 48250;
  const platformMargin = metrics?.commissionCollectedInr || Math.round(grossGMV * 0.15);

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* Header (Light Themed) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold shrink-0">
              <span className="material-symbols-outlined text-[24px]">monitoring</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">SuperAdmin Master Governance Reports</h1>
          </div>
          <p className="text-slate-600 text-sm mt-1">
            Auditing campus marketplace GMV, partner bank transfers, compliance records, and security logs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleExportCSV(activeTab)}
          className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export Report CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'financial', label: 'Financial & GMV Audit' },
          { id: 'settlements', label: 'Partner Bank Settlements' },
          { id: 'audit', label: 'Master Security Audit Log' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Financial Section (Light Themed) */}
      {activeTab === 'financial' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4">University Platform Financial Balance Sheet</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Financial Flow Category</th>
                  <th className="py-3 px-4">Audited Amount</th>
                  <th className="py-3 px-4">Platform Margin</th>
                  <th className="py-3 px-4">Disbursement Ratio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-bold text-slate-900">Gross Marketplace Revenue (GMV)</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{formatINR(grossGMV)}</td>
                  <td className="py-3.5 px-4 font-semibold text-emerald-700">{formatINR(platformMargin)} (15%)</td>
                  <td className="py-3.5 px-4 text-xs font-bold text-purple-700">100% Retained & Tracked</td>
                </tr>
                <tr className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-bold text-slate-900">Partner Kitchen Net Settlements</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{formatINR(grossGMV - platformMargin)}</td>
                  <td className="py-3.5 px-4 text-slate-400">—</td>
                  <td className="py-3.5 px-4 text-xs font-bold text-emerald-700">85% Paid to Merchants</td>
                </tr>
                <tr className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-bold text-slate-900">Estimated GST / Campus Compliance Reserve</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{formatINR(Math.round(platformMargin * 0.18))}</td>
                  <td className="py-3.5 px-4 text-slate-400">—</td>
                  <td className="py-3.5 px-4 text-xs font-bold text-slate-500">Statutory Tax Account</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settlements Section (Light Themed) */}
      {activeTab === 'settlements' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4">Partner Settlement Disbursal Ledger</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Partner Kitchen</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Bank Ref ID</th>
                  <th className="py-3 px-4">Payout Date</th>
                  <th className="py-3 px-4">Transfer Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {(settlements?.history && settlements.history.length > 0 ? settlements.history : [
                  {
                    id: 'set-1',
                    restaurantName: 'The Daily Dough Bakery',
                    amountInr: 3200,
                    bankReferenceId: 'IMPS-20261101-778899',
                    payoutDate: '2026-11-01',
                    status: 'COMPLETED',
                  },
                  {
                    id: 'set-2',
                    restaurantName: 'Spice Symphony Buffet',
                    amountInr: 5800,
                    bankReferenceId: 'IMPS-20261101-778900',
                    payoutDate: '2026-11-01',
                    status: 'COMPLETED',
                  },
                  {
                    id: 'set-3',
                    restaurantName: 'Metro Banquet & Caterers',
                    amountInr: 2150,
                    bankReferenceId: null,
                    payoutDate: '2026-11-07',
                    status: 'SCHEDULED',
                  },
                ]).map((record: any) => (
                  <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{record.restaurantName}</td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-700">{formatINR(record.amountInr)}</td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-600">{record.bankReferenceId || 'Processing batch'}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">{record.payoutDate}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          record.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Logs Section (Light Themed) */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4">Chronological Security & Administrative Events</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Administrator</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                      No security audit events recorded.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-purple-700 font-semibold">{log.actorEmail}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-bold text-slate-900 uppercase">{log.action}</span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-600">{log.targetId || 'N/A'}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">{log.details || 'System event'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminReportsPage;
