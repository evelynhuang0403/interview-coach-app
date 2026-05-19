"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import {
  Archive,
  BookOpen,
  Calendar,
  Check,
  Eye,
  EyeOff,
  Flame,
  Home,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Star
} from "lucide-react";
import { formatDateTime, typeLabel } from "@/lib/format";
import type { Question, QuestionStatus, ReviewResult } from "@/lib/types";

export type StreakSummary = {
  current_streak: number;
  best_streak: number;
  last_practice_date?: string | null;
};

export const navIcon = {
  today: Home,
  questions: BookOpen,
  streaks: Flame,
  progress: Calendar,
  plus: Plus,
  search: Search,
  pencil: Pencil,
  archive: Archive,
  check: Check,
  eye: Eye,
  eyeoff: EyeOff,
  star: Star,
  sparkle: Sparkles
};

export function Owl({ size = 48, mood = "neutral" }: { size?: number; mood?: "neutral" | "happy" | "cheer" }) {
  return (
    <svg
      width={size}
      height={size * (62 / 48)}
      viewBox="0 0 48 62"
      fill="none"
      stroke="#2a241c"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M24 6c-8 0-14 6-14 14v18c0 9 6 16 14 16s14-7 14-16V20c0-8-6-14-14-14z" fill="#fffaee" />
      <path d="M14 8c1 3 2 5 4 6" />
      <path d="M34 8c-1 3-2 5-4 6" />
      <circle cx="18" cy="22" r="4.5" fill="#fffaee" />
      <circle cx="30" cy="22" r="4.5" fill="#fffaee" />
      {mood === "neutral" ? (
        <>
          <circle cx="18" cy="22" r="1.4" fill="#2a241c" stroke="none" />
          <circle cx="30" cy="22" r="1.4" fill="#2a241c" stroke="none" />
        </>
      ) : (
        <>
          <path d="M15.5 22.5c1-1 4-1 5 0" />
          <path d="M27.5 22.5c1-1 4-1 5 0" />
        </>
      )}
      <path d="M22 27l2 3 2-3" fill="#c98b1c" stroke="#a87114" />
      <path d="M14 30c2 6 2 12 1 18" />
      <path d="M34 30c-2 6-2 12-1 18" />
      <path d="M21 38c1 1.5 5 1.5 6 0" />
      <path d="M19 53l-1 4M21 53l0 4M23 53l1 4" />
      <path d="M25 53l-1 4M27 53l0 4M29 53l1 4" />
      {mood === "cheer" ? (
        <>
          <path d="M4 8l3 3M44 8l-3 3M6 18l4 0M42 18l-4 0" stroke="#c8443c" />
        </>
      ) : null}
    </svg>
  );
}

export function Paper({
  children,
  className = "",
  tint,
  washi,
  rotate,
  style
}: {
  children: ReactNode;
  className?: string;
  tint?: boolean | 2;
  washi?: ReactNode;
  rotate?: "l1" | "l2" | "r1" | "r2";
  style?: CSSProperties;
}) {
  const tintClass = tint ? `tinted${tint === 2 ? "-2" : ""}` : "";
  const rotateClass = rotate ? `rot-${rotate}` : "";
  return (
    <section className={`paper ${tintClass} ${rotateClass} ${className}`} style={style}>
      {washi}
      {children}
    </section>
  );
}

export function Washi({ corner = "tl", color = "coral", pattern = "stripes", style }: { corner?: "tl" | "tr" | "bl" | "br"; color?: string; pattern?: string; style?: CSSProperties }) {
  return <div className={`washi ${corner} ${color} ${pattern}`} style={style} />;
}

const stampText: Record<string, string[]> = {
  confident: ["GOT", "IT"],
  needs_practice: ["TRY", "AGAIN"],
  reviewing: ["IN", "REVIEW"],
  new: ["NEW"],
  reviewed: ["REV'D"]
};

export function Stamp({
  status,
  small,
  animate,
  label,
  rotate,
  style
}: {
  status?: QuestionStatus | ReviewResult | string | null;
  small?: boolean;
  animate?: boolean;
  label?: string[];
  rotate?: number;
  style?: CSSProperties;
}) {
  const key = status || "new";
  const text = label ?? stampText[key] ?? ["NEW"];
  const inline = rotate == null ? style : { ...style, transform: `rotate(${rotate}deg)` };
  return (
    <span className={`stamp ${key.replace(/_/g, "-")} ${small ? "small" : ""} ${animate ? "stamp-anim" : ""}`} style={inline}>
      {text.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </span>
  );
}

export function Tag({ children, color = "" }: { children: ReactNode; color?: string }) {
  return <span className={`tag ${color}`}>{children}</span>;
}

export function Topbar({ eyebrow, title, helper, actions }: { eyebrow?: ReactNode; title: ReactNode; helper?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="between topbar" style={{ alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
      <div>
        {eyebrow ? <p className="h-eyebrow" style={{ marginBottom: 8 }}>{eyebrow}</p> : null}
        <h1 className="h-display">{title}</h1>
        {helper ? <p className="t-body muted" style={{ maxWidth: 560 }}>{helper}</p> : null}
      </div>
      {actions ? <div className="actions">{actions}</div> : null}
    </div>
  );
}

export function FlameSVG({ size = 96 }: { size?: number }) {
  return (
    <svg viewBox="0 0 96 96" width={size} height={size} className="flame" aria-hidden="true">
      <defs>
        <linearGradient id="flameGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#c8443c" />
          <stop offset="55%" stopColor="#e87d3a" />
          <stop offset="100%" stopColor="#f6c75a" />
        </linearGradient>
        <linearGradient id="innerFlame" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#ffd966" />
          <stop offset="100%" stopColor="#fff4cc" />
        </linearGradient>
      </defs>
      <path fill="url(#flameGrad)" stroke="#a73329" strokeWidth="2" d="M48 90c18 0 30-12 30-30 0-12-6-22-15-28 1 8-3 13-7 13-6 0-7-5-5-15 2-12-7-21-15-25C32 12 31 18 27 22c-3 4-11 11-11 25 0 20 14 43 32 43z" />
      <path fill="url(#innerFlame)" opacity="0.92" d="M48 78c10 0 17-7 17-17 0-6-3-12-8-15 0 5-3 7-5 7-3 0-3-3-2-8 1-6-4-11-8-13-2 4-2 7-5 9-2 3-6 6-6 14 0 11 7 23 17 23z" />
    </svg>
  );
}

export function StreakCard({ streak }: { streak: StreakSummary }) {
  const current = streak.current_streak ?? 0;
  const best = streak.best_streak ?? current;
  return (
    <div className="streak-card">
      <FlameSVG />
      <div className="stack-2">
        <p className="h-eyebrow">Current streak</p>
        <div className="number">
          {current}<span className="unit">days in a row</span>
        </div>
        <p className="t-body" style={{ color: "var(--ink-soft)" }}>
          Personal best: <strong style={{ color: "var(--ink)" }}>{best} days</strong>. <span className="t-hand" style={{ fontSize: 20 }}>nice streak!</span>
        </p>
      </div>
    </div>
  );
}

export function Heatmap({ values }: { values: number[] }) {
  return (
    <div className="heatmap">
      {values.map((value, index) => (
        <div className={`heat l${Math.min(value, 3)} ${index === values.length - 1 ? "today" : ""}`} title={`${value} reviews`} key={`${index}-${value}`} />
      ))}
    </div>
  );
}

export function QuestionCard({ question, compact = false }: { question: Question; compact?: boolean }) {
  return (
    <Link className="indexcard" href={`/questions/${question.id}`}>
      <div className="between">
        <span className="t-mono faint" style={{ fontSize: 11 }}>
          {question.source_id ?? "IC"} · {typeLabel(question.behavioral_type ?? question.technical_type)}
        </span>
        <Stamp status={question.status} small />
      </div>
      <h3 className="h-section">{question.title}</h3>
      {!compact ? (
        <p className="t-small" style={{ marginTop: "auto" }}>
          {question.review_count ?? 0} reviews · last {formatDateTime(question.last_reviewed_at)}
        </p>
      ) : null}
    </Link>
  );
}

export function fireConfetti(originEl: HTMLElement | null) {
  if (!originEl || typeof document === "undefined") return;
  const rect = originEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const colors = ["#c8443c", "#2e6049", "#3d4f80", "#c98b1c", "#d77a6a", "#9bbac9"];
  for (let i = 0; i < 36; i += 1) {
    const el = document.createElement("span");
    el.className = "confetti-piece";
    const angle = (Math.PI * 2 * i) / 36 + Math.random() * 0.4;
    const dist = 180 + Math.random() * 160;
    el.style.left = `${cx}px`;
    el.style.top = `${cy}px`;
    el.style.background = colors[i % colors.length];
    el.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    el.style.setProperty("--dy", `${Math.sin(angle) * dist + 60}px`);
    el.style.setProperty("--rot", `${360 + Math.random() * 540}deg`);
    el.style.animationDuration = `${1200 + Math.random() * 600}ms`;
    document.body.appendChild(el);
    window.setTimeout(() => el.remove(), 2000);
  }
}

export function todayLabel() {
  return new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date());
}

export function heatmapFromReviews(reviews: { practiced_at: string }[], days = 84) {
  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const counts = new Map<string, number>();
  for (const review of reviews) {
    const key = review.practiced_at.slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return counts.get(date.toISOString().slice(0, 10)) ?? 0;
  });
}
