import { describe, expect, it } from "vitest";
import {
  DEFAULT_CSS_PREVIEW_FIXTURE,
  ExperienceResolutionError,
  resolveActivityExperience,
} from "./experience";

describe("resolveActivityExperience", () => {
  it("legacy-infers a markup experience from language: html", () => {
    const resolved = resolveActivityExperience({
      id: "a1",
      type: "interactive-code",
      content: { language: "html", starterCode: "<div></div>" },
    });
    expect(resolved.source).toBe("legacy-inferred");
    expect(resolved.experience).toEqual({
      kind: "markup",
      language: "html",
      editor: { starterSource: "<div></div>" },
      output: { preview: true, console: false },
    });
  });

  it("legacy-infers a css experience and falls back to the default fixture", () => {
    const resolved = resolveActivityExperience({
      id: "a2",
      type: "interactive-code",
      content: { language: "css", starterCode: ".x { color: red; }" },
    });
    expect(resolved.source).toBe("legacy-inferred");
    expect(resolved.experience.kind).toBe("css");
    if (resolved.experience.kind === "css") {
      expect(resolved.experience.environment.htmlFixture).toBe(DEFAULT_CSS_PREVIEW_FIXTURE);
    }
  });

  it("prefers a curriculum-owned htmlFixture over the default for css", () => {
    const resolved = resolveActivityExperience({
      id: "a3",
      type: "interactive-code",
      content: {
        language: "css",
        starterCode: ".x {}",
        htmlFixture: "<main>custom fixture</main>",
      },
    });
    expect(resolved.experience.kind).toBe("css");
    if (resolved.experience.kind === "css") {
      expect(resolved.experience.environment.htmlFixture).toBe("<main>custom fixture</main>");
    }
  });

  it("legacy-infers a javascript experience when language is javascript or absent", () => {
    const withLanguage = resolveActivityExperience({
      id: "a4",
      type: "interactive-code",
      content: { language: "javascript", starterCode: "console.log(1)" },
    });
    expect(withLanguage.experience.kind).toBe("javascript");

    const withoutLanguage = resolveActivityExperience({
      id: "a5",
      type: "interactive-code",
      content: { starterCode: "console.log(1)" },
    });
    expect(withoutLanguage.experience.kind).toBe("javascript");
  });

  it("legacy-infers a debug experience from type: debug using buggyCode", () => {
    const resolved = resolveActivityExperience({
      id: "a6",
      type: "debug",
      content: { language: "javascript", buggyCode: "function broken() {}" },
    });
    expect(resolved.experience.kind).toBe("debug");
    if (resolved.experience.kind === "debug") {
      expect(resolved.experience.editor.starterSource).toBe("function broken() {}");
    }
  });

  it("carries an optional htmlFixture through to the debug environment", () => {
    const resolved = resolveActivityExperience({
      id: "a7",
      type: "debug",
      content: {
        language: "javascript",
        buggyCode: "function broken() {}",
        htmlFixture: "<div id='app'></div>",
      },
    });
    expect(resolved.experience.kind).toBe("debug");
    if (resolved.experience.kind === "debug") {
      expect(resolved.experience.environment?.htmlFixture).toBe("<div id='app'></div>");
      expect(resolved.experience.output.preview).toBe(true);
    }
  });

  it("returns an explicit, schema-valid experience unchanged", () => {
    const resolved = resolveActivityExperience({
      id: "a8",
      type: "interactive-code",
      experience: {
        kind: "markup",
        language: "html",
        editor: { starterSource: "<p></p>" },
        output: { preview: true, console: false },
      },
      content: { language: "html", starterCode: "<p></p>" },
    });
    expect(resolved.source).toBe("explicit");
    expect(resolved.experience.kind).toBe("markup");
  });

  it("throws for an explicit experience of a not-yet-implemented kind", () => {
    expect(() =>
      resolveActivityExperience({
        id: "a9",
        type: "interactive-code",
        experience: {
          kind: "react",
          language: "tsx",
          editor: { starterSource: "export default () => null" },
          environment: { entrypoint: "index.tsx" },
          output: { preview: true, console: true, runtimeErrors: true },
        },
        content: { language: "tsx", starterCode: "export default () => null" },
      }),
    ).toThrow(ExperienceResolutionError);
  });

  it("throws for a schema-invalid explicit experience", () => {
    expect(() =>
      resolveActivityExperience({
        id: "a10",
        type: "interactive-code",
        experience: { kind: "markup", language: "html" },
        content: { language: "html", starterCode: "<p></p>" },
      }),
    ).toThrow(ExperienceResolutionError);
  });

  it("throws when legacy-inferring an unsupported language", () => {
    expect(() =>
      resolveActivityExperience({
        id: "a11",
        type: "interactive-code",
        content: { language: "python", starterCode: "print(1)" },
      }),
    ).toThrow(ExperienceResolutionError);
  });

  it("throws when a debug activity declares a non-javascript language", () => {
    expect(() =>
      resolveActivityExperience({
        id: "a12",
        type: "debug",
        content: { language: "typescript", buggyCode: "const x: number = 1;" },
      }),
    ).toThrow(ExperienceResolutionError);
  });

  it("throws when there is no source to resolve an experience from", () => {
    expect(() =>
      resolveActivityExperience({
        id: "a13",
        type: "interactive-code",
        content: { language: "html" },
      }),
    ).toThrow(ExperienceResolutionError);
  });
});
