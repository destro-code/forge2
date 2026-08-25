// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { InteractiveCodeRenderer } from "./interactive-code-renderer";
import { DebugRenderer } from "./debug-renderer";
import type { InteractiveCodeActivity, DebugActivity } from "@/lib/curriculum/types";
import type { ActivityInteractionState } from "../types";

/**
 * Robust event trigger helper to support React 19 synthetic events in happy-dom
 */
function setInputValue(input: HTMLTextAreaElement, value: string) {
  const proto = window.HTMLTextAreaElement.prototype;
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

    const reactKey = Object.keys(input).find(
      (k) =>
        k.startsWith("__reactProps$") ||
        k.startsWith("__reactEvents$") ||
        k.startsWith("__reactFiber$"),
    );
    if (reactKey) {
      const props = (input as any)[reactKey];
      if (props?.onChange) {
        props.onChange({ target: { value } } as any);
      }
    }
  });
}

describe("InteractiveCodeRenderer with CodeMirror Integration", () => {
  const mockActivity: InteractiveCodeActivity = {
    id: "act-interactive-test",
    type: "interactive-code",
    intent: "application",
    order: 1,
    content: {
      instructions: "Assign the value 42 to the variable answer.",
      starterCode: "let answer = 0;",
      language: "javascript",
      testCases: [
        {
          description: "answer equals 42",
          assertion: "answer === 42",
        },
      ],
    },
    hints: ["Try answering 42."],
  };

  const mockState: ActivityInteractionState<string> = {
    status: "idle",
    response: "let answer = 0;",
    attempts: 0,
    hintsRevealed: 0,
    startedAt: Date.now(),
  };

  function renderInteractiveCodeRenderer(props: any) {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root: Root = createRoot(container);

    act(() => {
      root.render(React.createElement(InteractiveCodeRenderer, props));
    });

    return {
      container,
      root,
      unmount() {
        act(() => {
          root.unmount();
        });
        container.remove();
      },
    };
  }

  it("renders instructions and the CodeMirror 6 editor seamlessly", () => {
    const { container, unmount } = renderInteractiveCodeRenderer({
      activity: mockActivity,
      state: mockState,
      onResponse: () => {},
    });

    expect(container.textContent).toContain("Assign the value 42 to the variable answer.");
    expect(container.querySelector("[role='textbox']")).not.toBeNull();
    unmount();
  });

  it("triggers response updates when editing code inside the editor", () => {
    const onResponseSpy = vi.fn();
    const { container, unmount } = renderInteractiveCodeRenderer({
      activity: mockActivity,
      state: mockState,
      onResponse: onResponseSpy,
    });

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea).not.toBeNull();

    setInputValue(textarea, "let answer = 42;");
    expect(onResponseSpy).toHaveBeenCalledWith("let answer = 42;");
    unmount();
  });

  it("handles resetting code back to the starter template", () => {
    const onResponseSpy = vi.fn();
    const modifiedState = { ...mockState, response: "let answer = 999;" };
    const { container, unmount } = renderInteractiveCodeRenderer({
      activity: mockActivity,
      state: modifiedState,
      onResponse: onResponseSpy,
    });

    const resetButton = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Reset Code"),
    );
    expect(resetButton).toBeDefined();

    act(() => {
      resetButton?.click();
    });

    expect(onResponseSpy).toHaveBeenCalledWith("let answer = 0;");
    unmount();
  });

  it("does not render duplicate 'Run & verify' evaluation button in content body (single-action invariant)", () => {
    const { container, unmount } = renderInteractiveCodeRenderer({
      activity: mockActivity,
      state: mockState,
      onResponse: () => {},
    });

    const buttons = Array.from(container.querySelectorAll("button"));
    const runButton = buttons.find(
      (btn) =>
        btn.textContent?.toLowerCase().includes("run & verify") ||
        btn.textContent?.toLowerCase().includes("run code"),
    );
    expect(runButton).toBeUndefined();

    // Verify utility controls like Reset Code are preserved
    const resetButton = buttons.find((btn) => btn.textContent?.includes("Reset Code"));
    expect(resetButton).toBeDefined();

    unmount();
  });

  it("automatically renders test results when evaluated via canonical player", () => {
    const evaluatedState: ActivityInteractionState<string> = {
      status: "incorrect",
      response: "let answer = 10;",
      attempts: 1,
      hintsRevealed: 0,
      startedAt: Date.now(),
    };

    const { container, unmount } = renderInteractiveCodeRenderer({
      activity: mockActivity,
      state: evaluatedState,
      onResponse: () => {},
    });

    expect(container.textContent).toContain("answer equals 42");
    unmount();
  });
});

describe("DebugRenderer with CodeMirror Integration", () => {
  const mockActivity: DebugActivity = {
    id: "act-debug-test",
    type: "debug",
    intent: "debugging",
    order: 1,
    content: {
      bugDescription: "The function is missing a return statement.",
      buggyCode: "function add(a, b) { a + b; }",
      language: "javascript",
      fixRequirements: ["Must return a + b"],
      testCases: [
        {
          description: "add(2, 3) returns 5",
          assertion: "add(2, 3) === 5",
        },
      ],
    },
    hints: ["Add the word 'return'."],
  };

  const mockState: ActivityInteractionState<string> = {
    status: "idle",
    response: "function add(a, b) { a + b; }",
    attempts: 0,
    hintsRevealed: 0,
    startedAt: Date.now(),
  };

  function renderDebugRenderer(props: any) {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root: Root = createRoot(container);

    act(() => {
      root.render(React.createElement(DebugRenderer, props));
    });

    return {
      container,
      root,
      unmount() {
        act(() => {
          root.unmount();
        });
        container.remove();
      },
    };
  }

  it("renders bug description and CodeMirror editor seamlessly", () => {
    const { container, unmount } = renderDebugRenderer({
      activity: mockActivity,
      state: mockState,
      onResponse: () => {},
    });

    expect(container.textContent).toContain("The function is missing a return statement.");
    expect(container.textContent).toContain("Must return a + b");
    expect(container.querySelector("[role='textbox']")).not.toBeNull();
    unmount();
  });

  it("triggers response updates when student changes code to fix the bug", () => {
    const onResponseSpy = vi.fn();
    const { container, unmount } = renderDebugRenderer({
      activity: mockActivity,
      state: mockState,
      onResponse: onResponseSpy,
    });

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea).not.toBeNull();

    setInputValue(textarea, "function add(a, b) { return a + b; }");
    expect(onResponseSpy).toHaveBeenCalledWith("function add(a, b) { return a + b; }");
    unmount();
  });

  it("does not render duplicate 'Test Your Fix' button in content body (single-action invariant)", () => {
    const { container, unmount } = renderDebugRenderer({
      activity: mockActivity,
      state: mockState,
      onResponse: () => {},
    });

    const buttons = Array.from(container.querySelectorAll("button"));
    const testButton = buttons.find((btn) =>
      btn.textContent?.toLowerCase().includes("test your fix"),
    );
    expect(testButton).toBeUndefined();

    // Verify utility controls like Reset Buggy Code are preserved
    const resetButton = buttons.find((btn) => btn.textContent?.includes("Reset Buggy Code"));
    expect(resetButton).toBeDefined();

    unmount();
  });
});
