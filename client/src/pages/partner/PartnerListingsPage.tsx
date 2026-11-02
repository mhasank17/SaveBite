import React, { useState, useEffect } from 'react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import PriceDisplay from '../../components/common/PriceDisplay';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import partnerApi from '../../services/partnerApi';
import CreateDealModal from '../../components/partner/CreateDealModal';
import { getFoodFallbackImageUrl, handleImageError } from '../../utils/foodImages';

export interface PartnerListingItem {
  id: string;
  title: string;
  description: string;
  category?: { name: string };
  imageUrl?: string;
  originalPriceInr: number;
  surplusPriceInr: number;
  discountPercent?: number;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity?: number;
  claimedQuantity?: number;
  pickupStartTime: string;
  pickupEndTime: string;
  status: 'ACTIVE' | 'SOLD_OUT' | 'PAUSED' | 'CANCELLED';
  isMysteryBox?: boolean;
}

export interface PartnerListingsPageProps {
  onOpenCreateDealModal: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const PartnerListingsPage: React.FC<PartnerListingsPageProps> = ({
  onOpenCreateDealModal,
  onShowToast,
}) => {
  const [listings, setListings] = useState<PartnerListingItem[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'SOLD_OUT' | 'PAUSED'>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingDeal, setEditingDeal] = useState<PartnerListingItem | null>(null);
  const [dealToDelete, setDealToDelete] = useState<PartnerListingItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const data = await partnerApi.getListings();
      if (data && data.length > 0) {
        setListings(data);
      } else {
        // Fallback mock items
        setListings([
          {
            id: 'demo-deal-mystery-bag',
            title: '[Demo] Evening Mystery Patisserie & Sourdough Bag',
            description: 'Fresh artisanal sourdough, croissants, and danishes packed for evening pickup.',
            category: { name: 'Artisan Bakery' },
            imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
            originalPriceInr: 550,
            surplusPriceInr: 149,
            discountPercent: 73,
            totalQuantity: 15,
            availableQuantity: 5,
            reservedQuantity: 2,
            claimedQuantity: 8,
            pickupStartTime: '19:30',
            pickupEndTime: '21:30',
            status: 'ACTIVE',
            isMysteryBox: true,
          },
          {
            id: 'demo-deal-brioche-bundle',
            title: '[Demo] Artisan Baguette & Brioche Hearth Bundle',
            description: '2 French baguettes + 2 golden brioches baked in stone hearth oven.',
            category: { name: 'Artisan Bakery' },
            imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=800&q=80',
            originalPriceInr: 399,
            surplusPriceInr: 120,
            discountPercent: 70,
            totalQuantity: 10,
            availableQuantity: 4,
            reservedQuantity: 0,
            claimedQuantity: 6,
            pickupStartTime: '20:00',
            pickupEndTime: '21:30',
            status: 'ACTIVE',
            isMysteryBox: false,
          },
          {
            id: 'demo-deal-pastry-delight',
            title: '[Demo] Belgian Chocolate Ganache Cake & French Eclairs',
            description: 'Handcrafted chocolate ganache layer cake slices and classic choux pastry eclairs.',
            category: { name: 'Artisan Bakery' },
            imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
            originalPriceInr: 580,
            surplusPriceInr: 179,
            discountPercent: 69,
            totalQuantity: 14,
            availableQuantity: 4,
            reservedQuantity: 2,
            claimedQuantity: 8,
            pickupStartTime: '19:30',
            pickupEndTime: '20:30',
            status: 'ACTIVE',
            isMysteryBox: false,
          },
        ]);
      }
    } catch {
      onShowToast('error', 'Could not load listings. Showing offline copy.', 'Network Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleUpdateQuantity = async (listingId: string, currentQty: number, delta: number) => {
    const nextQty = Math.max(0, currentQty + delta);
    setUpdatingId(listingId);
    try {
      await partnerApi.updateListing(listingId, { availableQuantity: nextQty });
      setListings((prev) =>
        prev.map((item) =>
          item.id === listingId
            ? {
                ...item,
                availableQuantity: nextQty,
                status: nextQty === 0 ? 'SOLD_OUT' : item.status === 'SOLD_OUT' ? 'ACTIVE' : item.status,
              }
            : item
        )
      );
      onShowToast('success', `Available portions updated to ${nextQty}.`, 'Portions Updated');
    } catch {
      onShowToast('error', 'Failed to update portion quantity.', 'Error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleStatus = async (listing: PartnerListingItem) => {
    const nextStatus = listing.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED';
    setUpdatingId(listing.id);
    try {
      await partnerApi.updateListing(listing.id, { status: nextStatus });
      setListings((prev) =>
        prev.map((item) => (item.id === listing.id ? { ...item, status: nextStatus } : item))
      );
      onShowToast(
        nextStatus === 'ACTIVE' ? 'success' : 'info',
        nextStatus === 'ACTIVE'
          ? `"${listing.title}" is now active and discoverable by customers.`
          : `"${listing.title}" has been paused.`,
        nextStatus === 'ACTIVE' ? 'Deal Resumed' : 'Deal Paused'
      );
    } catch {
      onShowToast('error', 'Failed to update deal status.', 'Error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!dealToDelete) return;

    setIsDeleting(true);
    try {
      await partnerApi.deleteListing(dealToDelete.id);
      setListings((prev) => prev.filter((item) => item.id !== dealToDelete.id));
      onShowToast(
        'success',
        `"${dealToDelete.title}" has been removed from your active listings.`,
        'Deal Deleted'
      );
      setDealToDelete(null);
    } catch (err: any) {
      onShowToast('error', err.message || 'Failed to delete food deal.', 'Error');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredListings = listings.filter((item) => {
    if (filter === 'ALL') return true;
    return item.status === filter;
  });

  const activeCount = listings.filter((i) => i.status === 'ACTIVE').length;
  const soldOutCount = listings.filter((i) => i.status === 'SOLD_OUT').length;
  const pausedCount = listings.filter((i) => i.status === 'PAUSED').length;

  return (
    <div className="flex flex-col gap-space-md animate-fade-in pb-12">
      {/* Header bar */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-space-md md:p-space-lg rounded-3xl border border-outline-variant/30 shadow-xs">
        <div className="flex flex-col">
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
            Food Deals & Mystery Boxes
          </h2>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Set available quantities, manage pickup hours, and broadcast rescue bundles in real time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={fetchListings}
            leftIcon={<span className="material-symbols-outlined text-[18px]">refresh</span>}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onOpenCreateDealModal}
            leftIcon={<span className="material-symbols-outlined text-[20px]">add</span>}
          >
            Create New Deal
          </Button>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === 'ALL'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
          }`}
        >
          All Listings ({listings.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('ACTIVE')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === 'ACTIVE'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Active ({activeCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('SOLD_OUT')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === 'SOLD_OUT'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Sold Out ({soldOutCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('PAUSED')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === 'PAUSED'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Paused ({pausedCount})
        </button>
      </div>

      {/* Listings List */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-on-surface-variant">Loading your active food deals...</span>
        </div>
      ) : filteredListings.length === 0 ? (
        <EmptyState
          icon="inventory_2"
          title="No food deals found"
          description={
            filter === 'ALL'
              ? 'You have not published any food deals or mystery boxes yet today.'
              : `No food deals currently match the status "${filter}".`
          }
          actionText="Publish a Food Deal"
          onAction={onOpenCreateDealModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
          {filteredListings.map((deal) => {
            const isUpdating = updatingId === deal.id;

            return (
              <div
                key={deal.id}
                className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-xs overflow-hidden flex flex-col justify-between hover:border-outline-variant/60 transition-all"
              >
                {/* Upper section */}
                <div className="p-4 flex gap-4">
                  {/* Thumbnail */}
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-surface-container">
                    <img
                      src={deal.imageUrl || getFoodFallbackImageUrl({ id: deal.id, title: deal.title, categoryName: deal.category?.name })}
                      alt={deal.title}
                      onError={(e) =>
                        handleImageError(
                          e,
                          getFoodFallbackImageUrl({ id: deal.id, title: deal.title, categoryName: deal.category?.name })
                        )
                      }
                      className="w-full h-full object-cover"
                    />
                    {deal.isMysteryBox && (
                      <span className="absolute top-1 left-1 bg-surface-container-highest/90 backdrop-blur-xs text-[10px] font-bold px-1.5 py-0.5 rounded-md text-on-surface">
                        Mystery
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                          {deal.category?.name || 'Food Deal'}
                        </span>
                        {deal.status === 'ACTIVE' && (
                          <Badge variant="live" pulseDot pulseColor="primary">
                            Active
                          </Badge>
                        )}
                        {deal.status === 'PAUSED' && (
                          <Badge variant="neutral">
                            Paused
                          </Badge>
                        )}
                        {deal.status === 'SOLD_OUT' && (
                          <Badge variant="error">
                            Sold Out
                          </Badge>
                        )}
                      </div>

                      <h3 className="font-title-md text-title-md font-bold text-on-surface line-clamp-1 mt-0.5">
                        {deal.title}
                      </h3>
                      <p className="text-body-sm text-on-surface-variant line-clamp-1 text-xs mt-0.5">
                        {deal.description}
                      </p>
                    </div>

                    {/* Price and Pickup Times */}
                    <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
                      <PriceDisplay
                        originalPrice={deal.originalPriceInr}
                        dealPrice={deal.surplusPriceInr}
                        size="sm"
                      />
                      <div className="text-right text-[11px] text-on-surface-variant flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        <span>{deal.pickupStartTime} – {deal.pickupEndTime}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lower Action bar: Portions & Controls */}
                <div className="px-4 py-3 bg-surface-container-low/60 border-t border-outline-variant/30 flex items-center justify-between gap-3">
                  {/* Portions counter */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-on-surface-variant">Available:</span>
                    <div className="flex items-center bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        disabled={isUpdating || deal.availableQuantity <= 0}
                        onClick={() => handleUpdateQuantity(deal.id, deal.availableQuantity, -1)}
                        className="w-7 h-7 flex items-center justify-center text-on-surface hover:bg-surface-container disabled:opacity-30 transition-all font-bold"
                        title="Reduce available portions"
                      >
                        –
                      </button>
                      <span className="w-8 text-center text-xs font-extrabold text-on-surface">
                        {deal.availableQuantity}
                      </span>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleUpdateQuantity(deal.id, deal.availableQuantity, 1)}
                        className="w-7 h-7 flex items-center justify-center text-on-surface hover:bg-surface-container disabled:opacity-30 transition-all font-bold"
                        title="Increase available portions"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-[11px] text-on-surface-variant">portions</span>
                  </div>

                  {/* Edit, Pause / Resume, and Delete Buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isUpdating}
                      onClick={() => setEditingDeal(deal)}
                      leftIcon={
                        <span className="material-symbols-outlined text-[16px]">
                          edit
                        </span>
                      }
                    >
                      Edit
                    </Button>
                    <Button
                      variant={deal.status === 'PAUSED' ? 'primary' : 'outline'}
                      size="sm"
                      disabled={isUpdating}
                      onClick={() => handleToggleStatus(deal)}
                      leftIcon={
                        <span className="material-symbols-outlined text-[16px]">
                          {deal.status === 'PAUSED' ? 'play_arrow' : 'pause'}
                        </span>
                      }
                    >
                      {deal.status === 'PAUSED' ? 'Resume' : 'Pause'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isUpdating}
                      onClick={() => setDealToDelete(deal)}
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400 focus:ring-red-400"
                      leftIcon={
                        <span className="material-symbols-outlined text-[16px] text-red-600">
                          delete
                        </span>
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Deal Modal */}
      {editingDeal && (
        <CreateDealModal
          isOpen={Boolean(editingDeal)}
          onClose={() => setEditingDeal(null)}
          dealToEdit={editingDeal}
          onSuccess={(updated) => {
            setListings((prev) =>
              prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
            );
            setEditingDeal(null);
          }}
          onShowToast={onShowToast}
        />
      )}

      {/* Delete Deal Confirmation Modal */}
      {dealToDelete && (
        <Modal
          isOpen={Boolean(dealToDelete)}
          onClose={() => !isDeleting && setDealToDelete(null)}
          title="Delete Food Deal?"
          maxWidth="sm"
          footer={
            <div className="flex items-center justify-end gap-3 w-full">
              <Button
                variant="outline"
                size="md"
                disabled={isDeleting}
                onClick={() => setDealToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                isLoading={isDeleting}
                onClick={handleConfirmDelete}
                leftIcon={<span className="material-symbols-outlined text-[18px]">delete</span>}
              >
                Delete Deal
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-3 py-2">
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Are you sure you want to delete this food deal? This action will remove it from your active listings.
            </p>
            {dealToDelete && (
              <div className="p-3 bg-surface-container-low rounded-2xl border border-outline-variant/30 flex items-center gap-3">
                <img
                  src={
                    dealToDelete.imageUrl ||
                    getFoodFallbackImageUrl({
                      id: dealToDelete.id,
                      title: dealToDelete.title,
                      categoryName: dealToDelete.category?.name,
                    })
                  }
                  alt={dealToDelete.title}
                  onError={(e) =>
                    handleImageError(
                      e,
                      getFoodFallbackImageUrl({
                        id: dealToDelete.id,
                        title: dealToDelete.title,
                        categoryName: dealToDelete.category?.name,
                      })
                    )
                  }
                  className="w-12 h-12 rounded-xl object-cover shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm text-on-surface truncate">
                    {dealToDelete.title}
                  </span>
                  <span className="text-xs text-on-surface-variant truncate">
                    {dealToDelete.category?.name || 'Food Deal'} • {dealToDelete.availableQuantity} portions remaining
                  </span>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PartnerListingsPage;
