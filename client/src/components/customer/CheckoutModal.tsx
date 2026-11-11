import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { FoodDeal, Order } from '../../types';
import { formatINR } from '../../utils/formatters';
import api from '../../services/api';
import { getFoodFallbackImageUrl, handleImageError } from '../../utils/foodImages';

export interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: FoodDeal;
  initialQuantity?: number;
  initialFulfillment?: 'pickup';
  onCheckoutSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  deal,
  initialQuantity = 1,
  onCheckoutSuccess,
}) => {
  const [quantity, setQuantity] = useState(initialQuantity);

  // Payment State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const itemsTotal = deal.dealPriceInr * quantity;
  const finalTotal = itemsTotal; // Counter Pickup only
  const totalSavings = deal.savingsInr * quantity;
  const totalCo2 = ((deal.co2eSavingsKg || 1.8) * quantity).toFixed(1);

  const handlePay = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setProcessingStatus('Reserving meal portions on server...');

    try {
      // Step 1: Create Order & atomically reserve inventory on backend for Counter Pickup
      const orderRes = await api.createOrder({
        listingId: deal.id,
        quantity,
        fulfillmentType: 'SELF_PICKUP',
      });

      const { order, razorpay } = orderRes.data;

      // Step 2: Razorpay Sandbox test checkout
      setProcessingStatus(`Initiating Razorpay Sandbox test checkout for ${formatINR(order.totalPriceInr)}...`);
      await new Promise((resolve) => setTimeout(resolve, 800));

      const paymentId = `pay_test_${Date.now()}`;
      const sandboxSignature = `sandbox_sig_${paymentId}`;

      // Step 3: Cryptographic payment verification on backend
      setProcessingStatus('Verifying payment signature with Razorpay gateway...');
      const verifyRes = await api.verifyPayment(order.id, {
        razorpayOrderId: razorpay.razorpayOrderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: sandboxSignature,
      });

      setIsProcessing(false);
      onCheckoutSuccess(verifyRes.data);
      onClose();
    } catch (err) {
      console.error('[Checkout Error]', err);
      setIsProcessing(false);
      setErrorMessage((err as Error).message || 'Failed to complete order reservation.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isProcessing ? () => {} : onClose}
      title="Reserve & Checkout"
      subtitle="Complete your order reservation with instant counter pickup confirmation"
      variant="bottomSheet"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5 font-label-sm text-[11px] text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-primary">lock</span>
            <span>Razorpay 256-bit Secure Test Checkout</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isProcessing}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={isProcessing}
              onClick={handlePay}
            >
              {isProcessing ? 'Processing...' : `Pay ${formatINR(finalTotal)}`}
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-space-md">
        {/* Deal Overview Card */}
        <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
          <img
            src={deal.imageUrl || getFoodFallbackImageUrl(deal)}
            alt={deal.title}
            onError={(e) => handleImageError(e, getFoodFallbackImageUrl(deal))}
            className="w-16 h-16 rounded-xl object-cover shrink-0"
          />
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-label-sm text-[10px] uppercase font-bold text-primary bg-primary-fixed/40 px-2 py-0.2 rounded-full">
                {deal.categoryName}
              </span>
              <span className="font-label-sm text-[11px] text-on-surface-variant truncate">
                {deal.pickupWindow.displayText}
              </span>
            </div>
            <h4 className="font-title-md text-[14px] text-on-surface font-bold truncate mt-0.5">
              {deal.title}
            </h4>
            <span className="font-body-sm text-[12px] text-on-surface-variant truncate">
              {deal.restaurantName} • Counter Pickup
            </span>
          </div>
          <div className="text-right shrink-0">
            <div className="font-headline-sm text-headline-sm font-bold text-primary tabular-nums">
              {formatINR(deal.dealPriceInr)}
            </div>
            <span className="font-label-sm text-[10px] text-secondary font-bold">
              {deal.discountPercent}% OFF
            </span>
          </div>
        </div>

        {/* Quantity Selector & Fulfillment Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
          {/* Quantity Selector */}
          <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/30 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-label-md text-label-md font-bold text-on-surface">Quantity</span>
              <span className="font-body-sm text-[11px] text-on-surface-variant">
                Max {deal.availableQuantity} portions
              </span>
            </div>
            <div className="flex items-center bg-surface-container-low rounded-lg p-1 border border-outline-variant/30">
              <button
                type="button"
                disabled={quantity <= 1 || isProcessing}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-md bg-surface-container-lowest flex items-center justify-center text-on-surface disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[18px]">remove</span>
              </button>
              <span className="w-8 text-center font-bold text-on-surface tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                disabled={quantity >= deal.availableQuantity || isProcessing}
                onClick={() => setQuantity((q) => Math.min(deal.availableQuantity, q + 1))}
                className="w-8 h-8 rounded-md bg-surface-container-lowest flex items-center justify-center text-on-surface disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            </div>
          </div>

          {/* Fulfillment Status: Counter Pickup Only */}
          <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-fixed/30 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">storefront</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-label-md text-label-md font-bold text-on-surface">Counter Pickup</span>
                <span className="font-label-sm text-[10px] font-bold text-primary bg-primary-fixed/40 px-1.5 py-0.2 rounded">
                  Only Option
                </span>
              </div>
              <span className="font-body-sm text-[11px] text-on-surface-variant truncate">
                Pick up directly from restaurant counter
              </span>
            </div>
          </div>
        </div>

        {/* Counter Pickup Instructions Banner */}
        <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200/70 flex items-start gap-2.5 text-xs text-emerald-950">
          <span className="material-symbols-outlined text-[#006030] text-[18px] shrink-0 mt-0.5">
            storefront
          </span>
          <div className="flex flex-col">
            <span className="font-bold">Self-Pickup at Partner Counter</span>
            <span className="text-emerald-900 mt-0.5 leading-relaxed">
              Show your 4-digit OTP or digital QR pass at <strong>{deal.restaurantName}</strong> ({deal.restaurantAddress || deal.restaurantBranch || 'Store Counter'}) during {deal.pickupWindow.displayText} to collect your order.
            </span>
          </div>
        </div>

        {/* Payment & Reservation Details */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md font-bold text-on-surface">
              Payment & Confirmation
            </span>
            <span className="font-label-sm text-[11px] text-primary font-bold bg-primary-fixed/30 px-2 py-0.5 rounded-full">
              Test Sandbox
            </span>
          </div>

          <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-fixed/40 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">verified_user</span>
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-title-md text-[13px] font-bold text-on-surface">
                  Razorpay Secure Test Gateway
                </span>
                <span className="font-label-sm text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                  Zero Fee Sandbox
                </span>
              </div>
              <span className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">
                Instant digital reservation. Your counter pickup pass and 4-digit code will be generated immediately upon confirmation.
              </span>
            </div>
          </div>
        </div>

        {/* Bill Breakdown Card */}
        <div className="p-3.5 bg-surface-container-high/40 rounded-xl flex flex-col gap-1.5 border border-outline-variant/20">
          <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
            <span>Item Subtotal ({quantity}x portions)</span>
            <span className="font-medium text-on-surface">{formatINR(itemsTotal)}</span>
          </div>

          <div className="flex justify-between font-body-sm text-body-sm text-primary font-bold">
            <span>Total Savings</span>
            <span>-{formatINR(totalSavings)}</span>
          </div>

          <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
            <span>CO₂e Prevented</span>
            <span className="text-primary font-bold">~{totalCo2} kg</span>
          </div>

          <div className="flex justify-between items-baseline pt-2 mt-1 border-t border-outline-variant/30">
            <div className="flex flex-col">
              <span className="font-title-md text-title-md font-bold text-on-surface">Total Payable</span>
              <span className="font-body-sm text-[11px] text-on-surface-variant">Taxes included • Counter Pickup</span>
            </div>
            <span className="font-headline-lg text-headline-lg font-bold text-primary tabular-nums">
              {formatINR(finalTotal)}
            </span>
          </div>
        </div>

        {/* Processing State Feedback */}
        {isProcessing && (
          <div className="p-3 bg-primary-fixed/20 rounded-xl border border-primary/20 flex items-center gap-2.5 text-primary text-xs font-semibold animate-pulse">
            <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
            <span>{processingStatus}</span>
          </div>
        )}

        {/* Server Error Alert Banner */}
        {errorMessage && (
          <div className="p-3 bg-red-50 rounded-xl border border-red-200 flex items-start gap-2 text-xs text-red-700">
            <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CheckoutModal;
