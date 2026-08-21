import { Navigate, Route, Routes } from 'react-router-dom';
import AcademicOverview from './pages/AcademicOverview';
import FinanceOverview from './pages/FinanceOverview';
import PortalDashboard from './pages/PortalDashboard';
import ReportsDashboard from './pages/ReportsDashboard';
import SchoolManagement from './pages/SchoolManagement';
import SettingsPage from './pages/SettingsPage';

const LandingPage = () => (
  <div className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">S</div>
          <div>
            <div className="text-lg font-semibold">SIMS</div>
            <div className="text-xs text-slate-500">School Information Management</div>
          </div>
        </div>
        <nav className="hidden gap-8 text-sm font-medium text-slate-600 md:flex">
          <a href="#features">Features</a>
          <a href="#solutions">Solutions</a>
          <a href="#pricing">Pricing</a>
          <a href="#contact">Contact</a>
          <a href="/students">Students</a>
          <a href="/reports">Reports</a>
        </nav>
        <div className="flex items-center gap-3">
          <a href="/login" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Login</a>
          <a href="/settings" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-soft">Request a Demo</a>
        </div>
      </div>
    </header>

    <main>
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
        <div>
          <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
            School Operations Platform
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 md:text-6xl">
            Everything Your School Needs, In One Powerful Platform.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-600">
            SIMS brings together student management, attendance, fees, academic performance, parent communication, and school administration in one secure, scalable system built for Tanzanian schools.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a href="/settings" className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-soft">Request a Demo</a>
            <a href="/login" className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700">Login</a>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="rounded-2xl bg-slate-900 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-300">School Admin Dashboard</div>
                <div className="mt-2 text-2xl font-semibold">Overview</div>
              </div>
              <div className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300">Live</div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                ['2,345', 'Students'],
                ['96%', 'Attendance'],
                ['TSh 86M', 'Fees Collected'],
                ['24', 'Classes'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl bg-slate-800 p-4">
                  <div className="text-2xl font-bold">{value}</div>
                  <div className="mt-1 text-sm text-slate-300">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Features</div>
          <h2 className="mt-4 text-3xl font-bold text-slate-900">Built for modern school operations</h2>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            'Student Management',
            'Academic Management',
            'Fees & Payments',
            'Attendance',
            'Parent Portal',
            'Reports',
            'Communication',
            'Administration',
          ].map((feature) => (
            <div key={feature} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="mb-4 h-10 w-10 rounded-xl bg-brand-50 text-brand-700" />
              <h3 className="text-lg font-semibold text-slate-900">{feature}</h3>
              <p className="mt-2 text-sm text-slate-600">Handle the core workflows schools depend on with clarity and speed.</p>
            </div>
          ))}
        </div>
      </section>

      <section id="solutions" className="bg-slate-900 py-20 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-200">How it works</div>
            <h2 className="mt-4 text-3xl font-bold">Simple implementation, powerful results</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[
              'Register school',
              'Configure school',
              'Add students',
              'Manage academics',
              'Manage fees',
              'Communicate with parents',
            ].map((step, index) => (
              <div key={step} className="rounded-2xl border border-slate-700 bg-slate-800 p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 font-semibold">0{index + 1}</div>
                <h3 className="text-lg font-semibold">{step}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Benefits</div>
          <h2 className="mt-4 text-3xl font-bold text-slate-900">Grow your school with confidence</h2>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            'Save time',
            'Reduce paperwork',
            'Improve transparency',
            'Track student performance',
            'Simplify fee collection',
            'Improve parent communication',
          ].map((benefit) => (
            <div key={benefit} className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-soft">
              {benefit}
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="bg-brand-600 py-16 text-white">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-3xl font-bold">Modernize Your School Today.</h2>
          <a href="/settings" className="mt-6 inline-block rounded-xl bg-white px-6 py-3 font-semibold text-brand-700">Request a Demo</a>
        </div>
      </section>
    </main>
  </div>
);

const App = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<div className="p-10 text-center text-xl">Login page placeholder</div>} />
    <Route path="/students" element={<SchoolManagement />} />
    <Route path="/academics" element={<AcademicOverview />} />
    <Route path="/fees" element={<FinanceOverview />} />
    <Route path="/portal" element={<PortalDashboard />} />
    <Route path="/reports" element={<ReportsDashboard />} />
    <Route path="/settings" element={<SettingsPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
