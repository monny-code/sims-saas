import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';

type Student = { id: string; firstName: string; lastName: string; admissionNumber: string; className?: string; stream?: string; gender: string; dateOfBirth: string; status: string };
type Profile = { student: Student; guardians: { id: string; name: string; relationship: string; phone: string }[]; attendance: { status: string; date: string }[]; marks: { subject: string; marks: number; grade: string; examId: string }[]; invoices: { invoiceNumber: string; feeItem: string; total: number; status: string }[]; payments: { amount: number; paymentMethod: string; paidAt?: string }[] };

const currency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(value);

const StudentProfilePage = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    apiFetch<Profile>(`/students/${id}`)
      .then(setProfile)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load student profile.'));
  }, [id]);

  if (error) return <div className="min-h-screen bg-slate-50 p-8"><div className="mx-auto max-w-5xl rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div></div>;
  if (!profile) return <div className="min-h-screen bg-slate-50 p-8"><div className="mx-auto max-w-5xl text-slate-500">Loading student profile...</div></div>;

  const { student } = profile;
  const present = profile.attendance.filter((record) => record.status === 'PRESENT').length;
  const attendanceRate = profile.attendance.length ? Math.round((present / profile.attendance.length) * 100) : 0;
  const paid = profile.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const invoiced = profile.invoices.reduce((sum, invoice) => sum + invoice.total, 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <a href="/students" className="text-sm font-medium text-brand-700">Back to students</a>
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="text-sm font-semibold uppercase tracking-[.2em] text-brand-700">Student profile</p><h1 className="mt-2 text-3xl font-bold">{student.firstName} {student.lastName}</h1><p className="mt-1 text-slate-500">{student.admissionNumber} · {student.className ?? 'Class not assigned'} {student.stream ?? ''}</p></div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{student.status}</span>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-4"><div><div className="text-xs text-slate-500">Gender</div><div className="mt-1 font-medium">{student.gender}</div></div><div><div className="text-xs text-slate-500">Date of birth</div><div className="mt-1 font-medium">{student.dateOfBirth}</div></div><div><div className="text-xs text-slate-500">Attendance</div><div className="mt-1 font-medium">{attendanceRate}%</div></div><div><div className="text-xs text-slate-500">Balance</div><div className="mt-1 font-medium">{currency(Math.max(invoiced - paid, 0))}</div></div></div>
        </header>
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft"><h2 className="text-lg font-semibold">Parents and guardians</h2><div className="mt-4 space-y-3">{profile.guardians.length ? profile.guardians.map((guardian) => <div key={guardian.id} className="rounded-xl border border-slate-200 p-3"><div className="font-medium">{guardian.name}</div><div className="text-sm text-slate-500">{guardian.relationship} · {guardian.phone}</div></div>) : <div className="text-slate-500">No guardians linked.</div>}</div></section>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft"><h2 className="text-lg font-semibold">Results</h2><div className="mt-4 space-y-3">{profile.marks.length ? profile.marks.map((mark) => <div key={`${mark.examId}-${mark.subject}`} className="flex justify-between rounded-xl border border-slate-200 p-3"><span>{mark.subject}</span><span className="font-semibold">{mark.marks} ({mark.grade})</span></div>) : <div className="text-slate-500">No marks recorded.</div>}</div></section>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft"><h2 className="text-lg font-semibold">Attendance history</h2><div className="mt-4 space-y-3">{profile.attendance.length ? profile.attendance.map((record) => <div key={record.date} className="flex justify-between rounded-xl border border-slate-200 p-3"><span>{record.date}</span><span className="font-medium">{record.status}</span></div>) : <div className="text-slate-500">No attendance recorded.</div>}</div></section>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft"><h2 className="text-lg font-semibold">Fees and payments</h2><div className="mt-4 space-y-3">{profile.invoices.map((invoice) => <div key={invoice.invoiceNumber} className="flex justify-between rounded-xl border border-slate-200 p-3"><span>{invoice.feeItem} · {invoice.status}</span><span className="font-medium">{currency(invoice.total)}</span></div>)}<div className="border-t border-slate-200 pt-3 text-sm text-slate-600">Paid: {currency(paid)} · Invoiced: {currency(invoiced)}</div></div></section>
        </div>
      </div>
    </div>
  );
};

export default StudentProfilePage;
