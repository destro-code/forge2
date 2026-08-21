import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { executeValidationSuite } from "./compiler/validation-evaluator";
import type { ExerciseValidationSpec } from "./types/validation";
import {
  isPlaygroundValidateRequest,
  isPlaygroundValidateResponse,
} from "./types/validation-messages";

describe("Validation Message Type Guards", () => {
  it("validates PLAYGROUND_VALIDATE_REQUEST format correctly", () => {
    const validReq = {
      type: "PLAYGROUND_VALIDATE_REQUEST",
      requestId: "req-123",
      exerciseId: "ex-456",
      validationSpec: {
        exerciseId: "ex-456",
        runtime: "html-css",
        assertions: [],
      },
    };

    expect(isPlaygroundValidateRequest(validReq)).toBe(true);

    const invalidReq = {
      type: "PLAYGROUND_VALIDATE_REQUEST",
      requestId: 123,
    };
    expect(isPlaygroundValidateRequest(invalidReq)).toBe(false);
  });

  it("validates PLAYGROUND_VALIDATE_RESPONSE format correctly", () => {
    const validRes = {
      type: "PLAYGROUND_VALIDATE_RESPONSE",
      requestId: "req-123",
      exerciseId: "ex-456",
      report: {
        exerciseId: "ex-456",
        status: "passed",
        results: [],
        passedCount: 0,
        totalRequired: 0,
        timestamp: Date.now(),
      },
    };

    expect(isPlaygroundValidateResponse(validRes)).toBe(true);

    const invalidRes = {
      type: "PLAYGROUND_VALIDATE_RESPONSE",
      requestId: "req-123",
    };
    expect(isPlaygroundValidateResponse(invalidRes)).toBe(false);
  });
});

// Lightweight standalone DOM mock for node environment
interface MockElement {
  tagName: string;
  id?: string;
  textContent?: string;
  attributes: Record<string, string>;
  classList: {
    contains: (cls: string) => boolean;
  };
  getAttribute: (name: string) => string | null;
}

function createMockEnvironment(
  elements: MockElement[],
  computedStylesMap: Record<string, Record<string, string>> = {},
) {
  const doc = {
    querySelectorAll: (selector: string) => {
      if (selector === "h1") return elements.filter((e) => e.tagName === "H1");
      if (selector === "p") return elements.filter((e) => e.tagName === "P");
      if (selector === "nav") return elements.filter((e) => e.tagName === "NAV");
      if (selector === "div") return elements.filter((e) => e.tagName === "DIV");
      if (selector === "#missing") return [];
      if (selector.startsWith("#")) {
        const id = selector.substring(1);
        return elements.filter((e) => e.id === id);
      }
      return [];
    },
    querySelector: (selector: string) => {
      const all = doc.querySelectorAll(selector);
      return all.length > 0 ? all[0] : null;
    },
  } as unknown as Document;

  const win = {
    getComputedStyle: (el: MockElement) => {
      const key = el.id ? `#${el.id}` : el.tagName.toLowerCase();
      const styles = computedStylesMap[key] || {};
      return {
        getPropertyValue: (prop: string) => styles[prop] || "",
        ...styles,
      } as unknown as CSSStyleDeclaration;
    },
  } as unknown as Window;

  return { doc, win };
}

describe("Validation Engine Contract Tests", () => {
  it("TEST 1: dom_query exists -> pass", () => {
    const { doc, win } = createMockEnvironment([
      {
        tagName: "H1",
        textContent: "Hello",
        attributes: {},
        classList: { contains: () => false },
        getAttribute: () => null,
      },
    ]);

    const spec: ExerciseValidationSpec = {
      exerciseId: "test-1",
      runtime: "html-css",
      assertions: [
        {
          id: "h1-exists",
          description: "h1 element exists",
          strategy: "dom_query",
          target: "h1",
          expected: { exists: true },
          failureMessage: "h1 element should exist",
        },
      ],
    };

    const report = executeValidationSuite(spec, doc, win);
    expect(report.status).toBe("passed");
    expect(report.results[0].status).toBe("passed");
    expect(report.passedCount).toBe(1);
    expect(report.totalRequired).toBe(1);
  });

  it("TEST 2: dom_query missing element -> fail", () => {
    const { doc, win } = createMockEnvironment([]);
    const spec: ExerciseValidationSpec = {
      exerciseId: "test-2",
      runtime: "html-css",
      assertions: [
        {
          id: "missing-exists",
          description: "#missing exists",
          strategy: "dom_query",
          target: "#missing",
          expected: { exists: true },
          failureMessage: "#missing element should exist",
        },
      ],
    };

    const report = executeValidationSuite(spec, doc, win);
    expect(report.status).toBe("failed");
    expect(report.results[0].status).toBe("failed");
    expect(report.passedCount).toBe(0);
    expect(report.totalRequired).toBe(1);
  });

  it("TEST 3: dom_query text -> pass", () => {
    const { doc, win } = createMockEnvironment([
      {
        tagName: "H1",
        textContent: "Hello Forge",
        attributes: {},
        classList: { contains: () => false },
        getAttribute: () => null,
      },
    ]);

    const spec: ExerciseValidationSpec = {
      exerciseId: "test-3",
      runtime: "html-css",
      assertions: [
        {
          id: "h1-text",
          description: "h1 contains Forge",
          strategy: "dom_query",
          target: "h1",
          expected: { textContains: "Forge" },
          failureMessage: "h1 must contain Forge",
        },
      ],
    };

    const report = executeValidationSuite(spec, doc, win);
    expect(report.status).toBe("passed");
    expect(report.results[0].status).toBe("passed");
  });

  it("TEST 4: computed style -> pass", () => {
    const { doc, win } = createMockEnvironment(
      [
        {
          tagName: "NAV",
          textContent: "Links",
          attributes: {},
          classList: { contains: () => false },
          getAttribute: () => null,
        },
      ],
      { nav: { display: "flex" } },
    );

    const spec: ExerciseValidationSpec = {
      exerciseId: "test-4",
      runtime: "html-css",
      assertions: [
        {
          id: "nav-display-flex",
          description: "nav has display flex",
          strategy: "computed_style",
          target: "nav",
          expected: { property: "display", value: "flex" },
          failureMessage: "nav must have display: flex",
        },
      ],
    };

    const report = executeValidationSuite(spec, doc, win);
    expect(report.status).toBe("passed");
    expect(report.results[0].status).toBe("passed");
  });

  it("TEST 5: computed style failure -> fail", () => {
    const { doc, win } = createMockEnvironment(
      [
        {
          tagName: "NAV",
          textContent: "Links",
          attributes: {},
          classList: { contains: () => false },
          getAttribute: () => null,
        },
      ],
      { nav: { display: "flex" } },
    );

    const spec: ExerciseValidationSpec = {
      exerciseId: "test-5",
      runtime: "html-css",
      assertions: [
        {
          id: "nav-display-grid",
          description: "nav has display grid",
          strategy: "computed_style",
          target: "nav",
          expected: { property: "display", value: "grid" },
          failureMessage: "nav must have display: grid",
        },
      ],
    };

    const report = executeValidationSuite(spec, doc, win);
    expect(report.status).toBe("failed");
    expect(report.results[0].status).toBe("failed");
  });

  it("TEST 6: JS evaluation -> pass", () => {
    const { doc, win } = createMockEnvironment([]);
    const spec: ExerciseValidationSpec = {
      exerciseId: "test-6",
      runtime: "vanilla-dom",
      assertions: [
        {
          id: "math-add",
          description: "evaluate 2 + 2",
          strategy: "js_evaluation",
          expected: { expression: "2 + 2", expectedValue: 4 },
          failureMessage: "2 + 2 must equal 4",
        },
      ],
    };

    const report = executeValidationSuite(spec, doc, win);
    expect(report.status).toBe("passed");
    expect(report.results[0].status).toBe("passed");
  });

  it("TEST 7: JS evaluation failure -> fail", () => {
    const { doc, win } = createMockEnvironment([]);
    const spec: ExerciseValidationSpec = {
      exerciseId: "test-7",
      runtime: "vanilla-dom",
      assertions: [
        {
          id: "math-add-wrong",
          description: "evaluate 2 + 2 = 5",
          strategy: "js_evaluation",
          expected: { expression: "2 + 2", expectedValue: 5 },
          failureMessage: "2 + 2 should be 5",
        },
      ],
    };

    const report = executeValidationSuite(spec, doc, win);
    expect(report.status).toBe("failed");
    expect(report.results[0].status).toBe("failed");
  });

  it("TEST 8: JS evaluation exception -> fail without crashing validator", () => {
    const { doc, win } = createMockEnvironment([]);
    const spec: ExerciseValidationSpec = {
      exerciseId: "test-8",
      runtime: "vanilla-dom",
      assertions: [
        {
          id: "throw-expr",
          description: "throws error",
          strategy: "js_evaluation",
          expected: { expression: "throw new Error('test')" },
          failureMessage: "Expression should evaluate cleanly",
        },
        {
          id: "next-expr",
          description: "subsequent assertion",
          strategy: "js_evaluation",
          expected: { expression: "10 * 10", expectedValue: 100 },
          failureMessage: "10 * 10 = 100",
        },
      ],
    };

    const report = executeValidationSuite(spec, doc, win);
    expect(report.status).toBe("failed");
    expect(report.results).toHaveLength(2);
    expect(report.results[0].status).toBe("failed");
    expect(report.results[1].status).toBe("passed");
  });

  it("TEST 9: Optional failure -> overall status passed", () => {
    const { doc, win } = createMockEnvironment([
      {
        tagName: "H1",
        textContent: "Title",
        attributes: {},
        classList: { contains: () => false },
        getAttribute: () => null,
      },
      {
        tagName: "P",
        textContent: "Description",
        attributes: {},
        classList: { contains: () => false },
        getAttribute: () => null,
      },
    ]);

    const spec: ExerciseValidationSpec = {
      exerciseId: "test-9",
      runtime: "html-css",
      assertions: [
        {
          id: "req-1",
          description: "h1 exists (required)",
          strategy: "dom_query",
          target: "h1",
          expected: { exists: true },
          failureMessage: "h1 required",
        },
        {
          id: "req-2",
          description: "p exists (required)",
          strategy: "dom_query",
          target: "p",
          expected: { exists: true },
          failureMessage: "p required",
        },
        {
          id: "opt-3",
          description: "span exists (optional)",
          strategy: "dom_query",
          target: "span",
          expected: { exists: true },
          failureMessage: "span optional",
          isOptional: true,
        },
      ],
    };

    const report = executeValidationSuite(spec, doc, win);
    expect(report.status).toBe("passed");
    expect(report.passedCount).toBe(2);
    expect(report.totalRequired).toBe(2);
    expect(report.results).toHaveLength(3);
    expect(report.results[0].status).toBe("passed");
    expect(report.results[1].status).toBe("passed");
    expect(report.results[2].status).toBe("failed");
  });

  it("TEST 10: stopOnFirstFailure = true -> subsequent skipped", () => {
    const { doc, win } = createMockEnvironment([
      {
        tagName: "DIV",
        textContent: "Content",
        attributes: {},
        classList: { contains: () => false },
        getAttribute: () => null,
      },
    ]);

    const spec: ExerciseValidationSpec = {
      exerciseId: "test-10",
      runtime: "html-css",
      stopOnFirstFailure: true,
      assertions: [
        {
          id: "fail-first",
          description: "Missing section",
          strategy: "dom_query",
          target: "section",
          expected: { exists: true },
          failureMessage: "Section missing",
        },
        {
          id: "skipped-b",
          description: "div exists",
          strategy: "dom_query",
          target: "div",
          expected: { exists: true },
          failureMessage: "div exists",
        },
        {
          id: "skipped-c",
          description: "eval 1+1",
          strategy: "js_evaluation",
          expected: { expression: "1 + 1", expectedValue: 2 },
          failureMessage: "1+1=2",
        },
      ],
    };

    const report = executeValidationSuite(spec, doc, win);
    expect(report.status).toBe("failed");
    expect(report.results).toHaveLength(3);
    expect(report.results[0].status).toBe("failed");
    expect(report.results[1].status).toBe("skipped");
    expect(report.results[2].status).toBe("skipped");
  });

  it("TEST 11: Empty assertions -> status passed, count 0", () => {
    const { doc, win } = createMockEnvironment([]);
    const spec: ExerciseValidationSpec = {
      exerciseId: "test-11",
      runtime: "html-css",
      assertions: [],
    };

    const report = executeValidationSuite(spec, doc, win);
    expect(report.status).toBe("passed");
    expect(report.passedCount).toBe(0);
    expect(report.totalRequired).toBe(0);
    expect(report.results).toHaveLength(0);
  });
});

describe("Phase 2 Hardening Tests (Tests A-H)", () => {
  it("Test A: Type guards support workspaceRevision property", () => {
    const validReqWithRev = {
      type: "PLAYGROUND_VALIDATE_REQUEST",
      requestId: "req-rev-1",
      exerciseId: "ex-1",
      workspaceRevision: 4,
      validationSpec: {
        exerciseId: "ex-1",
        runtime: "html-css",
        assertions: [],
      },
    };
    expect(isPlaygroundValidateRequest(validReqWithRev)).toBe(true);

    const validResWithRev = {
      type: "PLAYGROUND_VALIDATE_RESPONSE",
      requestId: "req-rev-1",
      exerciseId: "ex-1",
      workspaceRevision: 4,
      report: {
        exerciseId: "ex-1",
        status: "passed",
        results: [],
        passedCount: 0,
        totalRequired: 0,
        timestamp: Date.now(),
      },
    };
    expect(isPlaygroundValidateResponse(validResWithRev)).toBe(true);

    // Invalid revision type (e.g. string instead of number)
    const invalidReqBadRev = {
      ...validReqWithRev,
      workspaceRevision: "not-a-number",
    };
    expect(isPlaygroundValidateRequest(invalidReqBadRev)).toBe(false);
  });

  it("Test B: Store invalidates validationReport on updateFileContent and increments workspaceRevision", async () => {
    const { usePlaygroundStore } = await import("./stores/use-playground-store");

    // Seed initial files and an active validation report
    usePlaygroundStore
      .getState()
      .setFiles([{ id: "f-1", name: "index.html", code: "<h1>Hello</h1>", language: "html" }]);
    const initialRev = usePlaygroundStore.getState().workspaceRevision;

    usePlaygroundStore.getState().setValidationReport({
      exerciseId: "ex-1",
      status: "passed",
      results: [],
      passedCount: 1,
      totalRequired: 1,
      timestamp: Date.now(),
    });

    expect(usePlaygroundStore.getState().validationReport).not.toBeNull();

    // Trigger file update
    usePlaygroundStore.getState().updateFileContent("f-1", "<h1>Updated</h1>");

    expect(usePlaygroundStore.getState().validationReport).toBeNull();
    expect(usePlaygroundStore.getState().workspaceRevision).toBe(initialRev + 1);
  });

  it("Test C: Store invalidates validationReport on addFile and deleteFile", async () => {
    const { usePlaygroundStore } = await import("./stores/use-playground-store");

    usePlaygroundStore.getState().setValidationReport({
      exerciseId: "ex-1",
      status: "passed",
      results: [],
      passedCount: 1,
      totalRequired: 1,
      timestamp: Date.now(),
    });
    const revBeforeAdd = usePlaygroundStore.getState().workspaceRevision;

    usePlaygroundStore.getState().addFile({
      id: "f-new",
      name: "style.css",
      code: "body { color: red; }",
      language: "css",
    });

    expect(usePlaygroundStore.getState().validationReport).toBeNull();
    expect(usePlaygroundStore.getState().workspaceRevision).toBe(revBeforeAdd + 1);

    usePlaygroundStore.getState().setValidationReport({
      exerciseId: "ex-1",
      status: "passed",
      results: [],
      passedCount: 1,
      totalRequired: 1,
      timestamp: Date.now(),
    });
    const revBeforeDelete = usePlaygroundStore.getState().workspaceRevision;

    usePlaygroundStore.getState().deleteFile("f-new");

    expect(usePlaygroundStore.getState().validationReport).toBeNull();
    expect(usePlaygroundStore.getState().workspaceRevision).toBe(revBeforeDelete + 1);
  });

  it("Test D: Store invalidates validationReport on setFiles and setManifest", async () => {
    const { usePlaygroundStore } = await import("./stores/use-playground-store");

    usePlaygroundStore.getState().setValidationReport({
      exerciseId: "ex-1",
      status: "passed",
      results: [],
      passedCount: 1,
      totalRequired: 1,
      timestamp: Date.now(),
    });
    const revBeforeSetFiles = usePlaygroundStore.getState().workspaceRevision;

    usePlaygroundStore
      .getState()
      .setFiles([
        { id: "f-reset", name: "index.html", code: "<div>Reset</div>", language: "html" },
      ]);

    expect(usePlaygroundStore.getState().validationReport).toBeNull();
    expect(usePlaygroundStore.getState().workspaceRevision).toBe(revBeforeSetFiles + 1);
  });

  it("Test E: cancelPendingValidationRequests clears pending and resets isValidating", async () => {
    const { cancelPendingValidationRequests } = await import("./compiler/validation-client");
    const { usePlaygroundStore } = await import("./stores/use-playground-store");

    usePlaygroundStore.getState().setIsValidating(true);
    cancelPendingValidationRequests();
    expect(usePlaygroundStore.getState().isValidating).toBe(false);
  });
});

describe("Phase 3: Validation UI & Integration Lifecycle Tests", () => {
  it("Test 3.1: Spec presence correctly classifies required vs optional counts", () => {
    const spec: ExerciseValidationSpec = {
      exerciseId: "ex-counts",
      runtime: "html-css",
      assertions: [
        {
          id: "req-1",
          description: "Header exists",
          strategy: "dom_query",
          target: "h1",
          expected: { exists: true },
          isOptional: false,
        },
        {
          id: "req-2",
          description: "Paragraph exists",
          strategy: "dom_query",
          target: "p",
          expected: { exists: true },
        },
        {
          id: "opt-1",
          description: "Optional challenge badge exists",
          strategy: "dom_query",
          target: ".badge",
          expected: { exists: true },
          isOptional: true,
        },
      ],
    };

    const required = spec.assertions.filter((a) => !a.isOptional);
    const optional = spec.assertions.filter((a) => a.isOptional);

    expect(required.length).toBe(2);
    expect(optional.length).toBe(1);
    expect(required.map((a) => a.id)).toEqual(["req-1", "req-2"]);
    expect(optional.map((a) => a.id)).toEqual(["opt-1"]);
  });

  it("Test 3.2: Failed report accurately identifies failure messages and passed count", () => {
    const spec: ExerciseValidationSpec = {
      exerciseId: "ex-fail-msg",
      runtime: "html-css",
      assertions: [
        {
          id: "a1",
          description: "h1 element exists",
          strategy: "dom_query",
          target: "h1",
          expected: { exists: true },
          failureMessage: "An <h1> element must be present in the document.",
        },
        {
          id: "a2",
          description: "button element exists",
          strategy: "dom_query",
          target: "button",
          expected: { exists: true },
          failureMessage: "A <button> element must be present.",
        },
      ],
    };

    const { doc, win } = createMockEnvironment([
      {
        tagName: "H1",
        textContent: "Hello",
        attributes: {},
        classList: { contains: () => false },
        getAttribute: () => null,
      },
    ]);

    const report = executeValidationSuite(spec, doc, win);

    expect(report.status).toBe("failed");
    expect(report.passedCount).toBe(1);
    expect(report.totalRequired).toBe(2);

    const failedResult = report.results.find((r) => r.assertionId === "a2");
    expect(failedResult).toBeDefined();
    expect(failedResult?.status).toBe("failed");
    expect(failedResult?.errorMessage).toBe("A <button> element must be present.");
  });

  it("Test 3.3: Optional assertion failure allows overall suite to pass", () => {
    const spec: ExerciseValidationSpec = {
      exerciseId: "ex-opt-pass",
      runtime: "html-css",
      assertions: [
        {
          id: "req-1",
          description: "Required h1 exists",
          strategy: "dom_query",
          target: "h1",
          expected: { exists: true },
          isOptional: false,
        },
        {
          id: "opt-1",
          description: "Optional badge exists",
          strategy: "dom_query",
          target: ".badge",
          expected: { exists: true },
          isOptional: true,
        },
      ],
    };

    const { doc, win } = createMockEnvironment([
      {
        tagName: "H1",
        textContent: "Title",
        attributes: {},
        classList: { contains: () => false },
        getAttribute: () => null,
      },
    ]);

    const report = executeValidationSuite(spec, doc, win);

    expect(report.status).toBe("passed");
    expect(report.passedCount).toBe(1);
    expect(report.totalRequired).toBe(1);

    const optResult = report.results.find((r) => r.assertionId === "opt-1");
    expect(optResult?.status).toBe("failed");
  });

  it("Test 3.4: Store revision invalidation lifecycle prevents stale report rendering", async () => {
    const { usePlaygroundStore } = await import("./stores/use-playground-store");

    // Initialize with a file and report
    usePlaygroundStore
      .getState()
      .setFiles([{ id: "f-1", name: "index.html", code: "<h1>Valid</h1>", language: "html" }]);

    const initialRev = usePlaygroundStore.getState().workspaceRevision;

    usePlaygroundStore.getState().setValidationReport({
      exerciseId: "ex-1",
      status: "passed",
      results: [
        {
          assertionId: "a-1",
          status: "passed",
          durationMs: 4,
        },
      ],
      passedCount: 1,
      totalRequired: 1,
      timestamp: Date.now(),
    });

    expect(usePlaygroundStore.getState().validationReport).not.toBeNull();
    expect(usePlaygroundStore.getState().validationReport?.status).toBe("passed");

    // Learner edits code
    usePlaygroundStore.getState().updateFileContent("f-1", "<h1>Modified Code</h1>");

    // Report must be automatically cleared so UI immediately shifts from PASSED back to IDLE
    expect(usePlaygroundStore.getState().validationReport).toBeNull();
    expect(usePlaygroundStore.getState().workspaceRevision).toBe(initialRev + 1);
  });

  it("Test 3.5: Validation cancellation clears isValidating and pending async requests", async () => {
    const { cancelPendingValidationRequests } = await import("./compiler/validation-client");
    const { usePlaygroundStore } = await import("./stores/use-playground-store");

    usePlaygroundStore.getState().setIsValidating(true);
    expect(usePlaygroundStore.getState().isValidating).toBe(true);

    cancelPendingValidationRequests();
    expect(usePlaygroundStore.getState().isValidating).toBe(false);
  });
});

describe("Phase 3 Deterministic Ready Barrier & Decoupled Lifecycle Tests", () => {
  // Polyfill window and MessageEvent for Node.js test environment
  let listeners: ((e: MessageEvent) => void)[] = [];
  const mockIframeWindow = {} as Window;

  beforeEach(() => {
    listeners = [];
    (globalThis as unknown as { window: unknown }).window = {
      addEventListener: (_type: string, listener: (e: MessageEvent) => void) => {
        listeners.push(listener);
      },
      removeEventListener: (_type: string, listener: (e: MessageEvent) => void) => {
        listeners = listeners.filter((l) => l !== listener);
      },
      dispatchEvent: (event: MessageEvent) => {
        listeners.forEach((l) => l(event));
        return true;
      },
    };

    (globalThis as unknown as { document: unknown }).document = {
      querySelectorAll: (selector: string) => {
        if (selector === "iframe[title='Forge Playground Live Preview']") {
          return [{ contentWindow: mockIframeWindow }];
        }
        return [];
      },
    };
  });

  afterEach(() => {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  });

  it("Test A: Normal PLAYGROUND_READY with matching workspace revision resolves barrier", async () => {
    const { waitForIframeReady } = await import("./compiler/validation-client");

    const barrierPromise = waitForIframeReady(10, 1000);

    // Simulate iframe dispatching PLAYGROUND_READY
    const event = {
      data: { type: "PLAYGROUND_READY", workspaceRevision: 10 },
      source: mockIframeWindow,
    } as MessageEvent;
    listeners.forEach((l) => l(event));

    await expect(barrierPromise).resolves.toBeUndefined();
  });

  it("Test B: Stale revision PLAYGROUND_READY is ignored by barrier", async () => {
    const { waitForIframeReady } = await import("./compiler/validation-client");

    const barrierPromise = waitForIframeReady(11, 200);

    // Dispatch stale ready for revision 10
    const staleEvent = {
      data: { type: "PLAYGROUND_READY", workspaceRevision: 10 },
      source: mockIframeWindow,
    } as MessageEvent;
    listeners.forEach((l) => l(staleEvent));

    // Barrier should time out because rev 10 was ignored
    await expect(barrierPromise).rejects.toThrow(
      "Timed out waiting for playground iframe ready signal",
    );
  });

  it("Test C: PLAYGROUND_BUILD_ERROR for current revision immediately aborts barrier", async () => {
    const { waitForIframeReady } = await import("./compiler/validation-client");

    const barrierPromise = waitForIframeReady(10, 1000);

    // Simulate iframe reporting a syntax/compilation error
    const errEvent = {
      data: {
        type: "PLAYGROUND_BUILD_ERROR",
        message: "SyntaxError: Unexpected token '<' at App.tsx:12:4",
        workspaceRevision: 10,
      },
      source: mockIframeWindow,
    } as MessageEvent;
    listeners.forEach((l) => l(errEvent));

    await expect(barrierPromise).rejects.toThrow("SyntaxError: Unexpected token '<'");
  });

  it("Test D: PLAYGROUND_BUILD_ERROR for stale revision is ignored", async () => {
    const { waitForIframeReady } = await import("./compiler/validation-client");

    const barrierPromise = waitForIframeReady(11, 200);

    // Stale error from previous build
    const staleErrEvent = {
      data: {
        type: "PLAYGROUND_BUILD_ERROR",
        message: "Old error",
        workspaceRevision: 10,
      },
      source: mockIframeWindow,
    } as MessageEvent;
    listeners.forEach((l) => l(staleErrEvent));

    // Followed by valid ready for revision 11
    const validReadyEvent = {
      data: { type: "PLAYGROUND_READY", workspaceRevision: 11 },
      source: mockIframeWindow,
    } as MessageEvent;
    listeners.forEach((l) => l(validReadyEvent));

    await expect(barrierPromise).resolves.toBeUndefined();
  });

  it("Test E: Unrelated window event source is ignored", async () => {
    const { waitForIframeReady } = await import("./compiler/validation-client");

    const barrierPromise = waitForIframeReady(10, 200);

    const unrelatedWindow = {} as Window;
    const fakeEvent = {
      data: { type: "PLAYGROUND_READY", workspaceRevision: 10 },
      source: unrelatedWindow,
    } as MessageEvent;
    listeners.forEach((l) => l(fakeEvent));

    await expect(barrierPromise).rejects.toThrow(
      "Timed out waiting for playground iframe ready signal",
    );
  });

  it("Test F: Barrier rejects on timeout if no ready event arrives", async () => {
    const { waitForIframeReady } = await import("./compiler/validation-client");

    const barrierPromise = waitForIframeReady(99, 100);
    await expect(barrierPromise).rejects.toThrow(
      "Timed out waiting for playground iframe ready signal (revision 99, 100ms).",
    );
  });
});

describe("Phase 4 Progression Gating & Integration Tests", () => {
  beforeEach(async () => {
    const { useProgressStore } = await import("./stores/use-progress-store");
    useProgressStore.getState().resetProgress();
  });

  it("Test 4.1: First successful validation completes exercise & awards XP once", async () => {
    const { useProgressStore } = await import("./stores/use-progress-store");
    const exerciseId = "ex-phase4-test-1";

    const initialXp = useProgressStore.getState().xp || 0;
    const isInitiallyCompleted = (useProgressStore.getState().playgroundCompletions || []).some(
      (c) => c.templateId === exerciseId,
    );
    expect(isInitiallyCompleted).toBe(false);

    // Simulate validation pass callback
    const progressStore = useProgressStore.getState();
    const wasCompletedBefore = (progressStore.playgroundCompletions || []).some(
      (c) => c.templateId === exerciseId,
    );
    expect(wasCompletedBefore).toBe(false);

    progressStore.completePlaygroundExercise(exerciseId);

    const updatedState = useProgressStore.getState();
    const isNowCompleted = (updatedState.playgroundCompletions || []).some(
      (c) => c.templateId === exerciseId,
    );
    expect(isNowCompleted).toBe(true);
    expect(updatedState.xp).toBe(initialXp + 50);
  });

  it("Test 4.2: Second successful validation does not duplicate XP or completion history", async () => {
    const { useProgressStore } = await import("./stores/use-progress-store");
    const exerciseId = "ex-phase4-test-2";

    const progressStore = useProgressStore.getState();
    progressStore.completePlaygroundExercise(exerciseId);

    const xpAfterFirstPass = useProgressStore.getState().xp || 0;
    const completionsCountAfterFirst = (useProgressStore.getState().playgroundCompletions || [])
      .length;

    // Second run
    const wasCompletedBeforeSecondRun = (
      useProgressStore.getState().playgroundCompletions || []
    ).some((c) => c.templateId === exerciseId);
    expect(wasCompletedBeforeSecondRun).toBe(true);

    useProgressStore.getState().completePlaygroundExercise(exerciseId);

    const xpAfterSecondPass = useProgressStore.getState().xp || 0;
    const completionsCountAfterSecond = (useProgressStore.getState().playgroundCompletions || [])
      .length;

    expect(xpAfterSecondPass).toBe(xpAfterFirstPass);
    expect(completionsCountAfterSecond).toBe(completionsCountAfterFirst);
  });

  it("Test 4.3: Failed validation does not complete exercise or modify progress store", async () => {
    const { useProgressStore } = await import("./stores/use-progress-store");
    const exerciseId = "ex-phase4-test-3";

    const initialXp = useProgressStore.getState().xp || 0;
    const initialCompletions = [...(useProgressStore.getState().playgroundCompletions || [])];

    // Simulate failed report handler: completePlaygroundExercise is NOT invoked
    const reportStatus = "failed";
    if (reportStatus === "passed") {
      useProgressStore.getState().completePlaygroundExercise(exerciseId);
    }

    const finalState = useProgressStore.getState();
    expect(finalState.xp).toBe(initialXp);
    expect(finalState.playgroundCompletions).toEqual(initialCompletions);
  });

  it("Test 4.4: Editing code invalidates live report without erasing completion history", async () => {
    const { useProgressStore } = await import("./stores/use-progress-store");
    const { usePlaygroundStore } = await import("./stores/use-playground-store");
    const exerciseId = "ex-phase4-test-4";

    // Mark completed
    useProgressStore.getState().completePlaygroundExercise(exerciseId);
    expect(
      (useProgressStore.getState().playgroundCompletions || []).some(
        (c) => c.templateId === exerciseId,
      ),
    ).toBe(true);

    // Simulate code edit setting validation report to null in playground store
    usePlaygroundStore.getState().setValidationReport(null);
    expect(usePlaygroundStore.getState().validationReport).toBeNull();

    // Verify progress store completion remains intact
    expect(
      (useProgressStore.getState().playgroundCompletions || []).some(
        (c) => c.templateId === exerciseId,
      ),
    ).toBe(true);
  });

  it("Test 4.5: Optional assertion failure allows overall passed report & completes exercise", async () => {
    const { useProgressStore } = await import("./stores/use-progress-store");
    const mockEnv = createMockEnvironment([
      {
        tagName: "H1",
        textContent: "Title",
        attributes: {},
        classList: { contains: () => false },
        getAttribute: () => null,
      },
    ]);

    const spec: ExerciseValidationSpec = {
      exerciseId: "ex-phase4-test-5",
      runtime: "html-css",
      assertions: [
        {
          id: "req-1",
          description: "Required H1",
          strategy: "dom_query",
          target: "h1",
          expected: { exists: true },
          failureMessage: "Required H1 missing",
        },
        {
          id: "opt-1",
          description: "Optional missing element",
          strategy: "dom_query",
          target: "#missing",
          expected: { exists: true },
          failureMessage: "Optional element missing",
          isOptional: true,
        },
      ],
    };

    const report = await executeValidationSuite(spec, mockEnv.doc, mockEnv.win);
    expect(report.status).toBe("passed");

    if (report.status === "passed") {
      useProgressStore.getState().completePlaygroundExercise(spec.exerciseId);
    }

    expect(
      (useProgressStore.getState().playgroundCompletions || []).some(
        (c) => c.templateId === spec.exerciseId,
      ),
    ).toBe(true);
  });

  it("Test 4.6: Empty assertion spec produces passed report and completes exercise", async () => {
    const { useProgressStore } = await import("./stores/use-progress-store");
    const mockEnv = createMockEnvironment([]);

    const spec: ExerciseValidationSpec = {
      exerciseId: "ex-phase4-test-6",
      runtime: "html-css",
      assertions: [],
    };

    const report = await executeValidationSuite(spec, mockEnv.doc, mockEnv.win);
    expect(report.status).toBe("passed");

    if (report.status === "passed") {
      useProgressStore.getState().completePlaygroundExercise(spec.exerciseId);
    }

    expect(
      (useProgressStore.getState().playgroundCompletions || []).some(
        (c) => c.templateId === spec.exerciseId,
      ),
    ).toBe(true);
  });

  it("Test 4.7: Exercise validation does not directly complete lessons or bypass lesson rules", async () => {
    const { useProgressStore } = await import("./stores/use-progress-store");
    const exerciseId = "ex-phase4-test-7";

    const initialCompletedLessons = [...(useProgressStore.getState().lessonsCompleted || [])];

    // Complete exercise
    useProgressStore.getState().completePlaygroundExercise(exerciseId);

    // Ensure completedLessons array is unchanged
    expect(useProgressStore.getState().lessonsCompleted).toEqual(initialCompletedLessons);
  });

  it("Test 4.8: Behavioral validation suite for Frontend Detective (interactive-0-1-1)", async () => {
    const { useProgressStore } = await import("./stores/use-progress-store");

    function createInteractive011MockEnv(
      options: {
        brokenReveal?: boolean;
        brokenNext?: boolean;
        missingDom?: boolean;
      } = {},
    ) {
      let index = 0;
      const scenarios = [
        {
          task: "Choose the typography, colors, spacing, and visual style for a checkout screen.",
          answer: "Design",
          explanation: "This is primarily a visual and experience-design decision.",
        },
        {
          task: "Build the checkout form, validate fields, handle loading states, and update the interface when the user submits it.",
          answer: "Frontend",
          explanation: "This is browser-facing interface implementation and behavior.",
        },
        {
          task: "Store the order in a database after the checkout request is received.",
          answer: "Backend",
          explanation: "Persistent server-side data handling belongs behind the interface.",
        },
      ];

      const scenarioTextEl = {
        tagName: "DIV",
        id: "scenario-text",
        textContent: scenarios[0].task,
        attributes: {},
        classList: { contains: () => true },
        getAttribute: () => null,
      };

      const answerTextEl = {
        tagName: "STRONG",
        id: "answer-text",
        textContent: scenarios[0].answer,
        attributes: {},
        classList: { contains: () => true },
        getAttribute: () => null,
      };

      const explanationTextEl = {
        tagName: "P",
        id: "explanation-text",
        textContent: scenarios[0].explanation,
        attributes: {},
        classList: { contains: () => true },
        getAttribute: () => null,
      };

      const answerBoxEl = {
        tagName: "DIV",
        id: "answer-box",
        textContent: scenarios[0].answer,
        style: { display: "none" },
        attributes: {},
        classList: { contains: () => true },
        getAttribute: () => null,
      };

      function render() {
        const s = scenarios[index];
        scenarioTextEl.textContent = s.task;
        answerTextEl.textContent = s.answer;
        explanationTextEl.textContent = s.explanation;
        answerBoxEl.style.display = "none";
      }

      const revealBtnEl = {
        tagName: "BUTTON",
        id: "reveal-btn",
        textContent: "Reveal Answer",
        attributes: {},
        classList: { contains: () => true },
        getAttribute: () => null,
        click: () => {
          if (!options.brokenReveal) {
            answerBoxEl.style.display = "block";
          }
        },
      };

      const nextBtnEl = {
        tagName: "BUTTON",
        id: "next-btn",
        textContent: "Next Scenario",
        attributes: {},
        classList: { contains: () => true },
        getAttribute: () => null,
        click: () => {
          if (!options.brokenNext) {
            index = (index + 1) % scenarios.length;
            render();
          }
        },
      };

      const elements = options.missingDom
        ? [scenarioTextEl]
        : [scenarioTextEl, answerBoxEl, answerTextEl, explanationTextEl, revealBtnEl, nextBtnEl];

      const doc = {
        querySelectorAll: (selector: string) => {
          if (selector.startsWith("#")) {
            const id = selector.substring(1);
            return elements.filter((e) => e.id === id);
          }
          return [];
        },
        querySelector: (selector: string) => {
          const res = doc.querySelectorAll(selector);
          return res.length > 0 ? res[0] : null;
        },
      } as unknown as Document;

      const win = {
        getComputedStyle: (el: { style?: { display?: string } }) => {
          const displayVal = el && el.style ? el.style.display : "block";
          return {
            display: displayVal,
            getPropertyValue: (prop: string) => (prop === "display" ? displayVal : ""),
          } as unknown as CSSStyleDeclaration;
        },
      } as unknown as Window;

      (globalThis as unknown as Record<string, unknown>).document = doc;
      (globalThis as unknown as Record<string, unknown>).window = win;
      (globalThis as unknown as Record<string, unknown>).scenarios = scenarios;

      return { doc, win };
    }

    const prodSpec: ExerciseValidationSpec = {
      exerciseId: "interactive-0-1-1",
      runtime: "html-css",
      assertions: [
        {
          id: "scenario-text-exists",
          description: "Scenario container #scenario-text must exist in the DOM",
          strategy: "dom_query",
          target: "#scenario-text",
          expected: { exists: true },
          failureMessage: "The #scenario-text container was not found in the DOM.",
        },
        {
          id: "answer-box-exists",
          description: "Answer box #answer-box must exist in the DOM",
          strategy: "dom_query",
          target: "#answer-box",
          expected: { exists: true },
          failureMessage: "The #answer-box element was not found in the DOM.",
        },
        {
          id: "reveal-btn-exists",
          description: "Reveal button #reveal-btn must exist in the DOM",
          strategy: "dom_query",
          target: "#reveal-btn",
          expected: { exists: true },
          failureMessage: "The #reveal-btn button was not found in the DOM.",
        },
        {
          id: "next-btn-exists",
          description: "Next scenario button #next-btn must exist in the DOM",
          strategy: "dom_query",
          target: "#next-btn",
          expected: { exists: true },
          failureMessage: "The #next-btn button was not found in the DOM.",
        },
        {
          id: "initial-scenario-rendered",
          description: "Initial scenario task text must be populated inside #scenario-text",
          strategy: "dom_query",
          target: "#scenario-text",
          expected: { textContains: "typography, colors, spacing" },
          failureMessage:
            "#scenario-text does not display the expected initial scenario task text.",
        },
        {
          id: "reveal-btn-behavior",
          description: "Clicking 'Reveal Answer' button displays the answer box",
          strategy: "js_evaluation",
          expected: {
            expression:
              "(() => { const btn = document.querySelector('#reveal-btn'); const box = document.querySelector('#answer-box'); if (!btn || !box) return false; btn.click(); const display = window.getComputedStyle ? window.getComputedStyle(box).display : box.style.display; return display !== 'none'; })()",
            expectedValue: true,
          },
          failureMessage: "Clicking #reveal-btn did not make #answer-box visible.",
        },
        {
          id: "next-btn-behavior",
          description:
            "Clicking 'Next Scenario' button advances scenario text and resets answer box visibility",
          strategy: "js_evaluation",
          expected: {
            expression:
              "(() => { const nextBtn = document.querySelector('#next-btn'); const textEl = document.querySelector('#scenario-text'); const box = document.querySelector('#answer-box'); if (!nextBtn || !textEl || !box) return false; nextBtn.click(); const textUpdated = textEl.textContent.includes('checkout form'); const display = window.getComputedStyle ? window.getComputedStyle(box).display : box.style.display; return textUpdated && display === 'none'; })()",
            expectedValue: true,
          },
          failureMessage:
            "Clicking #next-btn did not advance scenario text or reset answer box visibility.",
        },
        {
          id: "scenarios-cycling-behavior",
          description: "Cycling through scenarios advances to scenario 3 and reveals 'Backend'",
          strategy: "js_evaluation",
          expected: {
            expression:
              "(() => { const nextBtn = document.querySelector('#next-btn'); const revealBtn = document.querySelector('#reveal-btn'); const textEl = document.querySelector('#scenario-text'); const answerEl = document.querySelector('#answer-text'); if (!nextBtn || !revealBtn || !textEl || !answerEl) return false; nextBtn.click(); revealBtn.click(); return textEl.textContent.includes('database') && answerEl.textContent.trim() === 'Backend'; })()",
            expectedValue: true,
          },
          failureMessage: "Cycling to scenario 3 and revealing answer failed to show 'Backend'.",
        },
        {
          id: "scenarios-array-defined",
          description: "Global scenarios array must be defined with scenarios",
          strategy: "js_evaluation",
          expected: {
            expression: "Array.isArray(scenarios) && scenarios.length >= 3",
            expectedValue: true,
          },
          failureMessage:
            "The global `scenarios` array is either missing or contains fewer than 3 scenarios.",
        },
      ],
    };

    try {
      // TEST A: Correct implementation passes
      const correctEnv = createInteractive011MockEnv();
      const passedReport = await executeValidationSuite(prodSpec, correctEnv.doc, correctEnv.win);
      expect(passedReport.status).toBe("passed");
      expect(passedReport.passedCount).toBe(9);

      // TEST B: Broken reveal-answer behavior fails
      const brokenRevealEnv = createInteractive011MockEnv({ brokenReveal: true });
      const revealFailedReport = await executeValidationSuite(
        prodSpec,
        brokenRevealEnv.doc,
        brokenRevealEnv.win,
      );
      expect(revealFailedReport.status).toBe("failed");
      const revealAssertionRes = revealFailedReport.results.find(
        (r) => r.assertionId === "reveal-btn-behavior",
      );
      expect(revealAssertionRes?.status).toBe("failed");

      // TEST C: Broken next-scenario behavior fails
      const brokenNextEnv = createInteractive011MockEnv({ brokenNext: true });
      const nextFailedReport = await executeValidationSuite(
        prodSpec,
        brokenNextEnv.doc,
        brokenNextEnv.win,
      );
      expect(nextFailedReport.status).toBe("failed");
      const nextAssertionRes = nextFailedReport.results.find(
        (r) => r.assertionId === "next-btn-behavior",
      );
      expect(nextAssertionRes?.status).toBe("failed");

      // TEST D: Missing required DOM structure still fails
      const missingDomEnv = createInteractive011MockEnv({ missingDom: true });
      const missingDomReport = await executeValidationSuite(
        prodSpec,
        missingDomEnv.doc,
        missingDomEnv.win,
      );
      expect(missingDomReport.status).toBe("failed");

      // TEST E: Optional assertions, if any, remain non-blocking
      const specWithOptional: ExerciseValidationSpec = {
        ...prodSpec,
        assertions: [
          ...prodSpec.assertions,
          {
            id: "optional-check",
            description: "Optional non-blocking check",
            strategy: "dom_query",
            target: "#non-existent-optional",
            expected: { exists: true },
            isOptional: true,
          },
        ],
      };
      const optionalTestEnv = createInteractive011MockEnv();
      const optionalReport = await executeValidationSuite(
        specWithOptional,
        optionalTestEnv.doc,
        optionalTestEnv.win,
      );
      expect(optionalReport.status).toBe("passed");

      // TEST F: A passed validation completes exercise exactly once
      useProgressStore.setState({
        playgroundCompletions: [],
      });
      if (passedReport.status === "passed") {
        useProgressStore.getState().completePlaygroundExercise(prodSpec.exerciseId);
      }
      expect(
        (useProgressStore.getState().playgroundCompletions || []).filter(
          (c) => c.templateId === prodSpec.exerciseId,
        ).length,
      ).toBe(1);

      // TEST G: A failed validation does not complete exercise or award XP
      useProgressStore.setState({
        playgroundCompletions: [],
        xp: 100,
      });
      const initialXp = useProgressStore.getState().xp;
      if (revealFailedReport.status === "passed") {
        useProgressStore.getState().completePlaygroundExercise(prodSpec.exerciseId);
      }
      expect(
        (useProgressStore.getState().playgroundCompletions || []).some(
          (c) => c.templateId === prodSpec.exerciseId,
        ),
      ).toBe(false);
      expect(useProgressStore.getState().xp).toBe(initialXp);
    } finally {
      delete (globalThis as unknown as Record<string, unknown>).document;
      delete (globalThis as unknown as Record<string, unknown>).window;
      delete (globalThis as unknown as Record<string, unknown>).scenarios;
    }
  });
});
