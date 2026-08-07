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
} from "@/lib/types";

export interface ProgressState {
  xp: number;
  streakDays: number;
  totalMinutes: number;
  lessonsCompleted: string[];
  solvedBugs: string[];
  bookmarks: string[];
  mastery: Record<string, MasteryState>;
  notes: Record<string, string>;
  weekly: number[];
  heatmap: { date: string; value: number }[];
  skills: { name: string; value: number }[];
  projectTasks: Record<string, boolean>;
  projectCriteria: Record<string, boolean>;
  projectReflections: Record<string, ProjectReflection>;
  projectPortfolioNotes: Record<string, ProjectUserNotes>;
  journalEntries: JournalEntry[];
  interviewResults: InterviewSessionResult[];
  topicMasteryRecords?: Record<string, TopicMasteryRecord>;
  readinessGoalPercent?: number;
  lastActiveLessonId?: string;
  lessonCheckpoints?: Record<string, boolean>;
  lessonHighlights?: Record<string, LessonHighlight[]>;
  activityDates?: string[];
  completedQuizzes?: string[];
  quizResults?: QuizResultRecord[];
  certificates?: CertificateRecord[];
}

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
};

export interface ProgressStoreActions {
  setProgress: (updater: ProgressState | ((prev: ProgressState) => ProgressState)) => void;
  resetProgress: () => void;
  setRawState: (partial: Partial<ProgressState>) => void;
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
    }),
    {
      name: "forge:progress:v1",
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) => {
        return {
          ...currentState,
          ...(persistedState as Partial<ProgressState>),
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
