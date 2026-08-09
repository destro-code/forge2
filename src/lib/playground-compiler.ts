import type { PlaygroundFile } from "./types/playground";
import { runCompilerPipeline } from "./compiler/pipeline";
import type { CompilerOptions } from "./compiler/types";
import * as Babel from "@babel/standalone";

export type { CompilerOptions };

/**
 * Shared compilation & execution engine for both the full Playground
 * and the Lesson Inline Sandboxes. Delegates to the 5-step compiler pipeline.
 */
export function buildPlaygroundHtml(
  files: PlaygroundFile[],
  options: CompilerOptions = {},
): { code: string | null; error: string | null } {
  try {
    // 1. Perform Babel compilation step safely to catch Syntax Errors early
    for (const file of files) {
      if (file.name.endsWith(".ts") || file.name.endsWith(".tsx") || file.name.endsWith(".js") || file.name.endsWith(".jsx")) {
         Babel.transform(file.code, {
           presets: [
             ['env', { modules: 'commonjs' }],
             ['react', { runtime: 'classic' }],
             ['typescript', { isTSX: true, allExtensions: true }]
           ],
           filename: file.name
         });
      }
    }

    const report = runCompilerPipeline(files, options);
    return { code: report.outputHtml, error: null };
  } catch (err: any) {
    const errorMsg = err.message || "SyntaxError: Unexpected end of input";
    return { code: null, error: errorMsg };
  }
}
