-- Core schema: profiles, students, lessons — with Row Level Security so a
-- student's queries can only ever return their own rows, while the teacher's
-- account gets cross-student visibility via a role check. No application-
-- level filtering needed for the "students only see their own data" rule —
-- it's enforced by the database itself.

create type public.user_role as enum ('student', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'student',
  full_name text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: a user reads their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: a user updates their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Automatically creates a profile row whenever a new user signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table public.students (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  student_name text not null,
  guardian_name text not null,
  guardian_email text not null,
  created_at timestamptz not null default now()
);

alter table public.students enable row level security;

create policy "students: owner reads their own record"
  on public.students for select
  using (auth.uid() = owner_id);

create policy "students: admin reads every record"
  on public.students for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create type public.lesson_status as enum ('confirmed', 'completed', 'cancelled');

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  scheduled_at timestamptz not null,
  duration_minutes int not null default 60,
  status public.lesson_status not null default 'confirmed',
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.lessons enable row level security;

create policy "lessons: a student reads their own lessons"
  on public.lessons for select
  using (
    exists (
      select 1 from public.students
      where students.id = lessons.student_id and students.owner_id = auth.uid()
    )
  );

create policy "lessons: admin manages every lesson"
  on public.lessons for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
