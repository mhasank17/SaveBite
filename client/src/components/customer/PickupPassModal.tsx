import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { Order } from '../../types';
import { formatINR } from '../../utils/formatters';
import QrCodeView from '../common/QrCodeView';

export interface PickupPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  order?: Order | null;
  pass?: {
    restaurantName: string;
    dealTitle: string;
    pickupWindow: string;
    orderNumber: string;
    quantity?: number;
    orderStatus?: string;
    paymentStatus?: string;
    totalPriceInr?: number;
    pickupOtp?: string;
    qrSecretToken?: string;
    completedAt?: string;
  };
}

export const PickupPassModal: React.FC<PickupPassModalProps> = ({
  isOpen,
  onClose,
  order,
  pass,
}) => {
  const isDelivery = order?.fulfillmentType === 'ECO_COURIER';
  const displayOrderNumber = order ? order.orderNumber : pass?.orderNumber || '#8492';
  const displayRestaurant = order ? order.restaurantName : pass?.restaurantName || 'The Daily Dough Bakery';
  const displayDealTitle = order ? order.dealTitle : pass?.dealTitle || 'Evening Mystery Patisserie Bag';
  const displayQuantity = order ? order.quantity : pass?.quantity || 1;
  const displayPickupWindow = order
    ? order.pickupWindowText || 'Tonight, 8:00 PM – 9:00 PM'
    : pass?.pickupWindow || 'Tonight, 8:00 PM – 9:00 PM';
  const displayOrderStatus = order ? order.orderStatus : pass?.orderStatus || 'CONFIRMED';
  const displayPaymentStatus = order ? order.paymentStatus : pass?.paymentStatus || 'SUCCESS';
  const displayTotalPrice = order ? order.totalPriceInr : pass?.totalPriceInr || 149;
  const displayPickupOtp = order?.pickupOtp || pass?.pickupOtp || displayOrderNumber.replace('#', '') || '8492';
  const displayQrToken =
    order?.qrSecretToken ||
    pass?.qrSecretToken ||
    `SAVEBITE-PASS-${displayOrderNumber.replace('#', '')}-VERIFIED`;

  const isCompleted = displayOrderStatus === 'COMPLETED';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isCompleted
          ? isDelivery
            ? 'Delivery Completed'
            : 'Meal Collected & Verified'
          : isDelivery
          ? 'Delivery Digital Pass'
          : 'Active Meal Pickup Pass'
      }
      subtitle={
        isCompleted
          ? isDelivery
            ? 'This order has been verified and received at your delivery address'
            : 'This order has already been verified and collected at the counter'
          : isDelivery
          ? 'Show this digital PIN or QR to the courier upon delivery'
          : 'Present this digital pass at the restaurant counter upon arrival'
      }
      variant="center"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-[11px]">
            <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
            <span>Secure Delivery Handover Protected</span>
          </div>
          <Button variant="primary" size="sm" onClick={onClose}>
            {isCompleted ? 'Close' : 'Done'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-space-md max-h-[75vh] overflow-y-auto pr-1">
        
        {/* Pass Header Banner */}
        <div
          className={`p-4 rounded-2xl text-on-primary shadow-md relative overflow-hidden flex flex-col gap-3 ${
            isCompleted
              ? 'bg-gradient-to-br from-secondary to-secondary-container'
              : 'bg-gradient-to-br from-primary to-primary-container'
          }`}
        >
          <div className="flex items-center justify-between z-10">
            <span className="font-label-sm text-[11px] uppercase tracking-wider bg-on-primary/15 px-2.5 py-0.5 rounded-full font-bold">
              {isCompleted
                ? isDelivery
                  ? 'Delivered to Campus'
                  : 'Collected at Counter'
                : isDelivery
                ? 'Campus Delivery Active'
                : 'Pickup Window Active'}
            </span>
            <div className="flex items-center gap-1.5">
              <Badge variant={isCompleted ? 'verified' : 'live'} pulseDot={!isCompleted} pulseColor="primary">
                {displayOrderStatus.replace(/_/g, ' ')}
              </Badge>
              <span className="text-[10px] font-bold uppercase bg-on-primary/20 text-on-primary px-2 py-0.5 rounded-full">
                {displayPaymentStatus}
              </span>
            </div>
          </div>

          <div className="flex flex-col z-10">
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-primary">
              {displayRestaurant}
            </h3>
            <p className="font-body-sm text-body-sm text-on-primary-container mt-0.5">
              {displayDealTitle} ({displayQuantity} {displayQuantity > 1 ? 'portions' : 'portion'})
            </p>
          </div>

          {/* Delivery Location Tag if delivery */}
          {isDelivery && order?.deliveryAddress && (
            <div className="bg-white/15 backdrop-blur-xs p-2 rounded-xl flex items-center gap-2 text-xs text-white z-10">
              <span className="material-symbols-outlined text-[16px]">domain</span>
              <span className="truncate font-medium">{order.deliveryAddress}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-on-primary/20 z-10">
            <div className="flex flex-col">
              <span className="font-label-sm text-[10px] text-on-primary/70 uppercase">
                {isDelivery ? 'Est. Delivery Window' : 'Pickup Window'}
              </span>
              <span className="font-label-md text-label-md font-bold text-on-primary">
                {displayPickupWindow}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-label-sm text-[10px] text-on-primary/70 uppercase">Order ID</span>
              <span className="font-headline-sm text-headline-sm font-mono font-bold text-secondary-fixed">
                {displayOrderNumber}
              </span>
            </div>
          </div>
        </div>

        {/* Check-in HUD: QR Code + 4-Digit OTP */}
        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col items-center text-center gap-3">
          <div className="flex items-center justify-between w-full px-1">
            <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
              {isDelivery ? 'Delivery Handover Verification' : 'Counter Pickup Verification'}
            </span>
            <span className="font-label-sm text-[11px] text-primary font-bold">
              Total Paid: {formatINR(displayTotalPrice)}
            </span>
          </div>

          {/* SVG QR Code */}
          <div className="relative">
            <QrCodeView value={displayQrToken} size={150} showValue={false} />
            {isCompleted && (
              <div className="absolute inset-0 bg-surface/90 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center gap-1 text-secondary font-bold">
                <span className="material-symbols-outlined text-[48px]">check_circle</span>
                <span className="text-xs uppercase tracking-wider">
                  {isDelivery ? 'Delivered' : 'Collected'}
                </span>
              </div>
            )}
          </div>

          {/* 4-Digit OTP Section */}
          <div className="flex flex-col items-center gap-1.5 w-full">
            <span className="text-xs text-on-surface-variant font-medium">
              {isDelivery
                ? 'Show this 4-digit PIN to your courier at handover:'
                : 'Or show this 4-digit code to counter staff:'}
            </span>
            <div className="px-6 py-2 rounded-2xl bg-surface-container-lowest border-2 border-primary/40 shadow-xs flex items-center justify-center">
              <span className="font-mono text-3xl font-extrabold tracking-widest text-primary">
                {displayPickupOtp}
              </span>
            </div>
            <span className="text-[10px] text-on-surface-variant mt-0.5">
              Secure single-use verification PIN • Guards against unauthorized collection
            </span>
          </div>
        </div>

        {/* Safety & Store Instructions */}
        <div className="p-3 bg-primary-fixed/20 rounded-xl border border-primary/20 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">
            verified_user
          </span>
          <div className="flex flex-col min-w-0">
            <span className="font-label-sm text-label-sm text-primary font-bold">
              Delivery Protected
            </span>
            <span className="font-body-sm text-[12px] text-on-surface-variant leading-relaxed">
              {isDelivery
                ? 'Your meal is prepared fresh and delivered directly to your selected delivery address. Complete handover by sharing your PIN.'
                : 'Order confirmed and paid. Ready for counter pickup during the scheduled window.'}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PickupPassModal;
