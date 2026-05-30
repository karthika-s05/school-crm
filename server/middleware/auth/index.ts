import { Request, Response, NextFunction } from 'express';
import { db } from '../config/db';
import { ApiError } from './error';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        profileId?: string;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const user = await db.queryOne(`SELECT u.id, u.email, u.role, p.id as profile_id FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id WHERE u.id = ? AND u.is_active = true`, [token]);

    if (!user) throw new ApiError(401, 'Invalid token');

    req.user = {
      id: user.id as string,
      email: user.email as string,
      role: user.role as string,
      profileId: user.profile_id as string,
    };
    next();
  } catch (err) {
    next(err);
  }
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    if (!allowedRoles.includes(req.user.role)) throw new ApiError(403, 'Not authorized');
    next();
  };
};

export const checkPermission = (resource: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) throw new ApiError(401, 'Not authenticated');
    if (req.user.role === 'super_admin') return next();

    const permission = await db.queryOne(`SELECT * FROM permissions WHERE role = ? AND resource = ? AND action = ? AND allowed = true`, [req.user.role, resource, action]);
    if (!permission) throw new ApiError(403, `No permission to ${action} ${resource}`);
    next();
  };
};
