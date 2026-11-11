/**
 * SaveBite Currency & Formatting Utilities
 * Standardized for Indian Rupee (₹ / INR) and Indian Numbering System
 */

/**
 * Formats a numeric amount in Indian Rupees (₹) using Indian numbering system
 * Examples:
 *   149 -> "₹149"
 *   2185 -> "₹2,185"
 *   12480 -> "₹12,480"
 *   124000 -> "₹1,24,000"
 *   48290 -> "₹48,290"
 */
export const formatINR = (amount: number, showDecimals = false): string => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }

  // Use en-IN locale for Indian numbering formatting (lakhs/crores)
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);

  return formatted;
};

/**
 * Calculates and formats discount and savings
 */
export const calculateSavings = (
  originalPrice: number,
  dealPrice: number
): {
  discountPercent: number;
  savingsInr: number;
  discountBadgeText: string;
  savingsText: string;
} => {
  const savings = Math.max(0, originalPrice - dealPrice);
  const percent = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;

  return {
    discountPercent: percent,
    savingsInr: savings,
    discountBadgeText: `${percent}% OFF`,
    savingsText: `SAVE ${percent}% (${formatINR(savings)} off)`,
  };
};

/**
 * Formats distances in kilometers
 * Examples: 0.4 -> "0.4 km away", 1.2 -> "1.2 km away"
 */
export const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${km.toFixed(1)} km away`;
  }
  return `${km.toFixed(1)} km away`;
};

/**
 * Formats seconds into HH:MM:SS countdown format
 * Example: 2320 -> "00:38:40"
 */
export const formatTimerHMS = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return '00:00:00';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * Formats remaining seconds into compact text
 * Examples: 2320 -> "38m left", 120 -> "2m left"
 */
export const formatTimerCompact = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return 'Expired';
  const mins = Math.floor(totalSeconds / 60);
  const hrs = Math.floor(mins / 60);

  if (hrs > 0) {
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m left`;
  }
  return `${mins}m left`;
};

/**
 * Formats pickup windows
 * Example: ("20:00", "21:00") -> "Tonight, 8:00 PM – 9:00 PM"
 */
export const formatPickupWindow = (startTime: string, endTime: string, prefix = 'Tonight'): string => {
  const formatTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    if (isNaN(h)) return t;
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(m || 0).padStart(2, '0')} ${period}`;
  };

  return `${prefix}, ${formatTime(startTime)} – ${formatTime(endTime)}`;
};

export interface ParsedPickupWindow {
  date: string;
  startTime: string;
  endTime: string;
  displayText: string;
  expiresInSeconds: number;
}

/**
 * Computes actual pickup window and remaining seconds until pickup closing time.
 * Handles 24-hour ("19:00", "21:30") and 12-hour ("7:00 PM", "9:30 PM") formats,
 * window strings ("19:00 – 21:30", "Tonight, 8:00 PM – 9:00 PM"), and explicit expiresInSeconds.
 */
export const parseDealPickupWindow = (deal: {
  pickupStartTime?: string;
  pickupEndTime?: string;
  pickupWindowText?: string;
  pickupWindow?: {
    date?: string;
    startTime?: string;
    endTime?: string;
    displayText?: string;
    expiresInSeconds?: number;
  };
}): ParsedPickupWindow => {
  let startTime = deal.pickupStartTime || deal.pickupWindow?.startTime || '';
  let endTime = deal.pickupEndTime || deal.pickupWindow?.endTime || '';
  const windowText = deal.pickupWindowText || deal.pickupWindow?.displayText || '';

  // Extract from windowText if startTime or endTime is not directly given
  if ((!startTime || !endTime) && windowText) {
    const m24 = windowText.match(/(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})/);
    if (m24) {
      if (!startTime) startTime = m24[1];
      if (!endTime) endTime = m24[2];
    } else {
      const m12 = windowText.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*[-–—]\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
      if (m12) {
        if (!startTime) startTime = m12[1].trim();
        if (!endTime) endTime = m12[2].trim();
      }
    }
  }

  if (!startTime) startTime = '19:00';
  if (!endTime) endTime = '21:30';

  const parseHM = (timeStr: string) => {
    const isPM = /pm/i.test(timeStr);
    const isAM = /am/i.test(timeStr);
    const clean = timeStr.replace(/[^0-9:]/g, '');
    const parts = clean.split(':').map(Number);
    let h = parts[0] || 0;
    const m = parts[1] || 0;
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    return { hours: h, minutes: m };
  };

  const startHM = parseHM(startTime);
  const endHM = parseHM(endTime);

  const now = new Date();
  const closingDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    endHM.hours,
    endHM.minutes,
    0
  );

  let expiresInSeconds = Math.floor((closingDate.getTime() - now.getTime()) / 1000);

  // If closing was earlier today (or past midnight) but deal is active, look at next pickup window cycle
  if (expiresInSeconds <= 0) {
    const nextClosing = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      endHM.hours,
      endHM.minutes,
      0
    );
    expiresInSeconds = Math.floor((nextClosing.getTime() - now.getTime()) / 1000);
  }

  // If deal had an explicit valid positive expiresInSeconds, respect it
  if (typeof deal.pickupWindow?.expiresInSeconds === 'number' && deal.pickupWindow.expiresInSeconds > 0) {
    expiresInSeconds = deal.pickupWindow.expiresInSeconds;
  }

  const to12h = (hm: { hours: number; minutes: number }) => {
    const period = hm.hours >= 12 ? 'PM' : 'AM';
    const h12 = hm.hours % 12 === 0 ? 12 : hm.hours % 12;
    return `${h12}:${String(hm.minutes).padStart(2, '0')} ${period}`;
  };

  const displayText =
    windowText && (windowText.includes('PM') || windowText.includes('AM'))
      ? windowText
      : `Tonight, ${to12h(startHM)} – ${to12h(endHM)}`;

  return {
    date: 'Today',
    startTime,
    endTime,
    displayText,
    expiresInSeconds: Math.max(0, expiresInSeconds),
  };
};

/**
 * Deterministically generates a realistic nearby distance (0.4 km - 3.8 km)
 * based on a unique restaurant / listing identifier when distanceKm is not provided.
 */
export const getDeterministicDistance = (id: string): number => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const positive = Math.abs(hash);
  return Math.round((((positive % 35) + 4) / 10) * 10) / 10;
};
