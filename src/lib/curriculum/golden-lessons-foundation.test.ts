import { describe, it, expect } from "vitest";
import { canonicalProvider } from "./canonical-provider";
import { validateCurriculumIntegrity } from "./schema";
import { evaluateActivityValidation } from "@/components/lesson/canonical/validation";
import { renderActivity } from "@/components/lesson/canonical/registry";
import { IntroRenderer } from "@/components/lesson/canonical/renderers/intro-renderer";
import { ExplanationRenderer } from "@/components/lesson/canonical/renderers/explanation-renderer";
import { CodeExampleRenderer } from "@/components/lesson/canonical/renderers/code-example-renderer";
import { VisualRenderer } from "@/components/lesson/canonical/renderers/visual-renderer";
import { MultipleChoiceRenderer } from "@/components/lesson/canonical/renderers/multiple-choice-renderer";
import { MultiSelectRenderer } from "@/components/lesson/canonical/renderers/multi-select-renderer";
import { FillBlankRenderer } from "@/components/lesson/canonical/renderers/fill-blank-renderer";
import { OrderingRenderer } from "@/components/lesson/canonical/renderers/ordering-renderer";
import { OutputPredictionRenderer } from "@/components/lesson/canonical/renderers/output-prediction-renderer";
import { InteractiveCodeRenderer } from "@/components/lesson/canonical/renderers/interactive-code-renderer";
import { DebugRenderer } from "@/components/lesson/canonical/renderers/debug-renderer";
import { ReflectionRenderer } from "@/components/lesson/canonical/renderers/reflection-renderer";
import { SummaryRenderer } from "@/components/lesson/canonical/renderers/summary-renderer";
import { CompletionRenderer } from "@/components/lesson/canonical/renderers/completion-renderer";
import type {
  CanonicalActivity,
  InteractiveCodeActivity,
  DebugActivity,
  ReflectionActivity,
} from "./types";

describe("Phase 5.1 — Golden Lesson Foundation & Reconciliation Tests", () => {
  describe("1. Curriculum Entity Ontology & Relational Integrity", () => {
    it("validates full curriculum integrity without orphan references", () => {
      const result = validateCurriculumIntegrity({
        academy: canonicalProvider.getAcademy(),
        levels: canonicalProvider.getLevels(),
        modules: canonicalProvider.getModules(),
        topics: canonicalProvider.getTopics(),
        concepts: canonicalProvider.getConcepts(),
        skills: canonicalProvider.getSkills(),
        misconceptions: canonicalProvider.getMisconceptions(),
        lessons: canonicalProvider.getGoldenLessons(),
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("verifies all Lesson 1 concepts, skills, and misconceptions exist", () => {
      // Concepts
      expect(canonicalProvider.getConcept("concept-web-architecture")).toBeDefined();
      expect(canonicalProvider.getConcept("concept-client-server-split")).toBeDefined();
      expect(canonicalProvider.getConcept("concept-triad-roles")).toBeDefined();

      // Skills
      expect(canonicalProvider.getSkill("skill-classify-stack-responsibilities")).toBeDefined();
      expect(canonicalProvider.getSkill("skill-differentiate-triad-roles")).toBeDefined();
      expect(canonicalProvider.getSkill("skill-explain-client-execution")).toBeDefined();

      // Misconceptions
      expect(canonicalProvider.getMisconception("misc-triad-interchangeable")).toBeDefined();
      expect(canonicalProvider.getMisconception("misc-frontend-direct-database")).toBeDefined();
      expect(canonicalProvider.getMisconception("misc-websites-static-only")).toBeDefined();
    });

    it("verifies all Lesson 2 concepts, skills, and misconceptions exist", () => {
      // Concepts
      expect(canonicalProvider.getConcept("concept-html-element-anatomy")).toBeDefined();
      expect(canonicalProvider.getConcept("concept-opening-closing-tags")).toBeDefined();
      expect(canonicalProvider.getConcept("concept-attributes-key-value")).toBeDefined();
      expect(canonicalProvider.getConcept("concept-nesting-hierarchy")).toBeDefined();

      // Skills
      expect(canonicalProvider.getSkill("skill-parse-element-syntax")).toBeDefined();
      expect(canonicalProvider.getSkill("skill-construct-element-attributes")).toBeDefined();
      expect(canonicalProvider.getSkill("skill-nest-elements-validly")).toBeDefined();

      // Misconceptions
      expect(canonicalProvider.getMisconception("misc-attributes-in-closing-tags")).toBeDefined();
      expect(canonicalProvider.getMisconception("misc-element-tag-identical")).toBeDefined();
      expect(canonicalProvider.getMisconception("misc-attribute-quotes-optional")).toBeDefined();
      expect(canonicalProvider.getMisconception("misc-html-tags-overlap")).toBeDefined();
    });

    it("verifies all Lesson 3 concepts, skills, and misconceptions exist", () => {
      // Concepts
      expect(canonicalProvider.getConcept("concept-flex-container")).toBeDefined();
      expect(canonicalProvider.getConcept("concept-flex-items")).toBeDefined();
      expect(canonicalProvider.getConcept("concept-main-cross-axes")).toBeDefined();
      expect(canonicalProvider.getConcept("concept-justify-align-distribution")).toBeDefined();

      // Skills
      expect(canonicalProvider.getSkill("skill-identify-flex-axes")).toBeDefined();
      expect(canonicalProvider.getSkill("skill-predict-flex-distribution")).toBeDefined();
      expect(canonicalProvider.getSkill("skill-author-flexbox-rules")).toBeDefined();

      // Misconceptions
      expect(
        canonicalProvider.getMisconception("misc-justify-moves-individual-items"),
      ).toBeDefined();
      expect(
        canonicalProvider.getMisconception("misc-align-items-centers-horizontally"),
      ).toBeDefined();
      expect(
        canonicalProvider.getMisconception("misc-display-flex-applies-to-all-descendants"),
      ).toBeDefined();
      expect(
        canonicalProvider.getMisconception("misc-flexbox-requires-hardcoded-margins"),
      ).toBeDefined();
    });

    it("verifies all Lesson 4 concepts, skills, and misconceptions exist", () => {
      // Concepts
      expect(canonicalProvider.getConcept("concept-function-return-value")).toBeDefined();
      expect(canonicalProvider.getConcept("concept-console-log-side-effects")).toBeDefined();
      expect(canonicalProvider.getConcept("concept-caller-expression-substitution")).toBeDefined();
      expect(canonicalProvider.getConcept("concept-undefined-default-return")).toBeDefined();

      // Skills
      expect(canonicalProvider.getSkill("skill-distinguish-return-vs-log")).toBeDefined();
      expect(canonicalProvider.getSkill("skill-predict-call-expression-values")).toBeDefined();
      expect(canonicalProvider.getSkill("skill-author-returning-functions")).toBeDefined();

      // Misconceptions
      expect(canonicalProvider.getMisconception("misc-console-log-returns-value")).toBeDefined();
      expect(
        canonicalProvider.getMisconception("misc-functions-auto-return-last-var"),
      ).toBeDefined();
      expect(canonicalProvider.getMisconception("misc-code-after-return-executes")).toBeDefined();
    });

    it("verifies all Lesson 5 concepts, skills, and misconceptions exist", () => {
      // Concepts
      expect(canonicalProvider.getConcept("concept-syntax-error-vs-runtime-error")).toBeDefined();
      expect(canonicalProvider.getConcept("concept-dom-element-resolution")).toBeDefined();
      expect(canonicalProvider.getConcept("concept-event-listener-binding")).toBeDefined();
      expect(canonicalProvider.getConcept("concept-style-attribute-typos")).toBeDefined();

      // Skills
      expect(canonicalProvider.getSkill("skill-diagnose-symptom-root-causes")).toBeDefined();
      expect(canonicalProvider.getSkill("skill-formulate-debugging-hypothesis")).toBeDefined();
      expect(canonicalProvider.getSkill("skill-repair-multi-file-defects")).toBeDefined();

      // Misconceptions
      expect(
        canonicalProvider.getMisconception("misc-click-failure-always-js-logic"),
      ).toBeDefined();
      expect(canonicalProvider.getMisconception("misc-css-typos-always-show-errors")).toBeDefined();
      expect(
        canonicalProvider.getMisconception("misc-null-addeventlistener-broken-js"),
      ).toBeDefined();
    });
  });

  describe("2. Activity Registry Resolution for All 14 Activity Types", () => {
    it("has dedicated renderers for all 14 canonical activity types", () => {
      expect(IntroRenderer).toBeDefined();
      expect(ExplanationRenderer).toBeDefined();
      expect(CodeExampleRenderer).toBeDefined();
      expect(VisualRenderer).toBeDefined();
      expect(MultipleChoiceRenderer).toBeDefined();
      expect(MultiSelectRenderer).toBeDefined();
      expect(FillBlankRenderer).toBeDefined();
      expect(OrderingRenderer).toBeDefined();
      expect(OutputPredictionRenderer).toBeDefined();
      expect(InteractiveCodeRenderer).toBeDefined();
      expect(DebugRenderer).toBeDefined();
      expect(ReflectionRenderer).toBeDefined();
      expect(SummaryRenderer).toBeDefined();
      expect(CompletionRenderer).toBeDefined();
    });

    it("renders through the central renderActivity router without throws", () => {
      const sampleIntro: CanonicalActivity = {
        id: "act-intro-sample",
        type: "intro",
        intent: "orientation",
        objectiveIds: ["obj-1"],
        content: {
          title: "Welcome",
          hook: "Let's explore frontend development.",
        },
      };

      const element = renderActivity(sampleIntro, {
        state: {
          activityId: "act-intro-sample",
          status: "idle",
          response: null,
          attempts: 0,
          hintsRevealed: 0,
        },
        onResponse: () => {},
        onSubmit: () => {},
        onRetry: () => {},
        onContinue: () => {},
      });

      expect(element).toBeDefined();
    });
  });

  describe("3. Validation Engine Evaluation Contract", () => {
    it("evaluates exact-match validation (case-sensitive and insensitive)", () => {
      const act: CanonicalActivity = {
        id: "act-test-exact",
        type: "fill-blank",
        intent: "retrieval",
        objectiveIds: ["obj-1"],
        content: {
          prompt: "Fill in",
          template: "Value: {b1}",
          blanks: [{ id: "b1" }],
        },
        validation: {
          type: "exact-match",
          expected: "display: flex;",
          caseSensitive: false,
        },
      };

      expect(evaluateActivityValidation(act, ["display: flex;"] as any).isValid).toBe(false); // string expected
      expect(evaluateActivityValidation(act, "display: flex;" as any).isValid).toBe(true);
      expect(evaluateActivityValidation(act, "DISPLAY: FLEX;" as any).isValid).toBe(true);
      expect(evaluateActivityValidation(act, "display: block;" as any).isValid).toBe(false);
    });

    it("evaluates multi-match validation with order independence", () => {
      const act: CanonicalActivity = {
        id: "act-test-multi",
        type: "multi-select",
        intent: "application",
        objectiveIds: ["obj-1"],
        content: {
          question: "Select valid flex container properties",
          options: [
            { id: "opt-1", text: "justify-content" },
            { id: "opt-2", text: "align-items" },
            { id: "opt-3", text: "font-size" },
          ],
        },
        validation: {
          type: "multi-match",
          expected: ["opt-1", "opt-2"],
          ignoreOrder: true,
        },
      };

      expect(evaluateActivityValidation(act, ["opt-1", "opt-2"]).isValid).toBe(true);
      expect(evaluateActivityValidation(act, ["opt-2", "opt-1"]).isValid).toBe(true);
      expect(evaluateActivityValidation(act, ["opt-1"]).isValid).toBe(false);
      expect(evaluateActivityValidation(act, ["opt-1", "opt-3"]).isValid).toBe(false);
    });

    it("evaluates ordering validation with exact sequence check", () => {
      const act: CanonicalActivity = {
        id: "act-test-order",
        type: "ordering",
        intent: "retrieval",
        objectiveIds: ["obj-1"],
        content: {
          prompt: "Order the lifecycle steps",
          items: [
            { id: "step-1", text: "Parse HTML" },
            { id: "step-2", text: "Fetch CSS" },
            { id: "step-3", text: "Execute JS" },
          ],
        },
        validation: {
          type: "ordering",
          correctSequence: ["step-1", "step-2", "step-3"],
        },
      };

      expect(evaluateActivityValidation(act, ["step-1", "step-2", "step-3"]).isValid).toBe(true);
      expect(evaluateActivityValidation(act, ["step-2", "step-1", "step-3"]).isValid).toBe(false);
      expect(evaluateActivityValidation(act, ["step-1", "step-2"]).isValid).toBe(false);
    });

    it("evaluates reflection activity with minCharacters heuristic", () => {
      const act: ReflectionActivity = {
        id: "act-test-reflect",
        type: "reflection",
        intent: "reflection",
        objectiveIds: ["obj-1"],
        content: {
          prompt: "Reflect on client-server execution boundaries",
          minCharacters: 30,
        },
      };

      expect(evaluateActivityValidation(act, "Too short").isValid).toBe(false);
      expect(
        evaluateActivityValidation(
          act,
          "The client browser executes JS and parses DOM, while the database server securely handles persistence.",
        ).isValid,
      ).toBe(true);
    });
  });

  describe("4. Multi-File Interactive Code & Debugging Activity Schema Contracts", () => {
    it("supports multi-file definitions in interactive-code activities", () => {
      const act: InteractiveCodeActivity = {
        id: "act-multi-file-code",
        type: "interactive-code",
        intent: "application",
        objectiveIds: ["obj-1"],
        content: {
          title: "Build Responsive Card",
          prompt: "Style the card component in styles.css",
          instructions: "Apply display: flex to the container in styles.css.",
          language: "css",
          starterCode: ".container { }",
          solutionCode: ".container { display: flex; justify-content: center; }",
          files: [
            {
              name: "index.html",
              content: "<div class='container'><p>Card</p></div>",
              readOnly: true,
            },
            { name: "styles.css", content: ".container { }" },
          ],
          testCases: [
            {
              id: "t1",
              description: "Container has display: flex",
              assertion: "document.querySelector('.container') !== null",
            },
          ],
        },
      };

      expect(act.content.files).toHaveLength(2);
      expect(act.content.files?.[0].readOnly).toBe(true);
      expect(act.content.testCases?.[0].description).toBe("Container has display: flex");
    });

    it("supports multi-file bug definitions and repair requirements in debug activities", () => {
      const act: DebugActivity = {
        id: "act-multi-file-debug",
        type: "debug",
        intent: "debugging",
        objectiveIds: ["obj-dbg-1"],
        content: {
          title: "Fix Broken Landing Page",
          prompt: "Inspect HTML, CSS, and JS to repair the interactive counter",
          buggyCode: "",
          language: "javascript",
          bugDescription: "Button click throws TypeError: Cannot read properties of null",
          fixRequirements: [
            "Match button ID in HTML to querySelector in script.js",
            "Fix CSS property typo in styles.css",
            "Return total score from calculateScore()",
          ],
          files: [
            { name: "index.html", content: "<button id='submit-btn'>Click</button>" },
            { name: "styles.css", content: ".btn { dispaly: flex; }" },
            {
              name: "app.js",
              content: "document.querySelector('#wrong-id').addEventListener('click', () => {});",
            },
          ],
          testCases: [
            {
              id: "t1",
              description: "Event listener is bound without runtime error",
              assertion: "true",
            },
          ],
        },
      };

      expect(act.content.files).toHaveLength(3);
      expect(act.content.fixRequirements).toHaveLength(3);
      expect(act.content.bugDescription).toContain("TypeError");
    });
  });
});
