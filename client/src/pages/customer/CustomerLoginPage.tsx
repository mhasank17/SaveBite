import React, { useState } from 'react';
import Logo from '../../components/common/Logo';
import authApi, { AuthUser } from '../../services/authApi';
import Button from '../../components/common/Button';
import ForgotPasswordModal from '../../components/auth/ForgotPasswordModal';

export interface CustomerLoginPageProps {
  currentUser?: AuthUser | null;
  onContinue?: () => void;
  onSwitchAccount?: () => void;
  onSuccess: (user: AuthUser) => void;
  onNavigateToRegister: () => void;
  onNavigateToPartner: () => void;
  onNavigateToAdmin?: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
  onBrowseGuest?: () => void;
}

export const CustomerLoginPage: React.FC<CustomerLoginPageProps> = ({
  currentUser,
  onContinue,
  onSwitchAccount,
  onSuccess,
  onNavigateToRegister,
  onNavigateToPartner,
  onNavigateToAdmin: _onNavigateToAdmin,
  onShowToast,
  onBrowseGuest,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);

  const hasActiveCustomerSession =
    !isSwitchingAccount &&
    !!currentUser &&
    currentUser.role === 'CUSTOMER';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!cleanPassword) {
      setError('Please enter your password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const data = await authApi.loginCustomer(cleanEmail, cleanPassword);
      onShowToast('success', `Welcome back, ${data.user.fullName}!`, 'Login Successful');
      onSuccess(data.user);
    } catch (err: any) {
      const msg = err.message || 'Invalid email or password.';
      setError(msg);
      onShowToast('error', msg, 'Authentication Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAccountClick = () => {
    setIsSwitchingAccount(true);
    setEmail('');
    setPassword('');
    setError(null);
    if (onSwitchAccount) {
      onSwitchAccount();
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8F6] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_12px_40px_-10px_rgba(0,35,15,0.08)] border border-[#E1ECE4] ring-1 ring-[#006030]/5 p-8">
        {/* Portal Switcher Tabs (Customer & Partner only; Admin/SuperAdmin is strictly private) */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-6 text-xs font-semibold">
          <button
            type="button"
            className="flex-1 py-1.5 px-2 rounded-lg bg-white shadow-xs text-[#006030] font-bold transition-all text-center"
          >
            Customer
          </button>
          <button
            type="button"
            onClick={onNavigateToPartner}
            className="flex-1 py-1.5 px-2 rounded-lg text-slate-600 hover:text-slate-900 transition-all text-center"
          >
            Partner
          </button>
        </div>

        {/* Brand Header */}
        <div className="text-center mb-8">
          <Logo className="h-9 mx-auto mb-4" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-3 border border-emerald-100">
            <span className="material-symbols-outlined text-[16px] text-emerald-700">shopping_bag</span>
            <span>Customer Portal</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Customer Login
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Access affordable food rescue deals and track your counter pickups.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2.5">
            <span className="material-symbols-outlined text-red-600 shrink-0 text-[20px]">
              error
            </span>
            <div className="flex-1 text-xs sm:text-sm font-medium leading-relaxed">{error}</div>
          </div>
        )}

        {/* Existing Active Customer Session Detected */}
        {hasActiveCustomerSession ? (
          <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 mb-6 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-600 text-white font-black text-xl flex items-center justify-center mx-auto mb-3 shadow-xs">
              {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'C'}
            </div>
            <span className="inline-block text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-2.5 py-0.5 rounded-full mb-1">
              Active Customer Session
            </span>
            <h2 className="text-base font-bold text-slate-900 mt-1">{currentUser.fullName}</h2>
            <p className="text-xs text-slate-500 mb-5">{currentUser.email}</p>

            <div className="space-y-2">
              <Button
                type="button"
                variant="primary"
                size="md"
                fullWidth
                className="bg-[#006030] hover:bg-[#004d26] text-white font-bold py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5"
                onClick={onContinue}
              >
                <span>Continue as {currentUser.fullName.split(' ')[0]}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Button>
              <button
                type="button"
                onClick={handleSwitchAccountClick}
                className="w-full py-2 text-xs font-bold text-slate-600 hover:text-red-700 hover:bg-slate-100/60 rounded-xl transition-colors"
              >
                Sign in with a different account
              </button>
            </div>
          </div>
        ) : (
          /* Standard Unauthenticated Login Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-[20px]">
                  mail
                </span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006030] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-xs font-semibold text-[#006030] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-[20px]">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006030] focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={loading}
                className="bg-[#006030] hover:bg-[#004d26] text-white font-bold py-3 rounded-xl shadow-xs"
              >
                Sign In to SaveBite
              </Button>
            </div>
          </form>
        )}

        {/* Create Account link */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-600">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="font-bold text-[#006030] hover:underline"
            >
              Sign Up
            </button>
          </p>
        </div>

        {/* Explore as Guest Option */}
        {onBrowseGuest && (
          <div className="mt-4 pt-3 text-center border-t border-slate-100">
            <button
              type="button"
              onClick={onBrowseGuest}
              className="text-xs font-semibold text-slate-500 hover:text-[#006030] inline-flex items-center gap-1 transition-colors"
            >
              <span>Explore Deals as Guest</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </button>
          </div>
        )}

        {/* Partner Portal Navigation */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col gap-2 text-center text-xs text-slate-400">
          <div>
            Are you a restaurant owner?{' '}
            <button
              type="button"
              onClick={onNavigateToPartner}
              className="font-semibold text-orange-600 hover:underline"
            >
              Partner Portal →
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <ForgotPasswordModal
          isOpen={isForgotPasswordOpen}
          onClose={() => setIsForgotPasswordOpen(false)}
          initialEmail={email}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
};

export default CustomerLoginPage;
