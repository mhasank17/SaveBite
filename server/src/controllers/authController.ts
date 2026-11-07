import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import authService from '../services/authService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const CustomerRegisterSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters long'),
  phone: z.string().optional(),
});

const CustomerLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const PartnerRegisterSchema = z.object({
  fullName: z.string().min(2, 'Owner full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(10, 'Contact phone number must be at least 10 digits'),
  restaurantName: z.string().min(2, 'Restaurant name must be at least 2 characters'),
  branchName: z.string().optional().default('Main Branch'),
  address: z.string().min(5, 'Restaurant address is required'),
  city: z.string().optional().default('Metro Area'),
  restaurantPhone: z.string().min(10, 'Restaurant phone must be at least 10 digits'),
  licenseNumber: z.string().min(10, 'Valid FSSAI license number is required'),
  hygieneGrade: z.string().optional().default('Grade A'),
  licenseDocumentUrl: z.string().optional(),
});

const PartnerLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const AdminLoginSchema = z.object({
  email: z.string().trim().min(1, 'Please enter your administrator username or email address'),
  password: z.string().trim().min(1, 'Password is required'),
});

const UpdateAvatarSchema = z.object({
  avatarUrl: z.string().url('Please provide a valid avatar URL'),
});

const ForgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const ResetPasswordSchema = z.object({
  token: z.string().min(10, 'Verification token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
});
const VerifyOtpSchema = z.object({ email: z.string().email(), otp: z.string().regex(/^\d{6}$/) });

export class AuthController {
  /**
   * POST /api/v1/auth/customer/register
   */
  public async registerCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        res.status(400).json({
          success: false,
          message: 'Request body cannot be empty.',
        });
        return;
      }

      const parsed = CustomerRegisterSchema.parse(req.body);
      const result = await authService.registerCustomer(parsed);

      res.status(201).json({
        success: true,
        message: 'Customer account registered successfully.',
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            fullName: result.user.fullName,
            phone: result.user.phone,
            role: result.user.role,
            avatarUrl: result.user.avatarUrl,
          },
          token: result.token,
        },
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: error.errors[0]?.message || 'Validation error',
          errors: error.errors,
        });
        return;
      }

      const message = error.message || 'Failed to register customer.';
      if (
        message.toLowerCase().includes('already exists') ||
        message.toLowerCase().includes('duplicate')
      ) {
        res.status(409).json({
          success: false,
          message: 'An account with this email already exists.',
        });
        return;
      }

      res.status(error.statusCode || 500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * POST /api/v1/auth/customer/login
   */
  public async loginCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = CustomerLoginSchema.parse(req.body);
      const result = await authService.loginCustomer(parsed);

      res.status(200).json({
        success: true,
        message: 'Logged in successfully.',
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            fullName: result.user.fullName,
            phone: result.user.phone,
            role: result.user.role,
            avatarUrl: result.user.avatarUrl,
          },
          token: result.token,
        },
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: error.errors[0]?.message || 'Validation error',
        });
        return;
      }
      res.status(401).json({
        success: false,
        message: error.message || 'Authentication failed.',
      });
    }
  }

  /**
   * POST /api/v1/auth/partner/register
   * Registers restaurant owner + restaurant in PENDING KYC status
   */
  public async registerPartner(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = PartnerRegisterSchema.parse(req.body);
      const result = await authService.registerPartner({
        owner: {
          fullName: parsed.fullName,
          email: parsed.email,
          password: parsed.password,
          phone: parsed.phone,
        },
        restaurant: {
          name: parsed.restaurantName,
          branchName: parsed.branchName || 'Campus Hub',
          address: parsed.address,
          city: parsed.city || 'University Area',
          phone: parsed.restaurantPhone,
          licenseNumber: parsed.licenseNumber,
          hygieneGrade: parsed.hygieneGrade,
          licenseDocumentUrl: parsed.licenseDocumentUrl,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Restaurant partner application submitted successfully! Your account is pending SuperAdmin approval.',
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            fullName: result.user.fullName,
            phone: result.user.phone,
            role: result.user.role,
            avatarUrl: result.user.avatarUrl,
          },
          restaurant: result.restaurant,
          token: result.token,
        },
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: error.errors[0]?.message || 'Validation error',
          errors: error.errors,
        });
        return;
      }
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to submit partner application.',
      });
    }
  }

  /**
   * POST /api/v1/auth/partner/login
   */
  public async loginPartner(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = PartnerLoginSchema.parse(req.body);
      const result = await authService.loginPartner(parsed);

      res.status(200).json({
        success: true,
        message: 'Restaurant owner logged in successfully.',
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            fullName: result.user.fullName,
            phone: result.user.phone,
            role: result.user.role,
            avatarUrl: result.user.avatarUrl,
          },
          restaurant: result.restaurant,
          token: result.token,
        },
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: error.errors[0]?.message || 'Validation error',
        });
        return;
      }
      res.status(401).json({
        success: false,
        message: error.message || 'Authentication failed.',
      });
    }
  }

  /**
   * POST /api/v1/auth/admin/login
   * Public admin registration is strictly disallowed.
   */
  public async loginAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = AdminLoginSchema.parse(req.body);
      const email = parsed.email.trim().toLowerCase() === 'admin' ? 'admin@savebite.in' : parsed.email.trim();
      const result = await authService.loginAdmin({ email, password: parsed.password });

      const isSuper = Boolean(
        result.user.email.toLowerCase() === (process.env.ADMIN_EMAIL || 'admin@savebite.in').toLowerCase() ||
        result.user.email.toLowerCase().includes('super')
      );

      res.status(200).json({
        success: true,
        message: isSuper ? 'SuperAdmin authenticated successfully.' : 'Administrator authenticated successfully.',
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            fullName: result.user.fullName,
            role: result.user.role,
            avatarUrl: result.user.avatarUrl,
            isSuperAdmin: isSuper,
          },
          token: result.token,
        },
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: error.errors[0]?.message || 'Validation error',
        });
        return;
      }
      res.status(401).json({
        success: false,
        message: error.message || 'Administrator authentication failed.',
      });
    }
  }

  /**
   * GET /api/v1/auth/me
   */
  public async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.uid) {
        res.status(401).json({ success: false, message: 'Authentication required.' });
        return;
      }

      const profile = await authService.getProfile(req.user.uid);
      if (!profile) {
        res.status(200).json({
          success: true,
          data: {
            user: {
              id: req.user.uid,
              email: req.user.email,
              role: req.user.role,
              fullName: req.user.uid,
            },
          },
        });
        return;
      }

      const isSuper = Boolean(
        profile.user.role === 'ADMIN' &&
        (profile.user.email.toLowerCase() === (process.env.ADMIN_EMAIL || 'admin@savebite.in').toLowerCase() ||
         profile.user.email.toLowerCase().includes('super') ||
         req.user.isSuperAdmin)
      );

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: profile.user.id,
            email: profile.user.email,
            fullName: profile.user.fullName,
            phone: profile.user.phone,
            role: profile.user.role,
            avatarUrl: profile.user.avatarUrl,
            isSuperAdmin: isSuper,
          },
          restaurant: profile.restaurant,
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/auth/avatar
   * Updates the authenticated customer's profile avatar.
   * Strictly enforces backend authorization: users can only update their own avatar.
   */
  public async updateAvatar(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.uid) {
        res.status(401).json({
          success: false,
          message: 'Authentication required to update avatar.',
        });
        return;
      }

      const parsed = UpdateAvatarSchema.parse(req.body);
      const updatedUser = await authService.updateCustomerAvatar(req.user.uid, parsed.avatarUrl);

      res.status(200).json({
        success: true,
        message: 'Avatar updated successfully.',
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            fullName: updatedUser.fullName,
            phone: updatedUser.phone,
            role: updatedUser.role,
            avatarUrl: updatedUser.avatarUrl,
          },
        },
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: error.errors[0]?.message || 'Validation error',
          errors: error.errors,
        });
        return;
      }
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || 'Failed to update avatar.',
      });
    }
  }

  /**
   * POST /api/v1/auth/forgot-password
   * Request a six-digit password reset code
   * Enforces strict anti-enumeration: Always returns HTTP 200 with generic confirmation.
   */
  public async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.body || typeof req.body !== 'object') {
        res.status(400).json({ success: false, message: 'Request body is required.' });
        return;
      }

      const parsed = ForgotPasswordSchema.parse(req.body);
      const resetResult = await authService.requestPasswordReset(parsed.email);

      // Handle email delivery failure properly without claiming an email was sent
      if (!resetResult.success) {
        res.status(503).json({
          success: false,
          message: resetResult.error === 'RESEND_RATE_LIMIT' ? 'Please wait 60 seconds before requesting another code.' : `Unable to send the verification code. ${resetResult.error || 'Check SMTP configuration and try again.'}`,
        });
        return;
      }

      // Strict Anti-Enumeration: Identical message whether email exists or not
      res.status(200).json({
        success: true,
        message: 'If an account is associated with this email address, a verification code has been sent.',
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: error.errors[0]?.message || 'Please provide a valid email address.',
          errors: error.errors,
        });
        return;
      }
      next(error);
    }
  }

  public async verifyPasswordOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = VerifyOtpSchema.parse(req.body);
      const result = await authService.verifyPasswordResetOtp(parsed.email, parsed.otp);
      if (!result.success) { res.status(400).json({ success: false, message: result.message }); return; }
      res.status(200).json({ success: true, message: 'Email verified.', resetToken: result.resetToken });
    } catch (error: any) {
      if (error instanceof z.ZodError) { res.status(400).json({ success: false, message: 'Enter a valid email address and 6-digit code.' }); return; }
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/reset-password
   * Reset user password using single-use cryptographic token
   */
  public async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.body || typeof req.body !== 'object') {
        res.status(400).json({ success: false, message: 'Request body is required.' });
        return;
      }

      const parsed = ResetPasswordSchema.parse(req.body);
      const result = await authService.resetPasswordWithOtpToken(parsed.token, parsed.newPassword);

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.message,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: error.errors[0]?.message || 'Validation error',
          errors: error.errors,
        });
        return;
      }
      next(error);
    }
  }
}

export const authController = new AuthController();
export default authController;
