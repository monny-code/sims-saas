import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/api';

type UserRecord = { id: string; name: string; email: string; role: string; schoolId: string; status: 'active' | 'inactive'; permissions: string[] };
type UserForm = { name: string; email: string; password: string; role: string; permissions: string[] };

const roles = ['SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'ACCOUNTANT', 'RECEPTIONIST', 'LIBRARIAN', 'PARENT', 'STUDENT'];
const permissions = ['users.manage', 'students.manage', 'students.view', 'teachers.manage', 'fees.manage', 'invoices.manage', 'payments.manage', 'reports.view', 'settings.manage', 'attendance.manage', 'marks.manage', 'academics.manage', 'admissions.manage', 'notifications.send', 'announcements.manage', 'library.manage', 'children.view', 'fees.view', 'results.view', 'profile.view', 'timetable.view'];
const roleDefaults: Record<string, string[]> = {
  SCHOOL_ADMIN: ['students.manage', 'teachers.manage', 'fees.manage', 'settings.manage', 'reports.view', 'attendance.manage', 'marks.manage'],
  PRINCIPAL: ['students.view', 'academics.manage', 'reports.view'],
  TEACHER: ['attendance.manage', 'marks.manage', 'students.view', 'timetable.view'],
  ACCOUNTANT: ['fees.manage', 'invoices.manage', 'payments.manage', 'reports.view'],
  RECEPTIONIST: ['students.view', 'admissions.manage', 'notifications.send'],
  LIBRARIAN: ['library.manage', 'students.view'],
  PARENT: ['children.view', 'fees.view', 'results.view'],
  STUDENT: ['profile.view', 'results.view', 'fees.view'],
};
const emptyForm: UserForm = { name: '', email: '', password: '', role: 'TEACHER', permissions: roleDefaults.TEACHER };
const displayLabel = (value: string) => value.replaceAll('_', ' ').replaceAll('.', ' / ');

const UserManagementPage = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [editing, setEditing] = useState<UserRecord | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await apiFetch<{ users: UserRecord[] }>('/auth/users');
      setUsers(result.users);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadUsers(); }, []);

  const visibleUsers = useMemo(() => users.filter((user) => {
    const matchesQuery = `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (statusFilter === 'ALL' || user.status === statusFilter.toLowerCase());
  }), [query, statusFilter, users]);

  const reset = () => { setEditing(null); setForm(emptyForm); };
  const startEdit = (user: UserRecord) => {
    setEditing(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role, permissions: user.permissions });
    setError('');
    setNotice('');
  };
  const updateRole = (role: string) => setForm((current) => ({ ...current, role, permissions: roleDefaults[role] ?? [] }));
  const togglePermission = (permission: string) => setForm((current) => ({
    ...current,
    permissions: current.permissions.includes(permission) ? current.permissions.filter((item) => item !== permission) : [...current.permissions, permission],
  }));

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const result = editing
        ? await apiFetch<{ user: UserRecord }>(`/auth/users/${editing.id}`, { method: 'PATCH', body: JSON.stringify({ name: form.name, role: form.role, permissions: form.permissions }) })
        : await apiFetch<{ user: UserRecord }>('/auth/users', { method: 'POST', body: JSON.stringify({ name: form.name, email: form.email, password: form.password, role: form.role }) });
      setUsers((current) => editing ? current.map((user) => user.id === result.user.id ? result.user : user) : [...current, result.user]);
      setNotice(editing ? 'User access updated.' : 'User created successfully.');
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save user.');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (user: UserRecord) => {
    const activate = user.status !== 'active';
    if (!activate && !window.confirm(`Deactivate ${user.name}'s account?`)) return;
    setSaving(true);
    setError('');
    try {
      const result = await apiFetch<{ user: UserRecord }>(`/auth/users/${user.id}`, { method: 'PATCH', body: JSON.stringify({ status: activate ? 'active' : 'inactive' }) });
      setUsers((current) => current.map((item) => item.id === user.id ? result.user : item));
      setNotice(`User ${activate ? 'activated' : 'deactivated'}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update user status.');
    } finally {
      setSaving(false);
    }
  };

  const activeCount = users.filter((user) => user.status === 'active').length;
  const staffCount = users.filter((user) => !['PARENT', 'STUDENT'].includes(user.role)).length;

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[.2em] text-brand-700">Administration</p><h1 className="mt-2 text-3xl font-bold">School user control</h1><p className="mt-1 text-sm text-slate-600">Manage accounts and access for this school.</p></div><a href="/settings" className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700">Settings</a></header>
        <div className="grid gap-4 sm:grid-cols-3">{[['Total users', users.length], ['Active accounts', activeCount], ['Staff accounts', staffCount]].map(([title, value]) => <div key={title as string} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"><div className="text-sm text-slate-500">{title as string}</div><div className="mt-2 text-3xl font-bold">{value as number}</div></div>)}</div>
        {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}{notice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}
        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <form onSubmit={save} className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-soft"><h2 className="text-lg font-semibold">{editing ? 'Edit access' : 'Add a user'}</h2><div className="mt-5 space-y-4">
            <label className="block text-sm font-medium">Full name<input required minLength={2} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" /></label>
            <label className="block text-sm font-medium">Email<input required type="email" disabled={Boolean(editing)} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 disabled:bg-slate-100" /></label>
            {!editing ? <label className="block text-sm font-medium">Temporary password<input required minLength={8} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" /></label> : null}
            <label className="block text-sm font-medium">Role<select value={form.role} onChange={(event) => updateRole(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2">{roles.map((role) => <option key={role} value={role}>{displayLabel(role)}</option>)}</select></label>
            {editing ? <fieldset><legend className="text-sm font-medium">Permissions</legend><div className="mt-2 grid max-h-72 gap-2 overflow-y-auto rounded-xl border border-slate-200 p-3 sm:grid-cols-2 xl:grid-cols-1">{permissions.map((permission) => <label key={permission} className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" checked={form.permissions.includes(permission)} onChange={() => togglePermission(permission)} />{displayLabel(permission)}</label>)}</div></fieldset> : null}
            <div><button disabled={saving} className="rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white disabled:opacity-60">{saving ? 'Saving...' : editing ? 'Save access' : 'Create user'}</button>{editing ? <button type="button" onClick={reset} className="ml-3 rounded-xl border border-slate-200 px-4 py-2.5">Cancel</button> : null}</div>
          </div></form>
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft"><div className="flex flex-wrap gap-3 border-b border-slate-200 bg-slate-100 p-4"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, or role" className="min-w-56 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></div>{loading ? <div className="p-6 text-slate-500">Loading school users...</div> : visibleUsers.length === 0 ? <div className="p-10 text-center text-slate-500">No users match your filters.</div> : <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200 text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="px-6 py-4">User</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Access</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Actions</th></tr></thead><tbody className="divide-y divide-slate-200">{visibleUsers.map((user) => <tr key={user.id}><td className="px-6 py-4"><div className="font-semibold">{user.name}</div><div className="text-slate-500">{user.email}</div></td><td className="px-6 py-4">{displayLabel(user.role)}</td><td className="px-6 py-4">{user.permissions.length} permissions</td><td className="px-6 py-4"><span className={user.status === 'active' ? 'text-emerald-700' : 'text-slate-500'}>{user.status}</span></td><td className="whitespace-nowrap px-6 py-4"><button type="button" onClick={() => startEdit(user)} className="mr-3 font-medium text-brand-700">Edit access</button><button type="button" disabled={saving} onClick={() => void changeStatus(user)} className="font-medium text-slate-600">{user.status === 'active' ? 'Deactivate' : 'Activate'}</button></td></tr>)}</tbody></table></div>}</section>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
