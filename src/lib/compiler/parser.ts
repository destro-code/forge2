import type { CompilerInput, ParsedModule, ParsedProject } from "./types";

/**
 * Step 1: Parse Phase
 * Converts raw source files into structured module representations.
 */
export function parseProject(input: CompilerInput): ParsedProject {
  const files = input || [];

  const modules: ParsedModule[] = files.map((f) => {
    const ext = f.name.includes(".") ? f.name.split(".").pop()?.toLowerCase() || "" : "";
    const isCss = f.name.endsWith(".css");
    const isJson = f.name.endsWith(".json");
    const isEntry =
      f.name === "App.tsx" ||
      f.name === "App.jsx" ||
      f.name === "index.tsx" ||
      f.name === "main.tsx" ||
      f.name === "index.html";

    return {
      id: f.id,
      name: f.name,
      code: f.code,
      language: f.language,
      extension: ext,
      isEntry,
      isCss,
      isJson,
    };
  });

  const entryModule = modules.find((m) => m.isEntry) || modules[0];
  const cssModules = modules.filter((m) => m.isCss);
  const codeModules = modules.filter((m) => !m.isCss);
  const jsonModules = modules.filter((m) => m.isJson);

  return {
    files,
    modules,
    entryModule,
    cssModules,
    codeModules,
    jsonModules,
  };
}
