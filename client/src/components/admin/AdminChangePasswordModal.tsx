import React, { useState } from 'react';
import adminApi from '../../services/adminApi';

export interface AdminChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const AdminChangePasswordModal: React.FC<AdminChangePasswordModalProps> = ({
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

  const handleResetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
  };

  const handleClose = () => {
    handleResetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError('Please enter your current administrator password.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
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
      const result = await adminApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (onShowToast) {
        onShowToast('success', result.message || 'SuperAdmin password updated securely.', 'Password Changed');
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
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-change-password-title"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[22px]">lock_reset</span>
            </div>
            <div>
              <h2 id="modal-change-password-title" className="text-base font-bold text-slate-900">
                Change SuperAdmin Password
              </h2>
              <p className="text-xs text-slate-500">
                Apply secure cryptographic password authentication
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

        {/* Security Notice */}
        <div className="mx-6 mt-5 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-[18px] text-emerald-700 mt-0.5 shrink-0">
            shield
          </span>
          <p className="text-xs text-emerald-800 leading-relaxed font-medium">
            Your new password will be hashed and updated across all platform security gates immediately.
          </p>
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

          {/* Current Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="current-password">
              Current Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                key
              </span>
              <input
                id="current-password"
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showCurrent ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="new-password">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                lock
              </span>
              <input
                id="new-password"
                type={showNew ? 'text' : 'password'}
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowNew((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showNew ? 'Hide new password' : 'Show new password'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showNew ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Minimum 8 characters. Use uppercase, lowercase, numbers & symbols for maximum security.
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="confirm-password">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                check_circle
              </span>
              <input
                id="confirm-password"
                type={showConfirm ? 'text' : 'password'}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showConfirm ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
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
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminChangePasswordModal;
