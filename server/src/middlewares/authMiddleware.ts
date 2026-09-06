import { Request, Response, NextFunction } from 'express';
import { firebaseAdmin, isFirebaseAuthReady } from '../config/firebaseAdmin';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: 'CUSTOMER' | 'PARTNER' | 'ADMIN';
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

  const token = authHeader.split('Bearer ')[1];

  if (!isFirebaseAuthReady()) {
    // In Phase 1 without live Firebase keys, log warning and allow mock development mode
    console.warn('[Auth Middleware] Firebase Admin not initialized. Running in mock auth mode.');
    req.user = {
      uid: 'mock-user-123',
      email: 'mockuser@savebite.com',
      role: 'CUSTOMER',
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
