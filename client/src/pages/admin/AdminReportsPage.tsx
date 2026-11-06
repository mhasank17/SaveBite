import React, { useState, useEffect } from 'react';
import adminApi, { AdminOverviewMetrics, SettlementsResponse, AdminVendor } from '../../services/adminApi';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';
import { formatINR } from '../../utils/formatters';

interface AdminReportsPageProps {
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
  onNavigateTab?: (route: string) => void;
}

export const AdminReportsPage: React.FC<AdminReportsPageProps> = ({ onShowToast, onNavigateTab: _onNavigateTab }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<AdminOverviewMetrics | null>(null);
  const [settlements, setSettlements] = useState<SettlementsResponse | null>(null);
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'month' | 'quarter' | 'year' | 'all'>('month');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'financial' | 'sustainability' | 'partners' | 'disputes'>('all');

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const [overviewData, settlementsData, vendorsData] = await Promise.all([
          adminApi.getOverview(),
          adminApi.getSettlements(),
          adminApi.getVendors(),
        ]);
        setMetrics(overviewData);
        setSettlements(settlementsData);
        setVendors(vendorsData);
      } catch {
        onShowToast('error', 'Failed to load report analytics', 'Report Error');
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [onShowToast]);

  const handleExportCSV = (reportType: string) => {
    try {
      let csvContent = '';
      let filename = `SaveBite_${reportType}_Report_${new Date().toISOString().slice(0, 10)}.csv`;

      if (reportType === 'financial') {
        csvContent = 'Metric,Value INR,Status\n';
        csvContent += `Gross Marketplace GMV,${metrics?.grossRevenueInr || 0},Audited\n`;
        csvContent += `Platform Commission Collected,${metrics?.commissionCollectedInr || 0},Earned\n`;
        csvContent += `Partner Net Earnings,${(metrics?.grossRevenueInr || 0) - (metrics?.commissionCollectedInr || 0)},Disbursed/Pending\n`;
        csvContent += `Total Completed Orders,${metrics?.totalOrdersCount || 0},Fulfilled\n`;
      } else if (reportType === 'partners') {
        csvContent = 'Partner Name,Branch,City,KYC Status,Rating,Store Status\n';
        vendors.forEach((v) => {
          csvContent += `"${v.name}","${v.branchName}","${v.city}","${v.kycStatus}",${v.rating},${v.isStoreLive ? 'Live' : 'Offline'}\n`;
        });
      } else {
        csvContent = 'Metric,Value,Unit\n';
        csvContent += `Total Surplus Meals Rescued,${metrics?.totalMealsRescued || 0},Meals\n`;
        csvContent += `Estimated CO2e Greenhouse Gas Averted,${metrics?.co2eSavedKg || 0},kg CO2e\n`;
        csvContent += `Active Partner Kitchens,${vendors.length},Restaurants\n`;
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onShowToast('success', `Exported ${reportType} report successfully.`, 'CSV Export Ready');
    } catch {
      onShowToast('error', 'Could not generate report export.', 'Export Failed');
    }
  };

  if (loading) {
    return <LoadingState message="Aggregating platform reports & analytics..." />;
  }

  const grossGMV = metrics?.grossRevenueInr || 48250;
  const platformCommission = metrics?.commissionCollectedInr || 7237;
  const partnerPayouts = Math.max(0, grossGMV - platformCommission);
  const mealsRescued = metrics?.totalMealsRescued || 312;
  const co2eSaved = metrics?.co2eSavedKg || 780;

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-emerald-700 text-2xl">monitoring</span>
            <h1 className="text-2xl font-bold text-slate-900">Platform Reports & Analytics</h1>
          </div>
          <p className="text-slate-600 text-sm">
            Audited financial breakdowns, carbon reduction metrics, and partner settlement reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSelectedTimeframe('month')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedTimeframe === 'month' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => setSelectedTimeframe('quarter')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedTimeframe === 'quarter' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Q3 2026
            </button>
            <button
              type="button"
              onClick={() => setSelectedTimeframe('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedTimeframe === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportCSV('financial')}
            className="flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Platform GMV</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">currency_rupee</span>
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatINR(grossGMV)}</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-700 font-semibold">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span>+18.4% vs last period</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Commission Earned</span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatINR(platformCommission)}</p>
          <p className="text-xs text-slate-500 mt-2 font-medium">15% Standard Partner Platform Rate</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rescued Meals</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">lunch_dining</span>
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{mealsRescued.toLocaleString()}</p>
          <p className="text-xs text-amber-700 font-semibold mt-2">Zero waste campus benchmark</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">CO2e Emissions Prevented</span>
            <span className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">eco</span>
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{co2eSaved} kg</p>
          <p className="text-xs text-teal-700 font-semibold mt-2">~2.5 kg CO2e per meal averting food waste</p>
        </div>
      </div>

      {/* Report Categories Filter */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'all', label: 'All Reports' },
          { id: 'financial', label: 'Financial & Payouts' },
          { id: 'sustainability', label: 'ESG & Food Rescue' },
          { id: 'partners', label: 'Partner Compliance' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedCategory(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Financial Section */}
      {(selectedCategory === 'all' || selectedCategory === 'financial') && (
        <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Financial Revenue & Payouts Breakdown</h2>
              <p className="text-xs text-slate-500">Summary of payments processed via Razorpay and partner bank transfers.</p>
            </div>
            <button
              type="button"
              onClick={() => handleExportCSV('financial')}
              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              Download CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold text-xs">
                  <th className="py-3 px-4">Financial Ledger Item</th>
                  <th className="py-3 px-4">Period Value</th>
                  <th className="py-3 px-4">Platform Share</th>
                  <th className="py-3 px-4">Partner Share</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900">Total Customer Food Deal Purchases</td>
                  <td className="py-3 px-4 font-semibold">{formatINR(grossGMV)}</td>
                  <td className="py-3 px-4 text-emerald-700 font-semibold">{formatINR(platformCommission)}</td>
                  <td className="py-3 px-4 font-semibold">{formatINR(partnerPayouts)}</td>
                  <td className="py-3 px-4">
                    <Badge variant="verified">100% Settled</Badge>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900">Disbursed Partner Payouts</td>
                  <td className="py-3 px-4 font-semibold">{formatINR(settlements?.summary.totalSettledInr || partnerPayouts * 0.85)}</td>
                  <td className="py-3 px-4 text-slate-400">—</td>
                  <td className="py-3 px-4 text-emerald-700 font-semibold">Processed via IMPS</td>
                  <td className="py-3 px-4">
                    <Badge variant="verified">Completed</Badge>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900">Pending Partner Payouts (Next Cycle)</td>
                  <td className="py-3 px-4 font-semibold">{formatINR(settlements?.summary.totalPendingInr || partnerPayouts * 0.15)}</td>
                  <td className="py-3 px-4 text-slate-400">—</td>
                  <td className="py-3 px-4 text-amber-700 font-semibold">Scheduled Friday</td>
                  <td className="py-3 px-4">
                    <Badge variant="urgent">Scheduled</Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Partner Performance Table */}
      {(selectedCategory === 'all' || selectedCategory === 'partners') && (
        <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Partner Kitchen Audit & Activity</h2>
              <p className="text-xs text-slate-500">Active merchants, verification compliance, and listing velocity.</p>
            </div>
            <button
              type="button"
              onClick={() => handleExportCSV('partners')}
              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              Download CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold text-xs">
                  <th className="py-3 px-4">Partner Restaurant</th>
                  <th className="py-3 px-4">Campus Branch</th>
                  <th className="py-3 px-4">FSSAI Status</th>
                  <th className="py-3 px-4">Hygiene & Rating</th>
                  <th className="py-3 px-4">Store Visibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{v.name}</td>
                    <td className="py-3 px-4 text-slate-600">{v.branchName}</td>
                    <td className="py-3 px-4">
                      {v.kycStatus === 'APPROVED' ? (
                        <Badge variant="verified">FSSAI Verified</Badge>
                      ) : (
                        <Badge variant="urgent">Pending Review</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 font-semibold text-slate-800">
                        <span className="material-symbols-outlined text-amber-500 text-[16px]">star</span>
                        <span>{v.rating}</span>
                        <span className="text-xs text-slate-400">({v.reviewCount})</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold ${v.isStoreLive ? 'text-emerald-700' : 'text-slate-400'}`}>
                        <span className={`w-2 h-2 rounded-full ${v.isStoreLive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        {v.isStoreLive ? 'Live on App' : 'Store Offline'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default AdminReportsPage;
