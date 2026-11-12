import React, { useState } from 'react';
import Header from '../components/common/Header';
import BottomNav from '../components/common/BottomNav';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { AuthUser } from '../services/authApi';
import AdminEditProfileModal from '../components/admin/AdminEditProfileModal';
import AdminChangePasswordModal from '../components/admin/AdminChangePasswordModal';

export interface SuperAdminLayoutProps {
  children: React.ReactNode;
  activePath?: string;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
  currentUser?: AuthUser | null;
  onUserUpdate?: (updatedUser: AuthUser) => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const SUPER_ADMIN_NAV_LINKS = [
  { path: '/app/super-admin/dashboard', label: 'Master Telemetry', icon: 'dashboard' },
  { path: '/app/super-admin/partners', label: 'Partners & KYC', icon: 'verified' },
  { path: '/app/super-admin/customers', label: 'Customers', icon: 'group' },
  { path: '/app/super-admin/orders', label: 'Orders & GMV', icon: 'receipt_long' },
  { path: '/app/super-admin/disputes', label: 'Disputes & Refunds', icon: 'gavel' },
  { path: '/app/super-admin/payouts', label: 'Settlements', icon: 'payments' },
  { path: '/app/super-admin/reports', label: 'Financial Audit', icon: 'monitoring' },
  { path: '/app/super-admin/audit-logs', label: 'Audit Logs', icon: 'history' },
  { path: '/app/super-admin/settings', label: 'System Controls', icon: 'tune' },
];

export const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({
  children,
  activePath = '/app/super-admin/dashboard',
  onNavigate,
  onLogout,
  currentUser,
  onUserUpdate,
  onShowToast,
}) => {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const handleBottomTabChange = (tabId: string) => {
    if (!onNavigate) return;
    switch (tabId) {
      case 'overview':
        onNavigate('/app/super-admin/dashboard');
        break;
      case 'vendors':
        onNavigate('/app/super-admin/partners');
        break;
      case 'listings':
        onNavigate('/app/admin/food-deals');
        break;
      case 'disputes':
        onNavigate('/app/super-admin/disputes');
        break;
      case 'payouts':
        onNavigate('/app/super-admin/payouts');
        break;
      default:
        onNavigate('/app/super-admin/dashboard');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-body text-slate-900 flex flex-col antialiased">
      {/* SuperAdmin Top Header */}
      <Header
        portal="admin"
        title="SaveBite Admin"
        subtitle="SuperAdmin Master Console"
        onLogout={onLogout}
        userName={currentUser?.fullName || 'Root SuperAdmin'}
        userEmail={currentUser?.email || 'admin@savebite.in'}
        userPhone={currentUser?.phone}
        onEditProfile={() => setIsEditProfileOpen(true)}
        onChangePassword={() => setIsChangePasswordOpen(true)}
      />

      {/* SuperAdmin Horizontal Navigation Bar */}
      <div className="fixed top-16 md:top-20 inset-x-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between overflow-x-auto py-2 no-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            {SUPER_ADMIN_NAV_LINKS.map((item) => {
              const isActive = activePath === item.path;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate(item.path);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-200 text-xs font-bold text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Root Clearance Active</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full pt-32 md:pt-36 pb-24 bg-slate-50 text-slate-900">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <ErrorBoundary fallbackTitle="SuperAdmin Section Error">
            {children}
          </ErrorBoundary>
        </div>
      </main>

      {/* Bottom Navigation for Mobile and Responsive Viewports */}
      <BottomNav
        portal="admin"
        activeTab={activePath}
        onTabChange={handleBottomTabChange}
        className="md:hidden"
      />

      {/* Profile & Password Modals */}
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

export default SuperAdminLayout;
