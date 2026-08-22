import { type FormEvent, useEffect, useState } from 'react';
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
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', gender: 'MALE', dateOfBirth: '', admissionNumber: '', className: '', stream: '' });

  const addStudent = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const result = await apiFetch<{ student: Student }>('/students', {
        method: 'POST',
        body: JSON.stringify({ ...form, admissionNumber: form.admissionNumber || undefined, className: form.className || undefined, stream: form.stream || undefined }),
      });
      setStudents((current) => [...current, result.student]);
      setForm({ firstName: '', lastName: '', gender: 'MALE', dateOfBirth: '', admissionNumber: '', className: '', stream: '' });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add student');
    } finally {
      setSaving(false);
    }
  };

  const updateStudent = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError('');
    try {
      const result = await apiFetch<{ student: Student }>(`/students/${editing.id}`, { method: 'PATCH', body: JSON.stringify({ firstName: editing.firstName, lastName: editing.lastName, className: editing.className, stream: editing.stream, status: editing.status }) });
      setStudents((current) => current.map((student) => student.id === result.student.id ? result.student : student));
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update student');
    } finally {
      setSaving(false);
    }
  };

  const deactivateStudent = async (student: Student) => {
    if (!window.confirm(`Deactivate ${student.firstName} ${student.lastName}?`)) return;
    setSaving(true);
    setError('');
    try {
      const result = await apiFetch<{ student: Student }>(`/students/${student.id}`, { method: 'DELETE' });
      setStudents((current) => current.map((item) => item.id === result.student.id ? result.student : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to deactivate student');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const token = localStorage.getItem('sims_token');

        if (!token) {
          throw new Error('No active session was found. Please log in again.');
        }

        const user = JSON.parse(localStorage.getItem('sims_user') ?? 'null') as { role?: string; schoolId?: string } | null;
        const query = user?.role === 'SUPER_ADMIN' && user.schoolId ? `?schoolId=${user.schoolId}` : '';

        const searchQuery = search ? `${query ? '&' : '?'}search=${encodeURIComponent(search)}` : '';
        const response = await apiFetch<{ students: Student[] }>(`/students${query}${searchQuery}`, {
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
  }, [search]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">School management</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Students</h1>
          </div>
          <button type="button" onClick={() => setShowForm(true)} className="rounded-xl bg-brand-600 px-4 py-2 font-medium text-white">Add student</button>
        </div>

        {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : null}

        {showForm ? (
          <form onSubmit={addStudent} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Add student</h2><button type="button" onClick={() => setShowForm(false)} className="text-sm text-slate-500">Cancel</button></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <input required minLength={2} placeholder="First name" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" />
              <input required minLength={2} placeholder="Last name" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" />
              <select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2"><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select>
              <input required type="date" value={form.dateOfBirth} onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" />
              <input placeholder="Admission number (optional)" value={form.admissionNumber} onChange={(event) => setForm({ ...form, admissionNumber: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" />
              <input placeholder="Class" value={form.className} onChange={(event) => setForm({ ...form, className: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" />
              <input placeholder="Stream" value={form.stream} onChange={(event) => setForm({ ...form, stream: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" />
            </div>
            <button disabled={saving} className="mt-5 rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white disabled:opacity-60">{saving ? 'Saving...' : 'Create student'}</button>
          </form>
        ) : null}

        {editing ? <form onSubmit={updateStudent} className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Edit student</h2><button type="button" onClick={() => setEditing(null)} className="text-sm text-slate-500">Cancel</button></div><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"><input required minLength={2} value={editing.firstName} onChange={(event) => setEditing({ ...editing, firstName: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" /><input required minLength={2} value={editing.lastName} onChange={(event) => setEditing({ ...editing, lastName: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" /><input value={editing.className ?? ''} onChange={(event) => setEditing({ ...editing, className: event.target.value })} placeholder="Class" className="rounded-xl border border-slate-200 px-3 py-2" /><input value={editing.stream ?? ''} onChange={(event) => setEditing({ ...editing, stream: event.target.value })} placeholder="Stream" className="rounded-xl border border-slate-200 px-3 py-2" /></div><button disabled={saving} className="mt-4 rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white disabled:opacity-60">{saving ? 'Saving...' : 'Save student'}</button></form> : null}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
          <div className="border-b border-slate-200 p-4"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search students" className="w-full rounded-xl border border-slate-200 px-3 py-2 sm:max-w-sm" /></div>
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-100 text-sm text-slate-600">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Admission</th>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4">Status</th><th className="px-6 py-4">Actions</th>
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
                      <a href={`/students/${student.id}`} className="text-xs font-medium text-brand-700">View profile</a>
                    </td>
                    <td className="px-6 py-4">{student.admissionNumber}</td>
                    <td className="px-6 py-4">{student.className ?? 'Not assigned'}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">{student.status}</span>
                    </td><td className="whitespace-nowrap px-6 py-4"><button type="button" onClick={() => setEditing(student)} className="mr-3 font-medium text-brand-700">Edit</button>{student.status === 'ACTIVE' ? <button type="button" disabled={saving} onClick={() => void deactivateStudent(student)} className="font-medium text-red-600">Deactivate</button> : null}</td>
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
