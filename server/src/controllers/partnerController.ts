import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import partnerService from '../services/partnerService';
import { z } from 'zod';

const CreateListingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  description: z.string().min(5, 'Description must be at least 5 characters long'),
  categoryId: z.string().min(1, 'Category is required'),
  imageUrl: z.string().min(1).optional(),
  originalPriceInr: z.number().positive('Original price must be positive'),
  surplusPriceInr: z.number().positive('Deal price must be positive'),
  totalQuantity: z.number().int().positive('Total quantity must be a positive integer'),
  pickupDate: z.string().optional(),
  pickupStartTime: z.string().regex(/^\d{2}:\d{2}$/, 'Pickup start time must be HH:MM'),
  pickupEndTime: z.string().regex(/^\d{2}:\d{2}$/, 'Pickup end time must be HH:MM'),
  dietaryTags: z.array(z.string()).optional(),
  allergenNotice: z.string().optional(),
  co2eSavingsKg: z.number().optional(),
});

const UpdateListingSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(5).optional(),
  categoryId: z.string().min(1).optional(),
  imageUrl: z.string().min(1).optional(),
  originalPriceInr: z.number().positive().optional(),
  surplusPriceInr: z.number().positive().optional(),
  totalQuantity: z.number().int().positive().optional(),
  availableQuantity: z.number().int().min(0).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'SOLD_OUT', 'EXPIRED']).optional(),
  pickupStartTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  pickupEndTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  dietaryTags: z.array(z.string()).optional(),
  allergenNotice: z.string().nullable().optional(),
});

const UploadImageSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  mimeType: z.string().min(1, 'MIME type is required'),
  base64: z.string().min(1, 'Base64 image data is required'),
});

const VerifyPickupSchema = z.object({
  pickupOtp: z.string().optional(),
  qrSecretToken: z.string().optional(),
  orderId: z.string().optional(),
});

const UpdatePartnerProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters long').optional(),
  phone: z.string().optional(),
  branchName: z.string().optional(),
  address: z.string().optional(),
});

const ChangePartnerPasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
});

const RequestEmailOtpSchema = z.object({
  newEmail: z.string().email('Please enter a valid email address'),
});

const VerifyEmailOtpSchema = z.object({
  newEmail: z.string().email('Please enter a valid email address'),
  otp: z.string().length(6, 'Verification code must be 6 digits'),
});

export class PartnerController {
  /**
   * GET /api/v1/partner/restaurant
   * Get partner's restaurant details and live dashboard metrics
   */
  public async getRestaurantProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const restaurant = await partnerService.getPartnerRestaurant(req.user?.uid);
      if (!restaurant) {
        res.status(404).json({
          success: false,
          message: 'No restaurant found for this partner account.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: restaurant,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/partner/restaurant/status
   * Toggle store live / pause status
   */
  public async toggleStoreStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { isStoreLive, restaurantId } = req.body;
      const targetId = restaurantId || 'demo-rest-daily-dough';
      const result = await partnerService.toggleStoreStatus(targetId, Boolean(isStoreLive));

      res.status(200).json({
        success: true,
        message: result.isStoreLive
          ? 'Store is now LIVE and accepting customer deal orders.'
          : 'Store orders are PAUSED. New deal orders are temporarily paused.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/partner/listings
   * Get all listings for partner's restaurant
   */
  public async getListings(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const restaurant = await partnerService.getPartnerRestaurant(req.user?.uid);
      const restaurantId = restaurant?.id || 'demo-rest-daily-dough';
      const listings = await partnerService.getPartnerListings(restaurantId);

      res.status(200).json({
        success: true,
        data: listings,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/partner/listings
   * Create new Food Deal listing
   */
  public async createListing(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const parseResult = CreateListingSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed for new deal listing.',
          errors: parseResult.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }

      const restaurant = await partnerService.getPartnerRestaurant(req.user?.uid);
      const restaurantId = restaurant?.id || 'demo-rest-daily-dough';
      const newListing = await partnerService.createListing(restaurantId, parseResult.data);

      res.status(201).json({
        success: true,
        message: 'Food deal listing created and published successfully!',
        data: newListing,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/partner/listings/:id
   * Update quantity, status, or pricing
   */
  public async updateListing(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const listingId = req.params.id;
      const parseResult = UpdateListingSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed for listing update.',
          errors: parseResult.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }

      const restaurant = await partnerService.getPartnerRestaurant(req.user?.uid);
      const restaurantId = restaurant?.id || 'demo-rest-daily-dough';
      const updated = await partnerService.updateListing(restaurantId, listingId, parseResult.data);

      res.status(200).json({
        success: true,
        message: 'Listing updated successfully.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/partner/listings/:id
   * Soft-delete / archive food deal listing for partner's restaurant
   */
  public async deleteListing(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const listingId = req.params.id;
      const restaurant = await partnerService.getPartnerRestaurant(req.user?.uid);
      const restaurantId = restaurant?.id || 'demo-rest-daily-dough';

      const result = await partnerService.deleteListing(restaurantId, listingId, req.user?.uid);

      res.status(200).json({
        success: true,
        message: 'Food deal removed successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/partner/listings/upload-image
   * Upload custom JPG/JPEG/PNG/WebP image to Supabase Storage (with local fallback)
   */
  public async uploadDealImage(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const parseResult = UploadImageSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed for image upload.',
          errors: parseResult.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }

      const { filename, mimeType, base64 } = parseResult.data;

      // Validate allowed mime types
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(mimeType.toLowerCase())) {
        res.status(400).json({
          success: false,
          message: 'Unsupported image format. Please upload a JPG, JPEG, PNG, or WebP file.',
        });
        return;
      }

      // Strip data URL header if present
      const cleanBase64 = base64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');

      // Max size: 5 MB
      const MAX_BYTES = 5 * 1024 * 1024;
      if (buffer.length > MAX_BYTES) {
        res.status(400).json({
          success: false,
          message: 'Image file size exceeds the 5 MB limit.',
        });
        return;
      }

      const imageUrl = await partnerService.uploadDealImage(buffer, mimeType, filename);

      res.status(200).json({
        success: true,
        message: 'Deal image uploaded successfully.',
        data: { imageUrl },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/partner/orders
   * Get all incoming & completed orders for partner restaurant
   */
  public async getOrders(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const restaurant = await partnerService.getPartnerRestaurant(req.user?.uid);
      const restaurantId = restaurant?.id || 'demo-rest-daily-dough';
      const orders = await partnerService.getPartnerOrders(restaurantId);

      res.status(200).json({
        success: true,
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/partner/orders/verify-pickup
   * Validate 4-digit counter OTP or QR token and mark order as COMPLETED
   */
  public async verifyPickup(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const parseResult = VerifyPickupSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          message: 'Please provide a valid 4-digit Pickup OTP or QR code token.',
        });
        return;
      }

      const restaurant = await partnerService.getPartnerRestaurant(req.user?.uid);
      const restaurantId = restaurant?.id || 'demo-rest-daily-dough';
      const verificationResult = await partnerService.verifyPickup(restaurantId, parseResult.data);

      res.status(200).json({
        success: true,
        message: verificationResult.message,
        data: verificationResult,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to verify pickup OTP.',
      });
    }
  }

  /**
   * GET /api/v1/partner/earnings
   * Get partner revenue and payout breakdown
   */
  public async getEarnings(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const restaurant = await partnerService.getPartnerRestaurant(req.user?.uid);
      const restaurantId = restaurant?.id || 'demo-rest-daily-dough';
      const earnings = await partnerService.getPartnerEarnings(restaurantId);

      res.status(200).json({
        success: true,
        data: earnings,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/partner/profile
   * Get partner user profile and restaurant details
   */
  public async getProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const actorKey = req.user?.uid || req.user?.email || 'demo-user-partner-baker';
      const profile = await partnerService.getPartnerUserProfile(actorKey);

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/partner/profile
   * Update partner's permitted profile information
   */
  public async updateProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const actorKey = req.user?.uid || req.user?.email || 'demo-user-partner-baker';
      const parseResult = UpdatePartnerProfileSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          message: parseResult.error.errors[0]?.message || 'Validation error in profile data.',
          errors: parseResult.error.errors,
        });
        return;
      }

      const updated = await partnerService.updatePartnerProfile(actorKey, parseResult.data);

      res.status(200).json({
        success: true,
        message: 'Partner profile updated successfully.',
        data: updated,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update profile.',
      });
    }
  }

  /**
   * POST /api/v1/partner/change-password
   * Securely validate current password and update to new password
   */
  public async changePassword(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const actorKey = req.user?.uid || req.user?.email || 'demo-user-partner-baker';
      const parseResult = ChangePartnerPasswordSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          message: parseResult.error.errors[0]?.message || 'Validation error in password request.',
          errors: parseResult.error.errors,
        });
        return;
      }

      const result = await partnerService.changePartnerPassword(actorKey, parseResult.data);

      res.status(200).json({
        success: true,
        message: result.message || 'Password changed successfully.',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to change password.',
      });
    }
  }

  /**
   * POST /api/v1/partner/email/request-otp
   * Request 6-digit OTP to verify ownership of new email
   */
  public async requestEmailOtp(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const actorKey = req.user?.uid || req.user?.email || 'demo-user-partner-baker';
      const parseResult = RequestEmailOtpSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          message: parseResult.error.errors[0]?.message || 'Please enter a valid email address.',
        });
        return;
      }

      const result = await partnerService.requestEmailChangeOtp(actorKey, parseResult.data.newEmail);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to send verification code.',
      });
    }
  }

  /**
   * POST /api/v1/partner/email/verify-otp
   * Verify 6-digit OTP and update account email
   */
  public async verifyEmailOtp(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const actorKey = req.user?.uid || req.user?.email || 'demo-user-partner-baker';
      const parseResult = VerifyEmailOtpSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          message: parseResult.error.errors[0]?.message || 'Please provide a valid 6-digit verification code.',
        });
        return;
      }

      const result = await partnerService.verifyEmailChangeOtp(
        actorKey,
        parseResult.data.newEmail,
        parseResult.data.otp
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          user: result.user,
          token: result.token,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Verification failed.',
      });
    }
  }

  /**
   * POST /api/v1/partner/avatar
   * Upload custom profile photo (JPG, JPEG, PNG, WebP < 5MB)
   */
  public async uploadAvatar(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const actorKey = req.user?.uid || req.user?.email || 'demo-user-partner-baker';
      const parseResult = UploadImageSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed for avatar upload.',
          errors: parseResult.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }

      const { filename, mimeType, base64 } = parseResult.data;
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(mimeType.toLowerCase())) {
        res.status(400).json({
          success: false,
          message: 'Unsupported format. Please upload a JPG, JPEG, PNG, or WebP photo.',
        });
        return;
      }

      const cleanBase64 = base64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
      if (buffer.length > MAX_BYTES) {
        res.status(400).json({
          success: false,
          message: 'Image size exceeds the 5 MB limit.',
        });
        return;
      }

      const result = await partnerService.uploadPartnerAvatar(
        actorKey,
        buffer,
        mimeType,
        filename
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          avatarUrl: result.avatarUrl,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to upload photo.',
      });
    }
  }

  /**
   * DELETE /api/v1/partner/avatar
   * Remove custom avatar photo and restore default silhouette
   */
  public async removeAvatar(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const actorKey = req.user?.uid || req.user?.email || 'demo-user-partner-baker';
      const result = await partnerService.removePartnerAvatar(actorKey);

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          avatarUrl: result.avatarUrl,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to remove photo.',
      });
    }
  }
}

export const partnerController = new PartnerController();
export default partnerController;
