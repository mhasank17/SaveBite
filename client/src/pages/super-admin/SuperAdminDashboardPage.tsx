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

  const gmv = metrics?.grossRevenueInr || 48250;
  const commission = metrics?.commissionCollectedInr || 7237;
  const meals = metrics?.totalMealsRescued || 312;
  const restaurants = metrics?.totalRestaurantsCount || 8;
  const pendingKyc = metrics?.pendingKycCount || 2;
  const openDisputes = metrics?.openDisputesCount || 0;

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Master Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-purple-400 text-3xl">shield_person</span>
            <h1 className="text-2xl font-bold text-white">SuperAdmin Command Center</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Platform-wide governance, root security controls, financial auditing, and cross-portal administration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-purple-950/70 border border-purple-800/80 text-purple-300 text-xs font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span>Root Authority Mode</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onNavigate) onNavigate('/app/super-admin/settings');
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-700 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            System Controls
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Platform GMV</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">currency_rupee</span>
            </span>
          </div>
          <p className="text-2xl font-bold text-white">{formatINR(gmv)}</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400 font-semibold">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span>Audited marketplace volume</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net University Commission</span>
            <span className="w-8 h-8 rounded-xl bg-purple-950 text-purple-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">account_balance</span>
            </span>
          </div>
          <p className="text-2xl font-bold text-white">{formatINR(commission)}</p>
          <p className="text-xs text-purple-300 mt-2 font-medium">Retained platform margin</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Rescued Meals</span>
            <span className="w-8 h-8 rounded-xl bg-amber-950 text-amber-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">lunch_dining</span>
            </span>
          </div>
          <p className="text-2xl font-bold text-white">{meals.toLocaleString()}</p>
          <p className="text-xs text-amber-400 mt-2 font-medium">Prevented landfill disposal</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Partner Compliance</span>
            <span className="w-8 h-8 rounded-xl bg-blue-950 text-blue-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </span>
          </div>
          <p className="text-2xl font-bold text-white">{restaurants} Kitchens</p>
          <p className="text-xs text-blue-300 mt-2 font-medium">{pendingKyc} pending FSSAI approval</p>
        </div>
      </div>

      {/* System Infrastructure Health */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-400">dns</span>
          Infrastructure Status & High-Availability
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400 font-bold uppercase">PostgreSQL Database</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <p className="text-sm font-bold text-white">Supabase Pooled</p>
            <p className="text-xs text-slate-500 mt-1">Latency: 18ms</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400 font-bold uppercase">Authentication</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <p className="text-sm font-bold text-white">JWT + Session Engine</p>
            <p className="text-xs text-slate-500 mt-1">Zero bypass enabled</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400 font-bold uppercase">Payment Gateway</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <p className="text-sm font-bold text-white">Razorpay Sandbox</p>
            <p className="text-xs text-slate-500 mt-1">INR Currency Locked</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400 font-bold uppercase">Dispute Engine</span>
              <span className={`w-2.5 h-2.5 rounded-full ${openDisputes > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            </div>
            <p className="text-sm font-bold text-white">{openDisputes} Open Disputes</p>
            <p className="text-xs text-slate-500 mt-1">Auto-refund threshold: ₹200</p>
          </div>
        </div>
      </div>

      {/* Quick Access Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => onNavigate && onNavigate('/app/super-admin/admins')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-600/50 hover:bg-slate-850 text-left transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-950 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[22px]">admin_panel_settings</span>
          </div>
          <h3 className="text-sm font-bold text-white">Administrator Accounts</h3>
          <p className="text-xs text-slate-400 mt-1">Manage staff admin credentials, privileges and roles.</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate && onNavigate('/app/super-admin/partners')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-600/50 hover:bg-slate-850 text-left transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[22px]">storefront</span>
          </div>
          <h3 className="text-sm font-bold text-white">Partner Kitchen Registry</h3>
          <p className="text-xs text-slate-400 mt-1">Review FSSAI certificates, store statuses, and payout accounts.</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate && onNavigate('/app/super-admin/reports')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-600/50 hover:bg-slate-850 text-left transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-950 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[22px]">monitoring</span>
          </div>
          <h3 className="text-sm font-bold text-white">Financial & Audit Reports</h3>
          <p className="text-xs text-slate-400 mt-1">Export transaction registries, commission ledgers, and carbon impact.</p>
        </button>
      </div>
    </div>
  );
};

export default SuperAdminDashboardPage;
