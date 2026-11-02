import React, { useState } from 'react';
import partnerApi from '../../services/partnerApi';

export interface PartnerPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const PartnerPasswordModal: React.FC<PartnerPasswordModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError('Please enter your current account password.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from your current password.');
      return;
    }

    setLoading(true);

    try {
      const result = await partnerApi.changePassword({
        currentPassword,
        newPassword,
      });

      if (onShowToast) {
        onShowToast('success', result.message || 'Your partner account password has been updated securely.', 'Password Changed');
      }
      handleClose();
    } catch (err: any) {
      const msg = err.message || 'Failed to update password. Please check your current password.';
      setError(msg);
      if (onShowToast) {
        onShowToast('error', msg, 'Password Error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-change-password-title"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[22px]">lock_reset</span>
            </div>
            <div>
              <h2 id="modal-change-password-title" className="text-base font-bold text-slate-900">
                Change Password
              </h2>
              <p className="text-xs text-slate-500">
                Update your partner dashboard access credentials
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[18px] shrink-0 text-red-600">error</span>
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Current Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Current Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full pl-3.5 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((prev) => !prev)}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5"
                aria-label={showCurrent ? 'Hide password' : 'Show password'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showCurrent ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-3.5 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNew((prev) => !prev)}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5"
                aria-label={showNew ? 'Hide password' : 'Show password'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showNew ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Must be at least 6 characters long.
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full pl-3.5 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showConfirm ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
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
                  Updating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">lock</span>
                  Update Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PartnerPasswordModal;
