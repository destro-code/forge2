export type Difficulty = "Beginner" | "Intermediate" | "Advanced";
export type MasteryState =
  "Not Started" | "Learning" | "Practicing" | "Needs Review" | "Interview Ready" | "Mastered";

export interface TopicMasteryRecord {
  topicId: string;
  topicTitle: string;
  category: string;
  confidence: number; // 0 - 100 percentage
  mastery: MasteryState;
  lastReviewedAt: string; // ISO date
  nextReviewAt: string; // ISO date
  intervalDays: number; // spaced repetition interval (e.g. 1, 3, 7, 14, 30)
  reviewCount: number;
  quizScorePercent?: number;
  notes?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  moduleCount: number;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  targetRole: string;
  estimatedHours: number;
  icon: string;
  color: string;
  moduleIds: string[];
  difficulty: Difficulty;
  featured?: boolean;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  icon: string;
  difficulty: Difficulty;
  topicCount: number;
  lessonCount: number;
  estimatedHours: number;
  progress: number;
  color: string;
  tags: string[];
  order?: number;
  categoryId?: string;
  pathIds?: string[];
  prerequisites?: string[];
}

export interface Topic {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  interviewFrequency: "Low" | "Medium" | "High" | "Very High";
  prerequisites: string[];
  next: string[];
  related: string[];
  order?: number;
  categoryId?: string;
}

export interface CurriculumFilter {
  query?: string;
  categoryId?: string;
  difficulty?: Difficulty | "All";
  pathId?: string;
  tag?: string;
  progressStatus?: "All" | "Not Started" | "In Progress" | "Completed";
}

export type LessonHighlightColor = "yellow" | "emerald" | "cyan" | "rose" | "purple";

export interface LessonHighlight {
  id: string;
  lessonId: string;
  text: string;
  color: LessonHighlightColor;
  note?: string;
  createdAt: string;
}

export type LessonSection =
  | { type: "heading"; text: string; id?: string }
  | { type: "paragraph"; text: string }
  | { type: "callout"; variant: "tip" | "warning" | "mistake" | "info"; text: string }
  | {
      type: "code";
      language: string;
      code: string;
      title?: string;
      editable?: boolean;
      highlightLines?: number[];
    }
  | {
      type: "diagram";
      diagramType: "closure-scope" | "event-loop" | "fiber-tree" | "state-flow" | "custom";
      title: string;
      description?: string;
    }
  | {
      type: "walkthrough";
      title: string;
      steps: { title: string; description: string; code?: string; language?: string }[];
    }
  | {
      type: "collapsible";
      title: string;
      subtitle?: string;
      content: string;
      variant?: "deep-dive" | "pitfall" | "senior-tip" | "default";
    }
  | { type: "checkpoint"; id: string; label: string; hint?: string }
  | {
      type: "interactive-sandbox";
      id?: string;
      title?: string;
      initialCode: string;
      language?: string;
      instructions?: string;
    }
  | { type: "inline-quiz"; quizId: string };

export interface Lesson {
  id: string;
  topicId: string;
  moduleId?: string;
  order?: number;
  title: string;
  description: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  mastery: MasteryState;
  learningObjectives?: string[];
  prerequisites?: string[];
  previousLessonId?: string | null;
  nextLessonId?: string | null;
  sections: LessonSection[];
  exercises: { id: string; title: string; brief: string }[];
  quiz: {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
  summary: string;
  resources: { label: string; url: string }[];
  interviewQuestions: string[];
}

export interface ProjectTask {
  id: string;
  milestoneId: string;
  title: string;
  description?: string;
  hints?: string[];
  estimatedMinutes?: number;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  description: string;
  estimatedMinutes?: number;
  done?: boolean;
  tasks: ProjectTask[];
}

export interface ProjectAcceptanceCriteria {
  id: string;
  title: string;
  category: "functional" | "performance" | "a11y" | "architecture";
  description: string;
}

export interface ProjectResource {
  title: string;
  url: string;
  type: "starter" | "docs" | "figma" | "api" | "article";
  description: string;
}

export interface ProjectPortfolioTip {
  category: "resume" | "interview" | "architecture";
  bullet: string;
}

export interface ProjectReflection {
  challenge: string;
  solution: string;
  learned: string;
  scaleRefactor: string;
}

export interface ProjectUserNotes {
  repoUrl: string;
  demoUrl: string;
  customBullets: string;
  highlight: string;
}

export interface Project {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  overview?: string;
  category?: string;
  difficulty: Difficulty;
  estimatedHours: number;
  tags: string[];
  milestones: ProjectMilestone[];
  acceptanceCriteria?: ProjectAcceptanceCriteria[];
  resources?: ProjectResource[];
  portfolioTips?: ProjectPortfolioTip[];
}

export type QuizQuestionType =
  "mcq" | "multiple" | "ordering" | "drag_drop" | "code" | "fill_in_blank";

export interface QuizQuestionBase {
  id: string;
  type: QuizQuestionType;
  question: string;
  explanation: string;
  codeSnippet?: string;
  hint?: string;
}

export interface MCQQuestion extends QuizQuestionBase {
  type: "mcq";
  options: string[];
  correctIndex: number;
}

export interface MultipleQuestion extends QuizQuestionBase {
  type: "multiple";
  options: string[];
  correctIndices: number[];
}

export interface OrderingQuestion extends QuizQuestionBase {
  type: "ordering";
  items: string[];
  correctOrder: string[];
}

export interface DragDropQuestion extends QuizQuestionBase {
  type: "drag_drop";
  pairs: { id: string; left: string; right: string }[];
}

export interface CodeQuestion extends QuizQuestionBase {
  type: "code";
  codeSnippet: string;
  options: string[];
  correctIndex: number;
}

export interface FillInBlankQuestion extends QuizQuestionBase {
  type: "fill_in_blank";
  template: string;
  acceptedAnswers: string[];
}

export type QuizQuestion =
  | MCQQuestion
  | MultipleQuestion
  | OrderingQuestion
  | DragDropQuestion
  | CodeQuestion
  | FillInBlankQuestion;

export interface QuizResultRecord {
  id: string;
  quizId: string;
  topicId?: string;
  scorePercent: number;
  completedAt: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  category?: string;
  topicId?: string;
  questions: QuizQuestion[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  deck: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
}

export type BugCategory =
  | "react_app"
  | "console_error"
  | "network"
  | "css"
  | "a11y"
  | "performance"
  | "memory_leak"
  | "hooks";

export interface BugHint {
  title: string;
  content: string;
}

export interface BugTestCase {
  id: string;
  name: string;
  description: string;
}

export interface Bug {
  id: string;
  title: string;
  category: BugCategory;
  difficulty: Difficulty;
  tags: string[];
  estimatedMinutes: number;
  brief: string;
  symptoms?: string[];
  brokenCode: string;
  fixedCode: string;
  hints: BugHint[];
  explanation: string;
  testCases?: BugTestCase[];
  interactiveType?:
    | "counter_stale"
    | "layout_shift"
    | "memory_leak"
    | "network_race"
    | "a11y_button"
    | "perf_renders"
    | "console_null_map"
    | "hooks_infinite";
}

export interface InterviewQuestion {
  id: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  question: string;
  estimatedMinutes: number;
  rubric?: string[];
  sampleAnswer?: string;
  followUpQuestions?: string[];
  starFramework?: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  codeSnippet?: string;
  commonPitfalls?: string[];
  companyTags?: string[];
}

export interface InterviewSessionResult {
  id: string;
  questionId: string;
  category: string;
  userAnswer: string;
  scorePercent: number;
  checkedRubricItems: string[];
  timeSpentSeconds: number;
  notes?: string;
  completedAt: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  type: string;
}

export type MentorMode = "chat" | "lesson-help" | "code-review" | "explanations" | "debug-help";

export interface MentorMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
  mode?: MentorMode;
}

export interface MentorConversation {
  id: string;
  title: string;
  messages: MentorMessage[];
  updatedAt: number;
  mode?: MentorMode;
}

export type JournalCategory = "code_note" | "mistake" | "discovery" | "general";

export interface JournalCodeSnippet {
  language: string;
  code: string;
}

export interface JournalMistakeDetail {
  symptom: string;
  rootCause: string;
  fix: string;
}

export interface JournalDiscoveryDetail {
  keyTakeaway: string;
  resourceUrl?: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  category: JournalCategory;
  content: string;
  codeSnippet?: JournalCodeSnippet;
  mistakeDetail?: JournalMistakeDetail;
  discoveryDetail?: JournalDiscoveryDetail;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateRecord {
  id: string;
  pathId: string;
  pathTitle: string;
  score: number;
  issuedAt: string;
}
