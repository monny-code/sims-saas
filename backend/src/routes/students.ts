import { Router } from 'express';
import { z } from 'zod';
import { type DemoStudent } from '../data/demoData.js';
import { getGuardians, getSchools, getStudents, writeCollection } from '../services/firebaseDataStore.js';
import { requireAuth, requirePermission, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = Router();

const studentSchema = z.object({
  firstName: z.string().min(2),
  middleName: z.string().optional(),
  lastName: z.string().min(2),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  dateOfBirth: z.string().min(1),
  placeOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  className: z.string().optional(),
  stream: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED']).optional(),
});

router.get('/', requireAuth, requirePermission('students.manage'), async (req: AuthenticatedRequest, res) => {
  const [students, schools] = await Promise.all([getStudents(), getSchools()]);
  const schoolId = req.user?.role === 'SUPER_ADMIN' ? req.query.schoolId ?? 's-1' : req.user?.schoolId ?? 's-1';
  const filtered = students.filter((student) => student.schoolId === schoolId);

  return sendSuccess(res, { students: filtered, total: filtered.length, schools }, 'Students loaded');
});

router.get('/:id', requireAuth, requirePermission('students.manage'), async (req: AuthenticatedRequest, res) => {
  const [students, schools, guardians] = await Promise.all([getStudents(), getSchools(), getGuardians()]);
  const target = students.find((student) => student.id === req.params.id);

  if (!target) {
    return sendError(res, 'Student not found', 404);
  }

  if (req.user?.role !== 'SUPER_ADMIN' && req.user?.schoolId !== target.schoolId) {
    return sendError(res, 'Forbidden: student access denied', 403);
  }

  const studentGuardians = guardians.filter((guardian) => guardian.schoolId === target.schoolId);

  return sendSuccess(
    res,
    {
      student: target,
      guardians: studentGuardians,
      school: schools.find((school) => school.id === target.schoolId),
    },
    'Student profile loaded',
  );
});

router.post('/', requireAuth, requireRole('SCHOOL_ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res) => {
  const parsed = studentSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendError(res, 'Validation failed', 400, parsed.error.issues.map((issue) => issue.message));
  }

  const [students] = await Promise.all([getStudents()]);
  const schoolId = req.user?.role === 'SUPER_ADMIN' ? req.body.schoolId ?? 's-1' : req.user?.schoolId ?? 's-1';
  const nextStudent: DemoStudent = {
    id: `st-${Date.now()}`,
    schoolId,
    admissionNumber: `ADM-${Date.now()}`,
    admissionDate: new Date().toISOString().slice(0, 10),
    status: 'ACTIVE',
    ...parsed.data,
  };

  const nextStudents = [...students, nextStudent];
  await writeCollection('students', nextStudents);

  return sendSuccess(res, { student: nextStudent }, 'Student created', 201);
});

router.patch('/:id', requireAuth, requirePermission('students.manage'), async (req: AuthenticatedRequest, res) => {
  const students = await getStudents();
  const index = students.findIndex((student) => student.id === req.params.id);

  if (index === -1) {
    return sendError(res, 'Student not found', 404);
  }

  const target = students[index];

  if (req.user?.role !== 'SUPER_ADMIN' && req.user?.schoolId !== target.schoolId) {
    return sendError(res, 'Forbidden: student access denied', 403);
  }

  const nextStudent = {
    ...target,
    ...req.body,
  };

  const nextStudents = [...students];
  nextStudents[index] = nextStudent;
  await writeCollection('students', nextStudents);

  return sendSuccess(res, { student: nextStudent }, 'Student updated');
});

router.delete('/:id', requireAuth, requireRole('SCHOOL_ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res) => {
  const students = await getStudents();
  const index = students.findIndex((student) => student.id === req.params.id);

  if (index === -1) {
    return sendError(res, 'Student not found', 404);
  }

  const target = students[index];

  if (req.user?.role !== 'SUPER_ADMIN' && req.user?.schoolId !== target.schoolId) {
    return sendError(res, 'Forbidden: student access denied', 403);
  }

  const nextStudents = students.filter((student) => student.id !== req.params.id);
  await writeCollection('students', nextStudents);

  return sendSuccess(res, { deletedId: req.params.id }, 'Student deleted');
});

export default router;
