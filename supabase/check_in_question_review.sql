create or replace function public.check_in_question_review(
  p_question_id uuid,
  p_result text,
  p_confidence integer default null,
  p_note text default null
)
returns public.question_reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_review public.question_reviews;
  current_user_id uuid := auth.uid();
  previous_streak public.user_streaks;
  next_current integer;
  next_best integer;
  today date := current_date;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_result not in ('reviewed', 'needs_practice', 'confident') then
    raise exception 'Invalid review result: %', p_result;
  end if;

  if p_confidence is not null and (p_confidence < 1 or p_confidence > 5) then
    raise exception 'Confidence must be between 1 and 5';
  end if;

  if not exists (
    select 1
    from public.questions
    where id = p_question_id
      and user_id = current_user_id
  ) then
    raise exception 'Question not found or not owned by current user';
  end if;

  insert into public.question_reviews (
    user_id,
    question_id,
    result,
    confidence,
    note
  )
  values (
    current_user_id,
    p_question_id,
    p_result,
    p_confidence,
    coalesce(p_note, '')
  )
  returning * into inserted_review;

  update public.questions
  set
    status = case
      when p_result = 'reviewed' then 'reviewing'
      else p_result
    end,
    review_count = review_count + 1,
    last_reviewed_at = inserted_review.practiced_at
  where id = p_question_id
    and user_id = current_user_id;

  select *
  into previous_streak
  from public.user_streaks
  where user_id = current_user_id
  for update;

  if previous_streak.user_id is null then
    insert into public.user_streaks (user_id, current_streak, best_streak, last_practice_date)
    values (current_user_id, 1, 1, today);
  elsif previous_streak.last_practice_date = today then
    update public.user_streaks
    set updated_at = now()
    where user_id = current_user_id;
  else
    next_current := case
      when previous_streak.last_practice_date = today - 1 then previous_streak.current_streak + 1
      else 1
    end;
    next_best := greatest(previous_streak.best_streak, next_current);

    update public.user_streaks
    set
      current_streak = next_current,
      best_streak = next_best,
      last_practice_date = today,
      updated_at = now()
    where user_id = current_user_id;
  end if;

  return inserted_review;
end;
$$;

grant execute on function public.check_in_question_review(uuid, text, integer, text) to authenticated;
