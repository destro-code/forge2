/**
 * Machine-Readable Curriculum Migration Contract
 * Explicitly maps legacy fields and structures to frozen Canonical structures.
 */

export type SupportLevel =
  "SUPPORTED" | "TRANSFORMABLE" | "REQUIRES_REVIEW" | "UNSUPPORTED" | "BLOCKED";

export interface FieldMappingRule {
  sourceField: string;
  targetField: string;
  supportLevel: SupportLevel;
  ruleDescription: string;
  fallbackBehavior?: string;
}

export interface ActivityConversionRule {
  legacyType: string;
  canonicalType: string;
  supportLevel: SupportLevel;
  ruleDescription: string;
  blockingCondition?: string;
  warningTrigger?: string;
}

export const MIGRATION_CONTRACT = {
  version: "1.0.0",
  description: "Bridges Legacy Lesson (v0) and Frozen Canonical Lesson (v1) schemas.",

  // 1. Identity Mapping
  identity: {
    sourceSchema: "LegacyLesson",
    targetSchema: "CanonicalLesson",
    idMapping: "Direct mapping of Lesson ID (e.g. 'lesson-0-1-1' -> 'lesson-0-1-1').",
  },

  // 2. Field Mapping Contract
  fieldMappings: [
    {
      sourceField: "id",
      targetField: "id",
      supportLevel: "SUPPORTED",
      ruleDescription: "Mapped directly to uniquely identify the canonical lesson.",
    },
    {
      sourceField: "topicId",
      targetField: "topicId",
      supportLevel: "SUPPORTED",
      ruleDescription: "Mapped directly to link the lesson to its parenting topic.",
    },
    {
      sourceField: "title",
      targetField: "title",
      supportLevel: "SUPPORTED",
      ruleDescription: "Title mapped directly. Must be a non-empty string.",
    },
    {
      sourceField: "description",
      targetField: "description",
      supportLevel: "SUPPORTED",
      ruleDescription:
        "Description mapped directly. Must be a non-empty string explaining the lesson context.",
    },
    {
      sourceField: "difficulty",
      targetField: "difficulty",
      supportLevel: "SUPPORTED",
      ruleDescription:
        "Enum value parsed directly. Valid options: 'Beginner', 'Intermediate', 'Advanced'.",
    },
    {
      sourceField: "estimatedMinutes",
      targetField: "estimatedMinutes",
      supportLevel: "SUPPORTED",
      ruleDescription: "Integer parsed directly. Fallback to 15 if missing or 0.",
      fallbackBehavior: "15",
    },
    {
      sourceField: "mastery",
      targetField: "activities[type=intro].content.context",
      supportLevel: "TRANSFORMABLE",
      ruleDescription:
        "Legacy mastery string transformed into the 'context' property of the starting Intro activity.",
    },
    {
      sourceField: "learningObjectives",
      targetField: "objectives",
      supportLevel: "TRANSFORMABLE",
      ruleDescription:
        "Array of raw objective strings transformed into structured Objective records containing skill/concept references.",
    },
    {
      sourceField: "prerequisites",
      targetField: "prerequisites.lessonIds",
      supportLevel: "SUPPORTED",
      ruleDescription:
        "Legacy array of prerequisite lesson IDs mapped directly into prerequisites object.",
    },
    {
      sourceField: "sections",
      targetField: "activities",
      supportLevel: "TRANSFORMABLE",
      ruleDescription:
        "Legacy content elements parsed, grouped, and mapped sequentially into individual activities (explanation, code-example, etc.).",
    },
    {
      sourceField: "exercises",
      targetField: "activities",
      supportLevel: "TRANSFORMABLE",
      ruleDescription:
        "Legacy exercises converted into interactive-code or debug activities based on presence of bugId.",
    },
    {
      sourceField: "quiz",
      targetField: "activities",
      supportLevel: "TRANSFORMABLE",
      ruleDescription:
        "Legacy quizzes mapped into multiple-choice canonical activities with exact-match validation rules.",
    },
    {
      sourceField: "summary",
      targetField: "activities[type=summary].content.takeaways",
      supportLevel: "TRANSFORMABLE",
      ruleDescription:
        "Summary string mapped to canonical takeaways array inside a summary activity.",
    },
    {
      sourceField: "resources",
      targetField: "metadata.resources",
      supportLevel: "SUPPORTED",
      ruleDescription:
        "Legacy references/external links stored natively in extensible lesson metadata dictionary.",
    },
    {
      sourceField: "interviewQuestions",
      targetField: "metadata.interviewQuestions",
      supportLevel: "SUPPORTED",
      ruleDescription:
        "Legacy interview review questions stored natively in extensible lesson metadata dictionary.",
    },
  ] as FieldMappingRule[],

  // 3. Activity Conversion rules
  activityConversions: [
    {
      legacyType: "heading",
      canonicalType: "explanation",
      supportLevel: "TRANSFORMABLE",
      ruleDescription:
        "Flushes preceding explanation items and opens a new explanation block with the heading text as title.",
    },
    {
      legacyType: "paragraph",
      canonicalType: "explanation",
      supportLevel: "SUPPORTED",
      ruleDescription: "Appended sequentially to the current active explanation text segment.",
    },
    {
      legacyType: "callout",
      canonicalType: "explanation",
      supportLevel: "SUPPORTED",
      ruleDescription: "Transformed into an explanation activity utilizing the callout structure.",
    },
    {
      legacyType: "code",
      canonicalType: "code-example",
      supportLevel: "SUPPORTED",
      ruleDescription:
        "Converts legacy code blocks to structured code-example activities with highlighted lines.",
    },
    {
      legacyType: "diagram",
      canonicalType: "visual",
      supportLevel: "SUPPORTED",
      ruleDescription:
        "Converts legacy diagrams to canonical visual activities with description annotations.",
    },
    {
      legacyType: "interactive-sandbox",
      canonicalType: "interactive-code",
      supportLevel: "TRANSFORMABLE",
      ruleDescription:
        "Mapped directly into interactive-code activities. Recommends adding validation tests.",
      warningTrigger:
        "Interactive sandboxes often lack hard assertions; requires manual validation test-case writing.",
    },
    {
      legacyType: "checkpoint",
      canonicalType: "reflection / multi-select / ordering",
      supportLevel: "REQUIRES_REVIEW",
      ruleDescription:
        "Legacy checkpoints containing inline assessments require deep inspection to prevent conversion logic mismatch.",
      warningTrigger:
        "Assessment mode inside legacy checkpoint cannot always be inferred statically.",
    },
    {
      legacyType: "walkthrough",
      canonicalType: "multiple activities",
      supportLevel: "REQUIRES_REVIEW",
      ruleDescription:
        "Walkthrough structures containing complex progressive text are better represented as a sequence of explanations.",
      warningTrigger: "Linear walkthroughs are split into multiple flat activities.",
    },
    {
      legacyType: "collapsible",
      canonicalType: "explanation",
      supportLevel: "REQUIRES_REVIEW",
      ruleDescription:
        "Collapsible nested sections lose visual state when simplified; requires review to verify key information isn't hidden.",
    },
    {
      legacyType: "inline-quiz",
      canonicalType: "unsupported",
      supportLevel: "UNSUPPORTED",
      ruleDescription:
        "External quiz module embedding references cannot be resolved statically inside a standalone lesson structure.",
      blockingCondition:
        "Refuse to build lessons referencing unregistered inline external quizzes.",
    },
    {
      legacyType: "legacy exercise (with bugId)",
      canonicalType: "debug",
      supportLevel: "SUPPORTED",
      ruleDescription: "Creates debug activity with buggy code block and description.",
    },
    {
      legacyType: "legacy quiz",
      canonicalType: "multiple-choice",
      supportLevel: "SUPPORTED",
      ruleDescription:
        "Creates MCQ activity with exact-match validation. Multi-correct index quizzes are transformable.",
    },
  ] as ActivityConversionRule[],

  // 4. Integrity and Blocking Conditions
  blockingConditions: {
    DUPLICATE_ID: "Lesson or internal activities contain duplicate identifier strings.",
    MISSING_REQUIRED_METADATA: "Legacy lesson does not contain an ID, title, or description.",
    UNSUPPORTED_CONSTRUCT:
      "Encountered a construct flagged as UNSUPPORTED (e.g. unregistered inline quiz references).",
    SCHEMA_VALIDATION_FAILURE:
      "Resulting canonical lesson does not satisfy the strict frozen Zod schema constraints.",
    EVIDENCE_INTEGRITY_FAILURE:
      "Evidence requirements reference activity identifiers that do not exist or cannot be achieved.",
  },

  // 5. Warnings and Review Triggers
  warnings: {
    MISSING_EVIDENCE_SPEC: "Activity does not define objective or skill evidence mappings.",
    AMBIGUOUS_OBJECTIVE: "Legacy objective statement cannot be cleanly derived from context.",
    MISSING_HINT_MODEL:
      "Interactive coding and debugging tasks do not have scaffolded hints arrays.",
    PASSIVE_SEQUENCE:
      "Lesson consists purely of orientation, explanation, and summaries with zero knowledge assessments.",
  },
};
