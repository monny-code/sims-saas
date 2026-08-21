import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

type FeeStructure = {
  id: string;
  feeName: string;
  amount: number;
  className: string;
  dueDate: string;
};

type FeeInvoice = {
  id: string;
  invoiceNumber: string;
  studentName: string;
  feeItem: string;
  total: number;
  status: string;
  dueDate: string;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'TZS',
    maximumFractionDigits: 0,
  }).format(value);

const FinanceOverview = () => {
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('sims_token');

    if (!token) {
      setError('Please sign in to view fee information.');
      setLoading(false);
      return;
    }

    Promise.all([
      apiFetch<{ structures: FeeStructure[] }>('/fees/structures', {
        headers: { Authorization: `Bearer ${token}` },
      }),
      apiFetch<{ invoices: FeeInvoice[] }>('/fees/invoices', {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ])
      .then(([structureResult, invoiceResult]) => {
        setStructures(structureResult.structures ?? []);
        setInvoices(invoiceResult.invoices ?? []);
      })
      .catch(() => {
        setError('Unable to load finance data.');
      })
      .finally(() => setLoading(false));
  }, []);

  const totalOutstanding = invoices.reduce((sum, invoice) => sum + (invoice.status === 'PAID' ? 0 : invoice.total), 0);

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Finance</p>
            <h1 className="mt-2 text-3xl font-bold">Fees & Payments</h1>
          </div>
          <button className="rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white shadow-soft">Generate invoice</button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}</div>
        ) : null}

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="text-sm text-slate-500">Total fee structures</div>
            <div className="mt-2 text-3xl font-bold">{structures.length}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="text-sm text-slate-500">Outstanding</div>
            <div className="mt-2 text-3xl font-bold">{formatCurrency(totalOutstanding)}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="text-sm text-slate-500">Invoices issued</div>
            <div className="mt-2 text-3xl font-bold">{invoices.length}</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold">Fee structures</h2>
            <div className="mt-4 space-y-4">
              {loading ? <div className="text-slate-500">Loading...</div> : structures.map((structure) => (
                <div key={structure.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{structure.feeName}</div>
                    <div className="text-brand-700">{formatCurrency(structure.amount)}</div>
                  </div>
                  <div className="mt-2 text-sm text-slate-500">{structure.className} • Due {structure.dueDate}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold">Invoice overview</h2>
            <div className="mt-4 space-y-4">
              {loading ? <div className="text-slate-500">Loading...</div> : invoices.map((invoice) => (
                <div key={invoice.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{invoice.studentName}</div>
                      <div className="text-sm text-slate-500">{invoice.invoiceNumber}</div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{invoice.status}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                    <span>{invoice.feeItem}</span>
                    <span>{formatCurrency(invoice.total)}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">Due: {invoice.dueDate}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceOverview;
