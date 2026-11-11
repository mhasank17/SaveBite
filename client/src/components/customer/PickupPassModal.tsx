import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Order } from '../../types';
import { formatINR } from '../../utils/formatters';
import QrCodeView from '../common/QrCodeView';
import api from '../../services/api';

export interface PickupPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  order?: Order | null;
  pass?: {
    orderNumber: string;
    restaurantName: string;
    restaurantAddress?: string;
    dealTitle: string;
    pickupWindow: string;
    quantity: number;
    pickupOtp: string;
    qrSecretToken?: string;
    totalPriceInr?: number;
    orderStatus?: string;
    paymentStatus?: string;
  } | null;
  onOrderStatusChange?: (updatedOrder: Order) => void;
}

export const PickupPassModal: React.FC<PickupPassModalProps> = ({
  isOpen,
  onClose,
  order,
  pass,
  onOrderStatusChange,
}) => {
  const [liveOrder, setLiveOrder] = useState<Order | null>(order || null);

  // Sync state when order prop changes
  useEffect(() => {
    if (order) {
      setLiveOrder(order);
    }
  }, [order]);

  // Automatic real-time status update from backend database
  // Opening/viewing the pass NEVER marks the order as completed (read-only GET)
  // Polls while open to automatically update pass state when verified in Partner Portal
  useEffect(() => {
    if (!isOpen) return;

    const targetOrderId = liveOrder?.id || order?.id;
    if (!targetOrderId) return;

    let isMounted = true;

    const fetchLatestOrderStatus = async () => {
      try {
        const freshOrder = await api.getOrderById(targetOrderId);
        if (isMounted && freshOrder) {
          setLiveOrder((prev) => {
            if (
              !prev ||
              prev.orderStatus !== freshOrder.orderStatus ||
              prev.paymentStatus !== freshOrder.paymentStatus
            ) {
              if (onOrderStatusChange) {
                onOrderStatusChange(freshOrder);
              }
              return freshOrder;
            }
            return prev;
          });
        }
      } catch {
        // Silently catch background refresh hiccups
      }
    };

    // 1. Immediate fetch on modal open to ensure latest database information
    fetchLatestOrderStatus();

    // 2. Poll every 3 seconds while modal is open until order completes
    const intervalId = setInterval(() => {
      if (liveOrder?.orderStatus !== 'COMPLETED') {
        fetchLatestOrderStatus();
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [isOpen, liveOrder?.id, liveOrder?.orderStatus, order?.id, onOrderStatusChange]);

  const currentOrder = liveOrder || order;

  const displayOrderNumber = currentOrder ? currentOrder.orderNumber : pass?.orderNumber || '#8492';
  const displayRestaurant = currentOrder
    ? currentOrder.restaurantName
    : pass?.restaurantName || 'Partner Kitchen';
  const displayRestaurantAddress = currentOrder?.restaurantAddress || pass?.restaurantAddress;
  const displayDealTitle = currentOrder
    ? currentOrder.dealTitle
    : pass?.dealTitle || 'Evening Surplus Food Bag';
  const displayQuantity = currentOrder ? currentOrder.quantity : pass?.quantity || 1;
  const displayPickupWindow = currentOrder
    ? currentOrder.pickupWindowText || 'Tonight, 8:00 PM – 9:00 PM'
    : pass?.pickupWindow || 'Tonight, 8:00 PM – 9:00 PM';
  const rawOrderStatus = currentOrder ? currentOrder.orderStatus : pass?.orderStatus || 'CONFIRMED';
  const rawPaymentStatus = currentOrder ? currentOrder.paymentStatus : pass?.paymentStatus || 'SUCCESS';
  const displayTotalPrice = currentOrder ? currentOrder.totalPriceInr : pass?.totalPriceInr || 149;
  const displayPickupOtp =
    currentOrder?.pickupOtp || pass?.pickupOtp || displayOrderNumber.replace('#', '') || '8492';
  const displayQrToken =
    currentOrder?.qrSecretToken ||
    pass?.qrSecretToken ||
    `SAVEBITE-PASS-${displayOrderNumber.replace('#', '')}-VERIFIED`;

  const isCompleted = rawOrderStatus === 'COMPLETED';

  // 1. Show PAID instead of PENDING PAYMENT when payment is confirmed
  const isPaid =
    rawPaymentStatus === 'SUCCESS' ||
    rawOrderStatus === 'CONFIRMED' ||
    rawOrderStatus === 'READY_FOR_PICKUP' ||
    rawOrderStatus === 'COMPLETED';

  // Order status badge label
  const getOrderStatusLabel = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmed';
      case 'READY_FOR_PICKUP':
        return 'Ready for Pickup';
      case 'COMPLETED':
        return 'Collected';
      case 'PENDING_PAYMENT':
        return 'Awaiting Payment';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status.replace(/_/g, ' ');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCompleted ? 'Meal Collected & Verified' : 'Active Counter Pickup Pass'}
      subtitle={
        isCompleted
          ? 'This order has been verified and collected at the partner kitchen counter'
          : 'Present this digital pass at the restaurant counter upon arrival'
      }
      variant="center"
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-[11px]">
            <span className="material-symbols-outlined text-[16px] text-[#006030]">verified</span>
            <span>Counter Pickup Protected</span>
          </div>
          <Button variant="primary" size="sm" onClick={onClose}>
            {isCompleted ? 'Close' : 'Done'}
          </Button>
        </div>
      }
    >
      {/* Non-scrolling vertical stack: single scrollbar handled solely by Modal */}
      <div className="flex flex-col gap-4 w-full">
        
        {/* Pass Header Banner - Forest Green Stitch Design with ample padding, spacing, and zero clipping */}
        <div
          className={`p-5 sm:p-6 rounded-2xl sm:rounded-3xl text-white shadow-md relative overflow-hidden flex flex-col gap-4 sm:gap-4.5 transition-all shrink-0 w-full ${
            isCompleted
              ? 'bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#1b4332]'
              : 'bg-gradient-to-br from-[#006030] via-[#005229] to-[#004020]'
          }`}
        >
          {/* Subtle Decorative Ambient Spark */}
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

          {/* Row 1: Status Badges - Horizontally aligned with consistent spacing & no overlapping */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 z-10 w-full">
            {/* 1. Fulfillment Type Badge */}
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-white/15 backdrop-blur-xs text-white px-3 py-1.5 rounded-full shrink-0 border border-white/20 shadow-2xs">
              <span className="material-symbols-outlined text-[14px]">storefront</span>
              <span>{isCompleted ? 'Collected at Counter' : 'Counter Pickup Active'}</span>
            </span>

            {/* 2. Order Status Badge */}
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shrink-0 shadow-2xs ${
                isCompleted
                  ? 'bg-emerald-950/70 text-emerald-200 border border-emerald-400/30'
                  : 'bg-white/20 text-white border border-white/25'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isCompleted ? 'bg-emerald-400' : 'bg-emerald-300 animate-pulse'
                }`}
              />
              <span>{getOrderStatusLabel(rawOrderStatus)}</span>
            </span>

            {/* 3. Payment Status Badge: Shows PAID when confirmed, otherwise PENDING PAYMENT */}
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shrink-0 shadow-2xs ${
                isPaid
                  ? 'bg-emerald-400 text-emerald-950 font-extrabold border border-emerald-300'
                  : 'bg-amber-400 text-amber-950 font-extrabold border border-amber-300'
              }`}
            >
              <span className="material-symbols-outlined text-[14px] font-bold">
                {isPaid ? 'check_circle' : 'schedule'}
              </span>
              <span>{isPaid ? 'PAID' : 'PENDING PAYMENT'}</span>
            </span>
          </div>

          {/* Row 2: Restaurant Name & Deal Details - Positioned clearly below badges with dedicated spacing */}
          <div className="flex flex-col z-10 pt-1.5 pb-1 gap-1">
            <span className="text-[11px] text-emerald-200/90 font-bold uppercase tracking-widest">
              Partner Kitchen
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug break-words">
              {displayRestaurant}
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed break-words">
              {displayDealTitle} •{' '}
              <span className="font-semibold text-white">
                {displayQuantity} {displayQuantity > 1 ? 'portions' : 'portion'}
              </span>
            </p>
            {displayRestaurantAddress && (
              <div className="flex items-start gap-1.5 text-xs text-emerald-200/85 mt-0.5">
                <span className="material-symbols-outlined text-[15px] shrink-0 mt-0.5">location_on</span>
                <span className="break-words leading-tight">{displayRestaurantAddress}</span>
              </div>
            )}
          </div>

          {/* Row 3: Pickup Window & Order ID */}
          <div className="flex items-center justify-between pt-3.5 border-t border-white/20 z-10 gap-3">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] sm:text-[11px] text-emerald-200/90 uppercase tracking-wider font-semibold">
                Pickup Window
              </span>
              <span className="text-xs sm:text-sm font-bold text-white break-words">
                {displayPickupWindow}
              </span>
            </div>
            <div className="flex flex-col items-end shrink-0 pl-2">
              <span className="text-[10px] sm:text-[11px] text-emerald-200/90 uppercase tracking-wider font-semibold">
                Order ID
              </span>
              <span className="font-mono text-base sm:text-lg font-black text-amber-300 tracking-wider">
                {displayOrderNumber}
              </span>
            </div>
          </div>
        </div>

        {/* Check-in HUD: QR Code + 4-Digit OTP */}
        <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-50 border border-slate-200/80 flex flex-col items-center text-center gap-4 shadow-xs shrink-0 w-full">
          <div className="flex items-center justify-between w-full px-1">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
              Counter Pickup Verification
            </span>
            <span className="text-[12px] text-[#006030] font-extrabold">
              Total Paid: {formatINR(displayTotalPrice)}
            </span>
          </div>

          {/* SVG QR Code */}
          <div className="relative p-2.5 bg-white rounded-2xl shadow-xs border border-slate-200/60">
            <QrCodeView value={displayQrToken} size={160} showValue={false} />
            {isCompleted && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center gap-1.5 text-emerald-700 font-bold">
                <span className="material-symbols-outlined text-[44px] text-emerald-600">check_circle</span>
                <span className="text-xs uppercase tracking-wider font-extrabold">
                  Verified & Collected
                </span>
                <span className="text-[10px] text-slate-500 font-normal">
                  Order completed at counter
                </span>
              </div>
            )}
          </div>

          {/* 4-Digit OTP Section */}
          <div className="flex flex-col items-center gap-2 w-full">
            <span className="text-xs sm:text-sm text-slate-600 font-semibold">
              Show 4-digit OTP to counter staff:
            </span>
            <div
              className={`px-8 py-3 rounded-2xl bg-white border-2 shadow-xs flex items-center justify-center transition-all ${
                isCompleted
                  ? 'border-slate-300 bg-slate-100'
                  : 'border-[#006030] ring-4 ring-emerald-50'
              }`}
            >
              <span
                className={`font-mono text-3xl sm:text-4xl font-black tracking-widest ${
                  isCompleted ? 'text-slate-400 line-through' : 'text-[#006030]'
                }`}
              >
                {displayPickupOtp}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5">
              {isCompleted
                ? 'PIN verified by partner kitchen • Meal collected'
                : 'Secure counter code • Valid until verified at pickup counter'}
            </span>
          </div>
        </div>

        {/* Safety & Store Instructions */}
        <div className="p-4 bg-emerald-50/80 rounded-xl sm:rounded-2xl border border-emerald-200/60 flex items-start gap-3 text-left shrink-0 w-full">
          <span className="material-symbols-outlined text-[#006030] text-[22px] shrink-0 mt-0.5">
            storefront
          </span>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-[#006030]">
              Direct Restaurant Counter Pickup
            </span>
            <span className="text-[11px] sm:text-xs text-slate-600 leading-relaxed mt-0.5">
              {isCompleted
                ? 'Your order has been verified and collected. Thank you for rescuing surplus food with SaveBite!'
                : 'Present this pass or mention your 4-digit OTP at the counter. The kitchen staff will verify and hand over your meal.'}
            </span>
          </div>
        </div>

      </div>
    </Modal>
  );
};

export default PickupPassModal;
