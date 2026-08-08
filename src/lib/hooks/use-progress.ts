import {
  progressStore,
  getDerivedProgress,
  type ProgressState,
} from "@/lib/providers/progress-provider";
import { getModuleProgress, getTopicProgress } from "@/lib/hooks/use-curriculum";
export { getModuleProgress, getTopicProgress };
import type {
  MasteryState,
  ProjectReflection,
  ProjectUserNotes,
  JournalEntry,
  InterviewSessionResult,
  QuizResultRecord,
  TopicMasteryRecord,
  CertificateRecord,
  WhiteboardSnapshot,
} from "@/lib/types";
import { useProgressStore } from "@/lib/stores/use-progress-store";
import topicsData from "@/data/topics.json";
import learningPathsData from "@/data/learning-paths.json";

function getMasteryLabelFromConfidence(confidence: number): MasteryState {
  if (confidence >= 85) return "Mastered";
  if (confidence >= 70) return "Interview Ready";
  if (confidence >= 50) return "Practicing";
  if (confidence >= 30) return "Learning";
  if (confidence > 0) return "Needs Review";
  return "Not Started";
}

function recordActivityState(p: ProgressState): ProgressState {
  const today = new Date().toISOString().slice(0, 10);
  const activityDates = p.activityDates || [];
  if (activityDates.includes(today)) {
    return p;
  }
  return {
    ...p,
    activityDates: [...activityDates, today],
  };
}

export function useProgress() {
  const [rawProgress, setProgress] = progressStore.useStore();
  const progress = getDerivedProgress(rawProgress);

  return {
    ...progress,
    recordActivity() {
      setProgress((p) => recordActivityState(p));
    },
    saveQuizResult(quizId: string, scorePercent: number, topicId?: string) {
      setProgress((p) => {
        const withActivity = recordActivityState(p);
        const currentQuizResults = withActivity.quizResults || [];

        const newResult: QuizResultRecord = {
          id: `qr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          quizId,
          topicId,
          scorePercent,
          completedAt: new Date().toISOString(),
        };

        const quizResults = [newResult, ...currentQuizResults];

        const currentTopicRecords = withActivity.topicMasteryRecords || {};
        const updatedTopicRecords = { ...currentTopicRecords };

        if (topicId) {
          const existing = currentTopicRecords[topicId];
          if (existing) {
            const oldConfidence = existing.confidence ?? 50;
            const newConfidence = Math.min(
              100,
              Math.max(0, Math.round(oldConfidence * 0.6 + scorePercent * 0.4)),
            );
            const newMastery = getMasteryLabelFromConfidence(newConfidence);

            updatedTopicRecords[topicId] = {
              ...existing,
              quizScorePercent: scorePercent,
              reviewCount: (existing.reviewCount || 0) + 1,
              lastReviewedAt: new Date().toISOString(),
              confidence: newConfidence,
              mastery: newMastery,
            };
          } else {
            const topic = topicsData.find((t) => t.id === topicId);
            const category = topic
              ? topic.categoryId === "core-web"
                ? "HTML/CSS"
                : topic.categoryId === "language-mastery"
                  ? "JavaScript"
                  : topic.categoryId === "framework-mastery"
                    ? "React"
                    : "Architecture"
              : "General";

            const confidence = Math.min(100, Math.max(0, Math.round(scorePercent)));
            updatedTopicRecords[topicId] = {
              topicId,
              topicTitle: topic ? topic.title : topicId,
              category,
              confidence,
              mastery: getMasteryLabelFromConfidence(confidence),
              lastReviewedAt: new Date().toISOString(),
              nextReviewAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              intervalDays: 7,
              reviewCount: 1,
              quizScorePercent: scorePercent,
            };
          }
        }

        return {
          ...withActivity,
          quizResults,
          topicMasteryRecords: updatedTopicRecords,
        };
      });
    },
    setMastery(lessonId: string, state: MasteryState) {
      setProgress((p) => ({ ...p, mastery: { ...p.mastery, [lessonId]: state } }));
    },
    toggleBookmark(id: string) {
      setProgress((p) => ({
        ...p,
        bookmarks: p.bookmarks.includes(id)
          ? p.bookmarks.filter((b) => b !== id)
          : [...p.bookmarks, id],
      }));
    },
    completeLesson(id: string) {
      setProgress((p) => {
        const withActivity = recordActivityState(p);
        return {
          ...withActivity,
          lastActiveLessonId: id,
          lessonsCompleted: withActivity.lessonsCompleted.includes(id)
            ? withActivity.lessonsCompleted
            : [...withActivity.lessonsCompleted, id],
        };
      });
    },
    setLastActiveLesson(id: string) {
      setProgress((p) => {
        if (p.lastActiveLessonId === id) return p;
        return { ...p, lastActiveLessonId: id };
      });
    },
    completeBug(id: string) {
      setProgress((p) => {
        const withActivity = recordActivityState(p);
        const solved = withActivity.solvedBugs || [];
        return {
          ...withActivity,
          solvedBugs: solved.includes(id) ? solved : [...solved, id],
        };
      });
    },
    saveNote(key: string, value: string) {
      setProgress((p) => ({ ...p, notes: { ...p.notes, [key]: value } }));
    },
    toggleCheckpoint(lessonId: string, checkpointId: string) {
      const key = `${lessonId}:${checkpointId}`;
      setProgress((p) => {
        const checkpoints = p.lessonCheckpoints || {};
        return {
          ...p,
          lessonCheckpoints: {
            ...checkpoints,
            [key]: !checkpoints[key],
          },
        };
      });
    },
    addHighlight(
      lessonId: string,
      item: { text: string; color: import("@/lib/types").LessonHighlightColor; note?: string },
    ) {
      const newHighlight: import("@/lib/types").LessonHighlight = {
        id: `hl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        lessonId,
        text: item.text,
        color: item.color,
        note: item.note,
        createdAt: new Date().toISOString(),
      };
      setProgress((p) => {
        const currentHLs = p.lessonHighlights || {};
        const list = currentHLs[lessonId] || [];
        return {
          ...p,
          lessonHighlights: {
            ...currentHLs,
            [lessonId]: [newHighlight, ...list],
          },
        };
      });
      return newHighlight;
    },
    removeHighlight(lessonId: string, highlightId: string) {
      setProgress((p) => {
        const currentHLs = p.lessonHighlights || {};
        const list = currentHLs[lessonId] || [];
        return {
          ...p,
          lessonHighlights: {
            ...currentHLs,
            [lessonId]: list.filter((h) => h.id !== highlightId),
          },
        };
      });
    },
    toggleProjectTask(projectId: string, taskId: string) {
      setProgress((p) => {
        const key = `${projectId}:${taskId}`;
        const currentTasks = p.projectTasks || {};
        return {
          ...p,
          projectTasks: {
            ...currentTasks,
            [key]: !currentTasks[key],
          },
        };
      });
    },
    toggleProjectCriteria(projectId: string, criteriaId: string) {
      setProgress((p) => {
        const key = `${projectId}:${criteriaId}`;
        const currentCriteria = p.projectCriteria || {};
        return {
          ...p,
          projectCriteria: {
            ...currentCriteria,
            [key]: !currentCriteria[key],
          },
        };
      });
    },
    saveProjectReflection(projectId: string, reflection: Partial<ProjectReflection>) {
      setProgress((p) => {
        const currentReflections = p.projectReflections || {};
        const existing = currentReflections[projectId] || {
          challenge: "",
          solution: "",
          learned: "",
          scaleRefactor: "",
        };
        return {
          ...p,
          projectReflections: {
            ...currentReflections,
            [projectId]: { ...existing, ...reflection },
          },
        };
      });
    },
    saveProjectPortfolioNotes(projectId: string, notes: Partial<ProjectUserNotes>) {
      setProgress((p) => {
        const currentNotes = p.projectPortfolioNotes || {};
        const existing = currentNotes[projectId] || {
          repoUrl: "",
          demoUrl: "",
          customBullets: "",
          highlight: "",
        };
        return {
          ...p,
          projectPortfolioNotes: {
            ...currentNotes,
            [projectId]: { ...existing, ...notes },
          },
        };
      });
    },
    addJournalEntry(entry: Omit<JournalEntry, "id" | "createdAt" | "updatedAt">) {
      const newEntry: JournalEntry = {
        ...entry,
        id: `j_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProgress((p) => ({
        ...p,
        journalEntries: [newEntry, ...(p.journalEntries || [])],
      }));
      return newEntry;
    },
    updateJournalEntry(id: string, updates: Partial<JournalEntry>) {
      setProgress((p) => ({
        ...p,
        journalEntries: (p.journalEntries || []).map((j) =>
          j.id === id ? { ...j, ...updates, updatedAt: new Date().toISOString() } : j,
        ),
      }));
    },
    deleteJournalEntry(id: string) {
      setProgress((p) => ({
        ...p,
        journalEntries: (p.journalEntries || []).filter((j) => j.id !== id),
      }));
    },
    toggleJournalFavorite(id: string) {
      setProgress((p) => ({
        ...p,
        journalEntries: (p.journalEntries || []).map((j) =>
          j.id === id ? { ...j, isFavorite: !j.isFavorite } : j,
        ),
      }));
    },
    saveInterviewResult(result: Omit<InterviewSessionResult, "id" | "completedAt">) {
      const newResult: InterviewSessionResult = {
        ...result,
        id: `ir_${Date.now()}`,
        completedAt: new Date().toISOString(),
      };
      setProgress((p) => ({
        ...p,
        interviewResults: [newResult, ...(p.interviewResults || [])],
      }));
      return newResult;
    },
    clearInterviewResults() {
      setProgress((p) => ({
        ...p,
        interviewResults: [],
      }));
    },
    saveCertificate(pathId: string, score: number) {
      const pathObj = learningPathsData.find((p) => p.id === pathId);
      const pathTitle = pathObj ? pathObj.title : pathId;
      const newCert: CertificateRecord = {
        id: `cert_${pathId}_${Date.now()}`,
        pathId,
        pathTitle,
        score,
        issuedAt: new Date().toISOString(),
      };

      setProgress((p) => {
        const withActivity = recordActivityState(p);
        const existing = withActivity.certificates || [];
        const filtered = existing.filter((c) => c.pathId !== pathId);
        return {
          ...withActivity,
          certificates: [newCert, ...filtered],
        };
      });
      return newCert;
    },
    rateFlashcard(cardId: string, deck: string, rating: "again" | "hard" | "good" | "easy") {
      useProgressStore.getState().rateFlashcard(cardId, deck, rating);
    },
    completeChallenge(challengeId: string) {
      useProgressStore.getState().completeChallenge(challengeId);
    },
    saveWhiteboardSnapshot(
      snapshot: Omit<WhiteboardSnapshot, "id" | "updatedAt"> & { id?: string },
    ) {
      return useProgressStore.getState().saveWhiteboardSnapshot(snapshot);
    },
    completePlaygroundExercise(templateId: string) {
      useProgressStore.getState().completePlaygroundExercise(templateId);
    },
  };
}
