import React, { useState } from 'react';
import { Order } from '../../types';
import { formatINR } from '../../utils/formatters';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import api from '../../services/api';
import { getFoodFallbackImageUrl, handleImageError } from '../../utils/foodImages';

export interface OrdersPageProps {
  orders: Order[];
  onOpenPass: (order: Order) => void;
  onExploreDeals: () => void;
  onRedeemOrder?: (orderId: string) => void;
  onOrderHistoryCleared?: () => Promise<void> | void;
  onShowToast?: (type: 'success' | 'warning' | 'error' | 'info', message: string, title?: string) => void;
  currentUser?: { role?: string; fullName?: string } | null;
  onRequireLogin?: () => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({
  orders,
  onOpenPass,
  onExploreDeals,
  onRedeemOrder,
  onOrderHistoryCleared,
  onShowToast,
  currentUser,
  onRequireLogin,
}) => {
  const [filterTab, setFilterTab] = useState<'active' | 'history' | 'all'>('active');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const activeOrders = orders.filter(
    (o) =>
      o.orderStatus === 'READY_FOR_PICKUP' ||
      o.orderStatus === 'CONFIRMED' ||
      o.orderStatus === 'PENDING_PAYMENT'
  );
  const completedOrders = orders.filter(
    (o) =>
      o.orderStatus === 'COMPLETED' ||
      o.orderStatus === 'REFUNDED' ||
      o.orderStatus === 'CANCELLED'
  );

  const displayedOrders =
    filterTab === 'active'
      ? activeOrders
      : filterTab === 'history'
      ? completedOrders
      : orders;

  const totalMealsSaved = completedOrders.reduce((sum, o) => sum + o.quantity, 0) + 14;
  const totalMoneySaved = completedOrders.reduce((sum, o) => sum + (o.dealPriceInr * 2.5), 0) + 1420;

  const handleConfirmClear = async () => {
    setIsClearing(true);
    try {
      const res = await api.clearOrderHistory();
      if (onOrderHistoryCleared) {
        await onOrderHistoryCleared();
      }
      setIsConfirmModalOpen(false);
      if (onShowToast) {
        onShowToast(
          'success',
          res.message || 'Order history cleared successfully.',
          'History Cleared'
        );
      }
    } catch (err: any) {
      setIsConfirmModalOpen(false);
      const msg = err?.message || 'Failed to clear order history. Please try again.';
      if (onShowToast) {
        onShowToast('error', msg, 'Error');
      }
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="flex flex-col gap-space-md w-full pb-16">
      {/* Top Header & Eco Impact Milestone HUD */}
      <section className="bg-gradient-to-br from-primary-fixed/30 to-surface-container-low rounded-2xl p-space-md border border-primary/20 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[26px]">receipt_long</span>
          </div>
          <div className="flex flex-col">
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              My Meal Passes & Orders
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Manage your active pickups, view digital passes, and track meals saved.
            </p>
          </div>
        </div>

        {/* Impact Metric Chips */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto overflow-x-auto">
          <div className="px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center gap-1.5 shadow-xs shrink-0">
            <span className="material-symbols-outlined text-primary text-[18px]">takeout_dining</span>
            <div className="flex flex-col">
              <span className="font-label-sm text-[10px] text-on-surface-variant uppercase">Meals Saved</span>
              <span className="font-bold text-[13px] text-primary tabular-nums">{totalMealsSaved}</span>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center gap-1.5 shadow-xs shrink-0">
            <span className="material-symbols-outlined text-secondary text-[18px]">savings</span>
            <div className="flex flex-col">
              <span className="font-label-sm text-[10px] text-on-surface-variant uppercase">Total Saved</span>
              <span className="font-bold text-[13px] text-secondary tabular-nums">{formatINR(Math.round(totalMoneySaved))}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Tabs Navigation */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/30 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterTab('active')}
            className={`px-4 py-2 rounded-xl font-label-md text-label-md font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              filterTab === 'active'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span>Active Passes</span>
            {activeOrders.length > 0 && (
              <span className="min-w-[18px] h-4.5 px-1 rounded-full bg-secondary text-on-secondary text-[10px] flex items-center justify-center font-bold">
                {activeOrders.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('history')}
            className={`px-4 py-2 rounded-xl font-label-md text-label-md font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              filterTab === 'history'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span>Order History</span>
            <span className="text-[11px] opacity-80">({completedOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-4 py-2 rounded-xl font-label-md text-label-md font-bold transition-all shrink-0 ${
              filterTab === 'all'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span>All ({orders.length})</span>
          </button>
        </div>

        {/* Clear History Button - clearly visible on Order History tab */}
        {filterTab === 'history' && (
          <button
            type="button"
            onClick={() => setIsConfirmModalOpen(true)}
            disabled={completedOrders.length === 0}
            className={`self-start sm:self-auto px-3.5 py-2 rounded-xl font-label-sm text-[12px] font-bold transition-all flex items-center gap-1.5 shrink-0 border ${
              completedOrders.length > 0
                ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200 shadow-xs cursor-pointer'
                : 'bg-surface-container text-outline border-outline-variant/30 cursor-not-allowed opacity-50'
            }`}
            title={completedOrders.length > 0 ? 'Clear completed order history' : 'No order history to clear'}
          >
            <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
            <span>Clear History</span>
          </button>
        )}
      </section>

      {/* Orders Catalog Feed */}
      {displayedOrders.length > 0 ? (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
          {displayedOrders.map((order) => {
            const isActive =
              order.orderStatus === 'READY_FOR_PICKUP' ||
              order.orderStatus === 'CONFIRMED' ||
              order.orderStatus === 'PENDING_PAYMENT';

            const statusBadgeText =
              order.orderStatus === 'COMPLETED'
                ? 'Collected at Counter'
                : order.orderStatus === 'READY_FOR_PICKUP'
                ? 'Ready for Pickup'
                : 'Kitchen Preparing';

            return (
              <div
                key={order.id}
                className={`p-space-md rounded-2xl bg-surface-container-lowest border transition-all flex flex-col justify-between gap-space-sm shadow-sm ${
                  isActive
                    ? 'border-primary/40 hover:shadow-md ring-1 ring-primary/10'
                    : 'border-outline-variant/30 opacity-90'
                }`}
              >
                {/* Order Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={order.imageUrl || getFoodFallbackImageUrl({ title: order.dealTitle })}
                      alt={order.dealTitle}
                      onError={(e) => handleImageError(e, getFoodFallbackImageUrl({ title: order.dealTitle }))}
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-outline-variant/20"
                    />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-title-md font-bold text-on-surface">
                          {order.orderNumber}
                        </span>
                        <span className="text-outline text-[12px]">•</span>
                        <span className="font-label-sm text-[11px] text-on-surface-variant truncate">
                          Counter Pickup
                        </span>
                      </div>
                      <span className="font-body-sm text-[12px] text-on-surface-variant truncate">
                        {order.restaurantName}
                      </span>
                    </div>
                  </div>

                  <Badge
                    variant={isActive ? 'live' : 'verified'}
                    pulseDot={isActive}
                    pulseColor="primary"
                    size="sm"
                  >
                    {statusBadgeText}
                  </Badge>
                </div>

                {/* Deal Item Title & Details */}
                <div className="flex flex-col gap-1 p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/20">
                  <h4 className="font-title-md text-[14px] text-on-surface font-bold truncate">
                    {order.dealTitle}
                  </h4>
                  <div className="flex items-center justify-between text-body-sm text-[12px] text-on-surface-variant">
                    <span>Quantity: {order.quantity} portion</span>
                    <span className="font-bold text-primary tabular-nums">
                      {formatINR(order.totalPriceInr)}
                    </span>
                  </div>
                  {order.pickupWindowText && (
                    <div className="flex items-center gap-1 font-label-sm text-[11px] text-primary pt-0.5 font-bold">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      <span>{order.pickupWindowText}</span>
                    </div>
                  )}
                </div>

                {/* Actions Row */}
                <div className="flex items-center justify-between pt-1 border-t border-outline-variant/20 gap-2">
                  {/* OTP / PIN preview pill */}
                  <div className="flex items-center gap-1 text-[12px]">
                    <span className="text-on-surface-variant">
                      Counter OTP:
                    </span>
                    <span className="font-mono font-bold text-primary bg-primary-fixed/30 px-2 py-0.5 rounded-md">
                      {order.pickupOtp}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isActive && onRedeemOrder && (
                      <button
                        type="button"
                        onClick={() => onRedeemOrder(order.id)}
                        className="h-9 px-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-sm text-[12px] font-bold transition-all shrink-0 border border-outline-variant/30"
                      >
                        Redeem
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenPass(order)}
                      className="h-9 px-3.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-sm text-[12px] font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1 shrink-0"
                    >
                      <span className="material-symbols-outlined text-[16px]">qr_code</span>
                      <span>View Pass</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      ) : !currentUser || currentUser.role !== 'CUSTOMER' ? (
        <EmptyState
          icon="account_circle"
          title="Sign in to view orders"
          description="Please sign in to your customer account to track your active food passes and view previous orders."
          actionText="Customer Login"
          onAction={onRequireLogin || onExploreDeals}
        />
      ) : (
        <EmptyState
          icon="shopping_bag"
          title={
            filterTab === 'active'
              ? 'No Active Passes Tonight'
              : 'No Past Orders Found'
          }
          description={
            filterTab === 'active'
              ? 'Discover freshly packed food deals from restaurants near you before the evening cutoff.'
              : 'Your collected meal orders will appear here once picked up.'
          }
          actionText="Browse Today's Deals"
          onAction={onExploreDeals}
        />
      )}
      {/* Confirmation Dialog */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => !isClearing && setIsConfirmModalOpen(false)}
        title="Clear Order History"
        maxWidth="sm"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              type="button"
              onClick={() => setIsConfirmModalOpen(false)}
              disabled={isClearing}
              className="px-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface text-on-surface-variant font-label-md font-bold hover:bg-surface-container transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmClear}
              disabled={isClearing}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-label-md font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isClearing ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  <span>Clearing...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                  <span>Clear History</span>
                </>
              )}
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-3 py-1">
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">warning</span>
          </div>
          <p className="font-body-md text-on-surface text-[14px] leading-relaxed">
            Are you sure you want to clear your order history? This action cannot be undone.
          </p>
          <p className="font-body-sm text-[12px] text-on-surface-variant">
            Active passes and pending pickups will not be affected and will remain in your account.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default OrdersPage;
