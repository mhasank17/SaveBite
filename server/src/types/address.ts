import { z } from 'zod';

export type AddressType = 'Home' | 'Hostel' | 'Work' | 'Other';

export interface CustomerAddress {
  id: string;
  userId: string;
  fullName: string;
  phoneNumber: string;
  houseFlatBuilding: string;
  streetArea: string;
  landmark?: string;
  postalCode: string; // 6-digit Indian PIN
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

export const CreateAddressSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters'),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^(?:\+91|91)?[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number starting with 6-9'),
  houseFlatBuilding: z
    .string()
    .trim()
    .min(1, 'House, flat, building, or room number is required')
    .max(200, 'Cannot exceed 200 characters'),
  streetArea: z
    .string()
    .trim()
    .min(2, 'Street, area, locality, or sector is required')
    .max(200, 'Cannot exceed 200 characters'),
  landmark: z.string().trim().max(150, 'Landmark cannot exceed 150 characters').optional(),
  postalCode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/, 'PIN code must be a valid 6-digit number (e.g. 560092 or 110007)'),
  city: z
    .string()
    .trim()
    .min(2, 'City is required')
    .max(100, 'City cannot exceed 100 characters'),
  state: z
    .string()
    .trim()
    .min(2, 'State is required')
    .max(100, 'State cannot exceed 100 characters'),
  addressType: z.enum(['Home', 'Hostel', 'Work', 'Other']).default('Home'),
  isDefault: z.boolean().default(false),
  deliveryInstructions: z.string().trim().max(500, 'Instructions cannot exceed 500 characters').optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export type CreateAddressInput = z.infer<typeof CreateAddressSchema>;

export const UpdateAddressSchema = CreateAddressSchema.partial();
export type UpdateAddressInput = z.infer<typeof UpdateAddressSchema>;

export const CheckServiceabilitySchema = z.object({
  postalCode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/, 'PIN code must be a valid 6-digit number'),
  city: z.string().trim().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export type CheckServiceabilityInput = z.infer<typeof CheckServiceabilitySchema>;

export interface ServiceabilityResult {
  isServiceable: boolean;
  zone: 'campus' | 'metro_city' | 'out_of_zone';
  zoneName: string;
  deliveryFeeInr: number;
  estimatedMinutes: number;
  message: string;
}
