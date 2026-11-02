import React from 'react';

export interface LoadingStateProps {
  type?: 'card' | 'spinner' | 'list' | 'screen';
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'card',
  message = 'Loading delicious meal deals...',
  className = '',
}) => {
  if (type === 'spinner') {
    return (
      <div className={`flex flex-col items-center justify-center p-space-lg gap-3 ${className}`}>
        <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
        {message && (
          <p className="font-label-md text-label-md text-on-surface-variant animate-pulse">
            {message}
          </p>
        )}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className={`flex flex-col gap-space-sm w-full animate-pulse ${className}`}>
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="flex items-center gap-3 p-space-sm bg-surface-container-lowest rounded-xl border border-outline-variant/30"
          >
            <div className="w-16 h-16 rounded-lg bg-surface-container-high shrink-0" />
            <div className="flex flex-col flex-1 gap-2">
              <div className="h-4 w-3/4 rounded bg-surface-container-high" />
              <div className="h-3 w-1/2 rounded bg-surface-container" />
              <div className="h-4 w-1/4 rounded bg-surface-container-high" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'screen') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-space-lg gap-4 text-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <div className="flex flex-col gap-1">
          <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">
            SaveBite
          </h4>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{message}</p>
        </div>
      </div>
    );
  }

  // Default: Skeleton DealCard
  return (
    <div
      className={`flex flex-col bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-outline-variant/30 animate-pulse ${className}`}
    >
      {/* 16:9 Image Placeholder */}
      <div className="w-full aspect-[16/9] bg-surface-container-high" />

      {/* Body Placeholder */}
      <div className="p-space-md flex flex-col gap-space-xs">
        <div className="h-5 w-4/5 rounded bg-surface-container-high" />
        <div className="h-3.5 w-3/5 rounded bg-surface-container" />

        {/* Urgency Meter Bar Placeholder */}
        <div className="h-2 w-full rounded-full bg-surface-container-high my-2" />

        {/* Pricing Row Placeholder */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex flex-col gap-1">
            <div className="h-3 w-16 rounded bg-surface-container" />
            <div className="h-6 w-20 rounded bg-surface-container-high" />
          </div>
          <div className="h-10 w-28 rounded-xl bg-surface-container-high" />
        </div>
      </div>
    </div>
  );
};

export default LoadingState;
