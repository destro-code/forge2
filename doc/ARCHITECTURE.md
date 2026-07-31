# Forge Architecture

Version: 2.0

Status: Living Document

Owner: Forge Engineering

---

# Overview

Forge is a curriculum-first Frontend Engineering Academy designed to take a learner from absolute beginner to Senior Frontend Engineer through structured learning, practical exercises, debugging, projects, interviews, and AI-assisted mentorship.

The architecture is intentionally designed around one principle:

> Learning is the product.

Everything else—including AI—is infrastructure that supports learning.

The architecture prioritizes:

- Clean Architecture
- SOLID Principles
- Separation of Concerns
- Provider Pattern
- Mobile-first Design
- JSON-driven Curriculum
- Future Backend Compatibility
- High Maintainability
- Incremental Expansion
- Zero Vendor Lock-in

---

# Core Design Principles

Forge follows these architectural principles throughout the application.

## 1. Curriculum First

The curriculum is the foundation of the application.

Every page, feature, interaction, and AI capability exists to improve learning.

The curriculum dictates the application structure—not the other way around.

---

## 2. Data Driven

No lesson, module, topic, quiz, project, or challenge should be hardcoded inside React components.

Everything comes from providers.

```
JSON

↓

Provider

↓

Hook

↓

Component

↓

UI
```

React components should never know where data comes from.

---

## 3. Provider Pattern

Every major subsystem uses providers.

Examples:

ContentProvider

ProgressProvider

MentorProvider

SettingsProvider

SearchProvider

BookmarkProvider

AnalyticsProvider

NotificationProvider

Future providers:

UserProvider

AchievementProvider

CourseProvider

PaymentProvider

Every provider exposes an interface.

Components depend on interfaces.

Never implementations.

---

## 4. Dependency Inversion

UI depends on abstractions.

Never on APIs.

Never on JSON.

Never on databases.

Example

```
Lesson Page

↓

useContent()

↓

ContentProvider

↓

JSON Provider

or

Firestore Provider

or

Supabase Provider

or

CMS Provider
```

Changing the backend should never require rewriting the UI.

---

## 5. Single Responsibility

Every component should have one responsibility.

Bad

```
LessonPage

Fetches data

Handles notes

Tracks progress

Runs playground

Handles quizzes

Updates bookmarks
```

Good

```
LessonPage

↓

LessonContent

↓

LessonSidebar

↓

LessonNavigation

↓

LessonNotes

↓

LessonQuiz

↓

LessonPlayground
```

Small focused components.

---

## High-Level System Architecture

```
                         USER

                           │

                           ▼

                  TanStack Router

                           │

                           ▼

                    Route Components

                           │

                           ▼

                    Feature Components

                           │

                           ▼

                        Hooks Layer

                           │

                           ▼

                    Provider Layer

                           │

      ┌────────────────────┼────────────────────┐

      ▼                    ▼                    ▼

 Content Provider    Progress Provider    Mentor Provider

      ▼                    ▼                    ▼

 JSON / API        Local Storage        Gemini Server

```

---

# Application Layers

Forge consists of seven architectural layers.

---

## Layer 1

Presentation Layer

Responsible for:

Pages

Layout

Rendering

Animations

Navigation

Accessibility

Never contains business logic.

Folder

```
src/routes
```

---

## Layer 2

Feature Components

Contains reusable feature components.

Examples

Dashboard

Lesson

Playground

Quiz

Debug Lab

Projects

Interview

Mentor

Progress

Folder

```
src/components
```

---

## Layer 3

Hooks Layer

Contains reusable business logic.

Examples

useContent()

useProgress()

useMentor()

useTheme()

useBookmarks()

useSearch()

Hooks never know where data comes from.

Folder

```
src/lib/hooks
```

---

## Layer 4

Provider Layer

Responsible for all application services.

Examples

ContentProvider

ProgressProvider

MentorProvider

SettingsProvider

BookmarkProvider

AnalyticsProvider

NotificationProvider

Folder

```
src/lib/providers
```

---

## Layer 5

Data Layer

Current implementation

JSON

Future implementation

REST

GraphQL

Firestore

Supabase

PostgreSQL

CMS

The UI must never care.

Folder

```
src/data
```

---

## Layer 6

AI Layer

AI is isolated.

```
React

↓

MentorProvider

↓

Server

↓

Gemini

```

Future AI services

Code Review

Interview

Lesson Explanations

Debug Hints

Project Mentor

Architecture Advisor

Resume Builder

Portfolio Generator

---

## Layer 7

Infrastructure

Theme

Router

Storage

Environment Variables

Analytics

Error Logging

Performance

Deployment

---

# Curriculum Architecture

Forge is not page-based.

Forge is curriculum-based.

Hierarchy

```
Academy

↓

Learning Path

↓

Module

↓

Chapter

↓

Lesson

↓

Practice

↓

Quiz

↓

Debug Challenge

↓

Interview

↓

Mini Project

↓

Checkpoint

↓

Capstone

↓

Mastery
```

Every lesson unlocks the next.

Nothing exists outside this hierarchy.

---

# Navigation Architecture

Every curriculum page has a unique responsibility.

```
Learn

↓

Learning Paths

↓

Modules

↓

Chapters

↓

Lessons

↓

Lesson Reader
```

No two pages should display the same information.

Every page answers a different question.

---

# State Management

Global state is intentionally minimal.

Global

Theme

Progress

Bookmarks

Achievements

Notifications

Search

Command Palette

Local

Form State

Lesson State

Editor State

Quiz State

Playground State

Avoid unnecessary global state.

---

# Playground Architecture

```
Editor

↓

Compiler

↓

Diagnostics

↓

Bundler

↓

Runtime

↓

Preview

↓

Console
```

Supported

HTML

CSS

JavaScript

TypeScript

React

TSX

Future

Vue

Svelte

Solid

---

# AI Architecture

AI is not the product.

AI supports learning.

```
Lesson

↓

Ask AI

↓

Mentor Provider

↓

Server API

↓

Gemini

↓

Streaming Response

↓

Lesson continues
```

AI must never replace the lesson.

AI must reinforce understanding.

---

# Mobile Architecture

Forge is mobile-first.

Desktop enhances.

Never the reverse.

Requirements

Responsive navigation

Responsive playground

Tabbed editor on mobile

No split editor on phones

Touch-friendly controls

Minimum 44px touch targets

Offline lesson reading

Responsive charts

Responsive tables

No horizontal scrolling

---

# Performance Strategy

Code splitting

Lazy loading

Route-based bundles

Dynamic Monaco import

Image optimization

JSON caching

Memoization

Suspense boundaries

Virtualized long lists

Tree shaking

---

# Accessibility Standards

WCAG 2.2 AA

Keyboard navigation

Screen reader support

ARIA labels

Skip links

Visible focus indicators

High contrast

Reduced motion support

Semantic HTML

---

# Error Handling

Every provider returns

Loading

Success

Empty

Error

No component should crash because of missing data.

Graceful degradation is mandatory.

---

# Future Backend Architecture

Current

```
JSON

↓

Provider

↓

UI
```

Future

```
Database

↓

API

↓

Provider

↓

Hooks

↓

UI
```

No component changes should be required.

---

# Folder Structure

```
src/

routes/

components/

lib/

hooks/

providers/

data/

styles/

types/

utils/

server/

assets/
```

Every folder has a single responsibility.

---

# Engineering Rules

Never hardcode curriculum.

Never duplicate business logic.

Never fetch directly inside components.

Never bypass providers.

Never expose API keys.

Never duplicate routes.

Never flatten the curriculum.

Never create orphan lessons.

Never break prerequisite chains.

Never implement features outside the learning hierarchy.

---

# Definition of Done

A feature is complete only when:

✓ Architecture remains clean

✓ Mobile responsive

✓ Accessible

✓ Type-safe

✓ No duplicated logic

✓ Provider pattern maintained

✓ JSON driven

✓ Integrated into curriculum

✓ Build passes

✓ Tests pass

✓ No regressions

✓ Documentation updated

---

End of Document