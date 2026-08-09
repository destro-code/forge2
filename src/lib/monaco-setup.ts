import { loader } from "@monaco-editor/react";

let initPromise: Promise<typeof import("monaco-editor")> | null = null;

/**
 * Single authoritative Monaco initialization function for the application.
 * Dynamically loads monaco-editor and worker ESM modules only on the client,
 * configures global MonacoEnvironment workers, and connects @monaco-editor/react loader.
 */
export function initMonaco(): Promise<typeof import("monaco-editor")> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Monaco can only be initialized on the client."));
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const [
      monaco,
      { default: EditorWorker },
      { default: JsonWorker },
      { default: CssWorker },
      { default: HtmlWorker },
      { default: TsWorker },
    ] = await Promise.all([
      import("monaco-editor"),
      import("monaco-editor/editor/editor.worker?worker"),
      import("monaco-editor/language/json/json.worker?worker"),
      import("monaco-editor/language/css/css.worker?worker"),
      import("monaco-editor/language/html/html.worker?worker"),
      import("monaco-editor/language/typescript/ts.worker?worker"),
    ]);

    self.MonacoEnvironment = {
      getWorker(_: unknown, label: string) {
        if (label === "json") {
          return new JsonWorker();
        }
        if (label === "css" || label === "scss" || label === "less") {
          return new CssWorker();
        }
        if (label === "html" || label === "handlebars" || label === "razor") {
          return new HtmlWorker();
        }
        if (
          label === "typescript" ||
          label === "javascript" ||
          label === "typescriptreact" ||
          label === "javascriptreact" ||
          label === "tsx" ||
          label === "jsx"
        ) {
          return new TsWorker();
        }
        return new EditorWorker();
      },
    };

    // Configure @monaco-editor/react to use local monaco-editor instance
    loader.config({ monaco });

    return monaco;
  })();

  return initPromise;
}
