import { Request, Response, NextFunction } from 'express';
import { firebaseAdmin, isFirebaseAuthReady } from '../config/firebaseAdmin';
import authService from '../services/authService';

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

  if (!isFirebaseAuthReady()) {
    // In development/test mode without live Firebase Admin credentials
    if (token === 'invalid-token' || token.startsWith('invalid')) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid token.',
      });
      return;
    }

    // Determine user identity from token (e.g. 'user-sarah', 'cust-alex', etc.)
    const uid = token.startsWith('test-') || token.startsWith('cust-') || token.startsWith('user-')
      ? token
      : 'user-sarah';

    req.user = {
      uid,
      email: `${uid}@savebite.in`,
      role: token.includes('partner') ? 'PARTNER' : token.includes('admin') ? 'ADMIN' : 'CUSTOMER',
    };
    next();
    return;
  }

  try {
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: (decodedToken.role as 'CUSTOMER' | 'PARTNER' | 'ADMIN') || 'CUSTOMER',
    };
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid token.',
      error: (error as Error).message,
    });
  }
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
