/**
 * Forge Canonical Learning Architecture Types
 * Defines the content model separating content semantics from presentation and state.
 */

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export type LessonType =
  "instruction" | "practice" | "challenge" | "project" | "assessment" | "capstone";

export type ActivityType =
  | "intro"
  | "explanation"
  | "code-example"
  | "visual"
  | "multiple-choice"
  | "multi-select"
  | "fill-blank"
  | "ordering"
  | "output-prediction"
  | "interactive-code"
  | "debug"
  | "reflection"
  | "summary"
  | "completion";

export type ActivityIntent =
  | "orientation"
  | "understanding"
  | "recognition"
  | "retrieval"
  | "prediction"
  | "application"
  | "modification"
  | "debugging"
  | "transfer"
  | "reflection"
  | "assessment";

export type ObjectivePriority = "primary" | "secondary" | "reinforcement";

export interface Objective {
  id: string;
  statement: string;
  conceptIds: string[];
  skillIds: string[];
  priority: ObjectivePriority;
}

export interface ActivityHint {
  id: string;
  level: number;
  content: string;
}

export interface ActivityFeedback {
  correct: string;
  incorrect: string;
  explanation?: string;
  hints?: ActivityHint[];
}

export interface ActivityEvidenceConfig {
  conceptIds?: string[];
  skillIds?: string[];
  objectiveIds?: string[];
  demonstratedLevel?: "emerging" | "competent" | "mastered";
}

// ---------------------------------------------------------------------------
// Validation Configurations
// ---------------------------------------------------------------------------

export interface ExactMatchValidation {
  type: "exact-match";
  expected: string | number | boolean;
  caseSensitive?: boolean;
}

export interface OneOfValidation {
  type: "one-of";
  validOptions: (string | number)[];
  caseSensitive?: boolean;
}

export interface MultiMatchValidation {
  type: "multi-match";
  expected: string[];
  ignoreOrder?: boolean;
}

export interface OrderingValidation {
  type: "ordering";
  correctSequence: string[];
}

export interface TestCaseValidation {
  id: string;
  description: string;
  testCode?: string;
  assertion?: string;
}

export interface TestsValidation {
  type: "tests";
  testCases: TestCaseValidation[];
}

export interface CodeOutputValidation {
  type: "code-output";
  expectedOutput: string;
  matchType?: "exact" | "contains" | "regex";
}

export type ActivityValidationConfig =
  | ExactMatchValidation
  | OneOfValidation
  | MultiMatchValidation
  | OrderingValidation
  | TestsValidation
  | CodeOutputValidation;

// ---------------------------------------------------------------------------
// Activity Specific Content Schemas (Discriminated Union)
// ---------------------------------------------------------------------------

export interface IntroActivityContent {
  title: string;
  hook: string;
  context?: string;
  goals?: string[];
}

export interface IntroActivity {
  id: string;
  type: "intro";
  intent: ActivityIntent;
  objectiveIds: string[];
  content: IntroActivityContent;
  validation?: ActivityValidationConfig;
  feedback?: ActivityFeedback;
  evidence?: ActivityEvidenceConfig;
  optional?: boolean;
}

export interface ExplanationActivityContent {
  title?: string;
  text: string;
  callout?: {
    variant: "tip" | "warning" | "mistake" | "info";
    text: string;
  };
  keyTakeaway?: string;
}

export interface ExplanationActivity {
  id: string;
  type: "explanation";
  intent: ActivityIntent;
  objectiveIds: string[];
  content: ExplanationActivityContent;
  validation?: ActivityValidationConfig;
  feedback?: ActivityFeedback;
  evidence?: ActivityEvidenceConfig;
  optional?: boolean;
}

export interface CodeExampleActivityContent {
  title?: string;
  description?: string;
  code: string;
  language: string;
  highlightedLines?: number[];
  annotations?: {
    line: number;
    comment: string;
  }[];
}

export interface CodeExampleActivity {
  id: string;
  type: "code-example";
  intent: ActivityIntent;
  objectiveIds: string[];
  content: CodeExampleActivityContent;
  validation?: ActivityValidationConfig;
  feedback?: ActivityFeedback;
  evidence?: ActivityEvidenceConfig;
  optional?: boolean;
}

export interface VisualActivityContent {
  title: string;
  visualType: "diagram" | "flowchart" | "comparison" | "hierarchy" | "custom";
  description?: string;
  visualData?: Record<string, unknown>;
}

export interface VisualActivity {
  id: string;
  type: "visual";
  intent: ActivityIntent;
  objectiveIds: string[];
  content: VisualActivityContent;
  validation?: ActivityValidationConfig;
  feedback?: ActivityFeedback;
  evidence?: ActivityEvidenceConfig;
  optional?: boolean;
}

export interface MultipleChoiceOption {
  id: string;
  text: string;
  hint?: string;
}

export interface MultipleChoiceActivityContent {
  question: string;
  options: MultipleChoiceOption[];
  explanation?: string;
}

export interface MultipleChoiceActivity {
  id: string;
  type: "multiple-choice";
  intent: ActivityIntent;
  objectiveIds: string[];
  content: MultipleChoiceActivityContent;
  validation?: ActivityValidationConfig;
  feedback?: ActivityFeedback;
  evidence?: ActivityEvidenceConfig;
  optional?: boolean;
}

export interface MultiSelectActivityContent {
  question: string;
  options: MultipleChoiceOption[];
  minSelections?: number;
  maxSelections?: number;
  explanation?: string;
}

export interface MultiSelectActivity {
  id: string;
  type: "multi-select";
  intent: ActivityIntent;
  objectiveIds: string[];
  content: MultiSelectActivityContent;
  validation?: ActivityValidationConfig;
  feedback?: ActivityFeedback;
  evidence?: ActivityEvidenceConfig;
  optional?: boolean;
}

export interface FillBlankItem {
  id: string;
  hint?: string;
  placeholder?: string;
}

export interface FillBlankActivityContent {
  prompt: string;
  template: string;
  blanks: FillBlankItem[];
  explanation?: string;
}

export interface FillBlankActivity {
  id: string;
  type: "fill-blank";
  intent: ActivityIntent;
  objectiveIds: string[];
  content: FillBlankActivityContent;
  validation?: ActivityValidationConfig;
  feedback?: ActivityFeedback;
  evidence?: ActivityEvidenceConfig;
  optional?: boolean;
}

export interface OrderingItem {
  id: string;
  text: string;
  initialOrder?: number;
}

export interface OrderingActivityContent {
  prompt: string;
  items: OrderingItem[];
  explanation?: string;
}

export interface OrderingActivity {
  id: string;
  type: "ordering";
  intent: ActivityIntent;
  objectiveIds: string[];
  content: OrderingActivityContent;
  validation?: ActivityValidationConfig;
  feedback?: ActivityFeedback;
  evidence?: ActivityEvidenceConfig;
  optional?: boolean;
}

export interface OutputPredictionActivityContent {
  code: string;
  language: string;
  prompt: string;
  options?: string[];
  explanation?: string;
}

export interface OutputPredictionActivity {
  id: string;
  type: "output-prediction";
  intent: ActivityIntent;
  objectiveIds: string[];
  content: OutputPredictionActivityContent;
  validation?: ActivityValidationConfig;
  feedback?: ActivityFeedback;
  evidence?: ActivityEvidenceConfig;
  optional?: boolean;
}

export interface InteractiveCodeFile {
  name: string;
  content: string;
  readOnly?: boolean;
}

export interface InteractiveCodeActivityContent {
  title: string;
  prompt: string;
  language: string;
  starterCode: string;
  solutionCode?: string;
  files?: InteractiveCodeFile[];
}

export interface InteractiveCodeActivity {
  id: string;
  type: "interactive-code";
  intent: ActivityIntent;
  objectiveIds: string[];
  content: InteractiveCodeActivityContent;
  validation?: ActivityValidationConfig;
  feedback?: ActivityFeedback;
  evidence?: ActivityEvidenceConfig;
  optional?: boolean;
}

export interface DebugActivityContent {
  title: string;
  prompt: string;
  buggyCode: string;
  language: string;
  bugDescription: string;
  hints?: string[];
}

export interface DebugActivity {
  id: string;
  type: "debug";
  intent: ActivityIntent;
  objectiveIds: string[];
  content: DebugActivityContent;
  validation?: ActivityValidationConfig;
  feedback?: ActivityFeedback;
  evidence?: ActivityEvidenceConfig;
  optional?: boolean;
}

export interface ReflectionActivityContent {
  prompt: string;
  guidelines?: string[];
  sampleResponse?: string;
  minCharacters?: number;
}

export interface ReflectionActivity {
  id: string;
  type: "reflection";
  intent: ActivityIntent;
  objectiveIds: string[];
  content: ReflectionActivityContent;
  validation?: ActivityValidationConfig;
  feedback?: ActivityFeedback;
  evidence?: ActivityEvidenceConfig;
  optional?: boolean;
}

export interface SummaryActivityContent {
  title?: string;
  takeaways: string[];
  nextSteps?: string[];
  reviewQuestions?: string[];
}

export interface SummaryActivity {
  id: string;
  type: "summary";
  intent: ActivityIntent;
  objectiveIds: string[];
  content: SummaryActivityContent;
  validation?: ActivityValidationConfig;
  feedback?: ActivityFeedback;
  evidence?: ActivityEvidenceConfig;
  optional?: boolean;
}

export interface CompletionActivityContent {
  title: string;
  message: string;
  badgeId?: string;
  congratulations?: string;
}

export interface CompletionActivity {
  id: string;
  type: "completion";
  intent: ActivityIntent;
  objectiveIds: string[];
  content: CompletionActivityContent;
  validation?: ActivityValidationConfig;
  feedback?: ActivityFeedback;
  evidence?: ActivityEvidenceConfig;
  optional?: boolean;
}

export type CanonicalActivity =
  | IntroActivity
  | ExplanationActivity
  | CodeExampleActivity
  | VisualActivity
  | MultipleChoiceActivity
  | MultiSelectActivity
  | FillBlankActivity
  | OrderingActivity
  | OutputPredictionActivity
  | InteractiveCodeActivity
  | DebugActivity
  | ReflectionActivity
  | SummaryActivity
  | CompletionActivity;

// ---------------------------------------------------------------------------
// Lesson & Entities
// ---------------------------------------------------------------------------

export interface LessonPrerequisites {
  lessonIds?: string[];
  conceptIds?: string[];
  skillIds?: string[];
}

export interface EvidenceRequirement {
  objectiveId: string;
  activityIds: string[];
  requirement: "complete" | "success" | "minimum-score";
  threshold?: number;
}

export interface LessonCompletionRule {
  requiredActivityIds?: string[];
  minimumScore?: number;
  evidenceRequirements?: EvidenceRequirement[];
}

export interface CanonicalLesson {
  id: string;
  schemaVersion: string;
  topicId: string;
  title: string;
  description: string;
  lessonType: LessonType;
  difficulty: Difficulty;
  estimatedMinutes: number;
  conceptIds: string[];
  skillIds: string[];
  objectives: Objective[];
  prerequisites: LessonPrerequisites;
  activities: CanonicalActivity[];
  completion: LessonCompletionRule;
  metadata?: Record<string, unknown>;
}

export interface Concept {
  id: string;
  title: string;
  definition: string;
  topicId: string;
  prerequisiteConceptIds: string[];
  relatedConceptIds: string[];
  misconceptionIds: string[];
}

export interface Skill {
  id: string;
  title: string;
  description: string;
  topicId: string;
  conceptIds: string[];
  difficulty: Difficulty;
  prerequisiteSkillIds: string[];
}

export interface Misconception {
  id: string;
  title: string;
  description: string;
  conceptId: string;
  indicators: string[];
  correction: string;
}

export interface CanonicalTopic {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  order: number;
  conceptIds: string[];
  skillIds: string[];
  lessonIds: string[];
}

export interface CanonicalModule {
  id: string;
  levelId: string;
  title: string;
  description: string;
  order: number;
  topicIds: string[];
}

export interface CanonicalLevel {
  id: string;
  title: string;
  description: string;
  order: number;
  moduleIds: string[];
}

export interface Academy {
  id: string;
  schemaVersion: string;
  title: string;
  description: string;
  levels: CanonicalLevel[];
}
