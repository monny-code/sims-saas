import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

type AcademicItem = {
  id: string;
  name?: string;
  studentName?: string;
  code?: string;
  status?: string;
  className?: string;
  date?: string;
  marks?: number;
  grade?: string;
};

const AcademicOverview = () => {
  const [subjects, setSubjects] = useState<AcademicItem[]>([]);
  const [attendance, setAttendance] = useState<AcademicItem[]>([]);
  const [marks, setMarks] = useState<AcademicItem[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const token = 'demo-token';
        const [subjectsRes, attendanceRes, marksRes] = await Promise.all([
          apiFetch<{ subjects: AcademicItem[] }>('/academics/subjects', { headers: { Authorization: `Bearer ${token}` } }),
          apiFetch<{ attendance: AcademicItem[] }>('/academics/attendance', { headers: { Authorization: `Bearer ${token}` } }),
          apiFetch<{ marks: AcademicItem[] }>('/academics/marks', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setSubjects(subjectsRes.subjects);
        setAttendance(attendanceRes.attendance);
        setMarks(marksRes.marks);
      } catch {
        // demo placeholder: no-op for now
      }
    };

    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Academic management</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Overview</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="text-sm text-slate-500">Subjects</div>
            <div className="mt-3 text-3xl font-bold text-slate-900">{subjects.length}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="text-sm text-slate-500">Attendance records</div>
            <div className="mt-3 text-3xl font-bold text-slate-900">{attendance.length}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="text-sm text-slate-500">Marks entries</div>
            <div className="mt-3 text-3xl font-bold text-slate-900">{marks.length}</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Subjects</h2>
            <ul className="space-y-3 text-sm text-slate-700">
              {subjects.map((subject) => (
                <li key={subject.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span>{subject.name}</span>
                  <span className="rounded-full bg-brand-100 px-2 py-1 text-xs font-medium text-brand-700">{subject.code}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Latest attendance</h2>
            <ul className="space-y-3 text-sm text-slate-700">
              {attendance.map((record) => (
                <li key={record.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span>{record.studentName ?? record.name ?? 'Student'}</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">{record.status}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicOverview;
