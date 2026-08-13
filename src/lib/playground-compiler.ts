import type { PlaygroundFile } from "./types/playground";
import { runCompilerPipeline } from "./compiler/pipeline";
import type { CompilerOptions } from "./compiler/types";

export type { CompilerOptions };

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
export function buildPlaygroundHtml(
  files: PlaygroundFile[],
  options: CompilerOptions = {},
): string {
  const report = runCompilerPipeline(files, options);
  return report.outputHtml;
}
