import React from 'react';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  badgeCount?: number;
  badgeColor?: 'secondary' | 'primary' | 'error';
}

export interface BottomNavProps {
  portal?: 'customer' | 'partner' | 'admin';
  activeTab: string;
  onTabChange: (tabId: string) => void;
  ordersBadgeCount?: number;
  className?: string;
}

// 5 customer tabs matching the requested URL routes:
// /app/customer/dashboard, /app/customer/food-deals, /app/customer/orders, /app/customer/notifications, /app/customer/profile
const CUSTOMER_TABS: NavItem[] = [
  { id: 'dashboard', label: 'Home', icon: 'space_dashboard' },
  { id: 'food-deals', label: 'Deals', icon: 'lunch_dining' },
  { id: 'orders', label: 'Orders', icon: 'shopping_bag', badgeColor: 'secondary' },
  { id: 'notifications', label: 'Alerts', icon: 'notifications' },
  { id: 'profile', label: 'Profile', icon: 'person' },
];

const PARTNER_TABS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'listings', label: 'Listings', icon: 'inventory_2' },
  { id: 'orders', label: 'Orders', icon: 'receipt_long' },
  { id: 'earnings', label: 'Earnings', icon: 'payments' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

const ADMIN_TABS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'vendors', label: 'Vendors', icon: 'storefront', badgeCount: 5, badgeColor: 'secondary' },
  { id: 'listings', label: 'Listings', icon: 'inventory_2' },
  { id: 'disputes', label: 'Disputes', icon: 'gavel', badgeCount: 3, badgeColor: 'error' },
  { id: 'payouts', label: 'Payouts', icon: 'account_balance_wallet' },
];

export const BottomNav: React.FC<BottomNavProps> = ({
  portal = 'customer',
  activeTab,
  onTabChange,
  ordersBadgeCount,
  className = '',
}) => {
  // Normalize activeTab for backward and cross-route compatibility
  const normalizedActiveTab =
    portal === 'admin'
      ? activeTab === 'dashboard' || activeTab === '/app/admin/dashboard' || activeTab === '/app/super-admin/dashboard'
        ? 'overview'
        : activeTab === 'partners' || activeTab === '/app/admin/partners' || activeTab === '/app/super-admin/partners'
        ? 'vendors'
        : activeTab === 'food-deals' || activeTab === '/app/admin/food-deals'
        ? 'listings'
        : activeTab === 'disputes' || activeTab === '/app/admin/disputes' || activeTab === '/app/super-admin/disputes'
        ? 'disputes'
        : activeTab === 'payouts' || activeTab === '/app/admin/payouts' || activeTab === '/app/super-admin/payouts'
        ? 'payouts'
        : activeTab
      : activeTab === 'explore'
      ? 'food-deals'
      : activeTab === 'account'
      ? 'profile'
      : activeTab;

  const customerTabsWithCount = CUSTOMER_TABS.map((tab) =>
    tab.id === 'orders' && ordersBadgeCount !== undefined
      ? { ...tab, badgeCount: ordersBadgeCount }
      : tab
  );

  const tabs =
    portal === 'partner'
      ? PARTNER_TABS
      : portal === 'admin'
      ? ADMIN_TABS
      : customerTabsWithCount;

  return (
    <nav
      className={`fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md shadow-[0_-2px_12px_rgba(0,0,0,0.06)] border-t border-slate-100 pb-safe transition-all ${className}`}
      aria-label="Bottom Navigation"
    >
      <div className="flex items-center justify-around sm:justify-center sm:gap-6 md:gap-10 h-16 px-2 md:px-8 max-w-7xl mx-auto">
        {tabs.map((tab) => {
          const isActive = normalizedActiveTab === tab.id;

          // For customer portal: active tab gets a soft green pill background
          if (portal === 'customer') {
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                type="button"
                className={`relative flex items-center gap-1 transition-all active:scale-95 ${
                  isActive
                    ? 'bg-[#e8f5e9] text-[#006030] font-bold px-3 py-1.5 rounded-full shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 flex-col py-1 px-2 text-[10px] sm:text-[11px]'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="relative flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-[20px] sm:text-[22px]"
                    style={{
                      fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                    }}
                  >
                    {tab.icon}
                  </span>

                  {tab.badgeCount !== undefined && tab.badgeCount > 0 && !isActive && (
                    <span className="absolute -top-1 -right-2 min-w-[15px] h-3.5 px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center bg-orange-600 text-white shadow-xs">
                      {tab.badgeCount}
                    </span>
                  )}
                </div>

                <span className={isActive ? 'text-[11px] sm:text-xs' : 'text-[10px] sm:text-[11px]'}>
                  {tab.label}
                </span>

                {tab.badgeCount !== undefined && tab.badgeCount > 0 && isActive && (
                  <span className="ml-0.5 min-w-[15px] h-3.5 px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center bg-orange-600 text-white shadow-xs">
                    {tab.badgeCount}
                  </span>
                )}
              </button>
            );
          }

          // Partner and Admin tab rendering
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              type="button"
              className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[50px] sm:min-w-[56px] h-12 transition-colors active:scale-95 ${
                isActive ? 'text-[#006030] font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-[22px] sm:text-[24px]"
                  style={{
                    fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  {tab.icon}
                </span>

                {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center bg-orange-600 text-white shadow-xs">
                    {tab.badgeCount}
                  </span>
                )}
              </div>

              <span className="text-[10px] sm:text-[11px] leading-tight font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
