export function statusLabel(status: string) {
  return status.replace("_", " ");
}

export function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function tagString(tags: string[] | null | undefined) {
  return (tags ?? []).join(", ");
}

export function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function formatDateTime(value?: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function groupLabel(value?: string | null) {
  if (value === "behavioral") return "Behavioral Questions";
  if (value === "technical") return "Technical Questions";
  return "Unclassified";
}

export function typeLabel(value?: string | null) {
  const labels: Record<string, string> = {
    star: "STAR",
    phone_interview: "Phone Interview",
    conceptual: "Conceptual",
    coding: "Coding",
    sql: "SQL",
    selenium_xpath: "Selenium / XPath",
    framework_design: "Framework Design",
    test_design: "Test Design",
    debugging: "Debugging"
  };
  return value ? labels[value] ?? value : "Unclassified";
}
