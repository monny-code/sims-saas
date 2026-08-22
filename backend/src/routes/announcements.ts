import { Router } from 'express';
import { z } from 'zod';
import { getAnnouncements, writeCollection } from '../services/firebaseDataStore.js';
import { requireAuth, requirePermission, type AuthenticatedRequest } from '../middleware/auth.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = Router();
const schema = z.object({
  title: z.string().min(2),
  message: z.string().min(2),
  target: z.enum(['ALL', 'PARENTS', 'TEACHERS', 'STUDENTS']),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
});

router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const announcements = await getAnnouncements();
  const roleTarget = req.user?.role === 'PARENT' ? 'PARENTS' : req.user?.role === 'TEACHER' ? 'TEACHERS' : req.user?.role === 'STUDENT' ? 'STUDENTS' : 'ALL';
  const visible = announcements.filter((item) => item.schoolId === req.user?.schoolId && item.status === 'PUBLISHED' && (item.target === 'ALL' || item.target === roleTarget));
  return sendSuccess(res, { announcements: visible }, 'Announcements loaded');
});

router.post('/', requireAuth, requirePermission('announcements.manage'), async (req: AuthenticatedRequest, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success || !req.user) return sendError(res, 'Validation failed', 400, parsed.success ? [] : parsed.error.issues.map((issue) => issue.message));
  const announcements = await getAnnouncements();
  const announcement = { id: `ann-${Date.now()}`, schoolId: req.user.schoolId, createdBy: req.user.id, createdAt: new Date().toISOString(), ...parsed.data };
  await writeCollection('announcements', [...announcements, announcement]);
  return sendSuccess(res, { announcement }, 'Announcement created', 201);
});

export default router;
