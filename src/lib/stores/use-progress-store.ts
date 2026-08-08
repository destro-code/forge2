import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  MasteryState,
  TopicMasteryRecord,
  ProjectReflection,
  ProjectUserNotes,
  JournalEntry,
  InterviewSessionResult,
  LessonHighlight,
  QuizResultRecord,
  CertificateRecord,
  FlashcardReviewState,
  WhiteboardSnapshot,
  PlaygroundCompletion,
  ProgressState,
} from "@/lib/types";

export type { ProgressState };

export const EMPTY_PROGRESS_STATE: ProgressState = {
  xp: 0,
  activityDates: [],
  streakDays: 0,
  totalMinutes: 0,
  lessonsCompleted: [],
  solvedBugs: [],
  bookmarks: [],
  mastery: {},
  notes: {},
  weekly: [0, 0, 0, 0, 0, 0, 0],
  heatmap: [],
  skills: [],
  projectTasks: {},
  projectCriteria: {},
  projectReflections: {},
  projectPortfolioNotes: {},
  journalEntries: [],
  interviewResults: [],
  topicMasteryRecords: {},
  readinessGoalPercent: 85,
  lastActiveLessonId: undefined,
  completedQuizzes: [],
  quizResults: [],
  certificates: [],
  flashcardReviews: {},
  challengesCompleted: [],
  challengeStreakDays: 0,
  whiteboardSnapshots: [],
  playgroundCompletions: [],
};

export function deriveStreakDays(activityDates: string[] = []): number {
  if (!activityDates || activityDates.length === 0) return 0;

  const dateSet = new Set(activityDates.map((d) => d.slice(0, 10)));
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  let startDate: Date | null = null;
  if (dateSet.has(todayStr)) {
    startDate = now;
  } else if (dateSet.has(yesterdayStr)) {
    startDate = yesterday;
  } else {
    return 0;
  }

  let streak = 0;
  const checkDate = new Date(startDate);
  while (true) {
    const dateStr = checkDate.toISOString().slice(0, 10);
    if (dateSet.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function computeSM2(
  cardId: string,
  deck: string,
  existing: FlashcardReviewState | undefined,
  rating: "again" | "hard" | "good" | "easy",
): FlashcardReviewState {
  let easeFactor = existing?.easeFactor ?? 2.5;
  let repetitions = existing?.repetitions ?? 0;
  let intervalDays = existing?.intervalDays ?? 0;

  if (rating === "again") {
    repetitions = 0;
    intervalDays = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else if (rating === "hard") {
    repetitions += 1;
    intervalDays = repetitions === 1 ? 1 : Math.max(1, Math.round(intervalDays * 1.2));
    easeFactor = Math.max(1.3, easeFactor - 0.15);
  } else if (rating === "good") {
    repetitions += 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 6;
    else intervalDays = Math.max(1, Math.round(intervalDays * easeFactor));
  } else if (rating === "easy") {
    repetitions += 1;
    if (repetitions === 1) intervalDays = 2;
    else if (repetitions === 2) intervalDays = 7;
    else intervalDays = Math.max(1, Math.round(intervalDays * easeFactor * 1.3));
    easeFactor += 0.15;
  }

  const now = new Date();
  const dueAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000).toISOString();

  return {
    cardId,
    deck,
    easeFactor,
    intervalDays,
    repetitions,
    dueAt,
    lastReviewedAt: now.toISOString(),
    lastRating: rating,
  };
}

export interface ProgressStoreActions {
  setProgress: (updater: ProgressState | ((prev: ProgressState) => ProgressState)) => void;
  resetProgress: () => void;
  setRawState: (partial: Partial<ProgressState>) => void;
  rateFlashcard: (cardId: string, deck: string, rating: "again" | "hard" | "good" | "easy") => void;
  completeChallenge: (challengeId: string) => void;
  saveWhiteboardSnapshot: (
    snapshot: Omit<WhiteboardSnapshot, "id" | "updatedAt"> & { id?: string },
  ) => WhiteboardSnapshot;
  completePlaygroundExercise: (templateId: string) => void;
}

export type ProgressStore = ProgressState & ProgressStoreActions;

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      ...EMPTY_PROGRESS_STATE,

      setProgress: (updater) => {
        const current = get();
        const currentState: ProgressState = {
          xp: current.xp ?? 0,
          streakDays: current.streakDays ?? 0,
          totalMinutes: current.totalMinutes ?? 0,
          lessonsCompleted: current.lessonsCompleted ?? [],
          solvedBugs: current.solvedBugs ?? [],
          bookmarks: current.bookmarks ?? [],
          mastery: current.mastery ?? {},
          notes: current.notes ?? {},
          weekly: current.weekly ?? [0, 0, 0, 0, 0, 0, 0],
          heatmap: current.heatmap ?? [],
          skills: current.skills ?? [],
          projectTasks: current.projectTasks ?? {},
          projectCriteria: current.projectCriteria ?? {},
          projectReflections: current.projectReflections ?? {},
          projectPortfolioNotes: current.projectPortfolioNotes ?? {},
          journalEntries: current.journalEntries ?? [],
          interviewResults: current.interviewResults ?? [],
          topicMasteryRecords: current.topicMasteryRecords ?? {},
          readinessGoalPercent: current.readinessGoalPercent ?? 85,
          lastActiveLessonId: current.lastActiveLessonId,
          lessonCheckpoints: current.lessonCheckpoints ?? {},
          lessonHighlights: current.lessonHighlights ?? {},
          activityDates: current.activityDates ?? [],
          completedQuizzes: current.completedQuizzes ?? [],
          quizResults: current.quizResults ?? [],
          certificates: current.certificates ?? [],
          flashcardReviews: current.flashcardReviews ?? {},
          challengesCompleted: current.challengesCompleted ?? [],
          challengeStreakDays: current.challengeStreakDays ?? 0,
          whiteboardSnapshots: current.whiteboardSnapshots ?? [],
          playgroundCompletions: current.playgroundCompletions ?? [],
        };

        const nextState = typeof updater === "function" ? updater(currentState) : updater;

        set(nextState);
      },

      resetProgress: () => {
        set(EMPTY_PROGRESS_STATE);
      },

      setRawState: (partial) => {
        set(partial);
      },

      rateFlashcard: (cardId, deck, rating) => {
        set((state) => {
          const existing = state.flashcardReviews?.[cardId];
          const review = computeSM2(cardId, deck, existing, rating);
          return {
            flashcardReviews: {
              ...(state.flashcardReviews || {}),
              [cardId]: review,
            },
          };
        });
      },

      completeChallenge: (challengeId) => {
        set((state) => {
          const currentChallenges = state.challengesCompleted || [];
          const newChallenges = currentChallenges.includes(challengeId)
            ? currentChallenges
            : [...currentChallenges, challengeId];

          const today = new Date().toISOString().slice(0, 10);
          const currentActivityDates = state.activityDates || [];
          const newActivityDates = currentActivityDates.includes(today)
            ? currentActivityDates
            : [...currentActivityDates, today];

          const streak = deriveStreakDays(newActivityDates);

          return {
            challengesCompleted: newChallenges,
            activityDates: newActivityDates,
            challengeStreakDays: streak,
          };
        });
      },

      saveWhiteboardSnapshot: (snapshotData) => {
        const now = new Date().toISOString();
        const id =
          snapshotData.id || `ws_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const snapshot: WhiteboardSnapshot = {
          ...snapshotData,
          id,
          updatedAt: now,
        };

        set((state) => {
          const existing = state.whiteboardSnapshots || [];
          const index = existing.findIndex((s) => s.id === id);
          let updated: WhiteboardSnapshot[];
          if (index >= 0) {
            updated = [...existing];
            updated[index] = snapshot;
          } else {
            updated = [snapshot, ...existing];
          }
          return { whiteboardSnapshots: updated };
        });

        return snapshot;
      },

      completePlaygroundExercise: (templateId) => {
        set((state) => {
          const today = new Date().toISOString().slice(0, 10);
          const currentActivityDates = state.activityDates || [];
          const newActivityDates = currentActivityDates.includes(today)
            ? currentActivityDates
            : [...currentActivityDates, today];

          const currentCompletions = state.playgroundCompletions || [];
          const newCompletions = [
            ...currentCompletions,
            { templateId, completedAt: new Date().toISOString() },
          ];

          return {
            playgroundCompletions: newCompletions,
            xp: (state.xp || 0) + 25,
            activityDates: newActivityDates,
          };
        });
      },
    }),
    {
      name: "forge:progress:v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown, version: number): ProgressState => {
        const state = (
          persistedState && typeof persistedState === "object" ? persistedState : {}
        ) as any;

        if (version === undefined || version < 1) {
          return {
            ...state,
            flashcardReviews:
              (state.flashcardReviews as Record<string, FlashcardReviewState>) ?? {},
            challengesCompleted: (state.challengesCompleted as string[]) ?? [],
            challengeStreakDays:
              typeof state.challengeStreakDays === "number" ? state.challengeStreakDays : 0,
            whiteboardSnapshots: (state.whiteboardSnapshots as WhiteboardSnapshot[]) ?? [],
            playgroundCompletions: (state.playgroundCompletions as PlaygroundCompletion[]) ?? [],
          } as ProgressState;
        }

        return state as ProgressState;
      },
      merge: (persistedState, currentState) => {
        const pState = (persistedState as Partial<ProgressState>) || {};
        return {
          ...currentState,
          ...pState,
          flashcardReviews: pState.flashcardReviews ?? currentState.flashcardReviews ?? {},
          challengesCompleted: pState.challengesCompleted ?? currentState.challengesCompleted ?? [],
          challengeStreakDays: pState.challengeStreakDays ?? currentState.challengeStreakDays ?? 0,
          whiteboardSnapshots: pState.whiteboardSnapshots ?? currentState.whiteboardSnapshots ?? [],
          playgroundCompletions:
            pState.playgroundCompletions ?? currentState.playgroundCompletions ?? [],
        };
      },
    },
  ),
);

// Cross-tab synchronization
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === "forge:progress:v1" || event.key === null) {
      useProgressStore.persist.rehydrate();
    }
  });
}
