import modulesData from "@/data/modules.json";
import topicsData from "@/data/topics.json";
import lessonsData from "@/data/lessons.json";
import quizzesData from "@/data/quizzes.json";

export function validateCurriculumData(): void {
  const topicIdsSet = new Set(topicsData.map((t) => t.id));
  const lessonIdsSet = new Set(lessonsData.map((l) => l.id));
  const quizIdsSet = new Set(quizzesData.map((q) => q.id));

  // 1. Check topicId / topicIds / topics referenced inside modules
  modulesData.forEach((moduleItem: Record<string, unknown>) => {
    const moduleId = (moduleItem.id as string) || (moduleItem.title as string) || "Unknown Module";

    if (typeof moduleItem.topicId === "string") {
      if (!topicIdsSet.has(moduleItem.topicId)) {
        console.warn(
          `Data Integrity Warning: Topic ID '${moduleItem.topicId}' referenced in Module '${moduleId}' does not exist.`,
        );
      }
    }

    if (Array.isArray(moduleItem.topicIds)) {
      moduleItem.topicIds.forEach((tId: unknown) => {
        if (typeof tId === "string" && !topicIdsSet.has(tId)) {
          console.warn(
            `Data Integrity Warning: Topic ID '${tId}' referenced in Module '${moduleId}' does not exist.`,
          );
        }
      });
    }

    if (Array.isArray(moduleItem.topics)) {
      moduleItem.topics.forEach((t: unknown) => {
        const tId = typeof t === "string" ? t : (t as { id?: string })?.id;
        if (tId && !topicIdsSet.has(tId)) {
          console.warn(
            `Data Integrity Warning: Topic ID '${tId}' referenced in Module '${moduleId}' does not exist.`,
          );
        }
      });
    }
  });

  // 2. Check lessonId / lessonIds / lessons referenced inside topics
  topicsData.forEach((topicItem: Record<string, unknown>) => {
    const topicId = (topicItem.id as string) || (topicItem.title as string) || "Unknown Topic";

    if (typeof topicItem.lessonId === "string") {
      if (!lessonIdsSet.has(topicItem.lessonId)) {
        console.warn(
          `Data Integrity Warning: Lesson ID '${topicItem.lessonId}' referenced in Topic '${topicId}' does not exist.`,
        );
      }
    }

    if (Array.isArray(topicItem.lessonIds)) {
      topicItem.lessonIds.forEach((lId: unknown) => {
        if (typeof lId === "string" && !lessonIdsSet.has(lId)) {
          console.warn(
            `Data Integrity Warning: Lesson ID '${lId}' referenced in Topic '${topicId}' does not exist.`,
          );
        }
      });
    }

    if (Array.isArray(topicItem.lessons)) {
      topicItem.lessons.forEach((l: unknown) => {
        const lId = typeof l === "string" ? l : (l as { id?: string })?.id;
        if (lId && !lessonIdsSet.has(lId)) {
          console.warn(
            `Data Integrity Warning: Lesson ID '${lId}' referenced in Topic '${topicId}' does not exist.`,
          );
        }
      });
    }

    if (typeof topicItem.quizId === "string") {
      if (!quizIdsSet.has(topicItem.quizId)) {
        console.warn(
          `Data Integrity Warning: Quiz ID '${topicItem.quizId}' referenced in Topic '${topicId}' does not exist.`,
        );
      }
    }

    if (Array.isArray(topicItem.quizIds)) {
      topicItem.quizIds.forEach((qId: unknown) => {
        if (typeof qId === "string" && !quizIdsSet.has(qId)) {
          console.warn(
            `Data Integrity Warning: Quiz ID '${qId}' referenced in Topic '${topicId}' does not exist.`,
          );
        }
      });
    }
  });

  // 3. Check quizId linked in lessons
  lessonsData.forEach((lessonItem: Record<string, unknown>) => {
    const lessonId = (lessonItem.id as string) || (lessonItem.title as string) || "Unknown Lesson";

    if (typeof lessonItem.quizId === "string") {
      if (!quizIdsSet.has(lessonItem.quizId)) {
        console.warn(
          `Data Integrity Warning: Quiz ID '${lessonItem.quizId}' referenced in Lesson '${lessonId}' does not exist.`,
        );
      }
    }

    if (Array.isArray(lessonItem.quizIds)) {
      lessonItem.quizIds.forEach((qId: unknown) => {
        if (typeof qId === "string" && !quizIdsSet.has(qId)) {
          console.warn(
            `Data Integrity Warning: Quiz ID '${qId}' referenced in Lesson '${lessonId}' does not exist.`,
          );
        }
      });
    }

    if (typeof lessonItem.quiz === "string") {
      if (!quizIdsSet.has(lessonItem.quiz)) {
        console.warn(
          `Data Integrity Warning: Quiz ID '${lessonItem.quiz}' referenced in Lesson '${lessonId}' does not exist.`,
        );
      }
    }
  });
}
