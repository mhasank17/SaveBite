import React, { useState, useEffect } from 'react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import partnerApi, { PartnerRestaurant } from '../../services/partnerApi';

export interface PartnerDashboardPageProps {
  restaurant: PartnerRestaurant | null;
  onOpenCreateDealModal: () => void;
  onOpenVerifyOtpModal: () => void;
  onNavigateTab: (tabId: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
  refreshTrigger?: number;
}

export const PartnerDashboardPage: React.FC<PartnerDashboardPageProps> = ({
  restaurant,
  onOpenCreateDealModal,
  onOpenVerifyOtpModal,
  onNavigateTab,
  onShowToast,
  refreshTrigger,
}) => {
  const [liveRestaurant, setLiveRestaurant] = useState<PartnerRestaurant | null>(restaurant);
  const [isStoreLive, setIsStoreLive] = useState(restaurant?.isStoreLive ?? true);
  const [toggling, setToggling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (restaurant) {
      setLiveRestaurant(restaurant);
      setIsStoreLive(restaurant.isStoreLive);
    }
  }, [restaurant]);

  const handleRefresh = async (showNotice = true) => {
    setRefreshing(true);
    try {
      const fresh = await partnerApi.getRestaurant();
      setLiveRestaurant(fresh);
      setIsStoreLive(fresh.isStoreLive);
      if (showNotice) {
        onShowToast('info', 'Dashboard metrics updated from database.', 'Refreshed');
      }
    } catch {
      // keep existing
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    handleRefresh(false);
  }, [refreshTrigger]);

  const handleToggleStoreLive = async () => {
    setToggling(true);
    const nextState = !isStoreLive;
    try {
      const res = await partnerApi.toggleStoreStatus(nextState);
      setIsStoreLive(res.isStoreLive);
      onShowToast(
        res.isStoreLive ? 'success' : 'info',
        res.isStoreLive
          ? 'Store is now LIVE! Customers can reserve your available deals.'
          : 'Store orders are PAUSED. Existing confirmed orders remain valid.',
        res.isStoreLive ? 'Store Live' : 'Store Paused'
      );
    } catch {
      onShowToast('error', 'Failed to update store status.', 'Error');
    } finally {
      setToggling(false);
    }
  };

  const currentRestaurant = liveRestaurant || restaurant;
  const metrics = currentRestaurant?.metrics || {
    activeListingsCount: 0,
    todayOrdersCount: 0,
    pendingPickupsCount: 0,
    totalMealsRescued: 0,
    totalRevenueInr: 0,
    co2eSavedKg: 0,
  };

  return (
    <div className="flex flex-col gap-space-lg pb-12 animate-fade-in">
      
      {/* Partner Hero: Store Status Banner */}
      <section className="bg-surface-container-lowest p-space-md md:p-space-lg rounded-3xl border border-outline-variant/30 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[28px]">storefront</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                {currentRestaurant?.name || 'The Daily Dough Bakery'}
              </h2>
              <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full font-medium">
                {currentRestaurant?.branchName || 'Downtown Branch'}
              </span>
            </div>
            <p className="text-body-sm text-on-surface-variant flex items-center gap-2 mt-0.5">
              <span>{currentRestaurant?.address || '100 Demo Street, Sandbox Sector 1'}</span>
              <span>•</span>
              <span className="text-primary font-bold">FSSAI: {currentRestaurant?.licenseNumber || 'DEMO-FSSAI-00000000000001-SAMPLE'}</span>
            </p>
          </div>
        </div>

        {/* Controls: Refresh & Store Status */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          <button
            type="button"
            disabled={refreshing}
            onClick={() => handleRefresh(true)}
            className="px-3 py-2 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-xs font-bold text-on-surface hover:bg-surface-container-high transition-all flex items-center gap-1.5 shadow-xs"
            title="Refresh database metrics"
          >
            <span className={`material-symbols-outlined text-[18px] text-primary ${refreshing ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          {/* Live Store Toggle */}
          <div className="flex items-center gap-3 bg-surface-container-low p-2 rounded-2xl border border-outline-variant/30">
            <div className="flex items-center gap-2 pl-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isStoreLive ? 'bg-secondary animate-pulse' : 'bg-outline'
                }`}
              />
              <span className="text-xs font-bold text-on-surface">
                {isStoreLive ? 'Store Open & Accepting Deals' : 'Store Paused'}
              </span>
            </div>
            <button
              type="button"
              disabled={toggling}
              onClick={handleToggleStoreLive}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isStoreLive
                  ? 'bg-secondary text-on-secondary shadow-xs'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {toggling ? 'Updating...' : isStoreLive ? 'Open' : 'Resume'}
            </button>
          </div>
        </div>
      </section>

      {/* KYC / Hygiene Verification Status Notice */}
      {restaurant?.isDemo && (
        <section className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-500 text-[24px] shrink-0 mt-0.5">
            verified_user
          </span>
          <div className="flex-1 flex flex-col text-xs text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2 font-bold text-sm">
              <span>Demo Partner Account (Pending Commercial KYC Verification)</span>
              <Badge variant="neutral">Demo / Uninspected</Badge>
            </div>
            <p className="mt-1">
              This outlet is currently configured for local sandbox and development checkout testing. Real customer orders are held until city health inspection and commercial FSSAI documentation are verified.
            </p>
          </div>
        </section>
      )}

      {/* 4 Core KPI Metrics */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-space-sm md:gap-space-md">
        
        {/* Metric 1: Active Listings */}
        <div className="bg-surface-container-lowest p-space-md rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">
              Active Deals
            </span>
            <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-on-surface">
              {metrics.activeListingsCount}
            </span>
            <span className="text-xs text-on-surface-variant block mt-0.5">Currently on marketplace</span>
          </div>
        </div>

        {/* Metric 2: Today's Orders */}
        <div className="bg-surface-container-lowest p-space-md rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">
              Today's Orders
            </span>
            <span className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-on-surface">
              {metrics.todayOrdersCount}
            </span>
            <span className="text-xs text-secondary font-bold block mt-0.5">
              {metrics.pendingPickupsCount} pending pickup
            </span>
          </div>
        </div>

        {/* Metric 3: Total Meals Rescued */}
        <div className="bg-surface-container-lowest p-space-md rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">
              Meals Rescued
            </span>
            <span className="w-8 h-8 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-[18px]">eco</span>
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-on-surface">
              {metrics.totalMealsRescued}
            </span>
            <span className="text-xs text-on-surface-variant block mt-0.5">
              {metrics.co2eSavedKg} kg CO₂e saved
            </span>
          </div>
        </div>

        {/* Metric 4: Total Revenue (₹ INR) */}
        <div className="bg-surface-container-lowest p-space-md rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">
              Total Sales
            </span>
            <span className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">payments</span>
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-primary">
              ₹{metrics.totalRevenueInr.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-on-surface-variant block mt-0.5">In Indian Rupees (₹)</span>
          </div>
        </div>
      </section>

      {/* Quick Actions Bar */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
        <button
          type="button"
          onClick={onOpenCreateDealModal}
          className="p-4 rounded-2xl bg-primary text-on-primary font-bold shadow-sm hover:bg-primary/95 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px]">add_circle</span>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold">Post New Food Deal</span>
              <span className="text-xs opacity-90">Publish food deal listing</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenVerifyOtpModal}
          className="p-4 rounded-2xl bg-secondary text-on-secondary font-bold shadow-sm hover:bg-secondary/95 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px]">pin</span>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold">Verify Pickup OTP</span>
              <span className="text-xs opacity-90">Verify customer counter pass</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('earnings')}
          className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 text-on-surface font-bold shadow-xs hover:bg-surface-container-low transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px] text-primary">account_balance_wallet</span>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold">Earnings & Payouts</span>
              <span className="text-xs text-on-surface-variant">View weekly payout transfers</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>
      </section>

      {/* Operational Pickup Guide */}
      <section className="bg-surface-container-low p-space-md rounded-2xl border border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold shrink-0">
            <span className="material-symbols-outlined text-[22px]">timer</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-on-surface">Evening Pickup Protocol</span>
            <span className="text-xs text-on-surface-variant">
              Keep freshly packed meal bags ready at the counter 15 minutes before the pickup window begins.
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigateTab('orders')}
        >
          View Incoming Orders →
        </Button>
      </section>
    </div>
  );
};

export default PartnerDashboardPage;
