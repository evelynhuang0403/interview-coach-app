create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  display_name text,
  target_role text,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id text,
  title text not null,
  prompt text not null,
  answer text not null,
  category text not null default 'General',
  track text not null default 'General',
  difficulty text not null default 'easy' check (difficulty in ('easy', 'medium', 'hard')),
  tags text[] not null default '{}',
  source_file text,
  story_links text[] not null default '{}',
  status text not null default 'new' check (status in ('new', 'reviewing', 'confident', 'needs_practice', 'archived')),
  notes text,
  structured_content jsonb,
  question_group text check (question_group in ('behavioral', 'technical')),
  behavioral_type text check (behavioral_type in ('star', 'phone_interview')),
  technical_type text check (technical_type in ('conceptual', 'coding', 'sql', 'selenium_xpath', 'framework_design', 'test_design', 'debugging')),
  review_count integer not null default 0,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source_id)
);

alter table public.questions
add column if not exists structured_content jsonb;

alter table public.questions
add column if not exists question_group text check (question_group in ('behavioral', 'technical')),
add column if not exists behavioral_type text check (behavioral_type in ('star', 'phone_interview')),
add column if not exists technical_type text check (technical_type in ('conceptual', 'coding', 'sql', 'selenium_xpath', 'framework_design', 'test_design', 'debugging')),
add column if not exists review_count integer not null default 0,
add column if not exists last_reviewed_at timestamptz;

create table if not exists public.question_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  practiced_at timestamptz not null default now(),
  result text not null check (result in ('reviewed', 'needs_practice', 'confident')),
  confidence integer check (confidence between 1 and 5),
  note text
);

create table if not exists public.user_streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  last_practice_date date,
  updated_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  session_type text not null default 'Technical review',
  date date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.session_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  result text not null default 'new' check (result in ('new', 'reviewing', 'confident', 'needs_practice')),
  confidence integer check (confidence between 1 and 5),
  notes text,
  next_review_at date,
  unique (session_id, question_id)
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists questions_set_updated_at on public.questions;
create trigger questions_set_updated_at
before update on public.questions
for each row execute function public.set_updated_at();

drop trigger if exists sessions_set_updated_at on public.sessions;
create trigger sessions_set_updated_at
before update on public.sessions
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.sessions enable row level security;
alter table public.session_questions enable row level security;
alter table public.question_reviews enable row level security;
alter table public.user_streaks enable row level security;

drop policy if exists "Profiles are private" on public.profiles;
create policy "Profiles are private"
on public.profiles for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Questions are private" on public.questions;
create policy "Questions are private"
on public.questions for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Question reviews are private" on public.question_reviews;
create policy "Question reviews are private"
on public.question_reviews for all
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.questions
    where questions.id = question_reviews.question_id
      and questions.user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.questions
    where questions.id = question_reviews.question_id
      and questions.user_id = auth.uid()
  )
);

drop policy if exists "User streaks are private" on public.user_streaks;
create policy "User streaks are private"
on public.user_streaks for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Sessions are private" on public.sessions;
create policy "Sessions are private"
on public.sessions for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Session questions follow owning session" on public.session_questions;
create policy "Session questions follow owning session"
on public.session_questions for all
using (
  exists (
    select 1 from public.sessions
    where sessions.id = session_questions.session_id
      and sessions.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.sessions
    where sessions.id = session_questions.session_id
      and sessions.user_id = auth.uid()
  )
);
