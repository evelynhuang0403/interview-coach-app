"use client";

import { demoQuestions } from "./seed-data";
import type { Question, QuestionInput, QuestionReview, QuestionReviewInput, UserStreak } from "./types";

const questionKey = "interview-coach.questions";
const reviewKey = "interview-coach.questionReviews";
const streakKey = "interview-coach.userStreak";

const now = () => new Date().toISOString();

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function ensureDemoData() {
  if (typeof window === "undefined") return;
  if (!window.localStorage.getItem(questionKey)) {
    write(questionKey, demoQuestions);
  }
  if (!window.localStorage.getItem(reviewKey)) {
    write(reviewKey, []);
  }
  if (!window.localStorage.getItem(streakKey)) {
    write(streakKey, computeStreak(read<QuestionReview[]>(reviewKey, [])));
  }
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

export const localStore = {
  listQuestions() {
    ensureDemoData();
    return read<Question[]>(questionKey, demoQuestions);
  },
  getQuestion(id: string) {
    return this.listQuestions().find((question) => question.id === id) ?? null;
  },
  saveQuestion(input: QuestionInput, id?: string) {
    const questions = this.listQuestions();
    const timestamp = now();
    if (id) {
      const updated = questions.map((question) =>
        question.id === id ? { ...question, ...input, updated_at: timestamp } : question
      );
      write(questionKey, updated);
      return updated.find((question) => question.id === id) ?? null;
    }
    const question: Question = {
      ...input,
      id: crypto.randomUUID(),
      review_count: input.review_count ?? 0,
      last_reviewed_at: input.last_reviewed_at ?? null,
      created_at: timestamp,
      updated_at: timestamp
    };
    write(questionKey, [question, ...questions]);
    return question;
  },
  archiveQuestion(id: string) {
    const questions = this.listQuestions().map((question) =>
      question.id === id ? { ...question, status: "archived" as const, updated_at: now() } : question
    );
    write(questionKey, questions);
  },
  duplicateQuestion(id: string) {
    const question = this.getQuestion(id);
    if (!question) return null;
    const copy = {
      ...question,
      source_id: null,
      title: `${question.title} (Copy)`,
      status: "new" as const,
      review_count: 0,
      last_reviewed_at: null
    };
    delete (copy as Partial<Question>).id;
    delete (copy as Partial<Question>).created_at;
    delete (copy as Partial<Question>).updated_at;
    return this.saveQuestion(copy as QuestionInput);
  },
  listQuestionReviews(questionId: string) {
    ensureDemoData();
    return read<QuestionReview[]>(reviewKey, [])
      .filter((review) => review.question_id === questionId)
      .sort((a, b) => b.practiced_at.localeCompare(a.practiced_at));
  },
  listAllQuestionReviews() {
    ensureDemoData();
    return read<QuestionReview[]>(reviewKey, []).sort((a, b) => b.practiced_at.localeCompare(a.practiced_at));
  },
  getStreakSummary() {
    ensureDemoData();
    const reviews = read<QuestionReview[]>(reviewKey, []);
    const streak = computeStreak(reviews);
    write(streakKey, streak);
    return streak;
  },
  addQuestionReview(input: QuestionReviewInput) {
    ensureDemoData();
    const timestamp = now();
    const review: QuestionReview = {
      id: crypto.randomUUID(),
      question_id: input.question_id,
      result: input.result,
      confidence: input.confidence ?? null,
      note: input.note ?? "",
      practiced_at: timestamp
    };
    const reviews = read<QuestionReview[]>(reviewKey, []);
    write(reviewKey, [review, ...reviews]);
    const status = input.result === "reviewed" ? "reviewing" : input.result;
    const questions = this.listQuestions().map((question) =>
      question.id === input.question_id
        ? {
            ...question,
            status,
            review_count: (question.review_count ?? 0) + 1,
            last_reviewed_at: timestamp,
            updated_at: timestamp
          }
        : question
    );
    write(questionKey, questions);
    write(streakKey, computeStreak([review, ...reviews]));
    return review;
  },
};
