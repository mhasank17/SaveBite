import React, { useState } from 'react';
import Logo from '../../components/common/Logo';
import authApi, { AuthUser } from '../../services/authApi';
import Button from '../../components/common/Button';

interface CustomerRegisterPageProps {
  onSuccess: (user: AuthUser) => void;
  onNavigateToLogin: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const CustomerRegisterPage: React.FC<CustomerRegisterPageProps> = ({
  onSuccess,
  onNavigateToLogin,
  onShowToast,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (trimmedName.length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const data = await authApi.registerCustomer({
        fullName: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone || undefined,
        password,
      });

      onShowToast('success', `Account created! Welcome to SaveBite, ${data.user.fullName}!`, 'Welcome');
      onSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      onShowToast('error', err.message || 'Registration failed.', 'Registration Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Logo className="h-9 mx-auto mb-4" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-3">
            <span className="material-symbols-outlined text-[16px] text-emerald-700">shopping_bag</span>
            <span>Customer Portal</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Create Customer Account
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Join the food rescue initiative and unlock surplus food discounts.
          </p>
        </div>

        {/* Counter Pickup Policy Notice */}
        <div className="mb-6 p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60 text-emerald-900 text-xs flex items-start gap-2">
          <span className="material-symbols-outlined text-emerald-700 shrink-0 text-[18px]">
            storefront
          </span>
          <div>
            <strong>Counter Pickup Only:</strong> Food orders are prepared fresh by partner restaurants and collected directly at the store counter using your secure 4-digit OTP.
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2.5">
            <span className="material-symbols-outlined text-red-600 shrink-0 text-[20px]">
              error
            </span>
            <span>{error}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-[20px]">
                person
              </span>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Aarav Sharma"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006030] focus:bg-white transition-all"
              />
            </div>
          </div>

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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aarav.s@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006030] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Mobile Phone
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-[20px]">
                call
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006030] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Password (min. 6 characters)
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-[20px]">
                lock
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006030] focus:bg-white transition-all"
              />
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
              Create Account
            </Button>
          </div>
        </form>

        {/* Existing account link */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-600">
            Already registered?{' '}
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="font-bold text-[#006030] hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerRegisterPage;
