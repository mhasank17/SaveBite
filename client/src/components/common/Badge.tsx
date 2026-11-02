import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | 'discount'
    | 'hygiene'
    | 'countdown'
    | 'urgent'
    | 'live'
    | 'verified'
    | 'neutral'
    | 'category'
    | 'error';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  pulseDot?: boolean;
  pulseColor?: 'primary' | 'secondary' | 'error';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  icon,
  pulseDot = false,
  pulseColor = 'primary',
  className = '',
}) => {
  const baseStyles =
    'inline-flex items-center gap-1 rounded-full font-semibold select-none transition-all';

  const sizeStyles = {
    sm: 'text-label-sm px-2 py-0.5 text-[11px] leading-tight',
    md: 'text-label-md px-3 py-1 text-[12px] leading-normal',
  };

  const variantStyles = {
    discount:
      'bg-secondary text-on-secondary font-bold uppercase tracking-wider shadow-sm',
    hygiene:
      'bg-primary-fixed text-on-primary-fixed font-bold tracking-wide border border-primary/20',
    verified:
      'bg-primary-fixed text-on-primary-fixed font-bold tracking-wide border border-primary/20',
    countdown:
      'bg-inverse-surface/85 backdrop-blur-sm text-inverse-on-surface font-medium shadow-sm',
    urgent:
      'bg-secondary-fixed text-on-secondary-fixed font-bold border border-secondary/20',
    live:
      'bg-primary-fixed/30 text-primary font-bold uppercase tracking-wider border border-primary/20',
    neutral:
      'bg-surface-container text-on-surface-variant font-medium',
    category:
      'bg-surface-container-high text-on-surface font-semibold hover:bg-surface-container-highest',
    error:
      'bg-error-container text-on-error-container font-bold',
  };

  const pulseDotColors = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    error: 'bg-error',
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {pulseDot && (
        <span className="relative flex h-2 w-2 mr-0.5">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseDotColors[pulseColor]}`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${pulseDotColors[pulseColor]}`}
          />
        </span>
      )}
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      <span className="truncate">{children}</span>
    </span>
  );
};

export default Badge;
