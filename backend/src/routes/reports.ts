import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { getAttendanceRecords, getExams, getFeePayments, getGuardians, getInvoices, getMarks, getSchools, getStudentGuardians, getStudents, getUsers } from '../services/firebaseDataStore.js';
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

  const attendanceTrend = [...new Set(schoolAttendance.map((record) => record.date))]
    .sort()
    .slice(-7)
    .map((date) => {
      const recordsForDate = schoolAttendance.filter((record) => record.date === date);
      const presentRecords = recordsForDate.filter((record) => record.status === 'PRESENT').length;
      return {
        label: date,
        value: recordsForDate.length ? Number(((presentRecords / recordsForDate.length) * 100).toFixed(1)) : 0,
      };
    });

  const feePerformance = [...new Set(schoolPayments.map((payment) => payment.paidAt?.slice(0, 7)).filter(Boolean))]
    .sort()
    .slice(-6)
    .map((period) => ({
      label: period as string,
      value: schoolPayments.filter((payment) => payment.paidAt?.startsWith(period as string)).reduce((sum, payment) => sum + payment.amount, 0),
    }));

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
      attendanceTrend,
      feePerformance,
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
        due: invoicesForChild.reduce((sum, invoice) => {
          const paid = paymentsForChild.filter((payment) => payment.invoiceId === invoice.id).reduce((total, payment) => total + payment.amount, 0);
          return sum + Math.max(invoice.total - paid, 0);
        }, 0),
        paid: paymentsForChild.reduce((sum, payment) => sum + payment.amount, 0),
      },
    },
    'Parent portal data loaded',
  );
});

router.get('/parent-results', requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!req.user || !['PARENT', 'STUDENT'].includes(req.user.role)) return sendSuccess(res, { results: [] }, 'Results loaded');
  const [students, guardians, links, exams, marks] = await Promise.all([getStudents(), getGuardians(), getStudentGuardians(), getExams(), getMarks()]);
  const guardianIds = guardians.filter((guardian) => guardian.schoolId === req.user?.schoolId && ((guardian as { userId?: string }).userId === req.user?.id || guardian.email?.toLowerCase() === req.user?.email.toLowerCase())).map((guardian) => guardian.id);
  const childIds = req.user.role === 'STUDENT' ? [req.user.id] : students.filter((student) => student.schoolId === req.user?.schoolId && links.some((link) => link.studentId === student.id && guardianIds.includes(link.guardianId))).map((student) => student.id);
  const publishedExamIds = exams.filter((exam) => exam.schoolId === req.user?.schoolId && exam.status === 'CLOSED').map((exam) => exam.id);
  return sendSuccess(res, { results: marks.filter((mark) => mark.schoolId === req.user?.schoolId && childIds.includes(mark.studentId) && publishedExamIds.includes(mark.examId)) }, 'Results loaded');
});

export default router;
