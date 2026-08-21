import type {
  CompilerInput,
  CompilerOptions,
  ParsedModule,
  ParsedProject,
  PlaygroundRuntime,
} from "./types";
import { resolveDefaultRuntime, resolveEntryModule } from "./entry-resolver";

/**
 * Step 1: Parse Phase
 * Converts raw source files into structured module representations
 * and deterministically resolves the project runtime and entry module.
 */
export function parseProject(input: CompilerInput, options: CompilerOptions = {}): ParsedProject {
  const isManifest =
    !Array.isArray(input) && input !== null && typeof input === "object" && "files" in input;
  const rawFiles = isManifest ? input.files : input || [];
  const files = Array.isArray(rawFiles) ? rawFiles : [];

  const explicitRuntime: PlaygroundRuntime | undefined =
    options.runtime || (isManifest ? input.runtime : undefined);

  const runtime: PlaygroundRuntime = explicitRuntime || resolveDefaultRuntime(files);
  const preferredEntry = options.entryFile || (isManifest ? input.entryFile : undefined);

  const modules: ParsedModule[] = files.map((f) => {
    const ext = f.name.includes(".") ? f.name.split(".").pop()?.toLowerCase() || "" : "";
    const isCss = f.name.endsWith(".css");
    const isJson = f.name.endsWith(".json");

    return {
      id: f.id,
      name: f.name,
      code: f.code,
      language: f.language,
      extension: ext,
      isEntry: false,
      isCss,
      isJson,
    };
  });

  const { entryModule } = resolveEntryModule(modules, runtime, preferredEntry);

  if (entryModule) {
    entryModule.isEntry = true;
  }

  const cssModules = modules.filter((m) => m.isCss);
  const codeModules = modules.filter((m) => !m.isCss);
  const jsonModules = modules.filter((m) => m.isJson);

  return {
    runtime,
    files,
    modules,
    entryModule,
    cssModules,
    codeModules,
    jsonModules,
  };
}
