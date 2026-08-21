import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { type DemoUser } from '../data/demoData.js';
import { getSchools, getUsers } from '../services/firebaseDataStore.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const signToken = (user: DemoUser) => {
  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  };

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      permissions: user.permissions,
    },
    env.jwtSecret,
    options,
  );
};

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendError(res, 'Validation failed', 400, parsed.error.issues.map((issue) => issue.message));
  }

  const { email, password } = parsed.data;
  const [users, schools] = await Promise.all([getUsers(), getSchools()]);
  const user = users.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase());

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return sendError(res, 'Invalid email or password', 401);
  }

  const school = schools.find((candidate) => candidate.id === user.schoolId);
  const token = signToken(user);

  return sendSuccess(
    res,
    {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        permissions: user.permissions,
      },
      school: school ?? null,
    },
    'Login successful',
    200,
  );
});

router.get('/me', async (req, res) => {
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

    const [users, schools] = await Promise.all([getUsers(), getSchools()]);
    const user = users.find((candidate) => candidate.id === payload.sub);

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const school = schools.find((candidate) => candidate.id === user.schoolId);

    return sendSuccess(res, {
      id: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      name: user.name,
      permissions: payload.permissions.length ? payload.permissions : user.permissions,
      school: school ?? null,
    });
  } catch {
    return sendError(res, 'Invalid or expired token', 401);
  }
});

export default router;
