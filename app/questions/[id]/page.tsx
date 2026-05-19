"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Archive, Copy, Edit3 } from "lucide-react";
import { AppFrame } from "@/components/AppFrame";
import { PracticeCheckIn } from "@/components/PracticeCheckIn";
import { QuestionForm } from "@/components/QuestionForm";
import { Paper, Tag, Topbar, Washi } from "@/components/Stationery";
import { StructuredQuestionView } from "@/components/StructuredQuestionView";
import { archiveQuestion, duplicateQuestion, getQuestion, getStreakSummary } from "@/lib/data";
import { typeLabel } from "@/lib/format";
import type { Question, UserStreak } from "@/lib/types";

export default function QuestionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [question, setQuestion] = useState<Question | null>(null);
  const [streak, setStreak] = useState<UserStreak>({ current_streak: 0, best_streak: 0 });
  const [editing, setEditing] = useState(false);

  async function refreshQuestion() {
    const data = await getQuestion(params.id);
    setQuestion(data);
    const streakData = await getStreakSummary();
    setStreak(streakData as UserStreak);
  }

  useEffect(() => {
    refreshQuestion();
  }, [params.id]);

  async function handleDuplicate() {
    const copy = await duplicateQuestion(params.id);
    if (copy) router.push(`/questions/${copy.id}`);
  }

  async function handleArchive() {
    await archiveQuestion(params.id);
    router.push("/questions");
  }

  if (!question) {
    return (
      <AppFrame>
        <div className="empty">Loading question...</div>
      </AppFrame>
    );
  }

  return (
    <AppFrame streak={streak.current_streak}>
      <Topbar
        eyebrow={`${question.source_id ?? "Practice"} · ${typeLabel(question.behavioral_type ?? question.technical_type)}`}
        title={question.title}
        helper={`${question.track} · ${question.category}`}
        actions={
          <>
          <button className="button" onClick={() => setEditing((value) => !value)}>
            <Edit3 size={17} />
            {editing ? "Review" : "Edit"}
          </button>
          <button className="button" onClick={handleDuplicate}>
            <Copy size={17} />
            Duplicate
          </button>
          <button className="button danger" onClick={handleArchive}>
            <Archive size={17} />
            Archive
          </button>
          </>
        }
      />

      {editing ? (
        <QuestionForm question={question} />
      ) : (
        <div className="detail-layout">
          <div className="detail-left stack-4">
            <Paper washi={<Washi corner="tl" color="sky" pattern="dots" />}>
              <div className="between" style={{ marginBottom: 12 }}>
                <span className="t-mono faint">{question.source_id ?? "IC"} · {typeLabel(question.behavioral_type ?? question.technical_type)}</span>
                <Tag>{question.difficulty}</Tag>
              </div>
              <h2 className="h-title" style={{ fontSize: 30, fontStyle: "italic" }}>{question.title}</h2>
              <p className="t-body muted" style={{ marginTop: 12 }}>{question.prompt}</p>
              {question.tags?.length ? (
                <div className="row-3" style={{ marginTop: 16, flexWrap: "wrap" }}>
                  {question.tags.map((tag) => <Tag key={tag}>#{tag}</Tag>)}
                </div>
              ) : null}
            </Paper>
            <StructuredQuestionView question={question} />
          </div>
          <div className="detail-right">
            <PracticeCheckIn question={question} streak={streak.current_streak} onChange={refreshQuestion} />
          </div>
        </div>
      )}
    </AppFrame>
  );
}
