import React, { useState } from 'react';
import Logo from '../../components/common/Logo';
import authApi, { AuthUser, PartnerRestaurantInfo } from '../../services/authApi';
import Button from '../../components/common/Button';

interface PartnerRegisterPageProps {
  onSuccess: (user: AuthUser, restaurant: PartnerRestaurantInfo) => void;
  onNavigateToLogin: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const PartnerRegisterPage: React.FC<PartnerRegisterPageProps> = ({
  onSuccess,
  onNavigateToLogin,
  onShowToast,
}) => {
  // Owner Details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Restaurant Details
  const [restaurantName, setRestaurantName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('University Perimeter');
  const [restaurantPhone, setRestaurantPhone] = useState('');

  // Compliance & FSSAI
  const [licenseNumber, setLicenseNumber] = useState('');
  const [hygieneGrade, setHygieneGrade] = useState('Grade A');
  const [licenseDocumentUrl, setLicenseDocumentUrl] = useState('');
  const [agreedToCampusDelivery, setAgreedToCampusDelivery] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!agreedToCampusDelivery) {
      setError('You must agree to fulfill orders to approved university campus locations.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (licenseNumber.trim().length < 10) {
      setError('Please provide a valid FSSAI license number (typically 14 digits).');
      return;
    }

    setLoading(true);

    try {
      const data = await authApi.registerPartner({
        fullName,
        email,
        password,
        phone,
        restaurantName,
        branchName: branchName || 'Main Outlet',
        address,
        city,
        restaurantPhone: restaurantPhone || phone,
        licenseNumber,
        hygieneGrade,
        licenseDocumentUrl: licenseDocumentUrl || undefined,
      });

      onShowToast(
        'success',
        'Partner application submitted! It is now pending University SuperAdmin review.',
        'Application Submitted'
      );

      if (data.restaurant) {
        onSuccess(data.user, data.restaurant);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit restaurant application.');
      onShowToast('error', err.message || 'Registration failed.', 'Submission Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Logo className="h-9 mx-auto mb-4" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-800 text-xs font-bold mb-3">
            <span className="material-symbols-outlined text-[16px] text-orange-600">storefront</span>
            <span>Merchant Onboarding</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Register Your Restaurant
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-lg mx-auto">
            Sell surplus food, reduce kitchen waste, and reach thousands of customers across our serviceable delivery areas.
          </p>
        </div>

        {/* Service Area & Delivery Guidelines */}
        <div className="mb-8 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-700 shrink-0 text-[22px]">
            local_shipping
          </span>
          <div>
            <div className="font-bold text-sm mb-0.5">Service Area & Delivery Guidelines</div>
            Partner restaurants prepare orders for customer pickup or fulfill deliveries directly to customers within configured serviceable zones. New partner applications remain in <strong>PENDING</strong> review until verified by SuperAdmin.
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Owner Profile */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-800 text-xs flex items-center justify-center font-bold">
                1
              </span>
              <span>Owner & Contact Details</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Owner Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Vikram Joshi"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Owner Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vikram@boulangerie.in"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Contact Mobile Phone
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98888 11111"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Portal Password (min. 6 characters)
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Restaurant Identity */}
          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-800 text-xs flex items-center justify-center font-bold">
                2
              </span>
              <span>Restaurant Details & Location (Outside Campus)</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Restaurant / Business Name
                </label>
                <input
                  type="text"
                  required
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="The Daily Dough Bakery"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Branch / Outlet Name
                </label>
                <input
                  type="text"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="North Gate Plaza Outlet"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Physical Store Address (Outside Campus)
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Shop 14, Commercial Complex, University Road"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  City / Neighbourhood
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="University Perimeter"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Kitchen Dispatch Phone
                </label>
                <input
                  type="tel"
                  value={restaurantPhone}
                  onChange={(e) => setRestaurantPhone(e.target.value)}
                  placeholder="+91 98888 22222"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Compliance & FSSAI */}
          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-800 text-xs flex items-center justify-center font-bold">
                3
              </span>
              <span>FSSAI License & Hygiene Compliance</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  FSSAI License Number (14 digits)
                </label>
                <input
                  type="text"
                  required
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="11521010000452"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Hygiene Rating Grade
                </label>
                <select
                  value={hygieneGrade}
                  onChange={(e) => setHygieneGrade(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                >
                  <option value="Grade A">Grade A (Excellent)</option>
                  <option value="Grade B">Grade B (Good)</option>
                  <option value="Grade C">Grade C (Satisfactory)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  FSSAI Certificate Document URL (Optional)
                </label>
                <input
                  type="url"
                  value={licenseDocumentUrl}
                  onChange={(e) => setLicenseDocumentUrl(e.target.value)}
                  placeholder="https://example.com/fssai-certificate.pdf"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Mandatory Agreement Checkbox */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={agreedToCampusDelivery}
                onChange={(e) => setAgreedToCampusDelivery(e.target.checked)}
                className="mt-1 w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                <strong>Mandatory Agreement:</strong> I certify that the food safety details and FSSAI number provided are genuine. I agree that our restaurant will fulfill meal orders for counter pickup and to designated delivery addresses within our serviceable zones. I understand that the restaurant application will remain in <strong>Pending Review</strong> until approved by SuperAdmin.
              </span>
            </label>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={loading}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl shadow-xs"
            >
              Submit Restaurant Application
            </Button>
          </div>
        </form>

        {/* Existing partner login */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-600">
            Already registered as a partner?{' '}
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="font-bold text-orange-600 hover:underline"
            >
              Sign In to Partner Portal
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PartnerRegisterPage;
