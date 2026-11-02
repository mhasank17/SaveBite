import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'urgency' | 'outline' | 'surface' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  rounded?: 'md' | 'lg' | 'xl' | 'full';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  rounded = 'xl',
  leftIcon,
  rightIcon,
  isLoading = false,
  disabled,
  className = '',
  ...props
}) => {
  // Base styles: 8pt rhythm, transition, active bounce micro-interaction
  const baseStyles =
    'inline-flex items-center justify-center font-bold select-none transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

  // Variant mappings aligned with Stitch design tokens
  const variantStyles = {
    primary:
      'bg-primary hover:bg-primary-container text-on-primary shadow-sm focus:ring-primary',
    secondary:
      'bg-secondary hover:bg-secondary-container text-on-secondary shadow-sm focus:ring-secondary',
    urgency:
      'bg-secondary hover:bg-secondary-container text-on-secondary shadow-md focus:ring-secondary animate-pulse-once',
    outline:
      'bg-surface-container-lowest border border-outline-variant hover:bg-surface-container-low text-on-surface focus:ring-primary',
    surface:
      'bg-surface-container hover:bg-surface-container-high text-on-surface focus:ring-primary',
    ghost:
      'bg-transparent hover:bg-surface-container-low text-on-surface focus:ring-primary',
    danger:
      'bg-error hover:bg-error/90 text-on-error shadow-sm focus:ring-error',
  };

  // Size mappings aligned with Stitch tap targets (min 44px on mobile)
  const sizeStyles = {
    sm: 'h-9 px-3 text-label-sm gap-1.5',
    md: 'h-11 px-4 text-label-md gap-2',
    lg: 'h-14 px-6 text-label-lg gap-2.5',
  };

  // Border radius tokens
  const roundedStyles = {
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${roundedStyles[rounded]} ${widthStyle} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>}
          <span className="truncate">{children}</span>
          {rightIcon && <span className="shrink-0 flex items-center">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
