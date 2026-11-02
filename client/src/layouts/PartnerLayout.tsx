import React, { useState } from 'react';
import Header from '../components/common/Header';
import BottomNav from '../components/common/BottomNav';
import { AuthUser, PartnerRestaurantInfo } from '../services/authApi';
import PartnerProfileModal from '../components/partner/PartnerProfileModal';
import PartnerEmailModal from '../components/partner/PartnerEmailModal';
import PartnerPasswordModal from '../components/partner/PartnerPasswordModal';
import PartnerPhotoModal from '../components/partner/PartnerPhotoModal';

export interface PartnerLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  restaurantName?: string;
  branchName?: string;
  hygieneGrade?: string;
  currentUser?: AuthUser | null;
  partnerRestaurant?: PartnerRestaurantInfo | null;
  onUpdateUser?: (updatedUser: AuthUser) => void;
  onUpdateRestaurant?: (updatedRestaurant?: any) => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
  onLogout?: () => void;
}

export const PartnerLayout: React.FC<PartnerLayoutProps> = ({
  children,
  activeTab: controlledTab,
  onTabChange: controlledOnTabChange,
  restaurantName = 'The Daily Dough Bakery',
  branchName = 'Sandbox Outlet - Bandra West',
  currentUser,
  partnerRestaurant,
  onUpdateUser,
  onUpdateRestaurant,
  onShowToast,
  onLogout,
}) => {
  const [internalTab, setInternalTab] = useState('dashboard');
  const activeTab = controlledTab !== undefined ? controlledTab : internalTab;
  const handleTabChange = controlledOnTabChange || setInternalTab;

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  const displayName = currentUser?.fullName || 'Vikram Joshi (Master Baker)';
  const displayEmail = currentUser?.email || 'baker@savebite.in';
  const displayPhone = currentUser?.phone || '+919888811111';
  const displayAvatar = currentUser?.avatarUrl;

  const activeRestName = partnerRestaurant?.name || restaurantName;
  const activeBranch = partnerRestaurant?.branchName || branchName;

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface flex flex-col antialiased">
      {/* Partner Fixed Header */}
      <Header
        portal="partner"
        title={activeRestName}
        subtitle={activeBranch}
        userName={displayName}
        userEmail={displayEmail}
        userPhone={displayPhone}
        userAvatarUrl={displayAvatar}
        restaurantDetails={{
          name: activeRestName,
          branchName: activeBranch,
          hygieneGrade: partnerRestaurant?.hygieneGrade || 'Grade A',
          kycStatus: partnerRestaurant?.kycStatus || 'APPROVED',
        }}
        onEditProfile={() => setIsProfileModalOpen(true)}
        onChangeEmail={() => setIsEmailModalOpen(true)}
        onChangePassword={() => setIsPasswordModalOpen(true)}
        onChangePhoto={() => setIsPhotoModalOpen(true)}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full pt-16 md:pt-20 pb-24 md:pb-12 bg-surface">
        <div className="max-w-7xl mx-auto px-gutter-mobile md:px-gutter-desktop">
          {children}
        </div>
      </main>

      {/* Fixed Partner Bottom Navigation */}
      <BottomNav
        portal="partner"
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Partner Profile Modal */}
      <PartnerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser || null}
        restaurant={partnerRestaurant || null}
        onSuccess={(updatedUser, updatedRest) => {
          if (onUpdateUser) onUpdateUser(updatedUser);
          if (onUpdateRestaurant && updatedRest) onUpdateRestaurant(updatedRest);
        }}
        onShowToast={onShowToast}
      />

      {/* Partner Email Verification & Change Modal */}
      <PartnerEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        currentUser={currentUser || null}
        onSuccess={(updatedUser) => {
          if (onUpdateUser) onUpdateUser(updatedUser);
        }}
        onShowToast={onShowToast}
      />

      {/* Partner Password Change Modal */}
      <PartnerPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onShowToast={onShowToast}
      />

      {/* Partner Profile Photo Modal */}
      <PartnerPhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        currentAvatarUrl={currentUser?.avatarUrl}
        onSuccess={(newAvatarUrl) => {
          if (currentUser) {
            const updated = { ...currentUser, avatarUrl: newAvatarUrl || undefined };
            if (onUpdateUser) onUpdateUser(updated);
            localStorage.setItem('savebite_user', JSON.stringify(updated));
          }
        }}
        onShowToast={onShowToast}
      />
    </div>
  );
};

export default PartnerLayout;
