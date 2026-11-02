import { z } from 'zod';

export const CreateOrderSchema = z.object({
  listingId: z.string().min(1, 'Listing ID is required'),
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .positive('Quantity must be greater than zero')
    .max(50, 'Quantity cannot exceed 50 portions'),
  fulfillmentType: z.enum(['SELF_PICKUP', 'ECO_COURIER']).default('SELF_PICKUP'),
  deliveryAddress: z.string().optional(),
  deliveryAddressId: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export const VerifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1, 'Razorpay order ID is required'),
  razorpayPaymentId: z.string().min(1, 'Razorpay payment ID is required'),
  razorpaySignature: z.string().min(1, 'Razorpay signature is required'),
});

export type VerifyPaymentInput = z.infer<typeof VerifyPaymentSchema>;

export interface OrderItemDetails {
  id: string;
  orderNumber: string;
  customerId: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress?: string;
  listingId: string;
  dealTitle: string;
  imageUrl?: string;
  quantity: number;
  unitPriceInr: number;
  subtotalInr: number;
  deliveryFeeInr: number;
  totalPriceInr: number;
  fulfillmentType: 'SELF_PICKUP' | 'ECO_COURIER';
  deliveryAddress?: string;
  orderStatus: 'PENDING_PAYMENT' | 'CONFIRMED' | 'READY_FOR_PICKUP' | 'ARRIVING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  paymentStatus: 'INITIATED' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  paymentMethod: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  pickupOtp: string;
  qrSecretToken: string;
  pickupWindowText?: string;
  co2eSavingsKg: number;
  expiresAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RazorpayCheckoutDetails {
  keyId: string;
  amount: number; // in integer paise (e.g. 14900 for ₹149.00)
  currency: 'INR';
  razorpayOrderId: string;
  orderNumber: string;
  orderId: string;
  isTestMode: boolean;
}
