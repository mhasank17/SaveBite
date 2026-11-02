/**
 * SaveBite Core TypeScript Definitions
 * All user-facing terminology strictly adheres to:
 * "Food Deals", "Today's Deals", "Meals Near You", "Food Listings", "Special Offers"
 */

export type UserRole = 'CUSTOMER' | 'PARTNER' | 'ADMIN';

export interface UserProfile {
  id: string;
  firebaseUid: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

export type FoodCategorySlug = 'all' | 'meal' | 'bakery' | 'pantry' | 'meals' | 'buffet' | 'produce';

export interface FoodCategory {
  id: string;
  slug: FoodCategorySlug;
  name: string;
  iconName: string;
}

export type FoodDealStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'SOLD_OUT' | 'EXPIRED';

export interface FoodDeal {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantBranch: string;
  hygieneGrade: string; // e.g. "Grade A"
  distanceKm: number; // e.g. 0.4
  categoryId: string;
  categoryName: string;
  title: string; // e.g. "Evening Mystery Patisserie Bag"
  description: string;
  imageUrl: string;
  originalPriceInr: number; // e.g. 550
  dealPriceInr: number; // e.g. 149 (Discounted deal price in INR)
  discountPercent: number; // e.g. 73%
  savingsInr: number; // e.g. 401
  totalQuantity: number;
  availableQuantity: number;
  claimedQuantity: number;
  pickupWindow: {
    date: string;
    startTime: string; // e.g. "20:00"
    endTime: string; // e.g. "21:00"
    displayText: string; // e.g. "Tonight, 8:00 PM – 9:00 PM"
    expiresInSeconds: number;
  };
  dietaryTags: string[]; // e.g. ["Vegetarian Friendly", "Contains Gluten", "Contains Dairy"]
  allergenNotice?: string;
  co2eSavingsKg?: number; // e.g. 1.8
  restaurantAddress?: string;
  restaurantRating?: number;
  restaurantReviewCount?: number;
  deliveryAvailable?: boolean;
  deliveryFeeInr?: number;
  status: FoodDealStatus;
  isMysteryBox: boolean;
}

export type FulfillmentType = 'SELF_PICKUP' | 'ECO_COURIER';

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'READY_FOR_PICKUP'
  | 'ARRIVING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentMethod = 'RAZORPAY_SANDBOX' | 'UPI' | 'CARD' | 'NETBANKING';
export type PaymentStatus = 'INITIATED' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface Order {
  id: string;
  orderNumber: string; // e.g. "#8492"
  customerId: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress?: string;
  dealId: string;
  dealTitle: string;
  imageUrl?: string;
  quantity: number;
  dealPriceInr: number;
  deliveryFeeInr: number;
  totalPriceInr: number;
  fulfillmentType: FulfillmentType;
  deliveryAddress?: string;
  orderStatus: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  pickupOtp: string; // 4-6 digit counter code
  qrSecretToken: string;
  pickupWindowText?: string;
  co2eSavingsKg?: number;
  expiresAt: string;
  createdAt: string;
  completedAt?: string;
}

export interface EcoImpactSummary {
  mealsSaved: number;
  co2eSavedKg: number;
  moneySavedInr: number;
}
