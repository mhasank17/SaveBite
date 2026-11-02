import React from 'react';

export interface DiscountBadgeProps {
  discountPercent?: number;
  customText?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const DiscountBadge: React.FC<DiscountBadgeProps> = ({
  discountPercent,
  customText,
  showIcon = true,
  size = 'md',
  className = '',
}) => {
  const displayText = customText || (discountPercent ? `${discountPercent}% OFF` : 'SPECIAL OFFER');

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px]'
      : 'px-2.5 py-1 text-label-sm text-[11px]';

  return (
    <div
      className={`bg-secondary text-on-secondary rounded-full flex items-center gap-1 shadow-md font-label font-bold uppercase tracking-wider select-none ${sizeClasses} ${className}`}
    >
      {showIcon && (
        <span className="material-symbols-outlined text-[14px]">bolt</span>
      )}
      <span>{displayText}</span>
    </div>
  );
};

export default DiscountBadge;
