import React from 'react';

export interface StarRatingProps {
  rating: number; // e.g. 4.9
  reviewCount?: number; // e.g. 342
  size?: 'sm' | 'md';
  showPillWrapper?: boolean;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  reviewCount,
  size = 'sm',
  showPillWrapper = true,
  className = '',
}) => {
  const isSm = size === 'sm';

  const content = (
    <div className={`flex items-center gap-1 text-on-surface select-none ${className}`}>
      <span
        className="material-symbols-outlined text-tertiary shrink-0"
        style={{
          fontSize: isSm ? '15px' : '18px',
          fontVariationSettings: "'FILL' 1",
        }}
      >
        star
      </span>
      <span className={`font-label font-bold ${isSm ? 'text-label-sm' : 'text-label-md'}`}>
        {rating.toFixed(1)}
      </span>
      {reviewCount !== undefined && (
        <span className={`font-body text-outline ${isSm ? 'text-[11px]' : 'text-body-sm'}`}>
          ({reviewCount})
        </span>
      )}
    </div>
  );

  if (showPillWrapper) {
    return (
      <div className="inline-flex items-center bg-surface-container-high px-2 py-0.5 rounded-full shadow-2xs">
        {content}
      </div>
    );
  }

  return content;
};

export default StarRating;
