import { Router } from 'express';
import { z } from 'zod';
import { getAcademicClasses, getAcademicYears, getAttendanceRecords, getExams, getMarks, getStreams, getSubjects, writeCollection } from '../services/firebaseDataStore.js';
import { requireAuth, requirePermission, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = Router();

const gradeSchema = z.object({
  name: z.string().min(1),
  minMark: z.number().min(0),
  maxMark: z.number().max(100),
  gradeValue: z.string().min(1),
});

router.get('/years', requireAuth, async (req: AuthenticatedRequest, res) => {
  const data = await getAcademicYears();
  const filtered = data.filter((year) => req.user?.role === 'SUPER_ADMIN' || year.schoolId === req.user?.schoolId);
  return sendSuccess(res, { academicYears: filtered }, 'Academic years loaded');
});

router.get('/classes', requireAuth, async (req: AuthenticatedRequest, res) => {
  const data = await getAcademicClasses();
  const filtered = data.filter((cls) => req.user?.role === 'SUPER_ADMIN' || cls.schoolId === req.user?.schoolId);
  return sendSuccess(res, { classes: filtered }, 'Classes loaded');
});

router.get('/streams', requireAuth, async (req: AuthenticatedRequest, res) => {
  const data = await getStreams();
  const filtered = data.filter((stream) => req.user?.role === 'SUPER_ADMIN' || stream.schoolId === req.user?.schoolId);
  return sendSuccess(res, { streams: filtered }, 'Streams loaded');
});

router.get('/subjects', requireAuth, async (req: AuthenticatedRequest, res) => {
  const data = await getSubjects();
  const filtered = data.filter((subject) => req.user?.role === 'SUPER_ADMIN' || subject.schoolId === req.user?.schoolId);
  return sendSuccess(res, { subjects: filtered }, 'Subjects loaded');
});

router.get('/attendance', requireAuth, requirePermission('attendance.manage'), async (req: AuthenticatedRequest, res) => {
  const data = await getAttendanceRecords();
  const filtered = data.filter((record) => req.user?.role === 'SUPER_ADMIN' || record.schoolId === req.user?.schoolId);
  return sendSuccess(res, { attendance: filtered }, 'Attendance loaded');
});

router.post('/attendance', requireAuth, requirePermission('attendance.manage'), async (req: AuthenticatedRequest, res) => {
  const parsed = z.object({
    studentId: z.string().min(1),
    studentName: z.string().min(1),
    date: z.string().min(1),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
    className: z.string().min(1),
    reason: z.string().optional(),
  }).safeParse(req.body);

  if (!parsed.success) {
    return sendError(res, 'Validation failed', 400, parsed.error.issues.map((issue) => issue.message));
  }

  const attendance = {
    id: `att-${Date.now()}`,
    schoolId: req.user?.schoolId ?? 's-1',
    ...parsed.data,
  };

  const records = await getAttendanceRecords();
  await writeCollection('attendanceRecords', [...records, attendance]);

  return sendSuccess(res, { attendance }, 'Attendance recorded', 201);
});

router.get('/exams', requireAuth, async (req: AuthenticatedRequest, res) => {
  const data = await getExams();
  const filtered = data.filter((exam) => req.user?.role === 'SUPER_ADMIN' || exam.schoolId === req.user?.schoolId);
  return sendSuccess(res, { exams: filtered }, 'Exams loaded');
});

router.get('/marks', requireAuth, requirePermission('marks.manage'), async (req: AuthenticatedRequest, res) => {
  const data = await getMarks();
  const filtered = data.filter((mark) => req.user?.role === 'SUPER_ADMIN' || mark.schoolId === req.user?.schoolId);
  return sendSuccess(res, { marks: filtered }, 'Marks loaded');
});

router.post('/marks', requireAuth, requirePermission('marks.manage'), async (req: AuthenticatedRequest, res) => {
  const parsed = z.object({
    studentId: z.string().min(1),
    studentName: z.string().min(1),
    subject: z.string().min(1),
    examId: z.string().min(1),
    marks: z.number().min(0).max(100),
    grade: z.string().min(1),
    remarks: z.string().optional(),
  }).safeParse(req.body);

  if (!parsed.success) {
    return sendError(res, 'Validation failed', 400, parsed.error.issues.map((issue) => issue.message));
  }

  const entry = {
    id: `mk-${Date.now()}`,
    schoolId: req.user?.schoolId ?? 's-1',
    ...parsed.data,
    remarks: parsed.data.remarks ?? '',
  };

  const entries = await getMarks();
  await writeCollection('marks', [...entries, entry]);

  return sendSuccess(res, { mark: entry }, 'Marks recorded', 201);
});

router.post('/grades', requireAuth, requireRole('SCHOOL_ADMIN', 'SUPER_ADMIN'), (req: AuthenticatedRequest, res) => {
  const parsed = gradeSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendError(res, 'Validation failed', 400, parsed.error.issues.map((issue) => issue.message));
  }

  return sendSuccess(
    res,
    {
      grade: {
        ...parsed.data,
        schoolId: req.user?.schoolId ?? 's-1',
      },
    },
    'Grade configuration saved',
    201,
  );
});

export default router;
