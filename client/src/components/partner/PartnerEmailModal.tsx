import React, { useState, useEffect } from 'react';
import partnerApi from '../../services/partnerApi';
import { AuthUser } from '../../services/authApi';

export interface PartnerEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onSuccess: (updatedUser: AuthUser) => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const PartnerEmailModal: React.FC<PartnerEmailModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
  onShowToast,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setNewEmail('');
      setOtp('');
      setError(null);
      setTimer(60);
      setCanResend(false);
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timer]);

  if (!isOpen) return null;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = newEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (cleanEmail === (currentUser?.email || '').toLowerCase()) {
      setError('The new email must be different from your currently registered email.');
      return;
    }

    setLoading(true);

    try {
      const res = await partnerApi.requestEmailOtp(cleanEmail);
      if (onShowToast) {
        onShowToast('info', res.message || `Verification OTP sent to ${cleanEmail}`, 'OTP Dispatched');
      }
      setStep(2);
      setTimer(60);
      setCanResend(false);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch verification code. Please try again.');
      if (onShowToast) {
        onShowToast('error', err.message || 'Failed to request OTP.', 'Email Error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    setError(null);
    setLoading(true);

    try {
      const cleanEmail = newEmail.trim().toLowerCase();
      const res = await partnerApi.requestEmailOtp(cleanEmail);
      if (onShowToast) {
        onShowToast('info', res.message || `A fresh 6-digit OTP has been sent to ${cleanEmail}`, 'New Code Sent');
      }
      setTimer(60);
      setCanResend(false);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setError('Please enter the complete 6-digit numeric verification code.');
      return;
    }

    setLoading(true);

    try {
      const cleanEmail = newEmail.trim().toLowerCase();
      const result = await partnerApi.verifyEmailOtp(cleanEmail, cleanOtp);

      // Save new token and user state to keep partner authenticated
      if (result.token) {
        localStorage.setItem('savebite_token', result.token);
      }

      const updatedUser: AuthUser = {
        ...(currentUser || {}),
        id: result.user?.id || currentUser?.id || '',
        fullName: result.user?.fullName || currentUser?.fullName || 'Partner',
        email: result.user?.email || cleanEmail,
        phone: result.user?.phone || currentUser?.phone,
        role: 'PARTNER',
        avatarUrl: result.user?.avatarUrl || currentUser?.avatarUrl,
      };

      localStorage.setItem('savebite_user', JSON.stringify(updatedUser));

      onSuccess(updatedUser);
      if (onShowToast) {
        onShowToast(
          'success',
          `Your registered login email has been updated to ${cleanEmail}. Your account, listings, and orders are fully preserved.`,
          'Email Updated'
        );
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code. Please check and try again.');
      if (onShowToast) {
        onShowToast('error', err.message || 'Verification failed.', 'OTP Error');
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
        aria-labelledby="modal-change-email-title"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[22px]">mark_email_read</span>
            </div>
            <div>
              <h2 id="modal-change-email-title" className="text-base font-bold text-slate-900">
                Change Registered Email
              </h2>
              <p className="text-xs text-slate-500">
                {step === 1 ? 'Step 1 of 2: Enter new email' : 'Step 2 of 2: Verify 6-digit code'}
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

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[18px] shrink-0 text-red-600">error</span>
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Current Registered Email
                </label>
                <div className="px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 select-none">
                  {currentUser?.email || 'baker@savebite.in'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-slate-400">
                    alternate_email
                  </span>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="partner@yourrestaurant.in"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  We will dispatch a 6-digit security OTP to verify ownership of this email address.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
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
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-900">
                <div className="font-semibold flex items-center gap-1.5 text-emerald-800">
                  <span className="material-symbols-outlined text-[18px]">mark_email_read</span>
                  Verification code dispatched
                </div>
                <div className="mt-1 text-[11px] text-emerald-700">
                  We sent a 6-digit code to <strong>{newEmail}</strong>. Please enter it below to confirm ownership.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  6-Digit OTP Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-[12px] text-xl font-bold py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
                  autoFocus
                />
                <div className="flex items-center justify-between mt-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-slate-500 hover:text-slate-700 underline"
                  >
                    Change email address
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={!canResend || loading}
                    className={`font-semibold ${
                      canResend
                        ? 'text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer'
                        : 'text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {canResend ? 'Resend code' : `Resend in ${timer}s`}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">verified_user</span>
                      Verify & Update Email
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartnerEmailModal;
