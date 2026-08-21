alter table public.guardians
  add column if not exists user_id text unique references public.users(id) on delete set null;

create index if not exists idx_guardians_user_id on public.guardians(user_id);

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
alter table public.student_guardians enable row level security;
revoke all on public.student_guardians from anon, authenticated;
