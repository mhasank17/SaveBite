import React, { useState } from 'react';
import Logo from '../../components/common/Logo';
import authApi, { AuthUser } from '../../services/authApi';
import Button from '../../components/common/Button';

interface AdminLoginPageProps {
  onSuccess: (user: AuthUser) => void;
  onNavigateToCustomer: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onSuccess,
  onNavigateToCustomer,
  onShowToast,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setError('Please enter your administrator email address.');
      return;
    }

    if (!cleanPassword) {
      setError('Please enter your password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const data = await authApi.loginAdmin(cleanEmail, cleanPassword);
      onShowToast('success', `SuperAdmin session initiated: ${data.user.fullName}`, 'Authenticated');
      onSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Access denied: Invalid administrator credentials.');
      onShowToast('error', err.message || 'Authentication failed.', 'Access Denied');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/80 p-8 md:p-10 text-white">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Logo variant="dark" className="h-9 mx-auto mb-4" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-700 text-emerald-400 text-xs font-mono font-bold mb-3 border border-slate-600">
            <span className="material-symbols-outlined text-[16px] text-emerald-400">shield_lock</span>
            <span>RESTRICTED ACCESS</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            SuperAdmin Console
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Platform governance, partner FSSAI verification, order oversight & system audits.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-900/40 border border-red-700/60 text-red-200 text-sm flex items-start gap-2.5">
            <span className="material-symbols-outlined text-red-400 shrink-0 text-[20px]">
              gpp_bad
            </span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Administrator Email
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-[20px]">
                badge
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter registered administrator email"
                autoComplete="email"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Secure Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-[20px]">
                key
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter account password"
                autoComplete="current-password"
                className="w-full pl-10 pr-11 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <span className="material-symbols-outlined text-[19px]">
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
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg border border-emerald-500/30"
            >
              Verify & Enter Console
            </Button>
          </div>
        </form>

        {/* Security Notice: Strictly No Public Registration */}
        <div className="mt-6 pt-5 border-t border-slate-700/60">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-[11px] text-slate-400 flex items-start gap-2">
            <span className="material-symbols-outlined text-amber-400 text-[16px] shrink-0 mt-0.5">
              lock
            </span>
            <span>
              <strong>Security Protocol:</strong> Public registration is strictly disabled for SuperAdmin accounts. Privileged credentials are issued directly by the University System Authority.
            </span>
          </div>
        </div>

        {/* Back to Customer Portal */}
        <div className="mt-6 text-center text-xs text-slate-500">
          Not a platform administrator?{' '}
          <button
            type="button"
            onClick={onNavigateToCustomer}
            className="font-semibold text-emerald-400 hover:underline"
          >
            Return to Customer Portal →
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
