import { Order, FoodDeal } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export interface CreateOrderPayload {
  listingId: string;
  quantity: number;
  fulfillmentType?: 'SELF_PICKUP';
}

export interface RazorpayCheckoutInfo {
  keyId: string;
  amount: number; // in paise
  currency: string;
  razorpayOrderId: string;
  orderNumber: string;
  orderId: string;
  isTestMode: boolean;
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  data: {
    order: Order;
    razorpay: RazorpayCheckoutInfo;
  };
}

export interface VerifyPaymentPayload {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  data: Order;
}

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

export const api = {
  /**
   * Create order & atomically reserve inventory on backend
   */
  createOrder: async (payload: CreateOrderPayload): Promise<CreateOrderResponse> => {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || `Order creation failed (${res.status})`);
    }

    return data;
  },

  /**
   * Cryptographically verify Razorpay signature server-side
   */
  verifyPayment: async (
    orderId: string,
    payload: VerifyPaymentPayload
  ): Promise<VerifyPaymentResponse> => {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}/verify-payment`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || `Payment verification failed (${res.status})`);
    }

    return data;
  },

  /**
   * Fetch authenticated customer's orders
   */
  getMyOrders: async (): Promise<Order[]> => {
    const res = await fetch(`${API_BASE_URL}/orders/my-orders`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch customer orders');
    }

    return data.data;
  },

  /**
   * Clear eligible completed order history for the authenticated customer
   */
  clearOrderHistory: async (): Promise<{
    success: boolean;
    message: string;
    data?: { clearedCount: number; activeOrdersRetained: number };
  }> => {
    const res = await fetch(`${API_BASE_URL}/orders/history`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to clear order history');
    }

    return data;
  },

  /**
   * Fetch active food deal listings
   */
  getActiveListings: async (): Promise<FoodDeal[]> => {
    const res = await fetch(`${API_BASE_URL}/listings`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch food deal listings');
    }

    return data.data;
  },
};

export default api;
