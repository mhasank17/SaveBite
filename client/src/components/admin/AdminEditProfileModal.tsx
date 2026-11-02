import React, { useState, useEffect } from 'react';
import adminApi from '../../services/adminApi';
import { AuthUser } from '../../services/authApi';

export interface AdminEditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onSuccess: (updatedUser: AuthUser) => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const AdminEditProfileModal: React.FC<AdminEditProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
  onShowToast,
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      setFullName(currentUser.fullName || '');
      setPhone(currentUser.phone || '');
      setError(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = fullName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setError('Admin name must be at least 2 characters long.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updatedUser = await adminApi.updateProfile({
        fullName: trimmedName,
        phone: phone.trim() || undefined,
      });

      onSuccess(updatedUser);
      if (onShowToast) {
        onShowToast('success', 'Admin profile successfully updated and saved to database.', 'Profile Saved');
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
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-edit-profile-title"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[22px]">manage_accounts</span>
            </div>
            <div>
              <h2 id="modal-edit-profile-title" className="text-base font-bold text-slate-900">
                Edit Admin Profile
              </h2>
              <p className="text-xs text-slate-500">
                Update administrative identity & contact information
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-red-600 shrink-0 mt-0.5">
                error
              </span>
              <span className="flex-1 font-medium">{error}</span>
            </div>
          )}

          {/* Account Role & Badge */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Access Tier</div>
                <div className="text-[11px] text-slate-500">Full System & Governance Permissions</div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200/60">
              Super Admin
            </span>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="admin-full-name">
              Admin Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                person
              </span>
              <input
                id="admin-full-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter administrator full name"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Registered Email (Immutable for security) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700" htmlFor="admin-email">
                Registered Email
              </label>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">lock</span>
                Protected
              </span>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                mail
              </span>
              <input
                id="admin-email"
                type="email"
                disabled
                value={currentUser?.email || 'admin@savebite.in'}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50 text-sm font-medium text-slate-500 cursor-not-allowed select-none"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Registered email address cannot be modified to preserve cryptographic audit integrity.
            </p>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="admin-phone">
              Phone Number
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                call
              </span>
              <input
                id="admin-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 99999 00000"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow transition-all flex items-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminEditProfileModal;
