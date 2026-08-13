const fs = require("fs");

const lessonsPath = "./src/data/lessons.json";
const data = JSON.parse(fs.readFileSync(lessonsPath, "utf8"));

let migratedCount = 0;
const migratedIds = [];

const applyAssessment = (lessonId, checkpointId, config) => {
  const lesson = data.find((l) => l.id === lessonId);
  if (!lesson) return false;

  const checkpoint = lesson.sections.find((s) => s.type === "checkpoint" && s.id === checkpointId);
  if (!checkpoint) return false;

  checkpoint.assessment = config;
  migratedCount++;
  migratedIds.push(checkpointId);
  return true;
};

// 1. checkpoint-1-3-1
applyAssessment("lesson-1-3-1", "checkpoint-1-3-1", {
  type: "multiple-choice",
  question:
    "Which of the following correctly describes the sequence of a typical browser interaction?",
  options: [
    { id: "opt-1", label: "JavaScript re-compiles the HTML source code when an event happens." },
    {
      id: "opt-2",
      label:
        "An event occurs, JavaScript logic responds, and updates the DOM, causing the browser to re-render the visible change.",
    },
    {
      id: "opt-3",
      label:
        "The browser redraws the page first, which triggers an event that JavaScript then records.",
    },
  ],
  correctAnswer: "opt-2",
  feedback: {
    correct:
      "Exactly. The DOM represents the live interface, and modifying it triggers the browser's update process.",
    incorrect:
      "Consider the cause-and-effect relationship between user action, programmatic logic, and visual output.",
  },
});

// 2. checkpoint-1-2-2
applyAssessment("lesson-1-2-2", "checkpoint-1-2-2", {
  type: "output-prediction",
  question:
    'Consider this CSS:\n\nh1 {\n  color: red;\n}\n\n.header-title {\n  color: blue;\n}\n\n#main-heading {\n  color: green;\n}\n\nIf an element has all three identifiers `<h1 id="main-heading" class="header-title">`, what is the computed color? (Type the color name)',
  correctAnswer: "green",
  feedback: {
    correct:
      "Correct! The ID selector (#main-heading) has higher specificity than the class (.header-title) and type (h1) selectors.",
    incorrect:
      "Check the specificity hierarchy. Which selector type carries the most weight: type, class, or ID?",
  },
});

// 3. checkpoint-0-2-3
applyAssessment("lesson-0-2-3", "checkpoint-0-2-3", {
  type: "true-false",
  question:
    "True or False: When a page throws a long string of cascading runtime errors in the Console, the best strategy is usually to start investigating the very last error in the list because it caused the crash.",
  correctAnswer: false,
  feedback: {
    correct:
      "Correct. You should generally investigate the FIRST relevant error, as later errors are often just side effects of the initial failure.",
    incorrect:
      "Think about cause and effect. Do later errors cause earlier ones, or do earlier errors cause later ones to fail?",
  },
});

// 4. checkpoint-1-3-2
applyAssessment("lesson-1-3-2", "checkpoint-1-3-2", {
  type: "multiple-select",
  question:
    "Which of the following statements about let and const are correct? (Select all that apply)",
  options: [
    { id: "opt-1", label: "Variables declared with let can be reassigned." },
    { id: "opt-2", label: "Variables declared with const can be reassigned." },
    { id: "opt-3", label: "Variables declared with const cannot be reassigned." },
    { id: "opt-4", label: "let and const are block-scoped." },
  ],
  correctAnswer: ["opt-1", "opt-3", "opt-4"],
  feedback: {
    correct:
      "Correct! let is used for values that change, const for values that do not, and both are scoped to the block they are defined in.",
    incorrect: "Review the rules of reassignment and block scope for modern JavaScript variables.",
  },
});

// 5. checkpoint-1-2-3
applyAssessment("lesson-1-2-3", "checkpoint-1-2-3", {
  type: "output-prediction",
  question:
    'Consider this CSS:\n\n.alert {\n  background-color: yellow;\n}\n\n.alert {\n  background-color: orange;\n}\n\nWhat is the computed background color for an element with class="alert"? (Type the color name)',
  correctAnswer: "orange",
  feedback: {
    correct:
      "Correct! When specificity is identical, the cascade resolves the conflict using source order, so the later rule wins.",
    incorrect: "When two selectors have the exact same specificity, what is the tie-breaker?",
  },
});

// 6. checkpoint-1-2-9 (Flexbox)
applyAssessment("lesson-1-2-9", "checkpoint-1-2-9", {
  type: "sandbox-completion",
  lessonId: "lesson-1-2-9",
  sandboxId: "interactive-1-2-9-4",
});

// 7. checkpoint-1-2-10 (Grid)
applyAssessment("lesson-1-2-10", "checkpoint-1-2-10", {
  type: "sandbox-completion",
  lessonId: "lesson-1-2-10",
  sandboxId: "interactive-1-2-10-3",
});

// 9. checkpoint-4-5-2
applyAssessment("lesson-4-5-2", "checkpoint-4-5-2", {
  type: "multiple-choice",
  question:
    "In React's rendering flow, what is the difference between the 'render' phase and the 'commit' phase?",
  options: [
    {
      id: "opt-1",
      label: "Render calculates the DOM changes; Commit applies them to the actual browser DOM.",
    },
    { id: "opt-2", label: "Render executes useEffect hooks; Commit calls the component function." },
    { id: "opt-3", label: "Render replaces the entire DOM tree; Commit checks for memory leaks." },
  ],
  correctAnswer: "opt-1",
  feedback: {
    correct:
      "Correct! React separates calculating the UI changes (rendering/reconciliation) from applying them (commit).",
    incorrect: "Think about how React minimizes actual browser DOM updates.",
  },
});

// 10. checkpoint-4-1-3
applyAssessment("lesson-4-1-3", "checkpoint-4-1-3", {
  type: "sandbox-completion",
  lessonId: "lesson-4-1-3",
  sandboxId: "interactive-4-1-3-1",
});

// 11. checkpoint-4-1-4
applyAssessment("lesson-4-1-4", "checkpoint-4-1-4", {
  type: "sandbox-completion",
  lessonId: "lesson-4-1-4",
  sandboxId: "interactive-4-1-4-1",
});

// 12. checkpoint-5-2-1
applyAssessment("lesson-5-2-1", "checkpoint-5-2-1", {
  type: "sandbox-completion",
  lessonId: "lesson-5-2-1",
  sandboxId: "interactive-5-2-1-1",
});

// 13. checkpoint-5-2-3
applyAssessment("lesson-5-2-3", "checkpoint-5-2-3", {
  type: "sandbox-completion",
  lessonId: "lesson-5-2-3",
  sandboxId: "interactive-5-2-3-1",
});

// 15. checkpoint-4-2-2
applyAssessment("lesson-4-2-2", "checkpoint-4-2-2", {
  type: "multiple-select",
  question:
    "Which of the following are valid reasons to cache client-side data? (Select all that apply)",
  options: [
    {
      id: "opt-1",
      label:
        "To prevent a redundant network request when navigating back to a recently visited view.",
    },
    { id: "opt-2", label: "To guarantee that the data never goes out of sync with the server." },
    { id: "opt-3", label: "To provide an immediate UI render while a background refresh occurs." },
  ],
  correctAnswer: ["opt-1", "opt-3"],
  feedback: {
    correct:
      "Correct. Caching speeds up the UI and reduces duplicate fetches, but it explicitly risks becoming out of sync, which requires a synchronization strategy.",
    incorrect:
      "Consider the tradeoffs of caching. Does caching guarantee freshness, or does it introduce the risk of staleness?",
  },
});

fs.writeFileSync(lessonsPath, JSON.stringify(data, null, 2));

console.log(JSON.stringify({ migratedCount, migratedIds }));
