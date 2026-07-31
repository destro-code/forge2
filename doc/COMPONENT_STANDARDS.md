# Forge Component Standards
Version: 2.0

---

# Philosophy

Components are the building blocks of Forge.

Every component must be reusable.

Every component must have one clear responsibility.

Components should be easy to understand, easy to test, easy to extend, and easy to replace.

Forge should never become a collection of large, tightly coupled components.

---

# Core Principles

Every component must follow:

• Single Responsibility Principle (SRP)

• Composition over inheritance

• Reusability

• Accessibility first

• Mobile-first design

• Predictable props

• Type safety

• No duplicated logic

---

# Component Categories

Forge components are divided into the following categories.

---

## 1. UI Components

Purpose

Pure visual building blocks.

Examples

Button

Input

Textarea

Card

Badge

Dialog

Tooltip

Tabs

Accordion

Progress

Avatar

Dropdown

Command

Toast

Skeleton

Switch

Checkbox

Radio

Slider

Select

Table

Pagination

Breadcrumb

These components should contain no business logic.

---

## 2. Layout Components

Purpose

Arrange pages.

Examples

Sidebar

TopBar

Footer

PageLayout

Section

Container

Grid

SplitPane

ResizablePanel

MobileDrawer

BottomNavigation

---

## 3. Feature Components

Purpose

Contain feature-specific logic.

Examples

LessonCard

ModuleCard

TopicCard

PracticeCard

QuizCard

DebugCard

ProjectCard

InterviewCard

AchievementCard

StatisticsCard

RoadmapNode

---

## 4. Shared Components

Purpose

Used throughout the application.

Examples

PageHeader

SearchBar

DifficultyBadge

ProgressRing

Callout

CodeBlock

EmptyState

ErrorState

LoadingScreen

Timeline

HeatMap

ChartCard

---

## 5. Provider Components

Purpose

Provide application state.

Examples

ThemeProvider

ProgressProvider

SettingsProvider

MentorProvider

ContentProvider

CommandPaletteProvider

Providers should never render UI.

---

# Folder Structure

src/

components/

ui/

layout/

dashboard/

learn/

lesson/

practice/

quiz/

debug/

mentor/

interview/

projects/

playground/

progress/

statistics/

settings/

shared/

Every folder should only contain components belonging to that feature.

---

# Naming Convention

Good

LessonCard

LessonHeader

LessonSidebar

LessonProgress

LessonToolbar

Bad

Component1

NewCard

TempWidget

TestButton

---

# File Structure

Every component should follow:

```text
ComponentName.tsx

ComponentName.types.ts

ComponentName.test.tsx

ComponentName.stories.tsx (optional)

index.ts
```

---

# Component Size

Preferred

50–200 lines

Acceptable

200–350 lines

Anything larger should be split.

---

# Props

Props must be typed.

Never use

any

Example

```ts
interface LessonCardProps {
    lesson: Lesson;
    completed: boolean;
    onOpen(): void;
}
```

Props should be explicit.

Never pass giant objects if only two fields are needed.

---

# State

Use local state only for UI.

Business state belongs in providers.

Avoid deeply nested state.

---

# Business Logic

Business logic belongs in:

Hooks

Providers

Services

Never inside UI components.

Bad

```tsx
<Button onClick={() => {
    fetch(...)
}}>
```

Good

```tsx
const { submitQuiz } = useQuiz();
```

---

# Data Fetching

Components never read JSON directly.

Correct

```tsx
const lessons = useLessons();
```

Incorrect

```tsx
import lessons from "../../data/lessons.json";
```

---

# Styling

Use Tailwind utilities.

Use design tokens.

Never hardcode colors.

Never use inline styles.

Avoid excessive custom CSS.

---

# Accessibility

Every interactive component must support

Keyboard navigation

Focus states

ARIA labels

Screen readers

Reduced motion

Proper semantics

---

# Responsive Rules

Desktop

Tablet

Mobile

Every component must work correctly on all screen sizes.

Never hide critical functionality on mobile.

---

# Performance

Memoize expensive components.

Lazy load heavy features.

Avoid unnecessary renders.

Virtualize long lists.

Use code splitting where appropriate.

---

# Error Handling

Every feature component should gracefully handle

Loading

Empty

Error

Success

No blank screens.

---

# Animation

Use Framer Motion.

Animations should be subtle.

Never animate for decoration alone.

Respect prefers-reduced-motion.

---

# Testing

Every reusable component should be testable.

Critical components require

Unit tests

Accessibility tests

Interaction tests

---

# Documentation

Every major component should document

Purpose

Props

Usage

Examples

Accessibility notes

Performance considerations

---

# Component Checklist

Before merging a component verify:

✅ Single responsibility

✅ Typed props

✅ Responsive

✅ Accessible

✅ Uses design tokens

✅ Reusable

✅ No duplicated logic

✅ Loading state

✅ Empty state

✅ Error state

✅ Mobile tested

✅ Keyboard tested

✅ Clean naming

---

# Anti-Patterns

Never create

God components

500+ line components

Inline fetch logic

Duplicate cards

Duplicate buttons

Copy-paste layouts

Hardcoded content

Random styling

Business logic inside UI

Global mutable state

---

# Success Criteria

Every component in Forge should feel like part of the same design system.

A developer unfamiliar with the project should immediately understand:

• What the component does

• Where it belongs

• How to reuse it

• How to extend it

• How to test it

The component architecture should remain maintainable even after the project grows to hundreds of components.