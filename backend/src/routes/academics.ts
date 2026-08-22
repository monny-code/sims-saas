import { Router } from 'express';
import { z } from 'zod';
import { getAcademicClasses, getAcademicYears, getAttendanceRecords, getExams, getMarks, getStreams, getSubjects, getStudents, writeCollection } from '../services/firebaseDataStore.js';
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

const classSchema = z.object({ name: z.string().min(2), level: z.string().min(2), academicYearId: z.string().min(1) });
router.post('/classes', requireAuth, requirePermission('academics.manage'), async (req: AuthenticatedRequest, res) => {
  const parsed = classSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Validation failed', 400, parsed.error.issues.map((issue) => issue.message));
  const classes = await getAcademicClasses();
  const schoolId = req.user?.schoolId ?? 's-1';
  if (classes.some((item) => item.schoolId === schoolId && item.name.toLowerCase() === parsed.data.name.toLowerCase())) return sendError(res, 'Class already exists', 409);
  const academicClass = { id: `cls-${Date.now()}`, schoolId, status: 'ACTIVE' as const, ...parsed.data };
  await writeCollection('academicClasses', [...classes, academicClass]);
  return sendSuccess(res, { class: academicClass }, 'Class created', 201);
});

router.get('/streams', requireAuth, async (req: AuthenticatedRequest, res) => {
  const data = await getStreams();
  const filtered = data.filter((stream) => req.user?.role === 'SUPER_ADMIN' || stream.schoolId === req.user?.schoolId);
  return sendSuccess(res, { streams: filtered }, 'Streams loaded');
});

const streamSchema = z.object({ name: z.string().min(1) });
router.post('/streams', requireAuth, requirePermission('academics.manage'), async (req: AuthenticatedRequest, res) => {
  const parsed = streamSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Validation failed', 400, parsed.error.issues.map((issue) => issue.message));
  const streams = await getStreams();
  const schoolId = req.user?.schoolId ?? 's-1';
  if (streams.some((item) => item.schoolId === schoolId && item.name.toLowerCase() === parsed.data.name.toLowerCase())) return sendError(res, 'Stream already exists', 409);
  const stream = { id: `str-${Date.now()}`, schoolId, ...parsed.data };
  await writeCollection('streams', [...streams, stream]);
  return sendSuccess(res, { stream }, 'Stream created', 201);
});

router.get('/subjects', requireAuth, async (req: AuthenticatedRequest, res) => {
  const data = await getSubjects();
  const filtered = data.filter((subject) => req.user?.role === 'SUPER_ADMIN' || subject.schoolId === req.user?.schoolId);
  return sendSuccess(res, { subjects: filtered }, 'Subjects loaded');
});

const subjectSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(20),
  category: z.string().min(2),
});

router.post('/subjects', requireAuth, requirePermission('academics.manage'), async (req: AuthenticatedRequest, res) => {
  const parsed = subjectSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Validation failed', 400, parsed.error.issues.map((issue) => issue.message));

  const subjects = await getSubjects();
  const schoolId = req.user?.schoolId ?? 's-1';
  if (subjects.some((subject) => subject.schoolId === schoolId && subject.code.toLowerCase() === parsed.data.code.toLowerCase())) {
    return sendError(res, 'Subject code already exists', 409);
  }

  const subject = { id: `sub-${Date.now()}`, schoolId, ...parsed.data, status: 'ACTIVE' as const };
  await writeCollection('subjects', [...subjects, subject]);
  return sendSuccess(res, { subject }, 'Subject created', 201);
});

router.patch('/subjects/:id', requireAuth, requirePermission('academics.manage'), async (req: AuthenticatedRequest, res) => {
  const parsed = subjectSchema.partial().safeParse(req.body);
  if (!parsed.success) return sendError(res, 'Validation failed', 400, parsed.error.issues.map((issue) => issue.message));

  const subjects = await getSubjects();
  const index = subjects.findIndex((subject) => subject.id === req.params.id);
  if (index === -1) return sendError(res, 'Subject not found', 404);
  const target = subjects[index];
  if (req.user?.role !== 'SUPER_ADMIN' && target.schoolId !== req.user?.schoolId) return sendError(res, 'Forbidden: subject access denied', 403);
  if (parsed.data.code && subjects.some((subject) => subject.id !== target.id && subject.schoolId === target.schoolId && subject.code.toLowerCase() === parsed.data.code?.toLowerCase())) {
    return sendError(res, 'Subject code already exists', 409);
  }

  const subject = { ...target, ...parsed.data };
  const nextSubjects = [...subjects];
  nextSubjects[index] = subject;
  await writeCollection('subjects', nextSubjects);
  return sendSuccess(res, { subject }, 'Subject updated');
});

router.get('/attendance', requireAuth, requirePermission('attendance.manage'), async (req: AuthenticatedRequest, res) => {
  const data = await getAttendanceRecords();
  const filtered = data.filter((record) => req.user?.role === 'SUPER_ADMIN' || record.schoolId === req.user?.schoolId);
  return sendSuccess(res, { attendance: filtered }, 'Attendance loaded');
});

router.post('/attendance', requireAuth, requirePermission('attendance.manage'), async (req: AuthenticatedRequest, res) => {
  const parsed = z.object({
    studentId: z.string().min(1),
    date: z.string().min(1),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
    reason: z.string().optional(),
  }).safeParse(req.body);

  if (!parsed.success) {
    return sendError(res, 'Validation failed', 400, parsed.error.issues.map((issue) => issue.message));
  }

  const [students, records] = await Promise.all([getStudents(), getAttendanceRecords()]);
  const student = students.find((entry) => entry.id === parsed.data.studentId);

  if (!student || (req.user?.role !== 'SUPER_ADMIN' && student.schoolId !== req.user?.schoolId)) {
    return sendError(res, 'Student not found', 404);
  }

  const attendance = {
    id: records.find((record) => record.studentId === student.id && record.date === parsed.data.date && record.schoolId === student.schoolId)?.id ?? `att-${Date.now()}`,
    schoolId: student.schoolId,
    studentId: student.id,
    studentName: `${student.firstName} ${student.lastName}`,
    date: parsed.data.date,
    status: parsed.data.status,
    className: student.className ?? '',
    reason: parsed.data.reason ?? '',
  };

  const nextRecords = records.some((record) => record.id === attendance.id)
    ? records.map((record) => record.id === attendance.id ? attendance : record)
    : [...records, attendance];
  await writeCollection('attendanceRecords', nextRecords);

  return sendSuccess(res, { attendance }, 'Attendance recorded', records.some((record) => record.id === attendance.id) ? 200 : 201);
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
    subject: z.string().min(1),
    examId: z.string().min(1),
    marks: z.number().min(0).max(100),
    remarks: z.string().optional(),
  }).safeParse(req.body);

  if (!parsed.success) {
    return sendError(res, 'Validation failed', 400, parsed.error.issues.map((issue) => issue.message));
  }

  const [students, exams, subjects, entries] = await Promise.all([getStudents(), getExams(), getSubjects(), getMarks()]);
  const student = students.find((entry) => entry.id === parsed.data.studentId);
  const exam = exams.find((entry) => entry.id === parsed.data.examId);
  const subject = subjects.find((entry) => entry.name === parsed.data.subject || entry.code === parsed.data.subject);

  if (!student || !exam || !subject || student.schoolId !== exam.schoolId || exam.schoolId !== subject.schoolId
    || (req.user?.role !== 'SUPER_ADMIN' && student.schoolId !== req.user?.schoolId)) {
    return sendError(res, 'Student, exam, or subject not found', 404);
  }

  const grade = parsed.data.marks >= 75 ? 'A' : parsed.data.marks >= 60 ? 'B' : parsed.data.marks >= 45 ? 'C' : parsed.data.marks >= 30 ? 'D' : 'F';
  const existing = entries.find((entry) => entry.studentId === student.id && entry.examId === exam.id && entry.subject === subject.name && entry.schoolId === student.schoolId);
  const entry = {
    id: existing?.id ?? `mk-${Date.now()}`,
    schoolId: student.schoolId,
    studentId: student.id,
    studentName: `${student.firstName} ${student.lastName}`,
    subject: subject.name,
    examId: exam.id,
    marks: parsed.data.marks,
    grade,
    remarks: parsed.data.remarks ?? '',
  };

  const nextEntries = existing
    ? entries.map((mark) => mark.id === existing.id ? entry : mark)
    : [...entries, entry];
  await writeCollection('marks', nextEntries);

  return sendSuccess(res, { mark: entry }, 'Marks recorded', existing ? 200 : 201);
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
