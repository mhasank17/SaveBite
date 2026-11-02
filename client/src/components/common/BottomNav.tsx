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

// 3 customer tabs per specification: Explore, Orders, Account
const CUSTOMER_TABS: NavItem[] = [
  { id: 'explore', label: 'Explore', icon: 'explore' },
  { id: 'orders', label: 'Orders', icon: 'shopping_bag', badgeColor: 'secondary' },
  { id: 'account', label: 'Account', icon: 'person' },
];

const PARTNER_TABS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'listings', label: 'Listings', icon: 'inventory_2' },
  { id: 'orders', label: 'Orders', icon: 'receipt_long' },
  { id: 'earnings', label: 'Earnings', icon: 'payments' },
  { id: 'settings', label: 'Settings', icon: 'storefront' },
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
      <div className="flex items-center justify-around sm:justify-center sm:gap-10 md:gap-16 h-16 px-4 md:px-8 max-w-7xl mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          // For customer portal: active tab gets a soft green pill background
          if (portal === 'customer') {
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                type="button"
                className={`relative flex items-center gap-1.5 transition-all active:scale-95 ${
                  isActive
                    ? 'bg-[#e8f5e9] text-[#006030] font-bold px-4 py-1.5 rounded-full shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 flex-col py-1 px-3 text-[11px]'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="relative flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-[22px]"
                    style={{
                      fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                    }}
                  >
                    {tab.icon}
                  </span>

                  {tab.badgeCount !== undefined && tab.badgeCount > 0 && !isActive && (
                    <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center bg-orange-600 text-white shadow-xs">
                      {tab.badgeCount}
                    </span>
                  )}
                </div>

                <span className={isActive ? 'text-xs' : 'text-[11px]'}>{tab.label}</span>

                {tab.badgeCount !== undefined && tab.badgeCount > 0 && isActive && (
                  <span className="ml-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center bg-orange-600 text-white shadow-xs">
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
              className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-12 transition-colors active:scale-95 ${
                isActive ? 'text-[#006030] font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-[24px]"
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

              <span className="text-[11px] leading-tight font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
