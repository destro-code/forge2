import { loader } from "@monaco-editor/react";
import EditorWorker from "monaco-editor/editor/editor.worker?worker";
import JsonWorker from "monaco-editor/language/json/json.worker?worker";
import CssWorker from "monaco-editor/language/css/css.worker?worker";
import HtmlWorker from "monaco-editor/language/html/html.worker?worker";
import TsWorker from "monaco-editor/language/typescript/ts.worker?worker";

let initPromise: Promise<typeof import("monaco-editor")> | null = null;

/**
 * Single authoritative Monaco initialization function for the application.
 * Configures global MonacoEnvironment workers and connects @monaco-editor/react loader.
 */
export function initMonaco(): Promise<typeof import("monaco-editor")> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Monaco can only be initialized on the client."));
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    console.log("[Forge Monaco] initializing Monaco editor setup...");
    const monaco = await import("monaco-editor");

    self.MonacoEnvironment = {
      getWorker(_: unknown, label: string) {
        console.log(`[Forge Monaco] worker requested for label: ${label}`);
        let WorkerClass = EditorWorker;
        if (label === "json") {
          WorkerClass = JsonWorker;
        } else if (label === "css" || label === "scss" || label === "less") {
          WorkerClass = CssWorker;
        } else if (label === "html" || label === "handlebars" || label === "razor") {
          WorkerClass = HtmlWorker;
        } else if (
          label === "typescript" ||
          label === "javascript" ||
          label === "typescriptreact" ||
          label === "javascriptreact" ||
          label === "tsx" ||
          label === "jsx"
        ) {
          WorkerClass = TsWorker;
        }

        try {
          const worker = new WorkerClass();
          console.log(`[Forge Monaco] worker created successfully for label: ${label}`);
          return worker;
        } catch (err) {
          console.error(`[Forge Monaco] Failed to instantiate worker for label '${label}':`, err);
          throw err;
        }
      },
    };

    // Configure @monaco-editor/react to use local monaco-editor instance
    loader.config({ monaco });

    return monaco;
  })();

  return initPromise;
}
