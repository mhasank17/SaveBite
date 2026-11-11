export interface PartnerRestaurant {
  id: string;
  name: string;
  branchName: string;
  address: string;
  city: string;
  phone?: string;
  hygieneGrade: string;
  licenseNumber: string;
  licenseDocumentUrl?: string;
  kycStatus: string;
  isStoreLive: boolean;
  isDemo: boolean;
  rating: number;
  reviewCount: number;
  metrics: {
    activeListingsCount: number;
    todayOrdersCount: number;
    pendingPickupsCount: number;
    totalMealsRescued: number;
    totalRevenueInr: number;
    co2eSavedKg: number;
  };
}

export interface CreateListingData {
  title: string;
  description?: string;
  categoryId: string;
  imageUrl?: string;
  originalPriceInr: number;
  surplusPriceInr: number;
  totalQuantity: number;
  pickupStartTime: string;
  pickupEndTime: string;
  dietaryTags?: string[];
  allergenNotice?: string;
  co2eSavingsKg?: number;
}

export interface FoodSaleItem {
  listingId: string;
  foodItemName: string;
  categoryName: string;
  quantitySold: number;
  ordersCount: number;
  grossSalesInr: number;
  commissionInr: number;
  partnerEarningsInr: number;
  paymentStatus: 'SETTLED' | 'SCHEDULED' | 'PENDING';
  orderDates?: string[];
  firstOrderDate?: string;
  lastOrderDate?: string;
}

export interface PartnerEarnings {
  restaurantId: string;
  grossRevenueInr: number;
  commissionPercent: number;
  commissionDeductedInr: number;
  netPayoutInr: number;
  pendingPayoutInr: number;
  totalItemsSold?: number;
  totalOrdersCount?: number;
  salesBreakdown?: FoodSaleItem[];
  bankAccount: {
    bankName: string;
    accountNumberEnding: string;
    ifscCode: string;
    status: string;
  };
  payoutSchedule: string;
  recentPayouts: Array<{
    id: string;
    amountInr: number;
    status: string;
    payoutDate: string;
    bankReferenceId: string;
  }>;
}

const getPartnerAuthHeader = (): string => {
  const token = localStorage.getItem('savebite_token');
  return token ? `Bearer ${token}` : '';
};

export const partnerApi = {
  /**
   * Fetch partner restaurant details & metrics
   */
  async getRestaurant(): Promise<PartnerRestaurant> {
    const authHeader = getPartnerAuthHeader();
    if (!authHeader) {
      throw new Error('Unauthorized: No active partner session.');
    }

    const res = await fetch('/api/v1/partner/restaurant', {
      headers: { Authorization: authHeader },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Failed to fetch partner restaurant (${res.status})`);
    }

    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }

    throw new Error('Invalid restaurant response from server.');
  },

  /**
   * Toggle store live status
   */
  async toggleStoreStatus(isStoreLive: boolean): Promise<{ isStoreLive: boolean }> {
    try {
      const res = await fetch('/api/v1/partner/restaurant/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: getPartnerAuthHeader(),
        },
        body: JSON.stringify({ isStoreLive }),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // Fallback
    }
    return { isStoreLive };
  },

  /**
   * Get all partner listings
   */
  async getListings(): Promise<any[]> {
    try {
      const res = await fetch('/api/v1/partner/listings', {
        headers: { Authorization: getPartnerAuthHeader() },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch {
      // Fallback
    }
    return [];
  },

  /**
   * Create a new Food Deal
   */
  async createListing(data: CreateListingData): Promise<any> {
    const res = await fetch('/api/v1/partner/listings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getPartnerAuthHeader(),
      },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to create listing');
    }
    return json.data;
  },

  /**
   * Upload custom deal image to Supabase Storage (with fallback)
   */
  async uploadDealImage(file: File): Promise<string> {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Please select a JPG, JPEG, PNG, or WebP image.');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image file size must be less than 5 MB.');
    }

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

    const res = await fetch('/api/v1/partner/listings/upload-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getPartnerAuthHeader(),
      },
      body: JSON.stringify({
        filename: file.name,
        mimeType: file.type,
        base64,
      }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to upload image.');
    }
    return json.data.imageUrl;
  },

  /**
   * Update listing details, pricing, timing, category, portions, or status
   */
  async updateListing(
    listingId: string,
    updates: Partial<CreateListingData> & {
      availableQuantity?: number;
      totalQuantity?: number;
      status?: string;
    }
  ): Promise<any> {
    const res = await fetch(`/api/v1/partner/listings/${listingId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getPartnerAuthHeader(),
      },
      body: JSON.stringify(updates),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to update listing');
    }
    return json.data;
  },

  /**
   * Delete / archive food deal listing for partner restaurant
   */
  async deleteListing(listingId: string): Promise<any> {
    const res = await fetch(`/api/v1/partner/listings/${listingId}`, {
      method: 'DELETE',
      headers: {
        Authorization: getPartnerAuthHeader(),
      },
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to delete food deal');
    }
    return json.data;
  },

  /**
   * Get all orders for the partner restaurant
   */
  async getOrders(): Promise<any[]> {
    try {
      const res = await fetch('/api/v1/partner/orders', {
        headers: { Authorization: getPartnerAuthHeader() },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch {
      // Fallback
    }
    return [];
  },

  /**
   * Verify customer Pickup OTP or QR code token at counter
   */
  async verifyPickup(
    param: string | { pickupOtp?: string; qrSecretToken?: string }
  ): Promise<any> {
    const payload =
      typeof param === 'string'
        ? param.startsWith('SAVEBITE-PASS') || param.length > 4
          ? { qrSecretToken: param }
          : { pickupOtp: param }
        : param;

    const res = await fetch('/api/v1/partner/orders/verify-pickup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getPartnerAuthHeader(),
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Verification failed. Please check the code.');
    }
    return json.data;
  },

  /**
   * Get partner earnings and payout schedule
   */
  async getEarnings(): Promise<PartnerEarnings> {
    const authHeader = getPartnerAuthHeader();
    if (!authHeader) {
      throw new Error('Unauthorized: No active partner session.');
    }

    const res = await fetch('/api/v1/partner/earnings', {
      headers: { Authorization: authHeader },
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }

    return {
      restaurantId: '',
      grossRevenueInr: 0,
      commissionPercent: 15,
      commissionDeductedInr: 0,
      netPayoutInr: 0,
      pendingPayoutInr: 0,
      totalItemsSold: 0,
      totalOrdersCount: 0,
      salesBreakdown: [],
      bankAccount: {
        bankName: 'Bank Account Not Linked',
        accountNumberEnding: '----',
        ifscCode: '------',
        status: 'PENDING',
      },
      payoutSchedule: 'Weekly every Monday at 09:00 IST',
      recentPayouts: [],
    };
  },

  /**
   * Fetch partner user profile & restaurant details
   */
  async getProfile(): Promise<{
    user: {
      id: string;
      fullName: string;
      email: string;
      phone?: string;
      role: string;
      avatarUrl?: string | null;
      createdAt?: string;
    };
    restaurant: PartnerRestaurant;
  }> {
    const res = await fetch('/api/v1/partner/profile', {
      headers: { Authorization: getPartnerAuthHeader() },
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to fetch partner profile.');
    }
    return json.data;
  },

  /**
   * Update partner's permitted profile information (Name, Phone, Branch, Address)
   */
  async updateProfile(data: {
    fullName?: string;
    phone?: string;
    branchName?: string;
    address?: string;
  }): Promise<{
    user: any;
    restaurant: any;
  }> {
    const res = await fetch('/api/v1/partner/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getPartnerAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to update partner profile.');
    }
    return json.data;
  },

  /**
   * Update partner account password
   */
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    const res = await fetch('/api/v1/partner/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getPartnerAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to update password.');
    }
    return json;
  },

  /**
   * Request 6-digit OTP for email verification
   */
  async requestEmailOtp(newEmail: string): Promise<{ message: string }> {
    const res = await fetch('/api/v1/partner/email/request-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getPartnerAuthHeader(),
      },
      body: JSON.stringify({ newEmail }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to request email verification code.');
    }
    return json;
  },

  /**
   * Verify 6-digit OTP and commit email change
   */
  async verifyEmailOtp(newEmail: string, otp: string): Promise<{ message: string; user: any; token: string }> {
    const res = await fetch('/api/v1/partner/email/verify-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getPartnerAuthHeader(),
      },
      body: JSON.stringify({ newEmail, otp }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to verify OTP.');
    }
    return json;
  },

  /**
   * Upload custom profile photo (< 5MB JPG, JPEG, PNG, WebP)
   */
  async uploadAvatar(file: File): Promise<string> {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      throw new Error('Please select a JPG, JPEG, PNG, or WebP photo.');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Photo size must be less than 5 MB.');
    }

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

    const res = await fetch('/api/v1/partner/avatar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getPartnerAuthHeader(),
      },
      body: JSON.stringify({
        filename: file.name,
        mimeType: file.type,
        base64,
      }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to upload photo.');
    }
    return json.data.avatarUrl;
  },

  /**
   * Remove profile photo (reverts to default green silhouette)
   */
  async removeAvatar(): Promise<void> {
    const res = await fetch('/api/v1/partner/avatar', {
      method: 'DELETE',
      headers: { Authorization: getPartnerAuthHeader() },
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to remove photo.');
    }
  },
};

export default partnerApi;
