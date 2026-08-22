import { type FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

type Announcement = { id: string; title: string; message: string; target: string; status: string; createdAt: string };

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [form, setForm] = useState({ title: '', message: '', target: 'ALL', status: 'PUBLISHED' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const result = await apiFetch<{ announcements: Announcement[] }>('/announcements');
      setAnnouncements(result.announcements);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const result = await apiFetch<{ announcement: Announcement }>('/announcements', { method: 'POST', body: JSON.stringify(form) });
      setAnnouncements((current) => [result.announcement, ...current]);
      setForm({ title: '', message: '', target: 'ALL', status: 'PUBLISHED' });
      setNotice('Announcement published.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to publish announcement.');
    } finally {
      setSaving(false);
    }
  };

  return <div className="min-h-screen bg-slate-50 p-6 text-slate-900"><div className="mx-auto max-w-6xl space-y-6"><header><p className="text-sm font-semibold uppercase tracking-[.2em] text-brand-700">Communication</p><h1 className="mt-2 text-3xl font-bold">Announcements</h1><p className="mt-1 text-sm text-slate-600">Publish notices to the right school audience.</p></header>{error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}{notice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}<form onSubmit={create} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft"><h2 className="text-lg font-semibold">Create announcement</h2><div className="mt-4 grid gap-4 md:grid-cols-3"><input required minLength={2} placeholder="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 md:col-span-2" /><select value={form.target} onChange={(event) => setForm({ ...form, target: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2"><option>ALL</option><option>PARENTS</option><option>TEACHERS</option><option>STUDENTS</option></select><textarea required minLength={2} placeholder="Message" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} className="min-h-28 rounded-xl border border-slate-200 px-3 py-2 md:col-span-3" /></div><button disabled={saving} className="mt-4 rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white disabled:opacity-60">{saving ? 'Publishing...' : 'Publish announcement'}</button></form><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft"><h2 className="text-lg font-semibold">Published announcements</h2>{loading ? <div className="mt-4 text-slate-500">Loading announcements...</div> : announcements.length ? <div className="mt-4 space-y-3">{announcements.map((announcement) => <article key={announcement.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">{announcement.title}</h3><span className="text-xs text-slate-500">{announcement.target}</span></div><p className="mt-2 text-sm text-slate-600">{announcement.message}</p></article>)}</div> : <div className="mt-4 text-slate-500">No published announcements yet.</div>}</section></div></div>;
+};
+
+export default AnnouncementsPage;
