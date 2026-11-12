import React, { useState, useRef, useEffect } from 'react';
import Logo from './Logo';
import { DEFAULT_CARTOON_AVATARS } from '../../services/authApi';

export interface HeaderProps {
  portal?: 'customer' | 'partner' | 'admin';
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  unreadNotifications?: number;
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
  onLogout?: () => void;
  userAvatarUrl?: string | null;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  restaurantDetails?: {
    name?: string;
    branchName?: string;
    hygieneGrade?: string;
    kycStatus?: string;
  };
  onEditProfile?: () => void;
  onChangePassword?: () => void;
  onChangeEmail?: () => void;
  onChangePhoto?: () => void;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  portal = 'customer',
  title,
  subtitle,
  showBack = false,
  onBack,
  unreadNotifications = 0,
  onNotificationClick,
  onProfileClick,
  onLogout,
  userAvatarUrl,
  userName,
  userEmail,
  userPhone,
  restaurantDetails,
  onEditProfile,
  onChangePassword,
  onChangeEmail,
  onChangePhoto,
  className = '',
}) => {
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const [isPartnerDropdownOpen, setIsPartnerDropdownOpen] = useState(false);
  const adminDropdownRef = useRef<HTMLDivElement>(null);
  const partnerDropdownRef = useRef<HTMLDivElement>(null);

  // Close admin dropdown on outside click or Escape key
  useEffect(() => {
    if (!isAdminDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        adminDropdownRef.current &&
        !adminDropdownRef.current.contains(event.target as Node)
      ) {
        setIsAdminDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsAdminDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAdminDropdownOpen]);

  // Close partner dropdown on outside click or Escape key
  useEffect(() => {
    if (!isPartnerDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        partnerDropdownRef.current &&
        !partnerDropdownRef.current.contains(event.target as Node)
      ) {
        setIsPartnerDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPartnerDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPartnerDropdownOpen]);

  // Check if partner has an actual custom uploaded photo (not cartoon avatar or default placeholder)
  const isPartnerCartoonOrPlaceholder =
    !userAvatarUrl ||
    userAvatarUrl.includes('api.dicebear.com') ||
    userAvatarUrl.includes('DEFAULT_CARTOON') ||
    userAvatarUrl.includes('1583394838336-acd977736f90') ||
    userAvatarUrl.includes('1534528741775-53994a69daeb');
  const hasCustomPartnerPhoto = Boolean(userAvatarUrl && !isPartnerCartoonOrPlaceholder);
  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe transition-all ${className}`}
    >
      <div className="h-16 md:h-20 px-gutter-mobile md:px-gutter-desktop flex items-center justify-between gap-space-sm max-w-7xl mx-auto">
        
        {/* Left Section: Back Button / Brand / Sub-context */}
        <div className="flex items-center gap-space-xs min-w-0 flex-1">
          {showBack && (
            <button
              aria-label="Go back"
              onClick={onBack || (() => window.history.back())}
              type="button"
              className="w-10 h-10 -ml-1.5 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
          )}

          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <Logo className="h-7 md:h-8 w-auto shrink-0" />
          </div>

          {/* Context Display based on Portal */}
          <div className="flex flex-col min-w-0 pl-1">
            {portal === 'customer' && (
              <>
                <h1 className="font-title-md text-title-md text-on-surface truncate hidden sm:block">
                  {title || "Today's Food Deals"}
                </h1>
                <div className="flex items-center gap-1 text-on-surface-variant text-left">
                  <span className="material-symbols-outlined text-[15px] text-primary">
                    storefront
                  </span>
                  <span className="font-label-sm text-label-sm truncate">
                    {subtitle || 'Direct Restaurant Counter Pickup'}
                  </span>
                </div>
              </>
            )}

            {portal === 'partner' && (
              <>
                <div className="flex items-center gap-1">
                  <span className="font-title-md text-title-md text-on-surface truncate font-bold">
                    {title || 'Le Paris Bakery'}
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant shrink-0">
                    expand_more
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
                    {subtitle || 'Downtown Branch'}
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-bold uppercase tracking-wider shrink-0">
                    <span className="material-symbols-outlined text-[11px]">verified</span>
                    Grade A
                  </span>
                </div>
              </>
            )}

            {portal === 'admin' && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="font-title-md text-title-md text-on-surface font-bold tracking-tight">
                    SaveBite Admin
                  </span>
                  <span className="bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full font-label-sm text-[10px] font-bold tracking-wider">
                    SuperAdmin
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="font-label-sm text-label-sm text-on-surface-variant text-[11px]">
                    99.98% Live • Normal
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Section: Notification & User Avatar */}
        <div className="flex items-center gap-space-xs shrink-0">
          {/* Notification Button (Only displayed for Customer portal) */}
          {portal === 'customer' && (
            <button
              type="button"
              aria-label="Notifications"
              onClick={onNotificationClick}
              className="relative w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-[22px] md:text-[24px]">
                notifications
              </span>
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-secondary text-on-secondary font-label-sm text-[10px] flex items-center justify-center leading-none font-bold shadow-xs">
                  {unreadNotifications}
                </span>
              )}
            </button>
          )}

          {/* Portal-Specific Profile Section */}
          {portal === 'admin' ? (
            <div className="relative" ref={adminDropdownRef}>
              {/* Professional Circular Admin Account Icon */}
              <button
                type="button"
                aria-label={`Admin Account Profile (${userName || 'SuperAdmin'})`}
                aria-expanded={isAdminDropdownOpen}
                onClick={() => setIsAdminDropdownOpen((prev) => !prev)}
                className={`relative w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-emerald-50 text-emerald-700 border transition-all shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 select-none ${
                  isAdminDropdownOpen
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-emerald-200/90 hover:bg-emerald-100/70 hover:border-emerald-300 shadow-xs'
                }`}
                title="SuperAdmin Account & Settings"
              >
                {/* Clean user silhouette icon */}
                <span className="material-symbols-outlined text-[20px] md:text-[22px] text-emerald-700">
                  person
                </span>

                {/* Small settings indicator overlay badge */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 md:w-4 md:h-4 rounded-full bg-white text-emerald-700 border border-emerald-300/90 flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[9px] md:text-[10px] font-bold">
                    settings
                  </span>
                </span>
              </button>

              {/* Polished Admin Profile Dropdown Menu */}
              {isAdminDropdownOpen && (
                <div
                  className="absolute right-0 top-full mt-2.5 w-72 md:w-80 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2.5 px-3 z-50 animate-in fade-in zoom-in-95 origin-top-right transition-all"
                  role="menu"
                  aria-orientation="vertical"
                >
                  {/* My Profile Header Card */}
                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 shadow-xs">
                      <span className="material-symbols-outlined text-[24px]">person</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 text-sm truncate" title={userName}>
                        {userName || 'Campus SuperAdmin'}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate" title={userEmail}>
                        {userEmail || 'admin@savebite.in'}
                      </div>
                      {userPhone && (
                        <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[11px]">call</span>
                          <span>{userPhone}</span>
                        </div>
                      )}
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold tracking-wide uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          Super Admin
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">• Verified</span>
                      </div>
                    </div>
                  </div>

                  <div className="my-2 border-t border-slate-100" />

                  {/* Menu Items */}
                  <div className="space-y-1">
                    {/* Edit Profile */}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsAdminDropdownOpen(false);
                        if (onEditProfile) onEditProfile();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-800 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-emerald-100/80 text-slate-600 group-hover:text-emerald-700 flex items-center justify-center transition-colors shrink-0">
                        <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-slate-800 font-bold group-hover:text-emerald-800">
                          Edit Profile
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal">
                          Update name & contact info
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-emerald-700 transition-transform group-hover:translate-x-0.5">
                        chevron_right
                      </span>
                    </button>

                    {/* Change Password */}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsAdminDropdownOpen(false);
                        if (onChangePassword) onChangePassword();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-800 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-emerald-100/80 text-slate-600 group-hover:text-emerald-700 flex items-center justify-center transition-colors shrink-0">
                        <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-slate-800 font-bold group-hover:text-emerald-800">
                          Change Password
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal">
                          Update master admin credentials
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-emerald-700 transition-transform group-hover:translate-x-0.5">
                        chevron_right
                      </span>
                    </button>
                  </div>

                  <div className="my-2 border-t border-slate-100" />

                  {/* Sign Out */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsAdminDropdownOpen(false);
                      if (onLogout) onLogout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-red-600 hover:bg-red-50/80 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-100 transition-colors shrink-0">
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-red-700">Sign Out</div>
                      <div className="text-[11px] text-red-400 font-normal">
                        End active SuperAdmin session
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          ) : portal === 'partner' ? (
            /* Restaurant Partner Profile Section & Layout */
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="relative" ref={partnerDropdownRef}>
                {/* Professional Standard Profile Avatar (Clean Silhouette or Uploaded Photo) */}
                <button
                  type="button"
                  aria-label={`Restaurant Partner Account Profile (${userName || 'Partner'})`}
                  aria-expanded={isPartnerDropdownOpen}
                  onClick={() => setIsPartnerDropdownOpen((prev) => !prev)}
                  className={`relative w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 select-none overflow-hidden ${
                    isPartnerDropdownOpen
                      ? 'border-2 border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border border-emerald-200/90 hover:border-emerald-500 hover:shadow-xs'
                  }`}
                  title="Partner Account & Settings"
                >
                  {hasCustomPartnerPhoto ? (
                    <img
                      src={userAvatarUrl!}
                      alt={userName || 'Partner'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    /* Clean user silhouette inside circular green background */
                    <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-700 hover:bg-emerald-100/70 transition-colors">
                      <span className="material-symbols-outlined text-[20px] md:text-[22px] text-emerald-700">
                        person
                      </span>
                    </div>
                  )}
                </button>

                {/* Polished Partner Dropdown Menu */}
                {isPartnerDropdownOpen && (
                  <div
                    className="absolute right-0 top-full mt-2.5 w-72 md:w-80 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2.5 px-3 z-50 animate-in fade-in zoom-in-95 origin-top-right transition-all"
                    role="menu"
                    aria-orientation="vertical"
                  >
                    {/* My Profile Header Card */}
                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl overflow-hidden bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 shadow-xs">
                        {hasCustomPartnerPhoto ? (
                          <img
                            src={userAvatarUrl!}
                            alt={userName || 'Partner'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-[24px]">person</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 text-sm truncate" title={userName}>
                          {userName || 'Restaurant Partner'}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate" title={userEmail}>
                          {userEmail || 'baker@savebite.in'}
                        </div>
                        {userPhone && (
                          <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[11px]">call</span>
                            <span>{userPhone}</span>
                          </div>
                        )}
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold tracking-wide uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            Verified Partner
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">
                            {restaurantDetails?.name || title || 'The Daily Dough Bakery'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="my-2 border-t border-slate-100" />

                    {/* Menu Items */}
                    <div className="space-y-1">
                      {/* My Profile */}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsPartnerDropdownOpen(false);
                          if (onEditProfile) onEditProfile();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-800 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-emerald-100/80 text-slate-600 group-hover:text-emerald-700 flex items-center justify-center transition-colors shrink-0">
                          <span className="material-symbols-outlined text-[18px]">storefront</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-slate-800 font-bold group-hover:text-emerald-800">
                            My Profile
                          </div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            View details & edit contact info
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-emerald-700 transition-transform group-hover:translate-x-0.5">
                          chevron_right
                        </span>
                      </button>

                      {/* Change Profile Photo */}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsPartnerDropdownOpen(false);
                          if (onChangePhoto) onChangePhoto();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-800 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-emerald-100/80 text-slate-600 group-hover:text-emerald-700 flex items-center justify-center transition-colors shrink-0">
                          <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-slate-800 font-bold group-hover:text-emerald-800">
                            Profile Photo
                          </div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            Upload custom photo or remove
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-emerald-700 transition-transform group-hover:translate-x-0.5">
                          chevron_right
                        </span>
                      </button>

                      {/* Change Email */}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsPartnerDropdownOpen(false);
                          if (onChangeEmail) onChangeEmail();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-800 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-emerald-100/80 text-slate-600 group-hover:text-emerald-700 flex items-center justify-center transition-colors shrink-0">
                          <span className="material-symbols-outlined text-[18px]">mark_email_read</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-slate-800 font-bold group-hover:text-emerald-800">
                            Change Email
                          </div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            Verify & update email via OTP
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-emerald-700 transition-transform group-hover:translate-x-0.5">
                          chevron_right
                        </span>
                      </button>

                      {/* Change Password */}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsPartnerDropdownOpen(false);
                          if (onChangePassword) onChangePassword();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-800 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-emerald-100/80 text-slate-600 group-hover:text-emerald-700 flex items-center justify-center transition-colors shrink-0">
                          <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-slate-800 font-bold group-hover:text-emerald-800">
                            Change Password
                          </div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            Update account password
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-emerald-700 transition-transform group-hover:translate-x-0.5">
                          chevron_right
                        </span>
                      </button>
                    </div>

                    <div className="my-2 border-t border-slate-100" />

                    {/* Sign Out inside dropdown */}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsPartnerDropdownOpen(false);
                        if (onLogout) onLogout();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-red-600 hover:bg-red-50/80 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-100 transition-colors shrink-0">
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-red-700">Sign Out</div>
                        <div className="text-[11px] text-red-400 font-normal">
                          End active partner session
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Sign Out Button directly on header matching layout */}
              {onLogout && (
                <button
                  type="button"
                  aria-label="Sign out"
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 hover:text-red-700 hover:bg-red-50 text-xs font-bold transition-all ml-1 border border-transparent hover:border-red-100"
                  title="Sign Out"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Authenticated Customer: Avatar + Logout */}
              {userName || onLogout ? (
                <>
                  <button
                    type="button"
                    aria-label={`User Account (${userName || 'Customer'})`}
                    onClick={onProfileClick}
                    className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden ring-2 ring-emerald-600/20 hover:opacity-90 active:scale-95 transition-all shrink-0"
                  >
                    <img
                      src={userAvatarUrl || DEFAULT_CARTOON_AVATARS[0].url}
                      alt={userName || 'Customer'}
                      className="w-full h-full object-cover"
                    />
                  </button>

                  {onLogout && (
                    <button
                      type="button"
                      aria-label="Sign out"
                      onClick={onLogout}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-red-700 hover:bg-red-50 text-xs font-bold transition-colors ml-1"
                      title="Sign Out"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      <span className="hidden sm:inline">Sign Out</span>
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  aria-label="Customer Sign In"
                  onClick={onProfileClick}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#006030] text-white hover:bg-[#004d26] text-xs font-bold transition-all shadow-xs shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  <span>Sign In</span>
                </button>
              )}
            </>
          )}
        </div>

      </div>
    </header>
  );
};

export default Header;
