import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { FoodDeal, Order, PaymentMethod } from '../../types';
import { formatINR } from '../../utils/formatters';
import { APPROVED_CAMPUS_LOCATIONS } from '../../data/mockDeals';
import api from '../../services/api';
import addressApi, { CustomerAddress } from '../../services/addressApi';
import AddressModal from './AddressModal';
import { getFoodFallbackImageUrl, handleImageError } from '../../utils/foodImages';

export interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: FoodDeal;
  initialQuantity?: number;
  initialFulfillment?: 'pickup' | 'delivery';
  onCheckoutSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  deal,
  initialQuantity = 1,
  initialFulfillment = 'delivery',
  onCheckoutSuccess,
}) => {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [fulfillment, setFulfillment] = useState<'pickup' | 'delivery'>(initialFulfillment);

  // Delivery Address State
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [deliveryMode, setDeliveryMode] = useState<'saved_address' | 'campus_point'>('saved_address');
  const [selectedLocationId, setSelectedLocationId] = useState<string>(APPROVED_CAMPUS_LOCATIONS[0].id);
  const [roomNumber, setRoomNumber] = useState('Room 204');
  const [deliveryInstructions, setDeliveryInstructions] = useState('Call upon arrival at hostel gate');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('RAZORPAY_SANDBOX');
  const [upiId, setUpiId] = useState('sarah@okhdfcbank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch saved addresses when modal is opened
  useEffect(() => {
    if (isOpen) {
      addressApi.getAddresses().then((list) => {
        setSavedAddresses(list);
        if (list.length > 0) {
          const storedId = localStorage.getItem('savebite_selected_address_id');
          const matched = storedId ? list.find((a) => a.id === storedId) : null;
          const defaultAddr = matched || list.find((a) => a.isDefault) || list[0];
          setSelectedAddressId(defaultAddr.id);
          setDeliveryMode('saved_address');
        } else {
          setDeliveryMode('campus_point');
        }
      });
    }
  }, [isOpen]);

  const selectedCampusPoint =
    APPROVED_CAMPUS_LOCATIONS.find((loc) => loc.id === selectedLocationId) ||
    APPROVED_CAMPUS_LOCATIONS[0];

  const selectedSavedAddress = savedAddresses.find((a) => a.id === selectedAddressId);

  // Dynamic delivery fee calculation based on selected address / zone
  let calculatedDeliveryFee = 0;
  if (fulfillment === 'delivery') {
    if (deliveryMode === 'saved_address' && selectedSavedAddress) {
      if (selectedSavedAddress.serviceableZone === 'metro_city') {
        calculatedDeliveryFee = deal.deliveryFeeInr && deal.deliveryFeeInr > 40 ? deal.deliveryFeeInr : 40;
      } else {
        calculatedDeliveryFee = deal.deliveryFeeInr || 0; // Free for campus
      }
    } else {
      calculatedDeliveryFee = deal.deliveryFeeInr !== undefined && deal.deliveryFeeInr > 0 ? deal.deliveryFeeInr : 0;
    }
  }

  const itemsTotal = deal.dealPriceInr * quantity;
  const finalTotal = itemsTotal + calculatedDeliveryFee;
  const totalSavings = deal.savingsInr * quantity;
  const totalCo2 = ((deal.co2eSavingsKg || 1.8) * quantity).toFixed(1);

  // Check if selected address is unserviceable
  const isAddressUnserviceable =
    fulfillment === 'delivery' &&
    deliveryMode === 'saved_address' &&
    selectedSavedAddress !== undefined &&
    !selectedSavedAddress.isServiceable;

  const handlePay = async () => {
    if (isAddressUnserviceable) {
      setErrorMessage('Selected delivery address is outside our delivery area. Please select a serviceable address.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setProcessingStatus('Reserving meal portions on server...');

    try {
      let deliveryAddressText: string | undefined = undefined;
      let deliveryAddressIdToSend: string | undefined = undefined;

      if (fulfillment === 'delivery') {
        if (deliveryMode === 'saved_address' && selectedSavedAddress) {
          deliveryAddressIdToSend = selectedSavedAddress.id;
          deliveryAddressText = `${selectedSavedAddress.fullName} (${selectedSavedAddress.phoneNumber}), ${selectedSavedAddress.houseFlatBuilding}, ${selectedSavedAddress.streetArea}${
            selectedSavedAddress.landmark ? ', ' + selectedSavedAddress.landmark : ''
          }, ${selectedSavedAddress.city} - ${selectedSavedAddress.postalCode} [${selectedSavedAddress.addressType}]`;
        } else {
          deliveryAddressText = `${selectedCampusPoint.name}${
            roomNumber.trim() ? ', ' + roomNumber.trim() : ''
          }${deliveryInstructions.trim() ? ' (' + deliveryInstructions.trim() + ')' : ''}`;
        }
      }

      // Step 1: Create Order & atomically reserve inventory on backend
      const orderRes = await api.createOrder({
        listingId: deal.id,
        quantity,
        fulfillmentType: fulfillment === 'delivery' ? 'ECO_COURIER' : 'SELF_PICKUP',
        deliveryAddress: deliveryAddressText,
        deliveryAddressId: deliveryAddressIdToSend,
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

  const handleAddressSavedFromModal = (newAddr: CustomerAddress) => {
    setSavedAddresses((prev) => {
      const exists = prev.some((a) => a.id === newAddr.id);
      if (exists) {
        return prev.map((a) => (a.id === newAddr.id ? newAddr : a));
      }
      return [newAddr, ...prev];
    });
    setSelectedAddressId(newAddr.id);
    setDeliveryMode('saved_address');
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={isProcessing ? () => {} : onClose}
        title="Reserve & Checkout"
        subtitle="Complete your order reservation with instant confirmation"
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
                disabled={isProcessing || isAddressUnserviceable}
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
                {deal.restaurantName} • Delivery / Pickup
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

          {/* Quantity and Fulfillment Options */}
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

            {/* Fulfillment Toggle: Delivery vs Self-Pickup */}
            <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/30 flex flex-col justify-center gap-1.5">
              <span className="font-label-md text-label-md font-bold text-on-surface">Fulfillment Mode</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setFulfillment('delivery')}
                  className={`py-1.5 px-2 rounded-lg font-label-sm text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                    fulfillment === 'delivery'
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">electric_moped</span>
                  <span>Eco-Courier</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setFulfillment('pickup')}
                  className={`py-1.5 px-2 rounded-lg font-label-sm text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                    fulfillment === 'pickup'
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">storefront</span>
                  <span>Counter Pickup</span>
                </button>
              </div>
            </div>
          </div>

          {/* Customer Delivery Address Selection */}
          {fulfillment === 'delivery' && (
            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 flex flex-col gap-3 animate-slide-down">
              <div className="flex items-center justify-between">
                <label className="font-label-md text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-[#006030]">home_pin</span>
                  <span>Delivery Address</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(true)}
                    className="text-[11px] font-bold text-[#006030] hover:text-emerald-800 flex items-center gap-0.5 bg-emerald-100/80 hover:bg-emerald-100 px-2.5 py-1 rounded-full transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    <span>Add New</span>
                  </button>
                </div>
              </div>

              {/* Saved Addresses List / Radio Selection */}
              {savedAddresses.length > 0 ? (
                <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                  {savedAddresses.map((addr) => {
                    const isSelected = deliveryMode === 'saved_address' && selectedAddressId === addr.id;
                    const isCampus = addr.serviceableZone === 'campus' || addr.addressType === 'Hostel';
                    return (
                      <div
                        key={addr.id}
                        onClick={() => {
                          setSelectedAddressId(addr.id);
                          setDeliveryMode('saved_address');
                          setErrorMessage(null);
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-white border-[#006030] shadow-xs ring-1 ring-[#006030]'
                            : 'bg-white/80 border-emerald-200/60 hover:bg-white'
                        }`}
                      >
                        <div className="pt-0.5">
                          <input
                            type="radio"
                            name="checkout_address"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedAddressId(addr.id);
                              setDeliveryMode('saved_address');
                            }}
                            className="text-[#006030] focus:ring-[#006030]"
                          />
                        </div>

                        <div className="flex flex-col min-w-0 flex-1 text-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900">{addr.houseFlatBuilding}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                              {addr.addressType}
                            </span>
                            {addr.isDefault && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-700 text-white">
                                Default
                              </span>
                            )}
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                addr.isServiceable
                                  ? isCampus
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-blue-100 text-blue-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {addr.isServiceable
                                ? isCampus
                                  ? 'Express Zone (FREE)'
                                  : 'Metro (+₹40)'
                                : 'Outside Radius'}
                            </span>
                          </div>

                          <span className="text-slate-600 truncate mt-0.5">
                            {addr.streetArea}, {addr.city} ({addr.postalCode})
                          </span>

                          <span className="text-[11px] text-slate-400">
                            {addr.fullName} • {addr.phoneNumber}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 bg-white/90 rounded-xl border border-emerald-200 flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Quick Delivery Drop Location</span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Free Delivery
                    </span>
                  </div>
                  <select
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    className="w-full h-9 px-2 rounded-lg bg-white border border-emerald-300 text-xs text-slate-900 focus:outline-none"
                  >
                    {APPROVED_CAMPUS_LOCATIONS.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.zone})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="Flat / Floor / Unit (e.g. Unit 204)"
                    className="w-full h-8 px-2.5 rounded-lg bg-white border border-emerald-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={deliveryInstructions}
                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                    placeholder="Instructions (e.g. Call upon arrival at gate)"
                    className="w-full h-8 px-2.5 rounded-lg bg-white border border-emerald-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              )}

              {/* Warning if selected address is out of zone */}
              {isAddressUnserviceable && (
                <div className="p-2.5 bg-red-50 rounded-xl border border-red-200 text-xs text-red-700 flex items-start gap-2 animate-shake">
                  <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">warning</span>
                  <div>
                    <strong>Outside 10 km Service Area:</strong> The selected address is outside our delivery perimeter. Please select a campus hostel or serviceable metro address.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md font-bold text-on-surface">
                Select Payment Method (INR Test Sandbox)
              </span>
              <span className="font-label-sm text-[11px] text-primary font-bold bg-primary-fixed/30 px-2 py-0.5 rounded-full">
                Test Mode
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Razorpay Sandbox Option */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setPaymentMethod('RAZORPAY_SANDBOX')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  paymentMethod === 'RAZORPAY_SANDBOX'
                    ? 'bg-primary-fixed/20 border-primary text-primary font-bold shadow-xs'
                    : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] text-primary shrink-0 mt-0.5">
                  verified
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-md text-[13px] font-bold">Razorpay Test Gateway</span>
                  <span className="font-body-sm text-[11px] text-on-surface-variant">
                    Mock UPI / Cards / Netbanking
                  </span>
                </div>
              </button>

              {/* Simulated UPI Sandbox */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  paymentMethod === 'UPI'
                    ? 'bg-primary-fixed/20 border-primary text-primary font-bold shadow-xs'
                    : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] text-primary shrink-0 mt-0.5">
                  qr_code_scanner
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-md text-[13px] font-bold">UPI / Campus Student Pay</span>
                  <span className="font-body-sm text-[11px] text-on-surface-variant">
                    Instant Virtual UPI Handle
                  </span>
                </div>
              </button>
            </div>

            {paymentMethod === 'UPI' && (
              <div className="p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/20 flex items-center gap-2">
                <span className="font-label-sm text-[11px] text-on-surface-variant font-medium">Student UPI VPA:</span>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="flex-1 h-8 px-2.5 bg-surface-container-lowest rounded-lg border border-outline-variant/30 text-[12px] font-mono text-on-surface focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Bill Breakdown Card */}
          <div className="p-3.5 bg-surface-container-high/40 rounded-xl flex flex-col gap-1.5 border border-outline-variant/20">
            <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
              <span>Item Subtotal ({quantity}x portions)</span>
              <span className="font-medium text-on-surface">{formatINR(itemsTotal)}</span>
            </div>

            {fulfillment === 'delivery' && (
              <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
                <span>
                  {selectedSavedAddress?.serviceableZone === 'metro_city'
                    ? 'Metro Courier Delivery Fee'
                    : 'Campus Delivery Fee'}
                </span>
                <span className="font-medium text-on-surface">
                  {calculatedDeliveryFee > 0 ? formatINR(calculatedDeliveryFee) : 'FREE'}
                </span>
              </div>
            )}

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
                <span className="font-body-sm text-[11px] text-on-surface-variant">Taxes included</span>
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

      {/* Address Modal from Checkout */}
      {isAddressModalOpen && (
        <AddressModal
          isOpen={isAddressModalOpen}
          onClose={() => setIsAddressModalOpen(false)}
          onSaved={handleAddressSavedFromModal}
        />
      )}
    </>
  );
};

export default CheckoutModal;
