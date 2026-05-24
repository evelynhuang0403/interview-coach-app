export type QuestionStatus = "new" | "reviewing" | "confident" | "needs_practice" | "archived";

export type Difficulty = "easy" | "medium" | "hard";
export type QuestionGroup = "behavioral" | "technical";
export type BehavioralType = "star" | "phone_interview";
export type TechnicalType =
  | "conceptual"
  | "coding"
  | "sql"
  | "selenium_xpath"
  | "framework_design"
  | "test_design"
  | "debugging";
export type ReviewResult = "reviewed" | "needs_practice" | "confident";

export type Question = {
  id: string;
  user_id?: string | null;
  source_id?: string | null;
  title: string;
  prompt: string;
  answer: string;
  category: string;
  track: string;
  difficulty: Difficulty;
  tags: string[];
  source_file?: string | null;
  story_links: string[];
  status: QuestionStatus;
  notes?: string | null;
  structured_content?: StructuredContent | null;
  question_group?: QuestionGroup | null;
  behavioral_type?: BehavioralType | null;
  technical_type?: TechnicalType | null;
  review_count: number;
  last_reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type QuestionReview = {
  id: string;
  user_id?: string | null;
  question_id: string;
  practiced_at: string;
  result: ReviewResult;
  confidence: number | null;
  note?: string | null;
};

export type QuestionReviewInput = {
  question_id: string;
  result: ReviewResult;
  confidence?: number | null;
  note?: string | null;
};

export type UserStreak = {
  user_id?: string;
  current_streak: number;
  best_streak: number;
  last_practice_date?: string | null;
  updated_at?: string | null;
};

export type QuestionInput = Omit<Question, "id" | "created_at" | "updated_at" | "user_id">;

export type MarkdownTable = {
  headers: string[];
  rows: string[][];
};

export type StructuredSection = {
  title: string;
  body: string;
  level?: number;
  type?: string;
  bullets?: string[];
  table?: MarkdownTable;
};

export type StoryFollowUp = {
  question: string;
  answer: string;
};

export type StoryInterviewQuestion = {
  question: string;
  lead?: string;
  emphasize?: string;
};

export type OpgQuestionBankItem = {
  type: "question" | "resource";
  number?: number;
  label?: string;
  behavioralLabel?: string;
  title: string;
  answer?: string;
  keywordTrack?: string[];
  deliveryNotes?: string;
  body?: string;
  sourceMarkdown?: string;
};

export type OpgQuestionBankSection = {
  title: string;
  items: OpgQuestionBankItem[];
};

export type StructuredContent = {
  kind: "concept" | "story" | "opg" | "plain";
  metadata?: Record<string, string>;
  sections?: StructuredSection[];
  opgSections?: OpgQuestionBankSection[];
  answer?: string;
  keywordTrack?: string[];
  shortAnswer?: string;
  bestPractices?: string[];
  interviewTip?: string;
  connectsTo?: string[];
  tables?: MarkdownTable[];
  storyCore?: {
    title: string;
    body: string;
    quote?: string;
  };
  spokenVersions?: Array<{
    title: string;
    body: string;
    quote?: string;
    variant?: "core" | "extended" | "alternate";
  }>;
  addOns?: StructuredSection[];
  followUps?: StoryFollowUp[];
  challengeQuestions?: StoryFollowUp[];
  interviewQuestions?: Array<string | StoryInterviewQuestion>;
  deliveryTips?: string[];
  decisions?: string[];
  sourceMarkdown?: string;
};
