import { z } from "zod";
import type {
  CanonicalActivity,
  CanonicalLesson,
  Concept,
  Skill,
  Misconception,
  CanonicalTopic,
  CanonicalModule,
  CanonicalLevel,
  Academy,
} from "./types";

// ---------------------------------------------------------------------------
// Enums & Primitive Schemas
// ---------------------------------------------------------------------------

export const difficultySchema = z.enum(["Beginner", "Intermediate", "Advanced"]);

export const lessonTypeSchema = z.enum([
  "instruction",
  "practice",
  "challenge",
  "project",
  "assessment",
  "capstone",
]);

export const activityTypeSchema = z.enum([
  "intro",
  "explanation",
  "code-example",
  "visual",
  "multiple-choice",
  "multi-select",
  "fill-blank",
  "ordering",
  "output-prediction",
  "interactive-code",
  "debug",
  "reflection",
  "summary",
  "completion",
]);

export const activityIntentSchema = z.enum([
  "orientation",
  "understanding",
  "recognition",
  "retrieval",
  "prediction",
  "application",
  "modification",
  "debugging",
  "transfer",
  "reflection",
  "assessment",
]);

export const objectivePrioritySchema = z.enum(["primary", "secondary", "reinforcement"]);

export const objectiveSchema = z.object({
  id: z.string().min(1),
  statement: z.string().min(1),
  conceptIds: z.array(z.string()),
  skillIds: z.array(z.string()),
  priority: objectivePrioritySchema,
});

export const activityHintSchema = z.object({
  id: z.string().min(1),
  level: z.number().int().min(1),
  content: z.string().min(1),
});

export const activityFeedbackSchema = z.object({
  correct: z.string().min(1),
  incorrect: z.string().min(1),
  explanation: z.string().optional(),
  hints: z.array(activityHintSchema).optional(),
});

export const activityEvidenceSchema = z.object({
  conceptIds: z.array(z.string()).optional(),
  skillIds: z.array(z.string()).optional(),
  objectiveIds: z.array(z.string()).optional(),
  demonstratedLevel: z.enum(["emerging", "competent", "mastered"]).optional(),
});

// ---------------------------------------------------------------------------
// Validation Configurations
// ---------------------------------------------------------------------------

export const exactMatchValidationSchema = z.object({
  type: z.literal("exact-match"),
  expected: z.union([z.string(), z.number(), z.boolean()]),
  caseSensitive: z.boolean().optional(),
});

export const oneOfValidationSchema = z.object({
  type: z.literal("one-of"),
  validOptions: z.array(z.union([z.string(), z.number()])),
  caseSensitive: z.boolean().optional(),
});

export const multiMatchValidationSchema = z.object({
  type: z.literal("multi-match"),
  expected: z.array(z.string()),
  ignoreOrder: z.boolean().optional(),
});

export const orderingValidationSchema = z.object({
  type: z.literal("ordering"),
  correctSequence: z.array(z.string()),
});

export const testCaseValidationSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  testCode: z.string().optional(),
  assertion: z.string().optional(),
});

export const testsValidationSchema = z.object({
  type: z.literal("tests"),
  testCases: z.array(testCaseValidationSchema).min(1),
});

export const codeOutputValidationSchema = z.object({
  type: z.literal("code-output"),
  expectedOutput: z.string(),
  matchType: z.enum(["exact", "contains", "regex"]).optional(),
});

export const activityValidationSchema = z.discriminatedUnion("type", [
  exactMatchValidationSchema,
  oneOfValidationSchema,
  multiMatchValidationSchema,
  orderingValidationSchema,
  testsValidationSchema,
  codeOutputValidationSchema,
]);

// ---------------------------------------------------------------------------
// Discriminated Activity Schemas
// ---------------------------------------------------------------------------

const baseActivitySchema = {
  id: z.string().min(1),
  intent: activityIntentSchema,
  objectiveIds: z.array(z.string()),
  validation: activityValidationSchema.optional(),
  feedback: activityFeedbackSchema.optional(),
  evidence: activityEvidenceSchema.optional(),
  optional: z.boolean().optional(),
};

export const introActivitySchema = z.object({
  ...baseActivitySchema,
  type: z.literal("intro"),
  content: z.object({
    title: z.string().min(1),
    hook: z.string().min(1),
    context: z.string().optional(),
    goals: z.array(z.string()).optional(),
  }),
});

export const explanationActivitySchema = z.object({
  ...baseActivitySchema,
  type: z.literal("explanation"),
  content: z.object({
    title: z.string().optional(),
    text: z.string().min(1),
    callout: z
      .object({
        variant: z.enum(["tip", "warning", "mistake", "info"]),
        text: z.string().min(1),
      })
      .optional(),
    keyTakeaway: z.string().optional(),
  }),
});

export const codeExampleActivitySchema = z.object({
  ...baseActivitySchema,
  type: z.literal("code-example"),
  content: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    code: z.string(),
    language: z.string().min(1),
    highlightedLines: z.array(z.number()).optional(),
    annotations: z
      .array(
        z.object({
          line: z.number(),
          comment: z.string(),
        }),
      )
      .optional(),
  }),
});

export const visualActivitySchema = z.object({
  ...baseActivitySchema,
  type: z.literal("visual"),
  content: z.object({
    title: z.string().min(1),
    visualType: z.enum(["diagram", "flowchart", "comparison", "hierarchy", "custom"]),
    description: z.string().optional(),
    visualData: z.record(z.unknown()).optional(),
  }),
});

export const multipleChoiceActivitySchema = z.object({
  ...baseActivitySchema,
  type: z.literal("multiple-choice"),
  content: z.object({
    question: z.string().min(1),
    options: z
      .array(
        z.object({
          id: z.string().min(1),
          text: z.string().min(1),
          hint: z.string().optional(),
        }),
      )
      .min(2),
    explanation: z.string().optional(),
  }),
});

export const multiSelectActivitySchema = z.object({
  ...baseActivitySchema,
  type: z.literal("multi-select"),
  content: z.object({
    question: z.string().min(1),
    options: z
      .array(
        z.object({
          id: z.string().min(1),
          text: z.string().min(1),
          hint: z.string().optional(),
        }),
      )
      .min(2),
    minSelections: z.number().int().optional(),
    maxSelections: z.number().int().optional(),
    explanation: z.string().optional(),
  }),
});

export const fillBlankActivitySchema = z.object({
  ...baseActivitySchema,
  type: z.literal("fill-blank"),
  content: z.object({
    prompt: z.string().min(1),
    template: z.string().min(1),
    blanks: z
      .array(
        z.object({
          id: z.string().min(1),
          hint: z.string().optional(),
          placeholder: z.string().optional(),
        }),
      )
      .min(1),
    explanation: z.string().optional(),
  }),
});

export const orderingActivitySchema = z.object({
  ...baseActivitySchema,
  type: z.literal("ordering"),
  content: z.object({
    prompt: z.string().min(1),
    items: z
      .array(
        z.object({
          id: z.string().min(1),
          text: z.string().min(1),
          initialOrder: z.number().optional(),
        }),
      )
      .min(2),
    explanation: z.string().optional(),
  }),
});

export const outputPredictionActivitySchema = z.object({
  ...baseActivitySchema,
  type: z.literal("output-prediction"),
  content: z.object({
    code: z.string(),
    language: z.string().min(1),
    prompt: z.string().min(1),
    options: z.array(z.string()).optional(),
    explanation: z.string().optional(),
  }),
});

export const interactiveCodeActivitySchema = z.object({
  ...baseActivitySchema,
  type: z.literal("interactive-code"),
  content: z.object({
    title: z.string().min(1),
    prompt: z.string().min(1),
    language: z.string().min(1),
    starterCode: z.string(),
    solutionCode: z.string().optional(),
    files: z
      .array(
        z.object({
          name: z.string().min(1),
          content: z.string(),
          readOnly: z.boolean().optional(),
        }),
      )
      .optional(),
  }),
});

export const debugActivitySchema = z.object({
  ...baseActivitySchema,
  type: z.literal("debug"),
  content: z.object({
    title: z.string().min(1),
    prompt: z.string().min(1),
    buggyCode: z.string().min(1),
    language: z.string().min(1),
    bugDescription: z.string().min(1),
    hints: z.array(z.string()).optional(),
  }),
});

export const reflectionActivitySchema = z.object({
  ...baseActivitySchema,
  type: z.literal("reflection"),
  content: z.object({
    prompt: z.string().min(1),
    guidelines: z.array(z.string()).optional(),
    sampleResponse: z.string().optional(),
    minCharacters: z.number().int().optional(),
  }),
});

export const summaryActivitySchema = z.object({
  ...baseActivitySchema,
  type: z.literal("summary"),
  content: z.object({
    title: z.string().optional(),
    takeaways: z.array(z.string()).min(1),
    nextSteps: z.array(z.string()).optional(),
    reviewQuestions: z.array(z.string()).optional(),
  }),
});

export const completionActivitySchema = z.object({
  ...baseActivitySchema,
  type: z.literal("completion"),
  content: z.object({
    title: z.string().min(1),
    message: z.string().min(1),
    badgeId: z.string().optional(),
    congratulations: z.string().optional(),
  }),
});

export const activitySchema = z.discriminatedUnion("type", [
  introActivitySchema,
  explanationActivitySchema,
  codeExampleActivitySchema,
  visualActivitySchema,
  multipleChoiceActivitySchema,
  multiSelectActivitySchema,
  fillBlankActivitySchema,
  orderingActivitySchema,
  outputPredictionActivitySchema,
  interactiveCodeActivitySchema,
  debugActivitySchema,
  reflectionActivitySchema,
  summaryActivitySchema,
  completionActivitySchema,
]);

// ---------------------------------------------------------------------------
// Lesson Schema
// ---------------------------------------------------------------------------

export const lessonPrerequisitesSchema = z.object({
  lessonIds: z.array(z.string()).optional(),
  conceptIds: z.array(z.string()).optional(),
  skillIds: z.array(z.string()).optional(),
});

export const evidenceRequirementSchema = z.object({
  objectiveId: z.string().min(1),
  activityIds: z.array(z.string()).min(1),
  requirement: z.enum(["complete", "success", "minimum-score"]),
  threshold: z.number().optional(),
});

export const lessonCompletionRuleSchema = z.object({
  requiredActivityIds: z.array(z.string()).optional(),
  minimumScore: z.number().min(0).max(100).optional(),
  evidenceRequirements: z.array(evidenceRequirementSchema).optional(),
});

export const canonicalLessonSchema = z.object({
  id: z.string().min(1),
  schemaVersion: z.string().min(1),
  topicId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  lessonType: lessonTypeSchema,
  difficulty: difficultySchema,
  estimatedMinutes: z.number().int().min(1),
  conceptIds: z.array(z.string()),
  skillIds: z.array(z.string()),
  objectives: z.array(objectiveSchema).min(1),
  prerequisites: lessonPrerequisitesSchema,
  activities: z.array(activitySchema).min(1),
  completion: lessonCompletionRuleSchema,
  metadata: z.record(z.unknown()).optional(),
});

// ---------------------------------------------------------------------------
// Concept, Skill, Misconception Schemas
// ---------------------------------------------------------------------------

export const misconceptionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  conceptId: z.string().min(1),
  indicators: z.array(z.string()),
  correction: z.string().min(1),
});

export const conceptSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  definition: z.string().min(1),
  topicId: z.string().min(1),
  prerequisiteConceptIds: z.array(z.string()),
  relatedConceptIds: z.array(z.string()),
  misconceptionIds: z.array(z.string()),
});

export const skillSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  topicId: z.string().min(1),
  conceptIds: z.array(z.string()),
  difficulty: difficultySchema,
  prerequisiteSkillIds: z.array(z.string()),
});

// ---------------------------------------------------------------------------
// Topic, Module, Level, Academy Schemas
// ---------------------------------------------------------------------------

export const canonicalTopicSchema = z.object({
  id: z.string().min(1),
  moduleId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  order: z.number().int().min(1),
  conceptIds: z.array(z.string()),
  skillIds: z.array(z.string()),
  lessonIds: z.array(z.string()),
});

export const canonicalModuleSchema = z.object({
  id: z.string().min(1),
  levelId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  order: z.number().int().min(1),
  topicIds: z.array(z.string()),
});

export const canonicalLevelSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  order: z.number().int().min(1),
  moduleIds: z.array(z.string()),
});

export const academySchema = z.object({
  id: z.string().min(1),
  schemaVersion: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  levels: z.array(canonicalLevelSchema),
});

// ---------------------------------------------------------------------------
// Validation Helper Functions
// ---------------------------------------------------------------------------

export function validateActivity(data: unknown): CanonicalActivity {
  return activitySchema.parse(data);
}

export function validateLesson(data: unknown): CanonicalLesson {
  return canonicalLessonSchema.parse(data);
}

export function validateConcept(data: unknown): Concept {
  return conceptSchema.parse(data);
}

export function validateSkill(data: unknown): Skill {
  return skillSchema.parse(data);
}

export function validateMisconception(data: unknown): Misconception {
  return misconceptionSchema.parse(data);
}

export function validateTopic(data: unknown): CanonicalTopic {
  return canonicalTopicSchema.parse(data);
}

export function validateModule(data: unknown): CanonicalModule {
  return canonicalModuleSchema.parse(data);
}

export function validateLevel(data: unknown): CanonicalLevel {
  return canonicalLevelSchema.parse(data);
}

export function validateAcademy(data: unknown): Academy {
  return academySchema.parse(data);
}

export interface CurriculumIntegrityReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateCurriculumIntegrity(context: {
  academy: Academy;
  levels: CanonicalLevel[];
  modules: CanonicalModule[];
  topics: CanonicalTopic[];
  concepts: Concept[];
  skills: Skill[];
  misconceptions: Misconception[];
  lessons: CanonicalLesson[];
}): CurriculumIntegrityReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  const levelIds = new Set(context.levels.map((l) => l.id));
  const moduleIds = new Set(context.modules.map((m) => m.id));
  const topicIds = new Set(context.topics.map((t) => t.id));
  const conceptIds = new Set(context.concepts.map((c) => c.id));
  const skillIds = new Set(context.skills.map((s) => s.id));
  const misconceptionIds = new Set(context.misconceptions.map((m) => m.id));
  const lessonIds = new Set(context.lessons.map((l) => l.id));

  // Check Academy Level references
  for (const lvl of context.academy.levels) {
    if (!levelIds.has(lvl.id)) {
      errors.push(`Academy references missing level: ${lvl.id}`);
    }
  }

  // Check Level Module references
  for (const lvl of context.levels) {
    for (const modId of lvl.moduleIds) {
      if (!moduleIds.has(modId)) {
        errors.push(`Level ${lvl.id} references missing module: ${modId}`);
      }
    }
  }

  // Check Module Topic references
  for (const mod of context.modules) {
    if (!levelIds.has(mod.levelId)) {
      errors.push(`Module ${mod.id} references missing parent level: ${mod.levelId}`);
    }
    for (const tId of mod.topicIds) {
      if (!topicIds.has(tId)) {
        errors.push(`Module ${mod.id} references missing topic: ${tId}`);
      }
    }
  }

  // Check Topic references
  for (const top of context.topics) {
    if (!moduleIds.has(top.moduleId)) {
      errors.push(`Topic ${top.id} references missing parent module: ${top.moduleId}`);
    }
    for (const cId of top.conceptIds) {
      if (!conceptIds.has(cId)) {
        warnings.push(`Topic ${top.id} references unregistered concept: ${cId}`);
      }
    }
    for (const sId of top.skillIds) {
      if (!skillIds.has(sId)) {
        warnings.push(`Topic ${top.id} references unregistered skill: ${sId}`);
      }
    }
  }

  // Check Concept & Misconception references
  for (const con of context.concepts) {
    for (const miscId of con.misconceptionIds) {
      if (!misconceptionIds.has(miscId)) {
        warnings.push(`Concept ${con.id} references missing misconception: ${miscId}`);
      }
    }
  }

  // Check Lesson references
  for (const les of context.lessons) {
    if (!topicIds.has(les.topicId)) {
      errors.push(`Lesson ${les.id} references missing topic: ${les.topicId}`);
    }
    for (const cId of les.conceptIds) {
      if (!conceptIds.has(cId)) {
        warnings.push(`Lesson ${les.id} references unregistered concept: ${cId}`);
      }
    }
    for (const sId of les.skillIds) {
      if (!skillIds.has(sId)) {
        warnings.push(`Lesson ${les.id} references unregistered skill: ${sId}`);
      }
    }
    // Check activity IDs uniqueness inside lesson
    const actIds = new Set<string>();
    for (const act of les.activities) {
      if (actIds.has(act.id)) {
        errors.push(`Lesson ${les.id} contains duplicate activity ID: ${act.id}`);
      }
      actIds.add(act.id);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
