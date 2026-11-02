import React, { useEffect } from 'react';

export interface ToastProps {
  id: string;
  type?: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type = 'success',
  title,
  message,
  duration = 4000,
  onClose,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const typeConfig = {
    success: {
      bg: 'bg-primary text-on-primary',
      icon: 'check_circle',
    },
    warning: {
      bg: 'bg-secondary text-on-secondary',
      icon: 'warning',
    },
    error: {
      bg: 'bg-error text-on-error',
      icon: 'error',
    },
    info: {
      bg: 'bg-surface-container-highest text-on-surface',
      icon: 'info',
    },
  };

  const config = typeConfig[type];

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-3.5 rounded-xl shadow-lg border border-white/10 max-w-sm w-full animate-slide-down transition-all ${config.bg}`}
    >
      <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">
        {config.icon}
      </span>

      <div className="flex flex-col flex-1 min-w-0 pr-1">
        {title && <h5 className="font-title-md text-[13px] font-bold leading-tight">{title}</h5>}
        <p className="font-body-sm text-[12px] opacity-95 leading-normal">{message}</p>
      </div>

      <button
        type="button"
        onClick={() => onClose(id)}
        aria-label="Dismiss toast"
        className="text-current opacity-70 hover:opacity-100 p-0.5 rounded transition-opacity shrink-0"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  );
};

export default Toast;
