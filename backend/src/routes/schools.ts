import { Router } from 'express';
import { z } from 'zod';
import { getSchools, getUsers, writeCollection } from '../services/firebaseDataStore.js';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = Router();

router.get('/', requireAuth, requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN'), async (req: AuthenticatedRequest, res) => {
  const schools = await getSchools();
  const accessibleSchools = req.user?.role === 'SUPER_ADMIN' ? schools : schools.filter((school) => school.id === req.user?.schoolId);

  return sendSuccess(res, { schools: accessibleSchools }, 'Schools loaded');
});

router.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  if (!req.school || !req.user) {
    return sendError(res, 'School profile unavailable', 404);
  }

  return sendSuccess(
    res,
    {
      school: req.school,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        schoolId: req.user.schoolId,
        permissions: req.user.permissions,
      },
    },
    'Current school context loaded',
  );
});

router.get('/:schoolId/stats', requireAuth, async (req: AuthenticatedRequest, res) => {
  const requestedSchoolId = req.params.schoolId;

  if (req.user?.role !== 'SUPER_ADMIN' && req.user?.schoolId !== requestedSchoolId) {
    return sendError(res, 'Forbidden: school access denied', 403);
  }

  const [schools, users] = await Promise.all([getSchools(), getUsers()]);
  const school = schools.find((candidate) => candidate.id === requestedSchoolId);

  if (!school) {
    return sendError(res, 'School not found', 404);
  }

  const schoolUsers = users.filter((candidate) => candidate.schoolId === school.id);

  return sendSuccess(
    res,
    {
      schoolId: school.id,
      name: school.name,
      stats: {
        totalUsers: schoolUsers.length,
        totalAdmins: schoolUsers.filter((user) => user.role === 'SCHOOL_ADMIN').length,
        totalTeachers: schoolUsers.filter((user) => user.role === 'TEACHER').length,
        totalParents: schoolUsers.filter((user) => user.role === 'PARENT').length,
      },
    },
    'School statistics loaded',
  );
});

const setSchoolSchema = z.object({
  name: z.string().min(2),
  registrationNumber: z.string().min(2),
  address: z.string().min(2),
  region: z.string().min(2),
  district: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email(),
});

router.post('/', requireAuth, requireRole('SUPER_ADMIN'), async (req: AuthenticatedRequest, res) => {
  const parsed = setSchoolSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendError(res, 'Validation failed', 400, parsed.error.issues.map((issue) => issue.message));
  }

  const school = {
    id: `s-${Date.now()}`,
    ...parsed.data,
    status: 'ACTIVE' as const,
  };

  const schools = await getSchools();
  const nextSchools = [...schools, school];
  await writeCollection('schools', nextSchools);

  return sendSuccess(res, { school }, 'School created', 201);
});

export default router;
