import { describe, expect, it } from "vitest";
import { CanonicalRuntimeAdapterError, createCanonicalRuntimeManifest } from "./canonical-code-runtime";

describe("canonical runtime adapter", () => {
  it("creates deterministic HTML manifests", () => {
    const input = { id: "html-1", runtime: "html" as const, source: "<main>Hello</main>" };
    expect(createCanonicalRuntimeManifest(input)).toEqual(createCanonicalRuntimeManifest(input));
    expect(createCanonicalRuntimeManifest(input)).toMatchObject({
      kind: "html",
      entryFile: "index.html",
      manifest: { runtime: "vanilla-dom", entryFile: "index.html", files: [{ name: "index.html", code: input.source }] },
    });
  });

  it("represents an explicit HTML/CSS fixture", () => {
    const result = createCanonicalRuntimeManifest({ id: "css-1", runtime: "html-css", fixture: "<nav />", source: "nav { display: flex; }" });
    expect(result).toMatchObject({ kind: "html-css", cssFile: "styles.css", manifest: { runtime: "html-css" } });
    expect(result.manifest.files.map((item) => [item.name, item.code])).toEqual([
      ["index.html", "<nav />"],
      ["styles.css", "nav { display: flex; }"],
    ]);
  });

  it("preserves JavaScript source exactly", () => {
    const source = "function answer() {\n  return 42;\n}";
    const result = createCanonicalRuntimeManifest({ id: "js-1", runtime: "javascript", source });
    expect(result).toMatchObject({ kind: "javascript", entryFile: "main.js", manifest: { runtime: "vanilla-dom" } });
    expect(result.manifest.files[0].code).toBe(source);
  });

  it("represents HTML plus JavaScript explicitly", () => {
    const result = createCanonicalRuntimeManifest({ id: "dom-1", runtime: "html-javascript", fixture: "<button id='go'>Go</button>", source: "document.querySelector('#go');" });
    expect(result).toMatchObject({ kind: "html-javascript", scriptFile: "main.js", manifest: { entryFile: "index.html" } });
    expect(result.manifest.files.map((item) => item.name)).toEqual(["index.html", "main.js"]);
  });

  it("rejects runtime descriptions missing required explicit fixtures", () => {
    expect(() => createCanonicalRuntimeManifest({ id: "missing", runtime: "html-css", source: "body {}" })).toThrow(CanonicalRuntimeAdapterError);
    expect(() => createCanonicalRuntimeManifest({ id: "missing", runtime: "html-javascript", source: "document.body" })).toThrow(CanonicalRuntimeAdapterError);
  });
});
