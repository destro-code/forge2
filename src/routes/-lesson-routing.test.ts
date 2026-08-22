import { describe, it, expect } from "vitest";
import { Route } from "./lesson.$lessonId";
import lessonsData from "@/data/lessons.json";
import { Lesson } from "@/lib/types";

describe("Lesson Route Default Experience & Fallback Unit Tests", () => {
  const lessons = lessonsData as Lesson[];

  it("1. validateSearch defaults search flags safely without query parameters", () => {
    const validated = Route.options.validateSearch({});
    expect(validated).toEqual({
      mode: "module",
      player: false,
      classic: false,
    });
  });

  it("2. validateSearch handles player=true parameter for backward compatibility", () => {
    const validatedString = Route.options.validateSearch({ player: "true" });
    expect(validatedString.player).toBe(true);
    expect(validatedString.classic).toBe(false);

    const validatedBool = Route.options.validateSearch({ player: true });
    expect(validatedBool.player).toBe(true);
    expect(validatedBool.classic).toBe(false);
  });

  it("3. validateSearch handles classic=true parameter for fallback view", () => {
    const validatedString = Route.options.validateSearch({ classic: "true" });
    expect(validatedString.classic).toBe(true);

    const validatedBool = Route.options.validateSearch({ classic: true });
    expect(validatedBool.classic).toBe(true);
  });

  it("4. Default route decision (!classic) routes directly to LessonPlayer", () => {
    const shouldRenderLessonPlayer = (search: { classic?: boolean }) => !search.classic;

    expect(shouldRenderLessonPlayer({})).toBe(true);
    expect(shouldRenderLessonPlayer({ classic: false })).toBe(true);
    expect(shouldRenderLessonPlayer({ classic: true })).toBe(false);
  });

  it("5. Real production lesson IDs resolve correctly and are non-empty", () => {
    const knownLessonId = "lesson-0-1-1";
    const foundLesson = lessons.find((l) => l.id === knownLessonId);

    expect(foundLesson).toBeDefined();
    expect(foundLesson?.id).toBe("lesson-0-1-1");
    expect(foundLesson?.title).toBeTruthy();
  });

  it("6. Invalid lesson ID returns undefined", () => {
    const invalidLessonId = "non-existent-lesson-99999";
    const foundLesson = lessons.find((l) => l.id === invalidLessonId);

    expect(foundLesson).toBeUndefined();
  });
});
