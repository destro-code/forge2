import type { LessonExperienceDefinition } from "./types";

/**
 * Isolated synthetic proof lesson. Authored directly as a typed object —
 * never imported from `lessons.json`, `original_lessons.json`, or any
 * production curriculum provider. Exists solely to demonstrate the
 * content-agnostic experience model with a genuinely varied sequence of
 * presentation styles around one small idea: JavaScript variables holding
 * (and losing) state.
 */
export const DEMO_LESSON: LessonExperienceDefinition = {
  lesson: {
    id: "demo-js-variables-hold-a-grudge",
    title: "Variables Hold a Grudge",
    description:
      "A short, synthetic proof lesson about how JavaScript variables remember state — built to test a content-agnostic experience engine, not to teach production curriculum.",
  },
  experiences: [
    {
      id: "hook-1",
      kind: "hook",
      purpose:
        "Grab attention with a relatable, humorous framing of the concept before any formal explanation.",
      title: "Your variable never forgets",
      completion: { rule: "acknowledge" },
      content: {
        heading: "Your variable never forgets a slight",
        body: 'You assign `let mood = "fine"`. Five lines later you write `mood = "not fine"`. The variable didn\'t ask why. It didn\'t need closure. It just... holds whatever you last told it, forever, until you tell it something else.',
        punchline: "Variables are the most emotionally stable thing in your codebase.",
      },
    },
    {
      id: "visual-1",
      kind: "visual",
      purpose:
        "Give a visual, non-verbal model of how a single variable's memory slot is overwritten by reassignment.",
      title: "One box, one value at a time",
      completion: { rule: "interact-all", targetIds: ["frame-1", "frame-2", "frame-3"] },
      content: {
        heading: "Watch the box, not the code",
        description:
          "Click through each step. Notice the box never grows a second compartment — the new value simply replaces the old one.",
        frames: [
          {
            id: "frame-1",
            label: "Step 1",
            code: 'let mood = "fine";',
            memoryValue: "fine",
            description: 'The box named `mood` now holds the string "fine".',
          },
          {
            id: "frame-2",
            label: "Step 2",
            code: 'mood = "not fine";',
            memoryValue: "not fine",
            description: '"fine" is gone. There is no history, no undo — just the new value.',
          },
          {
            id: "frame-3",
            label: "Step 3",
            code: 'mood = mood + "!!!";',
            memoryValue: "not fine!!!",
            description:
              "Reading `mood` on the right side happens before the box is overwritten with the result.",
          },
        ],
      },
    },
    {
      id: "prediction-1",
      kind: "prediction",
      purpose:
        "Force an explicit prediction before revealing the answer, surfacing the learner's current mental model.",
      title: "Predict before you peek",
      completion: { rule: "correct-response" },
      content: {
        heading: "What does this log?",
        codeSnippet: "let count = 3;\ncount = count + 2;\ncount = count * 2;\nconsole.log(count);",
        question: "What value does the final console.log print?",
        options: [
          { id: "opt-3", label: "3" },
          { id: "opt-5", label: "5" },
          { id: "opt-10", label: "10" },
          { id: "opt-error", label: "A runtime error" },
        ],
        correctOptionId: "opt-10",
        explanation:
          "count starts at 3, becomes 5 after adding 2, then becomes 10 after doubling. Each reassignment reads the current value first, then overwrites the box.",
      },
    },
    {
      id: "sandbox-experiment-1",
      kind: "sandbox-experiment",
      purpose:
        "Let the learner run real, sandboxed code to observe reassignment firsthand instead of only reading about it.",
      title: "Try it yourself",
      completion: { rule: "run-executed" },
      content: {
        heading: "Break it, reassign it, run it",
        instructions:
          "This code runs in a real sandboxed JavaScript environment. Change the values, add more reassignments, or leave it as-is — press Run at least once to continue.",
        language: "javascript",
        starterSource:
          'let mood = "fine";\nconsole.log("starts as:", mood);\n\nmood = "not fine";\nconsole.log("becomes:", mood);\n\n// Try adding your own reassignment below:\n',
      },
    },
    {
      id: "challenge-1",
      kind: "challenge",
      purpose:
        "Require the learner to apply the concept by writing a small amount of real code that must pass an automated check.",
      title: "Prove you can do it",
      completion: { rule: "validation-passed" },
      content: {
        heading: "Make `score` end at exactly 42",
        instructions:
          "Declare a variable named `score`, then reassign it using any combination of operations so its final value is exactly 42. Do not just write `let score = 42;` directly — reassign it at least once.",
        language: "javascript",
        starterSource: "let score = 10;\n// reassign score below so it ends up at exactly 42\n",
        testCases: [
          {
            id: "score-is-42",
            description: "score equals 42 after your code runs",
            expression: "score === 42",
          },
          {
            id: "score-was-reassigned",
            description: "score is reassigned at least once (not just declared as 42)",
            expression: '/score\\s*=[^=]/.test(__source__.split("\\n").slice(1).join("\\n"))',
          },
        ],
      },
    },
    {
      id: "explanation-1",
      kind: "explanation",
      purpose:
        "Consolidate the concept in plain language immediately after hands-on interaction, while it's still fresh.",
      title: "Why this matters",
      completion: { rule: "acknowledge" },
      content: {
        heading: "The takeaway",
        paragraphs: [
          "A variable declared with `let` or `var` is a single named slot in memory. Assignment (`=`) doesn't add a value alongside the old one — it replaces whatever was there.",
          "This is why order matters: `count = count + 2` only works because JavaScript reads the current value of `count` before the new value is written back into the same slot.",
          "Contrast this with `const`, which prevents reassignment entirely — the slot is still overwritable in spirit, but the language refuses to let you do it.",
        ],
      },
    },
    {
      id: "mastery-check-1",
      kind: "mastery-check",
      purpose:
        "Confirm the concept transferred by asking a question in a new framing, distinct from the earlier prediction.",
      title: "One last check",
      completion: { rule: "correct-response" },
      content: {
        heading: "Final check",
        question: "let x = 1;\nx = x + 1;\nx = x + 1;\nWhat is `x` afterward, and why?",
        options: [
          { id: "m-1", label: "1 — reassignment doesn't change the original box" },
          { id: "m-2", label: "2 — one of the reassignments is ignored" },
          { id: "m-3", label: "3 — each line reads the current value, then overwrites it" },
          { id: "m-4", label: "It throws, because x was already declared" },
        ],
        correctOptionId: "m-3",
        successMessage:
          "Exactly — two sequential overwrites, each starting from the previous value.",
        retryMessage:
          "Re-trace it one line at a time: what does the box hold right before each `=` runs?",
      },
    },
  ],
};
