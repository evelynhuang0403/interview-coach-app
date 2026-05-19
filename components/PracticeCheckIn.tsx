"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { addQuestionReview, listQuestionReviews } from "@/lib/data";
import { formatDateTime, statusLabel } from "@/lib/format";
import type { Question, QuestionReview, ReviewResult } from "@/lib/types";
import { fireConfetti, Owl, Paper, Stamp, Tag, Washi } from "@/components/Stationery";

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String((error as { message?: unknown }).message);
  return "Unable to check in practice.";
}

export function PracticeCheckIn({ question, streak = 0, onChange }: { question: Question; streak?: number; onChange?: () => void }) {
  const [reviews, setReviews] = useState<QuestionReview[]>([]);
  const [result, setResult] = useState<ReviewResult>("reviewed");
  const [confidence, setConfidence] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [justStamped, setJustStamped] = useState(false);
  const stampRef = useRef<HTMLDivElement | null>(null);

  async function refresh() {
    const data = await listQuestionReviews(question.id);
    setReviews(data as QuestionReview[]);
  }

  useEffect(() => {
    refresh();
  }, [question.id]);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    setSaving(true);
    setError("");
    try {
      await addQuestionReview({
        question_id: question.id,
        result,
        confidence: confidence ? Number(confidence) : null,
        note
      });
      setJustStamped(true);
      window.setTimeout(() => fireConfetti(stampRef.current), 50);
      window.setTimeout(() => setJustStamped(false), 2200);
      setNote("");
      setConfidence("");
      await refresh();
      onChange?.();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const animatedStatus = result === "confident" ? "confident" : result === "needs_practice" ? "needs_practice" : "reviewing";

  return (
    <Paper washi={<Washi corner="tr" color="coral" pattern="stripes" />}>
      <div className="between" style={{ marginBottom: 16 }}>
        <p className="h-eyebrow">Check in your practice</p>
        <Stamp status={question.status} small />
      </div>

      <div className="stamp-wrap">
        <div ref={stampRef} style={{ position: "relative" }}>
          <button className="btn-stamp" onClick={() => submit()} disabled={saving}>
            <div>{saving ? "Stamping" : "Stamp it"}</div>
            <div className="sub">for today</div>
          </button>
          {justStamped ? (
            <div className="stamp-anim" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none" }}>
              <Stamp
                status={animatedStatus}
                label={result === "confident" ? ["GOT", "IT"] : result === "needs_practice" ? ["TRY", "AGAIN"] : ["REV'D", "今日"]}
                style={{ width: 140, height: 140, fontSize: 16, borderWidth: 3, background: "#fffaee" }}
              />
            </div>
          ) : null}
        </div>
      </div>

      {justStamped ? (
        <div className="pop-in" style={{ textAlign: "center", padding: "0 0 16px" }}>
          <Owl size={42} mood="cheer" />
          <p className="t-hand" style={{ fontSize: 22, marginTop: 4 }}>nice - that's day {Math.max(streak, 1)}!</p>
        </div>
      ) : null}

      <form className="checkin-form" onSubmit={submit}>
        {error ? <div className="notice">{error}</div> : null}
        <div className="field">
          <label htmlFor="practice-result">How did it go?</label>
          <select className="select" id="practice-result" value={result} onChange={(event) => setResult(event.target.value as ReviewResult)}>
            <option value="reviewed">Reviewed it</option>
            <option value="needs_practice">Stumbled - needs practice</option>
            <option value="confident">Felt confident</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="confidence">Confidence (1-5)</label>
          <select className="select" id="confidence" value={confidence} onChange={(event) => setConfidence(event.target.value)}>
            <option value="">Not scored</option>
            <option value="1">1 - froze</option>
            <option value="2">2 - shaky</option>
            <option value="3">3 - okay</option>
            <option value="4">4 - strong</option>
            <option value="5">5 - interview ready</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="practice-note">Note (optional)</label>
          <textarea className="textarea" id="practice-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="What slipped? What to remember next time?" />
        </div>
      </form>

      <div style={{ marginTop: 24 }}>
        <div className="row-3" style={{ marginBottom: 8, alignItems: "baseline" }}>
          <p className="h-eyebrow">Past stamps</p>
          <span className="t-small faint">{reviews.length}</span>
        </div>
        {reviews.length ? (
          <div className="history-list">
            {reviews.slice(0, 4).map((review, index) => (
              <article className="history-item" key={review.id}>
                <Stamp status={review.result} small rotate={[-6, -2, 4, 6][index % 4]} />
                <div style={{ flex: 1 }}>
                  <div className="t-small" style={{ fontWeight: 600, color: "var(--ink)" }}>{formatDateTime(review.practiced_at)} · {statusLabel(review.result)}</div>
                  {review.note ? <div className="t-small" style={{ marginTop: 2 }}>{review.note}</div> : null}
                </div>
                {review.confidence ? <Tag>{review.confidence}/5</Tag> : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="t-small">No reviews yet - be the first stamp.</p>
        )}
      </div>
    </Paper>
  );
}
