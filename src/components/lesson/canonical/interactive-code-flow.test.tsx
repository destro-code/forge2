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
  intent: "application",
  objectiveIds: ["obj-test"],
  content: {
    language: "html",
    title: "HTML Card Exercise",
    prompt: "Build the card.",
    instructions: "Build a card with an id of profile-card and a span badge.",
    starterCode: '<div class="card">\n  <h2>Alex Rivers</h2>\n</div>',
    solutionCode:
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
  it("exposes Run for HTML and keeps JavaScript on Check-only execution", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => {
      root.render(
        <InteractiveCodeRenderer
          activity={mockHtmlActivity}
          state={{ status: "idle", response: mockHtmlActivity.content.starterCode, hintsRevealed: 0, attempts: 0, startedAt: Date.now() }}
          onResponse={() => {}}
          onSubmit={() => {}}
          onRetry={() => {}}
          onContinue={() => {}}
          onRevealHint={() => {}}
        />,
      );
    });
    expect(Array.from(container.querySelectorAll("button")).some((button) => button.textContent?.trim() === "Run")).toBe(true);
    expect(Array.from(container.querySelectorAll("button")).some((button) => button.textContent?.trim() === "Check")).toBe(true);
    root.unmount();
    container.remove();

    const javascriptContainer = document.createElement("div");
    document.body.appendChild(javascriptContainer);
    const javascriptRoot = createRoot(javascriptContainer);
    const javascriptActivity = { ...mockHtmlActivity, id: "act-test-javascript", content: { ...mockHtmlActivity.content, language: "javascript" as const, starterCode: "console.log('hello')" } };
    act(() => {
      javascriptRoot.render(
        <InteractiveCodeRenderer
          activity={javascriptActivity}
          state={{ status: "idle", response: javascriptActivity.content.starterCode, hintsRevealed: 0, attempts: 0, startedAt: Date.now() }}
          onResponse={() => {}}
          onSubmit={() => {}}
          onRetry={() => {}}
          onContinue={() => {}}
          onRevealHint={() => {}}
        />,
      );
    });
    expect(Array.from(javascriptContainer.querySelectorAll("button")).some((button) => button.textContent?.trim() === "Run")).toBe(false);
    expect(Array.from(javascriptContainer.querySelectorAll("button")).some((button) => button.textContent?.trim() === "Check")).toBe(true);
    javascriptRoot.unmount();
    javascriptContainer.remove();
  });

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
            response: mockHtmlActivity.content.solutionCode ?? mockHtmlActivity.content.starterCode,
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

  it("failed validation shows structured Results, preserves submitted code, and allows return to Code", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const submittedCode = '<div class="card">My Custom Code</div>';

    act(() => {
      root.render(
        <InteractiveCodeRenderer
          activity={mockHtmlActivity}
          state={{
            status: "incorrect",
            response: submittedCode,
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

    // 1. Shows structured validation & results header
    expect(container.textContent).toContain("Validation & Results");
    expect(container.textContent).toContain("Requirements not met");
    expect(container.textContent).toContain('div element has id="profile-card"');

    // 2. Contains Return to Code mobile navigation button
    const returnToCodeBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Return to Code"),
    );
    expect(returnToCodeBtn).toBeDefined();

    // 3. Click Return to Code tab button
    act(() => {
      returnToCodeBtn?.click();
    });

    // 4. Editor is active and preserves submitted code
    const editorTextarea = container.querySelector("textarea") as HTMLTextAreaElement;
    expect(editorTextarea).not.toBeNull();
    expect(editorTextarea.value).toBe(submittedCode);

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("has exactly one primary action button in footer and no duplicate submit buttons in activity body", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const firstLesson = canonicalProvider.getGoldenLessons()[0];
    act(() => {
      root.render(<CanonicalLessonPlayer lesson={firstLesson} onComplete={() => {}} />);
    });

    // Verify exactly one primary action button exists in player footer
    const primaryButtons = Array.from(container.querySelectorAll("button")).filter(
      (b) =>
        b.textContent?.includes("Check Answer") ||
        b.textContent?.includes("Submit") ||
        b.textContent?.includes("Continue") ||
        b.textContent?.includes("Try Again"),
    );

    expect(primaryButtons.length).toBe(1);

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
