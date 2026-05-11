-- ============================================================
-- InstaRatiba — Supabase Migration
-- Segments 3 & 4: Schools, Timings, Classes, Rooms
-- Run in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ── Enable UUID extension ────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Storage bucket for school logos ─────────────────────────
insert into storage.buckets (id, name, public)
values ('school-assets', 'school-assets', true)
on conflict do nothing;

-- Allow authenticated users to upload to their own folder
create policy "Authenticated upload own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'school-assets'
    and auth.uid()::text = (storage.foldername(name))[2]
  );

create policy "Public read school assets"
  on storage.objects for select
  using (bucket_id = 'school-assets');

-- ── Schools table ─────────────────────────────────────────────
create table if not exists public.schools (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  name                text not null check (char_length(name) <= 80),
  county              text not null,
  sub_county          text,
  levels              text[] not null default '{}',
  motto               text,
  nemis_code          text check (nemis_code ~ '^\d{7}$' or nemis_code is null),
  logo_url            text,
  indigenous_language text,
  academic_year       int not null default extract(year from now())::int,
  current_term        int not null default 1 check (current_term in (1,2,3)),
  climate_adjustment  boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (user_id)   -- one school per user (free tier)
);

-- RLS
alter table public.schools enable row level security;

create policy "Users manage own school"
  on public.schools
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Level Timings table ───────────────────────────────────────
create table if not exists public.level_timings (
  id                   uuid primary key default uuid_generate_v4(),
  school_id            uuid not null references public.schools(id) on delete cascade,
  level                text not null check (level in ('lower_primary','upper_primary','junior_secondary')),
  lesson_start         text not null default '08:20',
  lesson_duration_min  int  not null default 30,
  break1_after_lesson  int  not null default 2,
  break1_duration_min  int  not null default 10,
  break2_after_lesson  int  not null default 4,
  break2_duration_min  int  not null default 30,
  lunch_enabled        boolean not null default false,
  lunch_after_lesson   int,
  lunch_duration_min   int,
  non_formal_start     text,
  non_formal_end       text,
  unique (school_id, level)
);

alter table public.level_timings enable row level security;

create policy "Users manage own timings"
  on public.level_timings
  using (school_id in (select id from public.schools where user_id = auth.uid()))
  with check (school_id in (select id from public.schools where user_id = auth.uid()));

-- ── Classes table ─────────────────────────────────────────────
create table if not exists public.classes (
  id               uuid primary key default uuid_generate_v4(),
  school_id        uuid not null references public.schools(id) on delete cascade,
  grade            int  not null check (grade between 1 and 9),
  stream           text not null,
  class_teacher_id uuid references public.teachers(id) on delete set null,
  size             int,
  unique (school_id, grade, stream)
);

alter table public.classes enable row level security;

create policy "Users manage own classes"
  on public.classes
  using (school_id in (select id from public.schools where user_id = auth.uid()))
  with check (school_id in (select id from public.schools where user_id = auth.uid()));

-- ── Teachers table (stub — full definition in Segment 5) ──────
create table if not exists public.teachers (
  id                    uuid primary key default uuid_generate_v4(),
  school_id             uuid not null references public.schools(id) on delete cascade,
  name                  text not null,
  tsc_no                text,
  email                 text,
  phone                 text,
  max_lessons_day       int not null default 6,
  max_lessons_week      int,
  max_consecutive       int not null default 3,
  min_free_periods_day  int,
  created_at            timestamptz not null default now()
);

alter table public.teachers enable row level security;

create policy "Users manage own teachers"
  on public.teachers
  using (school_id in (select id from public.schools where user_id = auth.uid()))
  with check (school_id in (select id from public.schools where user_id = auth.uid()));

-- ── Rooms table ───────────────────────────────────────────────
create table if not exists public.rooms (
  id            uuid primary key default uuid_generate_v4(),
  school_id     uuid not null references public.schools(id) on delete cascade,
  name          text not null,
  capacity      int,
  subject_codes text[] not null default '{}',
  levels        text[] not null default '{}',
  unique (school_id, name)
);

alter table public.rooms enable row level security;

create policy "Users manage own rooms"
  on public.rooms
  using (school_id in (select id from public.schools where user_id = auth.uid()))
  with check (school_id in (select id from public.schools where user_id = auth.uid()));

-- ── Helper: auto-update updated_at ───────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger schools_updated_at
  before update on public.schools
  for each row execute function public.touch_updated_at();
