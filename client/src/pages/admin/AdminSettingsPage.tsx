import React, { useState } from 'react';
import { AuthUser } from '../../services/authApi';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

interface AdminSettingsPageProps {
  currentUser?: AuthUser | null;
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
  onLogout?: () => void;
}

export const AdminSettingsPage: React.FC<AdminSettingsPageProps> = ({
  currentUser,
  onShowToast,
  onLogout,
}) => {
  // Operational Settings State
  const [platformCommissionRate, setPlatformCommissionRate] = useState<number>(15);
  const [minimumPayoutThreshold, setMinimumPayoutThreshold] = useState<number>(500);
  const [pickupCutoffMinutes, setPickupCutoffMinutes] = useState<number>(30);
  const [campusZone, setCampusZone] = useState<string>('Main University North Campus');
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState<boolean>(true);
  const [disputeAutoEscalationHours, setDisputeAutoEscalationHours] = useState<number>(24);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Security State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(true);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      onShowToast('success', 'Admin portal settings updated successfully.', 'Settings Saved');
    }, 400);
  };

  return (
    <div className="flex flex-col gap-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-slate-800 text-2xl">settings</span>
            <h1 className="text-2xl font-bold text-slate-900">Admin Platform Settings</h1>
          </div>
          <p className="text-slate-600 text-sm">
            Configure campus operating parameters, platform commission rates, notifications, and administrator credentials.
          </p>
        </div>

        <Badge variant="verified">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Admin Clearance Verified
          </span>
        </Badge>
      </div>

      <form onSubmit={handleSaveSettings} className="flex flex-col gap-6">
        {/* Admin Identity Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-700">badge</span>
            Administrator Identity & Access
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Full Name</label>
              <input
                type="text"
                disabled
                value={currentUser?.fullName || 'Campus SuperAdmin'}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Administrative Email</label>
              <input
                type="email"
                disabled
                value={currentUser?.email || 'admin@savebite.in'}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">System Role</label>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-semibold">
                <span className="material-symbols-outlined text-purple-600 text-[18px]">security</span>
                <span>{currentUser?.role || 'ADMIN'} (Platform Authority)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Contact Phone</label>
              <input
                type="text"
                disabled
                value={currentUser?.phone || '+91 99999 00001'}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-medium cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Operational Controls */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">tune</span>
            Campus Marketplace Operations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Standard Platform Commission (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={platformCommissionRate}
                  onChange={(e) => setPlatformCommissionRate(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-sm font-semibold text-slate-900"
                />
                <span className="absolute right-4 top-2.5 text-slate-400 text-sm font-bold">%</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Deducted automatically from partner order settlements.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Minimum Partner Payout (INR)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                <input
                  type="number"
                  min="100"
                  step="50"
                  value={minimumPayoutThreshold}
                  onChange={(e) => setMinimumPayoutThreshold(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-sm font-semibold text-slate-900"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Threshold before automated bank batch transfer triggers.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pickup Window Grace Period (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={pickupCutoffMinutes}
                onChange={(e) => setPickupCutoffMinutes(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-sm font-semibold text-slate-900"
              />
              <p className="text-xs text-slate-500 mt-1">Tolerance time after closing before pickup pass expires.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Primary Campus Region
              </label>
              <input
                type="text"
                value={campusZone}
                onChange={(e) => setCampusZone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-sm font-semibold text-slate-900"
              />
              <p className="text-xs text-slate-500 mt-1">Geographic center for food deal radius calculations.</p>
            </div>
          </div>
        </div>

        {/* Alerts & Security */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-600">notifications_active</span>
            Notification & Security Safeguards
          </h2>

          <div className="flex flex-col divide-y divide-slate-100">
            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Email Alerts on New Partner Applications</p>
                <p className="text-xs text-slate-500">Send an urgent email whenever a restaurant submits FSSAI documentation.</p>
              </div>
              <input
                type="checkbox"
                checked={emailAlertsEnabled}
                onChange={(e) => setEmailAlertsEnabled(e.target.checked)}
                className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Dispute Auto-Escalation</p>
                <p className="text-xs text-slate-500">Escalate customer refund requests if partner doesn't reply within {disputeAutoEscalationHours} hours.</p>
              </div>
              <select
                value={disputeAutoEscalationHours}
                onChange={(e) => setDisputeAutoEscalationHours(Number(e.target.value))}
                className="text-xs font-bold border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-800"
              >
                <option value={12}>12 Hours</option>
                <option value={24}>24 Hours</option>
                <option value={48}>48 Hours</option>
              </select>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Two-Factor Admin Authentication (2FA)</p>
                <p className="text-xs text-slate-500">Enforce OTP verification for high-risk payouts and FSSAI status changes.</p>
              </div>
              <input
                type="checkbox"
                checked={twoFactorEnabled}
                onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              Terminate Admin Session
            </button>
          )}

          <div className="ml-auto">
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? 'Updating Settings...' : 'Save Platform Settings'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminSettingsPage;
