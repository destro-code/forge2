import type { LessonExperienceDefinition } from "./types";

const base = (id: string, title: string, description: string) => ({
  lesson: { id, title, description },
});
const exp = (
  id: string,
  kind: any,
  title: string,
  purpose: string,
  content: any,
  completion: any,
) => ({ id, kind, title, purpose, content, completion });

export const LAB_LESSONS: LessonExperienceDefinition[] = [
  {
    ...base(
      "lab-prediction",
      "The Memory Relay",
      "A prediction-first lesson about state changing hands.",
    ),
    experiences: [
      exp(
        "hook",
        "hook",
        "A value can move",
        "Create tension",
        {
          heading: "Where did the value go?",
          body: "A small state change can alter everything downstream.",
          punchline: "Make a call before we explain it.",
        },
        { rule: "acknowledge" },
      ),
      exp(
        "model",
        "visual",
        "Watch the relay",
        "Build a mental model",
        {
          heading: "Step through the relay",
          description: "Each frame changes who owns the current value.",
          frames: [
            {
              id: "start",
              label: "Start",
              code: "signal = 1",
              memoryValue: "1",
              description: "The signal begins here.",
            },
            {
              id: "handoff",
              label: "Handoff",
              code: "next = signal",
              memoryValue: "1",
              description: "The next variable receives the value.",
            },
            {
              id: "change",
              label: "Change",
              code: "signal = 2",
              memoryValue: "2",
              description: "The original can change without rewriting the copy.",
            },
          ],
        },
        { rule: "interact-all", targetIds: ["start", "handoff", "change"] },
      ),
      exp(
        "predict",
        "prediction",
        "Call the result",
        "Commit before feedback",
        {
          heading: "Predict the next state",
          codeSnippet: "let count = 3;\ncount = count + 1;",
          question: "What does count hold after the second line?",
          options: [
            { id: "three", label: "3" },
            { id: "four", label: "4" },
            { id: "undefined", label: "undefined" },
          ],
          correctOptionId: "four",
          explanation: "The assignment stores the new value back in count.",
        },
        { rule: "correct-response" },
      ),
      exp(
        "explain",
        "explanation",
        "Name the pattern",
        "Consolidate the model",
        {
          heading: "State is a record, not a label",
          paragraphs: [
            "A variable name points to a current value.",
            "Assignment changes the stored value for future reads.",
          ],
        },
        { rule: "acknowledge" },
      ),
      exp(
        "mastery",
        "mastery-check",
        "Show me",
        "Transfer the idea",
        {
          heading: "Use the idea somewhere new",
          question: "What is the final value?",
          options: [
            { id: "seven", label: "7" },
            { id: "eight", label: "8" },
          ],
          correctOptionId: "eight",
          successMessage: "You transferred the model.",
          retryMessage: "Trace the second assignment again.",
        },
        { rule: "correct-response" },
      ),
    ],
  },
  {
    ...base("lab-code", "The Tiny Machine", "A code-first loop from experiment to repair."),
    experiences: [
      exp(
        "hook",
        "hook",
        "The machine is waiting",
        "Create tension",
        { heading: "One line changes the machine", body: "Run it. Watch what moves." },
        { rule: "acknowledge" },
      ),
      exp(
        "predict",
        "prediction",
        "Before you run",
        "Commit before feedback",
        {
          heading: "What will print?",
          codeSnippet: "const mode = 'quiet';",
          question: "What does mode contain?",
          options: [
            { id: "quiet", label: "quiet" },
            { id: "loud", label: "loud" },
          ],
          correctOptionId: "quiet",
          explanation: "The initializer gives mode its first value.",
        },
        { rule: "correct-response" },
      ),
      exp(
        "experiment",
        "sandbox-experiment",
        "Change the machine",
        "Explore through execution",
        {
          heading: "Make a small change",
          instructions: "Run the starter code and observe the output.",
          starterSource: "const message = 'hello';\nconsole.log(message);",
          language: "javascript",
        },
        { rule: "run-executed" },
      ),
      exp(
        "explain",
        "explanation",
        "Read the trace",
        "Explain the output",
        {
          heading: "Output is evidence",
          paragraphs: [
            "The console shows the value at the moment you log it.",
            "Change the source, then run again to test a new hypothesis.",
          ],
        },
        { rule: "acknowledge" },
      ),
      exp(
        "challenge",
        "challenge",
        "Repair the output",
        "Apply the model",
        {
          heading: "Make the output say forge",
          instructions: "Change the string so the program logs forge.",
          starterSource: "const message = 'hello';\nconsole.log(message);",
          language: "javascript",
          testCases: [
            {
              id: "logs-forge",
              description: "message contains forge",
              expression: "message === 'forge'",
            },
          ],
        },
        { rule: "validation-passed" },
      ),
      exp(
        "mastery",
        "mastery-check",
        "Transfer the fix",
        "Prove independent understanding",
        {
          heading: "A fresh machine",
          question: "Which change makes the output 'ready'?",
          options: [
            { id: "a", label: "const state = 'ready'" },
            { id: "b", label: "const state = 'waiting'" },
          ],
          correctOptionId: "a",
          successMessage: "You can apply the pattern.",
          retryMessage: "Look for the initializer.",
        },
        { rule: "correct-response" },
      ),
    ],
  },
  {
    ...base("lab-debug", "The Missing Signal", "A debugging loop built around observation."),
    experiences: [
      exp(
        "hook",
        "hook",
        "Something is missing",
        "Create a debugging question",
        {
          heading: "The screen is quiet",
          body: "Your job is not to guess faster. It is to observe better.",
        },
        { rule: "acknowledge" },
      ),
      exp(
        "observe",
        "visual",
        "Observe the path",
        "Make state visible",
        {
          heading: "Find the signal",
          description: "Inspect each checkpoint in the path.",
          frames: [
            {
              id: "input",
              label: "Input",
              code: "input = 'go'",
              memoryValue: "go",
              description: "The signal enters.",
            },
            {
              id: "guard",
              label: "Guard",
              code: "if (ready)",
              memoryValue: "blocked",
              description: "The guard decides whether it continues.",
            },
          ],
        },
        { rule: "interact-all", targetIds: ["input", "guard"] },
      ),
      exp(
        "predict",
        "prediction",
        "Locate the break",
        "Form a testable hypothesis",
        {
          heading: "Where does it stop?",
          codeSnippet: "const ready = false;",
          question: "What happens at the guard?",
          options: [
            { id: "blocked", label: "The signal stops" },
            { id: "passes", label: "The signal passes" },
          ],
          correctOptionId: "blocked",
          explanation: "The guard is false, so the guarded path does not run.",
        },
        { rule: "correct-response" },
      ),
      exp(
        "apply",
        "explanation",
        "Apply the diagnosis",
        "Turn diagnosis into action",
        {
          heading: "Change the condition",
          paragraphs: [
            "A useful fix changes the condition that caused the observed behavior.",
            "Then rerun the smallest possible test.",
          ],
        },
        { rule: "acknowledge" },
      ),
      exp(
        "retry",
        "challenge",
        "Prove the repair",
        "Practice recovery",
        {
          heading: "Unblock the signal",
          instructions: "Set ready to true so the test passes.",
          starterSource: "const ready = false;\nconsole.log(ready);",
          language: "javascript",
          testCases: [{ id: "ready", description: "ready is true", expression: "ready === true" }],
        },
        { rule: "validation-passed" },
      ),
      exp(
        "mastery",
        "mastery-check",
        "Diagnose a fresh case",
        "Transfer debugging skill",
        {
          heading: "One last diagnosis",
          question: "What should you inspect first when output is missing?",
          options: [
            { id: "path", label: "The earliest guard on the path" },
            { id: "color", label: "The page color" },
          ],
          correctOptionId: "path",
          successMessage: "You debugged from evidence.",
          retryMessage: "Start with the execution path.",
        },
        { rule: "correct-response" },
      ),
    ],
  },
];

export const LAB_LESSON_MAP = new Map(LAB_LESSONS.map((lesson) => [lesson.lesson.id, lesson]));
