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
