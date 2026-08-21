import type { PlaygroundFile, PlaygroundRuntime } from "./types/playground";

export interface LessonWorkspaceInputLesson {
  id?: string;
  title?: string;
  category?: string;
  difficulty?: string;
}

export interface LessonWorkspaceInputSandbox {
  id?: string;
  title?: string;
  initialCode?: string;
  language?: string;
  instructions?: string;
}

export interface LessonWorkspaceResult {
  runtime: PlaygroundRuntime;
  files: PlaygroundFile[];
  activeFileId: string;
  entryFile: string;
}

/**
 * Maps a lesson category or language identifier to the deterministic PlaygroundRuntime target.
 */
export function mapCategoryOrLangToRuntime(categoryOrLang?: string): PlaygroundRuntime {
  const norm = (categoryOrLang || "").toLowerCase().trim();
  if (norm.includes("react") || norm === "tsx" || norm === "jsx") {
    return "react";
  }
  if (
    norm.includes("javascript") ||
    norm.includes("vanilla") ||
    norm.includes("dom") ||
    norm.includes("event-loop") ||
    norm.includes("closure") ||
    norm.includes("async") ||
    norm === "js"
  ) {
    return "vanilla-dom";
  }
  if (norm.includes("html") || norm.includes("css")) {
    return "html-css";
  }
  return "react";
}

/**
 * Maps a file extension or file name to the standard Monaco/Playground language.
 */
export function getLanguageFromFileName(fileName: string): PlaygroundFile["language"] {
  const clean = fileName.trim().toLowerCase();
  if (clean.endsWith(".tsx") || clean.endsWith(".ts")) return "typescript";
  if (
    clean.endsWith(".jsx") ||
    clean.endsWith(".js") ||
    clean.endsWith(".mjs") ||
    clean.endsWith(".cjs")
  ) {
    return "javascript";
  }
  if (clean.endsWith(".css") || clean.endsWith(".scss") || clean.endsWith(".less")) return "css";
  if (clean.endsWith(".html") || clean.endsWith(".htm")) return "html";
  if (clean.endsWith(".json")) return "json";
  return "typescript";
}

/**
 * Generates appropriate, idiomatic starter content for any new file created in the playground.
 * Avoids assuming every new file is a React component.
 */
export function getStarterContentForFile(fileName: string): {
  code: string;
  language: PlaygroundFile["language"];
} {
  const lang = getLanguageFromFileName(fileName);
  const cleanName = fileName.trim();
  const baseName = cleanName.split("/").pop()?.split(".")[0] || "Component";
  const pascalName =
    baseName.charAt(0).toUpperCase() + baseName.slice(1).replace(/[^a-zA-Z0-9]/g, "");

  if (cleanName.endsWith(".html") || cleanName.endsWith(".htm")) {
    return {
      language: "html",
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${pascalName || "Playground"}</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="container">
    <h1>${pascalName || "Hello World"}</h1>
    <p>Edit this HTML file to structure your content.</p>
  </div>
</body>
</html>
`,
    };
  }

  if (cleanName.endsWith(".css")) {
    return {
      language: "css",
      code: `/* ${cleanName} */
.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 1.5rem;
}

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #f8fafc;
  background-color: #0d0e12;
  line-height: 1.6;
}

h1 {
  color: #38bdf8;
  margin-bottom: 0.5rem;
}
`,
    };
  }

  if (cleanName.endsWith(".json")) {
    return {
      language: "json",
      code: `{
  "name": "${baseName.toLowerCase()}",
  "version": "1.0.0",
  "items": []
}
`,
    };
  }

  if (cleanName.endsWith(".js") || cleanName.endsWith(".mjs")) {
    return {
      language: "javascript",
      code: `// ${cleanName}
console.log("${cleanName} initialized");

export function run() {
  // Add your logic here
  return true;
}
`,
    };
  }

  if (cleanName.endsWith(".jsx")) {
    return {
      language: "javascript",
      code: `import React from 'react';

export default function ${pascalName || "Component"}() {
  return (
    <div style={{ padding: '1rem', color: '#f8fafc' }}>
      <h2>${pascalName || "New Component"}</h2>
      <p>Edit this JSX component to build your UI.</p>
    </div>
  );
}
`,
    };
  }

  if (cleanName.endsWith(".ts")) {
    return {
      language: "typescript",
      code: `// ${cleanName}
export interface Config {
  id: string;
  name: string;
}

export function formatData<T>(input: T): string {
  return JSON.stringify(input, null, 2);
}
`,
    };
  }

  // Default to TypeScript TSX React component
  return {
    language: "typescript",
    code: `import React from 'react';

interface ${pascalName}Props {
  title?: string;
}

export default function ${pascalName || "Component"}({ title = "${pascalName || "New Component"}" }: ${pascalName}Props) {
  return (
    <div style={{ padding: '1rem', color: '#f8fafc' }}>
      <h2>{title}</h2>
      <p>Edit this TypeScript React component.</p>
    </div>
  );
}
`,
  };
}

/**
 * Suggests an intelligent default file name for a new file based on existing project files.
 */
export function suggestNewFileName(existingFiles: PlaygroundFile[]): string {
  const isHtmlDominant = existingFiles.some(
    (f) => f.name.endsWith(".html") || f.language === "html",
  );
  const isReactTsx = existingFiles.some((f) => f.name.endsWith(".tsx"));
  const isReactJsx = existingFiles.some((f) => f.name.endsWith(".jsx"));
  const isPureJs = existingFiles.some((f) => f.name.endsWith(".js") && !f.name.endsWith(".jsx"));
  const isPureTs = existingFiles.some((f) => f.name.endsWith(".ts") && !f.name.endsWith(".tsx"));

  const count = existingFiles.length + 1;

  if (isHtmlDominant) {
    const hasCss = existingFiles.some((f) => f.name.endsWith(".css"));
    if (!hasCss) return "styles.css";
    const hasJs = existingFiles.some((f) => f.name.endsWith(".js"));
    if (!hasJs) return "script.js";
    return `page-${count}.html`;
  }

  if (isReactJsx) {
    return `Component${count}.jsx`;
  }

  if (isPureJs) {
    return `utils-${count}.js`;
  }

  if (isPureTs) {
    return `types-${count}.ts`;
  }

  if (isReactTsx) {
    return `Component${count}.tsx`;
  }

  return `Component${count}.tsx`;
}

/**
 * Determines the primary default extension for user input that doesn't have an extension.
 */
export function normalizeNewFileName(inputName: string, existingFiles: PlaygroundFile[]): string {
  const name = inputName.trim();
  if (!name) return "NewFile.tsx";

  if (name.includes(".")) {
    return name;
  }

  const isHtmlDominant = existingFiles.some(
    (f) => f.name.endsWith(".html") || f.language === "html",
  );
  const isReactJsx = existingFiles.some((f) => f.name.endsWith(".jsx"));
  const isPureJs = existingFiles.some((f) => f.name.endsWith(".js") && !f.name.endsWith(".jsx"));
  const isPureTs = existingFiles.some((f) => f.name.endsWith(".ts") && !f.name.endsWith(".tsx"));

  if (isHtmlDominant) {
    return `${name}.html`;
  }
  if (isReactJsx) {
    return `${name}.jsx`;
  }
  if (isPureJs) {
    return `${name}.js`;
  }
  if (isPureTs) {
    return `${name}.ts`;
  }
  return `${name}.tsx`;
}

/**
 * Constructs a lesson-aware starter workspace reflecting what the learner is learning (HTML, CSS, JS, React).
 */
export function buildLessonWorkspaceFiles(
  lesson?: LessonWorkspaceInputLesson | null,
  sandboxSection?: LessonWorkspaceInputSandbox | null,
  initialCode?: string,
  explicitLang?: string,
  explicitRuntime?: PlaygroundRuntime,
): LessonWorkspaceResult {
  const language = (
    explicitLang ||
    sandboxSection?.language ||
    lesson?.category?.toLowerCase() ||
    ""
  ).toLowerCase();

  const code = initialCode || sandboxSection?.initialCode || "";
  const lessonTitle = lesson?.title || "Lesson Sandbox";

  if (explicitRuntime === "html-css" || language === "html" || language.includes("html")) {
    const htmlCode =
      code ||
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${lessonTitle}</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <h1>${lessonTitle}</h1>
  <p>Start writing your HTML structure here.</p>
</body>
</html>`;

    const cssCode = `/* styles.css */
body {
  margin: 0;
  padding: 16px;
  font-family: system-ui, sans-serif;
  background-color: #0d0e12;
  color: #f8fafc;
}

h1 {
  color: #38bdf8;
}
`;

    const htmlFileId = `f-html-${Date.now()}`;
    const cssFileId = `f-css-${Date.now() + 1}`;

    return {
      runtime: "html-css",
      entryFile: "index.html",
      files: [
        {
          id: htmlFileId,
          name: "index.html",
          language: "html",
          code: htmlCode,
        },
        {
          id: cssFileId,
          name: "styles.css",
          language: "css",
          code: cssCode,
        },
      ],
      activeFileId: htmlFileId,
    };
  }

  if (language === "css" || language.includes("css")) {
    const cssCode =
      code ||
      `/* styles.css */
body {
  font-family: system-ui, sans-serif;
  padding: 20px;
  background: #0d0e12;
  color: #f8fafc;
}

.card {
  border: 1px solid #38bdf8;
  border-radius: 8px;
  padding: 16px;
  background: #161b22;
}
`;

    const htmlCompanion = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${lessonTitle}</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="card">
    <h2>CSS Exercise</h2>
    <p>Edit styles.css to customize the presentation of this card.</p>
    <button class="btn">Interactive Element</button>
  </div>
</body>
</html>`;

    const cssFileId = `f-css-${Date.now()}`;
    const htmlFileId = `f-html-${Date.now() + 1}`;

    return {
      runtime: "html-css",
      entryFile: "index.html",
      files: [
        {
          id: cssFileId,
          name: "styles.css",
          language: "css",
          code: cssCode,
        },
        {
          id: htmlFileId,
          name: "index.html",
          language: "html",
          code: htmlCompanion,
        },
      ],
      activeFileId: cssFileId,
    };
  }

  if (
    explicitRuntime === "vanilla-dom" ||
    language === "javascript" ||
    language === "js" ||
    language.includes("javascript") ||
    language.includes("dom")
  ) {
    const jsCode =
      code ||
      `// App.js - ${lessonTitle}
console.log("Interactive JavaScript environment loaded.");

// Target elements in the DOM
const output = document.getElementById("output");
if (output) {
  output.textContent = "JavaScript loaded successfully!";
}
`;

    const cssCode = `/* styles.css */
body {
  margin: 0;
  padding: 16px;
  font-family: system-ui, sans-serif;
  background: #0d0e12;
  color: #f8fafc;
}
`;

    const jsFileId = `f-js-${Date.now()}`;
    const cssFileId = `f-css-${Date.now() + 1}`;

    return {
      runtime: "vanilla-dom",
      entryFile: "App.js",
      files: [
        {
          id: jsFileId,
          name: "App.js",
          language: "javascript",
          code: jsCode,
        },
        {
          id: cssFileId,
          name: "styles.css",
          language: "css",
          code: cssCode,
        },
      ],
      activeFileId: jsFileId,
    };
  }

  if (language === "jsx") {
    const jsxCode =
      code ||
      `import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      <h2>${lessonTitle}</h2>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
    </div>
  );
}
`;

    const cssCode = `/* styles.css */
body {
  margin: 0;
  padding: 16px;
  background-color: #0d0e12;
  color: #f8fafc;
  font-family: system-ui, sans-serif;
}
`;

    const jsxFileId = `f-jsx-${Date.now()}`;
    const cssFileId = `f-css-${Date.now() + 1}`;

    return {
      runtime: "react",
      entryFile: "App.jsx",
      files: [
        {
          id: jsxFileId,
          name: "App.jsx",
          language: "javascript",
          code: jsxCode,
        },
        {
          id: cssFileId,
          name: "styles.css",
          language: "css",
          code: cssCode,
        },
      ],
      activeFileId: jsxFileId,
    };
  }

  // Default: TypeScript TSX React component
  const tsxCode =
    code ||
    `import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      <h2>${lessonTitle}</h2>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
    </div>
  );
}
`;

  const cssCode = `/* styles.css */
body {
  margin: 0;
  padding: 16px;
  background-color: #0d0e12;
  color: #f8fafc;
  font-family: system-ui, sans-serif;
}
`;

  const tsxFileId = `f-tsx-${Date.now()}`;
  const cssFileId = `f-css-${Date.now() + 1}`;

  return {
    runtime: "react",
    entryFile: "App.tsx",
    files: [
      {
        id: tsxFileId,
        name: "App.tsx",
        language: "typescript",
        code: tsxCode,
      },
      {
        id: cssFileId,
        name: "styles.css",
        language: "css",
        code: cssCode,
      },
    ],
    activeFileId: tsxFileId,
  };
}

export interface RestoredPlaygroundWorkspace {
  manifest: PlaygroundProjectManifest;
  activeFileId?: string;
  openTabIds?: string[];
}

/**
 * Safely parses and migrates a localStorage record into a valid PlaygroundProjectManifest.
 * Handles both new manifest structures and legacy raw PlaygroundFile[] arrays without crashing.
 */
export function restorePersistedPlaygroundWorkspace(
  rawJson: string,
  fallbackRuntime?: PlaygroundRuntime,
  fallbackEntryFile?: string,
): RestoredPlaygroundWorkspace | null {
  try {
    const parsed = JSON.parse(rawJson);
    if (!parsed) return null;

    // Case 1: Legacy Array format: PlaygroundFile[]
    if (Array.isArray(parsed) && parsed.length > 0) {
      const files = parsed as PlaygroundFile[];
      const runtime: PlaygroundRuntime = fallbackRuntime || "react";
      return {
        manifest: {
          runtime,
          entryFile: fallbackEntryFile,
          files,
        },
        activeFileId: files[0]?.id,
        openTabIds: files.map((f) => f.id),
      };
    }

    // Case 2: Standard PlaygroundProjectManifest or wrapped persisted state
    if (typeof parsed === "object" && parsed !== null) {
      // Direct manifest or state containing manifest / files
      const files: PlaygroundFile[] = Array.isArray(parsed.files)
        ? parsed.files
        : Array.isArray(parsed.manifest?.files)
          ? parsed.manifest.files
          : [];

      if (files.length === 0) return null;

      const runtime: PlaygroundRuntime =
        parsed.runtime || parsed.manifest?.runtime || fallbackRuntime || "react";

      const entryFile: string | undefined =
        parsed.entryFile || parsed.manifest?.entryFile || fallbackEntryFile;

      const activeFileId: string | undefined =
        parsed.activeFileId ||
        (files.some((f) => f.id === parsed.activeFileId) ? parsed.activeFileId : files[0]?.id);

      const openTabIds: string[] | undefined = Array.isArray(parsed.openTabIds)
        ? parsed.openTabIds
        : files.map((f) => f.id);

      return {
        manifest: {
          runtime,
          entryFile,
          title: parsed.title || parsed.manifest?.title,
          files,
        },
        activeFileId,
        openTabIds,
      };
    }

    return null;
  } catch (err) {
    return null;
  }
}
