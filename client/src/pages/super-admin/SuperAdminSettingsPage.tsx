import React, { useState } from 'react';
import { AuthUser } from '../../services/authApi';
import Button from '../../components/common/Button';

interface SuperAdminSettingsPageProps {
  currentUser?: AuthUser | null;
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
  onLogout?: () => void;
}

export const SuperAdminSettingsPage: React.FC<SuperAdminSettingsPageProps> = ({
  currentUser,
  onShowToast,
  onLogout,
}) => {
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [emergencyLockdown, setEmergencyLockdown] = useState<boolean>(false);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState<number>(60);
  const [databasePoolSize, setDatabasePoolSize] = useState<number>(20);
  const [webhookSecretMasked, setWebhookSecretMasked] = useState<string>('whsec_live_998877665544332211');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      onShowToast('success', 'Master system configuration updated.', 'Governance Saved');
    }, 400);
  };

  return (
    <div className="flex flex-col gap-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-purple-400 text-3xl">settings_suggest</span>
            <h1 className="text-2xl font-bold text-white">SuperAdmin Master Governance Settings</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Root infrastructure parameters, emergency overrides, database limits, and payment gateway bindings.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-purple-950/70 border border-purple-800/80 text-purple-300 text-xs font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          <span>Root Access Granted</span>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Master Identity */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-400">shield_person</span>
            Root SuperAdmin Credentials
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Root Identifier</label>
              <input
                type="text"
                disabled
                value={currentUser?.fullName || 'Master Platform SuperAdmin'}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 text-sm font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Root Clearance Email</label>
              <input
                type="email"
                disabled
                value={currentUser?.email || 'admin@savebite.in'}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 text-sm font-medium cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Global Operational Overrides */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400">warning</span>
            Emergency & Maintenance Controls
          </h2>

          <div className="flex flex-col divide-y divide-slate-800/80">
            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">Scheduled Maintenance Mode</p>
                <p className="text-xs text-slate-400">
                  When enabled, only administrators can access the system. Customers & partners will see a maintenance notice.
                </p>
              </div>
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-red-400">Emergency Marketplace Lockdown</p>
                <p className="text-xs text-slate-400">
                  Immediately suspends order processing, disables all active listings, and pauses partner payouts.
                </p>
              </div>
              <input
                type="checkbox"
                checked={emergencyLockdown}
                onChange={(e) => setEmergencyLockdown(e.target.checked)}
                className="w-5 h-5 rounded text-red-600 focus:ring-red-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Database & Gateway Configuration */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-400">database</span>
            Backend Infrastructure & Payments
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                PostgreSQL Max Connection Pool
              </label>
              <input
                type="number"
                min="5"
                max="100"
                value={databasePoolSize}
                onChange={(e) => setDatabasePoolSize(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                Admin Session Auto-Timeout (Minutes)
              </label>
              <input
                type="number"
                min="15"
                max="480"
                value={sessionTimeoutMinutes}
                onChange={(e) => setSessionTimeoutMinutes(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 mb-1">
                Razorpay Webhook Signature Secret
              </label>
              <input
                type="password"
                value={webhookSecretMasked}
                onChange={(e) => setWebhookSecretMasked(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-sm font-mono"
              />
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between pt-2">
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              Terminate SuperAdmin Session
            </button>
          )}

          <div className="ml-auto">
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? 'Applying Master Settings...' : 'Save SuperAdmin Settings'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SuperAdminSettingsPage;
