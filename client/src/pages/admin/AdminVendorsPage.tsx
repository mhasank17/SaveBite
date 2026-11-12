import React, { useEffect, useState } from 'react';
import adminApi, { AdminVendor } from '../../services/adminApi';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';

interface AdminVendorsPageProps {
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const AdminVendorsPage: React.FC<AdminVendorsPageProps> = ({ onShowToast }) => {
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterKyc, setFilterKyc] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal state for KYC review
  const [selectedVendorForKyc, setSelectedVendorForKyc] = useState<AdminVendor | null>(null);
  const [targetKycStatus, setTargetKycStatus] = useState<'APPROVED' | 'RE_INSPECT' | 'REJECTED'>('APPROVED');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [isSubmittingKyc, setIsSubmittingKyc] = useState<boolean>(false);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getVendors();
      setVendors(data);
    } catch {
      onShowToast('error', 'Failed to load partner vendors.', 'Connection Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleToggleStoreStatus = async (vendor: AdminVendor) => {
    const newStatus = !vendor.isStoreLive;
    try {
      await adminApi.toggleVendorStatus(vendor.id, newStatus);
      setVendors((prev) =>
        prev.map((v) => (v.id === vendor.id ? { ...v, isStoreLive: newStatus } : v))
      );
      onShowToast(
        'success',
        `${vendor.name} is now ${newStatus ? 'LIVE' : 'SUSPENDED/OFFLINE'}.`,
        'Store Status Updated'
      );
    } catch {
      onShowToast('error', 'Failed to toggle vendor status.', 'Error');
    }
  };

  const handleOpenKycModal = (vendor: AdminVendor, initialStatus: 'APPROVED' | 'RE_INSPECT' | 'REJECTED') => {
    setSelectedVendorForKyc(vendor);
    setTargetKycStatus(initialStatus);
    setAdminNotes(
      initialStatus === 'APPROVED'
        ? 'FSSAI certificate and kitchen hygiene standards verified.'
        : initialStatus === 'RE_INSPECT'
        ? 'High-res copy of FSSAI certificate required. Please re-upload.'
        : 'KYC rejected due to non-compliant food safety documentation.'
    );
  };

  const handleConfirmKycUpdate = async () => {
    if (!selectedVendorForKyc) return;
    setIsSubmittingKyc(true);
    try {
      await adminApi.updateVendorKyc(selectedVendorForKyc.id, targetKycStatus, adminNotes);
      setVendors((prev) =>
        prev.map((v) =>
          v.id === selectedVendorForKyc.id ? { ...v, kycStatus: targetKycStatus } : v
        )
      );
      onShowToast(
        'success',
        `KYC status for ${selectedVendorForKyc.name} updated to ${targetKycStatus}.`,
        'Compliance Recorded'
      );
      setSelectedVendorForKyc(null);
    } catch {
      onShowToast('error', 'Failed to update KYC status.', 'Update Error');
    } finally {
      setIsSubmittingKyc(false);
    }
  };

  const filteredVendors = vendors.filter((v) => {
    const matchesKyc = filterKyc === 'ALL' || v.kycStatus === filterKyc;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (v.name || '').toLowerCase().includes(q) ||
      (v.branchName || '').toLowerCase().includes(q) ||
      (v.licenseNumber || '').toLowerCase().includes(q);
    return matchesKyc && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Top Header */}
      <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline-sm text-2xl font-bold text-on-surface">
              Vendor Management & KYC Governance
            </h1>
            <Badge variant="neutral">{vendors.length} Partners</Badge>
          </div>
          <p className="font-body-sm text-on-surface-variant text-sm mt-0.5">
            Audit FSSAI food licenses, approve merchant onboarding, and manage store operational killswitch.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchVendors}
          leftIcon={<span className="material-symbols-outlined text-[18px]">refresh</span>}
        >
          Refresh Directory
        </Button>
      </section>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vendor name, branch, or FSSAI license..."
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low rounded-xl border border-outline-variant/30 text-sm text-on-surface focus:outline-none focus:border-primary placeholder:text-on-surface-variant/60"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(['ALL', 'PENDING', 'APPROVED', 'RE_INSPECT', 'REJECTED'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterKyc(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filterKyc === status
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {status === 'ALL' ? 'All Partners' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Vendors Table / Card List */}
      {loading ? (
        <LoadingState message="Loading vendor compliance records..." />
      ) : filteredVendors.length === 0 ? (
        <EmptyState
          title="No vendors found"
          description="No partners matched your search query or selected KYC status."
          icon="storefront"
        />
      ) : (
        <div className="flex flex-col gap-4">
          {filteredVendors.map((vendor) => (
            <div
              key={vendor.id}
              className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
            >
              {/* Partner Details */}
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary font-bold shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[26px]">storefront</span>
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-on-surface">{vendor.name}</h3>
                    {vendor.isDemo && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        Demo Account
                      </span>
                    )}
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        vendor.kycStatus === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : vendor.kycStatus === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : vendor.kycStatus === 'RE_INSPECT'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      KYC: {vendor.kycStatus}
                    </span>
                  </div>

                  <p className="text-sm text-on-surface-variant mt-0.5">
                    {vendor.branchName} • {vendor.address}, {vendor.city}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant mt-2 font-mono">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-emerald-600">verified</span>
                      <span>FSSAI: {vendor.licenseNumber}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-sans font-bold">
                      <span className="material-symbols-outlined text-[13px] text-emerald-600">psychology</span>
                      98% AI Pre-Check Match
                    </span>
                    {vendor.phone && (
                      <span className="flex items-center gap-1 font-sans">
                        <span className="material-symbols-outlined text-[15px]">call</span>
                        <span>{vendor.phone}</span>
                      </span>
                    )}
                  </div>

                  {/* Submitted Documents Row matching admin_vendor_kyc.jpg */}
                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-slate-100 text-xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Docs:</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                      <span className="material-symbols-outlined text-[13px]">description</span>
                      Health Inspection PDF
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                      <span className="material-symbols-outlined text-[13px]">home_work</span>
                      Kitchen Lease
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                      <span className="material-symbols-outlined text-[13px]">badge</span>
                      Owner ID
                    </span>
                  </div>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-outline-variant/20">
                {/* Store Live Killswitch */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStoreStatus(vendor)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      vendor.isStoreLive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        vendor.isStoreLive ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    <span>{vendor.isStoreLive ? 'Store Live' : 'Store Offline'}</span>
                  </button>
                </div>

                {/* KYC Actions */}
                <div className="flex items-center gap-1.5">
                  {vendor.kycStatus !== 'APPROVED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenKycModal(vendor, 'APPROVED')}
                    >
                      Approve
                    </Button>
                  )}
                  {vendor.kycStatus !== 'RE_INSPECT' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenKycModal(vendor, 'RE_INSPECT')}
                    >
                      Re-Inspect
                    </Button>
                  )}
                  {vendor.kycStatus !== 'REJECTED' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-600 hover:bg-rose-50"
                      onClick={() => handleOpenKycModal(vendor, 'REJECTED')}
                    >
                      Reject
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KYC Review Modal */}
      {selectedVendorForKyc && (
        <Modal
          isOpen={!!selectedVendorForKyc}
          onClose={() => setSelectedVendorForKyc(null)}
          title={`KYC Compliance Review: ${selectedVendorForKyc.name}`}
        >
          <div className="flex flex-col gap-4">
            <div className="p-3 bg-surface-container-low rounded-xl text-sm">
              <div className="font-semibold text-on-surface">FSSAI License Document Check</div>
              <div className="text-xs text-on-surface-variant font-mono mt-0.5">
                License: {selectedVendorForKyc.licenseNumber}
              </div>
              <div className="text-xs text-on-surface-variant mt-0.5">
                Location: {selectedVendorForKyc.address}, {selectedVendorForKyc.city}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider block mb-1.5">
                Set Decision Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['APPROVED', 'RE_INSPECT', 'REJECTED'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setTargetKycStatus(status)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      targetKycStatus === status
                        ? status === 'APPROVED'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : status === 'RE_INSPECT'
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-rose-600 text-white border-rose-600'
                        : 'border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-low'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider block mb-1.5">
                Admin Audit Notes & Justification
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                placeholder="Enter food safety compliance review notes..."
                className="w-full p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 text-sm text-on-surface focus:outline-none focus:border-primary placeholder:text-on-surface-variant/60"
              />
            </div>

            <div className="flex items-center justify-end gap-2 mt-2 pt-4 border-t border-outline-variant/20">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedVendorForKyc(null)}
                disabled={isSubmittingKyc}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmKycUpdate}
                disabled={isSubmittingKyc}
              >
                {isSubmittingKyc ? 'Updating...' : `Confirm ${targetKycStatus}`}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminVendorsPage;
