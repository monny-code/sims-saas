const SettingsPage = () => {
  const sessionUser = (() => {
    try {
      const rawUser = localStorage.getItem('sims_user');
      return rawUser ? JSON.parse(rawUser) : null;
    } catch {
      return null;
    }
  })();

  const canManageUsers = ['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(sessionUser?.role ?? '');

  const settings = [
    { label: 'School name', value: 'Example International School' },
    { label: 'Academic year', value: '2026' },
    { label: 'Time zone', value: 'East Africa Time (UTC+3)' },
    { label: 'Primary email', value: 'info@example.edu' },
    { label: 'Fee reminder', value: 'Enabled' },
    { label: 'SMS notifications', value: 'Enabled' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Settings</p>
            <h1 className="mt-2 text-3xl font-bold">School configuration</h1>
          </div>
          <div className="flex items-center gap-3">
            {canManageUsers ? (
              <a href="/users" className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-700">Manage users</a>
            ) : null}
            <button className="rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white shadow-soft">Save changes</button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
            <div className="space-y-2 text-sm font-medium text-slate-600">
              <div className="rounded-xl bg-brand-50 px-3 py-2 text-brand-700">General</div>
              <div className="rounded-xl px-3 py-2 hover:bg-slate-50">Billing</div>
              <div className="rounded-xl px-3 py-2 hover:bg-slate-50">Notifications</div>
              <div className="rounded-xl px-3 py-2 hover:bg-slate-50">Security</div>
              {canManageUsers ? (
                <a href="/users" className="block rounded-xl px-3 py-2 text-brand-600 hover:bg-slate-50">User management</a>
              ) : null}
            </div>
          </aside>

          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
              <h2 className="text-xl font-semibold">School profile</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {settings.map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-[0.15em] text-slate-500">{item.label}</div>
                    <div className="mt-2 font-medium text-slate-800">{item.value}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
              <h2 className="text-xl font-semibold">Automation</h2>
              <div className="mt-5 space-y-4">
                {[
                  ['Fee reminders', true],
                  ['Exam result notifications', true],
                  ['Daily attendance summary', false],
                  ['Parent portal announcements', true],
                ].map(([title, enabled]) => (
                  <div key={title as string} className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                    <span className="font-medium text-slate-700">{title as string}</span>
                    <button className={`rounded-full px-3 py-1 text-xs font-semibold ${enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
