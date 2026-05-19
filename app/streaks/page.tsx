"use client";

import { useEffect, useMemo, useState } from "react";
import { AppFrame } from "@/components/AppFrame";
import { Heatmap, Paper, Stamp, StreakCard, Tag, Topbar, Washi, heatmapFromReviews } from "@/components/Stationery";
import { getStreakSummary, listAllQuestionReviews, listQuestions } from "@/lib/data";
import { formatDateTime, statusLabel } from "@/lib/format";
import type { Question, QuestionReview, UserStreak } from "@/lib/types";

export default function StreaksPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [reviews, setReviews] = useState<QuestionReview[]>([]);
  const [streak, setStreak] = useState<UserStreak>({ current_streak: 0, best_streak: 0 });

  useEffect(() => {
    Promise.all([listQuestions(), listAllQuestionReviews(), getStreakSummary()]).then(([questionData, reviewData, streakData]) => {
      setQuestions(questionData as Question[]);
      setReviews(reviewData as QuestionReview[]);
      setStreak(streakData as UserStreak);
    });
  }, []);

  const heat = useMemo(() => heatmapFromReviews(reviews), [reviews]);
  const weekReviews = reviews.filter((review) => {
    const date = new Date(review.practiced_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo;
  }).length;
  const weekTarget = 21;
  const milestones = [
    { day: 3, label: "Hatched", hint: "3 days in a row" },
    { day: 7, label: "Weekly", hint: "7 days in a row" },
    { day: 14, label: "Two weeks", hint: "14 days in a row" },
    { day: 30, label: "Monthly stamp", hint: "30 days in a row" },
    { day: 60, label: "Stamp master", hint: "60 days in a row" }
  ];

  return (
    <AppFrame streak={streak.current_streak}>
      <Topbar
        eyebrow="The streak room"
        title="Stamps tell a story."
        helper="Every day you check in, the page gets a new mark. Keep coming back."
      />

      <div className="stack-5">
        <div className="grid-2">
          <StreakCard streak={streak} />
          <Paper washi={<Washi corner="tr" color="forest" pattern="stripes" />}>
            <p className="h-eyebrow" style={{ marginBottom: 8 }}>This week</p>
            <div className="row-4">
              <div className="number" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 700, fontSize: 56, color: "var(--forest)", lineHeight: 1 }}>
                {weekReviews}
              </div>
              <span className="t-body muted">of {weekTarget} reviews</span>
            </div>
            <div style={{ height: 10, background: "var(--paper-soft)", border: "1px solid var(--paper-3)", borderRadius: 999, marginTop: 16, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, (weekReviews / weekTarget) * 100)}%`, background: "var(--forest)", borderRadius: 999 }} />
            </div>
            <p className="t-small" style={{ marginTop: 12 }}>
              {Math.max(0, weekTarget - weekReviews)} more to finish the week. <span className="t-hand">go go go</span>
            </p>
          </Paper>
        </div>

        <Paper>
          <div className="between" style={{ marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <h2 className="h-title" style={{ fontStyle: "italic", whiteSpace: "nowrap" }}>The last 12 weeks</h2>
            <Tag>{heat.filter((value) => value > 0).length} active days</Tag>
          </div>
          <Heatmap values={heat} />
        </Paper>

        <section>
          <h2 className="h-title" style={{ fontStyle: "italic", marginBottom: 16 }}>Milestones</h2>
          <div className="grid-3">
            {milestones.map((milestone) => {
              const reached = streak.current_streak >= milestone.day;
              return (
                <Paper key={milestone.day} style={{ textAlign: "center", padding: 24, opacity: reached ? 1 : 0.55 }} tint={reached ? undefined : 2}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                    <Stamp status={reached ? "confident" : "new"} label={[String(milestone.day), "DAYS"]} style={{ width: 72, height: 72, fontSize: 12, borderWidth: 2.5 }} />
                  </div>
                  <p className="h-section" style={{ fontStyle: "italic" }}>{milestone.label}</p>
                  <p className="t-small" style={{ marginTop: 4 }}>{milestone.hint}</p>
                  {reached ? <p className="t-hand" style={{ marginTop: 8 }}>collected!</p> : <p className="t-mono faint" style={{ fontSize: 10, marginTop: 8, letterSpacing: "0.16em" }}>{milestone.day - streak.current_streak} TO GO</p>}
                </Paper>
              );
            })}
          </div>
        </section>

        <Paper>
          <h2 className="h-title" style={{ fontStyle: "italic", marginBottom: 16 }}>Recent stamps</h2>
          <div className="history-list">
            {reviews.slice(0, 6).map((review, index) => {
              const question = questions.find((item) => item.id === review.question_id);
              return (
                <article className="history-item" key={review.id}>
                  <Stamp status={review.result} small rotate={[-6, -3, 2, 6][index % 4]} />
                  <div style={{ flex: 1 }}>
                    <div className="t-body" style={{ fontWeight: 600 }}>{question?.title ?? "Practice review"}</div>
                    <div className="t-small">{formatDateTime(review.practiced_at)} · {statusLabel(review.result)}</div>
                  </div>
                  {review.confidence ? <Tag>{review.confidence}/5</Tag> : null}
                </article>
              );
            })}
          </div>
        </Paper>
      </div>
    </AppFrame>
  );
}
