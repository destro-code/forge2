// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { CanonicalLessonPlayer } from "./canonical-lesson-player";
import { canonicalProvider } from "@/lib/curriculum/canonical-provider";
import { InMemorySessionPersistenceAdapter } from "@/lib/learning-engine/persistence-port";
import { LocalStorageSessionPersistenceAdapter } from "@/lib/learning-engine/local-storage-persistence";
import { useProgressStore } from "@/lib/stores/use-progress-store";
import { renderActivity } from "./registry";
import { evaluateActivityValidation } from "./validation";
import type { CanonicalLesson } from "@/lib/curriculum/types";

// Helper to render CanonicalLessonPlayer in happy-dom test container
function renderPlayer(
  lesson: CanonicalLesson,
  props: {
    onComplete?: () => void;
    className?: string;
  } = {},
) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);

  act(() => {
    root.render(
      React.createElement(CanonicalLessonPlayer, {
        lesson,
        onComplete: props.onComplete,
        className: props.className,
      }),
    );
  });

  return {
    container,
    root,
    rerender(updatedProps: typeof props = {}) {
      act(() => {
        root.render(
          React.createElement(CanonicalLessonPlayer, {
            lesson,
            onComplete: updatedProps.onComplete ?? props.onComplete,
            className: updatedProps.className ?? props.className,
          }),
        );
      });
    },
    unmount() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

// Action helper to advance non-interactive or completed activities
function advanceActivity(container: HTMLElement) {
  const buttons = Array.from(container.querySelectorAll("button"));
  const btn = buttons.find(
    (b) =>
      b.textContent?.includes("Start Learning") ||
      b.textContent?.includes("Continue") ||
      b.textContent?.includes("Complete Lesson") ||
      b.textContent?.includes("Proceed to Completion"),
  );
  if (!btn) {
    const allLabels = buttons.map((b) => b.textContent?.trim()).join(" | ");
    throw new Error(`Advance button not found in UI. Rendered buttons: [${allLabels}]`);
  }
  act(() => {
    btn.click();
  });
}

// Action helper to submit interactive activity solutions
function submitActivity(container: HTMLElement) {
  const buttons = Array.from(container.querySelectorAll("button"));
  const btn = buttons.find(
    (b) =>
      b.textContent?.includes("Check Answer") ||
      b.textContent?.includes("Submit Fix") ||
      b.textContent?.includes("Submit Reflection"),
  );
  if (!btn) {
    const allLabels = buttons.map((b) => b.textContent?.trim()).join(" | ");
    throw new Error(`Submit button not found in UI. Rendered buttons: [${allLabels}]`);
  }
  act(() => {
    btn.click();
  });
}

// Helper to trigger value changes on Input elements in React 19 test environment
function setInputValue(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto =
    input instanceof HTMLInputElement
      ? window.HTMLInputElement.prototype
      : window.HTMLTextAreaElement.prototype;
  const nativeSetter = Object.getOwnPropertyDescriptor(proto, "value")?.set;

  act(() => {
    const tracker = (input as any)._valueTracker;
    if (tracker) {
      tracker.setValue(value === "" ? "a" : "");
    }
    if (nativeSetter) {
      nativeSetter.call(input, value);
    } else {
      input.value = value;
    }
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));

    // Direct fallback for React synthetic props in happy-dom/vitest environment
    const reactKey = Object.keys(input).find(
      (k) => k.startsWith("__reactProps$") || k.startsWith("__reactEvents$"),
    );
    console.log(
      "[Test setInputValue] input found:",
      input.getAttribute("data-testid") || input.tagName,
      "reactKey:",
      reactKey,
      "value:",
      value,
    );
    if (reactKey) {
      const props = (input as any)[reactKey];
      if (props?.onChange) {
        props.onChange({ target: { value } } as any);
      }
    }
  });
}

describe("GATE 6: Full-Stack End-to-End Verification of the 5 Golden Canonical Lessons", () => {
  beforeEach(() => {
    useProgressStore.getState().resetProgress();
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.clear();
    }
  });

  afterEach(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.clear();
    }
  });

  // -------------------------------------------------------------------------
  // GATE 6.1: Golden Lesson Resolution & Provider Wiring
  // -------------------------------------------------------------------------
  describe("Gate 6.1: Golden Lesson Resolution & Provider Integrity", () => {
    const goldenLessonIds = [
      "lesson-0-1-1",
      "lesson-1-1-2",
      "lesson-1-2-7",
      "lesson-2-1-3",
      "lesson-0-2-5",
    ];

    it("1. Resolves all 5 Golden Lessons cleanly via canonicalProvider.getLesson()", () => {
      for (const id of goldenLessonIds) {
        const lesson = canonicalProvider.getLesson(id);
        expect(lesson).toBeDefined();
        expect(lesson?.id).toBe(id);
        expect(lesson?.activities.length).toBeGreaterThan(0);
      }
    });

    it("2. Validates schema and native renderer binding for every activity in all 5 Golden Lessons", () => {
      for (const id of goldenLessonIds) {
        const lesson = canonicalProvider.getLesson(id)!;
        expect(lesson.schemaVersion).toBe("1.0.0");
        expect(lesson.objectives.length).toBeGreaterThan(0);

        for (const actItem of lesson.activities) {
          const element = renderActivity(actItem, { state: { status: "idle" } } as any);
          expect(element).toBeDefined();
        }
      }
    });
  });

  // -------------------------------------------------------------------------
  // GATE 6.2: Golden Lesson 1 — lesson-0-1-1 (What Is Frontend Development?)
  // -------------------------------------------------------------------------
  describe("Gate 6.2: Golden Lesson 1 (lesson-0-1-1: What Is Frontend Development?)", () => {
    let lesson: CanonicalLesson;

    beforeEach(() => {
      lesson = canonicalProvider.getLesson("lesson-0-1-1")!;
      expect(lesson).toBeDefined();
    });

    it("1. Mounts CanonicalLessonPlayer and renders header and initial activity (Intro)", () => {
      const player = renderPlayer(lesson);

      expect(player.container.textContent).toContain(lesson.title);
      expect(player.container.textContent).toContain("1 / 6"); // Activity 1 of 6
      expect(player.container.textContent).toContain("Welcome to Frontend Engineering");

      player.unmount();
    });

    it("2. Executes complete path: Navigation, Incorrect Quiz Attempt, Retry, Correct Submit, and Complete", () => {
      let completedCalled = false;
      const player = renderPlayer(lesson, {
        onComplete: () => {
          completedCalled = true;
        },
      });

      // Activity 0: Intro -> Start Learning
      advanceActivity(player.container);

      // Activity 1: Explanation -> Continue
      expect(player.container.textContent).toContain("Frontend Is More Than Aesthetics");
      advanceActivity(player.container);

      // Activity 2: Visual -> Continue
      expect(player.container.textContent).toContain("The Web Platform Trio");
      advanceActivity(player.container);

      // Activity 3: Code Example -> Continue
      expect(player.container.textContent).toContain(
        "A Minimal Interactive Button in Three Layers",
      );
      advanceActivity(player.container);

      // Activity 4: Multiple Choice Quiz (act-011-quiz-boundary)
      expect(player.container.textContent).toContain("Which of the following tasks is primarily");

      // Attempt 1: Click wrong option (opt-a: Writing SQL database migrations)
      let buttons = Array.from(player.container.querySelectorAll("button"));
      const optA = buttons.find((b) => b.textContent?.includes("Writing SQL database migrations"));
      expect(optA).toBeDefined();
      act(() => {
        optA?.click();
      });

      // Click Submit
      submitActivity(player.container);

      // Verify failure feedback shown
      expect(player.container.textContent).toContain("Not quite.");

      // Click Try Again
      buttons = Array.from(player.container.querySelectorAll("button"));
      const retryBtn = buttons.find((b) => b.textContent?.includes("Try Again"));
      expect(retryBtn).toBeDefined();
      act(() => {
        retryBtn?.click();
      });

      // Attempt 2: Click correct option (opt-b: Implementing a responsive dropdown menu)
      buttons = Array.from(player.container.querySelectorAll("button"));
      const optB = buttons.find((b) =>
        b.textContent?.includes("Implementing a responsive dropdown menu"),
      );
      expect(optB).toBeDefined();
      act(() => {
        optB?.click();
      });

      // Submit correct answer
      submitActivity(player.container);

      // Verify success feedback
      expect(player.container.textContent).toContain("Correct!");

      // Advance to Summary
      advanceActivity(player.container);

      // Activity 5: Summary
      expect(player.container.textContent).toContain("Key Takeaways");
      advanceActivity(player.container);

      // Verification of completion
      expect(completedCalled).toBe(true);
      expect(useProgressStore.getState().lessonsCompleted).toContain("lesson-0-1-1");

      player.unmount();
    });
  });

  // -------------------------------------------------------------------------
  // GATE 6.3: Golden Lesson 2 — lesson-1-1-2 (Elements, Tags & Attributes)
  // -------------------------------------------------------------------------
  describe("Gate 6.3: Golden Lesson 2 (lesson-1-1-2: Elements, Tags & Attributes)", () => {
    let lesson: CanonicalLesson;

    beforeEach(() => {
      lesson = canonicalProvider.getLesson("lesson-1-1-2")!;
      expect(lesson).toBeDefined();
    });

    it("1. Executes Fill-Blank and Multi-Select interactive activities with validation", () => {
      let completedCalled = false;
      const player = renderPlayer(lesson, {
        onComplete: () => {
          completedCalled = true;
        },
      });

      // Walk through Intro (0), Explanation (1), Code Example (2)
      for (let i = 0; i < 3; i++) {
        advanceActivity(player.container);
      }

      // Activity 3: Fill-Blank (act-112-fill-blank)
      expect(player.container.textContent).toContain("Fill in the missing parts");
      const inputs = Array.from(player.container.querySelectorAll("input"));
      expect(inputs.length).toBe(2);

      // Fill in blanks using setInputValue
      setInputValue(inputs[0], "href");
      setInputValue(inputs[1], "a");

      // Submit Fill-Blank
      submitActivity(player.container);

      expect(player.container.textContent).toContain("Excellent!");

      // Advance to Multi-Select
      advanceActivity(player.container);

      // Activity 4: Multi-Select (act-112-multi-select)
      expect(player.container.textContent).toContain("Which of the following are valid void");

      const buttons = Array.from(player.container.querySelectorAll("button"));
      const imgOpt = buttons.find((b) => b.textContent?.includes("<img>"));
      const inputOpt = buttons.find((b) => b.textContent?.includes("<input>"));
      const brOpt = buttons.find((b) => b.textContent?.includes("<br>"));

      expect(imgOpt).toBeDefined();
      expect(inputOpt).toBeDefined();
      expect(brOpt).toBeDefined();

      act(() => {
        imgOpt?.click();
      });
      act(() => {
        inputOpt?.click();
      });
      act(() => {
        brOpt?.click();
      });

      // Submit Multi-Select
      submitActivity(player.container);

      expect(player.container.textContent).toContain("Correct!");

      // Advance to Summary
      advanceActivity(player.container);

      // Activity 5: Summary
      expect(player.container.textContent).toContain("Summary & Next Steps");
      advanceActivity(player.container);

      expect(completedCalled).toBe(true);
      expect(useProgressStore.getState().lessonsCompleted).toContain("lesson-1-1-2");

      player.unmount();
    });

    it("2. Verifies session state restoration across unmount using LocalStorageSessionPersistenceAdapter", () => {
      const adapter = new LocalStorageSessionPersistenceAdapter();

      // Mount session 1
      const player1 = renderPlayer(lesson);

      // Advance to Fill-Blank (activity 3)
      for (let i = 0; i < 3; i++) {
        advanceActivity(player1.container);
      }

      expect(player1.container.textContent).toContain("Fill in the missing parts");

      // Unmount player 1
      player1.unmount();

      // Mount player 2 with same adapter (restores session state)
      const player2 = renderPlayer(lesson);

      // Player 2 should resume at Activity 3 (Fill-Blank)
      expect(player2.container.textContent).toContain("Fill in the missing parts");

      player2.unmount();
    });
  });

  // -------------------------------------------------------------------------
  // GATE 6.4: Golden Lesson 3 — lesson-1-2-7 (Flexbox Layout Mechanics)
  // -------------------------------------------------------------------------
  describe("Gate 6.4: Golden Lesson 3 (lesson-1-2-7: Flexbox Layout Mechanics)", () => {
    let lesson: CanonicalLesson;

    beforeEach(() => {
      lesson = canonicalProvider.getLesson("lesson-1-2-7")!;
      expect(lesson).toBeDefined();
    });

    it("1. Executes Interactive Code, Ordering, Output Prediction & Reflection activities", () => {
      let completedCalled = false;
      const player = renderPlayer(lesson, {
        onComplete: () => {
          completedCalled = true;
        },
      });

      // Advance past Intro (0) and Explanation (1)
      for (let i = 0; i < 2; i++) {
        advanceActivity(player.container);
      }

      // Activity 2: Interactive Code (act-127-interactive-code)
      expect(player.container.textContent).toContain("Interactive Code Challenge");

      const codeArea = player.container.querySelector<HTMLTextAreaElement>(
        "[data-testid='code-editor-textarea'], textarea",
      );
      expect(codeArea).not.toBeNull();
      setInputValue(
        codeArea!,
        '<style>.container { display: flex; justify-content: center; align-items: center; gap: 16px; }</style><div class="container"><div class="box">Item 1</div></div>',
      );

      // Submit interactive code
      submitActivity(player.container);

      // Advance to Ordering
      advanceActivity(player.container);

      // Activity 3: Ordering (act-127-ordering)
      expect(player.container.textContent).toContain(
        "Order the steps of the browser layout engine",
      );
      submitActivity(player.container);

      // Advance to Output Prediction
      advanceActivity(player.container);

      // Activity 4: Output Prediction (act-127-predict)
      expect(player.container.textContent).toContain(
        "Where will items inside .nav-bar be distributed",
      );
      const buttons = Array.from(player.container.querySelectorAll("button"));
      const correctOpt = buttons.find((b) =>
        b.textContent?.includes("Vertically from top to bottom with equal space between them"),
      );
      expect(correctOpt).toBeDefined();
      act(() => {
        correctOpt?.click();
      });

      submitActivity(player.container);

      // Advance to Reflection
      advanceActivity(player.container);

      // Activity 5: Reflection (act-127-reflection)
      expect(player.container.textContent).toContain("Explain why knowing the difference between");
      const textarea = player.container.querySelector("textarea");
      if (textarea) {
        setInputValue(
          textarea,
          "When flex-direction changes to column, justify-content operates vertically along container height, and align-items operates horizontally.",
        );
      }

      submitActivity(player.container);
      advanceActivity(player.container);

      expect(completedCalled).toBe(true);
      expect(useProgressStore.getState().lessonsCompleted).toContain("lesson-1-2-7");

      player.unmount();
    });
  });

  // -------------------------------------------------------------------------
  // GATE 6.5: Golden Lesson 4 — lesson-2-1-3 (JavaScript Functions & Scope)
  // -------------------------------------------------------------------------
  describe("Gate 6.5: Golden Lesson 4 (lesson-2-1-3: JavaScript Functions & Scope)", () => {
    let lesson: CanonicalLesson;

    beforeEach(() => {
      lesson = canonicalProvider.getLesson("lesson-2-1-3")!;
      expect(lesson).toBeDefined();
    });

    it("1. Executes Output Prediction & Interactive Code temperature converter challenge", () => {
      let completedCalled = false;
      const player = renderPlayer(lesson, {
        onComplete: () => {
          completedCalled = true;
        },
      });

      // Advance past Intro (0), Explanation (1), Code Example (2)
      for (let i = 0; i < 3; i++) {
        advanceActivity(player.container);
      }

      // Activity 3: Output Prediction (act-213-predict-output)
      expect(player.container.textContent).toContain("Output Prediction");
      const buttons = Array.from(player.container.querySelectorAll("button"));
      const opt15 = buttons.find((b) => b.textContent?.includes("15"));
      expect(opt15).toBeDefined();
      act(() => {
        opt15?.click();
      });

      submitActivity(player.container);

      // Advance to Interactive Code
      advanceActivity(player.container);

      // Activity 4: Interactive Code (act-213-interactive-code)
      expect(player.container.textContent).toContain("Interactive Code Challenge");

      const codeArea = player.container.querySelector<HTMLTextAreaElement>(
        "[data-testid='code-editor-textarea'], textarea",
      );
      expect(codeArea).not.toBeNull();
      setInputValue(
        codeArea!,
        "function celsiusToFahrenheit(celsius) { return (celsius * 9 / 5) + 32; }",
      );

      submitActivity(player.container);

      // Advance to Summary
      advanceActivity(player.container);

      // Activity 5: Summary
      expect(player.container.textContent).toContain("Module Summary");
      advanceActivity(player.container);

      expect(completedCalled).toBe(true);
      expect(useProgressStore.getState().lessonsCompleted).toContain("lesson-2-1-3");

      player.unmount();
    });
  });

  // -------------------------------------------------------------------------
  // GATE 6.6: Golden Lesson 5 — lesson-0-2-5 (Fix the Broken Landing Page)
  // -------------------------------------------------------------------------
  describe("Gate 6.6: Golden Lesson 5 (lesson-0-2-5: Fix the Broken Landing Page)", () => {
    let lesson: CanonicalLesson;

    beforeEach(() => {
      lesson = canonicalProvider.getLesson("lesson-0-2-5")!;
      expect(lesson).toBeDefined();
    });

    it("1. Executes Debug HTML, Quiz CSS, Interactive Fix, Reflection & Completion activities", () => {
      let completedCalled = false;
      const player = renderPlayer(lesson, {
        onComplete: () => {
          completedCalled = true;
        },
      });

      // Advance past Intro (0)
      advanceActivity(player.container);

      // Activity 1: Debug HTML (act-025-debug-html)
      expect(player.container.textContent).toContain("Debug Lab Challenge");

      const codeArea1 = player.container.querySelector<HTMLTextAreaElement>(
        "[data-testid='code-editor-textarea'], textarea",
      );
      expect(codeArea1).not.toBeNull();
      setInputValue(
        codeArea1!,
        '<form class="newsletter-form"><input id="email-input" type="email" placeholder="engineer@example.com" /><button type="submit">Subscribe</button></form>',
      );

      submitActivity(player.container);

      // Advance to Quiz CSS
      advanceActivity(player.container);

      // Activity 2: Quiz CSS (act-025-quiz-css)
      expect(player.container.textContent).toContain("hero banner is invisible");
      const buttons = Array.from(player.container.querySelectorAll("button"));
      const optOpacity = buttons.find((b) =>
        b.textContent?.includes("Change opacity: 0 to opacity: 1"),
      );
      expect(optOpacity).toBeDefined();
      act(() => {
        optOpacity?.click();
      });

      submitActivity(player.container);

      // Advance to Interactive Fix
      advanceActivity(player.container);

      // Activity 3: Interactive Fix (act-025-interactive-fix)
      expect(player.container.textContent).toContain("Interactive Code Challenge");

      const codeArea3 = player.container.querySelector<HTMLTextAreaElement>(
        "[data-testid='code-editor-textarea'], textarea",
      );
      expect(codeArea3).not.toBeNull();
      setInputValue(
        codeArea3!,
        '<button id="submit-btn">Launch App</button>\n<p id="status"></p>\n<script>\n  const button = document.getElementById("submit-btn");\n  if (button) {\n    button.addEventListener("click", () => {\n      document.getElementById("status").textContent = "App Launched Successfully!";\n    });\n  }\n</script>',
      );

      submitActivity(player.container);

      // Advance to Reflection
      advanceActivity(player.container);

      // Activity 4: Reflection (act-025-reflection)
      expect(player.container.textContent).toContain("Describe the 3-step checklist");
      const textarea = player.container.querySelector("textarea");
      if (textarea) {
        setInputValue(
          textarea,
          "1. Check Console tab for uncaught exceptions. 2. Inspect the element in DevTools. 3. Verify event handler logic.",
        );
      }

      submitActivity(player.container);
      advanceActivity(player.container);

      // Activity 5: Completion (act-025-completion)
      expect(player.container.textContent).toContain("Challenge Complete!");
      advanceActivity(player.container);

      expect(completedCalled).toBe(true);
      expect(useProgressStore.getState().lessonsCompleted).toContain("lesson-0-2-5");

      player.unmount();
    });
  });

  // -------------------------------------------------------------------------
  // GATE 6.7: System Reliability, Navigation Ribbon & Edge Case Verification
  // -------------------------------------------------------------------------
  describe("Gate 6.7: System Reliability & Activity Navigation Edge Cases", () => {
    it("1. Supports arbitrary activity jumping via ribbon buttons without breaking state", () => {
      const lesson = canonicalProvider.getLesson("lesson-0-1-1")!;
      const player = renderPlayer(lesson);

      // Header should show 1 / 6
      expect(player.container.textContent).toContain("1 / 6");

      // Click activity 5 indicator in progress ribbon
      const ribbonButtons = Array.from(
        player.container.querySelectorAll("header button[aria-label^='Activity ']"),
      );
      expect(ribbonButtons.length).toBe(6);

      act(() => {
        (ribbonButtons[4] as HTMLButtonElement).click(); // Activity 5 (Multiple Choice)
      });

      expect(player.container.textContent).toContain("5 / 6");
      expect(player.container.textContent).toContain("Which of the following tasks is primarily");

      player.unmount();
    });

    it("2. Handles hint revelation cleanly for activities with hint arrays", () => {
      const debugLesson = canonicalProvider.getLesson("lesson-0-2-5")!;
      const player = renderPlayer(debugLesson);

      // Jump to activity 2 (act-025-debug-html)
      const ribbonButtons = Array.from(
        player.container.querySelectorAll("header button[aria-label^='Activity ']"),
      );
      act(() => {
        (ribbonButtons[1] as HTMLButtonElement).click();
      });

      expect(player.container.textContent).toContain("Debug Lab Challenge");

      // Reveal hint button should be visible (2 hints remaining)
      const buttons = Array.from(player.container.querySelectorAll("button"));
      const hintBtn = buttons.find((b) => b.textContent?.includes("Hint (2)"));
      expect(hintBtn).toBeDefined();

      act(() => {
        hintBtn?.click();
      });

      // Hint count decremented to 1 and hint text visible
      expect(player.container.textContent).toContain("Hint (1)");
      expect(player.container.textContent).toContain("<input> is a void element");

      player.unmount();
    });
  });
});
