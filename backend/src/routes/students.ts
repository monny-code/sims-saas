import { Router } from 'express';
import { z } from 'zod';
import { type DemoStudent } from '../data/demoData.js';
import { getGuardians, getSchools, getStudentGuardians, getStudents, getUsers, writeCollection } from '../services/firebaseDataStore.js';
import { requireAuth, requirePermission, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = Router();

const studentSchema = z.object({
  admissionNumber: z.string().min(1).optional(),
  admissionDate: z.string().min(1).optional(),
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
  guardian: z.object({
    name: z.string().min(2),
    relationship: z.string().min(2),
    phone: z.string().min(5),
    email: z.string().email().optional(),
    address: z.string().optional(),
  }).optional(),
});

router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!req.user?.permissions.includes('students.manage') && !req.user?.permissions.includes('students.view')) {
    return sendError(res, 'Forbidden: missing student permission', 403);
  }

  const [students, schools] = await Promise.all([getStudents(), getSchools()]);
  const schoolId = req.user?.role === 'SUPER_ADMIN' ? req.query.schoolId ?? 's-1' : req.user?.schoolId ?? 's-1';
  const query = typeof req.query.search === 'string' ? req.query.search.toLowerCase() : '';
  const filtered = students.filter((student) => student.schoolId === schoolId && (!query
    || `${student.firstName} ${student.middleName ?? ''} ${student.lastName} ${student.admissionNumber}`.toLowerCase().includes(query)));

  return sendSuccess(res, { students: filtered, total: filtered.length, schools }, 'Students loaded');
});

router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!req.user?.permissions.includes('students.manage') && !req.user?.permissions.includes('students.view')) {
    return sendError(res, 'Forbidden: missing student permission', 403);
  }

  const [students, schools, guardians, links] = await Promise.all([getStudents(), getSchools(), getGuardians(), getStudentGuardians()]);
  const target = students.find((student) => student.id === req.params.id);

  if (!target) {
    return sendError(res, 'Student not found', 404);
  }

  if (req.user?.role !== 'SUPER_ADMIN' && req.user?.schoolId !== target.schoolId) {
    return sendError(res, 'Forbidden: student access denied', 403);
  }

  const studentGuardians = guardians.filter((guardian) => links.some((link) => link.studentId === target.id && link.guardianId === guardian.id));

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

  const [students, guardians, links, users, schools] = await Promise.all([getStudents(), getGuardians(), getStudentGuardians(), getUsers(), getSchools()]);
  const schoolId = req.user?.role === 'SUPER_ADMIN' ? req.body.schoolId ?? 's-1' : req.user?.schoolId ?? 's-1';

  if (!schools.some((school) => school.id === schoolId)) {
    return sendError(res, 'School not found', 404);
  }

  if (students.some((student) => student.schoolId === schoolId && student.admissionNumber === parsed.data.admissionNumber)) {
    return sendError(res, 'Admission number already exists', 409);
  }

  const { guardian, ...studentFields } = parsed.data;
  const nextStudent: DemoStudent = {
    id: `st-${Date.now()}`,
    schoolId,
    admissionNumber: studentFields.admissionNumber ?? `ADM-${Date.now()}`,
    admissionDate: studentFields.admissionDate ?? new Date().toISOString().slice(0, 10),
    status: 'ACTIVE',
    ...studentFields,
  };
  const student = nextStudent;

  const nextStudents = [...students, student];
  await writeCollection('students', nextStudents);

  if (guardian) {
    const matchingParent = guardian.email
      ? users.find((user) => user.role === 'PARENT' && user.email.toLowerCase() === guardian.email?.toLowerCase())
      : undefined;
    const existingGuardian = guardians.find((entry) => entry.schoolId === schoolId && entry.email?.toLowerCase() === guardian.email?.toLowerCase());
    const guardianRecord = existingGuardian ?? {
      id: `g-${Date.now()}`,
      schoolId,
      ...guardian,
      userId: matchingParent?.id,
    };
    if (!existingGuardian) await writeCollection('guardians', [...guardians, guardianRecord]);
    if (!links.some((link) => link.studentId === student.id && link.guardianId === guardianRecord.id)) {
      await writeCollection('studentGuardians', [...links, {
        id: `sg-${Date.now()}`,
        studentId: student.id,
        guardianId: guardianRecord.id,
        relationship: guardian.relationship,
        isPrimary: true,
      }]);
    }
  }

  return sendSuccess(res, { student }, 'Student created', 201);
});

router.patch('/:id', requireAuth, requirePermission('students.manage'), async (req: AuthenticatedRequest, res) => {
  const parsed = studentSchema.partial().safeParse(req.body);

  if (!parsed.success) {
    return sendError(res, 'Validation failed', 400, parsed.error.issues.map((issue) => issue.message));
  }

  const students = await getStudents();
  const index = students.findIndex((student) => student.id === req.params.id);

  if (index === -1) {
    return sendError(res, 'Student not found', 404);
  }

  const target = students[index];

  if (req.user?.role !== 'SUPER_ADMIN' && req.user?.schoolId !== target.schoolId) {
    return sendError(res, 'Forbidden: student access denied', 403);
  }

  const { guardian: _guardian, ...studentFields } = parsed.data;
  const nextStudent = {
    ...target,
    ...studentFields,
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

  const nextStudents = students.map((student) => student.id === req.params.id
    ? { ...student, status: 'INACTIVE' as const }
    : student);
  await writeCollection('students', nextStudents);

  return sendSuccess(res, { student: nextStudents.find((student) => student.id === req.params.id) }, 'Student deactivated');
});

export default router;
