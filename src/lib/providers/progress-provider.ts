import { createLocalStore } from "../local-store";
import type {
  MasteryState,
  TopicMasteryRecord,
  ProjectReflection,
  ProjectUserNotes,
  JournalEntry,
  InterviewSessionResult,
  LessonHighlight,
} from "../types";

export interface ProgressState {
  streakDays: number;
  totalMinutes: number;
  lessonsCompleted: string[];
  solvedBugs: string[];
  bookmarks: string[];
  mastery: Record<string, MasteryState>;
  notes: Record<string, string>;
  weekly: number[]; // last 7 days minutes
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
  lessonCheckpoints?: Record<string, boolean>; // key format: lessonId:checkpointId -> boolean
  lessonHighlights?: Record<string, LessonHighlight[]>; // key: lessonId -> array of highlights
}

const seedHeatmap = () => {
  const out: { date: string; value: number }[] = [];
  const now = new Date("2026-07-29T00:00:00Z");
  for (let i = 0; i < 84; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - (83 - i));
    const seed = (i * 9301 + 49297) % 233280;
    out.push({ date: d.toISOString().slice(0, 10), value: Math.round((seed / 233280) * 4) });
  }
  return out;
};

const initialJournalEntries: JournalEntry[] = [
  {
    id: "j1",
    title: "Compound Component Pattern with React Context",
    category: "code_note",
    content:
      "Compound components share state internally using React Context while keeping parent APIs clean and intuitive for consumers.\n\n### Benefits\n- Eliminates prop drilling for deep subcomponents.\n- Flexible ordering of triggers, headers, and content items.\n- Clean separation of concerns.",
    codeSnippet: {
      language: "tsx",
      code: `const ModalContext = React.createContext<{ isOpen: boolean; close: () => void } | null>(null);\n\nexport function Modal({ children }: { children: React.ReactNode }) {\n  const [isOpen, setIsOpen] = useState(false);\n  return (\n    <ModalContext.Provider value={{ isOpen, close: () => setIsOpen(false) }}>\n      {children}\n    </ModalContext.Provider>\n  );\n}`,
    },
    tags: ["React", "Architecture", "Design System"],
    isFavorite: true,
    createdAt: "2026-07-28T14:30:00Z",
    updatedAt: "2026-07-28T14:30:00Z",
  },
  {
    id: "j2",
    title: "Stale Closure in useEffect Event Listener",
    category: "mistake",
    content:
      "Encountered a bug where window scroll listener referenced outdated state value when handler was registered once on mount.",
    mistakeDetail: {
      symptom: "Scroll progress bar stopped updating after user filtered items.",
      rootCause:
        "useEffect had empty dependency array [] while referencing itemCount state inside the listener handler.",
      fix: "Used a custom useLatest ref hook or included itemCount in dependency array with proper event cleanup.",
    },
    tags: ["React", "Hooks", "Bugs"],
    isFavorite: false,
    createdAt: "2026-07-26T10:15:00Z",
    updatedAt: "2026-07-26T10:15:00Z",
  },
  {
    id: "j3",
    title: "OKLCH Color Space for Smooth Palette Generation",
    category: "discovery",
    content:
      "OKLCH provides perceptually uniform brightness scaling compared to standard HSL. When generating dark mode surface colors, OKLCH avoids unexpected saturation spikes.",
    discoveryDetail: {
      keyTakeaway:
        "Use OKLCH for CSS variable color tokens to preserve consistent contrast ratios across light and dark themes.",
      resourceUrl: "https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl",
    },
    tags: ["CSS", "Design Tokens", "A11y"],
    isFavorite: true,
    createdAt: "2026-07-25T09:00:00Z",
    updatedAt: "2026-07-25T09:00:00Z",
  },
  {
    id: "j4",
    title: "Debouncing High-Frequency Resize Observer Callback",
    category: "code_note",
    content:
      "ResizeObserver can fire dozens of times per second during window drag, causing layout thrashing if state is updated directly in the callback.",
    codeSnippet: {
      language: "typescript",
      code: `function useResizeObserver(ref: React.RefObject<HTMLElement>) {\n  const [size, setSize] = useState({ width: 0, height: 0 });\n  useEffect(() => {\n    if (!ref.current) return;\n    let rafId: number;\n    const observer = new ResizeObserver(([entry]) => {\n      cancelAnimationFrame(rafId);\n      rafId = requestAnimationFrame(() => {\n        setSize({ width: entry.contentRect.width, height: entry.contentRect.height });\n      });\n    });\n    observer.observe(ref.current);\n    return () => observer.disconnect();\n  }, [ref]);\n  return size;\n}`,
    },
    tags: ["Performance", "DOM", "React"],
    isFavorite: false,
    createdAt: "2026-07-22T16:45:00Z",
    updatedAt: "2026-07-22T16:45:00Z",
  },
  {
    id: "j5",
    title: "Unintentional Re-renders from Inline Object Props",
    category: "mistake",
    content:
      "Passing inline object literal props like style={{ marginTop: 10 }} to memoized subcomponents invalidates React.memo checks on every parent render.",
    mistakeDetail: {
      symptom: "React Profiler showed 120 extra child re-renders per keystroke in search box.",
      rootCause: "Inline object literal creates a new object reference on every render frame.",
      fix: "Extracted constant styles outside component body or used Tailwind CSS utility classes.",
    },
    tags: ["React", "Performance", "Optimization"],
    isFavorite: true,
    createdAt: "2026-07-20T11:20:00Z",
    updatedAt: "2026-07-20T11:20:00Z",
  },
];

export const initialTopicMasteryRecords: Record<string, TopicMasteryRecord> = {
  closures: {
    topicId: "closures",
    topicTitle: "Closures & Lexical Scope",
    category: "JavaScript",
    confidence: 45,
    mastery: "Needs Review",
    lastReviewedAt: "2026-07-24T10:00:00Z",
    nextReviewAt: "2026-07-28T10:00:00Z",
    intervalDays: 3,
    reviewCount: 2,
    quizScorePercent: 50,
    notes: "Review inner function variable retention and memory leak traps.",
  },
  "event-loop": {
    topicId: "event-loop",
    topicTitle: "The Event Loop & Microtasks",
    category: "JavaScript",
    confidence: 78,
    mastery: "Practicing",
    lastReviewedAt: "2026-07-27T14:00:00Z",
    nextReviewAt: "2026-07-30T14:00:00Z",
    intervalDays: 3,
    reviewCount: 4,
    quizScorePercent: 80,
  },
  useeffect: {
    topicId: "useeffect",
    topicTitle: "useEffect Lifecycle & Cleanup",
    category: "React",
    confidence: 52,
    mastery: "Needs Review",
    lastReviewedAt: "2026-07-23T09:00:00Z",
    nextReviewAt: "2026-07-27T09:00:00Z",
    intervalDays: 4,
    reviewCount: 3,
    quizScorePercent: 55,
  },
  flexbox: {
    topicId: "flexbox",
    topicTitle: "Flexbox Main/Cross Axes Alignment",
    category: "CSS",
    confidence: 96,
    mastery: "Mastered",
    lastReviewedAt: "2026-07-20T12:00:00Z",
    nextReviewAt: "2026-08-10T12:00:00Z",
    intervalDays: 20,
    reviewCount: 7,
    quizScorePercent: 100,
  },
  grid: {
    topicId: "grid",
    topicTitle: "CSS Grid 2D Area Layout",
    category: "CSS",
    confidence: 88,
    mastery: "Interview Ready",
    lastReviewedAt: "2026-07-25T11:00:00Z",
    nextReviewAt: "2026-08-04T11:00:00Z",
    intervalDays: 10,
    reviewCount: 5,
    quizScorePercent: 90,
  },
  "ts-generics": {
    topicId: "ts-generics",
    topicTitle: "TypeScript Generics & Conditional Types",
    category: "TypeScript",
    confidence: 62,
    mastery: "Learning",
    lastReviewedAt: "2026-07-28T16:00:00Z",
    nextReviewAt: "2026-07-31T16:00:00Z",
    intervalDays: 3,
    reviewCount: 2,
    quizScorePercent: 65,
  },
  "react-render-cycle": {
    topicId: "react-render-cycle",
    topicTitle: "React Virtual DOM & Reconciliation",
    category: "React",
    confidence: 91,
    mastery: "Interview Ready",
    lastReviewedAt: "2026-07-26T15:00:00Z",
    nextReviewAt: "2026-08-05T15:00:00Z",
    intervalDays: 10,
    reviewCount: 6,
    quizScorePercent: 95,
  },
  "web-performance": {
    topicId: "web-performance",
    topicTitle: "Core Web Vitals & Bundle Splitting",
    category: "Performance",
    confidence: 38,
    mastery: "Learning",
    lastReviewedAt: "2026-07-22T10:00:00Z",
    nextReviewAt: "2026-07-25T10:00:00Z",
    intervalDays: 2,
    reviewCount: 1,
    quizScorePercent: 40,
  },
  "system-design-crdt": {
    topicId: "system-design-crdt",
    topicTitle: "Collaborative Canvas & CRDT Architecture",
    category: "System Design",
    confidence: 32,
    mastery: "Not Started",
    lastReviewedAt: "2026-07-18T08:00:00Z",
    nextReviewAt: "2026-07-22T08:00:00Z",
    intervalDays: 1,
    reviewCount: 0,
    quizScorePercent: 30,
  },
  "a11y-aria": {
    topicId: "a11y-aria",
    topicTitle: "WCAG Accessibility & ARIA Combobox",
    category: "CSS",
    confidence: 85,
    mastery: "Mastered",
    lastReviewedAt: "2026-07-27T10:00:00Z",
    nextReviewAt: "2026-08-10T10:00:00Z",
    intervalDays: 14,
    reviewCount: 5,
    quizScorePercent: 90,
  },
};

export const progressStore = createLocalStore<ProgressState>("forge:progress:v1", {
  streakDays: 12,
  totalMinutes: 1840,
  lessonsCompleted: ["flexbox-axes"],
  solvedBugs: [],
  bookmarks: ["useeffect-mental-model", "rendering-strategies-overview"],
  mastery: {
    "flexbox-axes": "Mastered",
    "useeffect-mental-model": "Practicing",
    "closures-intro": "Learning",
    "rendering-strategies-overview": "Not Started",
  },
  notes: {},
  weekly: [42, 18, 65, 30, 90, 55, 78],
  heatmap: seedHeatmap(),
  skills: [
    { name: "HTML/CSS", value: 82 },
    { name: "JavaScript", value: 68 },
    { name: "TypeScript", value: 54 },
    { name: "React", value: 61 },
    { name: "Architecture", value: 38 },
    { name: "Performance", value: 42 },
    { name: "Testing", value: 30 },
    { name: "Interview", value: 25 },
  ],
  projectTasks: {
    "component-library:t1": true,
    "component-library:t2": true,
    "component-library:t3": true,
  },
  projectCriteria: {
    "component-library:ac1": true,
  },
  projectReflections: {},
  projectPortfolioNotes: {},
  journalEntries: initialJournalEntries,
  interviewResults: [],
  topicMasteryRecords: initialTopicMasteryRecords,
  readinessGoalPercent: 85,
  lastActiveLessonId: "closures-intro",
});
