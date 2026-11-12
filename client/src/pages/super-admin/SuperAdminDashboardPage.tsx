import React, { useEffect, useState } from 'react';
import adminApi, { AdminOverviewMetrics } from '../../services/adminApi';
import LoadingState from '../../components/common/LoadingState';
import { formatINR } from '../../utils/formatters';

interface SuperAdminDashboardPageProps {
  onNavigate?: (path: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const SuperAdminDashboardPage: React.FC<SuperAdminDashboardPageProps> = ({
  onNavigate,
  onShowToast,
}) => {
  const [metrics, setMetrics] = useState<AdminOverviewMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const data = await adminApi.getOverview();
        setMetrics(data);
      } catch {
        onShowToast('error', 'Unable to retrieve SuperAdmin master telemetry', 'Network Error');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [onShowToast]);

  if (loading) {
    return <LoadingState message="Connecting to SuperAdmin master telemetry..." />;
  }

  const gmv = metrics?.grossRevenueInr ?? 0;
  const commission = metrics?.commissionCollectedInr ?? Math.round(gmv * 0.15);
  const meals = metrics?.totalMealsRescued ?? 0;
  const restaurants = metrics?.totalRestaurantsCount ?? 0;
  const pendingKyc = metrics?.pendingKycCount ?? 0;

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* Primary KPI Grid (Light Themed) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Platform GMV</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">currency_rupee</span>
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatINR(gmv)}</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-700 font-semibold">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span>Audited marketplace volume</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Platform Commission</span>
            <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">account_balance</span>
            </span>
          </div>
          <p className="text-2xl font-bold text-purple-800">{formatINR(commission)}</p>
          <p className="text-xs text-slate-500 mt-2 font-medium">15% retained platform margin</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Rescued Meals</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">lunch_dining</span>
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{meals.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-2 font-medium">Prevented surplus disposal</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Partner Compliance</span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{restaurants} Kitchens</p>
          <p className="text-xs text-blue-700 mt-2 font-medium">{pendingKyc} pending FSSAI approval</p>
        </div>
      </div>

      {/* Quick Access Matrix (Light Themed) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onNavigate && onNavigate('/app/super-admin/partners')}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-500 hover:bg-emerald-50/30 text-left transition-all shadow-xs group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[22px]">storefront</span>
          </div>
          <h3 className="text-sm font-bold text-slate-900">Partner Kitchen Registry</h3>
          <p className="text-xs text-slate-500 mt-1">Review FSSAI certificates, store statuses, and payout accounts.</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate && onNavigate('/app/super-admin/reports')}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-500 hover:bg-blue-50/30 text-left transition-all shadow-xs group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[22px]">monitoring</span>
          </div>
          <h3 className="text-sm font-bold text-slate-900">Financial & Audit Reports</h3>
          <p className="text-xs text-slate-500 mt-1">Export transaction registries, commission ledgers, and carbon impact.</p>
        </button>
      </div>
    </div>
  );
};

export default SuperAdminDashboardPage;
