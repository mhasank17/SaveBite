import React from 'react';
import { formatINR } from '../../utils/formatters';

export interface ClaimFlashButtonProps {
  priceInr?: number;
  label?: string;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export const ClaimFlashButton: React.FC<ClaimFlashButtonProps> = ({
  priceInr,
  label = 'Claim Flash Deal',
  onClick,
  disabled = false,
  size = 'md',
  fullWidth = false,
  className = '',
}) => {
  const sizeStyles = {
    sm: 'h-9 px-3 text-label-sm gap-1',
    md: 'h-11 px-4 text-label-md gap-1.5',
    lg: 'h-14 px-5 text-label-lg gap-2',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center font-bold rounded-xl bg-secondary hover:bg-secondary-container text-on-secondary shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed animate-pulse-once ${
        sizeStyles[size]
      } ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      <span className="material-symbols-outlined text-[18px]">bolt</span>
      <span>{label}</span>
      {priceInr !== undefined && (
        <span className="bg-on-secondary/20 px-2 py-0.5 rounded-md font-mono tabular-nums text-[12px] ml-0.5">
          {formatINR(priceInr)}
        </span>
      )}
    </button>
  );
};

export default ClaimFlashButton;
