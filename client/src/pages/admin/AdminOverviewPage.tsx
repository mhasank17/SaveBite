import React, { useEffect, useState } from 'react';
import adminApi, { AdminOverviewMetrics } from '../../services/adminApi';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';

interface AdminOverviewPageProps {
  onNavigateTab: (tabId: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const AdminOverviewPage: React.FC<AdminOverviewPageProps> = ({
  onNavigateTab,
  onShowToast,
}) => {
  const [metrics, setMetrics] = useState<AdminOverviewMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getOverview();
      setMetrics(data);
    } catch {
      onShowToast('error', 'Failed to fetch platform metrics.', 'Connection Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return <LoadingState message="Loading platform overview..." />;
  }

  if (!metrics) {
    return (
      <div className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/30 text-center flex flex-col items-center justify-center my-8">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3">
          <span className="material-symbols-outlined text-[28px]">warning</span>
        </div>
        <h3 className="text-lg font-bold text-on-surface mb-1">Unable to Load Platform Metrics</h3>
        <p className="text-sm text-on-surface-variant mb-4 max-w-md">
          Platform performance metrics could not be loaded at this time. Please check your connection and try again.
        </p>
        <Button variant="primary" size="sm" onClick={fetchMetrics}>
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header & Status Banner */}
      <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
            <span className="material-symbols-outlined text-[28px]">shield_person</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline-sm text-2xl font-bold text-on-surface">
                Platform Command Center
              </h1>
              <Badge variant="live" pulseDot pulseColor="primary">
                Live Governance
              </Badge>
            </div>
            <p className="font-body-sm text-on-surface-variant text-sm mt-0.5">
              SuperAdmin oversight across Mumbai partner network, listings, KYC, disputes & settlements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-wide uppercase">System Operational</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            leftIcon={<span className="material-symbols-outlined text-[18px]">refresh</span>}
          >
            Refresh
          </Button>
        </div>
      </section>

      {/* Primary KPI Grid (7 Key Metrics) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Gross Platform GMV */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Platform GMV</span>
            <span className="material-symbols-outlined text-[20px] text-primary">currency_rupee</span>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-extrabold text-on-surface">
              ₹{(metrics.grossRevenueInr ?? 0).toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-primary font-medium mt-1">Total customer transactions</div>
          </div>
        </div>

        {/* Metric 2: 15% Platform Commission */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Commission (15%)</span>
            <span className="material-symbols-outlined text-[20px] text-emerald-600">account_balance</span>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-extrabold text-emerald-600">
              ₹{(metrics.commissionCollectedInr ?? 0).toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-on-surface-variant mt-1">Retained SaveBite revenue</div>
          </div>
        </div>

        {/* Metric 3: Meals Saved */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Meals Rescued</span>
            <span className="material-symbols-outlined text-[20px] text-amber-600">restaurant</span>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-extrabold text-on-surface">
              {(metrics.totalMealsRescued ?? 0).toLocaleString()}
            </div>
            <div className="text-xs text-amber-700 font-medium mt-1">Surplus packs collected</div>
          </div>
        </div>

        {/* Metric 4: Net CO2e Saved */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">CO2e Diverted</span>
            <span className="material-symbols-outlined text-[20px] text-teal-600">eco</span>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-extrabold text-teal-700">
              {Number(metrics.co2eSavedKg ?? metrics.totalCo2eSavedKg ?? 0).toFixed(1)} <span className="text-sm font-bold">kg</span>
            </div>
            <div className="text-xs text-teal-800 font-medium mt-1">Landfill emissions averted</div>
          </div>
        </div>
      </section>

      {/* Operational Queues Summary */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pending KYC Review */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Pending KYC Audits
            </div>
            <div className="text-2xl font-black text-amber-700 mt-1">
              {metrics.pendingKycCount ?? 0} <span className="text-sm font-medium text-on-surface-variant">partners</span>
            </div>
            <div className="text-xs text-on-surface-variant mt-0.5">FSSAI certificates requiring inspection</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateTab('vendors')}
          >
            Review
          </Button>
        </div>

        {/* Open Quality Disputes */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Customer Disputes
            </div>
            <div className="text-2xl font-black text-rose-600 mt-1">
              {metrics.openDisputesCount ?? 0} <span className="text-sm font-medium text-on-surface-variant">open</span>
            </div>
            <div className="text-xs text-on-surface-variant mt-0.5">Late closures or quality claims</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateTab('disputes')}
          >
            Resolve
          </Button>
        </div>

        {/* Partner Payouts */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Settlements Queue
            </div>
            <div className="text-2xl font-black text-primary mt-1">
              Weekly <span className="text-sm font-medium text-on-surface-variant">Cycle</span>
            </div>
            <div className="text-xs text-on-surface-variant mt-0.5">Partner bank payout batch ready</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateTab('payouts')}
          >
            Settle
          </Button>
        </div>
      </section>

      {/* Platform Activity Feed & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Audit & System Activity Feed */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">history</span>
              Live Governance & Audit Trail
            </h2>
            <span className="text-xs text-on-surface-variant font-medium">Real-time system events</span>
          </div>

          <div className="divide-y divide-outline-variant/20">
            {(!metrics.recentActivity || metrics.recentActivity.length === 0) ? (
              <div className="py-8 text-center text-on-surface-variant text-sm flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[28px] text-outline">history</span>
                <span className="font-medium">No recent activity yet</span>
                <span className="text-xs text-on-surface-variant/80">Platform governance events and audit logs will appear here.</span>
              </div>
            ) : (
              metrics.recentActivity.map((act) => (
              <div key={act.id} className="py-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[18px]">
                    {(act.type || '').includes('KYC')
                      ? 'verified'
                      : (act.type || '').includes('DISPUTE')
                      ? 'gavel'
                      : (act.type || '').includes('PAYOUT')
                      ? 'payments'
                      : 'info'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-on-surface">{act.description}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {act.timestamp
                      ? new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Recent'}{' '}
                    • {act.type || 'EVENT'}
                  </p>
                </div>
              </div>
              ))
            )}
          </div>
        </div>

        {/* Admin Quick Governance Action Cards */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-on-surface flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-secondary text-[22px]">bolt</span>
              Fast Actions
            </h2>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => onNavigateTab('vendors')}
                className="w-full text-left p-3.5 rounded-xl border border-outline-variant/30 hover:border-primary/40 hover:bg-surface-container-low transition-all flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-bold text-on-surface">Audit Vendor KYC</div>
                  <div className="text-xs text-on-surface-variant">Approve or request re-inspection</div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('listings')}
                className="w-full text-left p-3.5 rounded-xl border border-outline-variant/30 hover:border-primary/40 hover:bg-surface-container-low transition-all flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-bold text-on-surface">Moderate Listings</div>
                  <div className="text-xs text-on-surface-variant">Pause or delist surplus offers</div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('disputes')}
                className="w-full text-left p-3.5 rounded-xl border border-outline-variant/30 hover:border-primary/40 hover:bg-surface-container-low transition-all flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-bold text-on-surface">Resolve Disputes</div>
                  <div className="text-xs text-on-surface-variant">Process refunds or reject invalid claims</div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('payouts')}
                className="w-full text-left p-3.5 rounded-xl border border-outline-variant/30 hover:border-primary/40 hover:bg-surface-container-low transition-all flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-bold text-on-surface">Execute Payout Batch</div>
                  <div className="text-xs text-on-surface-variant">Generate bank UTR settlements</div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Admin Role: SuperAdmin</span>
            <span className="font-mono text-[11px] bg-surface-container px-2 py-0.5 rounded">ENV: SANDBOX</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewPage;
