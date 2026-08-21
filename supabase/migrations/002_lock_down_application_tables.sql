-- The browser never reads application tables directly. All application data
-- flows through the API, whose service-role client bypasses RLS after it has
-- authenticated and authorized the request. Remove the permissive starter
-- policies so an authenticated Supabase user cannot enumerate another school.

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
alter table public.student_guardians enable row level security;

drop policy if exists "Allow authenticated access to public tables" on public.schools;
drop policy if exists "Allow authenticated access to public tables" on public.users;
drop policy if exists "Allow authenticated access to public tables" on public.guardians;
drop policy if exists "Allow authenticated access to public tables" on public.students;
drop policy if exists "Allow authenticated access to public tables" on public.academic_years;
drop policy if exists "Allow authenticated access to public tables" on public.academic_classes;
drop policy if exists "Allow authenticated access to public tables" on public.streams;
drop policy if exists "Allow authenticated access to public tables" on public.subjects;
drop policy if exists "Allow authenticated access to public tables" on public.attendance_records;
drop policy if exists "Allow authenticated access to public tables" on public.exams;
drop policy if exists "Allow authenticated access to public tables" on public.marks;
drop policy if exists "Allow authenticated access to public tables" on public.fee_structures;
drop policy if exists "Allow authenticated access to public tables" on public.invoices;
drop policy if exists "Allow authenticated access to public tables" on public.fee_payments;
drop policy if exists "Allow authenticated access to public tables" on public.receipts;

revoke all on all tables in schema public from anon, authenticated;
