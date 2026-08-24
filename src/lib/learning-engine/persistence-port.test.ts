import { describe, it, expect } from "vitest";
import { InMemorySessionPersistenceAdapter } from "./persistence-port";
import { createLessonSession } from "./session-engine";
import type { CanonicalLesson } from "@/lib/curriculum/types";

describe("Phase 2B.1: Session Persistence Port & In-Memory Adapter", () => {
  const mockLesson: CanonicalLesson = {
    id: "lesson-test-persist",
    schemaVersion: "1.0.0",
    topicId: "topic-1",
    title: "Persistence Test Lesson",
    description: "Testing persistence port",
    lessonType: "practice",
    difficulty: "Beginner",
    estimatedMinutes: 5,
    conceptIds: [],
    skillIds: [],
    objectives: [],
    prerequisites: {},
    activities: [
      {
        id: "act-p1",
        type: "intro",
        intent: "orientation",
        objectiveIds: [],
        content: { title: "Start", hook: "Go" },
      },
    ],
    completion: {},
  };

  it("saves, loads, and isolates sessions via deep cloning", () => {
    const adapter = new InMemorySessionPersistenceAdapter();
    const session = createLessonSession(mockLesson, {
      sessionId: "session-abc-123",
      timestamp: 1000,
    });

    adapter.save(session);

    const loaded = adapter.load("session-abc-123");
    expect(loaded).toBeDefined();
    expect(loaded?.sessionId).toBe("session-abc-123");
    expect(loaded?.lessonId).toBe("lesson-test-persist");

    // Verify isolation (mutating loaded session doesn't mutate stored session)
    if (loaded) {
      loaded.status = "completed";
    }

    const loadedAgain = adapter.load("session-abc-123");
    expect(loadedAgain?.status).toBe("not-started");
  });

  it("loads latest session by lesson ID", () => {
    const adapter = new InMemorySessionPersistenceAdapter();

    const sessionOld = createLessonSession(mockLesson, {
      sessionId: "sess-1",
      timestamp: 1000,
    });
    sessionOld.lastActiveAt = 1000;

    const sessionNew = createLessonSession(mockLesson, {
      sessionId: "sess-2",
      timestamp: 2000,
    });
    sessionNew.lastActiveAt = 2000;

    adapter.save(sessionOld);
    adapter.save(sessionNew);

    const latest = adapter.loadByLessonId("lesson-test-persist");
    expect(latest?.sessionId).toBe("sess-2");
  });

  it("deletes, lists, and clears sessions", () => {
    const adapter = new InMemorySessionPersistenceAdapter();
    const session1 = createLessonSession(mockLesson, { sessionId: "s1" });
    const session2 = createLessonSession(mockLesson, { sessionId: "s2" });

    adapter.save(session1);
    adapter.save(session2);
    expect(adapter.list()).toHaveLength(2);

    adapter.delete("s1");
    expect(adapter.load("s1")).toBeNull();
    expect(adapter.list()).toHaveLength(1);

    adapter.clear();
    expect(adapter.list()).toHaveLength(0);
  });
});
