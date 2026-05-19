create or replace function public.list_question_reviews(
  p_question_id uuid
)
returns setof public.question_reviews
language sql
security definer
set search_path = public
as $$
  select qr.*
  from public.question_reviews qr
  where qr.question_id = p_question_id
    and exists (
      select 1
      from public.questions q
      where q.id = qr.question_id
        and q.user_id = auth.uid()
    )
  order by qr.practiced_at desc;
$$;

grant execute on function public.list_question_reviews(uuid) to authenticated;
