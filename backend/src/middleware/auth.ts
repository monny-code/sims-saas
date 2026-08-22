import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { DemoSchool, DemoUser } from '../data/demoData.js';
import { isSupabaseEnabled, supabase } from '../config/supabase.js';
import { getSchools, getUsers } from '../services/firebaseDataStore.js';
import { sendError } from '../utils/response.js';

export type AuthenticatedRequest = Request & {
  user?: DemoUser;
  school?: DemoSchool;
};

export const verifyAccessToken = async (token: string) => {
  if (isSupabaseEnabled && supabase) {
    // getUser performs a server-side verification with Supabase Auth.  Do not
    // decode client claims here: roles and school membership come from our DB.
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      throw new Error('Invalid or expired Supabase access token');
    }

    return { sub: data.user.id, email: data.user.email ?? '' };
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as {
      sub: string;
      email: string;
      role: DemoUser['role'];
      schoolId?: string;
      permissions?: string[];
    };

    return {
      sub: payload.sub,
      email: payload.email ?? '',
      role: payload.role ?? 'PARENT',
      schoolId: payload.schoolId ?? '',
      permissions: payload.permissions ?? [],
    };
  } catch {
    throw new Error('Invalid or expired local access token');
  }
};

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Unauthorized', 401);
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const payload = await verifyAccessToken(token);
    const [users, schools] = await Promise.all([getUsers(), getSchools()]);
    // Prefer the immutable Auth identity. The email fallback supports profiles
    // created before Supabase Auth was enabled and remains tenant-scoped below.
    const user = users.find((candidate) => candidate.id === payload.sub)
      ?? users.find((candidate) => candidate.email.toLowerCase() === payload.email.toLowerCase());

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const school = schools.find((candidate) => candidate.id === user.schoolId);

    if (!school) {
      return sendError(res, 'School not found', 404);
    }

    if (user.status !== 'active') {
      return sendError(res, 'This user account is inactive', 403);
    }

    req.user = user;
    req.school = school;
    next();
  } catch {
    return sendError(res, 'Invalid or expired token', 401);
  }
};

export const requireRole = (...roles: DemoUser['role'][]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole || !roles.includes(userRole)) {
      return sendError(res, 'Forbidden: insufficient role', 403);
    }

    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const permissions = req.user?.permissions ?? [];

    if (!permissions.includes(permission)) {
      return sendError(res, 'Forbidden: missing permission', 403);
    }

    next();
  };
};

export const requireSchoolAccess = (schoolId: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    if (req.user.role === 'SUPER_ADMIN') {
      next();
      return;
    }

    if (req.user.schoolId !== schoolId) {
      return sendError(res, 'Forbidden: school access denied', 403);
    }

    next();
  };
};
