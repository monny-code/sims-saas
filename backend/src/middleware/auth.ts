import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { DemoSchool, DemoUser } from '../data/demoData.js';
import { getSchools, getUsers } from '../services/firebaseDataStore.js';
import { sendError } from '../utils/response.js';

export type AuthenticatedRequest = Request & {
  user?: DemoUser;
  school?: DemoSchool;
};

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Unauthorized', 401);
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const payload = jwt.verify(token, env.jwtSecret) as {
      sub: string;
      email: string;
      role: DemoUser['role'];
      schoolId: string;
      permissions: string[];
    };

    void Promise.all([getUsers(), getSchools()]).then(([users, schools]) => {
      const user = users.find((candidate) => candidate.id === payload.sub);

      if (!user) {
        return sendError(res, 'User not found', 404);
      }

      const school = schools.find((candidate) => candidate.id === user.schoolId);

      if (!school) {
        return sendError(res, 'School not found', 404);
      }

      req.user = { ...user, permissions: payload.permissions.length ? payload.permissions : user.permissions };
      req.school = school;
      next();
    }).catch(() => {
      return sendError(res, 'Invalid or expired token', 401);
    });
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
