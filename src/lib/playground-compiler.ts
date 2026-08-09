import type { PlaygroundFile } from "./types/playground";
import { runCompilerPipeline } from "./compiler/pipeline";
import type { CompilerOptions } from "./compiler/types";

export type { CompilerOptions };

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
