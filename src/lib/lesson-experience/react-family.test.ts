// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { runReactComponent, resetReactRevision } from "./react-family";
import { validateReactResult } from "./react-validation-adapter";

describe("React component browser family", () => {
  it("renders JSX and captures bounded evidence", () => {
    const result = runReactComponent({
      source:
        'function App({ label }) { return <div data-component="App" label={label}><h1>{label}</h1></div>; }',
      props: { label: "Hello React" },
    });
    expect(result?.execution.status).toBe("succeeded");
    expect(result?.dom).toContain("Hello React");
    expect(result?.evidence.items.some((item) => item.kind === "dom-snapshot")).toBe(true);
    expect(
      validateReactResult(result, [
        { kind: "component", name: "App" },
        { kind: "dom-contains", text: "Hello React" },
      ]).passed,
    ).toBe(true);
  });
  it("captures runtime errors and rejects stale revisions", () => {
    const result = runReactComponent({ source: "function App() { throw new Error('boom'); }" });
    expect(result?.runtimeError).toContain("boom");
    const revision = resetReactRevision();
    expect(
      runReactComponent({ source: "function App() { return <div />; }", revision: revision - 1 }),
    ).toBeNull();
  });
});
