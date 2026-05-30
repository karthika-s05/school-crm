import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/db';
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
    // For demo, token is user_id. In production, use JWT verification
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, user_profiles(id)')
      .eq('id', token)
      .eq('is_active', true)
      .single();

    if (error || !user) throw new ApiError(401, 'Invalid token');

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      profileId: (user.user_profiles as any)?.id,
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

    const { data: permission } = await supabase
      .from('permissions')
      .select('*')
      .eq('role', req.user.role)
      .eq('resource', resource)
      .eq('action', action)
      .eq('allowed', true)
      .single();

    // Super admin has all access
    if (req.user.role === 'super_admin') return next();

    if (!permission) throw new ApiError(403, `No permission to ${action} ${resource}`);
    next();
  };
};
