import React from 'react';

export interface UrgencyMeterProps {
  totalQuantity: number;
  availableQuantity: number;
  size?: 'sm' | 'md';
  showLabels?: boolean;
  className?: string;
}

export const UrgencyMeter: React.FC<UrgencyMeterProps> = ({
  totalQuantity,
  availableQuantity,
  size = 'md',
  showLabels = true,
  className = '',
}) => {
  const safeTotal = Math.max(1, totalQuantity);
  const safeAvailable = Math.max(0, Math.min(safeTotal, availableQuantity));
  const claimed = safeTotal - safeAvailable;
  const claimedPercent = Math.round((claimed / safeTotal) * 100);

  // Dynamic urgency color tiering based on remaining stock
  const isCritical = safeAvailable <= 1 || claimedPercent >= 90;
  const isUrgent = !isCritical && (safeAvailable <= 3 || claimedPercent >= 70);

  let fillColor = 'bg-primary';
  let textColor = 'text-primary';
  let pulseColor = 'bg-primary';

  if (isCritical) {
    fillColor = 'bg-error';
    textColor = 'text-error';
    pulseColor = 'bg-error';
  } else if (isUrgent) {
    fillColor = 'bg-secondary';
    textColor = 'text-secondary';
    pulseColor = 'bg-secondary';
  }

  const heightClass = size === 'sm' ? 'h-1.5' : 'h-2.5';

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      {showLabels && (
        <div className="flex items-center justify-between font-label text-label-sm">
          {/* Left: Urgency count with animated pulse */}
          <span className={`font-bold flex items-center gap-1.5 ${textColor}`}>
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseColor}`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${pulseColor}`}
              />
            </span>
            {safeAvailable === 1
              ? 'Only 1 meal remaining!'
              : safeAvailable === 0
              ? 'Sold out for today'
              : `Only ${safeAvailable} meals remaining!`}
          </span>

          {/* Right: Claimed progress */}
          <span className="text-on-surface-variant font-medium text-[11px]">
            {claimed} of {safeTotal} claimed ({claimedPercent}%)
          </span>
        </div>
      )}

      {/* Progress Track */}
      <div
        className={`w-full ${heightClass} bg-surface-container-high rounded-full overflow-hidden`}
        role="progressbar"
        aria-valuenow={claimedPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${fillColor}`}
          style={{ width: `${claimedPercent}%` }}
        />
      </div>
    </div>
  );
};

export default UrgencyMeter;
