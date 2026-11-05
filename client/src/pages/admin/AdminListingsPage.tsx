import React, { useEffect, useState } from 'react';
import adminApi, { AdminListing } from '../../services/adminApi';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';

interface AdminListingsPageProps {
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const AdminListingsPage: React.FC<AdminListingsPageProps> = ({ onShowToast }) => {
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Moderation modal
  const [selectedListing, setSelectedListing] = useState<AdminListing | null>(null);
  const [targetStatus, setTargetStatus] = useState<'ACTIVE' | 'PAUSED' | 'EXPIRED'>('PAUSED');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getListings();
      setListings(data);
    } catch {
      onShowToast('error', 'Failed to load platform listings.', 'Connection Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleOpenModeration = (listing: AdminListing, newStatus: 'ACTIVE' | 'PAUSED' | 'EXPIRED') => {
    setSelectedListing(listing);
    setTargetStatus(newStatus);
    setAdminNotes(
      newStatus === 'PAUSED'
        ? 'Temporarily paused pending pricing or packaging review.'
        : newStatus === 'EXPIRED'
        ? 'Delisted due to quality standard review or past pickup time.'
        : 'Re-activated listing after compliance verification.'
    );
  };

  const handleConfirmModeration = async () => {
    if (!selectedListing) return;
    setIsSubmitting(true);
    try {
      await adminApi.moderateListing(selectedListing.id, targetStatus, adminNotes);
      setListings((prev) =>
        prev.map((item) =>
          item.id === selectedListing.id ? { ...item, status: targetStatus } : item
        )
      );
      onShowToast(
        'success',
        `Listing "${selectedListing.title}" status changed to ${targetStatus}.`,
        'Moderation Applied'
      );
      setSelectedListing(null);
    } catch {
      onShowToast('error', 'Failed to moderate listing.', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredListings = listings.filter((item) => {
    const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.restaurant?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline-sm text-2xl font-bold text-on-surface">
              Platform Listings Moderation
            </h1>
            <Badge variant="neutral">{listings.length} Deals</Badge>
          </div>
          <p className="font-body-sm text-on-surface-variant text-sm mt-0.5">
            SuperAdmin review of surplus listings across all restaurant partners to ensure fair INR pricing and food safety standards.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchListings}
          leftIcon={<span className="material-symbols-outlined text-[18px]">refresh</span>}
        >
          Refresh Listings
        </Button>
      </section>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search food deal title or partner name..."
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low rounded-xl border border-outline-variant/30 text-sm text-on-surface focus:outline-none focus:border-primary placeholder:text-on-surface-variant/60"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(['ALL', 'ACTIVE', 'PAUSED', 'SOLD_OUT', 'EXPIRED'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filterStatus === status
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {status === 'ALL' ? 'All Status' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Directory */}
      {loading ? (
        <LoadingState message="Loading platform food deals..." />
      ) : filteredListings.length === 0 ? (
        <EmptyState
          title={listings.length === 0 ? "No food deals available" : "No food deals found"}
          description={
            listings.length === 0
              ? "No food deals or mystery boxes are currently active on the platform."
              : "No listings matched the filter criteria."
          }
          icon="inventory_2"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredListings.map((deal) => {
            const discountPct = Math.round(
              ((deal.originalPriceInr - deal.surplusPriceInr) / deal.originalPriceInr) * 100
            );

            return (
              <div
                key={deal.id}
                className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-primary">
                          {deal.restaurant?.name || 'Partner Outlet'}
                        </span>
                        {deal.isDemo && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                            Demo
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-on-surface mt-0.5">{deal.title}</h3>
                    </div>

                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase shrink-0 ${
                        deal.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : deal.status === 'PAUSED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {deal.status}
                    </span>
                  </div>

                  <p className="text-xs text-on-surface-variant mt-2 line-clamp-2">
                    {deal.description}
                  </p>

                  {/* Pricing and Stock Bar */}
                  <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-black text-on-surface">
                          ₹{deal.surplusPriceInr}
                        </span>
                        <span className="text-xs text-on-surface-variant line-through">
                          ₹{deal.originalPriceInr}
                        </span>
                        <span className="text-xs font-bold text-emerald-600">
                          {discountPct}% OFF
                        </span>
                      </div>
                      <div className="text-[11px] text-on-surface-variant mt-0.5">
                        Window: {deal.pickupStartTime} – {deal.pickupEndTime}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-on-surface">
                        {deal.availableQuantity} of {deal.totalQuantity} Left
                      </div>
                      <div className="text-[11px] text-teal-700 font-medium mt-0.5">
                        {deal.co2eSavingsKg} kg CO2e saved
                      </div>
                    </div>
                  </div>
                </div>

                {/* Moderation Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/20">
                  {deal.status !== 'ACTIVE' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenModeration(deal, 'ACTIVE')}
                    >
                      Activate
                    </Button>
                  )}
                  {deal.status !== 'PAUSED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenModeration(deal, 'PAUSED')}
                    >
                      Pause Listing
                    </Button>
                  )}
                  {deal.status !== 'EXPIRED' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-600 hover:bg-rose-50"
                      onClick={() => handleOpenModeration(deal, 'EXPIRED')}
                    >
                      Delist / Expire
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Moderation Confirmation Modal */}
      {selectedListing && (
        <Modal
          isOpen={!!selectedListing}
          onClose={() => setSelectedListing(null)}
          title={`Moderate Listing: ${selectedListing.title}`}
        >
          <div className="flex flex-col gap-4">
            <div className="p-3 bg-surface-container-low rounded-xl text-sm">
              <div className="font-semibold text-on-surface">Partner Outlet</div>
              <div className="text-xs text-on-surface-variant">
                {selectedListing.restaurant?.name}
              </div>
              <div className="text-xs text-on-surface-variant mt-1">
                Price: ₹{selectedListing.surplusPriceInr} (M.R.P. ₹{selectedListing.originalPriceInr})
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider block mb-1.5">
                Target Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['ACTIVE', 'PAUSED', 'EXPIRED'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setTargetStatus(status)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      targetStatus === status
                        ? status === 'ACTIVE'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : status === 'PAUSED'
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
                Moderation Reason / Admin Notes
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                placeholder="Reason for changing listing status..."
                className="w-full p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 text-sm text-on-surface focus:outline-none focus:border-primary placeholder:text-on-surface-variant/60"
              />
            </div>

            <div className="flex items-center justify-end gap-2 mt-2 pt-4 border-t border-outline-variant/20">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedListing(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmModeration}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : `Set to ${targetStatus}`}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminListingsPage;
