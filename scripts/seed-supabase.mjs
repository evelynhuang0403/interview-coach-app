import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const { loadEnvConfig } = nextEnv;
loadEnvConfig(root);

const bankPath = path.join(root, "sources", "conceptual_question_bank.md");
const storiesDir = path.join(root, "sources", "stories");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const userId = process.env.SEED_USER_ID;

if (!supabaseUrl || !serviceRoleKey || !userId) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or SEED_USER_ID.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

function stripMarkdown(value) {
  return value
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .trim();
}

function extractStoryLinks(value) {
  return Array.from(new Set(value.match(/S\d{3}/g) ?? []));
}

function cleanInline(value) {
  return value
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

function trimBlankLines(lines) {
  const copy = [...lines];
  while (copy.length && !copy[0].trim()) copy.shift();
  while (copy.length && !copy[copy.length - 1].trim()) copy.pop();
  return copy;
}

function splitSections(markdown) {
  const lines = markdown.split(/\r?\n/);
  const sections = [];
  let current = null;

  for (const line of lines) {
    const heading = line.match(/^(#{2,3})\s+(.+)$/);
    if (heading) {
      if (current) sections.push({ ...current, body: trimBlankLines(current.lines).join("\n").trim() });
      current = {
        level: heading[1].length,
        title: cleanInline(heading[2]),
        lines: []
      };
      continue;
    }
    if (current) current.lines.push(line);
  }

  if (current) sections.push({ ...current, body: trimBlankLines(current.lines).join("\n").trim() });
  return sections.map(({ lines: _lines, ...section }) => section);
}

function parseMarkdownTable(lines) {
  const tableLines = lines.filter((line) => line.trim().startsWith("|") && line.trim().endsWith("|"));
  if (tableLines.length < 2) return null;
  const parseRow = (line) =>
    line
      .trim()
      .slice(1, -1)
      .split("|")
      .map((cell) => cleanInline(cell));
  return {
    headers: parseRow(tableLines[0]),
    rows: tableLines.slice(2).map(parseRow)
  };
}

function parseAllTables(markdown) {
  const lines = markdown.split(/\r?\n/);
  const tables = [];
  let buffer = [];

  for (const line of lines) {
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      buffer.push(line);
      continue;
    }
    if (buffer.length) {
      const table = parseMarkdownTable(buffer);
      if (table) tables.push(table);
      buffer = [];
    }
  }

  if (buffer.length) {
    const table = parseMarkdownTable(buffer);
    if (table) tables.push(table);
  }

  return tables;
}

function parseBullets(body) {
  return body
    .split(/\r?\n/)
    .filter((line) => line.trim().startsWith("- "))
    .map((line) => cleanInline(line.replace(/^\s*-\s+/, "")));
}

function parseQuote(body) {
  const quoteLines = body
    .split(/\r?\n/)
    .filter((line) => line.trim().startsWith(">"))
    .map((line) => cleanInline(line.replace(/^\s*>\s?/, "")));
  return quoteLines.join("\n\n").trim();
}

function sectionByTitle(sections, pattern) {
  return sections.find((section) => pattern.test(section.title));
}

function sectionsByTitle(sections, pattern) {
  return sections.filter((section) => pattern.test(section.title));
}

function parseConceptStructuredContent(markdown, title) {
  const sections = splitSections(markdown);
  const shortAnswer = markdown.match(/\*\*Short answer:\*\*\s*([\s\S]*?)(?=\n\*\*|\n---|$)/)?.[1]?.trim() ?? "";
  const bestPracticesSection = markdown.match(/\*\*Best practices to avoid brittleness:\*\*\s*([\s\S]*?)(?=\n\*\*Interview tip|\n\*\*Connects to|\n---|$)/)?.[1] ?? "";
  const interviewTip = markdown.match(/\*\*Interview tip:\*\*\s*([\s\S]*?)(?=\n\*\*Connects to|\n---|$)/)?.[1]?.trim() ?? "";
  const connectsTo = markdown.match(/\*\*Connects to\*\*:\s*([\s\S]*?)(?=\n---|$)/)?.[1] ?? "";

  return {
    kind: "concept",
    sections,
    shortAnswer: cleanInline(shortAnswer),
    bestPractices: parseBullets(bestPracticesSection),
    interviewTip: cleanInline(interviewTip),
    connectsTo: extractStoryLinks(connectsTo),
    tables: parseAllTables(markdown),
    metadata: {
      title
    }
  };
}

function parseMetadataTable(markdown) {
  const table = parseAllTables(markdown)[0];
  const metadata = {};
  if (!table) return metadata;
  for (const row of table.rows) {
    const [field, value] = row;
    if (field && value) metadata[field] = value;
  }
  return metadata;
}

function parseFollowUps(sections) {
  return sections
    .filter((section) => /^Q\d+:/i.test(section.title))
    .map((section) => ({
      question: section.title.replace(/^Q\d+:\s*/, ""),
      answer: parseQuote(section.body) || cleanInline(section.body)
    }));
}

function parseInterviewQuestions(sections) {
  const startIndex = sections.findIndex((section) => /^Interview Questions This Story Answers/i.test(section.title));
  if (startIndex === -1) return [];
  const questions = [];
  for (const section of sections.slice(startIndex + 1)) {
    if (section.level === 2) break;
    if (/^\d+\./.test(section.title)) questions.push(cleanInline(section.title.replace(/^\d+\.\s*/, "")));
  }
  return questions;
}

function parseStoryStructuredContent(markdown, id, title) {
  const sections = splitSections(markdown);
  const spokenSections = sections.filter((section) =>
    /Spoken Version|Core A|Core B/i.test(section.title)
  );
  const spokenVersions = spokenSections.map((section) => ({
    title: section.title,
    body: section.body,
    quote: parseQuote(section.body),
    variant: /EXTENDED/i.test(section.title) ? "extended" : /CORE|Core A|Core B/i.test(section.title) ? "core" : "alternate"
  }));
  const core =
    spokenSections.find((section) => /CORE|Core A|Core B/i.test(section.title) && !/EXTENDED/i.test(section.title)) ??
    spokenSections[0] ??
    sections.find((section) => /CORE|Framing/i.test(section.title));
  const addOns = sectionsByTitle(sections, /Add-On|Closing|Manager Recognition|How You Handled|Reflection/i).map((section) => ({
    title: section.title,
    body: section.body,
    level: section.level,
    type: "addon",
    bullets: parseBullets(section.body)
  }));
  const deliverySection = sectionByTitle(sections, /Delivery Tips/i);
  const decisionSection = sectionByTitle(sections, /Things.*Decide|Things.*Confirm/i);

  return {
    kind: "story",
    metadata: {
      id,
      title,
      ...parseMetadataTable(markdown)
    },
    storyCore: core
      ? {
          title: core.title,
          body: core.body,
          quote: parseQuote(core.body)
        }
      : undefined,
    spokenVersions,
    addOns,
    followUps: parseFollowUps(sections),
    interviewQuestions: parseInterviewQuestions(sections),
    deliveryTips: deliverySection ? parseBullets(deliverySection.body) : [],
    decisions: decisionSection ? parseBullets(decisionSection.body) : [],
    sections,
    sourceMarkdown: markdown
  };
}

function inferTrack(sectionTitle) {
  if (/selenium|xpath|locator/i.test(sectionTitle)) return "Selenium / XPath";
  if (/sql/i.test(sectionTitle)) return "SQL";
  if (/java/i.test(sectionTitle)) return "Java";
  if (/test design|framework/i.test(sectionTitle)) return "Test Design / Framework";
  return "General";
}

function classifyTechnicalType(sectionTitle) {
  if (sectionTitle) return "conceptual";
  return "conceptual";
}

function parseConceptualBank(markdown) {
  const lines = markdown.split(/\r?\n/);
  const questions = [];
  let sectionTitle = "General";
  let current = null;

  for (const line of lines) {
    const sectionMatch = line.match(/^##\s+Section\s+\d+\s+—\s+(.+)$/);
    if (sectionMatch) {
      if (current) {
        questions.push(current);
        current = null;
      }
      sectionTitle = stripMarkdown(sectionMatch[1]);
      continue;
    }

    const questionMatch = line.match(/^###\s+(Q[\d.]+)\s+—\s+(.+)$/);
    if (questionMatch) {
      if (current) questions.push(current);
      current = {
        source_id: questionMatch[1],
        title: stripMarkdown(questionMatch[2]),
        prompt: stripMarkdown(questionMatch[2]),
        body: [],
        category: sectionTitle,
        track: inferTrack(sectionTitle)
      };
      continue;
    }

    if (current) current.body.push(line);
  }

  if (current) questions.push(current);

  return questions
    .map((question) => {
      const body = question.body.join("\n").trim();
      const storyLinks = extractStoryLinks(body);
      return {
        user_id: userId,
        source_id: question.source_id,
        title: question.title,
        prompt: question.prompt,
        answer: body,
        category: question.category,
        track: question.track,
        difficulty: "easy",
        tags: Array.from(new Set([question.track.toLowerCase().split(" ")[0], ...storyLinks.map((item) => item.toLowerCase())])),
        source_file: "sources/conceptual_question_bank.md",
        story_links: storyLinks,
        status: "new",
        notes: "Imported from Markdown seed script.",
        structured_content: parseConceptStructuredContent(body, question.title),
        question_group: "technical",
        behavioral_type: null,
        technical_type: classifyTechnicalType(question.category)
      };
    })
    .filter((question) => question.answer && !question.answer.includes("Entries added as they come up"));
}

function titleFromStoryMarkdown(markdown, fallbackId) {
  const heading = markdown.match(/^#\s+(S\d{3})\s+—\s+(.+)$/m);
  if (heading) {
    return `${heading[1]} — ${stripMarkdown(heading[2])}`;
  }
  return fallbackId;
}

function parseStoryFiles() {
  if (!fs.existsSync(storiesDir)) return [];

  return fs
    .readdirSync(storiesDir)
    .filter((file) => /^S\d{3}_.+\.md$/.test(file))
    .sort()
    .map((file) => {
      const fullPath = path.join(storiesDir, file);
      const markdown = fs.readFileSync(fullPath, "utf8").trim();
      const id = file.match(/^(S\d{3})_/)?.[1] ?? file.replace(/\.md$/, "");
      const title = titleFromStoryMarkdown(markdown, id);
      const skill = markdown.match(/\|\s+\*\*Primary Skill\*\*\s+\|\s+(.+?)\s+\|/)?.[1];
      const secondarySkill = markdown.match(/\|\s+\*\*Secondary Skill\*\*\s+\|\s+(.+?)\s+\|/)?.[1];
      return {
        user_id: userId,
        source_id: id,
        title,
        prompt: `Review and practice story ${id}.`,
        answer: markdown,
        category: "Storybank",
        track: "Behavioral / Story-linked",
        difficulty: "medium",
        tags: Array.from(
          new Set(
            [
              "storybank",
              "behavioral",
              id.toLowerCase(),
              skill ? stripMarkdown(skill).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : "",
              secondarySkill ? stripMarkdown(secondarySkill).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : ""
            ].filter(Boolean)
          )
        ),
        source_file: `sources/stories/${file}`,
        story_links: [id],
        status: "new",
        notes: "Imported exactly from the story Markdown file.",
        structured_content: parseStoryStructuredContent(markdown, id, title),
        question_group: "behavioral",
        behavioral_type: "star",
        technical_type: null
      };
    });
}

const markdown = fs.readFileSync(bankPath, "utf8");
const questions = [...parseConceptualBank(markdown), ...parseStoryFiles()];

if (!questions.length) {
  console.log("No questions found to import.");
  process.exit(0);
}

const { error } = await supabase.from("questions").upsert(questions, {
  onConflict: "user_id,source_id"
});

if (error) {
  console.error(error);
  process.exit(1);
}

console.log(`Imported ${questions.length} record(s): conceptual questions plus story files.`);
