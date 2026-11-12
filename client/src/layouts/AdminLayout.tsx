import React, { useState } from 'react';
import Header from '../components/common/Header';
import BottomNav from '../components/common/BottomNav';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { AuthUser } from '../services/authApi';
import AdminEditProfileModal from '../components/admin/AdminEditProfileModal';
import AdminChangePasswordModal from '../components/admin/AdminChangePasswordModal';

export interface AdminLayoutProps {
  children: React.ReactNode;
  activePath?: string;
  activeTab?: string;
  onNavigate?: (path: string) => void;
  onTabChange?: (tabId: string) => void;
  onLogout?: () => void;
  currentUser?: AuthUser | null;
  onUserUpdate?: (updatedUser: AuthUser) => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const ADMIN_NAVIGATION_ITEMS = [
  { id: 'overview', path: '/app/admin/dashboard', label: 'Overview', icon: 'dashboard' },
  { id: 'vendors', path: '/app/admin/partners', label: 'Applications & KYC', icon: 'verified' },
  { id: 'customers', path: '/app/admin/customers', label: 'Customers', icon: 'group' },
  { id: 'orders', path: '/app/admin/orders', label: 'Orders & GMV', icon: 'receipt_long' },
  { id: 'listings', path: '/app/admin/food-deals', label: 'Listings', icon: 'inventory_2' },
  { id: 'disputes', path: '/app/admin/disputes', label: 'Disputes & Refunds', icon: 'gavel' },
  { id: 'payouts', path: '/app/admin/payouts', label: 'Settlements', icon: 'payments' },
  { id: 'reports', path: '/app/admin/reports', label: 'Reports', icon: 'monitoring' },
  { id: 'audit', path: '/app/admin/audit-logs', label: 'Audit Logs', icon: 'history' },
  { id: 'settings', path: '/app/admin/settings', label: 'Settings', icon: 'settings' },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activePath = '/app/admin/dashboard',
  activeTab: controlledTab,
  onNavigate,
  onTabChange,
  onLogout,
  currentUser,
  onUserUpdate,
  onShowToast,
}) => {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Normalize current selection between path and tabId
  const currentSelection = controlledTab || activePath;

  const handleItemClick = (item: (typeof ADMIN_NAVIGATION_ITEMS)[0]) => {
    if (onNavigate) {
      onNavigate(item.path);
    } else if (onTabChange) {
      onTabChange(item.id);
    }
  };

  const handleBottomTabChange = (tabId: string) => {
    const item = ADMIN_NAVIGATION_ITEMS.find((n) => n.id === tabId);
    if (item) {
      handleItemClick(item);
    } else if (onTabChange) {
      onTabChange(tabId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-body text-slate-900 flex flex-col antialiased">
      {/* SuperAdmin Header */}
      <Header
        portal="admin"
        title="SaveBite Admin"
        subtitle="SuperAdmin Console"
        unreadNotifications={7}
        onNotificationClick={() => {
          if (onNavigate) onNavigate('/app/admin/dashboard');
          else if (onTabChange) onTabChange('overview');
        }}
        onLogout={onLogout}
        userName={currentUser?.fullName || 'Campus SuperAdmin'}
        userEmail={currentUser?.email || 'admin@savebite.in'}
        userPhone={currentUser?.phone}
        onEditProfile={() => setIsEditProfileOpen(true)}
        onChangePassword={() => setIsChangePasswordOpen(true)}
      />

      {/* Admin Horizontal Navigation Bar (Full Desktop / Tablet Governance) */}
      <div className="fixed top-16 md:top-20 inset-x-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar">
          {ADMIN_NAVIGATION_ITEMS.map((item) => {
            const isActive =
              currentSelection === item.path ||
              currentSelection === item.id ||
              (item.id === 'overview' && (currentSelection === '/app/admin' || currentSelection === '/admin')) ||
              (item.id === 'vendors' && currentSelection === '/admin/vendors') ||
              (item.id === 'listings' && currentSelection === '/admin/listings') ||
              (item.id === 'disputes' && currentSelection === '/admin/disputes') ||
              (item.id === 'payouts' && currentSelection === '/admin/payouts');

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full pt-32 md:pt-36 pb-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <ErrorBoundary fallbackTitle="Admin Section Error">
            {children}
          </ErrorBoundary>
        </div>
      </main>

      {/* Bottom Navigation for Mobile and Responsive Viewports (Matching admin_dashboard.jpg) */}
      <BottomNav
        portal="admin"
        activeTab={currentSelection}
        onTabChange={handleBottomTabChange}
        className="md:hidden"
      />

      {/* Modals for SuperAdmin Profile Management */}
      <AdminEditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        currentUser={currentUser || null}
        onSuccess={(updated) => {
          if (onUserUpdate) onUserUpdate(updated);
        }}
        onShowToast={onShowToast}
      />

      <AdminChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        onShowToast={onShowToast}
      />
    </div>
  );
};

export default AdminLayout;
