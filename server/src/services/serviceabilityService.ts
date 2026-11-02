import { ServiceabilityResult } from '../types/address';

// Approved University Campus PIN codes
const CAMPUS_PIN_CODES = new Set([
  '560092', // Bengaluru University North Campus & Hostel belt
  '110007', // Delhi University North Campus
  '400076', // Powai Campus Zone
  '411007', // Pune University Campus
]);

/**
 * Serviceability Engine for SaveBite
 * Determines whether a customer delivery address is:
 * 1. Inside approved university campus (Hostels & Campus Drop Points)
 * 2. Inside serviceable metro radius (Outside Campus Home & Office Delivery)
 * 3. Outside serviceable delivery boundaries
 */
export class ServiceabilityService {
  /**
   * Evaluate serviceability for a given PIN code, city, and optional coordinates
   */
  public evaluateServiceability(
    postalCode: string,
    city?: string,
    addressText?: string,
    latitude?: number,
    longitude?: number
  ): ServiceabilityResult {
    const cleanPin = (postalCode || '').trim();

    if (!cleanPin || cleanPin.length !== 6 || !/^[1-9][0-9]{5}$/.test(cleanPin)) {
      return {
        isServiceable: false,
        zone: 'out_of_zone',
        zoneName: 'Invalid PIN Code',
        deliveryFeeInr: 0,
        estimatedMinutes: 0,
        message: 'Please provide a valid 6-digit Indian PIN code to verify serviceability.',
      };
    }

    // 1. Express / Local Delivery Zone
    const isCampusPin = CAMPUS_PIN_CODES.has(cleanPin);
    const hasCampusKeywords = addressText
      ? /(?:hostel|campus|academic|library|student|sac|mess|hall\s+of\s+residence)/i.test(addressText)
      : false;

    if (isCampusPin || (hasCampusKeywords && this.isMetroPin(cleanPin))) {
      return {
        isServiceable: true,
        zone: 'campus',
        zoneName: 'Express Delivery Zone',
        deliveryFeeInr: 0, // Free express delivery for surplus meals
        estimatedMinutes: 35,
        message: hasCampusKeywords
          ? '✓ Serviceable: Delivered directly to your campus hostel drop table or gate.'
          : '✓ Serviceable: Delivered directly to your address or hostel drop table by courier.',
      };
    }

    // 2. Serviceable Metro Delivery Zone
    if (this.isMetroPin(cleanPin)) {
      return {
        isServiceable: true,
        zone: 'metro_city',
        zoneName: 'Standard Metro Delivery Zone',
        deliveryFeeInr: 40, // Standard eco-courier delivery
        estimatedMinutes: 45,
        message: '✓ Serviceable: Delivered by eco-courier to your home, office, or selected address.',
      };
    }

    // 3. Out of Zone
    return {
      isServiceable: false,
      zone: 'out_of_zone',
      zoneName: 'Outside Delivery Radius',
      deliveryFeeInr: 0,
      estimatedMinutes: 0,
      message: `PIN code ${cleanPin} is outside our 10 km service radius. SaveBite eco-couriers currently service designated urban, residential, and campus districts only.`,
    };
  }

  /**
   * Checks if PIN code belongs to active metro service zones
   */
  private isMetroPin(pin: string): boolean {
    const prefix3 = parseInt(pin.substring(0, 3), 10);
    const prefix2 = parseInt(pin.substring(0, 2), 10);

    // Bengaluru & Karnataka metro: 560001 - 560110
    if (prefix3 >= 560 && prefix3 <= 563) return true;

    // Delhi NCR metro: 110001 - 110096, 122001 - 122018 (Gurugram), 201301 - 201310 (Noida)
    if (prefix3 >= 110 && prefix3 <= 119) return true;
    if (prefix3 >= 121 && prefix3 <= 122) return true;
    if (prefix3 >= 201 && prefix3 <= 202) return true;

    // Mumbai metro: 400001 - 400104
    if (prefix3 >= 400 && prefix3 <= 405) return true;

    // Pune metro: 411001 - 411065
    if (prefix3 >= 411 && prefix3 <= 413) return true;

    return false;
  }
}

export const serviceabilityService = new ServiceabilityService();
export default serviceabilityService;
