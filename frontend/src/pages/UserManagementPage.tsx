import { type FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

type UserRecord = { id: string; name: string; email: string; role: string; schoolId: string; status: 'active' | 'inactive'; permissions: string[] };
const roles = ['SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'ACCOUNTANT', 'RECEPTIONIST', 'LIBRARIAN', 'PARENT', 'STUDENT'];
const emptyForm = { name: '', email: '', password: '', role: 'TEACHER' };

const UserManagementPage = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => { void (async () => { try { setUsers((await apiFetch<{ users: UserRecord[] }>('/auth/users')).users); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load users'); } finally { setLoading(false); } })(); }, []);
  const reset = () => { setEditing(null); setForm(emptyForm); };
  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      const result = editing
        ? await apiFetch<{ user: UserRecord }>(`/auth/users/${editing.id}`, { method: 'PATCH', body: JSON.stringify({ name: form.name, role: form.role }) })
        : await apiFetch<{ user: UserRecord }>('/auth/users', { method: 'POST', body: JSON.stringify(form) });
      setUsers((current) => editing ? current.map((user) => user.id === result.user.id ? result.user : user) : [...current, result.user]);
      setNotice(editing ? 'User updated.' : 'User created and ready to sign in.'); reset();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save user'); } finally { setSaving(false); }
  };
  const changeStatus = async (user: UserRecord) => {
    setSaving(true); setError('');
    try { const result = await apiFetch<{ user: UserRecord }>(`/auth/users/${user.id}`, { method: 'PATCH', body: JSON.stringify({ status: user.status === 'active' ? 'inactive' : 'active' }) }); setUsers((current) => current.map((item) => item.id === user.id ? result.user : item)); setNotice(`User ${result.user.status === 'active' ? 'activated' : 'deactivated'}.`); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to update user'); } finally { setSaving(false); }
  };
  const startEdit = (user: UserRecord) => { setEditing(user); setForm({ name: user.name, email: user.email, password: '', role: user.role }); setError(''); };

  return <div className="min-h-screen bg-slate-50 p-6 text-slate-900"><div className="mx-auto max-w-6xl">
    <div className="mb-6 flex items-center justify-between"><div><p className="text-sm font-semibold uppercase tracking-[.2em] text-brand-700">Administration</p><h1 className="mt-2 text-3xl font-bold">User management</h1><p className="mt-1 text-sm text-slate-600">Create school accounts and control access.</p></div><a href="/settings" className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-medium">Settings</a></div>
    {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}{notice && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">{notice}</div>}
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]"><form onSubmit={save} className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-soft"><h2 className="text-lg font-semibold">{editing ? 'Edit user' : 'Add a user'}</h2><div className="mt-5 space-y-4">
      <label className="block text-sm font-medium">Full name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" /></label>
      <label className="block text-sm font-medium">Email<input required type="email" disabled={Boolean(editing)} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 disabled:bg-slate-100" /></label>
      {!editing && <label className="block text-sm font-medium">Temporary password<input required minLength={8} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" /></label>}
      <label className="block text-sm font-medium">Role<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2">{roles.map((role) => <option key={role} value={role}>{role.replace('_', ' ')}</option>)}</select></label>
      <button disabled={saving} className="rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white disabled:opacity-60">{saving ? 'Saving...' : editing ? 'Save changes' : 'Create user'}</button>{editing && <button type="button" onClick={reset} className="ml-3 rounded-xl border border-slate-200 px-4 py-2.5">Cancel</button>}
    </div></form>
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft"><div className="flex justify-between border-b border-slate-200 bg-slate-100 px-6 py-4"><span className="font-semibold">School users</span><span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">{users.length} users</span></div>{loading ? <div className="p-6 text-slate-500">Loading users...</div> : <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200 text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="px-6 py-4">User</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Actions</th></tr></thead><tbody className="divide-y divide-slate-200">{users.map((user) => <tr key={user.id}><td className="px-6 py-4"><div className="font-semibold">{user.name}</div><div className="text-slate-500">{user.email}</div></td><td className="px-6 py-4">{user.role.replace('_', ' ')}</td><td className="px-6 py-4"><span className={user.status === 'active' ? 'text-emerald-700' : 'text-slate-500'}>{user.status}</span></td><td className="px-6 py-4"><button onClick={() => startEdit(user)} className="mr-3 font-medium text-brand-700">Edit</button><button disabled={saving} onClick={() => void changeStatus(user)} className="font-medium text-slate-600">{user.status === 'active' ? 'Deactivate' : 'Activate'}</button></td></tr>)}</tbody></table></div>}</div>
    </div></div></div>;
};
export default UserManagementPage;
