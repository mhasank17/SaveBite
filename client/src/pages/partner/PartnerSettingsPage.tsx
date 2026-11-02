import React, { useState } from 'react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import partnerApi, { PartnerRestaurant } from '../../services/partnerApi';

export interface PartnerSettingsPageProps {
  restaurant: PartnerRestaurant | null;
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
  onLogout?: () => void;
}

export const PartnerSettingsPage: React.FC<PartnerSettingsPageProps> = ({
  restaurant,
  onShowToast,
  onLogout,
}) => {
  const [name, setName] = useState(restaurant?.name || '[Demo] The Daily Dough Bakery (Sample Partner)');
  const [branch, setBranch] = useState(restaurant?.branchName || 'Sandbox Outlet - Bandra West');
  const [phone, setPhone] = useState(restaurant?.phone || '+910000000001');
  const [isStoreLive, setIsStoreLive] = useState(restaurant?.isStoreLive ?? true);
  const [pickupLeadMinutes, setPickupLeadMinutes] = useState(30);
  const [saving, setSaving] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await partnerApi.toggleStoreStatus(isStoreLive);
      onShowToast('success', 'Outlet operational settings updated successfully.', 'Settings Saved');
    } catch {
      onShowToast('error', 'Failed to save settings.', 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleEmergencyPause = async () => {
    try {
      await partnerApi.toggleStoreStatus(false);
      setIsStoreLive(false);
      onShowToast(
        'info',
        'Emergency pause triggered. All new customer deal reservations are temporarily halted.',
        'Store Paused'
      );
    } catch {
      onShowToast('error', 'Failed to trigger emergency pause.', 'Error');
    }
  };

  return (
    <div className="flex flex-col gap-space-md animate-fade-in pb-12">
      {/* Header */}
      <section className="bg-surface-container-lowest p-space-md md:p-space-lg rounded-3xl border border-outline-variant/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
            Outlet Profile & Operations
          </h2>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Manage your store live toggle, FSSAI compliance info, pickup windows, and contact details.
          </p>
        </div>

        {onLogout && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="text-red-700 border-red-200 hover:bg-red-50"
              leftIcon={<span className="material-symbols-outlined text-[16px]">logout</span>}
            >
              Sign Out
            </Button>
          </div>
        )}
      </section>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="flex flex-col gap-space-md">
        
        {/* Compliance & Verification Banner */}
        <div className="bg-surface-container-lowest p-space-md rounded-3xl border border-outline-variant/30 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[24px]">verified_user</span>
              <h3 className="font-title-md text-title-md font-bold text-on-surface">
                Food Safety & Regulatory Compliance
              </h3>
            </div>
            <Badge variant="neutral">
              {restaurant?.kycStatus === 'VERIFIED' ? 'Verified Commercial' : 'Demo / Sandbox Testing'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-surface-container-low p-4 rounded-2xl text-xs">
            <div className="flex flex-col gap-1">
              <span className="text-on-surface-variant font-medium">FSSAI License:</span>
              <span className="font-mono font-bold text-on-surface break-all">
                {restaurant?.licenseNumber || 'DEMO-FSSAI-00000000000001-SAMPLE'}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-on-surface-variant font-medium">Hygiene Grade:</span>
              <span className="font-bold text-on-surface">
                {restaurant?.hygieneGrade || 'Demo / Uninspected'}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-on-surface-variant font-medium">Commercial KYC:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {restaurant?.kycStatus || 'PENDING'} (Excluded from production public listings)
              </span>
            </div>
          </div>
        </div>

        {/* Store Live & Emergency Controls */}
        <div className="bg-surface-container-lowest p-space-md rounded-3xl border border-outline-variant/30 shadow-xs flex flex-col gap-4">
          <h3 className="font-title-md text-title-md font-bold text-on-surface">
            Store Availability Status
          </h3>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-surface-container-low">
            <div className="flex items-center gap-3">
              <span
                className={`w-3.5 h-3.5 rounded-full ${
                  isStoreLive ? 'bg-secondary animate-pulse' : 'bg-outline'
                }`}
              />
              <div className="flex flex-col">
                <span className="font-bold text-sm text-on-surface">
                  {isStoreLive ? 'Store Open & Accepting Customer Orders' : 'Store Temporarily Paused'}
                </span>
                <span className="text-xs text-on-surface-variant">
                  {isStoreLive
                    ? 'Customers within delivery / pickup radius can discover and reserve your listings.'
                    : 'Your listings are hidden from new customer discovery. Existing reserved passes remain valid.'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsStoreLive(!isStoreLive)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isStoreLive
                  ? 'bg-secondary text-on-secondary shadow-xs'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {isStoreLive ? 'Pause Store' : 'Resume Store'}
            </button>
          </div>

          {/* Emergency Halt */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-error/20 bg-error/5">
            <div className="flex flex-col">
              <span className="font-bold text-sm text-error">Emergency Out-of-Stock Halt</span>
              <span className="text-xs text-on-surface-variant">
                Immediately freeze all incoming orders across all active food deals if unexpected counter rush occurs.
              </span>
            </div>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleEmergencyPause}
            >
              Halt Orders
            </Button>
          </div>
        </div>

        {/* Outlet Details */}
        <div className="bg-surface-container-lowest p-space-md rounded-3xl border border-outline-variant/30 shadow-xs flex flex-col gap-4">
          <h3 className="font-title-md text-title-md font-bold text-on-surface">
            Outlet Details & Contact
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="outlet-name" className="text-label-sm font-bold text-on-surface">
                Outlet Name
              </label>
              <input
                id="outlet-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="branch-name" className="text-label-sm font-bold text-on-surface">
                Branch / Neighborhood
              </label>
              <input
                id="branch-name"
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="px-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="contact-phone" className="text-label-sm font-bold text-on-surface">
                Store Manager Phone
              </label>
              <input
                id="contact-phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="px-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="lead-time" className="text-label-sm font-bold text-on-surface">
                Prep Lead Time Before Pickup Window
              </label>
              <select
                id="lead-time"
                value={pickupLeadMinutes}
                onChange={(e) => setPickupLeadMinutes(Number(e.target.value))}
                className="px-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes (Recommended)</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={saving}
              leftIcon={<span className="material-symbols-outlined text-[18px]">save</span>}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PartnerSettingsPage;
