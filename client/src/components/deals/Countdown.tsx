import React, { useState, useEffect } from 'react';
import { formatTimerHMS, formatTimerCompact } from '../../utils/formatters';

export interface CountdownProps {
  initialSeconds: number;
  variant?: 'pill' | 'clock' | 'criticalBanner';
  onExpire?: () => void;
  className?: string;
}

export const Countdown: React.FC<CountdownProps> = ({
  initialSeconds,
  variant = 'pill',
  onExpire,
  className = '',
}) => {
  const [seconds, setSeconds] = useState(Math.max(0, initialSeconds));

  useEffect(() => {
    setSeconds(Math.max(0, initialSeconds));
  }, [initialSeconds]);

  useEffect(() => {
    if (seconds <= 0) {
      if (onExpire) onExpire();
      return;
    }

    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onExpire) onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds, onExpire]);

  const isUrgent = seconds < 1800; // less than 30 mins

  if (variant === 'clock') {
    return (
      <div
        className={`font-headline-sm text-headline-sm text-secondary font-bold font-mono tracking-tight bg-surface-container-lowest px-3 py-1 rounded-lg shadow-sm border border-secondary/20 tabular-nums select-none ${className}`}
      >
        {formatTimerHMS(seconds)}
      </div>
    );
  }

  if (variant === 'criticalBanner') {
    return (
      <div
        className={`flex items-center justify-between bg-error/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-on-error font-label-sm text-label-sm shadow-md select-none ${className}`}
      >
        <div className="flex items-center gap-1.5 font-bold">
          <span className="material-symbols-outlined text-[16px] animate-pulse">crisis_alert</span>
          <span>🔥 {formatTimerCompact(seconds)} • Only 1 left!</span>
        </div>
        <span className="text-error-container font-semibold text-[11px]">Final Portion</span>
      </div>
    );
  }

  // Default: pill format (Top-right of card)
  return (
    <div
      className={`rounded-full flex items-center gap-1 shadow-sm font-label text-label-sm text-[11px] px-2.5 py-1 select-none backdrop-blur-md ${
        isUrgent
          ? 'bg-secondary-fixed text-on-secondary-fixed font-bold'
          : 'bg-inverse-surface/85 text-inverse-on-surface font-medium'
      } ${className}`}
    >
      <span
        className={`material-symbols-outlined text-[13px] ${
          isUrgent ? 'text-secondary animate-pulse' : 'text-surface-variant'
        }`}
      >
        schedule
      </span>
      <span className="tabular-nums">{formatTimerCompact(seconds)}</span>
    </div>
  );
};

export default Countdown;
