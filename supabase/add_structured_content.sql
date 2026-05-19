alter table public.questions
add column if not exists structured_content jsonb;
