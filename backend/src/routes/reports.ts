import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { getAttendanceRecords, getFeePayments, getGuardians, getInvoices, getSchools, getStudentGuardians, getStudents, getUsers } from '../services/firebaseDataStore.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();

const schoolFilter = <T extends { schoolId: string }>(req: AuthenticatedRequest, items: T[]) => {
  if (req.user?.role === 'SUPER_ADMIN') {
    return items;
  }

  return items.filter((item) => item.schoolId === req.user?.schoolId);
};

router.get('/summary', requireAuth, async (req: AuthenticatedRequest, res) => {
  const [schools, students, attendanceRecords, invoices, feePayments, users] = await Promise.all([
    getSchools(),
    getStudents(),
    getAttendanceRecords(),
    getInvoices(),
    getFeePayments(),
    getUsers(),
  ]);

  const matchingSchoolId = req.user?.role === 'SUPER_ADMIN' ? 's-1' : req.user?.schoolId;
  const school = schools.find((entry) => entry.id === matchingSchoolId) ?? schools[0];
  const schoolStudents = schoolFilter(req, students);
  const schoolAttendance = schoolFilter(req, attendanceRecords);
  const schoolInvoices = schoolFilter(req, invoices);
  const schoolPayments = schoolFilter(req, feePayments);

  const attendanceRate = schoolAttendance.length
    ? (schoolAttendance.filter((record) => record.status === 'PRESENT').length / schoolAttendance.length) * 100
    : 0;

  const totalCollected = schoolPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const overdueInvoices = schoolInvoices.filter((invoice) => invoice.status === 'OVERDUE' || invoice.status === 'UNPAID').length;

  return sendSuccess(
    res,
    {
      school: {
        id: school.id,
        name: school.name,
      },
      summary: {
        totalStudents: schoolStudents.length,
        totalTeachers: users.filter((user) => user.schoolId === school.id && user.role === 'TEACHER').length,
        attendanceRate: Number(attendanceRate.toFixed(1)),
        totalCollected,
        overdueInvoices,
        activeParents: users.filter((user) => user.schoolId === school.id && user.role === 'PARENT').length,
      },
      attendanceTrend: [
        { label: 'Mon', value: 86 },
        { label: 'Tue', value: 89 },
        { label: 'Wed', value: 94 },
        { label: 'Thu', value: 92 },
        { label: 'Fri', value: 96 },
      ],
      feePerformance: [
        { label: 'Term 1', value: 72 },
        { label: 'Term 2', value: 84 },
        { label: 'Term 3', value: 91 },
      ],
    },
    'Report summary loaded',
  );
});

router.get('/parent-portal', requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!req.user || req.user.role !== 'PARENT') {
    return sendSuccess(
      res,
      {
        children: [],
        notices: [],
        feeSummary: { due: 0, paid: 0 },
      },
      'Parent portal summary loaded',
    );
  }

  const [students, invoices, feePayments, guardians, links, attendance] = await Promise.all([getStudents(), getInvoices(), getFeePayments(), getGuardians(), getStudentGuardians(), getAttendanceRecords()]);
  const schoolId = req.user.schoolId;
  const parentGuardianIds = guardians
    .filter((guardian) => guardian.schoolId === schoolId && ((guardian as { userId?: string }).userId === req.user?.id || guardian.email?.toLowerCase() === req.user?.email.toLowerCase()))
    .map((guardian) => guardian.id);
  const children = students.filter((student) => student.schoolId === schoolId && links.some((link) => link.studentId === student.id && parentGuardianIds.includes(link.guardianId)));
  const invoicesForChild = invoices.filter((invoice) => invoice.schoolId === schoolId && children.some((child) => child.id === invoice.studentId));
  const paymentsForChild = feePayments.filter((payment) => payment.schoolId === schoolId && children.some((child) => child.id === payment.studentId));

  return sendSuccess(
    res,
    {
      children: children.map((child) => ({
        id: child.id,
        name: `${child.firstName} ${child.lastName}`,
        className: child.className ?? 'Form 1',
        attendance: (() => {
          const childRecords = attendance.filter((record) => record.studentId === child.id);
          return childRecords.length ? Math.round((childRecords.filter((record) => record.status === 'PRESENT').length / childRecords.length) * 100) : 0;
        })(),
      })),
      notices: [],
      feeSummary: {
        due: invoicesForChild.reduce((sum, invoice) => sum + (invoice.status === 'PAID' ? 0 : invoice.total), 0),
        paid: paymentsForChild.reduce((sum, payment) => sum + payment.amount, 0),
      },
    },
    'Parent portal data loaded',
  );
});

export default router;
