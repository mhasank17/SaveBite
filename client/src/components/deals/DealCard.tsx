import React from 'react';
import { FoodDeal } from '../../types';
import { formatINR } from '../../utils/formatters';
import { getFoodFallbackImageUrl, handleImageError } from '../../utils/foodImages';

export interface DealCardProps {
  deal: FoodDeal;
  onReserve?: (deal: FoodDeal) => void;
  onClick?: (deal: FoodDeal) => void;
  className?: string;
  horizontal?: boolean;
}

export const DealCard: React.FC<DealCardProps> = ({
  deal,
  onClick,
  className = '',
  horizontal = false,
}) => {
  // Compute status pill text (e.g. "Closing in 3 min" if < 30m, else pickup window)
  const remainingSeconds = deal.pickupWindow?.expiresInSeconds ?? 3600;
  const minutesLeft = Math.max(1, Math.floor(remainingSeconds / 60));
  
  let statusText = 'Counter Pickup';
  let isExpiringSoon = false;

  if (remainingSeconds < 1800) {
    statusText = `Closing in ${minutesLeft} min`;
    isExpiringSoon = true;
  } else if (remainingSeconds < 3600) {
    statusText = `Ending in ${minutesLeft} min`;
    isExpiringSoon = true;
  } else if (deal.pickupWindow?.displayText) {
    statusText = deal.pickupWindow.displayText;
  }

  const isDemo =
    deal.title?.startsWith('[Demo]') ||
    deal.restaurantName?.startsWith('[Demo]') ||
    deal.hygieneGrade?.toLowerCase().includes('demo');

  const cleanRestaurantName = deal.restaurantName
    ? deal.restaurantName.replace(/^\[Demo\]\s*/i, '').replace(/\s*\(Unverified Sample Partner\)/i, '')
    : 'Partner Kitchen';

  // Restaurant logo initial
  const restaurantInitial = cleanRestaurantName.charAt(0).toUpperCase() || 'S';

  // Only show rating pill when verified rating data actually exists (no fake 4.8 fallback)
  const hasVerifiedRating = typeof deal.restaurantRating === 'number' && deal.restaurantRating > 0;

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`${deal.title} by ${cleanRestaurantName}, from ₹${deal.dealPriceInr}`}
      onClick={() => onClick && onClick(deal)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick && onClick(deal);
        }
      }}
      className={`group relative rounded-2xl bg-white shadow-xs border border-slate-100/90 hover:border-emerald-200/90 hover:shadow-xl hover:shadow-emerald-950/10 hover:-translate-y-1.5 active:scale-[0.98] transition-all duration-300 ease-out cursor-pointer select-none overflow-hidden flex flex-col touch-pan-y focus-visible:ring-2 focus-visible:ring-[#006030] focus-visible:ring-offset-2 outline-none motion-reduce:transform-none motion-reduce:transition-none ${
        horizontal ? 'w-[78vw] min-w-[260px] max-w-[285px] sm:w-[280px] md:w-[295px] shrink-0 snap-start' : 'w-full'
      } ${className}`}
    >
      {/* Top Image Container */}
      <div className="relative aspect-[16/10] bg-slate-100 w-full overflow-hidden">
        <img
          src={deal.imageUrl || getFoodFallbackImageUrl(deal)}
          alt={deal.title}
          loading="lazy"
          draggable={false}
          onError={(e) => handleImageError(e, getFoodFallbackImageUrl(deal))}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out pointer-events-none select-none motion-reduce:transform-none"
        />

        {/* Gradient scrim for pill readability */}
        <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

        {/* Top-Left: Rating Pill (Only if verified data exists) & Counter Pickup/Status Pill */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10 max-w-[calc(100%-20px)] flex-wrap">
          {hasVerifiedRating ? (
            <div className="bg-black/70 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
              <span className="text-amber-400 text-[12px]">★</span>
              <span>{deal.restaurantRating!.toFixed(1)}</span>
            </div>
          ) : (
            <div className="bg-emerald-900/80 backdrop-blur-md text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
              <span className="material-symbols-outlined text-[12px]">storefront</span>
              <span>Counter Pickup</span>
            </div>
          )}

          <div
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-sm truncate max-w-[140px] ${
              isExpiringSoon
                ? 'bg-orange-600 text-white animate-pulse'
                : 'bg-black/60 backdrop-blur-md text-white/95'
            }`}
          >
            {statusText}
          </div>
        </div>

        {/* Bottom-Right: Price Pill "from ₹129" with original struck through */}
        <div className="absolute bottom-2.5 right-2.5 z-10">
          <div className="bg-orange-600 text-white font-bold text-xs px-2.5 py-1 rounded-full shadow-md flex items-center gap-1.5">
            {deal.originalPriceInr > deal.dealPriceInr && (
              <span className="text-[11px] font-normal line-through text-orange-200">
                {formatINR(deal.originalPriceInr)}
              </span>
            )}
            <span>from {formatINR(deal.dealPriceInr)}</span>
          </div>
        </div>
      </div>

      {/* Overlapping Restaurant Logo at Bottom-Left */}
      <div className="relative px-3.5 -mt-5 z-20 flex items-center justify-between">
        <div className="w-10 h-10 rounded-full bg-white shadow-md border-2 border-white overflow-hidden flex items-center justify-center shrink-0">
          <div className="w-full h-full bg-[#006030] text-white font-bold text-xs flex items-center justify-center">
            {restaurantInitial}
          </div>
        </div>

        {/* Demo / KYC Pending badge if applicable */}
        {isDemo && (
          <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider">
            Demo • KYC Pending
          </span>
        )}
      </div>

      {/* Restaurant Info & Pickup Details */}
      <div className="pt-2 px-3.5 pb-3 flex flex-col gap-0.5 flex-1 justify-between">
        <div className="flex flex-col">
          <h4 className="font-bold text-sm text-slate-900 truncate group-hover:text-[#006030] transition-colors">
            {cleanRestaurantName}
          </h4>
          <p className="text-xs text-slate-500 truncate mt-0.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px] text-emerald-700">
              storefront
            </span>
            <span>Counter Pickup</span>
          </p>
        </div>

        {/* Meal Title & Portions Left */}
        <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 gap-2">
          <span className="truncate flex-1 text-slate-600 font-medium">
            {deal.title.replace(/^\[Demo\]\s*/i, '')}
          </span>
          <span className="text-emerald-700 font-semibold shrink-0">
            {deal.availableQuantity} left
          </span>
        </div>
      </div>
    </article>
  );
};

export default DealCard;
