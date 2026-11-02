import React from 'react';
import { formatINR, calculateSavings } from '../../utils/formatters';

export interface PriceDisplayProps {
  originalPrice: number;
  dealPrice: number;
  size?: 'sm' | 'md' | 'lg';
  showSavingsBadge?: boolean;
  highlightDealColor?: boolean;
  className?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  originalPrice,
  dealPrice,
  size = 'md',
  showSavingsBadge = true,
  highlightDealColor = true,
  className = '',
}) => {
  const { discountPercent, savingsInr } = calculateSavings(originalPrice, dealPrice);

  const sizeConfigs = {
    sm: {
      deal: 'text-title-md font-bold',
      original: 'text-body-sm line-through',
      savings: 'text-[10px] px-1.5 py-0.2',
    },
    md: {
      deal: 'text-headline-sm font-bold',
      original: 'text-body-sm line-through',
      savings: 'text-label-sm px-2 py-0.5',
    },
    lg: {
      deal: 'text-headline-lg font-bold',
      original: 'text-body-md line-through',
      savings: 'text-label-sm px-2.5 py-1',
    },
  };

  const config = sizeConfigs[size];

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Top line: Original regular value + Savings percentage */}
      <div className="flex items-center gap-1.5">
        <span className={`font-body text-outline ${config.original}`}>
          {formatINR(originalPrice)}
        </span>
        {showSavingsBadge && discountPercent > 0 && (
          <span
            className={`rounded-md bg-secondary-fixed text-on-secondary-fixed font-bold font-label uppercase tracking-wide ${config.savings}`}
          >
            SAVE {discountPercent}% ({formatINR(savingsInr)} off)
          </span>
        )}
      </div>

      {/* Main Deal Price */}
      <div className="flex items-baseline gap-2 mt-0.5">
        <span
          className={`font-headline tabular-nums tracking-tight ${config.deal} ${
            highlightDealColor ? 'text-primary' : 'text-on-surface'
          }`}
        >
          {formatINR(dealPrice)}
        </span>
        <span className="font-label-sm text-[11px] text-on-surface-variant font-medium">
          Deal Price
        </span>
      </div>
    </div>
  );
};

export default PriceDisplay;
