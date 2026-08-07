# Forge UI & UX Guidelines

Version: 2.0

---

# Philosophy

Forge is not just an educational website.

Forge is a premium engineering workspace.

Every screen should feel like using professional software rather than browsing a tutorial website.

The experience should resemble the quality of Linear, Notion, Raycast, VS Code, Figma, GitHub, and Stripe.

The interface should make learners feel like engineers from day one.

---

# Design Principles

Every interface should be:

• Minimal

• Professional

• Fast

• Clean

• Consistent

• Calm

• Highly readable

• Mobile-first

• Keyboard-friendly

• Accessible

Never design pages that feel crowded or overwhelming.

---

# Visual Identity

Theme

Dark-first

Light mode supported.

Use design tokens only.

Never hardcode colors.

---

# Colors

Use only design tokens.

Never use inline colors.

Semantic colors:

Primary

Secondary

Success

Warning

Danger

Muted

Accent

Information

Surface

Background

---

# Typography

Primary Font

Inter

Monospace Font

JetBrains Mono

Rules

Large headings

Medium section titles

Comfortable body text

Readable code blocks

Never mix multiple font families.

---

# Layout Philosophy

Every page follows the same structure.

Top Navigation

↓

Breadcrumbs

↓

Page Header

↓

Primary Content

↓

Secondary Content

↓

Footer Actions

No page should feel different from another.

---

# Navigation Hierarchy

Global Navigation

Sidebar

↓

Top Navigation

↓

Breadcrumbs

↓

Local Navigation

↓

Content

The user should always know:

Where am I?

What section am I in?

What comes next?

---

# Cards

Cards should be used for

Modules

Lessons

Projects

Achievements

Progress

Statistics

Resources

Cards must contain

Title

Description

Metadata

Primary Action

Optional Secondary Action

Consistent spacing

Consistent shadows

---

# Buttons

Button hierarchy

Primary

Secondary

Outline

Ghost

Danger

Icon

Loading

Disabled

Never invent new button styles.

---

# Forms

Forms must include

Labels

Validation

Helpful errors

Accessible controls

Keyboard navigation

Consistent spacing

---

# Empty States

Every empty state should explain

Why nothing is here

What the learner should do next

Provide an action button

Never display blank pages.

---

# Error States

Errors must

Explain what happened

Suggest a solution

Allow retry

Never expose technical stack traces.

---

# Loading States

Every async operation should have

Skeleton loaders

Loading indicators

Progress messages where appropriate

Avoid layout shifts.

---

# Responsive Design

Desktop

1440+

Laptop

1024+

Tablet

768+

Mobile

320+

Every page must function correctly at all breakpoints.

No horizontal scrolling.

---

# Mobile Rules

Sidebar becomes drawer.

Tables become cards.

Split layouts become stacked layouts.

Playground becomes tabbed interface.

Charts remain readable.

Buttons remain touch-friendly.

---

# Playground UX

Desktop

Editor | Preview | Console

Mobile

Tabs

Editor

Preview

Console

No split-screen on phones.

Editor should occupy most of the screen.

---

# Lesson Reader UX

Desktop

Left

Table of Contents

Center

Lesson Content

Right

Notes

Bookmarks

AI Mentor

Mobile

TOC Drawer

Lesson

Bottom Actions

---

# Dashboard

Dashboard should answer

Where am I?

What should I do next?

How much progress have I made?

What is today's goal?

Recommended next lesson

Continue learning

Daily challenge

Current streak

Weak areas

Upcoming milestones

---

# Curriculum Pages

Learn

Overview

↓

Learning Paths

↓

Modules

↓

Topics

↓

Lessons

Each page must have a distinct purpose.

No duplicate layouts.

No duplicate content.

---

# Animation

Animations should communicate.

Never distract.

Use subtle motion.

Page transitions

Card hover

Sidebar animation

Accordion

Dialog

Command palette

Respect prefers-reduced-motion.

---

# Accessibility

WCAG AA minimum.

Keyboard navigation.

Visible focus states.

Screen reader labels.

Proper heading hierarchy.

Color contrast compliance.

Accessible forms.

Accessible dialogs.

Accessible tables.

Accessible charts.

---

# Icons

Use one icon system only.

Icons should communicate.

Never decorate unnecessarily.

---

# Tables

Tables must support

Sorting

Filtering

Searching

Pagination

Responsive fallback

---

# Search

Global search should find

Lessons

Modules

Projects

Resources

Commands

Settings

Search must be instant.

---

# Command Palette

Accessible everywhere.

Must navigate to

Pages

Lessons

Projects

Commands

Theme

Settings

---

# Notifications

Notifications should be meaningful.

Avoid spam.

Allow dismissal.

Support history.

---

# Feedback

Every user action should receive feedback.

Saved

Completed

Unlocked

Achievement earned

Lesson completed

Project submitted

---

# Performance

Target

60 FPS animations.

Minimal layout shift.

Fast page transitions.

Lazy-load heavy components.

Code split where appropriate.

---

# Consistency Rules

Spacing must use design tokens.

Typography must use design tokens.

Colors must use design tokens.

Border radius must use design tokens.

Shadows must use design tokens.

Never create one-off styles.

---

# UX Principles

Reduce clicks.

Reduce confusion.

Reduce scrolling.

Increase discoverability.

Increase readability.

Increase confidence.

Every screen should answer

What can I do here?

Why am I here?

What should I do next?

---

# Success Criteria

A learner opening Forge for the first time should immediately feel they are using a premium engineering academy rather than a traditional online course platform.

The interface should be consistent, intuitive, fast, and professional across every route, component, and device.
