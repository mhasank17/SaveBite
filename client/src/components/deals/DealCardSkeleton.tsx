import React from 'react';

export interface DealCardSkeletonProps {
  className?: string;
  horizontal?: boolean;
}

export const DealCardSkeleton: React.FC<DealCardSkeletonProps> = ({
  className = '',
  horizontal = false,
}) => {
  return (
    <div
      className={`rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden animate-pulse flex flex-col ${
        horizontal ? 'w-[78vw] max-w-[285px] sm:w-[280px] shrink-0' : 'w-full'
      } ${className}`}
      aria-hidden="true"
    >
      {/* Top Image Skeleton */}
      <div className="relative aspect-[16/10] bg-slate-200 w-full">
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <div className="w-12 h-5 rounded-full bg-slate-300" />
          <div className="w-20 h-5 rounded-full bg-slate-300" />
        </div>
        <div className="absolute bottom-2.5 right-2.5">
          <div className="w-24 h-6 rounded-full bg-slate-300" />
        </div>
      </div>

      {/* Overlapping logo placeholder */}
      <div className="relative px-3.5 -mt-5 z-10 flex items-center justify-between">
        <div className="w-10 h-10 rounded-full bg-slate-300 border-2 border-white shadow-sm" />
      </div>

      {/* Content Skeleton */}
      <div className="pt-2 px-3.5 pb-3.5 flex flex-col gap-2">
        <div className="h-4 bg-slate-200 rounded-md w-3/4 mt-1" />
        <div className="h-3 bg-slate-200 rounded-md w-1/2" />
      </div>
    </div>
  );
};

export default DealCardSkeleton;
