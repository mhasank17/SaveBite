import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import adminService from '../services/adminService';

const UpdateVendorKycSchema = z.object({
  kycStatus: z.enum(['PENDING', 'APPROVED', 'RE_INSPECT', 'REJECTED']),
  adminNotes: z.string().optional(),
});

const ToggleVendorStatusSchema = z.object({
  isStoreLive: z.boolean(),
});

const ModerateListingSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'SOLD_OUT', 'EXPIRED']),
});

const ResolveDisputeSchema = z.object({
  resolution: z.enum(['RESOLVED_REFUNDED', 'RESOLVED_REJECTED']),
  refundAmountInr: z.number().min(0).optional(),
  adminNotes: z.string().optional(),
});

const ProcessPayoutBatchSchema = z.object({
  payoutIds: z.array(z.string()).min(1),
});

const SettleRestaurantSchema = z
  .object({
    restaurantId: z.string().min(1, 'Restaurant ID is required.'),
    notes: z.string().optional(),
  })
  .strict({
    message: 'Partial or custom settlement amounts are strictly prohibited. Full settlement only.',
  });

const UpdateAdminProfileSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters.')
      .max(100, 'Full name must be at most 100 characters.'),
    phone: z
      .string()
      .trim()
      .max(25, 'Phone number must be at most 25 characters.')
      .optional()
      .or(z.literal('')),
  })
  .strict();

const ChangeAdminPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters long.'),
    confirmPassword: z.string().optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.confirmPassword && data.newPassword !== data.confirmPassword) {
        return false;
      }
      return true;
    },
    {
      message: 'New password and confirmation do not match.',
      path: ['confirmPassword'],
    }
  );

export class AdminController {
  /**
   * GET /api/v1/admin/overview
   */
  public async getOverview(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = await adminService.getPlatformOverview();
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/vendors
   */
  public async getVendors(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = await adminService.getVendors();
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/vendors/:id/kyc
   */
  public async updateVendorKyc(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const parseResult = UpdateVendorKycSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid KYC status value.',
        });
        return;
      }

      const { kycStatus, adminNotes } = parseResult.data;
      const result = await adminService.updateVendorKyc(req.params.id, kycStatus as any, adminNotes);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/vendors/:id/status
   */
  public async toggleVendorStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const parseResult = ToggleVendorStatusSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid status toggle payload.',
        });
        return;
      }

      const result = await adminService.toggleVendorStatus(req.params.id, parseResult.data.isStoreLive);
      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/listings
   */
  public async getListings(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = await adminService.getListings();
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/listings/:id/status
   */
  public async moderateListing(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const parseResult = ModerateListingSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid listing status value.',
        });
        return;
      }

      const result = await adminService.moderateListing(req.params.id, parseResult.data.status as any);
      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/disputes
   */
  public async getDisputes(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = await adminService.getDisputes();
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/disputes/:id/resolve
   */
  public async resolveDispute(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const parseResult = ResolveDisputeSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid dispute resolution payload.',
        });
        return;
      }

      const { resolution, refundAmountInr, adminNotes } = parseResult.data;
      const result = await adminService.resolveDispute(
        req.params.id,
        resolution,
        refundAmountInr,
        adminNotes
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/payouts
   */
  public async getPayouts(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = await adminService.getPayouts();
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/payouts/process-batch
   */
  public async processPayoutBatch(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const parseResult = ProcessPayoutBatchSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          message: 'Please provide a non-empty array of payoutIds to process.',
        });
        return;
      }

      const result = await adminService.processPayoutBatch(parseResult.data.payoutIds);
      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/settlements
   */
  public async getSettlements(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { filter, startDate, endDate } = req.query;
      const data = await adminService.getSettlements({
        filter: filter as string | undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
      });
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/settlements/pay
   */
  public async settleRestaurantPayout(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const parseResult = SettleRestaurantSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          message: parseResult.error.errors[0]?.message || 'Invalid settlement payload.',
        });
        return;
      }

      const { restaurantId, notes } = parseResult.data;
      const actorId = req.user?.uid || 'admin-super';

      const result = await adminService.settleRestaurantPayout(
        restaurantId,
        notes,
        actorId
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/customers
   */
  public async getCustomers(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const customers = await adminService.getCustomers();
      res.status(200).json({ success: true, data: customers });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/orders
   */
  public async getOrders(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orders = await adminService.getPlatformOrders();
      res.status(200).json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/campus-locations
   */
  public async getCampusLocations(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const locations = adminService.getCampusLocations();
      res.status(200).json({ success: true, data: locations });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/campus-locations/:id
   */
  public async toggleCampusLocation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { isApproved } = req.body;
      const updated = adminService.toggleCampusLocation(req.params.id, Boolean(isApproved));
      res.status(200).json({ success: true, data: updated, message: 'Campus delivery location updated.' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/campus-locations
   */
  public async addCampusLocation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, zone, type, description } = req.body;
      if (!name) {
        res.status(400).json({ success: false, message: 'Location name is required.' });
        return;
      }
      const added = adminService.addCampusLocation({ name, zone, type, description });
      res.status(201).json({ success: true, data: added, message: 'Approved campus delivery location created.' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/audit-logs
   */
  public async getAuditLogs(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const logs = await adminService.getAuditLogs();
      res.status(200).json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/profile
   * Returns current authenticated admin profile
   */
  public async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorKey = req.user?.uid || req.user?.email || 'admin@savebite.in';
      const profile = await adminService.getAdminProfile(actorKey);
      res.status(200).json({
        success: true,
        message: 'SuperAdmin profile retrieved successfully.',
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/profile
   * Updates admin full name and permitted contact information, persisting to database
   */
  public async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorKey = req.user?.uid || req.user?.email || 'admin@savebite.in';
      const parsed = UpdateAdminProfileSchema.parse(req.body);
      const updated = await adminService.updateAdminProfile(actorKey, parsed);

      res.status(200).json({
        success: true,
        message: 'Admin profile updated successfully.',
        data: updated,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: error.errors[0]?.message || 'Validation error in profile data.',
          errors: error.errors,
        });
        return;
      }
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update admin profile.',
      });
    }
  }

  /**
   * POST /api/v1/admin/change-password
   * Securely validates current password and updates to new password
   */
  public async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorKey = req.user?.uid || req.user?.email || 'admin@savebite.in';
      const parsed = ChangeAdminPasswordSchema.parse(req.body);
      const result = await adminService.changeAdminPassword(actorKey, parsed);

      res.status(200).json({
        success: true,
        message: result.message || 'SuperAdmin password changed successfully.',
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: error.errors[0]?.message || 'Validation error in password request.',
          errors: error.errors,
        });
        return;
      }
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to change password.',
      });
    }
  }
}

export const adminController = new AdminController();
export default adminController;
