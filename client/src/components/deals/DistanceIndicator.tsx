import React from 'react';
import { formatDistance } from '../../utils/formatters';

export interface DistanceIndicatorProps {
  distanceKm: number;
  size?: 'sm' | 'md';
  className?: string;
}

export const DistanceIndicator: React.FC<DistanceIndicatorProps> = ({
  distanceKm,
  size = 'md',
  className = '',
}) => {
  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px]'
      : 'px-2.5 py-1 text-label-md text-[12px]';

  return (
    <div
      className={`bg-surface-container-lowest/90 backdrop-blur-md text-on-surface rounded-full flex items-center gap-1 shadow-xs font-label font-medium select-none ${sizeClasses} ${className}`}
    >
      <span className="material-symbols-outlined text-primary text-[14px]">
        near_me
      </span>
      <span>{formatDistance(distanceKm)}</span>
    </div>
  );
};

export default DistanceIndicator;
