import React from 'react';
import Button from '../../components/common/Button';
import { MOCK_COMMUNITY_STATS } from '../../data/mockDeals';
import { formatINR } from '../../utils/formatters';
import { AuthUser, DEFAULT_CARTOON_AVATARS } from '../../services/authApi';

export interface AccountPageProps {
  currentUser?: AuthUser | null;
  user?: AuthUser | null;
  onLogout?: () => void;
  onNavigateToLogin?: () => void;
  onOpenAvatarSelector?: () => void;
  onOpenLocationPicker?: () => void;
  currentLocationName?: string;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({
  currentUser,
  user: userProp,
  onLogout,
  onNavigateToLogin,
  onOpenAvatarSelector,
  onOpenLocationPicker,
  currentLocationName = 'North Campus, Hostels',
}) => {
  const user = currentUser ?? userProp;
  // If no authenticated user, prompt to sign in
  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-50 text-[#006030] flex items-center justify-center mb-4 shadow-sm">
          <span className="material-symbols-outlined text-[36px]">account_circle</span>
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Sign in to SaveBite</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          Sign in to your customer account to view your past orders, manage your profile, and save meals from local restaurants.
        </p>
        <Button
          variant="primary"
          size="md"
          onClick={onNavigateToLogin}
          className="mt-6 w-full max-w-xs"
        >
          Sign In / Register
        </Button>
      </div>
    );
  }

  const avatar = user.avatarUrl || DEFAULT_CARTOON_AVATARS[0].url;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Profile Card */}
      <section className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="relative group shrink-0">
          <img
            src={avatar}
            alt={user.fullName}
            className="w-24 h-24 rounded-full object-cover border-4 border-emerald-100 shadow-sm"
          />
          <button
            type="button"
            onClick={onOpenAvatarSelector}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#006030] text-white flex items-center justify-center shadow-md hover:bg-emerald-800 transition-transform active:scale-90"
            title="Change Cartoon Avatar"
            aria-label="Change Cartoon Avatar"
          >
            <span className="material-symbols-outlined text-[16px]">photo_camera</span>
          </button>
        </div>

        <div className="flex flex-col items-center sm:items-start text-center sm:text-left flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 truncate">{user.fullName}</h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
              <span className="material-symbols-outlined text-[12px]">verified</span>
              <span>Member</span>
            </span>
          </div>

          <p className="text-xs text-slate-500 font-mono mt-0.5 truncate max-w-xs">
            {user.email}
          </p>
          {user.phone && (
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {user.phone}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onOpenAvatarSelector}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#006030] hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">face</span>
              <span>Change Cartoon Avatar</span>
            </button>
          </div>
        </div>
      </section>

      {/* Impact & Sustainability Card */}
      <section className="bg-gradient-to-br from-[#006030] to-emerald-900 text-white rounded-3xl p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-300 text-[22px]">eco</span>
            <h3 className="font-bold text-sm tracking-wide uppercase text-emerald-100">
              Your Food Rescue Impact
            </h3>
          </div>
          <span className="text-[11px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full text-white">
            Campus Champion
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-1">
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 flex flex-col items-center text-center">
            <span className="text-xl font-bold text-white">
              {MOCK_COMMUNITY_STATS.mealsSavedUser}
            </span>
            <span className="text-[11px] text-emerald-200 mt-0.5">Meals Rescued</span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 flex flex-col items-center text-center">
            <span className="text-xl font-bold text-white">
              {MOCK_COMMUNITY_STATS.co2ePreventedUserKg} kg
            </span>
            <span className="text-[11px] text-emerald-200 mt-0.5">CO₂e Prevented</span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 flex flex-col items-center text-center">
            <span className="text-xl font-bold text-white">
              {formatINR(MOCK_COMMUNITY_STATS.moneySavedUserInr)}
            </span>
            <span className="text-[11px] text-emerald-200 mt-0.5">Money Saved</span>
          </div>
        </div>
      </section>

      {/* Account Settings & Preferences */}
      <section className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
          Pickup Preferences
        </h3>

        <button
          type="button"
          onClick={onOpenLocationPicker}
          className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#006030] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">pin_drop</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900">Preferred Pickup Area</span>
              <span className="text-xs text-slate-500">{currentLocationName}</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400 text-[20px]">
            chevron_right
          </span>
        </button>

        <div className="h-px bg-slate-100 my-1" />

        <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100 text-xs text-emerald-950 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-[#006030] text-[20px] shrink-0 mt-0.5">
            storefront
          </span>
          <div>
            <strong>Counter Pickup:</strong> SaveBite exclusively supports direct counter pickup. Pick up your meal hot and fresh from partner restaurants by showing your 4-digit OTP or digital QR pass.
          </div>
        </div>

        {/* Sign Out Button */}
        {onLogout && (
          <div className="pt-3">
            <button
              type="button"
              onClick={onLogout}
              className="w-full py-3 px-4 rounded-2xl border border-red-100 bg-red-50/60 hover:bg-red-100 text-red-700 font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>Sign Out of Customer Account</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default AccountPage;
