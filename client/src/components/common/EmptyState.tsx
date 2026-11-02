import React from 'react';
import Button from './Button';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'restaurant',
  title = 'No Deals Found',
  description = 'Check back later or expand your search radius to discover delicious offers near you.',
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-space-xl text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm ${className}`}
    >
      {/* Icon Circle */}
      <div className="w-16 h-16 rounded-full bg-primary-fixed/40 flex items-center justify-center text-primary mb-space-md shadow-inner">
        <span className="material-symbols-outlined text-[32px]">{icon}</span>
      </div>

      {/* Title & Description */}
      <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">
        {title}
      </h3>
      <p className="font-body-md text-body-md text-on-surface-variant mt-1 max-w-sm leading-relaxed">
        {description}
      </p>

      {/* Action Button */}
      {actionText && onAction && (
        <div className="mt-space-md">
          <Button variant="primary" size="md" onClick={onAction}>
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
