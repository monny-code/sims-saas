import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

type Student = {
  id: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  className?: string;
  stream?: string;
  status: string;
};

const SchoolManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const token = localStorage.getItem('sims_token');

        if (!token) {
          throw new Error('No active session was found. Please log in again.');
        }

        const user = JSON.parse(localStorage.getItem('sims_user') ?? 'null') as { role?: string; schoolId?: string } | null;
        const query = user?.role === 'SUPER_ADMIN' && user.schoolId ? `?schoolId=${user.schoolId}` : '';

        const response = await apiFetch<{ students: Student[] }>(`/students${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStudents(response.students);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load students');
      } finally {
        setLoading(false);
      }
    };

    void loadStudents();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">School management</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Students</h1>
          </div>
          <button className="rounded-xl bg-brand-600 px-4 py-2 font-medium text-white">Add student</button>
        </div>

        {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : null}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-100 text-sm text-slate-600">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Admission</th>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
              {loading ? (
                <tr>
                  <td className="px-6 py-8 text-slate-500" colSpan={4}>Loading students...</td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id}>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{student.firstName} {student.lastName}</div>
                    </td>
                    <td className="px-6 py-4">{student.admissionNumber}</td>
                    <td className="px-6 py-4">{student.className ?? 'Not assigned'}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">{student.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SchoolManagement;
