import React, { useState } from 'react';
import { getFoodFallbackImageUrl } from '../../utils/foodImages';

export interface FoodImageAreaProps {
  src: string;
  alt: string;
  aspectRatio?: '4/3' | '16/9' | 'square';
  topLeft?: React.ReactNode;
  topRight?: React.ReactNode;
  bottomLeft?: React.ReactNode;
  bottomRight?: React.ReactNode;
  className?: string;
}

export const FoodImageArea: React.FC<FoodImageAreaProps> = ({
  src,
  alt,
  aspectRatio = '16/9',
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  const aspectStyles = {
    '4/3': 'aspect-[4/3]',
    '16/9': 'aspect-[16/9]',
    'square': 'aspect-square',
  };

  // Category/title-aware fallback image
  const fallbackUrl = getFoodFallbackImageUrl({ title: alt });

  return (
    <div
      className={`relative w-full overflow-hidden bg-surface-container-low ${aspectStyles[aspectRatio]} ${className}`}
    >
      {/* Food Photography */}
      <img
        src={hasError ? fallbackUrl : src}
        alt={alt}
        onError={() => setHasError(true)}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />

      {/* Atmospheric Scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

      {/* Top Left Overlay (Discount Pill) */}
      {topLeft && <div className="absolute top-2.5 left-2.5 z-10">{topLeft}</div>}

      {/* Top Right Overlay (Countdown / Quick action) */}
      {topRight && <div className="absolute top-2.5 right-2.5 z-10">{topRight}</div>}

      {/* Bottom Left Overlay (Merchant Tag / Location) */}
      {bottomLeft && <div className="absolute bottom-2.5 left-2.5 z-10">{bottomLeft}</div>}

      {/* Bottom Right Overlay (Distance chip / Special tag) */}
      {bottomRight && <div className="absolute bottom-2.5 right-2.5 z-10">{bottomRight}</div>}
    </div>
  );
};

export default FoodImageArea;
