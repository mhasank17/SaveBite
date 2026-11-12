import React, { useState, useEffect, useRef, useCallback } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import partnerApi from '../../services/partnerApi';
import jsQR from 'jsqr';

export interface VerifyOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerificationSuccess: (orderData: any) => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
  initialCode?: string;
}

function playBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // Audio synthesis fallback
  }
}

export const VerifyOtpModal: React.FC<VerifyOtpModalProps> = ({
  isOpen,
  onClose,
  onVerificationSuccess,
  onShowToast,
  initialCode,
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

  useEffect(() => {
    if (isOpen && initialCode) {
      if (/^\d{4}$/.test(initialCode)) {
        setMode('otp');
        setOtp(initialCode);
      } else {
        setMode('qr');
        setQrToken(initialCode);
      }
    }
  }, [isOpen, initialCode]);

  // QR Camera State
  const [cameraStatus, setCameraStatus] = useState<
    'idle' | 'requesting' | 'active' | 'denied' | 'unavailable' | 'error'
  >('idle');
  const [cameraErrorMsg, setCameraErrorMsg] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
      animFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraStatus('idle');
  }, []);

  // Verification Handler
  const handleVerify = useCallback(
    async (e?: React.FormEvent, directToken?: string) => {
      if (e) e.preventDefault();
      setErrorFeedback(null);

      const tokenToVerify = directToken || (mode === 'qr' ? qrToken.trim() : otp.trim());

      if (!tokenToVerify) {
        setErrorFeedback({
          type: 'invalid',
          title: 'Empty Code',
          message:
            mode === 'otp'
              ? 'Please enter a 4-digit Pickup OTP.'
              : 'Please enter or scan a QR code token.',
        });
        return;
      }

      if (mode === 'otp' && tokenToVerify.length < 4 && !directToken) {
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
          mode === 'qr' ||
          tokenToVerify.startsWith('SAVEBITE-PASS') ||
          tokenToVerify.length > 4 ||
          tokenToVerify.startsWith('#')
            ? { qrSecretToken: tokenToVerify }
            : { pickupOtp: tokenToVerify };

        const result = await partnerApi.verifyPickup(payload);
        setVerifiedOrder(result);
        stopCamera();
        onVerificationSuccess(result);
        if (result.alreadyVerified || result.alreadyCompleted) {
          onShowToast(
            'info',
            result.message || `Order ${result.orderNumber} is already collected & verified.`,
            'Already Collected'
          );
        } else {
          onShowToast(
            'success',
            result.message || `Order ${result.orderNumber} successfully verified & collected!`,
            'Pickup Verified 🎉'
          );
        }
      } catch (err: any) {
        const msg = err.message || 'Verification failed. Please check the code.';
        if (msg.includes('Unauthorized') || msg.includes('another restaurant')) {
          setErrorFeedback({
            type: 'unauthorized',
            title: 'Unauthorized Outlet',
            message:
              'This pass belongs to another restaurant branch. You cannot verify orders for other partners.',
          });
          onShowToast('error', 'Pass belongs to another outlet.', 'Access Restricted');
        } else if (msg.includes('Duplicate') || msg.includes('already')) {
          setErrorFeedback({
            type: 'duplicate',
            title: 'Already Collected',
            message: msg,
          });
          onShowToast('info', 'Order has already been collected & verified.', 'Already Collected');
          onVerificationSuccess({
            orderNumber: tokenToVerify.startsWith('#') ? tokenToVerify : `#${tokenToVerify}`,
            alreadyVerified: true,
            alreadyCompleted: true,
          });
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
    },
    [mode, qrToken, otp, stopCamera, onVerificationSuccess, onShowToast]
  );

  // Initialize camera stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraStatus('requesting');
    setCameraErrorMsg(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus('unavailable');
      setCameraErrorMsg(
        'Camera API is not supported on this browser context or insecure HTTP connection.'
      );
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      } catch {
        // enumeration is optional
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }

      setCameraStatus('active');
    } catch (err: any) {
      console.warn('[VerifyOtpModal] Camera error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraStatus('denied');
        setCameraErrorMsg(
          'Camera access was denied. Please allow camera permissions in site settings or upload a QR image.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraStatus('unavailable');
        setCameraErrorMsg('No camera hardware found on this device.');
      } else {
        setCameraStatus('error');
        setCameraErrorMsg(err.message || 'Unable to access camera feed.');
      }
    }
  }, [facingMode, stopCamera]);

  // Start / stop camera based on modal open state and mode
  useEffect(() => {
    if (isOpen && mode === 'qr' && !verifiedOrder) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, mode, verifiedOrder, startCamera, stopCamera]);

  // Real-time camera frame scanner loop
  useEffect(() => {
    if (mode !== 'qr' || cameraStatus !== 'active' || verifiedOrder || loading) {
      return;
    }

    let isScanning = true;

    const scanFrame = () => {
      if (!isScanning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && video.readyState >= 2 && canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (qrCode && qrCode.data && qrCode.data.trim()) {
            const scannedToken = qrCode.data.trim();
            isScanning = false;
            playBeep();
            if (navigator.vibrate) navigator.vibrate(100);
            setQrToken(scannedToken);
            stopCamera();
            handleVerify(undefined, scannedToken);
            return;
          }
        }
      }

      animFrameId.current = requestAnimationFrame(scanFrame);
    };

    animFrameId.current = requestAnimationFrame(scanFrame);

    return () => {
      isScanning = false;
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
        animFrameId.current = null;
      }
    };
  }, [mode, cameraStatus, verifiedOrder, loading, stopCamera, handleVerify]);

  // Handle image file upload fallback for QR decoding
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);
        if (code && code.data && code.data.trim()) {
          playBeep();
          if (navigator.vibrate) navigator.vibrate(100);
          const scanned = code.data.trim();
          setQrToken(scanned);
          handleVerify(undefined, scanned);
        } else {
          setErrorFeedback({
            type: 'invalid',
            title: 'No QR Code Detected',
            message:
              'Could not locate a valid SaveBite QR code in the uploaded image. Please try another photo or enter the code manually.',
          });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleReset = () => {
    stopCamera();
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
      subtitle="Validate customer passes via 4-digit OTP or camera QR scan"
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
                stopCamera();
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
                  inputMode="numeric"
                  maxLength={4}
                  autoFocus
                  value={otp}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '');
                    setOtp(cleaned);
                    setErrorFeedback(null);
                    if (cleaned.length === 4) {
                      handleVerify(undefined, cleaned);
                    }
                  }}
                  placeholder="• • • •"
                  className="w-48 h-16 text-center text-3xl font-extrabold tracking-widest bg-surface-container-high rounded-2xl border-2 border-outline-variant focus:border-primary focus:outline-none text-on-surface transition-all"
                />
                <span className="text-xs text-on-surface-variant text-center">
                  Enter customer's 4-digit single-use pickup PIN
                </span>
              </div>
            ) : (
              /* Mode 2: Real Camera QR Scanner */
              <div className="flex flex-col items-center gap-3">
                {/* Camera Viewfinder */}
                <div className="relative w-full h-56 rounded-2xl bg-black border-2 border-primary/40 overflow-hidden flex flex-col items-center justify-center">
                  {cameraStatus === 'active' && (
                    <video
                      ref={videoRef}
                      className="absolute inset-0 w-full h-full object-cover"
                      playsInline
                      muted
                      autoPlay
                    />
                  )}

                  {/* Hidden Canvas for QR frame extraction */}
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Visual Scanning Reticle Overlay */}
                  {cameraStatus === 'active' && (
                    <div className="relative z-10 w-44 h-44 border-2 border-primary rounded-2xl flex items-center justify-center pointer-events-none shadow-2xl">
                      {/* Corner Accents */}
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary -mt-1 -ml-1 rounded-tl" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary -mt-1 -mr-1 rounded-tr" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary -mb-1 -ml-1 rounded-bl" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary -mb-1 -mr-1 rounded-br" />

                      {/* Animated Laser Scanning Line */}
                      <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse shadow-glow" />
                    </div>
                  )}

                  {/* Camera Requesting Status */}
                  {cameraStatus === 'requesting' && (
                    <div className="flex flex-col items-center gap-2 text-white/80 z-10 p-4 text-center">
                      <span className="material-symbols-outlined text-[36px] animate-spin text-primary">
                        progress_activity
                      </span>
                      <span className="text-xs font-medium">Requesting camera permissions...</span>
                    </div>
                  )}

                  {/* Camera Permission Denied / Error State */}
                  {(cameraStatus === 'denied' ||
                    cameraStatus === 'unavailable' ||
                    cameraStatus === 'error') && (
                    <div className="flex flex-col items-center gap-2 text-white/90 z-10 p-4 text-center">
                      <span className="material-symbols-outlined text-[36px] text-amber-400">
                        videocam_off
                      </span>
                      <span className="text-xs font-bold text-amber-200">Camera Unavailable</span>
                      <p className="text-[11px] text-white/70 max-w-xs">{cameraErrorMsg}</p>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="mt-1 px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary/90"
                      >
                        Try Again
                      </button>
                    </div>
                  )}

                  {/* Camera Controls Bar */}
                  {cameraStatus === 'active' && hasMultipleCameras && (
                    <button
                      type="button"
                      onClick={toggleCameraFacing}
                      className="absolute top-2 right-2 z-20 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all"
                      title="Flip camera"
                    >
                      <span className="material-symbols-outlined text-[18px]">cameraswitch</span>
                    </button>
                  )}
                </div>

                {/* File Upload Fallback & Manual Entry */}
                <div className="w-full flex items-center justify-between gap-2 pt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => fileInputRef.current?.click()}
                    leftIcon={
                      <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
                    }
                  >
                    Upload QR Photo
                  </Button>
                </div>

                {/* Scanned Token Manual Override */}
                <div className="w-full flex flex-col gap-1.5 mt-1">
                  <label htmlFor="qr-input" className="text-xs font-bold text-on-surface">
                    QR Token / Order ID
                  </label>
                  <input
                    id="qr-input"
                    type="text"
                    value={qrToken}
                    onChange={(e) => {
                      setQrToken(e.target.value);
                      setErrorFeedback(null);
                    }}
                    placeholder="e.g. SAVEBITE-PASS-XXXX-VERIFIED or #8492"
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button variant="outline" fullWidth onClick={handleReset} disabled={loading}>
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
              onClick={() => {
                setVerifiedOrder(null);
                setOtp('');
                setQrToken('');
                setErrorFeedback(null);
                if (mode === 'qr') {
                  startCamera();
                }
              }}
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
