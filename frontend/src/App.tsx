import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { type FormEvent, type ReactNode, useState } from 'react';
import { apiFetch } from './lib/api';
import { supabase, supabaseEnabled } from './lib/supabaseClient';
import AcademicOverview from './pages/AcademicOverview';
import FinanceOverview from './pages/FinanceOverview';
import PortalDashboard from './pages/PortalDashboard';
import ReportsDashboard from './pages/ReportsDashboard';
import SchoolManagement from './pages/SchoolManagement';
import SettingsPage from './pages/SettingsPage';
import UserManagementPage from './pages/UserManagementPage';
import TeachersPage from './pages/TeachersPage';
import StudentProfilePage from './pages/StudentProfilePage';

type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  schoolId: string;
  permissions: string[];
};

const getSessionUser = (): SessionUser | null => {
  const rawUser = localStorage.getItem('sims_user');

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as SessionUser;
  } catch {
    localStorage.removeItem('sims_user');
    return null;
  }
};

const defaultRouteForRole = (role: string) => {
  if (role === 'PARENT' || role === 'STUDENT') return '/portal';
  if (['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(role)) return '/students';
  if (role === 'TEACHER') return '/academics';
  if (role === 'ACCOUNTANT') return '/fees';
  if (role === 'RECEPTIONIST' || role === 'LIBRARIAN') return '/students';
  return '/reports';
};

const AdminNavigation = ({ user }: { user: SessionUser }) => {
  const links = [
    { label: 'Students', href: '/students', roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'RECEPTIONIST'] },
    { label: 'Teachers', href: '/teachers', roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN'] },
    { label: 'Academics', href: '/academics', roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'] },
    { label: 'Fees', href: '/fees', roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'] },
    { label: 'Reports', href: '/reports', roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'ACCOUNTANT'] },
    { label: 'Users', href: '/users', roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN'] },
    { label: 'Settings', href: '/settings', roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN'] },
  ].filter((link) => link.roles.includes(user.role));

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-6 py-3 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 pr-20">
        <a href="/" className="mr-3 text-lg font-bold text-brand-700">SIMS</a>
        {links.map((link) => (
          <a key={link.href} href={link.href} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-brand-50 hover:text-brand-700">
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
};

const LogoutButton = () => {
  const navigate = useNavigate();

  const logout = async () => {
    // Clear the local app session even if Supabase is temporarily unreachable.
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('sims_token');
    localStorage.removeItem('sims_user');
    localStorage.removeItem('sims_school');
    navigate('/login', { replace: true });
  };

  return (
    <button
      type="button"
      onClick={() => { void logout(); }}
      className="fixed right-5 top-5 z-50 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-soft transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
    >
      Log out
    </button>
  );
};

const ProtectedRoute = ({ children, allowedRoles }: { children: ReactNode; allowedRoles?: string[] }) => {
  const user = getSessionUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={defaultRouteForRole(user.role)} replace />;
  }

  return <><AdminNavigation user={user} /><LogoutButton />{children}</>;
};

const RoleRoute = ({ children, allowedRoles }: { children: ReactNode; allowedRoles: string[] }) => {
  const user = getSessionUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={defaultRouteForRole(user.role)} replace />;
  }

  return <><AdminNavigation user={user} /><LogoutButton />{children}</>;
};

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

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result: { token: string; user: SessionUser; school: { id: string; name: string } | null };
      if (supabaseEnabled && supabase) {
        const { data, error: supabaseError } = await supabase.auth.signInWithPassword({ email, password });
        if (supabaseError || !data.session) throw new Error(supabaseError?.message ?? 'Unable to create a Supabase session');
        const token = data.session.access_token;
        localStorage.setItem('sims_token', token);
        const profile = await apiFetch<SessionUser & { school: { id: string; name: string } | null }>('/auth/me');
        result = { token, user: profile, school: profile.school };
      } else {
        result = await apiFetch<{ token: string; user: SessionUser; school: { id: string; name: string } | null }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
      }

      localStorage.setItem('sims_token', result.token);
      localStorage.setItem('sims_user', JSON.stringify(result.user));
      localStorage.setItem('sims_school', JSON.stringify(result.school));
      navigate(defaultRouteForRole(result.user.role));
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-xl font-bold text-white">S</div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">SIMS Login</h1>
          <p className="mt-2 text-sm text-slate-500">Access your school dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none ring-0 transition focus:border-brand-500 focus:bg-white"
              placeholder={supabaseEnabled ? 'you@school.edu' : 'admin@example.com'}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none ring-0 transition focus:border-brand-500 focus:bg-white"
              placeholder="Password123!"
              required
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <a href="/register" className="text-sm font-semibold text-brand-600">Create account</a>
        </div>

        <div className="mt-5 rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-600">
          {supabaseEnabled
            ? 'Sign in with the account created for your Supabase project.'
            : <>Demo credentials: <span className="font-semibold">admin@example.com / Password123!</span></>}
        </div>
      </div>
    </div>
  );
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('PARENT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiFetch<{ user: SessionUser }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
      });

      if (supabaseEnabled && supabase) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError || !data.session) throw new Error(signInError?.message ?? 'Account created, but automatic sign-in failed. Please sign in.');
        localStorage.setItem('sims_token', data.session.access_token);
        const profile = await apiFetch<SessionUser & { school: { id: string; name: string } | null }>('/auth/me');
        localStorage.setItem('sims_user', JSON.stringify(profile));
        localStorage.setItem('sims_school', JSON.stringify(profile.school));
        navigate(defaultRouteForRole(profile.role));
        return;
      }

      const result = await apiFetch<{ token: string; user: SessionUser; school: { id: string; name: string } | null }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem('sims_token', result.token);
      localStorage.setItem('sims_user', JSON.stringify(result.user));
      localStorage.setItem('sims_school', JSON.stringify(result.school));
      navigate(defaultRouteForRole(result.user.role));
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-xl font-bold text-white">S</div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Create account</h1>
          <p className="mt-2 text-sm text-slate-500">Create your account. New self-service accounts start as parents.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
            <input id="name" value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" required />
          </div>
          <div>
            <label htmlFor="register-email" className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input id="register-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" required />
          </div>
          <div>
            <label htmlFor="register-password" className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input id="register-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" required />
          </div>
          {!supabaseEnabled && <div>
            <label htmlFor="role" className="mb-1 block text-sm font-medium text-slate-700">Role</label>
            <select id="role" value={role} onChange={(event) => setRole(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <option value="PARENT">Parent</option>
              <option value="STUDENT">Student</option>
              <option value="TEACHER">Teacher</option>
              <option value="SCHOOL_ADMIN">School Admin</option>
            </select>
          </div>}

          {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

          <button type="submit" disabled={loading} className="w-full rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <a href="/login" className="font-semibold text-brand-600">Back to login</a>
        </div>
      </div>
    </div>
  );
};

const App = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/students" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'RECEPTIONIST']}><SchoolManagement /></ProtectedRoute>} />
    <Route path="/students/:id" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'RECEPTIONIST']}><StudentProfilePage /></ProtectedRoute>} />
    <Route path="/teachers" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN']}><TeachersPage /></RoleRoute>} />
    <Route path="/academics" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER']}><AcademicOverview /></ProtectedRoute>} />
    <Route path="/fees" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT', 'PARENT', 'STUDENT']}><FinanceOverview /></ProtectedRoute>} />
    <Route path="/portal" element={<ProtectedRoute allowedRoles={['PARENT', 'STUDENT']}><PortalDashboard /></ProtectedRoute>} />
    <Route path="/reports" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'ACCOUNTANT']}><ReportsDashboard /></ProtectedRoute>} />
    <Route path="/settings" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN']}><SettingsPage /></RoleRoute>} />
    <Route path="/users" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN']}><UserManagementPage /></RoleRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
