import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

type Child = {
  id: string;
  name: string;
  className: string;
  attendance: number;
};

type ParentPortalData = {
  children: Child[];
  notices: string[];
  feeSummary: { due: number; paid: number };
};
type Result = { id: string; studentName: string; subject: string; marks: number; grade: string; examId: string };

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'TZS',
    maximumFractionDigits: 0,
  }).format(value);

const PortalDashboard = () => {
  const [data, setData] = useState<ParentPortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('sims_token');

    if (!token) {
      setError('Please log in as a parent to view the portal.');
      setLoading(false);
      return;
    }

    Promise.all([apiFetch<{ children: Child[]; notices: string[]; feeSummary: { due: number; paid: number } }>('/reports/parent-portal', {
      headers: { Authorization: `Bearer ${token}` },
    }), apiFetch<{ results: Result[] }>('/reports/parent-results', { headers: { Authorization: `Bearer ${token}` } })])
      .then(([result, resultData]) => {
        setData({
          children: result.children ?? [],
          notices: result.notices ?? [],
          feeSummary: result.feeSummary ?? { due: 0, paid: 0 },
        });
        setResults(resultData.results ?? []);
      })
      .catch(() => {
        setError('Unable to load parent portal data.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Parent portal</p>
          <h1 className="mt-2 text-3xl font-bold">Family overview</h1>
        </div>

        {error ? <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}</div> : null}

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="text-sm text-slate-500">Fees due</div>
            <div className="mt-2 text-3xl font-bold">{formatCurrency(data?.feeSummary?.due ?? 0)}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="text-sm text-slate-500">Fees paid</div>
            <div className="mt-2 text-3xl font-bold">{formatCurrency(data?.feeSummary?.paid ?? 0)}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="text-sm text-slate-500">Children</div>
            <div className="mt-2 text-3xl font-bold">{data?.children.length ?? 0}</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold">My children</h2>
            <div className="mt-4 space-y-4">
              {loading ? <div className="text-slate-500">Loading...</div> : data?.children.length ? data.children.map((child) => (
                <div key={child.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{child.name}</div>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">{child.attendance}% attendance</span>
                  </div>
                  <div className="mt-2 text-sm text-slate-500">{child.className}</div>
                </div>
              )) : <div className="text-slate-500">No child records available.</div>}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold">School notices</h2>
            <ul className="mt-4 space-y-3">
              {loading ? <li className="text-slate-500">Loading...</li> : data?.notices.length ? data.notices.map((notice, index) => (
                <li key={`${notice}-${index}`} className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{notice}</li>
              )) : <li className="text-slate-500">No notices for this period.</li>}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft"><h2 className="text-xl font-semibold">Published results</h2><div className="mt-4 space-y-3">{loading ? <div className="text-slate-500">Loading...</div> : results.length ? results.map((result) => <div key={result.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3"><div><div className="font-semibold">{result.studentName}</div><div className="text-sm text-slate-500">{result.subject}</div></div><div className="text-right"><div className="font-semibold text-brand-700">{result.marks} ({result.grade})</div><div className="text-xs text-slate-500">Exam {result.examId}</div></div></div>) : <div className="text-slate-500">No published results available.</div>}</div></div>
        </div>
      </div>
    </div>
  );
};

export default PortalDashboard;
