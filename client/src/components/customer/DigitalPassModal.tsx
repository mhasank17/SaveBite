import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';
import QRCodeDisplay from '../common/QRCodeDisplay';
import { Order } from '../../types';
import { formatINR } from '../../utils/formatters';

export interface DigitalPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onRedeemOrder?: (orderId: string) => void;
}

export const DigitalPassModal: React.FC<DigitalPassModalProps> = ({
  isOpen,
  onClose,
  order,
  onRedeemOrder,
}) => {
  const [isRedeeming, setIsRedeeming] = useState(false);

  if (!order) return null;

  const isCompleted = order.orderStatus === 'COMPLETED';

  const handleRedeem = () => {
    setIsRedeeming(true);
    setTimeout(() => {
      setIsRedeeming(false);
      if (onRedeemOrder) {
        onRedeemOrder(order.id);
      }
    }, 600);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCompleted ? 'Completed Order Pass' : 'Digital Meal Pickup Pass'}
      subtitle={
        isCompleted
          ? 'This order has been verified and collected'
          : 'Present this digital pass at the counter or to your courier'
      }
      variant="center"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-[11px]">
            <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
            <span>Verified Safe Inspection</span>
          </div>
          <Button variant="primary" size="sm" onClick={onClose}>
            Close Pass
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-space-md items-center text-center">
        {/* Pass Header Banner */}
        <div className="w-full p-4 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-md flex flex-col gap-2.5 text-left relative overflow-hidden">
          <div className="flex items-center justify-between z-10">
            <span className="font-label-sm text-[11px] uppercase tracking-wider bg-on-primary/15 px-2.5 py-0.5 rounded-full font-bold">
              {order.fulfillmentType === 'ECO_COURIER' ? 'Eco Courier' : 'Self-Pickup Tonight'}
            </span>
            <Badge
              variant={isCompleted ? 'verified' : 'live'}
              pulseDot={!isCompleted}
              pulseColor="primary"
            >
              {isCompleted ? 'Meal Collected' : 'Ready for Pickup'}
            </Badge>
          </div>

          <div className="flex flex-col z-10">
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-primary">
              {order.restaurantName}
            </h3>
            <p className="font-body-sm text-body-sm text-on-primary-container truncate">
              {order.dealTitle} ({order.quantity}x)
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-on-primary/20 z-10 text-[12px]">
            <div className="flex flex-col">
              <span className="text-[10px] text-on-primary/70 uppercase">Pickup Window</span>
              <span className="font-bold text-on-primary">
                {order.pickupWindowText || 'Tonight, 8:00 PM – 9:00 PM'}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-on-primary/70 uppercase">Total Paid</span>
              <span className="font-bold text-secondary-fixed text-title-md">
                {formatINR(order.totalPriceInr)}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Vector QR Code Display */}
        <div className="flex flex-col items-center gap-2 py-1">
          <QRCodeDisplay
            value={order.qrSecretToken}
            size={180}
            showCenterLogo
            className={isCompleted ? 'opacity-50 grayscale' : ''}
          />
          <span className="font-label-sm text-[11px] text-on-surface-variant font-medium">
            {isCompleted ? 'Pass Redeemed' : 'Scan to authenticate pickup at counter'}
          </span>
        </div>

        {/* 4-Digit Counter OTP Badge */}
        <div className="w-full p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col items-center gap-1.5">
          <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
            Counter Pickup Code (OTP)
          </span>
          <div className="px-6 py-1.5 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs">
            <span className="font-mono text-3xl font-bold tracking-widest text-primary">
              {order.pickupOtp || order.orderNumber.replace('#', '')}
            </span>
          </div>
          <span className="font-body-sm text-[11px] text-on-surface-variant">
            Show code or QR code to the server when collecting your food box
          </span>
        </div>

        {/* Merchant Location & Directions */}
        {order.restaurantAddress && (
          <div className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-between text-left gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-primary text-[20px] shrink-0">
                location_on
              </span>
              <div className="flex flex-col min-w-0">
                <span className="font-label-md text-[12px] font-bold text-on-surface truncate">
                  Pickup Address
                </span>
                <span className="font-body-sm text-[11px] text-on-surface-variant truncate">
                  {order.restaurantAddress}
                </span>
              </div>
            </div>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(order.restaurantAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-label-sm text-[11px] font-bold shrink-0 flex items-center gap-0.5 hover:underline"
            >
              <span>Map</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </a>
          </div>
        )}

        {/* Interactive Pickup Simulator (for testing & verification) */}
        {!isCompleted && onRedeemOrder && (
          <div className="w-full pt-1">
            <button
              type="button"
              disabled={isRedeeming}
              onClick={handleRedeem}
              className="w-full py-2.5 px-4 rounded-xl bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface font-label-md text-label-md font-bold transition-all flex items-center justify-center gap-2 border border-outline-variant/30 active:scale-98 shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>{isRedeeming ? 'Redeeming Order...' : 'Simulate Counter Pickup (Redeem)'}</span>
            </button>
          </div>
        )}

        {isCompleted && (
          <div className="w-full p-3 rounded-xl bg-primary-fixed/20 border border-primary/20 flex items-center justify-center gap-2 text-primary font-label-md text-label-md font-bold">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span>Order Completed & Enjoyed</span>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DigitalPassModal;
