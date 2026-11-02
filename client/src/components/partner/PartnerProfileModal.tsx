import React, { useState, useEffect } from 'react';
import partnerApi from '../../services/partnerApi';
import { AuthUser, PartnerRestaurantInfo } from '../../services/authApi';

export interface PartnerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  restaurant: PartnerRestaurantInfo | null;
  onSuccess: (updatedUser: AuthUser, updatedRestaurant?: any) => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const PartnerProfileModal: React.FC<PartnerProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  restaurant,
  onSuccess,
  onShowToast,
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [branchName, setBranchName] = useState('');
  const [address, setAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFullName(currentUser?.fullName || '');
      setPhone(currentUser?.phone || '');
      setBranchName(restaurant?.branchName || '');
      setAddress(restaurant?.address || '');
      setError(null);
    }
  }, [isOpen, currentUser, restaurant]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = fullName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setError('Partner name must be at least 2 characters long.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await partnerApi.updateProfile({
        fullName: trimmedName,
        phone: phone.trim() || undefined,
        branchName: branchName.trim() || undefined,
        address: address.trim() || undefined,
      });

      const updatedUser: AuthUser = {
        ...(currentUser || {}),
        id: result.user?.id || currentUser?.id || '',
        fullName: result.user?.fullName || trimmedName,
        email: result.user?.email || currentUser?.email || '',
        phone: result.user?.phone || phone.trim(),
        role: 'PARTNER',
        avatarUrl: result.user?.avatarUrl || currentUser?.avatarUrl,
      };

      onSuccess(updatedUser, result.restaurant);
      if (onShowToast) {
        onShowToast('success', 'Your partner profile information has been saved successfully.', 'Profile Updated');
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile. Please try again.');
      if (onShowToast) {
        onShowToast('error', err.message || 'Failed to update profile.', 'Update Error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-partner-profile-title"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[22px]">storefront</span>
            </div>
            <div>
              <h2 id="modal-partner-profile-title" className="text-base font-bold text-slate-900">
                Restaurant Partner Profile
              </h2>
              <p className="text-xs text-slate-500">
                View verified details & update permitted contact information
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[18px] shrink-0 text-red-600">error</span>
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Partner Personal Details */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Partner Identity & Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-slate-400">
                    badge
                  </span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Vikram Joshi"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-slate-400">
                    call
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98888 11111"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="mt-3.5">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registered Login Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-slate-400">
                  mail
                </span>
                <input
                  type="email"
                  disabled
                  value={currentUser?.email || 'baker@savebite.in'}
                  className="w-full pl-9 pr-24 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 cursor-not-allowed select-none"
                />
                <span className="absolute right-2.5 top-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                  Active Login
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-emerald-600">info</span>
                To change your registered email, please select <strong>Change Email</strong> from the profile dropdown.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 my-4" />

          {/* Restaurant Details */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Restaurant Outlet Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Restaurant Name
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-slate-400">
                    restaurant
                  </span>
                  <input
                    type="text"
                    disabled
                    value={restaurant?.name || 'The Daily Dough Bakery'}
                    className="w-full pl-9 pr-3 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-not-allowed select-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Branch / Outlet Name
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-slate-400">
                    location_city
                  </span>
                  <input
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="e.g. North Gate Campus Plaza"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="mt-3.5">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Outlet Physical Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-slate-400">
                  pin_drop
                </span>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Shop 14, University Road, Outside Main Gate"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* FSSAI and Verification Badges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">FSSAI License</div>
                  <div className="text-xs font-bold text-slate-800 font-mono mt-0.5">
                    {restaurant?.licenseNumber || 'DEMO-FSSAI-00000000000001'}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  <span className="material-symbols-outlined text-[12px]">verified</span>
                  Valid
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">KYC Status</div>
                  <div className="text-xs font-bold text-emerald-700 capitalize mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    {restaurant?.kycStatus || 'APPROVED'}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-bold">
                  Grade A
                </span>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PartnerProfileModal;
