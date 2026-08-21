-- SIMS Supabase schema
-- This mirrors the app's existing core entities so the live database can replace demo data without changing the app shape.

create extension if not exists pgcrypto;

create table if not exists public.schools (
  id text primary key,
  name text not null,
  registration_number text not null,
  address text not null,
  region text not null,
  district text not null,
  phone text not null,
  email text not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'SUSPENDED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.users (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  name text not null,
  email text not null,
  password_hash text not null,
  role text not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  permissions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_school_id on public.users(school_id);
create index if not exists idx_users_email on public.users(email);

-- Public profiles are the server-owned authorization source for Supabase Auth
-- identities. New managed accounts use their auth.users UUID as this id.
create unique index if not exists idx_users_email_unique on public.users(lower(email));

create table if not exists public.guardians (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  user_id text unique references public.users(id) on delete set null,
  name text not null,
  relationship text not null,
  phone text not null,
  email text,
  address text,
  occupation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_guardians_school_id on public.guardians(school_id);
create index if not exists idx_guardians_user_id on public.guardians(user_id);

create table if not exists public.students (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  admission_number text not null,
  first_name text not null,
  middle_name text,
  last_name text not null,
  gender text not null check (gender in ('MALE', 'FEMALE', 'OTHER')),
  date_of_birth date not null,
  place_of_birth text,
  nationality text,
  phone text,
  email text,
  address text,
  photo text,
  admission_date date not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED')),
  class_name text,
  stream text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_students_school_id on public.students(school_id);
create index if not exists idx_students_admission_number on public.students(admission_number);

create table if not exists public.student_guardians (
  id text primary key,
  student_id text not null references public.students(id) on delete cascade,
  guardian_id text not null references public.guardians(id) on delete cascade,
  relationship text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (student_id, guardian_id)
);

create index if not exists idx_student_guardians_guardian_id on public.student_guardians(guardian_id);

create table if not exists public.academic_years (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'CLOSED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academic_classes (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  name text not null,
  code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.streams (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  name text not null,
  code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance_records (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  student_id text not null references public.students(id) on delete cascade,
  date date not null,
  present boolean not null default true,
  status text not null default 'PRESENT' check (status in ('PRESENT', 'ABSENT', 'LATE')),
  remark text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_attendance_student_date on public.attendance_records(student_id, date);

create table if not exists public.exams (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  name text not null,
  exam_type text not null,
  academic_year_id text,
  subject_id text,
  class_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marks (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  student_id text not null references public.students(id) on delete cascade,
  exam_id text not null references public.exams(id) on delete cascade,
  subject_id text not null,
  score numeric,
  out_of numeric,
  grade text,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_marks_student_exam on public.marks(student_id, exam_id);

create table if not exists public.fee_structures (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  name text not null,
  category text not null,
  amount numeric not null,
  due_day integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  student_id text not null references public.students(id) on delete cascade,
  invoice_number text not null,
  period text not null,
  amount numeric not null,
  status text not null default 'UNPAID' check (status in ('UNPAID', 'PARTIAL', 'PAID', 'OVERDUE')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_invoices_student_status on public.invoices(student_id, status);

create table if not exists public.fee_payments (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  invoice_id text not null references public.invoices(id) on delete cascade,
  student_id text not null references public.students(id) on delete cascade,
  amount numeric not null,
  payment_method text not null,
  reference text not null,
  status text not null default 'SUCCESS' check (status in ('SUCCESS', 'PENDING', 'FAILED')),
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.receipts (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  invoice_id text not null references public.invoices(id) on delete cascade,
  payment_id text not null references public.fee_payments(id) on delete cascade,
  receipt_number text not null,
  total_amount numeric not null,
  issued_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_schools_updated_at
before update on public.schools
for each row execute function public.set_updated_at();

create trigger trg_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create trigger trg_guardians_updated_at
before update on public.guardians
for each row execute function public.set_updated_at();

create trigger trg_students_updated_at
before update on public.students
for each row execute function public.set_updated_at();

create trigger trg_academic_years_updated_at
before update on public.academic_years
for each row execute function public.set_updated_at();

create trigger trg_academic_classes_updated_at
before update on public.academic_classes
for each row execute function public.set_updated_at();

create trigger trg_streams_updated_at
before update on public.streams
for each row execute function public.set_updated_at();

create trigger trg_subjects_updated_at
before update on public.subjects
for each row execute function public.set_updated_at();

create trigger trg_attendance_records_updated_at
before update on public.attendance_records
for each row execute function public.set_updated_at();

create trigger trg_exams_updated_at
before update on public.exams
for each row execute function public.set_updated_at();

create trigger trg_marks_updated_at
before update on public.marks
for each row execute function public.set_updated_at();

create trigger trg_fee_structures_updated_at
before update on public.fee_structures
for each row execute function public.set_updated_at();

create trigger trg_invoices_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();

create trigger trg_fee_payments_updated_at
before update on public.fee_payments
for each row execute function public.set_updated_at();

create trigger trg_receipts_updated_at
before update on public.receipts
for each row execute function public.set_updated_at();

-- The web client uses Supabase only for Auth. Application records are served
-- through the API after its RBAC and tenant checks, so browser table access is
-- deliberately denied. The server's service-role client bypasses RLS.
alter table public.schools enable row level security;
alter table public.users enable row level security;
alter table public.guardians enable row level security;
alter table public.students enable row level security;
alter table public.academic_years enable row level security;
alter table public.academic_classes enable row level security;
alter table public.streams enable row level security;
alter table public.subjects enable row level security;
alter table public.attendance_records enable row level security;
alter table public.exams enable row level security;
alter table public.marks enable row level security;
alter table public.fee_structures enable row level security;
alter table public.invoices enable row level security;
alter table public.fee_payments enable row level security;
alter table public.receipts enable row level security;
