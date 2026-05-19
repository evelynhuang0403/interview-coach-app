"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppFrame } from "@/components/AppFrame";
import { listAllQuestionReviews, listQuestions } from "@/lib/data";
import { formatDateTime, groupLabel, statusLabel, typeLabel } from "@/lib/format";
import type { Question, QuestionReview } from "@/lib/types";

type ProgressRow = {
  question: Question;
  reviews: QuestionReview[];
  lastReview: QuestionReview | null;
  lastConfidence: number | null;
  averageConfidence: number | null;
};

const staleMs = 7 * 24 * 60 * 60 * 1000;

function average(values: number[]) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatNumber(value: number | null) {
  return value === null ? "—" : value.toFixed(1);
}

function subtypeValue(question: Question) {
  return question.behavioral_type ?? question.technical_type ?? "";
}

function isStale(question: Question) {
  if (!question.last_reviewed_at || (question.review_count ?? 0) === 0) return false;
  return Date.now() - new Date(question.last_reviewed_at).getTime() > staleMs;
}

function buildRows(questions: Question[], reviews: QuestionReview[]): ProgressRow[] {
  const byQuestion = new Map<string, QuestionReview[]>();
  for (const review of reviews) {
    byQuestion.set(review.question_id, [...(byQuestion.get(review.question_id) ?? []), review]);
  }
  return questions.map((question) => {
    const questionReviews = byQuestion.get(question.id) ?? [];
    const confidenceValues = questionReviews
      .map((review) => review.confidence)
      .filter((value): value is number => typeof value === "number");
    return {
      question,
      reviews: questionReviews,
      lastReview: questionReviews[0] ?? null,
      lastConfidence: questionReviews.find((review) => typeof review.confidence === "number")?.confidence ?? null,
      averageConfidence: average(confidenceValues)
    };
  });
}

function countBy<T extends string>(items: ProgressRow[], getKey: (row: ProgressRow) => T) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = getKey(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b));
}

export default function ProgressPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [reviews, setReviews] = useState<QuestionReview[]>([]);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");
  const [subtype, setSubtype] = useState("all");
  const [status, setStatus] = useState("all");
  const [reviewState, setReviewState] = useState("all");

  useEffect(() => {
    Promise.all([listQuestions(), listAllQuestionReviews()]).then(([questionData, reviewData]) => {
      setQuestions(questionData as Question[]);
      setReviews(reviewData as QuestionReview[]);
    });
  }, []);

  const rows = useMemo(() => buildRows(questions, reviews), [questions, reviews]);

  const filteredRows = useMemo(() => {
    const query = search.toLowerCase();
    return rows
      .filter((row) => {
        const question = row.question;
        const latestConfidence = row.lastConfidence;
        const matchesSearch = [question.title, question.category, question.track, ...(question.tags ?? [])]
          .join(" ")
          .toLowerCase()
          .includes(query);
        const matchesReviewState =
          reviewState === "all" ||
          (reviewState === "never" && row.reviews.length === 0) ||
          (reviewState === "reviewed" && row.reviews.length > 0) ||
          (reviewState === "low_confidence" && latestConfidence !== null && latestConfidence <= 2) ||
          (reviewState === "needs_practice" && question.status === "needs_practice") ||
          (reviewState === "stale" && isStale(question));

        return (
          matchesSearch &&
          (group === "all" || question.question_group === group) &&
          (subtype === "all" || subtypeValue(question) === subtype) &&
          (status === "all" || question.status === status) &&
          matchesReviewState
        );
      })
      .sort((a, b) => {
        const aNever = a.reviews.length === 0 ? 0 : 1;
        const bNever = b.reviews.length === 0 ? 0 : 1;
        if (aNever !== bNever) return aNever - bNever;
        const aNeeds = a.question.status === "needs_practice" ? 0 : 1;
        const bNeeds = b.question.status === "needs_practice" ? 0 : 1;
        if (aNeeds !== bNeeds) return aNeeds - bNeeds;
        return (a.question.last_reviewed_at ?? "").localeCompare(b.question.last_reviewed_at ?? "");
      });
  }, [group, reviewState, rows, search, status, subtype]);

  const confidenceValues = reviews.map((review) => review.confidence).filter((value): value is number => typeof value === "number");
  const avgConfidence = average(confidenceValues);
  const lastReviewedRow = rows
    .filter((row) => row.lastReview)
    .sort((a, b) => (b.lastReview?.practiced_at ?? "").localeCompare(a.lastReview?.practiced_at ?? ""))[0];
  const neverReviewed = rows.filter((row) => row.reviews.length === 0);
  const lowConfidence = rows.filter((row) => row.lastConfidence !== null && row.lastConfidence <= 2);
  const highConfidence = rows.filter((row) => row.lastConfidence !== null && row.lastConfidence >= 4);
  const staleReviewed = rows.filter((row) => isStale(row.question));
  const needsPractice = rows.filter((row) => row.question.status === "needs_practice");

  return (
    <AppFrame>
      <div className="topbar">
        <div>
          <h1>Progress</h1>
          <p>Review coverage, confidence trends, and question-level practice history.</p>
        </div>
      </div>

      <div className="grid">
        <section className="stats-grid progress-stats">
          <div className="stat">
            <span>Total questions</span>
            <strong>{questions.length}</strong>
          </div>
          <div className="stat">
            <span>Total reviews</span>
            <strong>{reviews.length}</strong>
          </div>
          <div className="stat">
            <span>Never reviewed</span>
            <strong>{neverReviewed.length}</strong>
          </div>
          <div className="stat">
            <span>Needs practice</span>
            <strong>{needsPractice.length}</strong>
          </div>
          <div className="stat">
            <span>Avg confidence</span>
            <strong>{formatNumber(avgConfidence)}</strong>
          </div>
          <div className="stat wide-stat">
            <span>Last reviewed</span>
            <strong>{lastReviewedRow ? formatDateTime(lastReviewedRow.lastReview?.practiced_at) : "Never"}</strong>
            {lastReviewedRow ? <p>{lastReviewedRow.question.title}</p> : null}
          </div>
        </section>

        <div className="content-grid">
          <Breakdown title="By Question Group" items={countBy(rows, (row) => groupLabel(row.question.question_group))} />
          <Breakdown title="By Type" items={countBy(rows, (row) => typeLabel(subtypeValue(row.question)))} />
          <Breakdown title="By Status" items={countBy(rows, (row) => statusLabel(row.question.status))} />
          <section className="panel">
            <div className="panel-header">
              <h2>Practice Quality</h2>
            </div>
            <div className="panel-body insight-grid">
              <Insight label="Low confidence" value={lowConfidence.length} />
              <Insight label="High confidence" value={highConfidence.length} />
              <Insight label="Stale reviewed" value={staleReviewed.length} />
              <Insight label="Never reviewed" value={neverReviewed.length} />
            </div>
          </section>
        </div>

        <section className="panel">
          <div className="panel-header">
            <h2>Question Progress</h2>
            <span className="pill">{filteredRows.length} rows</span>
          </div>
          <div className="panel-body">
            <div className="filters progress-filters">
              <input className="input" placeholder="Search questions..." value={search} onChange={(event) => setSearch(event.target.value)} />
              <select
                className="select"
                value={group}
                onChange={(event) => {
                  setGroup(event.target.value);
                  setSubtype("all");
                }}
              >
                <option value="all">All groups</option>
                <option value="behavioral">Behavioral</option>
                <option value="technical">Technical</option>
              </select>
              <select className="select" value={subtype} onChange={(event) => setSubtype(event.target.value)}>
                <option value="all">All types</option>
                {(group === "all" || group === "behavioral") && (
                  <>
                    <option value="star">STAR</option>
                    <option value="phone_interview">Phone Interview</option>
                  </>
                )}
                {(group === "all" || group === "technical") && (
                  <>
                    <option value="conceptual">Conceptual</option>
                    <option value="selenium_xpath">Selenium / XPath</option>
                    <option value="sql">SQL</option>
                    <option value="framework_design">Framework Design</option>
                    <option value="test_design">Test Design</option>
                    <option value="debugging">Debugging</option>
                    <option value="coding">Coding</option>
                  </>
                )}
              </select>
              <select className="select" value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="all">All status</option>
                <option value="new">New</option>
                <option value="reviewing">Reviewing</option>
                <option value="needs_practice">Needs practice</option>
                <option value="confident">Confident</option>
              </select>
              <select className="select" value={reviewState} onChange={(event) => setReviewState(event.target.value)}>
                <option value="all">All review states</option>
                <option value="never">Never reviewed</option>
                <option value="reviewed">Reviewed</option>
                <option value="low_confidence">Low confidence</option>
                <option value="needs_practice">Needs practice</option>
                <option value="stale">Stale reviewed</option>
              </select>
            </div>
            <ProgressTable rows={filteredRows} />
          </div>
        </section>
      </div>
    </AppFrame>
  );
}

function Breakdown({ title, items }: { title: string; items: [string, number][] }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>{title}</h2>
      </div>
      <div className="panel-body mini-breakdown">
        {items.length ? (
          items.map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))
        ) : (
          <div className="empty">No data yet.</div>
        )}
      </div>
    </section>
  );
}

function Insight({ label, value }: { label: string; value: number }) {
  return (
    <div className="insight-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProgressTable({ rows }: { rows: ProgressRow[] }) {
  if (!rows.length) {
    return <div className="empty">No questions match the current filters.</div>;
  }

  return (
    <div className="table-wrap">
      <table className="data-table progress-table">
        <thead>
          <tr>
            <th>Question</th>
            <th>Type</th>
            <th>Status</th>
            <th>Total</th>
            <th>Last reviewed</th>
            <th>Last result</th>
            <th>Last confidence</th>
            <th>Avg confidence</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.question.id}>
              <td>
                <Link href={`/questions/${row.question.id}`}>
                  <strong>{row.question.title}</strong>
                </Link>
              </td>
              <td>
                {groupLabel(row.question.question_group)}
                <br />
                <span className="muted">{typeLabel(subtypeValue(row.question))}</span>
              </td>
              <td>
                <span className={`pill ${row.question.status}`}>{statusLabel(row.question.status)}</span>
              </td>
              <td>{row.reviews.length}</td>
              <td>{formatDateTime(row.lastReview?.practiced_at ?? row.question.last_reviewed_at)}</td>
              <td>{row.lastReview ? statusLabel(row.lastReview.result) : "—"}</td>
              <td>{row.lastConfidence ?? "—"}</td>
              <td>{formatNumber(row.averageConfidence)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
