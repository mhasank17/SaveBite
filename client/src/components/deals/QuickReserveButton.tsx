import React from 'react';
import { formatINR } from '../../utils/formatters';

export interface QuickReserveButtonProps {
  priceInr?: number;
  label?: string;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export const QuickReserveButton: React.FC<QuickReserveButtonProps> = ({
  priceInr,
  label = 'Quick Reserve',
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
      className={`inline-flex items-center justify-center font-bold rounded-xl bg-primary hover:bg-primary-container text-on-primary shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
        sizeStyles[size]
      } ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
      <span>{label}</span>
      {priceInr !== undefined && (
        <span className="bg-on-primary/15 px-2 py-0.5 rounded-md font-mono tabular-nums text-[12px] ml-0.5">
          {formatINR(priceInr)}
        </span>
      )}
      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
    </button>
  );
};

export default QuickReserveButton;
