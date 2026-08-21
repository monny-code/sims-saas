import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

type SummaryResponse = {
  summary: {
    totalStudents: number;
    totalTeachers: number;
    attendanceRate: number;
    totalCollected: number;
    overdueInvoices: number;
    activeParents: number;
  };
  attendanceTrend: { label: string; value: number }[];
  feePerformance: { label: string; value: number }[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'TZS',
    maximumFractionDigits: 0,
  }).format(value);

const ReportsDashboard = () => {
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('sims_token');

    if (!token) {
      setError('Please sign in to view school reports.');
      setLoading(false);
      return;
    }

    apiFetch<SummaryResponse>('/reports/summary', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((result) => setData(result))
      .catch(() => setError('Unable to load report data.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Reports</p>
          <h1 className="mt-2 text-3xl font-bold">School performance dashboard</h1>
        </div>

        {error ? <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}</div> : null}

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="text-sm text-slate-500">Students</div>
            <div className="mt-2 text-3xl font-bold">{data?.summary.totalStudents ?? 0}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="text-sm text-slate-500">Attendance</div>
            <div className="mt-2 text-3xl font-bold">{data?.summary.attendanceRate ?? 0}%</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="text-sm text-slate-500">Collected</div>
            <div className="mt-2 text-3xl font-bold">{formatCurrency(data?.summary.totalCollected ?? 0)}</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold">Attendance trend</h2>
            <div className="mt-6 space-y-3">
              {loading ? <div className="text-slate-500">Loading...</div> : data?.attendanceTrend.map((point) => (
                <div key={point.label}>
                  <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
                    <span>{point.label}</span>
                    <span>{point.value}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-brand-600" style={{ width: `${point.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold">Fee performance</h2>
            <div className="mt-6 space-y-3">
              {loading ? <div className="text-slate-500">Loading...</div> : data?.feePerformance.map((point) => (
                <div key={point.label}>
                  <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
                    <span>{point.label}</span>
                    <span>{point.value}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${point.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsDashboard;
