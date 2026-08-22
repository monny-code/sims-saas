import { type FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

type School = {
  id: string;
  name: string;
  registrationNumber: string;
  address: string;
  region: string;
  district: string;
  phone: string;
  email: string;
  status: string;
};

type SchoolForm = Omit<School, 'id' | 'status'>;
const emptyForm: SchoolForm = { name: '', registrationNumber: '', address: '', region: '', district: '', phone: '', email: '' };

const SettingsPage = () => {
  const [school, setSchool] = useState<School | null>(null);
  const [form, setForm] = useState<SchoolForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    apiFetch<{ school: School }>('/schools/me')
      .then((result) => {
        setSchool(result.school);
        setForm({ name: result.school.name, registrationNumber: result.school.registrationNumber, address: result.school.address, region: result.school.region, district: result.school.district, phone: result.school.phone, email: result.school.email });
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load school settings.'))
      .finally(() => setLoading(false));
  }, []);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!school) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const result = await apiFetch<{ school: School }>(`/schools/${school.id}`, { method: 'PUT', body: JSON.stringify(form) });
      setSchool(result.school);
      setForm({ name: result.school.name, registrationNumber: result.school.registrationNumber, address: result.school.address, region: result.school.region, district: result.school.district, phone: result.school.phone, email: result.school.email });
      localStorage.setItem('sims_school', JSON.stringify(result.school));
      setNotice('School profile saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save school settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Settings</p><h1 className="mt-2 text-3xl font-bold">School configuration</h1><p className="mt-1 text-sm text-slate-600">Update the profile used across your school records.</p></div><a href="/users" className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-700">Manage users</a></div>
        {error ? <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}{notice ? <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}
        {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500 shadow-soft">Loading school settings...</div> : <form onSubmit={save} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft"><div className="grid gap-5 md:grid-cols-2"><label className="text-sm font-medium">School name<input required minLength={2} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" /></label><label className="text-sm font-medium">Registration number<input required value={form.registrationNumber} onChange={(event) => setForm({ ...form, registrationNumber: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" /></label><label className="text-sm font-medium">Address<input required value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" /></label><label className="text-sm font-medium">Region<input required value={form.region} onChange={(event) => setForm({ ...form, region: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" /></label><label className="text-sm font-medium">District<input required value={form.district} onChange={(event) => setForm({ ...form, district: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" /></label><label className="text-sm font-medium">Phone<input required minLength={8} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" /></label><label className="text-sm font-medium md:col-span-2">Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" /></label></div><button disabled={saving || !school} className="mt-6 rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white disabled:opacity-60">{saving ? 'Saving...' : 'Save changes'}</button></form>}
      </div>
    </div>
  );
};

export default SettingsPage;
