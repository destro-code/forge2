import type { PlaygroundFile, PlaygroundProjectManifest, PlaygroundRuntime } from "@/lib/types/playground";

export type CanonicalRuntimeKind = "html" | "html-css" | "javascript" | "html-javascript";

export interface CanonicalRuntimeActivity {
  id: string;
  runtime: CanonicalRuntimeKind;
  source: string;
  fixture?: string;
  title?: string;
}

export type CanonicalRuntimeManifest =
  | { kind: "html"; manifest: PlaygroundProjectManifest; entryFile: "index.html" }
  | { kind: "html-css"; manifest: PlaygroundProjectManifest; entryFile: "index.html"; cssFile: "styles.css" }
  | { kind: "javascript"; manifest: PlaygroundProjectManifest; entryFile: "main.js" }
  | { kind: "html-javascript"; manifest: PlaygroundProjectManifest; entryFile: "index.html"; scriptFile: "main.js" };

export class CanonicalRuntimeAdapterError extends Error {
  readonly code = "UNSUPPORTED_CANONICAL_RUNTIME" as const;

  constructor(message: string) {
    super(message);
    this.name = "CanonicalRuntimeAdapterError";
  }
}

const runtimeFor = (kind: CanonicalRuntimeKind): PlaygroundRuntime =>
  kind === "html-css" ? "html-css" : "vanilla-dom";

const createFile = (
  id: string,
  name: string,
  code: string,
  language: PlaygroundFile["language"],
): PlaygroundFile => ({ id, name, code, language });

/**
 * Describes a canonical activity as a playground manifest. It never executes
 * learner code; compilation and execution remain owned by the playground.
 */
export function createCanonicalRuntimeManifest(
  activity: CanonicalRuntimeActivity,
): CanonicalRuntimeManifest {
  if (!activity.id.trim() || !activity.source) {
    throw new CanonicalRuntimeAdapterError("A canonical runtime activity requires an id and source.");
  }

  const title = activity.title ?? activity.id;
  const base = { runtime: runtimeFor(activity.runtime), title };

  switch (activity.runtime) {
    case "html":
      return {
        kind: "html",
        entryFile: "index.html",
        manifest: {
          ...base,
          entryFile: "index.html",
          files: [createFile(`${activity.id}:html`, "index.html", activity.source, "html")],
        },
      };
    case "html-css":
      if (!activity.fixture) {
        throw new CanonicalRuntimeAdapterError("The html-css runtime requires an explicit HTML fixture.");
      }
      return {
        kind: "html-css",
        entryFile: "index.html",
        cssFile: "styles.css",
        manifest: {
          ...base,
          entryFile: "index.html",
          files: [
            createFile(`${activity.id}:html`, "index.html", activity.fixture, "html"),
            createFile(`${activity.id}:css`, "styles.css", activity.source, "css"),
          ],
        },
      };
    case "javascript":
      return {
        kind: "javascript",
        entryFile: "main.js",
        manifest: {
          ...base,
          entryFile: "main.js",
          files: [createFile(`${activity.id}:js`, "main.js", activity.source, "javascript")],
        },
      };
    case "html-javascript":
      if (!activity.fixture) {
        throw new CanonicalRuntimeAdapterError("The html-javascript runtime requires an explicit HTML fixture.");
      }
      return {
        kind: "html-javascript",
        entryFile: "index.html",
        scriptFile: "main.js",
        manifest: {
          ...base,
          entryFile: "index.html",
          files: [
            createFile(`${activity.id}:html`, "index.html", activity.fixture, "html"),
            createFile(`${activity.id}:js`, "main.js", activity.source, "javascript"),
          ],
        },
      };
  }
}

export function isCanonicalRuntimeAdapterError(
  error: unknown,
): error is CanonicalRuntimeAdapterError {
  return error instanceof CanonicalRuntimeAdapterError;
}
