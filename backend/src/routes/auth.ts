import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { hasSupabaseAdmin, isSupabaseEnabled, supabase } from '../config/supabase.js';
import { type DemoUser, rolePermissions } from '../data/demoData.js';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';
import { getSchools, getUsers, writeCollection } from '../services/firebaseDataStore.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'ACCOUNTANT', 'RECEPTIONIST', 'LIBRARIAN', 'PARENT', 'STUDENT']).optional(),
  schoolId: z.string().optional(),
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
  if (isSupabaseEnabled) {
    return sendError(res, 'Sign in with Supabase Auth and send its access token to /auth/me', 400);
  }
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

router.post('/register', async (req, res) => {
  if (isSupabaseEnabled) {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed', 400, parsed.error.issues.map((issue) => issue.message));
    }
    if (!hasSupabaseAdmin || !supabase) {
      return sendError(res, 'SUPABASE_SERVICE_ROLE_KEY is required to create accounts', 503);
    }

    const [users, schools] = await Promise.all([getUsers(), getSchools()]);
    if (users.some((user) => user.email.toLowerCase() === parsed.data.email.toLowerCase())) {
      return sendError(res, 'A user with this email already exists', 409);
    }
    const schoolId = schools[0]?.id;
    if (!schoolId) return sendError(res, 'No school is configured yet', 409);

    // Public registration always creates the least-privileged role. School
    // admins can assign staff roles from the user-management screen.
    const { data, error } = await supabase.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: { full_name: parsed.data.name },
    });
    if (error || !data.user) return sendError(res, error?.message ?? 'Unable to create Supabase user', 400);

    const user: DemoUser = {
      id: data.user.id,
      schoolId,
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: '',
      role: 'PARENT',
      status: 'active',
      permissions: rolePermissions.PARENT,
    };
    try {
      await writeCollection('users', [...users, user]);
    } catch (writeError) {
      await supabase.auth.admin.deleteUser(data.user.id);
      throw writeError;
    }
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return sendSuccess(res, { user: safeUser }, 'Account created. You can now sign in.', 201);
  }
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendError(res, 'Validation failed', 400, parsed.error.issues.map((issue) => issue.message));
  }

  const { name, email, password, role = 'PARENT', schoolId } = parsed.data;
  const users = await getUsers();
  const schools = await getSchools();
  const existingUser = users.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase());

  if (existingUser) {
    return sendError(res, 'A user with this email already exists', 409);
  }

  const targetSchoolId = schoolId ?? schools[0]?.id ?? 's-1';
  const resolvedSchool = schools.find((candidate) => candidate.id === targetSchoolId);

  if (!resolvedSchool) {
    return sendError(res, 'School not found', 404);
  }

  const newUser: DemoUser = {
    id: `u-${Date.now()}`,
    schoolId: targetSchoolId,
    name,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role,
    status: 'active',
    permissions: rolePermissions[role] ?? [],
  };

  const nextUsers = [...users, newUser];
  await writeCollection('users', nextUsers);

  const token = signToken(newUser);

  return sendSuccess(
    res,
    {
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        schoolId: newUser.schoolId,
        permissions: newUser.permissions,
      },
      school: resolvedSchool,
    },
    'Registration successful',
    201,
  );
});

router.get('/users', requireAuth, requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN'), async (req: AuthenticatedRequest, res) => {
  const users = await getUsers();
  const visibleUsers = req.user?.role === 'SUPER_ADMIN'
    ? users
    : users.filter((candidate) => candidate.schoolId === req.user?.schoolId);

  return sendSuccess(
    res,
    {
      users: visibleUsers.map(({ passwordHash, ...user }) => user),
    },
    'Users loaded',
  );
});

const managedRoleSchema = z.enum(['SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'ACCOUNTANT', 'RECEPTIONIST', 'LIBRARIAN', 'PARENT', 'STUDENT']);
const createManagedUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: managedRoleSchema,
  schoolId: z.string().optional(),
});
const updateManagedUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: managedRoleSchema.optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

const canManageUser = (actor: DemoUser, target: DemoUser) =>
  actor.role === 'SUPER_ADMIN' || (target.schoolId === actor.schoolId && target.role !== 'SUPER_ADMIN');

router.post('/users', requireAuth, requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN'), async (req: AuthenticatedRequest, res) => {
  const parsed = createManagedUserSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Validation failed', 400, parsed.error.issues.map((issue) => issue.message));
  if (!req.user) return sendError(res, 'Unauthorized', 401);

  const schoolId = req.user.role === 'SUPER_ADMIN' ? (parsed.data.schoolId ?? req.user.schoolId) : req.user.schoolId;
  const [users, schools] = await Promise.all([getUsers(), getSchools()]);
  if (!schools.some((school) => school.id === schoolId)) return sendError(res, 'School not found', 404);
  if (users.some((user) => user.email.toLowerCase() === parsed.data.email.toLowerCase())) return sendError(res, 'A user with this email already exists', 409);

  let id = `u-${Date.now()}`;
  if (isSupabaseEnabled) {
    if (!hasSupabaseAdmin || !supabase) return sendError(res, 'SUPABASE_SERVICE_ROLE_KEY is required to manage users', 503);
    const { data, error } = await supabase.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: { full_name: parsed.data.name },
    });
    if (error || !data.user) return sendError(res, error?.message ?? 'Unable to create Supabase user', 400);
    id = data.user.id;
  }

  const user: DemoUser = { id, schoolId, name: parsed.data.name, email: parsed.data.email, passwordHash: isSupabaseEnabled ? '' : bcrypt.hashSync(parsed.data.password, 10), role: parsed.data.role, status: 'active', permissions: rolePermissions[parsed.data.role] };
  await writeCollection('users', [...users, user]);
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return sendSuccess(res, { user: safeUser }, 'User created', 201);
});

router.patch('/users/:id', requireAuth, requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN'), async (req: AuthenticatedRequest, res) => {
  const parsed = updateManagedUserSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Validation failed', 400, parsed.error.issues.map((issue) => issue.message));
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const users = await getUsers();
  const target = users.find((user) => user.id === req.params.id);
  if (!target) return sendError(res, 'User not found', 404);
  if (!canManageUser(req.user, target)) return sendError(res, 'Forbidden: school access denied', 403);
  if (target.id === req.user.id && parsed.data.status === 'inactive') return sendError(res, 'You cannot deactivate your own account', 400);

  const updated: DemoUser = { ...target, ...parsed.data, permissions: parsed.data.role ? rolePermissions[parsed.data.role] : target.permissions };
  await writeCollection('users', users.map((user) => user.id === target.id ? updated : user));
  const { passwordHash: _passwordHash, ...safeUser } = updated;
  return sendSuccess(res, { user: safeUser }, 'User updated');
});

router.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  return sendSuccess(res, { ...req.user, passwordHash: undefined, school: req.school ?? null });
});

export default router;
