import React, { useState } from 'react';
import Logo from '../../components/common/Logo';
import authApi, { AuthUser, PartnerRestaurantInfo } from '../../services/authApi';
import Button from '../../components/common/Button';
import ForgotPasswordModal from '../../components/auth/ForgotPasswordModal';

interface PartnerLoginPageProps {
  onSuccess: (user: AuthUser, restaurant?: PartnerRestaurantInfo) => void;
  onNavigateToRegister: () => void;
  onNavigateToCustomer: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const PartnerLoginPage: React.FC<PartnerLoginPageProps> = ({
  onSuccess,
  onNavigateToRegister,
  onNavigateToCustomer,
  onShowToast,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await authApi.loginPartner(email, password);
      onShowToast('success', `Welcome, ${data.user.fullName}!`, 'Partner Login Successful');
      onSuccess(data.user, data.restaurant);
    } catch (err: any) {
      setError(err.message || 'Invalid partner email or password.');
      onShowToast('error', err.message || 'Login failed.', 'Partner Authentication Error');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoPartner = () => {
    setEmail('baker@savebite.in');
    setPassword('Partner@123!');
  };

  return (
    <div className="min-h-screen bg-[#F5F8F6] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_12px_40px_-10px_rgba(0,35,15,0.08)] border border-[#E1ECE4] ring-1 ring-[#006030]/5 p-8">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Logo className="h-9 mx-auto mb-4" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-800 text-xs font-bold mb-3 border border-orange-100">
            <span className="material-symbols-outlined text-[16px] text-orange-600">storefront</span>
            <span>Restaurant Partner Portal</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Restaurant Owner Login
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage surplus inventory, active deals, counter pickups, and merchant earnings.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2.5">
            <span className="material-symbols-outlined text-red-600 shrink-0 text-[20px]">
              error
            </span>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Partner Email
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-[20px]">
                mail
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@restaurant.in"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
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
                className="text-xs font-semibold text-orange-600 hover:underline"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
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
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl shadow-xs"
            >
              Sign In to Partner Portal
            </Button>
          </div>
        </form>

        {/* Demo Auto-fill Helper */}
        <div className="mt-5 pt-5 border-t border-slate-100">
          <button
            type="button"
            onClick={fillDemoPartner}
            className="w-full py-2 px-3 bg-orange-50/70 hover:bg-orange-100/70 text-orange-900 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            <span>Quick-fill Demo Baker (Vikram Joshi)</span>
          </button>
        </div>

        {/* Register Restaurant Link */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-600">
            Want to partner with SaveBite?{' '}
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="font-bold text-orange-600 hover:underline"
            >
              Register Your Restaurant
            </button>
          </p>
        </div>

        {/* Link to Customer Login */}
        <div className="mt-8 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
          Looking for surplus food deals?{' '}
          <button
            type="button"
            onClick={onNavigateToCustomer}
            className="font-bold text-[#006030] hover:underline"
          >
            Customer Login →
          </button>
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

export default PartnerLoginPage;
