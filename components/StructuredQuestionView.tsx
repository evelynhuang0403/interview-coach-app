"use client";

import { useState } from "react";
import type { MarkdownTable, Question, StructuredContent, StructuredSection } from "@/lib/types";
import { statusLabel } from "@/lib/format";

function cleanMarkup(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^>\s?/gm, "")
    .trim();
}

function MarkdownText({ text }: { text: string }) {
  const blocks = cleanMarkup(text)
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="rich-text">
      {blocks.map((block, index) => {
        const lines = block.split(/\n/).filter(Boolean);
        if (lines.every((line) => line.trim().startsWith("- "))) {
          return (
            <ul key={index}>
              {lines.map((line) => (
                <li key={line}>{line.replace(/^\s*-\s+/, "")}</li>
              ))}
            </ul>
          );
        }
        if (block.trim().startsWith("|")) return null;
        return <p key={index}>{block}</p>;
      })}
    </div>
  );
}

function DataTable({ table }: { table: MarkdownTable }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {table.headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MaskedBlock({ title = "answer", children }: { title?: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(true);
  return (
    <div className={visible ? "masked-block" : "masked-block masked"}>
      <div className="mask-toolbar">
        <span>{visible ? "Answer visible" : "Answer hidden"}</span>
        <button className="button" onClick={() => setVisible((value) => !value)}>
          {visible ? `Hide ${title}` : `Show ${title}`}
        </button>
      </div>
      {visible ? <div>{children}</div> : <div className="masked-placeholder">Answer is hidden for active recall.</div>}
    </div>
  );
}

function SectionDisclosure({ section }: { section: StructuredSection }) {
  return (
    <details className="disclosure">
      <summary>{section.title}</summary>
      <div className="disclosure-body">
        <MaskedBlock title="answer">
          <MarkdownText text={section.body} />
        </MaskedBlock>
      </div>
    </details>
  );
}

function SourceToggle({ source }: { source?: string }) {
  if (!source) return null;
  return (
    <details className="source-toggle">
      <summary>View source</summary>
      <pre>{source}</pre>
    </details>
  );
}

function ConceptQuestionView({ question, content }: { question: Question; content: StructuredContent }) {
  const mainTable = content.tables?.[0];

  return (
    <div className="structured-grid">
      <section className="panel hero-panel">
        <div className="panel-header">
          <h2>Question</h2>
          <span className={`pill ${question.status}`}>{statusLabel(question.status)}</span>
        </div>
        <div className="panel-body">
          <p className="review-prompt">{question.prompt}</p>
        </div>
      </section>

      {content.shortAnswer ? (
        <section className="panel accent-panel">
          <div className="panel-header">
            <h2>Short Answer</h2>
          </div>
          <div className="panel-body">
            <MaskedBlock title="short answer">
              <MarkdownText text={content.shortAnswer} />
            </MaskedBlock>
          </div>
        </section>
      ) : null}

      {mainTable ? (
        <section className="panel full-span">
          <div className="panel-header">
            <h2>Common Patterns</h2>
          </div>
          <div className="panel-body">
            <MaskedBlock title="table">
              <DataTable table={mainTable} />
            </MaskedBlock>
          </div>
        </section>
      ) : null}

      {content.bestPractices?.length ? (
        <section className="panel">
          <div className="panel-header">
            <h2>Best Practices</h2>
          </div>
          <div className="panel-body">
            <MaskedBlock title="best practices">
              <ul className="check-list">
                {content.bestPractices.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </MaskedBlock>
          </div>
        </section>
      ) : null}

      <section className="panel">
        <div className="panel-header">
          <h2>Interview Tip</h2>
        </div>
        <div className="panel-body">
          <MaskedBlock title="interview tip">
            {content.interviewTip ? <div className="coach-note">{content.interviewTip}</div> : <p>No interview tip yet.</p>}
          </MaskedBlock>
          {content.connectsTo?.length ? (
            <div className="section-spacer">
              <strong>Connects to</strong>
              <div className="meta" style={{ marginTop: 8 }}>
                {content.connectsTo.map((story) => (
                  <span className="pill" key={story}>
                    {story}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function StoryQuestionView({ question, content }: { question: Question; content: StructuredContent }) {
  const [showSource, setShowSource] = useState(false);
  const metadata = content.metadata ?? {};
  const spokenVersions =
    content.spokenVersions?.length
      ? content.spokenVersions
      : content.storyCore
        ? [{ ...content.storyCore, variant: "core" as const }]
        : [];
  const visibleMetadata = ["ID", "Primary Skill", "Secondary Skill", "Domain", "Strength", "Created", "Last updated"]
    .map((key) => [key, metadata[key]])
    .filter(([, value]) => value);

  return (
    <div className="structured-grid">
      <section className="panel hero-panel">
        <div className="panel-header">
          <h2>Story Practice</h2>
          <span className={`pill ${question.status}`}>{statusLabel(question.status)}</span>
        </div>
        <div className="panel-body">
          <p className="review-prompt">{question.title}</p>
          <div className="metadata-grid">
            {visibleMetadata.map(([key, value]) => (
              <div className="metadata-item" key={key}>
                <span>{key}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      {spokenVersions.length ? (
        <section className="panel accent-panel full-span">
          <div className="panel-header">
            <h2>Spoken Versions</h2>
          </div>
          <div className="panel-body spoken-version-grid">
            {spokenVersions.map((version) => (
              <article className={`spoken-version-card ${version.variant === "extended" ? "extended" : ""}`} key={version.title}>
                <div className="spoken-version-header">
                  <h3>{version.title}</h3>
                  <span className="pill">{version.variant ?? "version"}</span>
                </div>
                <MaskedBlock title={version.variant === "extended" ? "extended version" : "spoken version"}>
                  <div className="spoken-card">
                    <MarkdownText text={version.quote || version.body} />
                  </div>
                </MaskedBlock>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {content.addOns?.length ? (
        <section className="panel">
          <div className="panel-header">
            <h2>Add-ons / Closings</h2>
          </div>
          <div className="panel-body disclosure-list">
            {content.addOns.map((section) => (
              <SectionDisclosure section={section} key={section.title} />
            ))}
          </div>
        </section>
      ) : null}

      {content.interviewQuestions?.length ? (
        <section className="panel">
          <div className="panel-header">
            <h2>Question Mapping</h2>
          </div>
          <div className="panel-body">
            <div className="qa-grid">
              {content.interviewQuestions.map((item) => {
                const mapped = typeof item === "string" ? { question: item } : item;
                return (
                  <article className="qa-card" key={mapped.question}>
                    <h3>{mapped.question}</h3>
                    {mapped.lead ? (
                      <p>
                        <strong>Lead:</strong> {mapped.lead}
                      </p>
                    ) : null}
                    {mapped.emphasize ? (
                      <p>
                        <strong>Emphasize:</strong> {mapped.emphasize}
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {content.challengeQuestions?.length ? (
        <section className="panel">
          <div className="panel-header">
            <h2>Resume Bullet Challenges</h2>
          </div>
          <div className="panel-body qa-grid">
            {content.challengeQuestions.map((item) => (
              <article className="qa-card" key={item.question}>
                <h3>{item.question}</h3>
                <MaskedBlock title="answer">
                  <MarkdownText text={item.answer} />
                </MaskedBlock>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {content.followUps?.length ? (
        <section className="panel full-span">
          <div className="panel-header">
            <h2>Follow-up Q&A</h2>
          </div>
          <div className="panel-body qa-grid">
            {content.followUps.map((item) => (
              <article className="qa-card" key={item.question}>
                <h3>{item.question}</h3>
                <MaskedBlock title="answer">
                  <MarkdownText text={item.answer} />
                </MaskedBlock>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {content.deliveryTips?.length || content.decisions?.length ? (
        <section className="panel full-span">
          <div className="panel-header">
            <h2>Review Notes</h2>
          </div>
          <div className="panel-body form-grid">
            {content.deliveryTips?.length ? (
              <div>
                <h3 className="small-heading">Delivery Tips</h3>
                <MaskedBlock title="delivery tips">
                  <ul className="check-list">
                    {content.deliveryTips.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </MaskedBlock>
              </div>
            ) : null}
            {content.decisions?.length ? (
              <div>
                <h3 className="small-heading">Things To Decide</h3>
                <MaskedBlock title="notes">
                  <ul className="check-list">
                    {content.decisions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </MaskedBlock>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="panel full-span">
        <div className="panel-header">
          <h2>Source</h2>
          <button className="button" onClick={() => setShowSource((value) => !value)}>
            {showSource ? "Hide source" : "View source"}
          </button>
        </div>
        {showSource ? (
          <div className="panel-body">
            <SourceToggle source={content.sourceMarkdown || question.answer} />
          </div>
        ) : null}
      </section>
    </div>
  );
}

function PlainQuestionView({ question }: { question: Question }) {
  return (
    <div className="content-grid">
      <section className="panel">
        <div className="panel-header">
          <h2>Prompt</h2>
          <span className={`pill ${question.status}`}>{statusLabel(question.status)}</span>
        </div>
        <div className="panel-body">
          <p className="answer">{question.prompt}</p>
        </div>
      </section>
      <section className="panel">
        <div className="panel-header">
          <h2>Review Details</h2>
        </div>
        <div className="panel-body grid">
          <div className="meta">
            <span className="pill">{question.difficulty}</span>
            {question.tags?.map((tag) => (
              <span className="pill" key={tag}>
                #{tag}
              </span>
            ))}
          </div>
          {question.source_file ? <div className="notice">Source: {question.source_file}</div> : null}
        </div>
      </section>
      <section className="panel full-span">
        <div className="panel-header">
          <h2>Answer</h2>
        </div>
        <div className="panel-body">
          <MaskedBlock>
            <p className="answer">{question.answer}</p>
          </MaskedBlock>
        </div>
      </section>
    </div>
  );
}

export function StructuredQuestionView({ question }: { question: Question }) {
  const content = question.structured_content;

  if (content?.kind === "concept") {
    return <ConceptQuestionView question={question} content={content} />;
  }

  if (content?.kind === "story") {
    return <StoryQuestionView question={question} content={content} />;
  }

  return <PlainQuestionView question={question} />;
}
