# Forge — Frontend Engineering Academy (App Shell v1)

Premium, dark-first, fully-routed frontend shell. No backend, no AI calls, no lesson content — every page renders from JSON data providers behind an interface that a real AI/data layer can slot into later.

## Design system

- **Theme**: dark-first (default), light supported. Class-based `.dark` variant already wired. Toggle in top bar + Settings, persisted to `localStorage`.
- **Tokens** (in `src/styles.css`, all `oklch`): near-black background with warm graphite surfaces, ember/amber `--primary` (the "forge" accent), muted foreground, semantic success/warning/destructive, chart palette, `--gradient-primary`, `--gradient-surface`, `--shadow-elegant`, `--shadow-glow`. No hardcoded colors anywhere.
- **Typography**: Inter (body) + JetBrains Mono (code) via `<link>` in `__root.tsx` head; `--font-sans` and `--font-mono` in `@theme`.
- **Motion**: Framer Motion for page transitions, sidebar reveal, command-palette entrance, card hover, list stagger. Respects `prefers-reduced-motion`.
- **Glass**: `bg-card/60 backdrop-blur-xl border border-border/50` utility class `glass-panel` on top bar, command palette, mentor bubbles.

## App layout (`__root.tsx`)

```text
┌──────────────────────────────────────────────────────────┐
│ Sidebar        │ TopBar (breadcrumbs · search · ⌘K · 🔔 · │
│  · Logo        │        theme · profile)                  │
│  · Nav groups  ├──────────────────────────────────────────┤
│  · Streak card │                                          │
│  · Collapse    │            <Outlet />                    │
│                │                                          │
└──────────────────────────────────────────────────────────┘
```

- `SidebarProvider` + shadcn Sidebar, collapsible to icon rail. Mobile: Sheet drawer.
- Top bar: dynamic breadcrumbs from matched routes, global search input that opens Command Palette, `⌘K` trigger, notifications popover, theme toggle, profile menu.
- Command Palette (`cmdk` via shadcn Command): navigate to any page, toggle theme, jump to lesson, open playground, keyboard shortcut list.
- Toast system via `sonner`.

## Routes (22, TanStack file-based)

All files under `src/routes/`. Each has its own `head()` with route-specific title/description/og.

| File                      | URL                                                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------------- |
| `index.tsx`               | `/` → **Dashboard** (rewrite existing placeholder)                                                  |
| `learn.tsx`               | `/learn`                                                                                            |
| `learn.modules.tsx`       | `/learn/modules`                                                                                    |
| `learn.topics.tsx`        | `/learn/topics`                                                                                     |
| `learn.lessons.tsx`       | `/learn/lessons`                                                                                    |
| `lesson.$lessonId.tsx`    | `/lesson/:lessonId`                                                                                 |
| `practice.tsx`            | `/practice`                                                                                         |
| `projects.tsx`            | `/projects`                                                                                         |
| `projects.$projectId.tsx` | `/projects/:projectId`                                                                              |
| `debug-lab.tsx`           | `/debug-lab`                                                                                        |
| `debug-lab.$bugId.tsx`    | `/debug-lab/:bugId`                                                                                 |
| `interview.tsx`           | `/interview`                                                                                        |
| `interview.session.tsx`   | `/interview/session`                                                                                |
| `mentor.tsx`              | `/mentor` (AI chat shell)                                                                           |
| `playground.tsx`          | `/playground` (Monaco)                                                                              |
| `quizzes.tsx`             | `/quizzes`                                                                                          |
| `quizzes.$quizId.tsx`     | `/quizzes/:quizId`                                                                                  |
| `flashcards.tsx`          | `/flashcards`                                                                                       |
| `bookmarks.tsx`           | `/bookmarks`                                                                                        |
| `resources.tsx`           | `/resources`                                                                                        |
| `docs.tsx`                | `/docs`                                                                                             |
| `progress.tsx`            | `/progress`                                                                                         |
| `achievements.tsx`        | `/achievements`                                                                                     |
| `statistics.tsx`          | `/statistics`                                                                                       |
| `challenges.tsx`          | `/challenges`                                                                                       |
| `settings.tsx`            | `/settings` (tabbed: General, Theme, Editor, AI, Learning, Shortcuts, Accessibility, Notifications) |
| `about.tsx`               | `/about`                                                                                            |

## Page anatomy (what each screen actually renders)

- **Dashboard**: greeting + streak, Continue Learning card (large), 3-col skill progress, weekly progress line chart, Daily Challenge card, Recommended Topic, Recent Activity timeline, Learning Calendar heat-strip, Bookmarks preview.
- **Learn / Modules / Topics / Lessons**: filter+search bar, category chips, difficulty + duration filters, animated card grid with progress rings.
- **Lesson view**: 3-column — sticky TOC · reading area (MDX-ready renderer with tip/warning/mistake callouts, code blocks with copy, expandable sections, exercise/quiz/interview blocks, summary, resources) · notes+bookmarks panel; footer with prev/next + progress bar.
- **Playground**: split pane — Monaco (lazy, `<ClientOnly>`), preview iframe, console, instructions/hints tabs, Run/Reset/Solution/Explain buttons.
- **Debug Lab**: bug brief panel, code viewer, investigation notes, hint accordion, "Reveal solution" gated behind confirm, learning summary.
- **Interview Room**: category picker → timed question card, answer editor, difficulty selector, timer, review screen with self-rating.
- **AI Mentor**: full chat UI shell (conversation sidebar, message list with markdown + code + copy/regenerate/stop, suggested prompts, model selector dropdown, typing shimmer) — all `sendMessage` calls hit a `mentorProvider` interface that currently returns a mocked stream; swap to real provider later.
- **Quizzes**: MCQ + code question renderer, progress bar, score screen with per-question explanations.
- **Flashcards**: swipe/keyboard-navigable card with flip animation, self-rating (again/hard/good/easy) — SRS scheduling stub.
- **Progress / Statistics / Achievements**: Recharts line/bar/radar/heatmap, mastery levels, streak, achievement grid with locked/unlocked states.
- **Settings**: form sections with react-hook-form + zod; persists to localStorage.
- **Bookmarks / Resources / Docs / About / Challenges**: list/detail with empty states.

Every page ships polished **loading skeletons**, **empty states**, and **error states**.

## Data layer (AI-ready)

```text
src/
  data/
    modules.json  topics.json  lessons.json  projects.json
    quizzes.json  flashcards.json  achievements.json  bugs.json
    interview-questions.json  resources.json
  lib/
    providers/
      content-provider.ts     // reads JSON now; swap to fetch later
      mentor-provider.ts      // interface { stream(messages) }; mock impl
      progress-provider.ts    // localStorage-backed
      settings-provider.ts    // localStorage-backed
    hooks/
      use-content.ts  use-mentor.ts  use-progress.ts  use-settings.ts
      use-command-palette.ts  use-keyboard-shortcuts.ts  use-theme.ts
```

Components never import JSON directly — they call hooks. Swapping to OpenRouter/Gemini/Claude/OpenAI later means implementing `MentorProvider` and `ContentProvider` interfaces; zero component changes.

## Folder structure

```text
src/
  routes/                     # all 22 route files
  components/
    ui/                       # shadcn primitives
    layout/                   # AppSidebar, TopBar, Breadcrumbs, CommandPalette, ThemeToggle, ProfileMenu, NotificationsPopover, MobileNav
    dashboard/  learn/  lesson/  playground/  mentor/  interview/
    debug/  quiz/  flashcard/  progress/  settings/
    shared/                   # StatCard, ProgressRing, EmptyState, ErrorState, LoadingScreen, PageHeader, CodeBlock, Callout, DifficultyBadge, Timeline, HeatMap
  data/                       # JSON fixtures
  lib/                        # providers, hooks, utils, keymap
  styles.css
```

## Reusable primitives added

Buttons (variants incl. `premium` gradient), Cards, Dialog/Sheet/Drawer, Accordion, Tabs, Dropdown, Popover, Command, Form/Input/Select/Textarea/Switch/Slider, Badge, Progress, Skeleton, Tooltip, Toast, Table, Pagination, Breadcrumb, Timeline, StatCard, EmptyState, ErrorState, LoadingScreen, Callout (tip/warning/mistake/info), CodeBlock (Prism-highlighted, copy button), DifficultyBadge, ProgressRing, HeatMap, ChartCard.

## Keyboard & a11y

- Global shortcuts: `⌘K` palette, `g d` dashboard, `g l` learn, `g m` mentor, `g p` playground, `?` shortcut sheet, `[` `]` prev/next lesson, `⌘.` toggle sidebar, `⌘\` toggle theme.
- Focus rings on every interactive, `aria-label` on all icon buttons, single `<main>` per route in layout, skip-to-content link, `h-dvh` for full-height, contrast checked against tokens.

## Dependencies to add

`framer-motion`, `recharts`, `sonner`, `cmdk` (or via shadcn Command), `@monaco-editor/react` (lazy), `prismjs` + `prism-react-renderer` for static blocks, `date-fns`, `react-hook-form` + `zod` + `@hookform/resolvers` (if missing).

## What is explicitly OUT of v1

- Real lesson/quiz/interview content (fixtures only, ~3–6 sample entries per JSON so lists look alive).
- Real code execution (Playground shows Monaco + iframe scaffold; Run button pipes to a stub runner).
- Real AI calls (Mentor uses a mock streaming generator).
- Auth, cloud, persistence beyond localStorage.

## Verification before finishing

- Typecheck + build pass; every route reachable via sidebar and Command Palette; theme toggle persists; command palette navigates; Monaco loads only on `/playground` (no SSR crash); Playwright screenshot of Dashboard, Lesson, Mentor, Playground, Settings in dark + light.

## Rough execution order (single build turn)

1. Tokens + fonts + theme provider + toaster.
2. Layout: sidebar, top bar, breadcrumbs, command palette, mobile drawer.
3. Data providers + hooks + JSON fixtures.
4. Shared primitives (StatCard, ProgressRing, Callout, CodeBlock, EmptyState, HeatMap, ChartCard).
5. All 22 routes with their real screens (not stubs).
6. Monaco route + mentor mock stream + settings forms.
7. Metadata pass (per-route `head()`), a11y sweep, verification.

## Knowledge Graph

Every lesson, topic, and module should understand its relationships.

Each topic should include:

- Prerequisites

- Next concepts

- Related concepts

- Difficulty

- Estimated mastery time

- Interview frequency

- Real-world usage

The Learn section should support both list view and interactive graph view so learners can visualize how concepts connect.

&nbsp;

&nbsp;

## Mastery System

Do not track only completion.

Every lesson should have one of these states:

- Not Started

- Learning

- Practicing

- Needs Review

- Interview Ready

- Mastered

Mastery should be stored separately from completion and drive recommendations throughout the application.## Engineering Journal

Provide a personal engineering journal.

Allow users to save:

- Notes

- Mistakes

- Debug discoveries

- Interview questions

- Personal explanations

- Future improvements

Support Markdown.

Store locally for v1.

Later this can sync to cloud storage.

&nbsp;

&nbsp;

&nbsp;

## Break My Code

Every coding exercise and project should eventually support a "Break My Code" mode.

This mode intentionally challenges the learner with scenarios such as:

- Unexpected null values

- Large datasets

- Slow networks

- Accessibility issues

- React Strict Mode

- Frequent rerenders

- Browser compatibility

The goal is to teach defensive engineering rather than just successful implementation.

&nbsp;

&nbsp;

&nbsp;

## Frontend Architecture Lab

Include a dedicated section for frontend architecture.

Topics include:

- Component composition

- Folder structures

- State management

- Rendering strategies

- Performance

- Scalability

- Maintainability

- Design patterns

- Refactoring

This section focuses on thinking like a software engineer rather than learning syntax.

&nbsp;

&nbsp;

&nbsp;

&nbsp;

The AI Mentor should prioritize coaching over solution generation.

When possible, guide the learner using questions, hints, code reviews, and progressive assistance instead of immediately providing complete solutions.

&nbsp;

&nbsp;

The Playground should be designed for future expansion to include debugging tools, React component inspection, performance analysis, accessibility checks, and code review.
