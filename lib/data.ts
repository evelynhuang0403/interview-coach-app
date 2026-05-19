"use client";

import { localStore } from "./local-store";
import { hasSupabaseConfig, supabase } from "./supabase";
import type { QuestionInput, QuestionReview, QuestionReviewInput, UserStreak } from "./types";

function requireSupabase() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

export const demoModeKey = "interview-coach.demoMode";

export function isDemoMode() {
  return !hasSupabaseConfig || (typeof window !== "undefined" && window.localStorage.getItem(demoModeKey) === "true");
}

export async function getCurrentUser() {
  if (isDemoMode()) {
    return { id: "demo-user", email: "demo@local.app" };
  }
  const client = requireSupabase();
  const { data } = await client.auth.getUser();
  return data.user;
}

export async function signIn(email: string, password: string) {
  const client = requireSupabase();
  return client.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string) {
  const client = requireSupabase();
  return client.auth.signUp({ email, password });
}

export async function signOut() {
  if (typeof window !== "undefined") window.localStorage.removeItem(demoModeKey);
  if (isDemoMode()) return;
  await requireSupabase().auth.signOut();
}

export async function listQuestions() {
  if (isDemoMode()) return localStore.listQuestions();
  const client = requireSupabase();
  const { data, error } = await client
    .from("questions")
    .select("*")
    .neq("status", "archived")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getQuestion(id: string) {
  if (isDemoMode()) return localStore.getQuestion(id);
  const client = requireSupabase();
  const { data, error } = await client.from("questions").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function saveQuestion(input: QuestionInput, id?: string) {
  if (isDemoMode()) return localStore.saveQuestion(input, id);
  const client = requireSupabase();
  const user = await getCurrentUser();
  if (!user) throw new Error("You must be signed in.");
  if (id) {
    const { data, error } = await client.from("questions").update(input).eq("id", id).select("*").single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await client
    .from("questions")
    .insert({ ...input, user_id: user.id })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function archiveQuestion(id: string) {
  if (isDemoMode()) {
    localStore.archiveQuestion(id);
    return;
  }
  const client = requireSupabase();
  const { error } = await client.from("questions").update({ status: "archived" }).eq("id", id);
  if (error) throw error;
}

export async function duplicateQuestion(id: string) {
  if (isDemoMode()) return localStore.duplicateQuestion(id);
  const original = await getQuestion(id);
  if (!original) return null;
  const copy = {
    title: `${original.title} (Copy)`,
    prompt: original.prompt,
    answer: original.answer,
    category: original.category,
    track: original.track,
    difficulty: original.difficulty,
    tags: original.tags ?? [],
    source_file: original.source_file,
    source_id: null,
    story_links: original.story_links ?? [],
    status: "new" as const,
    notes: original.notes ?? "",
    structured_content: original.structured_content ?? null,
    question_group: original.question_group ?? null,
    behavioral_type: original.behavioral_type ?? null,
    technical_type: original.technical_type ?? null,
    review_count: 0,
    last_reviewed_at: null
  };
  return saveQuestion(copy);
}

export async function listQuestionReviews(questionId: string) {
  if (isDemoMode()) return localStore.listQuestionReviews(questionId);
  const client = requireSupabase();
  const { data, error } = await client.rpc("list_question_reviews", {
    p_question_id: questionId
  });
  if (error) throw error;
  return data ?? [];
}

export async function listAllQuestionReviews() {
  if (isDemoMode()) return localStore.listAllQuestionReviews();
  const client = requireSupabase();
  const { data, error } = await client.rpc("list_all_question_reviews");
  if (error) throw error;
  return data ?? [];
}

function dayKey(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}

function addDays(key: string, days: number) {
  const date = new Date(`${key}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return dayKey(date);
}

function computeStreak(reviews: QuestionReview[]): UserStreak {
  const activeDays = [...new Set(reviews.map((review) => dayKey(review.practiced_at)))].sort();
  if (!activeDays.length) return { current_streak: 0, best_streak: 0, last_practice_date: null };

  let best = 1;
  let run = 1;
  for (let index = 1; index < activeDays.length; index += 1) {
    run = activeDays[index] === addDays(activeDays[index - 1], 1) ? run + 1 : 1;
    best = Math.max(best, run);
  }

  const today = dayKey(new Date());
  const yesterday = addDays(today, -1);
  const last = activeDays[activeDays.length - 1];
  let current = 0;
  if (last === today || last === yesterday) {
    current = 1;
    for (let index = activeDays.length - 2; index >= 0; index -= 1) {
      if (activeDays[index] !== addDays(activeDays[index + 1], -1)) break;
      current += 1;
    }
  }
  return { current_streak: current, best_streak: best, last_practice_date: last };
}

export async function getStreakSummary() {
  if (isDemoMode()) return localStore.getStreakSummary();
  const client = requireSupabase();
  const user = await getCurrentUser();
  if (!user) return { current_streak: 0, best_streak: 0, last_practice_date: null };

  const { data, error } = await client
    .from("user_streaks")
    .select("current_streak,best_streak,last_practice_date,updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!error && data) return data as UserStreak;

  const reviews = (await listAllQuestionReviews()) as QuestionReview[];
  return computeStreak(reviews);
}

export async function addQuestionReview(input: QuestionReviewInput) {
  if (isDemoMode()) return localStore.addQuestionReview(input);
  const client = requireSupabase();
  const { data, error } = await client.rpc("check_in_question_review", {
    p_question_id: input.question_id,
    p_result: input.result,
    p_confidence: input.confidence ?? null,
    p_note: input.note ?? ""
  });
  if (error) throw error;

  return data;
}
