import { progressStore } from "@/lib/providers/progress-provider";
import type {
  MasteryState,
  ProjectReflection,
  ProjectUserNotes,
  JournalEntry,
  InterviewSessionResult,
} from "@/lib/types";

export function useProgress() {
  const [progress, setProgress] = progressStore.useStore();
  return {
    ...progress,
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
      setProgress((p) => ({
        ...p,
        lastActiveLessonId: id,
        lessonsCompleted: p.lessonsCompleted.includes(id)
          ? p.lessonsCompleted
          : [...p.lessonsCompleted, id],
      }));
    },
    setLastActiveLesson(id: string) {
      setProgress((p) => {
        if (p.lastActiveLessonId === id) return p;
        return { ...p, lastActiveLessonId: id };
      });
    },
    completeBug(id: string) {
      setProgress((p) => {
        const solved = p.solvedBugs || [];
        return {
          ...p,
          solvedBugs: solved.includes(id) ? solved : [...solved, id],
        };
      });
    },
    saveNote(key: string, value: string) {
      setProgress((p) => ({ ...p, notes: { ...p.notes, [key]: value } }));
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
  };
}
