import { describe, it, expect } from "vitest";
import { compilePlaygroundProject } from "@/lib/playground-compiler";
import { useProgressStore } from "@/lib/stores/use-progress-store";

describe("Concept Code Block & Playground Unit Tests", () => {
  it("1. Compiles HTML/CSS concept snippet cleanly without assessment errors", () => {
    const manifest = {
      runtime: "html-css" as const,
      entryFile: "index.html",
      title: "Concept Example",
      files: [
        {
          id: "main-file",
          name: "index.html",
          content: "<h1>Hello World</h1><p>This is a concept snippet.</p>",
          isEntry: true,
        },
      ],
    };

    const res = compilePlaygroundProject(manifest);
    expect(res.success).toBe(true);
    expect(res.outputHtml).toContain("Hello World");
    expect(res.outputHtml).toContain("This is a concept snippet.");
    const errors = (res.diagnostics || []).filter((d) => d.severity === "error");
    expect(errors.length).toBe(0);
  });

  it("2. Compiles standalone CSS concept snippet wrapped in semantic HTML shell", () => {
    const cssContent = "h1 { color: red; }";
    const files = [
      {
        id: "html-file",
        name: "index.html",
        content: `<!DOCTYPE html><html><head><link rel="stylesheet" href="styles.css"></head><body><h1>Sample Heading</h1></body></html>`,
        isEntry: true,
      },
      {
        id: "css-file",
        name: "styles.css",
        content: cssContent,
        isEntry: false,
      },
    ];

    const manifest = {
      runtime: "html-css" as const,
      entryFile: "index.html",
      title: "CSS Concept Example",
      files,
    };

    const res = compilePlaygroundProject(manifest);
    expect(res.success).toBe(true);
    expect(res.outputHtml).toContain("Sample Heading");
    const errors = (res.diagnostics || []).filter((d) => d.severity === "error");
    expect(errors.length).toBe(0);
  });

  it("3. Compiles JavaScript concept snippet with console runtime integration", () => {
    const manifest = {
      runtime: "javascript" as const,
      entryFile: "index.js",
      title: "JS Concept Example",
      files: [
        {
          id: "main-file",
          name: "index.js",
          content: "console.log('Testing JS concept');",
          isEntry: true,
        },
      ],
    };

    const res = compilePlaygroundProject(manifest);
    expect(res.success).toBe(true);
    expect(res.outputHtml.length).toBeGreaterThan(100);
    const errors = (res.diagnostics || []).filter((d) => d.severity === "error");
    expect(errors.length).toBe(0);
  });

  it("4. Running concept code DOES NOT award XP or mutate progress store", () => {
    const initialXP = useProgressStore.getState().xp;
    const initialCompletions = useProgressStore.getState().playgroundCompletions?.length ?? 0;
    const initialLessons = useProgressStore.getState().lessonsCompleted?.length ?? 0;

    // Simulate concept code execution
    const manifest = {
      runtime: "html-css" as const,
      entryFile: "index.html",
      title: "Concept Test",
      files: [
        {
          id: "main-file",
          name: "index.html",
          content: "<h1>Pure Experimentation</h1>",
          isEntry: true,
        },
      ],
    };

    compilePlaygroundProject(manifest);

    // Verify progress store state remains completely unchanged
    const afterXP = useProgressStore.getState().xp;
    const afterCompletions = useProgressStore.getState().playgroundCompletions?.length ?? 0;
    const afterLessons = useProgressStore.getState().lessonsCompleted?.length ?? 0;

    expect(afterXP).toBe(initialXP);
    expect(afterCompletions).toBe(initialCompletions);
    expect(afterLessons).toBe(initialLessons);
  });
});
