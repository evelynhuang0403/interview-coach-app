"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { parseTags, tagString } from "@/lib/format";
import { saveQuestion } from "@/lib/data";
import type { BehavioralType, Difficulty, Question, QuestionGroup, QuestionInput, QuestionStatus, TechnicalType } from "@/lib/types";

const blankQuestion: QuestionInput = {
  source_id: null,
  title: "",
  prompt: "",
  answer: "",
  category: "Selenium / XPath / Locators",
  track: "Selenium / XPath",
  difficulty: "easy",
  tags: [],
  source_file: null,
  story_links: [],
  status: "new",
  notes: "",
  structured_content: null,
  question_group: "technical",
  behavioral_type: null,
  technical_type: "conceptual",
  review_count: 0,
  last_reviewed_at: null
};

export function QuestionForm({ question }: { question?: Question | null }) {
  const router = useRouter();
  const initial = question ?? blankQuestion;
  const [form, setForm] = useState<QuestionInput>({
    source_id: initial.source_id ?? null,
    title: initial.title,
    prompt: initial.prompt,
    answer: initial.answer,
    category: initial.category,
    track: initial.track,
    difficulty: initial.difficulty,
    tags: initial.tags ?? [],
    source_file: initial.source_file ?? null,
    story_links: initial.story_links ?? [],
    status: initial.status,
    notes: initial.notes ?? "",
    structured_content: initial.structured_content ?? null,
    question_group: initial.question_group ?? "technical",
    behavioral_type: initial.behavioral_type ?? null,
    technical_type: initial.technical_type ?? "conceptual",
    review_count: initial.review_count ?? 0,
    last_reviewed_at: initial.last_reviewed_at ?? null
  });
  const [tagText, setTagText] = useState(tagString(initial.tags));
  const [storyText, setStoryText] = useState(tagString(initial.story_links));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof QuestionInput>(key: K, value: QuestionInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const saved = await saveQuestion(
        {
          ...form,
          tags: parseTags(tagText),
          story_links: parseTags(storyText)
        },
        question?.id
      );
      router.push(`/questions/${saved?.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save question.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="panel" onSubmit={submit}>
      <div className="panel-header">
        <h2>{question ? "Edit question" : "Create question"}</h2>
        <button className="button primary" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
      <div className="panel-body form-grid">
        {error ? <div className="notice full">{error}</div> : null}
        <div className="field full">
          <label htmlFor="title">Title</label>
          <input className="input" id="title" value={form.title} onChange={(event) => update("title", event.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="question-group">Question group</label>
          <select
            className="select"
            id="question-group"
            value={form.question_group ?? "technical"}
            onChange={(event) => {
              const value = event.target.value as QuestionGroup;
              update("question_group", value);
              update("behavioral_type", value === "behavioral" ? "star" : null);
              update("technical_type", value === "technical" ? "conceptual" : null);
            }}
          >
            <option value="technical">Technical</option>
            <option value="behavioral">Behavioral</option>
          </select>
        </div>
        {form.question_group === "behavioral" ? (
          <div className="field">
            <label htmlFor="behavioral-type">Behavioral type</label>
            <select
              className="select"
              id="behavioral-type"
              value={form.behavioral_type ?? "star"}
              onChange={(event) => update("behavioral_type", event.target.value as BehavioralType)}
            >
              <option value="star">STAR</option>
              <option value="phone_interview">Phone interview</option>
            </select>
          </div>
        ) : (
          <div className="field">
            <label htmlFor="technical-type">Technical type</label>
            <select
              className="select"
              id="technical-type"
              value={form.technical_type ?? "conceptual"}
              onChange={(event) => update("technical_type", event.target.value as TechnicalType)}
            >
              <option value="conceptual">Conceptual</option>
              <option value="selenium_xpath">Selenium / XPath</option>
              <option value="sql">SQL</option>
              <option value="framework_design">Framework Design</option>
              <option value="test_design">Test Design</option>
              <option value="debugging">Debugging</option>
              <option value="coding">Coding</option>
            </select>
          </div>
        )}
        <div className="field">
          <label htmlFor="track">Track</label>
          <select className="select" id="track" value={form.track} onChange={(event) => update("track", event.target.value)}>
            <option>Selenium / XPath</option>
            <option>SQL</option>
            <option>Java</option>
            <option>Test Design / Framework</option>
            <option>Coding</option>
            <option>Behavioral / Story-linked</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="category">Category</label>
          <input className="input" id="category" value={form.category} onChange={(event) => update("category", event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="difficulty">Difficulty</label>
          <select
            className="select"
            id="difficulty"
            value={form.difficulty}
            onChange={(event) => update("difficulty", event.target.value as Difficulty)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="status">Status</label>
          <select
            className="select"
            id="status"
            value={form.status}
            onChange={(event) => update("status", event.target.value as QuestionStatus)}
          >
            <option value="new">New</option>
            <option value="reviewing">Reviewing</option>
            <option value="confident">Confident</option>
            <option value="needs_practice">Needs practice</option>
          </select>
        </div>
        <div className="field full">
          <label htmlFor="prompt">Prompt</label>
          <textarea className="textarea" id="prompt" value={form.prompt} onChange={(event) => update("prompt", event.target.value)} required />
        </div>
        <div className="field full">
          <label htmlFor="answer">Answer</label>
          <textarea className="textarea" id="answer" value={form.answer} onChange={(event) => update("answer", event.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="tags">Tags</label>
          <input className="input" id="tags" value={tagText} onChange={(event) => setTagText(event.target.value)} placeholder="xpath, selenium" />
        </div>
        <div className="field">
          <label htmlFor="stories">Story links</label>
          <input className="input" id="stories" value={storyText} onChange={(event) => setStoryText(event.target.value)} placeholder="S002, S007" />
        </div>
        <div className="field full">
          <label htmlFor="notes">Notes</label>
          <textarea className="textarea" id="notes" value={form.notes ?? ""} onChange={(event) => update("notes", event.target.value)} />
        </div>
      </div>
    </form>
  );
}
