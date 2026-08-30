import { describe, expect, it } from "vitest";
import {
  createTypeScriptRun,
  isCurrentTypeScriptRun,
  resetTypeScriptRevision,
} from "./typescript-family";
import { createTypeScriptRunController } from "./typescript-controller";
import { validateTypeScriptRun } from "./typescript-validation-adapter";

describe("TypeScript runtime family", () => {
  it("compiles and reports inferred variable types", () => {
    const result = createTypeScriptRun({
      source: 'const answer = 42; const label = "ok";',
      runId: "run-1",
    });
    expect(result.execution.status).toBe("succeeded");
    expect(result.inferredTypes).toMatchObject({ answer: "42", label: '"ok"' });
    expect(result.emitted).toContain("answer");
  });

  it("returns structured diagnostics for type errors", () => {
    const result = createTypeScriptRun({
      source: "const count: number = 'not a number';",
      runId: "run-2",
    });
    expect(result.execution.status).toBe("failed");
    expect(result.diagnostics.some((item) => item.code === 2322)).toBe(true);
    expect(result.evidence.items[0]?.kind).toBe("type-diagnostic");
  });

  it("queries expression types and preserves source locations", () => {
    const result = createTypeScriptRun({
      source:
        'const value: string | number = Math.random() ? "ok" : 1;\nconst narrowed = typeof value === "string" ? value.toUpperCase() : value.toFixed();',
      queryExpressions: ["value", "narrowed"],
      emit: false,
      runId: "run-query",
    });
    expect(result.execution.status).toBe("succeeded");
    expect(result.typeQueries.find((query) => query.variable === "value")?.type).toContain(
      "string",
    );
    expect(result.typeQueries.find((query) => query.variable === "narrowed")?.type).toBe("string");
    expect(result.typeQueries.find((query) => query.variable === "narrowed")?.line).toBe(2);
    expect(result.emitted).toBeNull();
  });

  it("rejects stale work after reset and disposal", () => {
    const controller = createTypeScriptRunController(4);
    const current = controller.run({ source: "const live = true;", runId: "live" });
    expect(current?.execution.revision).toBe(5);
    expect(controller.run({ source: "const stale = true;", revision: 4 })).toBeNull();
    expect(controller.reset()).toBe(6);
    controller.dispose();
    expect(controller.run({ source: "const disposed = true;" })).toBeNull();
    expect(controller.disposed).toBe(true);
  });

  it("validates compiler evidence and revision identity", () => {
    const result = createTypeScriptRun({ source: "const value = 1;", revision: 3, runId: "run-3" });
    const report = validateTypeScriptRun(result, [
      { id: "clean", kind: "has-error", expected: false },
      { id: "value", kind: "inferred-type", expression: "value", expected: "1" },
    ]);
    expect(report.status).toBe("pass");
    expect(isCurrentTypeScriptRun(result, 3)).toBe(true);
    expect(isCurrentTypeScriptRun(result, resetTypeScriptRevision(3))).toBe(false);
  });
});
