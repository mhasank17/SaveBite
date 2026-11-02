export type AddressType = 'Home' | 'Hostel' | 'Work' | 'Other';

export interface CustomerAddress {
  id: string;
  userId: string;
  fullName: string;
  phoneNumber: string;
  houseFlatBuilding: string;
  streetArea: string;
  landmark?: string;
  postalCode: string;
  city: string;
  state: string;
  addressType: AddressType;
  isDefault: boolean;
  deliveryInstructions?: string;
  latitude?: number;
  longitude?: number;
  isServiceable: boolean;
  serviceableZone?: 'campus' | 'metro_city' | 'out_of_zone';
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressInput {
  fullName: string;
  phoneNumber: string;
  houseFlatBuilding: string;
  streetArea: string;
  landmark?: string;
  postalCode: string;
  city: string;
  state: string;
  addressType: AddressType;
  isDefault?: boolean;
  deliveryInstructions?: string;
  latitude?: number;
  longitude?: number;
}

export type UpdateAddressInput = Partial<CreateAddressInput>;

export interface ServiceabilityResult {
  isServiceable: boolean;
  zone: 'campus' | 'metro_city' | 'out_of_zone';
  zoneName: string;
  deliveryFeeInr: number;
  estimatedMinutes: number;
  message: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const getAuthHeaders = (): Record<string, string> => {
  const token =
    localStorage.getItem('savebite_token') ||
    localStorage.getItem('savebite_auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

export const addressApi = {
  /**
   * Fetch all saved addresses for the customer
   */
  async getAddresses(): Promise<CustomerAddress[]> {
    const token = localStorage.getItem('savebite_token') || localStorage.getItem('savebite_auth_token');
    if (!token) {
      return [];
    }

    try {
      const res = await fetch(`${API_BASE_URL}/addresses`, {
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data?.addresses)) {
          localStorage.setItem('savebite_customer_addresses', JSON.stringify(json.data.addresses));
          return json.data.addresses;
        }
      }
    } catch (err) {
      console.warn('[addressApi.getAddresses] Backend unavailable, using local cache:', err);
    }

    const cached = localStorage.getItem('savebite_customer_addresses');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // Fallback
      }
    }

    return [];
  },

  /**
   * Get single address by ID
   */
  async getAddressById(id: string): Promise<CustomerAddress | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/addresses/${id}`, {
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.address) {
          return json.data.address;
        }
      }
    } catch (err) {
      console.warn('[addressApi.getAddressById] Backend unavailable:', err);
    }

    const list = await this.getAddresses();
    return list.find((a) => a.id === id) || null;
  },

  /**
   * Create a new delivery address
   */
  async createAddress(input: CreateAddressInput): Promise<CustomerAddress> {
    try {
      const res = await fetch(`${API_BASE_URL}/addresses`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(input),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to save address.');
      }

      // Refresh cache
      const existing = await this.getAddresses();
      const updatedList = input.isDefault
        ? [json.data.address, ...existing.map((a) => ({ ...a, isDefault: false }))]
        : [...existing, json.data.address];
      localStorage.setItem('savebite_customer_addresses', JSON.stringify(updatedList));

      return json.data.address;
    } catch (err: any) {
      // If server error, rethrow
      if (err.message && !err.message.includes('fetch')) {
        throw err;
      }

      // Offline fallback: Create locally
      const isCampus = input.postalCode === '560092' || input.postalCode === '110007' || input.postalCode === '400076' || input.postalCode === '411007';
      const fallbackAddress: CustomerAddress = {
        ...input,
        id: `addr-local-${Date.now()}`,
        userId: 'demo-user-cust-sarah',
        isDefault: Boolean(input.isDefault),
        isServiceable: true,
        serviceableZone: isCampus ? 'campus' : 'metro_city',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const existing = await this.getAddresses();
      const updatedList = fallbackAddress.isDefault
        ? [fallbackAddress, ...existing.map((a) => ({ ...a, isDefault: false }))]
        : [...existing, fallbackAddress];
      localStorage.setItem('savebite_customer_addresses', JSON.stringify(updatedList));

      return fallbackAddress;
    }
  },

  /**
   * Update an existing delivery address
   */
  async updateAddress(id: string, input: UpdateAddressInput): Promise<CustomerAddress> {
    try {
      const res = await fetch(`${API_BASE_URL}/addresses/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(input),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to update address.');
      }

      const existing = await this.getAddresses();
      const updatedList = existing.map((a) => {
        if (a.id === id) {
          return json.data.address;
        }
        if (input.isDefault) {
          return { ...a, isDefault: false };
        }
        return a;
      });
      localStorage.setItem('savebite_customer_addresses', JSON.stringify(updatedList));

      return json.data.address;
    } catch (err: any) {
      if (err.message && !err.message.includes('fetch')) {
        throw err;
      }

      const existing = await this.getAddresses();
      const target = existing.find((a) => a.id === id);
      if (!target) throw new Error('Address not found');

      const updated: CustomerAddress = {
        ...target,
        ...input,
        updatedAt: new Date().toISOString(),
      };

      const updatedList = existing.map((a) => {
        if (a.id === id) return updated;
        if (input.isDefault) return { ...a, isDefault: false };
        return a;
      });
      localStorage.setItem('savebite_customer_addresses', JSON.stringify(updatedList));

      return updated;
    }
  },

  /**
   * Delete an address
   */
  async deleteAddress(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/addresses/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to delete address.');
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('fetch')) {
        throw err;
      }
    }

    const existing = await this.getAddresses();
    const target = existing.find((a) => a.id === id);
    const remaining = existing.filter((a) => a.id !== id);

    if (target?.isDefault && remaining.length > 0) {
      remaining[0].isDefault = true;
    }

    localStorage.setItem('savebite_customer_addresses', JSON.stringify(remaining));
    return true;
  },

  /**
   * Set address as default
   */
  async setDefaultAddress(id: string): Promise<CustomerAddress> {
    try {
      const res = await fetch(`${API_BASE_URL}/addresses/${id}/default`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });

      const json = await res.json();
      if (res.ok && json.success && json.data?.address) {
        const existing = await this.getAddresses();
        const updatedList = existing.map((a) => ({
          ...a,
          isDefault: a.id === id,
        }));
        localStorage.setItem('savebite_customer_addresses', JSON.stringify(updatedList));
        return json.data.address;
      }
    } catch (err) {
      console.warn('[addressApi.setDefaultAddress] Offline fallback:', err);
    }

    const existing = await this.getAddresses();
    const target = existing.find((a) => a.id === id);
    if (!target) throw new Error('Address not found');

    const updated = { ...target, isDefault: true };
    const updatedList = existing.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    localStorage.setItem('savebite_customer_addresses', JSON.stringify(updatedList));

    return updated;
  },

  /**
   * Check serviceability for PIN code
   */
  async checkServiceability(
    postalCode: string,
    city?: string,
    latitude?: number,
    longitude?: number
  ): Promise<ServiceabilityResult> {
    try {
      const res = await fetch(`${API_BASE_URL}/addresses/check-serviceability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postalCode, city, latitude, longitude }),
      });

      const json = await res.json();
      if (res.ok && json.success && json.data) {
        return json.data;
      }
      if (json.message) {
        return {
          isServiceable: false,
          zone: 'out_of_zone',
          zoneName: 'Invalid Input',
          deliveryFeeInr: 0,
          estimatedMinutes: 0,
          message: json.message,
        };
      }
    } catch (err) {
      console.warn('[addressApi.checkServiceability] Offline fallback:', err);
    }

    // Client-side fallback check
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

    const campusPins = ['560092', '110007', '400076', '411007'];
    if (campusPins.includes(cleanPin)) {
      return {
        isServiceable: true,
        zone: 'campus',
        zoneName: 'University Campus & Hostels',
        deliveryFeeInr: 0,
        estimatedMinutes: 35,
        message: '✓ Serviceable: Delivered directly to your campus hostel drop table or gate.',
      };
    }

    const prefix3 = parseInt(cleanPin.substring(0, 3), 10);
    if ((prefix3 >= 560 && prefix3 <= 563) || (prefix3 >= 110 && prefix3 <= 119) || (prefix3 >= 400 && prefix3 <= 405) || (prefix3 >= 411 && prefix3 <= 413)) {
      return {
        isServiceable: true,
        zone: 'metro_city',
        zoneName: 'Surrounding Metro District (Outside Campus)',
        deliveryFeeInr: 40,
        estimatedMinutes: 45,
        message: '✓ Serviceable: Delivered by eco-courier to your home or office.',
      };
    }

    return {
      isServiceable: false,
      zone: 'out_of_zone',
      zoneName: 'Outside Delivery Radius',
      deliveryFeeInr: 0,
      estimatedMinutes: 0,
      message: `PIN code ${cleanPin} is outside our 10 km service radius. SaveBite eco-couriers currently service university campuses and surrounding metro neighborhoods only.`,
    };
  },
};

export default addressApi;
