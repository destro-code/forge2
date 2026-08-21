import type {
  PlaygroundFile,
  PlaygroundProjectManifest,
  PlaygroundRuntime,
} from "./types/playground";
import { runCompilerPipeline } from "./compiler/pipeline";
import type { CompilerInput, CompilerOptions } from "./compiler/types";

export type { CompilerInput, CompilerOptions, PlaygroundRuntime, PlaygroundProjectManifest };

export const getSandboxFileInfo = (lang?: string) => {
  const norm = (lang || "").toLowerCase();
  if (norm === "html") {
    return { name: "index.html", language: "html" as const };
  } else if (norm === "css") {
    return { name: "styles.css", language: "css" as const };
  } else if (norm === "javascript" || norm === "js") {
    return { name: "App.js", language: "javascript" as const };
  } else if (norm === "jsx") {
    return { name: "App.jsx", language: "javascript" as const };
  } else if (norm === "ts") {
    return { name: "App.ts", language: "typescript" as const };
  } else {
    return { name: "App.tsx", language: "typescript" as const };
  }
};

/**
 * Shared compilation & execution engine for both the full Playground
 * and the Lesson Inline Sandboxes. Delegates to the 5-step compiler pipeline.
 */
export function buildPlaygroundHtml(input: CompilerInput, options: CompilerOptions = {}): string {
  const report = compilePlaygroundProject(input, options);
  return report.outputHtml;
}

/**
 * Compiles a project and returns the full compiler report including diagnostics and outputHtml.
 */
export function compilePlaygroundProject(input: CompilerInput, options: CompilerOptions = {}) {
  const effectiveBaseUrl =
    options.baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  return runCompilerPipeline(input, { ...options, baseUrl: effectiveBaseUrl });
}
