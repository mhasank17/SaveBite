import React, { useEffect } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'center' | 'bottomSheet';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  variant = 'center',
  maxWidth = 'md',
}) => {
  // Prevent background body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  const isBottomSheet = variant === 'bottomSheet';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        isBottomSheet ? 'p-0 md:p-space-md' : 'p-3.5 sm:p-4 md:p-space-md'
      }`}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div
        className={`relative z-10 w-full bg-surface-container-lowest shadow-xl flex flex-col max-h-[90vh] transition-all overflow-hidden ${
          maxWidthStyles[maxWidth]
        } ${
          isBottomSheet
            ? 'mt-auto rounded-t-3xl md:rounded-2xl md:my-auto animate-slide-up'
            : 'rounded-2xl m-auto animate-scale-in'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-space-md border-b border-outline-variant/30 shrink-0">
          <div className="flex flex-col min-w-0 pr-2">
            {title && (
              <h3 className="font-headline-sm text-base sm:text-headline-sm text-on-surface font-bold break-words">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="font-body-sm text-xs sm:text-body-sm text-on-surface-variant mt-0.5 break-words">
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-9 h-9 rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Body - Single vertical scroll container */}
        <div className="p-space-md overflow-y-auto flex-1 overscroll-contain">{children}</div>

        {/* Optional Footer */}
        {footer && (
          <div className="p-space-md border-t border-outline-variant/30 bg-surface-container-low/50 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
