import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, JWTPayload } from '../../types';
import { CustomError } from './error-handler';

const prisma = new PrismaClient();

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError('Access token required', 401);
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new CustomError('JWT secret not configured', 500);
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;
    
    // Check token age and activity
    const now = Math.floor(Date.now() / 1000);
    const tokenAge = now - (decoded.iat || 0);
    const lastActivity = decoded.lastActivity || decoded.iat || 0;
    const inactivityTime = now - lastActivity;
    
    // Session timeout check (30 minutes = 1800 seconds)
    const sessionTimeout = parseInt(process.env.SESSION_TIMEOUT_SECONDS || '1800');
    if (inactivityTime > sessionTimeout) {
      throw new CustomError('Session expired due to inactivity', 401);
    }
    
    // Get user with personnel only (no user_roles or role_permissions)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        personnel: true
      }
    });

    if (!user || user.status !== 'Active') {
      throw new CustomError('User not found or inactive', 401);
    }

    // Remove all permission logic and helpers
    // After fetching user, attach user.role to req.user
    (req.user as any) = {
      ...user,
      role: user.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new CustomError('Invalid token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new CustomError('Token expired', 401));
    } else {
      next(error);
    }
  }
};

// Add role-based middleware
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new CustomError('Authentication required', 401));
    }
    if (!roles.includes((req.user as any).role)) {
      return next(new CustomError('Insufficient role', 403));
    }
    next();
  };
}; 