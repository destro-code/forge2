// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { CodeExampleRenderer } from "./code-example-renderer";
import type { CodeExampleActivity } from "@/lib/curriculum/types";
import type { ActivityInteractionState } from "../types";

describe("CodeExampleRenderer Pedagogical UX & Preview", () => {
  const mockActivity: CodeExampleActivity = {
    id: "act-code-example-test",
    type: "code-example",
    intent: "understanding",
    order: 1,
    objectiveIds: ["obj-test"],
    content: {
      title: "HTML Fundamentals Study",
      description: "Examine how HTML structure creates webpage elements.",
      code: "<h1>Hello World</h1>\n<p>Welcome to Forge</p>",
      language: "html",
      highlightedLines: [1],
      annotations: [
        { line: 1, comment: "Main heading element defining primary topic." },
        { line: 2, comment: "Paragraph element containing introductory body copy." },
      ],
    },
  };

  const mockState: ActivityInteractionState = {
    status: "unanswered",
    attemptsCount: 0,
    startTime: Date.now(),
    response: null,
  };

  it("renders code example title, description, code lines, and anatomical callouts", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    let root: Root | null = null;

    act(() => {
      root = createRoot(container);
      root.render(
        <CodeExampleRenderer activity={mockActivity} state={mockState} onContinue={vi.fn()} />,
      );
    });

    expect(container.textContent).toContain("HTML Fundamentals Study");
    expect(container.textContent).toContain("Examine how HTML structure creates webpage elements.");
    expect(container.textContent).toContain("<h1>Hello World</h1>");
    expect(container.textContent).toContain("Anatomical Code Callouts & Line Breakdown");
    expect(container.textContent).toContain("Main heading element defining primary topic.");

    act(() => {
      root?.unmount();
    });
    document.body.removeChild(container);
  });

  it("toggles between Code, Preview, and Split view modes for HTML examples", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    let root: Root | null = null;

    act(() => {
      root = createRoot(container);
      root.render(
        <CodeExampleRenderer activity={mockActivity} state={mockState} onContinue={vi.fn()} />,
      );
    });

    // Find Preview button
    const previewBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.getAttribute("aria-label") === "View Preview",
    );
    expect(previewBtn).toBeDefined();

    // Click Preview
    act(() => {
      previewBtn?.click();
    });

    // Verify rendered output preview container is displayed
    expect(container.textContent).toContain("Rendered Output Preview");
    expect(container.querySelector("iframe")).not.toBeNull();

    act(() => {
      root?.unmount();
    });
    document.body.removeChild(container);
  });
});
