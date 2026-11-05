import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import partnerApi from '../../services/partnerApi';

export interface VerifyOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerificationSuccess: (orderData: any) => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const VerifyOtpModal: React.FC<VerifyOtpModalProps> = ({
  isOpen,
  onClose,
  onVerificationSuccess,
  onShowToast,
}) => {
  const [mode, setMode] = useState<'otp' | 'qr'>('otp');
  const [otp, setOtp] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifiedOrder, setVerifiedOrder] = useState<any | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<{
    type: 'unauthorized' | 'duplicate' | 'expired' | 'invalid';
    title: string;
    message: string;
  } | null>(null);

  const handleVerify = async (e?: React.FormEvent, directToken?: string) => {
    if (e) e.preventDefault();
    setErrorFeedback(null);

    const tokenToVerify = directToken || (mode === 'qr' ? qrToken.trim() : otp.trim());

    if (!tokenToVerify) {
      setErrorFeedback({
        type: 'invalid',
        title: 'Empty Code',
        message: mode === 'otp' ? 'Please enter a 4-digit Pickup OTP.' : 'Please enter or scan a QR code token.',
      });
      return;
    }

    if (mode === 'otp' && tokenToVerify.length < 4) {
      setErrorFeedback({
        type: 'invalid',
        title: 'Incomplete Code',
        message: 'Pickup OTP must be exactly 4 digits.',
      });
      return;
    }

    setLoading(true);
    try {
      const payload =
        mode === 'qr' || tokenToVerify.startsWith('SAVEBITE-PASS') || tokenToVerify.length > 4
          ? { qrSecretToken: tokenToVerify }
          : { pickupOtp: tokenToVerify };

      const result = await partnerApi.verifyPickup(payload);
      setVerifiedOrder(result);
      onVerificationSuccess(result);
      onShowToast(
        'success',
        result.message || `Order ${result.orderNumber} successfully verified & collected!`,
        'Pickup Verified 🎉'
      );
    } catch (err: any) {
      const msg = err.message || 'Verification failed. Please check the code.';
      if (msg.includes('Unauthorized') || msg.includes('another restaurant')) {
        setErrorFeedback({
          type: 'unauthorized',
          title: 'Unauthorized Outlet',
          message: 'This pass belongs to another restaurant branch. You cannot verify orders for other partners.',
        });
        onShowToast('error', 'Pass belongs to another outlet.', 'Access Restricted');
      } else if (msg.includes('Duplicate') || msg.includes('already')) {
        setErrorFeedback({
          type: 'duplicate',
          title: 'Already Collected',
          message: msg,
        });
        onShowToast('error', 'Order has already been collected.', 'Duplicate Pass');
      } else if (msg.includes('Expired')) {
        setErrorFeedback({
          type: 'expired',
          title: 'Pickup Window Expired',
          message: 'This order pickup window has passed and can no longer be redeemed.',
        });
        onShowToast('error', 'Pickup window has expired.', 'Pass Expired');
      } else {
        setErrorFeedback({
          type: 'invalid',
          title: 'Invalid Code',
          message: 'No matching active reservation found for this code. Check customer pass.',
        });
        onShowToast('error', 'Invalid OTP or QR code.', 'Verification Failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setOtp('');
    setQrToken('');
    setErrorFeedback(null);
    setVerifiedOrder(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title="Counter Pickup Verification"
      subtitle="Validate customer passes via 4-digit OTP or QR code scan"
      maxWidth="md"
    >
      <div className="flex flex-col gap-4 py-1">
        {/* Verification Mode Selector */}
        {!verifiedOrder && (
          <div className="flex items-center gap-2 bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/30">
            <button
              type="button"
              onClick={() => {
                setMode('otp');
                setErrorFeedback(null);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                mode === 'otp'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">pin</span>
              <span>4-Digit OTP</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('qr');
                setErrorFeedback(null);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                mode === 'qr'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
              <span>Scan Customer QR</span>
            </button>
          </div>
        )}

        {/* Structured Error Banner */}
        {errorFeedback && !verifiedOrder && (
          <div
            className={`p-3.5 rounded-2xl border flex items-start gap-3 animate-shake ${
              errorFeedback.type === 'unauthorized'
                ? 'bg-error/10 border-error/30 text-error'
                : errorFeedback.type === 'duplicate'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                : errorFeedback.type === 'expired'
                ? 'bg-orange-500/10 border-orange-500/30 text-orange-900 dark:text-orange-200'
                : 'bg-error/10 border-error/30 text-error'
            }`}
          >
            <span className="material-symbols-outlined text-[22px] shrink-0 mt-0.5">
              {errorFeedback.type === 'unauthorized'
                ? 'gavel'
                : errorFeedback.type === 'duplicate'
                ? 'history'
                : errorFeedback.type === 'expired'
                ? 'timer_off'
                : 'error'}
            </span>
            <div className="flex flex-col text-xs">
              <span className="font-bold text-sm">{errorFeedback.title}</span>
              <span className="mt-0.5 leading-relaxed">{errorFeedback.message}</span>
            </div>
          </div>
        )}

        {/* Form View (when not yet verified) */}
        {!verifiedOrder ? (
          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            {mode === 'otp' ? (
              /* Mode 1: Manual 4-Digit OTP */
              <div className="flex flex-col items-center gap-3 py-2">
                <label htmlFor="otp-input" className="text-label-md font-bold text-on-surface">
                  Customer 4-Digit OTP
                </label>
                <input
                  id="otp-input"
                  type="text"
                  maxLength={4}
                  autoFocus
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ''));
                    setErrorFeedback(null);
                  }}
                  placeholder="• • • •"
                  className="w-48 h-16 text-center text-3xl font-extrabold tracking-widest bg-surface-container-high rounded-2xl border-2 border-outline-variant focus:border-primary focus:outline-none text-on-surface transition-all"
                />
              </div>
            ) : (
              /* Mode 2: QR Scanner */
              <div className="flex flex-col items-center gap-3">
                {/* Simulated Scanner Viewfinder */}
                <div className="relative w-full h-44 rounded-2xl bg-black/90 border-2 border-primary/40 overflow-hidden flex flex-col items-center justify-center p-4">
                  {/* Viewfinder crosshairs */}
                  <div className="w-32 h-32 border-2 border-dashed border-primary/60 rounded-xl relative flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary/40 text-[48px]">
                      qr_code
                    </span>
                    {/* Animated laser line */}
                    <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
                  </div>
                  <span className="text-[11px] text-white/80 mt-2 font-mono">
                    Point camera at customer SaveBite pass
                  </span>
                </div>

                {/* Scanned Token Input */}
                <div className="w-full flex flex-col gap-1.5">
                  <label htmlFor="qr-input" className="text-xs font-bold text-on-surface">
                    Scanned Token / Payload
                  </label>
                  <input
                    id="qr-input"
                    type="text"
                    value={qrToken}
                    onChange={(e) => {
                      setQrToken(e.target.value);
                      setErrorFeedback(null);
                    }}
                    placeholder="e.g. SAVEBITE-PASS-XXXX-VERIFIED-AUTH"
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                fullWidth
                onClick={handleReset}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={(mode === 'otp' ? otp.length < 4 : !qrToken.trim()) || loading}
              >
                {loading ? 'Verifying on Server...' : 'Verify & Handover'}
              </Button>
            </div>
          </form>
        ) : (
          /* Success Screen */
          <div className="flex flex-col items-center text-center gap-4 py-3 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-[32px] shadow-sm animate-bounce">
              <span className="material-symbols-outlined text-[36px]">check_circle</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-title-lg font-bold text-on-surface">
                {verifiedOrder.orderNumber} Verified!
              </span>
              <span className="text-body-sm text-on-surface-variant">
                Customer: <strong className="text-on-surface">{verifiedOrder.customerName}</strong>
              </span>
              {verifiedOrder.dealTitle && (
                <span className="text-xs text-primary font-bold bg-primary/10 px-2.5 py-1 rounded-full inline-block mt-1">
                  {verifiedOrder.dealTitle} (x{verifiedOrder.quantity})
                </span>
              )}
            </div>

            <div className="w-full bg-surface-container-low p-3.5 rounded-2xl border border-outline-variant/30 text-xs flex justify-between items-center">
              <span className="text-on-surface-variant">Collection Time:</span>
              <span className="font-bold text-on-surface font-mono">
                {new Date(verifiedOrder.completedAt || Date.now()).toLocaleTimeString()}
              </span>
            </div>

            <Button
              variant="primary"
              fullWidth
              onClick={handleReset}
            >
              Order Handed Over • Next Customer
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default VerifyOtpModal;
