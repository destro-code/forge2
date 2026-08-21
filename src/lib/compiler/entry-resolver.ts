import type { PlaygroundFile } from "../types/playground";
import type { Diagnostic, ParsedModule, PlaygroundRuntime } from "./types";

export const REACT_ENTRY_CANDIDATES = [
  "App.tsx",
  "App.jsx",
  "index.tsx",
  "main.tsx",
  "App.ts",
  "App.js",
  "index.jsx",
  "index.js",
  "main.jsx",
  "main.js",
] as const;

export const HTML_ENTRY_CANDIDATES = ["index.html", "main.html"] as const;

export const VANILLA_DOM_JS_CANDIDATES = [
  "App.js",
  "main.js",
  "index.js",
  "script.js",
  "App.ts",
  "main.ts",
  "index.ts",
] as const;

/**
 * Resolves a default runtime deterministically from filenames when no explicit runtime is provided.
 * Does NOT perform heuristic code regex matching.
 */
export function resolveDefaultRuntime(files: PlaygroundFile[]): PlaygroundRuntime {
  const fileNames = files.map((f) => f.name.toLowerCase());

  const hasReactExt = fileNames.some(
    (n) => n.endsWith(".tsx") || n.endsWith(".jsx") || n === "app.tsx" || n === "app.jsx",
  );
  if (hasReactExt) return "react";

  const hasHtml = fileNames.some((n) => n.endsWith(".html") || n.endsWith(".htm"));
  const hasJs = fileNames.some((n) => n.endsWith(".js") || n.endsWith(".ts"));

  if (hasHtml && hasJs) return "vanilla-dom";
  if (hasHtml || fileNames.some((n) => n.endsWith(".css"))) return "html-css";
  if (hasJs) return "vanilla-dom";

  return "react";
}

export interface EntryResolutionResult {
  entryModule?: ParsedModule;
  jsEntryModule?: ParsedModule;
  diagnostics: Diagnostic[];
}

/**
 * Deterministically resolves the entry file based on explicit runtime and priority ranking.
 */
export function resolveEntryModule(
  modules: ParsedModule[],
  runtime: PlaygroundRuntime,
  preferredEntry?: string,
): EntryResolutionResult {
  const diagnostics: Diagnostic[] = [];

  if (modules.length === 0) {
    return {
      entryModule: undefined,
      diagnostics: [
        {
          id: "diag-empty-project",
          severity: "error",
          message: "No files found in project payload.",
        },
      ],
    };
  }

  // 1. Explicit preferred entry match
  if (preferredEntry) {
    const cleanPreferred = preferredEntry.replace(/^\.\//, "").toLowerCase();
    const explicitMatch = modules.find(
      (m) =>
        m.name.toLowerCase() === cleanPreferred ||
        m.name.toLowerCase() === `${cleanPreferred}.tsx` ||
        m.name.toLowerCase() === `${cleanPreferred}.jsx` ||
        m.name.toLowerCase() === `${cleanPreferred}.ts` ||
        m.name.toLowerCase() === `${cleanPreferred}.js` ||
        m.name.toLowerCase() === `${cleanPreferred}.html`,
    );
    if (explicitMatch) {
      return { entryModule: explicitMatch, diagnostics: [] };
    }
  }

  // 2. React Runtime
  if (runtime === "react") {
    for (const candidate of REACT_ENTRY_CANDIDATES) {
      const match = modules.find((m) => m.name.toLowerCase() === candidate.toLowerCase());
      if (match) {
        return { entryModule: match, diagnostics: [] };
      }
    }

    // Fallback to any code module that is .tsx, .jsx, .ts, or .js
    const fallbackCode = modules.find(
      (m) =>
        m.extension === "tsx" ||
        m.extension === "jsx" ||
        m.extension === "ts" ||
        m.extension === "js",
    );
    if (fallbackCode) {
      return {
        entryModule: fallbackCode,
        diagnostics: [
          {
            id: "diag-react-fallback-entry",
            severity: "info",
            message: `Selected ${fallbackCode.name} as fallback React entry point.`,
            file: fallbackCode.name,
          },
        ],
      };
    }

    return {
      entryModule: undefined,
      diagnostics: [
        {
          id: "diag-missing-react-entry",
          severity: "error",
          message:
            "No valid React entry file found. Expected App.tsx, App.jsx, index.tsx, or main.tsx.",
        },
      ],
    };
  }

  // 3. HTML/CSS Runtime
  if (runtime === "html-css") {
    for (const candidate of HTML_ENTRY_CANDIDATES) {
      const match = modules.find((m) => m.name.toLowerCase() === candidate.toLowerCase());
      if (match) {
        return { entryModule: match, diagnostics: [] };
      }
    }

    const anyHtml = modules.find((m) => m.extension === "html" || m.extension === "htm");
    if (anyHtml) {
      return { entryModule: anyHtml, diagnostics: [] };
    }

    // Pure CSS sandbox support
    const anyCss = modules.find((m) => m.isCss);
    if (anyCss) {
      return { entryModule: anyCss, diagnostics: [] };
    }

    return {
      entryModule: undefined,
      diagnostics: [
        {
          id: "diag-missing-html-entry",
          severity: "error",
          message: "No HTML or CSS entry document found. Expected index.html or styles.css.",
        },
      ],
    };
  }

  // 4. Vanilla DOM Runtime
  if (runtime === "vanilla-dom") {
    // Find HTML doc
    let htmlDoc: ParsedModule | undefined;
    for (const candidate of HTML_ENTRY_CANDIDATES) {
      const match = modules.find((m) => m.name.toLowerCase() === candidate.toLowerCase());
      if (match) {
        htmlDoc = match;
        break;
      }
    }
    if (!htmlDoc) {
      htmlDoc = modules.find((m) => m.extension === "html" || m.extension === "htm");
    }

    // Find JS execution entry
    let jsEntry: ParsedModule | undefined;
    for (const candidate of VANILLA_DOM_JS_CANDIDATES) {
      const match = modules.find((m) => m.name.toLowerCase() === candidate.toLowerCase());
      if (match) {
        jsEntry = match;
        break;
      }
    }
    if (!jsEntry) {
      jsEntry = modules.find(
        (m) =>
          (m.extension === "js" || m.extension === "ts") && !m.name.endsWith(".json") && !m.isCss,
      );
    }

    const primaryEntry = htmlDoc || jsEntry;

    if (!primaryEntry) {
      return {
        entryModule: undefined,
        diagnostics: [
          {
            id: "diag-missing-vanilla-entry",
            severity: "error",
            message:
              "No JavaScript or HTML entry found for Vanilla DOM runtime. Expected App.js or index.html.",
          },
        ],
      };
    }

    return {
      entryModule: primaryEntry,
      jsEntryModule: jsEntry,
      diagnostics: [],
    };
  }

  return {
    entryModule: modules[0],
    diagnostics: [],
  };
}
