import React, { useState } from 'react';
import Header from '../components/common/Header';
import BottomNav from '../components/common/BottomNav';

export interface CustomerLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  onLocationClick?: () => void;
  ordersBadgeCount?: number;
  hideHeader?: boolean;
  onLogout?: () => void;
  userAvatarUrl?: string;
  userName?: string;
  onProfileClick?: () => void;
}

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({
  children,
  activeTab: controlledTab,
  onTabChange: controlledOnTabChange,
  title,
  subtitle,
  showBack = false,
  onBack,
  onLocationClick,
  ordersBadgeCount,
  hideHeader = false,
  onLogout,
  userAvatarUrl,
  userName,
  onProfileClick,
}) => {
  const [internalTab, setInternalTab] = useState('explore');
  const activeTab = controlledTab !== undefined ? controlledTab : internalTab;
  const handleTabChange = controlledOnTabChange || setInternalTab;

  return (
    <div className="min-h-screen bg-slate-50 font-body text-slate-900 flex flex-col antialiased">
      {/* Optional Fixed Header */}
      {!hideHeader && (
        <Header
          portal="customer"
          title={title}
          subtitle={subtitle}
          showBack={showBack}
          onBack={onBack}
          onLocationClick={onLocationClick}
          unreadNotifications={0}
          onLogout={onLogout}
          userAvatarUrl={userAvatarUrl}
          userName={userName}
          onProfileClick={onProfileClick}
        />
      )}

      {/* Main Content Area */}
      <main
        className={`flex-1 w-full pb-20 bg-slate-50 ${
          hideHeader ? 'pt-0' : 'pt-16 md:pt-20'
        }`}
      >
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* Fixed Bottom Navigation Dock */}
      <BottomNav
        portal="customer"
        activeTab={activeTab}
        onTabChange={handleTabChange}
        ordersBadgeCount={ordersBadgeCount}
      />
    </div>
  );
};

export default CustomerLayout;
