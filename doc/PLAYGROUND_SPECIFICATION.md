# Forge Playground Specification

Version: 2.0

---

# Vision

The Forge Playground is not a simple code editor.

It is a complete frontend engineering laboratory.

It should feel like VS Code inside the browser while remaining focused on learning.

Students should be able to experiment, build, debug, inspect, compare solutions, and understand why code works.

The Playground is one of Forge's flagship features.

---

# Primary Objectives

The Playground should allow learners to:

• Write code
• Run code
• Debug code
• Inspect errors
• Learn concepts
• Compare solutions
• Experiment safely
• Practice lessons
• Build projects

---

# Supported Languages

Version 1

• HTML
• CSS
• JavaScript
• TypeScript
• JSX
• TSX

Future

• Vue
• Svelte
• Angular
• Web Components

---

# Playground Layout

Desktop

```
---------------------------------------------------------
 Top Toolbar
---------------------------------------------------------
 Explorer | Editor | Preview
          |        |
          |        |
          |        |
 Console  |        |
---------------------------------------------------------
 Bottom Status Bar
```

Mobile

```
Toolbar

Tabs

Editor

Preview

Console

Files

Output

Problems

Settings
```

Never use split screen on phones.

---

# Core Areas

## 1. Toolbar

Contains

Run

Reset

Format

Save

Share

Copy

Download

Upload

Settings

Fullscreen

AI Help

---

## 2. File Explorer

Displays

index.html

styles.css

script.js

App.tsx

components/

assets/

Supports

Create file

Delete

Rename

Duplicate

Folders

Drag and drop

---

## 3. Code Editor

Powered by Monaco.

Features

Syntax highlighting

Autocomplete

Multi-cursor

Bracket matching

Minimap

Search

Replace

Go to line

Formatting

Code folding

Themes

Word wrap

Sticky scroll

---

## 4. Live Preview

Updates instantly.

Supports

HTML

CSS

JavaScript

React

TypeScript

Responsive preview

Device presets

Refresh

Reload

Open new tab

Error overlay

---

## 5. Console

Shows

console.log()

Warnings

Errors

Network logs

Timing

Clearing console

Filters

---

## 6. Problems Panel

Lists

Syntax errors

Type errors

Warnings

Unused variables

Missing imports

Compilation errors

Clicking an error jumps directly to the line.

---

## 7. Instructions Panel

Contains

Lesson instructions

Objectives

Requirements

Hints

Acceptance criteria

---

## 8. AI Assistant Panel

Integrated into Playground.

Can

Explain code

Review code

Suggest improvements

Detect bugs

Explain errors

Never writes complete solutions unless requested.

Uses Socratic teaching.

---

# Learning Modes

## Free Mode

Blank editor.

No restrictions.

---

## Guided Mode

Lesson-driven.

Shows

Objectives

Tasks

Hints

Expected output

---

## Challenge Mode

Hidden solution.

Student completes tasks.

Automatic validation.

---

## Debug Mode

Broken code.

Student fixes bugs.

Hints unlock gradually.

---

## Interview Mode

Timed coding.

No hints.

Evaluation afterwards.

---

# File Templates

HTML Starter

CSS Starter

JavaScript Starter

React Starter

TypeScript Starter

Tailwind Starter

---

# Execution Engine

Requirements

Instant compilation

Fast refresh

Reliable runtime

No page reloads

Sandbox isolation

Crash recovery

---

# Code Validation

Checks

Syntax

Formatting

Type errors

Accessibility

Performance

Best practices

Unused code

---

# Formatting

Supports

Prettier

Auto format

Indentation

Tabs

Spaces

Line endings

---

# Responsive Testing

Preview devices

Desktop

Laptop

Tablet

Phone

Landscape

Portrait

Custom dimensions

---

# Accessibility Testing

Checks

ARIA

Keyboard navigation

Color contrast

Labels

Semantic HTML

Focus order

---

# Performance Panel

Shows

Render time

Bundle size

Re-renders

FPS

Memory

Lighthouse summary

Core Web Vitals

---

# Version History

Supports

Undo

Redo

Snapshots

Restore point

Lesson checkpoints

---

# Sharing

Generate

Share link

Export ZIP

Copy code

Download project

---

# Lesson Integration

Every lesson can open directly inside Playground.

Lessons provide

Starter files

Instructions

Expected result

Hints

Validation rules

Solution

---

# Project Integration

Projects launch directly into Playground.

Student progress is preserved.

---

# AI Integration

The AI understands

Current lesson

Current project

Current files

Current errors

Learning history

Difficulty level

Previous attempts

It should provide guidance instead of immediately solving problems.

---

# Mobile Experience

Phones use tab navigation.

Tabs

Editor

Preview

Console

Files

Instructions

AI

No split layout.

Editor occupies full height.

Preview is full width.

Console is swipeable.

Toolbar remains sticky.

---

# Offline Behavior

Previously opened playgrounds remain accessible.

Auto-save locally.

Restore unsaved work after refresh.

---

# Error Handling

Recover from

Compiler crashes

Runtime crashes

Infinite loops

Invalid imports

Broken JSX

Corrupted files

Never display blank screens.

---

# Acceptance Criteria

A learner should be able to

✅ Open a lesson

✅ Launch Playground

✅ Edit code

✅ Run code

✅ View live preview

✅ Read console logs

✅ Fix errors

✅ Ask AI for guidance

✅ Save progress

✅ Return later

✅ Continue from where they stopped

without losing work or experiencing layout issues.

---

# Success Definition

The Playground should feel like a professional IDE built specifically for learning frontend engineering.

It should become the primary place where learners spend most of their time mastering HTML, CSS, JavaScript, TypeScript, React, debugging, and real-world frontend development.
