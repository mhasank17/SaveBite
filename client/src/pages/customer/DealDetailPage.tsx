import React, { useState } from 'react';
import { FoodDeal } from '../../types';
import { formatINR } from '../../utils/formatters';
import authApi, { AuthUser } from '../../services/authApi';
import { getFoodFallbackImageUrl, handleImageError } from '../../utils/foodImages';

export interface DealDetailPageProps {
  deal: FoodDeal;
  onBack: () => void;
  onReserveSuccess: (deal: FoodDeal, quantity: number, fulfillment?: 'pickup') => void;
  onOpenCheckout?: (deal: FoodDeal, quantity: number, fulfillment?: 'pickup') => void;
  onShowToast: (type: 'success' | 'warning' | 'error' | 'info', message: string, title?: string) => void;
  currentUser?: AuthUser | null;
  onRequireLogin?: () => void;
}

export const DealDetailPage: React.FC<DealDetailPageProps> = ({
  deal,
  onBack,
  onReserveSuccess,
  onOpenCheckout,
  onShowToast,
  currentUser,
  onRequireLogin,
}) => {
  const availableStock = Math.max(0, deal?.availableQuantity ?? 0);
  const isOutOfStock =
    availableStock <= 0 ||
    deal?.status === 'SOLD_OUT' ||
    deal?.status === 'EXPIRED' ||
    deal?.status === 'PAUSED';

  const [quantity, setQuantity] = useState(() => (isOutOfStock ? 0 : 1));
  const [selectedSizeIndex] = useState(0);

  if (!deal) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <span className="material-symbols-outlined text-[48px] text-slate-400 mb-2">error</span>
        <h3 className="font-bold text-lg text-slate-800">Deal Not Found</h3>
        <p className="text-sm text-slate-500 mt-1 mb-4">
          The requested meal listing might have expired or been claimed.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 bg-[#006030] text-white text-sm font-bold rounded-xl"
        >
          Back to Deals
        </button>
      </div>
    );
  }

  const isDemo =
    deal.title?.startsWith('[Demo]') ||
    deal.restaurantName?.startsWith('[Demo]') ||
    deal.hygieneGrade?.toLowerCase().includes('demo');

  const cleanRestaurantName = deal.restaurantName
    ? deal.restaurantName.replace(/^\[Demo\]\s*/i, '').replace(/\s*\(Unverified Sample Partner\)/i, '')
    : 'Local Restaurant';

  const totalPayable = (deal.dealPriceInr || 0) * (isOutOfStock ? 0 : quantity);

  const handleBuyNow = () => {
    if (!deal) {
      onShowToast('error', 'Meal deal information is missing.', 'Error');
      return;
    }

    if (isOutOfStock) {
      onShowToast('error', 'This meal deal is sold out and no longer available.', 'Sold Out');
      return;
    }

    if (quantity < 1) {
      onShowToast('warning', 'Please select at least 1 portion to purchase.', 'Invalid Quantity');
      return;
    }

    if (quantity > availableStock) {
      onShowToast(
        'warning',
        `Only ${availableStock} portion${availableStock > 1 ? 's' : ''} available.`,
        'Stock Limit'
      );
      setQuantity(availableStock);
      return;
    }

    const user = currentUser || authApi.getUser();
    if (!user) {
      onShowToast('info', 'Please sign in to complete your meal purchase.', 'Sign In Required');
      try {
        sessionStorage.setItem(
          'savebite_pending_deal',
          JSON.stringify({ dealId: deal.id, quantity })
        );
      } catch {}

      if (onRequireLogin) {
        onRequireLogin();
      } else {
        window.location.href = '/customer/login';
      }
      return;
    }

    if (onOpenCheckout) {
      onOpenCheckout(deal, quantity, 'pickup');
    } else {
      onReserveSuccess(deal, quantity, 'pickup');
    }
  };

  const mapSearchQuery = encodeURIComponent(
    `${deal.restaurantAddress || cleanRestaurantName} ${deal.restaurantBranch || ''}`.trim()
  );

  return (
    <div className="w-full pb-28 sm:pb-32 bg-slate-50 min-h-screen">
      {/* Top Bar Navigation / Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200/80 shadow-2xs transition-all active:scale-95"
          aria-label="Back to deals list"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Deals</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-[#006030] text-[11px] font-bold">
            <span className="material-symbols-outlined text-[13px]">verified</span>
            <span>Verified Surplus</span>
          </span>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* 1. HERO IMAGE: Top on mobile (order-1), Top-left on desktop (col 1..7, row 1) */}
          <div className="order-1 lg:col-span-7 lg:col-start-1 lg:row-start-1">
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[360px] rounded-3xl overflow-hidden bg-slate-900 shadow-sm border border-slate-100">
              <img
                src={deal.imageUrl || getFoodFallbackImageUrl(deal)}
                alt={deal.title}
                onError={(e) => handleImageError(e, getFoodFallbackImageUrl(deal))}
                className="w-full h-full object-cover"
              />

              {/* Top Gradient Overlay */}
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

              {/* Top-Right Pickup Window Badge */}
              <div className="absolute top-3.5 right-3.5 z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-emerald-300 text-xs font-bold border border-white/10 shadow-sm">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  <span>{deal.pickupWindow?.displayText || 'Today pickup'}</span>
                </span>
              </div>

              {/* Bottom Gradient with Restaurant Identity */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-4 pt-12 flex items-end justify-between gap-3 z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-white shadow-md border-2 border-white overflow-hidden flex items-center justify-center shrink-0">
                    <div className="w-full h-full bg-[#006030] text-white font-bold text-sm flex items-center justify-center">
                      {cleanRestaurantName.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h2 className="font-bold text-base sm:text-lg text-white leading-tight truncate">
                      {cleanRestaurantName}
                    </h2>
                    <span className="text-xs text-white/80 truncate">
                      {deal.restaurantBranch || 'Partner Kitchen'} • Kitchen ~{deal.distanceKm.toFixed(1)} km away
                    </span>
                  </div>
                </div>

                <div className="bg-white/95 backdrop-blur-sm text-slate-900 rounded-xl px-2.5 py-1.5 shadow-md flex flex-col items-end shrink-0">
                  <span className="text-[10px] font-bold text-[#006030] uppercase leading-none">SaveBite Price</span>
                  <span className="text-base font-extrabold text-orange-600 leading-tight">
                    {formatINR(deal.dealPriceInr)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. RIGHT COLUMN: Title, Pricing, Counter Pickup, Portions, Purchase Card
               On mobile: order-2 (directly after photo).
               On desktop: col 8..12, row 1..2, sticky top-24. */}
          <div className="order-2 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:row-span-2 flex flex-col gap-4 lg:sticky lg:top-24">
            
            {/* Meal Title & Highlights Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#006030] tracking-wide uppercase">
                  {deal.categoryName || 'Chef Meal Deal'}
                </span>
                {deal.hygieneGrade && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                    <span className="material-symbols-outlined text-[13px]">verified</span>
                    <span>Hygiene {deal.hygieneGrade}</span>
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
                {deal.title}
              </h1>

              {/* Price Row */}
              <div className="flex items-baseline gap-3 pt-1 border-t border-slate-100">
                <span className="text-2xl sm:text-3xl font-black text-orange-600">
                  {formatINR(deal.dealPriceInr)}
                </span>
                {deal.originalPriceInr > deal.dealPriceInr && (
                  <>
                    <span className="text-sm sm:text-base text-slate-400 line-through">
                      {formatINR(deal.originalPriceInr)}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                      Save {formatINR(deal.savingsInr)} ({deal.discountPercent}% OFF)
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Counter Pickup Status Strip */}
            <div className="py-3 px-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-center justify-between text-xs text-emerald-950 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006030] text-[20px]">
                  storefront
                </span>
                <span className="font-semibold">
                  Counter Pickup: Collect during pickup window
                </span>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full shrink-0 ml-1">
                Counter Pickup Only
              </span>
            </div>

            {/* Portion Size Card */}
            <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Portion Size
              </span>
              <div
                className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all ${
                  selectedSizeIndex === 0
                    ? 'border-[#006030] bg-emerald-50/70 shadow-xs'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#006030] text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[14px]">check</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900">
                      Regular Meal Portion
                    </span>
                    <span className="text-xs text-slate-500">
                      Serves 1–2 portions • {deal.availableQuantity} available
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <span className="text-sm font-extrabold text-[#006030]">
                    {formatINR(deal.dealPriceInr)}
                  </span>
                  {deal.originalPriceInr > deal.dealPriceInr && (
                    <span className="text-[10px] text-slate-400 line-through">
                      {formatINR(deal.originalPriceInr)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Purchase Action Card */}
            <div className="bg-white rounded-3xl p-5 border-2 border-slate-200/90 shadow-md flex flex-col gap-4">
              {/* Quantity Selector & Stock Indicator */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Quantity
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {isOutOfStock ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200/60">
                        <span className="material-symbols-outlined text-[14px]">cancel</span>
                        Sold Out
                      </span>
                    ) : availableStock <= 2 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60">
                        <span className="material-symbols-outlined text-[14px] text-amber-700">warning</span>
                        Only {availableStock} left!
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                        <span className="material-symbols-outlined text-[14px] text-emerald-700">inventory_2</span>
                        {availableStock} available
                      </span>
                    )}
                  </div>
                </div>

                {/* Stepper Controls */}
                <div className="flex items-center bg-slate-100 rounded-2xl p-1 shrink-0">
                  <button
                    type="button"
                    disabled={quantity <= 1 || isOutOfStock}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-slate-800 disabled:opacity-30 shadow-xs hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <span className="material-symbols-outlined text-[18px]">remove</span>
                  </button>
                  <span className="w-10 text-center text-sm font-bold text-slate-900 tabular-nums">
                    {isOutOfStock ? 0 : quantity}
                  </span>
                  <button
                    type="button"
                    disabled={quantity >= availableStock || isOutOfStock}
                    onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                    className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-slate-800 disabled:opacity-30 shadow-xs hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                  </button>
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-600 font-medium">
                    {isOutOfStock ? 0 : quantity} portion{quantity > 1 ? 's' : ''} × {formatINR(deal.dealPriceInr)}
                  </span>
                  {deal.originalPriceInr > deal.dealPriceInr && !isOutOfStock && (
                    <span className="text-[11px] font-semibold text-emerald-700">
                      Savings: {formatINR(deal.savingsInr * quantity)}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Payable</span>
                  <span className="text-xl font-black text-[#006030]">
                    {formatINR(totalPayable)}
                  </span>
                </div>
              </div>

              {/* Orange "Buy Now" Action Button */}
              {isOutOfStock ? (
                <button
                  type="button"
                  disabled
                  className="w-full h-13 py-3.5 px-5 bg-slate-200 text-slate-400 font-bold rounded-2xl flex items-center justify-center gap-2 text-base cursor-not-allowed shadow-none"
                >
                  <span className="material-symbols-outlined text-[18px]">block</span>
                  <span>Sold Out · Out of Stock</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full h-13 py-3.5 px-5 bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-between text-base cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                    <span>Buy Now · {formatINR(totalPayable)}</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-xs bg-black/15 px-2.5 py-1 rounded-xl">
                    <span>Proceed to Pay</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </div>
                </button>
              )}

              {/* Handover Assurance */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 text-center">
                <span className="material-symbols-outlined text-[14px] text-emerald-700">verified</span>
                <span>Guaranteed Fresh Surplus • Delivered to Your Door or Counter Pickup</span>
              </div>
            </div>

          </div>

          {/* 3. LEFT DETAILS: What you could get, Kitchen location, Handover protocol
               On mobile: order-3 (after Purchase Card).
               On desktop: col 1..7, row 2. */}
          <div className="order-3 lg:col-span-7 lg:col-start-1 lg:row-start-2 flex flex-col gap-4">
            
            {/* "What You Could Get" Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-emerald-700">restaurant</span>
                  <span>What you could get</span>
                </h3>
                <span className="text-[11px] font-semibold text-[#006030] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  Fresh Daily Surplus
                </span>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed">
                {deal.description}
              </p>

              {/* Verified dietary tags if present */}
              {deal.dietaryTags && deal.dietaryTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                  {deal.dietaryTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200/60 text-slate-700 text-[11px] font-medium px-2.5 py-1 rounded-full"
                    >
                      <span className="material-symbols-outlined text-[13px] text-emerald-700">
                        check_circle
                      </span>
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Allergen advisory if present */}
              {deal.allergenNotice && (
                <div className="p-3 bg-slate-50 rounded-2xl text-xs text-slate-600 flex items-start gap-2.5 border border-slate-100">
                  <span className="material-symbols-outlined text-slate-400 text-[16px] shrink-0 mt-0.5">
                    info
                  </span>
                  <span>{deal.allergenNotice}</span>
                </div>
              )}
            </div>

            {/* Kitchen Location Card */}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapSearchQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-white rounded-3xl border border-slate-100 shadow-xs hover:bg-slate-50/80 transition-colors group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#006030] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">storefront</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-700">Kitchen Location</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">Partner Kitchen</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 truncate mt-0.5">
                    {deal.restaurantAddress || `${cleanRestaurantName}, ${deal.restaurantBranch}`}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Kitchen ~{deal.distanceKm.toFixed(1)} km away • Counter pickup only
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-700 text-[20px] shrink-0 ml-2">
                open_in_new
              </span>
            </a>

            {/* Secure Handover Protocol Card */}
            <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#006030] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">storefront</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-900">Secure Counter Handover Protocol</span>
                <span className="text-xs text-slate-500 mt-0.5">
                  Show your 4-digit OTP or digital QR pass at the store counter to collect your order.
                </span>
              </div>
            </div>

            {/* Demo Notice if applicable */}
            {isDemo && (
              <div className="p-3.5 bg-amber-50 rounded-3xl border border-amber-300/70 flex items-start gap-2.5 shadow-xs">
                <span className="material-symbols-outlined text-amber-700 text-[20px] shrink-0 mt-0.5">
                  science
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-amber-900">
                    Sample Sandbox Listing • Pending KYC
                  </span>
                  <span className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    Development test record for reservation and counter pickup verification testing.
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default DealDetailPage;
