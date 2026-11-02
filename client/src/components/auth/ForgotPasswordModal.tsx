import React, { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import authApi from '../../services/authApi';

export interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  initialToken?: string;
  onSuccess?: () => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose, initialEmail = '', onSuccess, onShowToast }) => {
  const [step, setStep] = useState<'request' | 'verify' | 'password' | 'done'>('request');
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setStep('request'); setEmail(initialEmail); setOtp(''); setResetToken(''); setPassword(''); setConfirmPassword(''); setError(''); setSeconds(0);
  }, [isOpen, initialEmail]);
  useEffect(() => {
    if (step !== 'verify' || seconds <= 0) return;
    const timer = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [step, seconds]);

  const requestCode = async () => {
    setLoading(true); setError('');
    try {
      await authApi.forgotPassword(email.trim());
      setStep('verify'); setSeconds(60); setOtp('');
      onShowToast?.('info', 'If an account is associated with this address, a verification code has been sent.', 'Check Your Email');
    } catch (e: any) { setError(e.message || 'Unable to send a verification code. Check your email configuration and try again.'); }
    finally { setLoading(false); }
  };

  const verifyCode = async () => {
    if (!/^\d{6}$/.test(otp)) { setError('Enter the 6-digit code from your email.'); return; }
    setLoading(true); setError('');
    try { setResetToken(await authApi.verifyPasswordOtp(email.trim(), otp)); setStep('password'); }
    catch (e: any) { setError(e.message || 'That code is invalid or expired.'); }
    finally { setLoading(false); }
  };

  const savePassword = async () => {
    if (password.length < 8) { setError('Password must be at least 8 characters long.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try { const msg = await authApi.resetPassword(resetToken, password); setStep('done'); onShowToast?.('success', msg, 'Password Updated'); onSuccess?.(); }
    catch (e: any) { setError(e.message || 'Unable to update password. Request a new code and try again.'); }
    finally { setLoading(false); }
  };

  const title = step === 'request' ? 'Forgot Password?' : step === 'verify' ? 'Verify Your Email' : step === 'password' ? 'Set New Password' : 'Password Updated';
  const submit = step === 'request' ? requestCode : step === 'verify' ? verifyCode : savePassword;
  return <Modal isOpen={isOpen} onClose={onClose} title={title} subtitle={step === 'request' ? 'Enter your account email and we’ll send a 6-digit verification code.' : step === 'verify' ? `Enter the code sent to ${email}. It expires in 5 minutes.` : step === 'password' ? 'Choose a new password for your account.' : 'You can now sign in with your new password.'} variant="center" footer={<div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={onClose}>{step === 'done' ? 'Close' : 'Cancel'}</Button>{step !== 'done' && <Button variant="primary" size="sm" disabled={loading} onClick={submit}>{loading ? 'Please wait…' : step === 'request' ? 'Send Code' : step === 'verify' ? 'Verify Code' : 'Update Password'}</Button>}</div>}>
    <div className="flex flex-col gap-4 text-left">
      {error && <div role="alert" className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-700">{error}</div>}
      {step === 'request' && <label className="flex flex-col gap-1 text-xs font-bold text-slate-700">Account Email Address<input autoFocus type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-normal" placeholder="you@example.com" required /></label>}
      {step === 'verify' && <><label className="flex flex-col gap-1 text-xs font-bold text-slate-700">6-digit code<input autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} className="w-full h-12 px-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-2xl tracking-[0.5em] font-mono" placeholder="000000" /></label><div className="flex justify-between items-center text-xs text-slate-600"><span>{seconds > 0 ? `Resend available in ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : 'Didn’t receive a code?'}</span><button disabled={seconds > 0 || loading} onClick={requestCode} className="font-bold text-[#006030] disabled:text-slate-400">Resend code</button></div></>}
      {step === 'password' && <><label className="flex flex-col gap-1 text-xs font-bold text-slate-700">New password (at least 8 characters)<input type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200" minLength={8} /></label><label className="flex flex-col gap-1 text-xs font-bold text-slate-700">Confirm new password<input type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200" minLength={8} /></label></>}
      {step === 'done' && <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-sm text-emerald-900">Your password has been updated successfully.</div>}
    </div>
  </Modal>;
};

export default ForgotPasswordModal;
