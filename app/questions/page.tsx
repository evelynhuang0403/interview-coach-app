"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { AppFrame } from "@/components/AppFrame";
import { Paper, QuestionCard, Tag, Topbar } from "@/components/Stationery";
import { getStreakSummary, listQuestions } from "@/lib/data";
import type { Question, UserStreak } from "@/lib/types";

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [streak, setStreak] = useState<UserStreak>({ current_streak: 0, best_streak: 0 });
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    Promise.all([listQuestions(), getStreakSummary()]).then(([questionData, streakData]) => {
      setQuestions(questionData as Question[]);
      setStreak(streakData as UserStreak);
    });
  }, []);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return questions.filter((question) => {
      const subtype = question.behavioral_type ?? question.technical_type ?? "";
      const matchesSearch = [question.title, question.prompt, question.answer, question.category, question.track, subtype, ...(question.tags ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(query);
      return matchesSearch && (group === "all" || question.question_group === group) && (status === "all" || question.status === status);
    });
  }, [group, questions, search, status]);

  const sections = useMemo(() => {
    const buckets = new Map<string, Question[]>();
    for (const question of filtered) {
      const key = question.track || "General";
      buckets.set(key, [...(buckets.get(key) ?? []), question]);
    }
    return Array.from(buckets.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <AppFrame streak={streak.current_streak}>
      <Topbar
        eyebrow="The question bank"
        title="Your binder."
        helper="Every question you've added - sorted into sections, ready to stamp."
        actions={<Link className="button primary" href="/questions/new"><Plus size={17} />Add question</Link>}
      />

      <Paper style={{ padding: 16, marginBottom: 24 }}>
        <div className="question-filters">
          <div style={{ position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: 12, top: 11, color: "var(--ink-faint)" }} />
            <input className="input" placeholder="Search questions, tags, tracks..." value={search} onChange={(event) => setSearch(event.target.value)} style={{ paddingLeft: 40 }} />
          </div>
          <select className="select" value={group} onChange={(event) => setGroup(event.target.value)}>
            <option value="all">All types</option>
            <option value="technical">Technical</option>
            <option value="behavioral">Stories</option>
          </select>
          <select className="select" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Any stamp</option>
            <option value="new">New</option>
            <option value="reviewing">Reviewing</option>
            <option value="needs_practice">Needs practice</option>
            <option value="confident">Got it</option>
          </select>
        </div>
      </Paper>

      <div className="stack-5">
        {sections.map(([track, items], index) => {
          const colors = ["coral", "sky", "marigold", "forest"];
          const patterns = ["stripes", "dots", "checker", "stripes"];
          return (
            <section className="question-section" key={track}>
              <div className="row-4" style={{ marginBottom: 4, alignItems: "center", gap: 12, flexWrap: "nowrap" }}>
                <span className={`section-tape ${colors[index % colors.length]} ${patterns[index % patterns.length]}`} />
                <h2 className="h-title" style={{ fontStyle: "italic", whiteSpace: "nowrap" }}>{track}</h2>
                <Tag>{items.length} {items.length === 1 ? "question" : "questions"}</Tag>
              </div>
              <div className="grid-2">
                {items.map((question) => <QuestionCard question={question} key={question.id} />)}
              </div>
            </section>
          );
        })}
        {!sections.length ? (
          <Paper>
            <p className="t-body muted" style={{ textAlign: "center", padding: 24 }}>No questions match the current filters.</p>
          </Paper>
        ) : null}
      </div>
    </AppFrame>
  );
}
