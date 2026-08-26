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

  it("renders stacked CODE -> BROWSER OUTPUT -> HOW IT WORKS for HTML examples", () => {
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
    expect(container.textContent).toContain("Code");
    expect(container.textContent).toContain("<h1>Hello World</h1>");
    expect(container.textContent).toContain("Browser Output");
    expect(container.querySelector("iframe")).not.toBeNull();
    expect(container.textContent).toContain("How It Works");
    expect(container.textContent).toContain("Main heading element defining primary topic.");

    act(() => {
      root?.unmount();
    });
    document.body.removeChild(container);
  });

  it("does NOT render HTML Browser Output for non-HTML examples (e.g. JavaScript)", () => {
    const jsActivity: CodeExampleActivity = {
      id: "act-js-example",
      type: "code-example",
      intent: "understanding",
      order: 1,
      objectiveIds: ["obj-js"],
      content: {
        title: "JS Variables Study",
        description: "Examine JS variable declarations.",
        code: "const x = 42;\nconsole.log(x);",
        language: "javascript",
        annotations: [{ line: 1, comment: "Declares a constant variable named x." }],
      },
    };

    const container = document.createElement("div");
    document.body.appendChild(container);
    let root: Root | null = null;

    act(() => {
      root = createRoot(container);
      root.render(
        <CodeExampleRenderer activity={jsActivity} state={mockState} onContinue={vi.fn()} />,
      );
    });

    expect(container.textContent).toContain("JS Variables Study");
    expect(container.textContent).toContain("Code");
    expect(container.textContent).toContain("const x = 42;");
    expect(container.textContent).not.toContain("Browser Output");
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.textContent).toContain("How It Works");
    expect(container.textContent).toContain("Declares a constant variable named x.");

    act(() => {
      root?.unmount();
    });
    document.body.removeChild(container);
  });
});
