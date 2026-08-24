const fs = require("fs");
let code = fs.readFileSync("src/components/lesson/canonical/canonical-renderers.test.ts", "utf8");

code = code.replace(
  `import { ActivityRendererRegistry, getActivityRenderer, FallbackActivityRenderer } from "./registry";`,
  `import { renderActivity, FallbackActivityRenderer } from "./registry";
import { IntroRenderer } from "./renderers/intro-renderer";
import { ExplanationRenderer } from "./renderers/explanation-renderer";
import { CodeExampleRenderer } from "./renderers/code-example-renderer";
import { VisualRenderer } from "./renderers/visual-renderer";
import { MultipleChoiceRenderer } from "./renderers/multiple-choice-renderer";
import { MultiSelectRenderer } from "./renderers/multi-select-renderer";
import { FillBlankRenderer } from "./renderers/fill-blank-renderer";
import { OrderingRenderer } from "./renderers/ordering-renderer";
import { OutputPredictionRenderer } from "./renderers/output-prediction-renderer";
import { InteractiveCodeRenderer } from "./renderers/interactive-code-renderer";
import { DebugRenderer } from "./renderers/debug-renderer";
import { ReflectionRenderer } from "./renderers/reflection-renderer";
import { SummaryRenderer } from "./renderers/summary-renderer";
import { CompletionRenderer } from "./renderers/completion-renderer";
`,
);

code = code.replace(
  `describe("ActivityRendererRegistry", () => {
    const requiredTypes: Array<CanonicalActivity["type"]> = [
      "intro",
      "explanation",
      "code-example",
      "visual",
      "multiple-choice",
      "multi-select",
      "fill-blank",
      "ordering",
      "output-prediction",
      "interactive-code",
      "debug",
      "reflection",
      "summary",
      "completion",
    ];

    it("registers native renderers for all 14 canonical activity types", () => {
      expect(Object.keys(ActivityRendererRegistry).sort()).toEqual([...requiredTypes].sort());
      for (const type of requiredTypes) {
        const renderer = ActivityRendererRegistry[type];
        expect(renderer).toBeDefined();
        expect(typeof renderer).toBe("function");
      }
    });

    it("returns correct renderer via getActivityRenderer", () => {
      for (const type of requiredTypes) {
        const renderer = getActivityRenderer(type);
        expect(renderer).toBe(ActivityRendererRegistry[type]);
      }
    });

    it("safely falls back to FallbackActivityRenderer for unknown activity types", () => {
      const fallback = getActivityRenderer("unknown-custom-type" as any);
      expect(fallback).toBe(FallbackActivityRenderer);
    });
  });`,
  `describe("ActivityRendererRegistry (renderActivity)", () => {
    const requiredTypes: Array<{ type: CanonicalActivity["type"]; component: any }> = [
      { type: "intro", component: IntroRenderer },
      { type: "explanation", component: ExplanationRenderer },
      { type: "code-example", component: CodeExampleRenderer },
      { type: "visual", component: VisualRenderer },
      { type: "multiple-choice", component: MultipleChoiceRenderer },
      { type: "multi-select", component: MultiSelectRenderer },
      { type: "fill-blank", component: FillBlankRenderer },
      { type: "ordering", component: OrderingRenderer },
      { type: "output-prediction", component: OutputPredictionRenderer },
      { type: "interactive-code", component: InteractiveCodeRenderer },
      { type: "debug", component: DebugRenderer },
      { type: "reflection", component: ReflectionRenderer },
      { type: "summary", component: SummaryRenderer },
      { type: "completion", component: CompletionRenderer },
    ];

    it("resolves correct native renderers for all 14 canonical activity types via renderActivity", () => {
      for (const { type, component } of requiredTypes) {
        const mockActivity = { type, id: "test-id" } as any;
        const mockProps = { state: { status: "idle" } } as any;
        const element = renderActivity(mockActivity, mockProps);
        expect(element.type).toBe(component);
      }
    });

    it("safely falls back to FallbackActivityRenderer for unknown activity types", () => {
      const element = renderActivity({ type: "unknown-custom-type", id: "x" } as any, {} as any);
      expect(element.type).toBe(FallbackActivityRenderer);
    });
  });`,
);

code = code.replace(
  `        for (const activity of lesson.activities) {
          const renderer = getActivityRenderer(activity.type);
          expect(renderer).toBeDefined();
          expect(renderer).not.toBe(FallbackActivityRenderer);
          expect(ActivityRendererRegistry[activity.type]).toBe(renderer);
        }`,
  `        for (const activity of lesson.activities) {
          const element = renderActivity(activity, { state: { status: "idle" } } as any);
          expect(element).toBeDefined();
          expect(element.type).not.toBe(FallbackActivityRenderer);
        }`,
);

fs.writeFileSync("src/components/lesson/canonical/canonical-renderers.test.ts", code);
console.log("Patched tests");
