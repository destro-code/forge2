# Forge Testing Strategy
Version: 2.0

---

# Vision

Testing is an integral part of Forge's development lifecycle.

Every feature must be verifiable, repeatable, and reliable before it is considered complete.

Testing exists to ensure that learners experience a stable, predictable, and trustworthy platform.

---

# Testing Philosophy

Forge follows five principles:

• Test early

• Test continuously

• Test automatically where possible

• Test manually where user experience matters

• Prevent regressions before adding features

Testing is required for every sprint.

---

# Testing Pyramid

                End-to-End Tests
                      ▲
             Integration Tests
                      ▲
               Component Tests
                      ▲
                 Unit Tests

---

# Testing Levels

## Unit Testing

Purpose

Verify individual functions, utilities, hooks, and business logic.

Examples

Content providers

Progress calculations

XP calculations

Skill tree unlock logic

Quiz grading

Recommendation engine

Bookmark utilities

Search filtering

Lesson navigation

---

## Component Testing

Purpose

Ensure individual UI components behave correctly.

Examples

Buttons

Cards

Sidebar

Top navigation

Lesson cards

Progress widgets

Achievement badges

Quiz components

Playground editor

Console panel

Dialogs

Forms

---

## Integration Testing

Purpose

Verify multiple systems work together.

Examples

Lesson → Quiz → Progress

Project → Portfolio Builder

Debug Lab → XP

Interview → Mastery

AI Mentor → Lesson Context

Search → Lesson Results

Bookmarks → Dashboard

---

## End-to-End Testing

Purpose

Simulate real learner journeys.

Examples

Complete HTML course

Finish a project

Take an interview

Solve a debug challenge

Use Playground

Generate portfolio

Complete mastery path

---

# Functional Testing

Verify every feature behaves correctly.

Examples

Navigation

Search

Filters

Bookmarks

Theme switching

Notes

Progress saving

Achievements

Skill tree

AI Mentor

Playground

Whiteboard

Debug Lab

Projects

---

# Curriculum Testing

Verify

Learning hierarchy is valid

No orphaned lessons

No orphaned topics

Correct prerequisites

Correct ordering

Correct unlock flow

No duplicate IDs

Valid metadata

---

# Lesson Testing

Verify every lesson

Loads correctly

Displays objectives

Displays prerequisites

Contains code examples

Contains exercises

Links to next lesson

Links to previous lesson

Saves progress

Supports notes

Supports bookmarks

---

# Playground Testing

Verify

Editor loads

Preview renders

Console works

Reset button works

Run button works

JS executes

TypeScript compiles

TSX compiles

JSX compiles

Errors display correctly

No crashes

Undo works

Multiple files work

---

# Mobile Playground Testing

Verify

Editor occupies full screen

Preview is readable

Console is usable

Tabs switch correctly

Keyboard does not hide controls

No horizontal scrolling

No clipped panels

Portrait mode works

Landscape mode works

---

# AI Testing

Verify

Streaming responses

Fallback provider

Context awareness

Error handling

Timeout recovery

No exposed API keys

Educational responses

No hallucinated curriculum

---

# Accessibility Testing

Verify

Keyboard navigation

Tab order

Focus indicators

Screen readers

ARIA labels

Semantic HTML

Color contrast

Reduced motion

Accessible forms

Accessible dialogs

Accessible tables

---

# Responsive Testing

Devices

Desktop

Laptop

Tablet

Large phone

Small phone

Landscape

Portrait

Verify

No overflow

No clipping

No broken layouts

No unusable controls

---

# Browser Compatibility

Support

Chrome

Edge

Firefox

Safari

Latest two major versions

Verify

Navigation

Playground

Lessons

Projects

Animations

Forms

---

# Performance Testing

Measure

Initial load time

Time to Interactive

Bundle size

Memory usage

Route transitions

Playground execution

Large lesson rendering

Search performance

Target

Lighthouse ≥ 90

---

# Security Testing

Verify

No secrets exposed

Environment variables protected

Input validation

Markdown sanitization

Safe iframe usage

Protected API endpoints

---

# Data Integrity Testing

Verify

Valid JSON

Unique IDs

Correct relationships

Correct references

Valid metadata

No missing prerequisites

No duplicate records

---

# Regression Testing

Before every release verify

Dashboard

Learn

Modules

Topics

Lessons

Playground

Projects

Debug Lab

Interview

Progress

Achievements

Settings

Resources

Mentor

No existing feature may break.

---

# Smoke Testing

Quick checks after every build

Application loads

No console errors

Navigation works

Lessons load

Playground opens

AI Mentor responds

Progress saves

Theme switches

---

# Manual Testing Checklist

A tester should complete

Start learning

Finish a lesson

Complete practice

Take quiz

Solve debug challenge

Run playground

Finish project

Complete interview

Earn achievement

Resume learning

Review dashboard

---

# Automated Testing

Automate

Business logic

Hooks

Utilities

Providers

Components

Navigation

Integration

Critical learner flows

---

# Test Data

Maintain

Sample learners

Sample progress

Sample achievements

Sample quizzes

Sample projects

Sample lessons

Sample interviews

Sample debugging challenges

---

# Continuous Integration

Every pull request must

Run tests

Run TypeScript

Run lint

Run build

Verify JSON

Verify routing

Verify accessibility

Verify formatting

Reject merge if any check fails.

---

# Release Testing

Before production

Full regression

Accessibility audit

Performance audit

Responsive audit

Security audit

Manual learner journey

Playground verification

AI verification

Documentation review

---

# Bug Severity

Critical

Application unusable

Data loss

Broken curriculum

Playground unusable

Authentication failure

---

High

Feature unusable

Navigation broken

Lesson inaccessible

Incorrect progress

---

Medium

Visual issues

Minor functionality

Performance degradation

---

Low

Typography

Spacing

Animations

Cosmetic improvements

---

# Acceptance Criteria

A feature passes testing only if

✓ Functional

✓ Stable

✓ Responsive

✓ Accessible

✓ Performant

✓ Secure

✓ Integrated

✓ Regression-free

✓ Documented

---

# Success Definition

Forge should be deployable at any time with confidence that every learner journey—from the first lesson to final interview—is stable, reliable, and thoroughly tested across devices, browsers, and learning scenarios.