import React from 'react';
import StarRating from '../common/StarRating';

export interface MerchantBadgeProps {
  name: string;
  hygieneGrade?: string; // e.g. "Grade A"
  rating?: number;
  reviewCount?: number;
  distanceKm?: number;
  address?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const MerchantBadge: React.FC<MerchantBadgeProps> = ({
  name,
  hygieneGrade = 'Grade A',
  rating,
  reviewCount,
  distanceKm,
  address,
  size = 'md',
  className = '',
}) => {
  return (
    <div className={`flex items-start justify-between gap-space-xs w-full ${className}`}>
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-headline-sm text-[16px] md:text-headline-sm text-on-surface font-bold truncate">
            {name}
          </span>
          {hygieneGrade && (
            hygieneGrade.toLowerCase().includes('demo') ||
            hygieneGrade.toLowerCase().includes('pending') ||
            hygieneGrade.toLowerCase().includes('uninspected') ? (
              <span className="bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider shrink-0 border border-amber-400/30 flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[11px]">pending</span>
                Demo / Unverified
              </span>
            ) : (
              <span className="bg-primary-fixed/60 text-on-primary-fixed-variant text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider shrink-0 border border-primary/20 flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[11px]">verified</span>
                {hygieneGrade}
              </span>
            )
          )}
        </div>

        {(address || distanceKm !== undefined) && (
          <div className="flex items-center gap-1 text-on-surface-variant font-body text-[12px] mt-0.5 truncate">
            <span className="material-symbols-outlined text-[14px] text-outline shrink-0">
              storefront
            </span>
            <span className="truncate">
              {address ? `${address} • ` : ''}
              {distanceKm !== undefined ? `${distanceKm.toFixed(1)} km` : ''}
            </span>
          </div>
        )}
      </div>

      {rating !== undefined && (
        <div className="shrink-0 mt-0.5">
          <StarRating rating={rating} reviewCount={reviewCount} size={size === 'sm' ? 'sm' : 'md'} />
        </div>
      )}
    </div>
  );
};

export default MerchantBadge;
