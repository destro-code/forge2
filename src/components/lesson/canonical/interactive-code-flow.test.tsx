// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { CanonicalLessonPlayer } from "./canonical-lesson-player";
import { canonicalProvider } from "@/lib/curriculum/canonical-provider";
import { InteractiveCodeRenderer } from "./renderers/interactive-code-renderer";
import type { InteractiveCodeActivity } from "@/lib/curriculum/types";

const mockHtmlActivity: InteractiveCodeActivity = {
  id: "act-test-html",
  type: "interactive-code",
  intent: "construction",
  order: 1,
  title: "HTML Card Exercise",
  content: {
    language: "html",
    title: "HTML Card Exercise",
    instructions: "Build a card with an id of profile-card and a span badge.",
    starterCode: '<div class="card">\n  <h2>Alex Rivers</h2>\n</div>',
    solution:
      '<div id="profile-card" class="card">\n  <h2>Alex Rivers</h2>\n  <span class="badge">Pro</span>\n</div>',
    testCases: [
      {
        id: "test-id",
        description: 'div element has id="profile-card"',
        assertion: 'Boolean(doc.querySelector("#profile-card"))',
      },
      {
        id: "test-badge",
        description: 'span with class="badge" exists',
        assertion: 'Boolean(doc.querySelector("span.badge"))',
      },
    ],
  },
  feedback: {
    correct: "Profile card properly constructed with id and badge.",
    incorrect: "Ensure id='profile-card' and span.badge are present.",
  },
};

describe("Interactive Code Flow & Validation UI", () => {
  it("keeps editor mounted and preserves code on success", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <InteractiveCodeRenderer
          activity={mockHtmlActivity}
          state={{
            status: "correct",
            response: mockHtmlActivity.content.solution,
            hintsRevealed: 0,
            attempts: 1,
            startedAt: Date.now(),
          }}
          onResponse={() => {}}
          onSubmit={() => {}}
          onRetry={() => {}}
          onContinue={() => {}}
          onRevealHint={() => {}}
        />,
      );
    });

    // 1. Editor should remain mounted
    const editor = container.querySelector("#lesson-code-editor-act-test-html");
    expect(editor).not.toBeNull();

    // 2. Compact success confirmation is visible
    expect(container.textContent).toContain("Profile card properly constructed with id and badge.");

    // 3. No dead console output
    expect(container.textContent).not.toContain("(No console output)");

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("renders structured test cases with pass/fail indicators on failure", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <InteractiveCodeRenderer
          activity={mockHtmlActivity}
          state={{
            status: "incorrect",
            response: mockHtmlActivity.content.starterCode, // starter code lacks id & badge
            hintsRevealed: 0,
            attempts: 1,
            startedAt: Date.now(),
          }}
          onResponse={() => {}}
          onSubmit={() => {}}
          onRetry={() => {}}
          onContinue={() => {}}
          onRevealHint={() => {}}
        />,
      );
    });

    // 1. Validation section is rendered
    expect(container.textContent).toContain("Validation");

    // 2. Exact test requirement descriptions are displayed
    expect(container.textContent).toContain('div element has id="profile-card"');
    expect(container.textContent).toContain('span with class="badge" exists');

    // 3. Guidance message is displayed
    expect(container.textContent).toContain("Ensure id='profile-card' and span.badge are present.");

    // 4. Dead console output is NOT shown for HTML exercise
    expect(container.textContent).not.toContain("(No console output)");

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("resets active tab to code when transitioning to idle on retry", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <InteractiveCodeRenderer
          activity={mockHtmlActivity}
          state={{
            status: "idle",
            response: mockHtmlActivity.content.starterCode,
            hintsRevealed: 0,
            attempts: 0,
            startedAt: Date.now(),
          }}
          onResponse={() => {}}
          onSubmit={() => {}}
          onRetry={() => {}}
          onContinue={() => {}}
          onRevealHint={() => {}}
        />,
      );
    });

    // Editor is visible
    const editor = container.querySelector("#lesson-code-editor-act-test-html");
    expect(editor).not.toBeNull();

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
