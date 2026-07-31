# Forge Debug Lab Specification
Version: 2.0

---

# Vision

The Debug Lab is one of Forge's flagship learning systems.

It is designed to teach learners how professional frontend engineers investigate, isolate, understand, and solve real-world software bugs.

Students should not memorize fixes.

They should learn how to think.

The Debug Lab must simulate real debugging sessions found in production engineering teams.

---

# Primary Goals

Teach learners to

• Read unfamiliar code

• Investigate bugs

• Form hypotheses

• Test assumptions

• Trace execution

• Use debugging tools

• Find root causes

• Validate fixes

• Prevent regressions

---

# Learning Philosophy

Every debugging challenge should teach

WHY the bug happened

HOW to find it

HOW to fix it

HOW to avoid it

---

# Debug Lab Levels

Level 1

Beginner

Simple syntax errors

Missing imports

Wrong HTML

Broken CSS

Console errors

---

Level 2

Intermediate

DOM bugs

State bugs

React hooks mistakes

Events

Forms

Fetch issues

Timing problems

---

Level 3

Advanced

Performance issues

Rendering bugs

Hydration

Memory leaks

Race conditions

Infinite renders

Accessibility problems

---

Level 4

Senior Engineer

Architecture bugs

State synchronization

Large codebases

Design flaws

Scaling issues

Performance bottlenecks

Production failures

---

# Challenge Structure

Every challenge contains

---

## Overview

Bug title

Difficulty

Estimated time

Skills tested

Prerequisites

Technologies

---

## Scenario

Explain the situation.

Example

"The checkout button works locally but fails in production."

---

## Learning Objectives

What learners should gain.

Example

Understand stale closures.

Understand dependency arrays.

Use React DevTools.

---

## Broken Project

Provide realistic project files.

Never isolated snippets only.

Students should navigate codebases.

---

## Expected Behaviour

Describe what should happen.

---

## Actual Behaviour

Describe what currently happens.

---

## Investigation Checklist

Examples

Read console

Inspect DOM

Check Network tab

Inspect React tree

Review hooks

Review dependencies

Check event flow

Measure rendering

---

## Student Notes

Learners can write

Hypotheses

Observations

Ideas

Possible fixes

---

## Hint System

Hints unlock gradually.

Hint 1

Small clue.

Hint 2

Area to inspect.

Hint 3

Relevant concept.

Hint 4

Near solution.

Hint 5

Full explanation.

Never reveal everything immediately.

---

## Solution

Contains

Root cause

Fix

Why it works

Alternative approaches

Prevention strategies

---

## Reflection

Questions

What caused the bug?

How did you discover it?

What tools helped?

How would you prevent this?

---

# Categories

## HTML

Broken structure

Forms

Accessibility

Semantic issues

---

## CSS

Flexbox

Grid

Overflow

Stacking context

Specificity

Animations

Responsive layout

Container queries

---

## JavaScript

Closures

Scope

Hoisting

This

Promises

Async

Memory

Event loop

Modules

---

## TypeScript

Wrong types

Generics

Inference

Union bugs

Type narrowing

Interfaces

---

## React

Hooks

State

Context

Props

Rendering

Memoization

Effects

Refs

Suspense

Hydration

Server Components

---

## Performance

Large lists

Re-renders

Bundle size

Virtualization

Layout thrashing

Paint

Memory leaks

---

## Accessibility

ARIA

Focus

Keyboard

Contrast

Screen readers

Semantic HTML

---

## Testing

Broken unit tests

Integration failures

Mocking

Assertions

Snapshots

---

## Architecture

Folder organization

State management

Component boundaries

Code smells

Dependency issues

---

# Debugging Tools

Students should learn to use

Console

Breakpoints

Watch expressions

React DevTools

Elements panel

Network panel

Performance panel

Memory profiler

Lighthouse

---

# Investigation Workflow

Every challenge follows

Observe

↓

Reproduce

↓

Gather evidence

↓

Form hypothesis

↓

Test hypothesis

↓

Locate cause

↓

Implement fix

↓

Verify fix

↓

Prevent regression

---

# AI Mentor Integration

The AI Mentor should

Never immediately provide answers.

Instead

Ask guiding questions

Suggest debugging strategies

Recommend browser tools

Point learners toward clues

Explain concepts after solving

Teach reasoning

Not shortcuts

---

# Scoring

Award XP for

Correct diagnosis

Efficient investigation

Few hints used

Correct explanation

Preventive thinking

---

# Progress Tracking

Track

Solved bugs

Average solve time

Hints used

Categories mastered

Weak areas

Streak

Difficulty progression

---

# Daily Bug

Every day learners receive

One realistic production bug

Timed challenge

XP reward

Leaderboard placement

Reflection questions

---

# Weekly Challenge

Long-form debugging scenario

Multiple files

Hidden issues

Architecture analysis

Performance investigation

Accessibility audit

---

# Team Challenges

Future feature

Debug collaboratively

Share findings

Compare approaches

Peer reviews

---

# Mobile Experience

Students can

Read challenge

Inspect code

Switch files

Open hints

Take notes

Review solutions

Editing remains available but complex debugging is optimized for tablets and desktops.

---

# Accessibility

Keyboard navigation

Screen reader support

High contrast

Reduced motion

Clear focus indicators

Semantic structure

---

# Error Recovery

Challenges must never

Lose progress

Lose notes

Crash editor

Corrupt files

Students can always reset challenge safely.

---

# Acceptance Criteria

Learners should be able to

✅ Open a challenge

✅ Understand the scenario

✅ Investigate systematically

✅ Use debugging tools

✅ Fix the issue

✅ Explain the root cause

✅ Reflect on lessons learned

✅ Earn XP

✅ Unlock harder challenges

without confusion or hidden solutions.

---

# Success Definition

The Debug Lab should make learners think like professional frontend engineers.

By completing the Debug Lab curriculum, students should confidently debug real production applications rather than relying on trial and error.

It should become one of the defining features of Forge and a major differentiator from traditional tutorial platforms.