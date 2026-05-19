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

alter table public.question_reviews enable row level security;

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
