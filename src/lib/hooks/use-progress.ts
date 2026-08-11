import {
  progressStore,
  getDerivedProgress,
  getMasteryLabelFromConfidence,
  updateTopicMasteryRecord,
  type ProgressState,
} from "@/lib/providers/progress-provider";
import { getModuleProgress, getTopicProgress } from "@/lib/hooks/use-curriculum";
export {
  getModuleProgress,
  getTopicProgress,
  getMasteryLabelFromConfidence,
  updateTopicMasteryRecord,
};
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
import bugsData from "@/data/bugs.json";
import projectsData from "@/data/projects.json";

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

        // Calculate score improvement and incremental XP to prevent XP farming exploit
        const prevResultsForQuiz = currentQuizResults.filter((r) => r.quizId === quizId);
        const prevMaxScore =
          prevResultsForQuiz.length > 0
            ? Math.max(...prevResultsForQuiz.map((r) => r.scorePercent))
            : 0;
        const prevXpEarned = Math.round((prevMaxScore / 100) * 50);

        const newMaxScore = Math.max(prevMaxScore, scorePercent);
        const newXpEarned = Math.round((newMaxScore / 100) * 50);
        const incrementalXp = Math.max(0, newXpEarned - prevXpEarned);

        const completedQuizzes = withActivity.completedQuizzes || [];
        const updatedCompletedQuizzes = completedQuizzes.includes(quizId)
          ? completedQuizzes
          : [...completedQuizzes, quizId];

        const newResult: QuizResultRecord = {
          id: `qr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          quizId,
          topicId,
          scorePercent,
          completedAt: new Date().toISOString(),
        };

        const quizResults = [newResult, ...currentQuizResults];

        let updatedTopicRecords = withActivity.topicMasteryRecords || {};
        if (topicId) {
          const existing = updatedTopicRecords[topicId];
          const oldConfidence = existing?.confidence ?? 50;
          const newConfidence = Math.min(
            100,
            Math.max(0, Math.round(oldConfidence * 0.6 + scorePercent * 0.4)),
          );

          updatedTopicRecords = updateTopicMasteryRecord(updatedTopicRecords, topicId, {
            confidence: newConfidence,
            quizScorePercent: scorePercent,
            reviewCountDelta: 1,
            lastReviewedAt: new Date().toISOString(),
          });
        }

        return {
          ...withActivity,
          xp: (withActivity.xp || 0) + incrementalXp,
          completedQuizzes: updatedCompletedQuizzes,
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
        const isAlreadyCompleted = withActivity.lessonsCompleted.includes(id);
        const newCompleted = isAlreadyCompleted
          ? withActivity.lessonsCompleted
          : [...withActivity.lessonsCompleted, id];

        const xpBonus = isAlreadyCompleted ? 0 : 50;

        return {
          ...withActivity,
          xp: (withActivity.xp || 0) + xpBonus,
          lastActiveLessonId: id,
          lessonsCompleted: newCompleted,
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
        if (solved.includes(id)) {
          return withActivity;
        }

        const newSolved = [...solved, id];
        const newXp = (withActivity.xp || 0) + 100;

        const bug = (bugsData as import("@/lib/types").Bug[]).find((b) => b.id === id);
        let updatedRecords = withActivity.topicMasteryRecords || {};

        if (bug && bug.topicId) {
          const existingRec = updatedRecords[bug.topicId];
          const curConfidence = existingRec?.confidence ?? 50;
          const newConfidence = Math.min(100, curConfidence + 15);

          updatedRecords = updateTopicMasteryRecord(updatedRecords, bug.topicId, {
            confidence: newConfidence,
            reviewCountDelta: 1,
            lastReviewedAt: new Date().toISOString(),
          });
        }

        return {
          ...withActivity,
          solvedBugs: newSolved,
          xp: newXp,
          topicMasteryRecords: updatedRecords,
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
        const nextCriteria = {
          ...currentCriteria,
          [key]: !currentCriteria[key],
        };

        const project = (projectsData as import("@/lib/types").Project[]).find(
          (proj) => proj.id === projectId,
        );
        const allCriteria = project?.acceptanceCriteria || [];

        const wasAllCompleteBefore =
          allCriteria.length > 0 &&
          allCriteria.every((c) => currentCriteria[`${projectId}:${c.id}`] === true);

        const isAllCompleteAfter =
          allCriteria.length > 0 &&
          allCriteria.every((c) => nextCriteria[`${projectId}:${c.id}`] === true);

        const completedProjects = p.completedProjects || [];
        const isFirstComplete =
          !completedProjects.includes(projectId) && !wasAllCompleteBefore && isAllCompleteAfter;

        let xpBonus = 0;
        let newCompletedProjects = completedProjects;
        let updatedRecords = p.topicMasteryRecords || {};

        if (isFirstComplete) {
          xpBonus = 250;
          newCompletedProjects = [...completedProjects, projectId];

          if (project?.moduleId) {
            const matchingTopics = (topicsData as import("@/lib/types").Topic[]).filter(
              (t) => t.moduleId === project.moduleId,
            );
            for (const t of matchingTopics) {
              const curConf = updatedRecords[t.id]?.confidence ?? 50;
              const newConf = Math.min(100, curConf + 10);
              updatedRecords = updateTopicMasteryRecord(updatedRecords, t.id, {
                confidence: newConf,
                lastReviewedAt: new Date().toISOString(),
              });
            }
          }
        }

        return {
          ...p,
          projectCriteria: nextCriteria,
          completedProjects: newCompletedProjects,
          xp: (p.xp || 0) + xpBonus,
          topicMasteryRecords: updatedRecords,
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
