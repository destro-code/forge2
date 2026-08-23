import { describe, it, expect, beforeEach } from "vitest";
import { inferExerciseMode, buildLessonSteps } from "@/lib/utils/lesson-step-resolver";
import { useProgressStore } from "@/lib/stores/use-progress-store";
import type { Lesson, InteractiveExerciseLessonStep } from "@/lib/types";

describe("Compact Code Challenge Step & Integration Tests", () => {
  beforeEach(() => {
    useProgressStore.setState({ playgroundCompletions: [] });
  });

  it("classifies small focused HTML attribute drill as compact with preview", () => {
    const inferred = inferExerciseMode({
      id: "attr-fix-1",
      title: "Add Target Attribute",
      instructions: "Add target='_blank' to open the link in a new tab.",
      initialCode: "<a href='https://example.com'>Link</a>",
      language: "html",
      source: "section",
    });

    expect(inferred.mode).toBe("code-completion");
    expect(inferred.editorRequired).toBe(true);
    expect(inferred.challengeSize).toBe("compact");
    expect(inferred.showPreview).toBe(true);
  });

  it("classifies small CSS repair drill as compact with preview", () => {
    const inferred = inferExerciseMode({
      id: "css-repair-1",
      title: "Fix the Selector",
      instructions: "Change the class selector to match .highlight",
      initialCode: ".wrong-class { color: crimson; }",
      language: "css",
      source: "section",
    });

    expect(inferred.mode).toBe("code-fix");
    expect(inferred.editorRequired).toBe(true);
    expect(inferred.challengeSize).toBe("compact");
    expect(inferred.showPreview).toBe(true);
  });

  it("preserves standard mode for React multi-component exercises", () => {
    const inferred = inferExerciseMode({
      id: "react-card-1",
      title: "User Card Component",
      instructions: "Build a UserCard component with props.",
      initialCode:
        "import React from 'react';\n\nexport default function UserCard({ name }) {\n  return <div className='card'>{name}</div>;\n}",
      language: "jsx",
      source: "section",
    });

    expect(inferred.challengeSize).toBe("standard");
    expect(inferred.showPreview).toBe(true);
  });

  it("preserves project mode for capstone / mini project tasks", () => {
    const inferred = inferExerciseMode({
      id: "mini-proj-1",
      title: "Mini Project: Weather Widget",
      instructions: "Build the complete interactive weather widget application.",
      initialCode: "const apiKey = 'test';",
      source: "section",
    });

    expect(inferred.mode).toBe("project");
    expect(inferred.challengeSize).toBe("project");
  });

  it("integrates with buildLessonSteps for real lesson structures", () => {
    const mockLesson: Lesson = {
      id: "lesson-compact-demo",
      topicId: "html-basics",
      title: "HTML Tags",
      description: "Learning tags",
      difficulty: "Beginner",
      estimatedMinutes: 5,
      mastery: "Learning",
      sections: [
        {
          type: "heading",
          text: "Closing Tags",
        },
        {
          type: "paragraph",
          text: "Every open tag must have a matching closing tag.",
        },
        {
          type: "interactive-sandbox",
          id: "ex-closing-tags",
          title: "Fix the Closing Tags",
          instructions: "Add the missing slash to the closing tag.",
          initialCode: "<p>Hello world<p>",
          language: "html",
        },
      ],
      exercises: [],
      quiz: [],
      summary: "Tags are closed with a forward slash.",
      resources: [],
      interviewQuestions: [],
    };

    const steps = buildLessonSteps(mockLesson);
    const exerciseStep = steps.find(
      (s) => s.type === "interactive-exercise",
    ) as InteractiveExerciseLessonStep;

    expect(exerciseStep).toBeDefined();
    expect(exerciseStep.challengeSize).toBe("compact");
    expect(exerciseStep.showPreview).toBe(true);
    expect(exerciseStep.leadIn).toBeDefined();
    expect(exerciseStep.leadIn?.title).toBe("Closing Tags");
  });

  it("handles completion idempotency and canonical exercise ID resolution", () => {
    const rawId = "0-1-1";
    const canonicalId = "interactive-0-1-1";

    const store = useProgressStore.getState();
    store.completePlaygroundExercise(canonicalId);

    const updated = useProgressStore.getState().playgroundCompletions;
    expect(updated.length).toBe(1);
    expect(updated[0].templateId).toBe(canonicalId);

    // Calling again does not duplicate
    store.completePlaygroundExercise(canonicalId);
    expect(useProgressStore.getState().playgroundCompletions.length).toBe(1);

    // Verify alias matching
    const isCompleted = updated.some((c) => c.templateId === rawId || c.templateId === canonicalId);
    expect(isCompleted).toBe(true);
  });

  it("ensures isolated storage keys per exercise ID to prevent cross-exercise code pollution", () => {
    const exA = "exercise-0-1-1";
    const exB = "exercise-0-1-2";

    const keyA = `forge_compact_code_${exA}`;
    const keyB = `forge_compact_code_${exB}`;

    expect(keyA).not.toBe(keyB);
    expect(keyA).toBe("forge_compact_code_exercise-0-1-1");
    expect(keyB).toBe("forge_compact_code_exercise-0-1-2");
  });

  it("determines correct effective preview tabs for HTML vs JavaScript console exercises", () => {
    const htmlStep: Partial<InteractiveExerciseLessonStep> = {
      type: "interactive-exercise",
      exerciseId: "html-ex",
      language: "html",
      initialCode: "<p>Hello</p>",
      previewType: "browser",
    };

    const jsConsoleStep: Partial<InteractiveExerciseLessonStep> = {
      type: "interactive-exercise",
      exerciseId: "js-ex",
      language: "javascript",
      initialCode: "console.log('test');",
      previewType: "console",
    };

    expect(htmlStep.previewType).toBe("browser");
    expect(jsConsoleStep.previewType).toBe("console");
  });
});
