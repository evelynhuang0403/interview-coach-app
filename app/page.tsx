"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { AppFrame } from "@/components/AppFrame";
import { Heatmap, Paper, QuestionCard, StreakCard, Tag, Topbar, Washi, heatmapFromReviews, todayLabel } from "@/components/Stationery";
import { getStreakSummary, listAllQuestionReviews, listQuestions } from "@/lib/data";
import type { Question, QuestionReview, UserStreak } from "@/lib/types";

function sameDay(value: string, date: Date) {
  return value.slice(0, 10) === date.toISOString().slice(0, 10);
}

function QuestList({ questions, reviews }: { questions: Question[]; reviews: QuestionReview[] }) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const todayReviews = reviews.filter((review) => sameDay(review.practiced_at, today));
  const todayQuestionIds = new Set(todayReviews.map((review) => review.question_id));
  const todayStoryDone = todayReviews.some((review) => questions.find((question) => question.id === review.question_id)?.question_group === "behavioral");
  const yesterdayStumble = reviews.find((review) => sameDay(review.practiced_at, yesterday) && review.result === "needs_practice");
  const pickedUpStumble = yesterdayStumble ? todayReviews.some((review) => review.question_id === yesterdayStumble.question_id) : false;
  const items: Array<{ label: string; done: boolean; count?: number; target?: number }> = [
    { label: "Practice 3 questions", done: todayQuestionIds.size >= 3, count: todayQuestionIds.size, target: 3 },
    { label: "Run one STAR story out loud", done: todayStoryDone },
    { label: "Pick up the question you stumbled on yesterday", done: !yesterdayStumble || pickedUpStumble }
  ];

  return (
    <div className="quest">
      <Washi corner="tr" color="marigold" pattern="dots" />
      <div className="between" style={{ marginBottom: 12 }}>
        <p className="h-eyebrow">Today's quest</p>
        <p className="t-small">{todayLabel()}</p>
      </div>
      <h2 className="h-section" style={{ marginBottom: 12 }}>Three things to keep the streak alive.</h2>
      {items.map((item) => (
        <div className={`quest-row ${item.done ? "done" : ""}`} key={item.label}>
          <div className="quest-check">{item.done ? "✓" : null}</div>
          <div style={{ flex: 1 }}>
            <div className="t-body label" style={{ fontWeight: 500 }}>{item.label}</div>
            {item.target ? <div className="t-mono faint" style={{ marginTop: 2 }}>{Math.min(item.count ?? 0, item.target)}/{item.target} done</div> : null}
          </div>
          {!item.done && item.target ? <Tag color="hanko">{item.target - (item.count ?? 0)} to go</Tag> : null}
        </div>
      ))}
    </div>
  );
}

export default function TodayPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [reviews, setReviews] = useState<QuestionReview[]>([]);
  const [streak, setStreak] = useState<UserStreak>({ current_streak: 0, best_streak: 0, last_practice_date: null });

  useEffect(() => {
    Promise.all([listQuestions(), listAllQuestionReviews(), getStreakSummary()]).then(([questionData, reviewData, streakData]) => {
      setQuestions(questionData as Question[]);
      setReviews(reviewData as QuestionReview[]);
      setStreak(streakData as UserStreak);
    });
  }, []);

  const recent = useMemo(
    () => [...questions].filter((question) => question.last_reviewed_at).sort((a, b) => (b.last_reviewed_at ?? "").localeCompare(a.last_reviewed_at ?? "")).slice(0, 4),
    [questions]
  );
  const needsPractice = questions.filter((question) => question.status === "needs_practice").slice(0, 3);
  const newQuestions = questions.filter((question) => (question.review_count ?? 0) === 0).slice(0, 3);
  const heat = heatmapFromReviews(reviews);

  return (
    <AppFrame streak={streak.current_streak}>
      <Topbar
        eyebrow={todayLabel()}
        title={<>Good morning, <em style={{ color: "var(--hanko)" }}>Evelyn</em>.</>}
        helper={<>You're <strong>1 practice away</strong> from keeping your streak alive. <span className="t-hand" style={{ marginLeft: 6 }}>one more!</span></>}
        actions={<Link className="button primary" href="/questions"><Pencil size={17} />Start practicing</Link>}
      />

      <div className="stack-5">
        <div className="grid-2" style={{ gridTemplateColumns: "1fr 1.1fr" }}>
          <StreakCard streak={streak} />
          <QuestList questions={questions} reviews={reviews} />
        </div>

        <Paper washi={<Washi corner="tl" color="sky" pattern="dots" />}>
          <div className="between" style={{ marginBottom: 16, flexWrap: "wrap" }}>
            <div>
              <p className="h-eyebrow" style={{ marginBottom: 6 }}>The last 12 weeks</p>
              <h2 className="h-section">Stamps you've collected</h2>
            </div>
            <div className="row-3">
              <span className="t-small faint">less</span>
              <div style={{ display: "flex", gap: 4 }}>
                {["var(--paper-soft)", "var(--hanko-soft)", "#f0a89c", "var(--hanko)"].map((color) => (
                  <span key={color} style={{ width: 14, height: 14, borderRadius: 3, background: color, border: "1px solid var(--paper-3)" }} />
                ))}
              </div>
              <span className="t-small faint">more</span>
            </div>
          </div>
          <Heatmap values={heat} />
          <p className="t-small" style={{ marginTop: 16 }}>
            <strong>{heat.filter((value) => value > 0).length}</strong> active days · best week was <strong>22 reviews</strong> · keep it up <span className="t-hand">加油!</span>
          </p>
        </Paper>

        <section className="stack-3">
          <h2 className="h-title" style={{ fontStyle: "italic", display: "inline-flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            Pick up where you left off
            <svg width="120" height="10" viewBox="0 0 90 10" fill="none"><path d="M2 7 Q 12 1 22 6 T 42 6 T 62 6 T 88 5" stroke="var(--hanko)" strokeWidth="2.2" strokeLinecap="round" /></svg>
          </h2>
          <div className="grid-2">
            {(recent.length ? recent : questions.slice(0, 4)).map((question) => <QuestionCard question={question} key={question.id} />)}
          </div>
        </section>

        <div className="grid-2">
          <section className="stack-3">
            <div className="row-3" style={{ alignItems: "baseline" }}>
              <h2 className="h-title" style={{ fontStyle: "italic", fontSize: 22 }}>Worth another try</h2>
              <Tag color="hanko">{needsPractice.length} questions</Tag>
            </div>
            <div className="stack-3">
              {needsPractice.length ? needsPractice.map((question) => <QuestionCard question={question} compact key={question.id} />) : <p className="t-body muted">Nothing flagged - nice.</p>}
            </div>
          </section>
          <section className="stack-3">
            <div className="row-3" style={{ alignItems: "baseline" }}>
              <h2 className="h-title" style={{ fontStyle: "italic", fontSize: 22 }}>Fresh in the bank</h2>
              <Tag>{newQuestions.length} new</Tag>
            </div>
            <div className="stack-3">
              {newQuestions.length ? newQuestions.map((question) => <QuestionCard question={question} compact key={question.id} />) : <p className="t-body muted">All questions are in rotation.</p>}
            </div>
          </section>
        </div>
      </div>
    </AppFrame>
  );
}
