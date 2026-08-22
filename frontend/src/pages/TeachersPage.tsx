import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

type Teacher = { id: string; name: string; email: string; role: string; status: 'active' | 'inactive'; permissions: string[] };

const TeachersPage = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    apiFetch<{ users: Teacher[] }>('/auth/users')
      .then((result) => setTeachers(result.users.filter((user) => user.role === 'TEACHER')))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load teachers.'))
      .finally(() => setLoading(false));
  }, []);

  const visibleTeachers = teachers.filter((teacher) => `${teacher.name} ${teacher.email}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[.2em] text-brand-700">Administration</p><h1 className="mt-2 text-3xl font-bold">Teachers</h1><p className="mt-1 text-sm text-slate-600">View teaching accounts and manage their access.</p></div><a href="/users" className="rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white">Manage users</a></header>
        {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft"><div className="border-b border-slate-200 bg-slate-100 p-4"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search teachers" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 sm:max-w-sm" /></div>{loading ? <div className="p-6 text-slate-500">Loading teachers...</div> : visibleTeachers.length === 0 ? <div className="p-10 text-center text-slate-500">No teachers found.</div> : <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200 text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="px-6 py-4">Teacher</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Permissions</th><th className="px-6 py-4">Action</th></tr></thead><tbody className="divide-y divide-slate-200">{visibleTeachers.map((teacher) => <tr key={teacher.id}><td className="px-6 py-4"><div className="font-semibold">{teacher.name}</div><div className="text-slate-500">{teacher.email}</div></td><td className="px-6 py-4"><span className={teacher.status === 'active' ? 'text-emerald-700' : 'text-slate-500'}>{teacher.status}</span></td><td className="px-6 py-4">{teacher.permissions.length}</td><td className="px-6 py-4"><a href="/users" className="font-medium text-brand-700">Edit access</a></td></tr>)}</tbody></table></div>}</section>
      </div>
    </div>
  );
};

export default TeachersPage;
