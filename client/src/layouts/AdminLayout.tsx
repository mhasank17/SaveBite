import React, { useState } from 'react';
import Header from '../components/common/Header';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { AuthUser } from '../services/authApi';
import AdminEditProfileModal from '../components/admin/AdminEditProfileModal';
import AdminChangePasswordModal from '../components/admin/AdminChangePasswordModal';

export interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onLogout?: () => void;
  currentUser?: AuthUser | null;
  onUserUpdate?: (updatedUser: AuthUser) => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

const ADMIN_NAVIGATION_ITEMS = [
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'vendors', label: 'Applications & KYC', icon: 'verified' },
  { id: 'customers', label: 'Customers', icon: 'group' },
  { id: 'orders', label: 'Orders & GMV', icon: 'receipt_long' },
  { id: 'listings', label: 'Listings', icon: 'inventory_2' },
  { id: 'disputes', label: 'Disputes & Refunds', icon: 'gavel' },
  { id: 'payouts', label: 'Settlements', icon: 'payments' },
  { id: 'audit', label: 'Audit Logs', icon: 'history' },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeTab: controlledTab,
  onTabChange: controlledOnTabChange,
  onLogout,
  currentUser,
  onUserUpdate,
  onShowToast,
}) => {
  const [internalTab, setInternalTab] = useState('overview');
  const activeTab = controlledTab !== undefined ? controlledTab : internalTab;
  const handleTabChange = controlledOnTabChange || setInternalTab;

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 font-body text-slate-900 flex flex-col antialiased">
      {/* SuperAdmin Header */}
      <Header
        portal="admin"
        title="SaveBite Admin"
        subtitle="SuperAdmin Console"
        unreadNotifications={0}
        onLogout={onLogout}
        userName={currentUser?.fullName || 'Campus SuperAdmin'}
        userEmail={currentUser?.email || 'admin@savebite.in'}
        userPhone={currentUser?.phone}
        onEditProfile={() => setIsEditProfileOpen(true)}
        onChangePassword={() => setIsChangePasswordOpen(true)}
      />

      {/* Admin Horizontal Navigation Bar */}
      <div className="fixed top-16 md:top-20 inset-x-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto py-2 no-scrollbar">
          {ADMIN_NAVIGATION_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabChange(item.id)}
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
      <main className="flex-1 w-full pt-32 md:pt-36 pb-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <ErrorBoundary fallbackTitle="Admin Section Error">
            {children}
          </ErrorBoundary>
        </div>
      </main>

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
