import bcrypt from 'bcryptjs';

export type Role =
  | 'SUPER_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'PRINCIPAL'
  | 'TEACHER'
  | 'ACCOUNTANT'
  | 'RECEPTIONIST'
  | 'LIBRARIAN'
  | 'PARENT'
  | 'STUDENT';

export type DemoSchool = {
  id: string;
  name: string;
  registrationNumber: string;
  address: string;
  region: string;
  district: string;
  phone: string;
  email: string;
  status: 'ACTIVE' | 'SUSPENDED';
};

export type DemoUser = {
  id: string;
  schoolId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  status: 'active' | 'inactive';
  permissions: string[];
};

export type DemoGuardian = {
  id: string;
  schoolId: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
  occupation?: string;
};

export type DemoStudent = {
  id: string;
  schoolId: string;
  admissionNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth: string;
  placeOfBirth?: string;
  nationality?: string;
  phone?: string;
  email?: string;
  address?: string;
  photo?: string;
  admissionDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'TRANSFERRED';
  className?: string;
  stream?: string;
};

export const schools: DemoSchool[] = [
  {
    id: 's-1',
    name: 'Example International School',
    registrationNumber: 'REG-001',
    address: 'Dar es Salaam',
    region: 'Dar es Salaam',
    district: 'Kinondoni',
    phone: '+255712345678',
    email: 'info@example.edu',
    status: 'ACTIVE',
  },
  {
    id: 's-2',
    name: 'Green Valley Academy',
    registrationNumber: 'REG-002',
    address: 'Arusha',
    region: 'Arusha',
    district: 'Arusha City',
    phone: '+255765432109',
    email: 'info@greenvalley.ac.tz',
    status: 'ACTIVE',
  },
];

export const rolePermissions: Record<Role, string[]> = {
  SUPER_ADMIN: ['schools.manage', 'users.manage', 'students.manage', 'fees.manage', 'reports.view'],
  SCHOOL_ADMIN: ['students.manage', 'teachers.manage', 'fees.manage', 'settings.manage', 'reports.view', 'attendance.manage', 'marks.manage'],
  PRINCIPAL: ['students.view', 'academics.manage', 'reports.view'],
  TEACHER: ['attendance.manage', 'marks.manage', 'students.view', 'timetable.view'],
  ACCOUNTANT: ['fees.manage', 'invoices.manage', 'payments.manage', 'reports.view', 'students.view'],
  RECEPTIONIST: ['students.view', 'admissions.manage', 'notifications.send'],
  LIBRARIAN: ['library.manage', 'students.view'],
  PARENT: ['children.view', 'fees.view', 'results.view'],
  STUDENT: ['profile.view', 'results.view', 'fees.view'],
};

export const users: DemoUser[] = [
  {
    id: 'u-1',
    schoolId: 's-1',
    name: 'System Admin',
    email: 'admin@example.com',
    passwordHash: bcrypt.hashSync('Password123!', 10),
    role: 'SUPER_ADMIN',
    status: 'active',
    permissions: rolePermissions.SUPER_ADMIN,
  },
  {
    id: 'u-2',
    schoolId: 's-1',
    name: 'School Admin',
    email: 'schooladmin@example.com',
    passwordHash: bcrypt.hashSync('Password123!', 10),
    role: 'SCHOOL_ADMIN',
    status: 'active',
    permissions: rolePermissions.SCHOOL_ADMIN,
  },
  {
    id: 'u-3',
    schoolId: 's-1',
    name: 'Teacher User',
    email: 'teacher@example.com',
    passwordHash: bcrypt.hashSync('Password123!', 10),
    role: 'TEACHER',
    status: 'active',
    permissions: rolePermissions.TEACHER,
  },
  {
    id: 'u-4',
    schoolId: 's-1',
    name: 'Accountant User',
    email: 'accountant@example.com',
    passwordHash: bcrypt.hashSync('Password123!', 10),
    role: 'ACCOUNTANT',
    status: 'active',
    permissions: rolePermissions.ACCOUNTANT,
  },
  {
    id: 'u-5',
    schoolId: 's-1',
    name: 'Parent User',
    email: 'parent@example.com',
    passwordHash: bcrypt.hashSync('Password123!', 10),
    role: 'PARENT',
    status: 'active',
    permissions: rolePermissions.PARENT,
  },
  {
    id: 'u-6',
    schoolId: 's-2',
    name: 'Second School Admin',
    email: 'schooladmin2@example.com',
    passwordHash: bcrypt.hashSync('Password123!', 10),
    role: 'SCHOOL_ADMIN',
    status: 'active',
    permissions: rolePermissions.SCHOOL_ADMIN,
  },
];

export const guardians: DemoGuardian[] = [
  {
    id: 'g-1',
    schoolId: 's-1',
    name: 'Mary Juma',
    relationship: 'Mother',
    phone: '+255722000001',
    email: 'mary@example.com',
    address: 'Dar es Salaam',
    occupation: 'Teacher',
  },
  {
    id: 'g-2',
    schoolId: 's-1',
    name: 'John Moshi',
    relationship: 'Father',
    phone: '+255722000002',
    email: 'john@example.com',
    address: 'Arusha',
    occupation: 'Businessman',
  },
];

export const students: DemoStudent[] = [
  {
    id: 'st-1',
    schoolId: 's-1',
    admissionNumber: 'ADM-1001',
    firstName: 'Alice',
    middleName: 'Mwanza',
    lastName: 'Juma',
    gender: 'FEMALE',
    dateOfBirth: '2012-03-04',
    placeOfBirth: 'Dar es Salaam',
    nationality: 'Tanzanian',
    phone: '+255711000001',
    email: 'alice@student.example',
    address: 'Dar es Salaam',
    photo: '',
    admissionDate: '2026-01-10',
    status: 'ACTIVE',
    className: 'Form 1',
    stream: 'A',
  },
  {
    id: 'st-2',
    schoolId: 's-1',
    admissionNumber: 'ADM-1002',
    firstName: 'Daniel',
    middleName: 'Nuru',
    lastName: 'Moshi',
    gender: 'MALE',
    dateOfBirth: '2011-08-12',
    placeOfBirth: 'Arusha',
    nationality: 'Tanzanian',
    phone: '+255711000002',
    email: 'daniel@student.example',
    address: 'Arusha',
    photo: '',
    admissionDate: '2026-01-12',
    status: 'ACTIVE',
    className: 'Form 1',
    stream: 'B',
  },
];

export type AcademicYear = {
  id: string;
  schoolId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'UPCOMING' | 'CLOSED';
};

export type AcademicClass = {
  id: string;
  schoolId: string;
  academicYearId: string;
  name: string;
  level: string;
  status: 'ACTIVE' | 'ARCHIVED';
};

export type Stream = {
  id: string;
  schoolId: string;
  name: string;
};

export type Subject = {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  category: string;
  status: 'ACTIVE' | 'INACTIVE';
};

export type AttendanceRecord = {
  id: string;
  schoolId: string;
  studentId: string;
  studentName: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  className: string;
  reason?: string;
};

export type Exam = {
  id: string;
  schoolId: string;
  name: string;
  academicYearId: string;
  term: string;
  className: string;
  examDate: string;
  status: 'DRAFT' | 'OPEN' | 'CLOSED';
};

export type MarkEntry = {
  id: string;
  schoolId: string;
  studentId: string;
  studentName: string;
  subject: string;
  examId: string;
  marks: number;
  grade: string;
  remarks: string;
};

export const academicYears: AcademicYear[] = [
  { id: 'ay-1', schoolId: 's-1', name: '2026', startDate: '2026-01-01', endDate: '2026-12-31', status: 'ACTIVE' },
  { id: 'ay-2', schoolId: 's-1', name: '2027', startDate: '2027-01-01', endDate: '2027-12-31', status: 'UPCOMING' },
];

export const academicClasses: AcademicClass[] = [
  { id: 'cls-1', schoolId: 's-1', academicYearId: 'ay-1', name: 'Form 1', level: 'Secondary', status: 'ACTIVE' },
  { id: 'cls-2', schoolId: 's-1', academicYearId: 'ay-1', name: 'Form 2', level: 'Secondary', status: 'ACTIVE' },
];

export const streams: Stream[] = [
  { id: 'str-1', schoolId: 's-1', name: 'A' },
  { id: 'str-2', schoolId: 's-1', name: 'B' },
];

export const subjects: Subject[] = [
  { id: 'sub-1', schoolId: 's-1', name: 'Mathematics', code: 'MATH', category: 'Core', status: 'ACTIVE' },
  { id: 'sub-2', schoolId: 's-1', name: 'English', code: 'ENG', category: 'Core', status: 'ACTIVE' },
  { id: 'sub-3', schoolId: 's-1', name: 'Biology', code: 'BIO', category: 'Science', status: 'ACTIVE' },
];

export const attendanceRecords: AttendanceRecord[] = [
  { id: 'att-1', schoolId: 's-1', studentId: 'st-1', studentName: 'Alice Juma', date: '2026-08-20', status: 'PRESENT', className: 'Form 1', reason: '' },
  { id: 'att-2', schoolId: 's-1', studentId: 'st-2', studentName: 'Daniel Moshi', date: '2026-08-20', status: 'LATE', className: 'Form 1', reason: 'Traffic' },
];

export const exams: Exam[] = [
  { id: 'exam-1', schoolId: 's-1', name: 'Midterm Test', academicYearId: 'ay-1', term: 'Term 1', className: 'Form 1', examDate: '2026-08-25', status: 'OPEN' },
  { id: 'exam-2', schoolId: 's-1', name: 'End of Term', academicYearId: 'ay-1', term: 'Term 1', className: 'Form 1', examDate: '2026-09-10', status: 'DRAFT' },
];

export const marks: MarkEntry[] = [
  { id: 'mk-1', schoolId: 's-1', studentId: 'st-1', studentName: 'Alice Juma', subject: 'Mathematics', examId: 'exam-1', marks: 82, grade: 'A', remarks: 'Excellent work' },
  { id: 'mk-2', schoolId: 's-1', studentId: 'st-2', studentName: 'Daniel Moshi', subject: 'English', examId: 'exam-1', marks: 74, grade: 'B', remarks: 'Good effort' },
];

export type FeeStructure = {
  id: string;
  schoolId: string;
  academicYearId: string;
  className: string;
  feeName: string;
  amount: number;
  frequency: string;
  dueDate: string;
};

export type Invoice = {
  id: string;
  schoolId: string;
  studentId: string;
  studentName: string;
  invoiceNumber: string;
  feeItem: string;
  amount: number;
  discount: number;
  total: number;
  dueDate: string;
  status: 'DRAFT' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
};

export type FeePayment = {
  id: string;
  schoolId: string;
  studentId: string;
  invoiceId: string;
  amount: number;
  paymentReference: string;
  controlNumber: string;
  paymentMethod: string;
  provider: string;
  transactionId: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  paidAt?: string;
};

export type Receipt = {
  id: string;
  schoolId: string;
  receiptNumber: string;
  paymentId: string;
  amount: number;
  issuedAt: string;
};

export const feeStructures: FeeStructure[] = [
  { id: 'fs-1', schoolId: 's-1', academicYearId: 'ay-1', className: 'Form 1', feeName: 'School Fees', amount: 250000, frequency: 'Termly', dueDate: '2026-09-30' },
  { id: 'fs-2', schoolId: 's-1', academicYearId: 'ay-1', className: 'Form 1', feeName: 'Exam Fees', amount: 50000, frequency: 'Termly', dueDate: '2026-09-15' },
];

export const invoices: Invoice[] = [
  { id: 'inv-1', schoolId: 's-1', studentId: 'st-1', studentName: 'Alice Juma', invoiceNumber: 'INV-1001', feeItem: 'School Fees', amount: 250000, discount: 0, total: 250000, dueDate: '2026-09-30', status: 'UNPAID' },
  { id: 'inv-2', schoolId: 's-1', studentId: 'st-2', studentName: 'Daniel Moshi', invoiceNumber: 'INV-1002', feeItem: 'School Fees', amount: 250000, discount: 0, total: 250000, dueDate: '2026-09-30', status: 'PARTIALLY_PAID' },
];

export const feePayments: FeePayment[] = [
  { id: 'pay-1', schoolId: 's-1', studentId: 'st-2', invoiceId: 'inv-2', amount: 100000, paymentReference: 'REF-1002', controlNumber: 'CTRL-1002', paymentMethod: 'BANK', provider: 'MockPaymentProvider', transactionId: 'TXN-1002', status: 'PAID', paidAt: '2026-08-20T10:00:00Z' },
];

export const receipts: Receipt[] = [
  { id: 'rcp-1', schoolId: 's-1', receiptNumber: 'RCP-1002', paymentId: 'pay-1', amount: 100000, issuedAt: '2026-08-20T10:05:00Z' },
];
