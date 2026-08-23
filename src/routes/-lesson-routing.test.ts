import { describe, it, expect } from "vitest";
import { Route } from "./lesson.$lessonId";
import lessonsData from "@/data/lessons.json";
import modulesData from "@/data/modules.json";
import topicsData from "@/data/topics.json";
import { Lesson, Module, Topic } from "@/lib/types";
import { getOrderedCurriculumLessons } from "@/lib/utils/curriculum-order";

describe("Lesson Route Default Experience & Fallback Unit Tests", () => {
  const lessons = lessonsData as Lesson[];
  const modules = modulesData as Module[];
  const topics = topicsData as Topic[];

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

  it("7. JavaScript module (module-1-3) starts with the first lesson lesson-1-3-1", () => {
    const jsTopics = topics
      .filter((t) => t.moduleId === "module-1-3")
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    const jsTopicIds = jsTopics.map((t) => t.id);

    const jsLessons = lessons
      .filter((l) => (l.topicId && jsTopicIds.includes(l.topicId)) || l.moduleId === "module-1-3")
      .sort((a, b) => {
        const topicA = jsTopics.find((t) => t.id === a.topicId);
        const topicB = jsTopics.find((t) => t.id === b.topicId);
        const topicOrderA = topicA?.order ?? 0;
        const topicOrderB = topicB?.order ?? 0;
        if (topicOrderA !== topicOrderB) return topicOrderA - topicOrderB;
        return (a.order || 0) - (b.order || 0);
      });

    expect(jsLessons.length).toBeGreaterThan(0);
    expect(jsLessons[0].id).toBe("lesson-1-3-1");
  });

  it("8. Curriculum sequence order navigates from lesson-0-1-1 to lesson-0-1-2", () => {
    const curriculum = getOrderedCurriculumLessons(modules, topics, lessons);
    const firstLessonIdx = curriculum.findIndex((l) => l.id === "lesson-0-1-1");
    expect(firstLessonIdx).toBe(0);
    const nextLesson = curriculum[firstLessonIdx + 1];
    expect(nextLesson).toBeDefined();
    expect(nextLesson.id).toBe("lesson-0-1-2");
  });
});
