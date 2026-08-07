# Forge Data Schema

Version: 2.0

---

# Philosophy

Forge is a completely JSON-driven application.

The UI never hardcodes learning content.

Every screen reads from providers.

Providers read JSON.

In the future providers may read from an API or database without changing the UI.

---

# Data Relationships

Academy

↓

Learning Paths

↓

Modules

↓

Chapters

↓

Lessons

↓

Practice

↓

Quiz

↓

Debug Challenge

↓

Interview Questions

↓

Mini Project

↓

Checkpoint

↓

Capstone Project

↓

Mastery

---

# Folder Structure

src/data/

academy.json

learning-paths.json

modules.json

chapters.json

lessons.json

practice.json

quizzes.json

debug-challenges.json

interview-questions.json

projects.json

capstones.json

resources.json

flashcards.json

achievements.json

statistics.json

roadmaps.json

settings.json

---

# Academy Schema

```json
{
  "id": "",
  "title": "",
  "description": "",
  "paths": []
}
```

---

# Learning Path Schema

```json
{
  "id": "",
  "title": "",
  "description": "",
  "difficulty": "",
  "estimatedHours": 0,
  "modules": []
}
```

Example

Frontend Engineering

↓

HTML & CSS

↓

JavaScript

↓

TypeScript

↓

React

↓

Architecture

↓

Performance

↓

Testing

---

# Module Schema

```json
{
  "id": "",
  "pathId": "",
  "title": "",
  "description": "",
  "order": 1,
  "difficulty": "",
  "estimatedHours": 20,
  "prerequisites": [],
  "chapterIds": []
}
```

Example

Module

HTML & CSS Foundations

contains

Introduction

Semantic HTML

Forms

Accessibility

CSS Basics

Flexbox

Grid

Responsive Design

Animations

Architecture

Mini Project

---

# Chapter Schema

```json
{
  "id": "",
  "moduleId": "",
  "title": "",
  "description": "",
  "order": 1,
  "estimatedMinutes": 45,
  "lessonIds": []
}
```

Example

Flexbox

↓

Introduction

Main Axis

Cross Axis

Flex Grow

Flex Shrink

Projects

Quiz

Practice

---

# Lesson Schema

```json
{
  "id": "",
  "chapterId": "",
  "title": "",
  "order": 1,
  "type": "lesson",
  "difficulty": "",
  "estimatedMinutes": 20,
  "learningObjectives": [],
  "prerequisites": [],
  "content": "",
  "resources": [],
  "practiceId": "",
  "quizId": "",
  "debugChallengeId": "",
  "interviewQuestionIds": [],
  "miniProjectId": "",
  "nextLessonId": "",
  "previousLessonId": ""
}
```

Every lesson must know

previous lesson

next lesson

chapter

module

path

estimated time

difficulty

practice

quiz

debug challenge

---

# Practice Schema

```json
{
  "id": "",
  "lessonId": "",
  "title": "",
  "instructions": "",
  "starterFiles": [],
  "solutionFiles": [],
  "hints": []
}
```

---

# Quiz Schema

```json
{
  "id": "",
  "lessonId": "",
  "questions": []
}
```

---

# Question Schema

```json
{
  "id": "",
  "type": "mcq",
  "question": "",
  "choices": [],
  "answer": "",
  "explanation": ""
}
```

Supported question types

MCQ

Multiple Select

Fill Blank

Drag Drop

Ordering

Code Output

Code Writing

Debugging

---

# Debug Challenge Schema

```json
{
  "id": "",
  "lessonId": "",
  "title": "",
  "difficulty": "",
  "starterCode": "",
  "bugs": [],
  "hints": [],
  "solution": ""
}
```

---

# Interview Question Schema

```json
{
  "id": "",
  "lessonId": "",
  "type": "technical",
  "difficulty": "",
  "question": "",
  "expectedAnswer": "",
  "followUps": []
}
```

---

# Mini Project Schema

```json
{
  "id": "",
  "moduleId": "",
  "title": "",
  "description": "",
  "requirements": [],
  "starterFiles": [],
  "rubric": []
}
```

---

# Capstone Project Schema

```json
{
  "id": "",
  "pathId": "",
  "title": "",
  "description": "",
  "requirements": [],
  "gradingRubric": []
}
```

---

# Resource Schema

```json
{
  "id": "",
  "lessonId": "",
  "type": "article",
  "title": "",
  "url": ""
}
```

Supported Types

Documentation

Article

Video

Book

GitHub

Specification

Reference

---

# Flashcard Schema

```json
{
  "id": "",
  "lessonId": "",
  "front": "",
  "back": "",
  "difficulty": ""
}
```

---

# Achievement Schema

```json
{
  "id": "",
  "title": "",
  "description": "",
  "xp": 100,
  "icon": "",
  "unlockCondition": ""
}
```

---

# Progress Schema

```json
{
  "userId": "",
  "completedLessons": [],
  "completedPractice": [],
  "completedProjects": [],
  "completedDebugChallenges": [],
  "completedQuizzes": [],
  "xp": 0,
  "currentPath": "",
  "currentModule": "",
  "currentChapter": "",
  "currentLesson": "",
  "masteryLevel": ""
}
```

---

# Relationships

Academy

contains

Learning Paths

Learning Path

contains

Modules

Module

contains

Chapters

Chapter

contains

Lessons

Lesson

owns

Practice

Quiz

Debug Challenge

Interview Questions

Resources

Flashcards

Mini Project

Modules eventually unlock

Capstone Projects

Capstone Projects unlock

Achievements

Achievements increase

XP

XP increases

Mastery

---

# Ordering Rules

Every object has an explicit order field.

Never rely on alphabetical sorting.

Never rely on array positions.

Always sort using

order

ascending.

---

# IDs

IDs are immutable.

Never generate random IDs.

Never rename IDs once created.

IDs are referenced throughout the academy.

Changing an ID breaks relationships.

---

# Validation Rules

Every Lesson must belong to one Chapter.

Every Chapter must belong to one Module.

Every Module must belong to one Learning Path.

Every Practice belongs to exactly one Lesson.

Every Quiz belongs to exactly one Lesson.

Every Debug Challenge belongs to exactly one Lesson.

Every Interview Question belongs to exactly one Lesson.

Every Mini Project belongs to exactly one Module.

Every Capstone belongs to exactly one Learning Path.

Every Lesson must have a next lesson except the final lesson.

Every Lesson except the first must have a previous lesson.

No orphaned objects are allowed.

No circular prerequisite chains are allowed.

---

# Future Compatibility

This schema is designed to work with

JSON

REST APIs

Supabase

Firebase

PostgreSQL

MongoDB

GraphQL

without changing UI components.

Only the provider layer should change.
