import { Router } from 'express';
import { z } from 'zod';
import type { Invoice } from '../data/demoData.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { mockPaymentProvider } from '../services/mockPaymentProvider.js';
import { getFeePayments, getFeeStructures, getGuardians, getInvoices, getReceipts, getStudentGuardians, getStudents, writeCollection } from '../services/firebaseDataStore.js';

const router = Router();

const canManageFees = (req: AuthenticatedRequest) => {
  const permissions = req.user?.permissions ?? [];
  return permissions.includes('fees.manage') || permissions.includes('payments.manage') || permissions.includes('invoices.manage');
};

const filterBySchool = <T extends { schoolId: string }>(req: AuthenticatedRequest, items: T[]) => {
  if (req.user?.role === 'SUPER_ADMIN') {
    return items;
  }

  return items.filter((item) => item.schoolId === req.user?.schoolId);
};

const filterStudentAccess = async (req: AuthenticatedRequest, invoicesList: Invoice[], students: { id: string; schoolId: string }[]) => {
  if (req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'SCHOOL_ADMIN' || req.user?.role === 'ACCOUNTANT') {
    return invoicesList;
  }

  if (req.user?.role === 'PARENT') {
    const [guardians, links] = await Promise.all([getGuardians(), getStudentGuardians()]);
    const guardianIds = guardians
      .filter((guardian) => guardian.schoolId === req.user?.schoolId && ((guardian as { userId?: string }).userId === req.user?.id || guardian.email?.toLowerCase() === req.user?.email.toLowerCase()))
      .map((guardian) => guardian.id);
    const children = students.filter((student) => links.some((link) => link.studentId === student.id && guardianIds.includes(link.guardianId)));
    return invoicesList.filter((invoice) => children.some((student) => student.id === invoice.studentId));
  }

  if (req.user?.role === 'STUDENT') {
    return invoicesList.filter((invoice) => invoice.studentId === req.user?.id);
  }

  return [];
};

router.get('/structures', requireAuth, async (req: AuthenticatedRequest, res) => {
  const data = filterBySchool(req, await getFeeStructures());
  return sendSuccess(res, { structures: data }, 'Fee structures loaded');
});

router.get('/invoices', requireAuth, async (req: AuthenticatedRequest, res) => {
  const students = await getStudents();
  const data = await filterStudentAccess(req, filterBySchool(req, await getInvoices()), students);
  return sendSuccess(res, { invoices: data }, 'Invoices loaded');
});

router.post('/invoices', requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!canManageFees(req)) {
    return sendError(res, 'Forbidden: missing fee permission', 403);
  }

  const parsed = z.object({
    studentId: z.string().min(1),
    studentName: z.string().min(1),
    feeItem: z.string().min(1),
    amount: z.number().positive(),
    dueDate: z.string().min(1),
  }).safeParse(req.body);

  if (!parsed.success) {
    return sendError(res, 'Validation failed', 400, parsed.error.issues.map((issue) => issue.message));
  }

  const nextInvoice: Invoice = {
    id: `inv-${Date.now()}`,
    schoolId: req.user?.schoolId ?? 's-1',
    invoiceNumber: `INV-${Date.now()}`,
    studentId: parsed.data.studentId,
    studentName: parsed.data.studentName,
    feeItem: parsed.data.feeItem,
    amount: parsed.data.amount,
    discount: 0,
    total: parsed.data.amount,
    dueDate: parsed.data.dueDate,
    status: 'UNPAID',
  };

  const invoices = await getInvoices();
  await writeCollection('invoices', [...invoices, nextInvoice]);

  return sendSuccess(res, { invoice: nextInvoice }, 'Invoice generated', 201);
});

router.get('/payments', requireAuth, async (req: AuthenticatedRequest, res) => {
  const data = filterBySchool(req, await getFeePayments()).filter((payment) => {
    if (req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'SCHOOL_ADMIN' || req.user?.role === 'ACCOUNTANT') {
      return true;
    }
    if (req.user?.role === 'PARENT' || req.user?.role === 'STUDENT') {
      return payment.studentId === req.user?.id;
    }
    return false;
  });

  return sendSuccess(res, { payments: data }, 'Payments loaded');
});

router.post('/payments', requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!canManageFees(req)) {
    return sendError(res, 'Forbidden: missing payment permission', 403);
  }

  const parsed = z.object({
    invoiceId: z.string().min(1),
    studentId: z.string().min(1),
    amount: z.number().positive(),
    paymentMethod: z.string().min(1),
  }).safeParse(req.body);

  if (!parsed.success) {
    return sendError(res, 'Validation failed', 400, parsed.error.issues.map((issue) => issue.message));
  }

  const invoices = await getInvoices();
  const invoice = invoices.find((entry) => entry.id === parsed.data.invoiceId && entry.schoolId === req.user?.schoolId);

  if (!invoice) {
    return sendError(res, 'Invoice not found', 404);
  }

  const processing = mockPaymentProvider.processPayment(parsed.data.amount, invoice.invoiceNumber);

  if (!processing.approved) {
    return sendError(res, 'Payment rejected by mock provider', 400);
  }

  const payment = {
    id: `pay-${Date.now()}`,
    schoolId: req.user?.schoolId ?? 's-1',
    studentId: parsed.data.studentId,
    invoiceId: parsed.data.invoiceId,
    amount: parsed.data.amount,
    paymentReference: processing.paymentReference,
    controlNumber: processing.controlNumber,
    paymentMethod: parsed.data.paymentMethod,
    provider: processing.provider,
    transactionId: processing.transactionId,
    status: 'PAID' as const,
    paidAt: new Date().toISOString(),
  };

  const feePayments = await getFeePayments();
  await writeCollection('feePayments', [...feePayments, payment]);

  const receipt = {
    id: `rcp-${Date.now()}`,
    schoolId: req.user?.schoolId ?? 's-1',
    receiptNumber: `RCP-${Date.now()}`,
    paymentId: payment.id,
    amount: payment.amount,
    issuedAt: new Date().toISOString(),
  };

  const receipts = await getReceipts();
  await writeCollection('receipts', [...receipts, receipt]);

  await writeCollection('invoices', invoices.map((entry) => entry.id === invoice.id ? { ...entry, status: 'PAID' } : entry));

  return sendSuccess(res, { payment, receipt }, 'Payment processed successfully', 201);
});

router.get('/receipts', requireAuth, async (req: AuthenticatedRequest, res) => {
  const receipts = await getReceipts();
  const feePayments = await getFeePayments();
  const data = filterBySchool(req, receipts).filter((receipt) => {
    if (req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'SCHOOL_ADMIN' || req.user?.role === 'ACCOUNTANT') {
      return true;
    }
    if (req.user?.role === 'PARENT' || req.user?.role === 'STUDENT') {
      const payment = feePayments.find((entry) => entry.id === receipt.paymentId && entry.studentId === req.user?.id);
      return Boolean(payment);
    }
    return false;
  });

  return sendSuccess(res, { receipts: data }, 'Receipts loaded');
});

export default router;
