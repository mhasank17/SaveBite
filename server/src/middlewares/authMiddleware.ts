import { Request, Response, NextFunction } from 'express';
import authService from '../services/authService';
import { isTestEnvironment } from '../config/env';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: 'CUSTOMER' | 'PARTNER' | 'ADMIN';
    restaurantId?: string;
  };
}

export const verifyAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized: Missing or invalid Authorization header.',
    });
    return;
  }

  const token = authHeader.split('Bearer ')[1]?.trim();

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized: Empty token provided.',
    });
    return;
  }

  // 1. Check if token is a cryptographic token signed by authService
  if (token.includes('.')) {
    const customPayload = authService.verifyToken(token);
    if (customPayload) {
      req.user = {
        uid: customPayload.uid,
        email: customPayload.email,
        role: customPayload.role,
        restaurantId: customPayload.restaurantId,
      };
      next();
      return;
    }

    res.status(401).json({
      success: false,
      message: 'Unauthorized: Session token has expired or is invalid. Please sign in again.',
    });
    return;
  }

  // 2. In automated test environment only, support test runner tokens (e.g. test-admin-super, test-partner-baker, test-customer-sarah)
  if (isTestEnvironment()) {
    if (token === 'invalid-token' || token.startsWith('invalid')) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid token.',
      });
      return;
    }

    if (
      token.startsWith('test-') ||
      token.startsWith('cust-') ||
      token.startsWith('user-') ||
      token.startsWith('admin-')
    ) {
      const uid = token;
      req.user = {
        uid,
        email: `${uid}@savebite.in`,
        role: token.includes('partner') ? 'PARTNER' : token.includes('admin') ? 'ADMIN' : 'CUSTOMER',
      };
      next();
      return;
    }
  }

  res.status(401).json({
    success: false,
    message: 'Unauthorized: Invalid token.',
  });
};

export const requireRole = (allowedRoles: ('CUSTOMER' | 'PARTNER' | 'ADMIN')[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: Authentication required.',
      });
      return;
    }

    const userRole = req.user.role || 'CUSTOMER';
    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${allowedRoles.join(', ')}].`,
      });
      return;
    }

    next();
  };
};
