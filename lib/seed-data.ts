import type { Question } from "./types";

export const demoQuestions: Question[] = [
  {
    id: "q-1-1",
    source_id: "Q1.1",
    title: "What is a brittle XPath, and how do you avoid it?",
    prompt: "Explain what makes an XPath brittle and how you would write a more maintainable locator in an interview.",
    answer:
      "A brittle XPath breaks when small unrelated HTML, styling, or text changes happen. Avoid absolute paths, exact styling-class matches, and dynamic IDs. Prefer stable attributes like name, id, data-testid, or accessible attributes; use relative paths; anchor on stable text and nearby relationships; and use normalize-space() around text comparisons. A strong answer also names the trade-off: data-testid is most stable but needs developer cooperation, while text-anchored relative XPath is a reliable default when test attributes are unavailable.",
    category: "Selenium / XPath / Locators",
    track: "Selenium / XPath",
    difficulty: "easy",
    tags: ["xpath", "selenium", "locators", "flaky-tests"],
    source_file: "sources/conceptual_question_bank.md",
    story_links: ["S002", "S007"],
    status: "new",
    notes: "Imported from the conceptual question bank.",
    structured_content: null,
    question_group: "technical",
    behavioral_type: null,
    technical_type: "conceptual",
    review_count: 0,
    last_reviewed_at: null,
    created_at: "2026-05-16T00:00:00.000Z",
    updated_at: "2026-05-16T00:00:00.000Z"
  }
];
