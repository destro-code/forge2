# Forge

**Interactive Frontend Engineering Learning Platform**

Forge is a hands-on learning platform I am building to help frontend developers develop practical engineering skills through structured lessons, coding exercises, validation, debugging, and guided feedback.

> **Status:** Active development

## What Forge is trying to solve

Traditional learning resources can explain a concept without giving learners enough opportunity to practice, make mistakes, debug their own code, and demonstrate understanding.

Forge is designed around a more active learning cycle:

**Learn → Practice → Validate → Review → Debug → Progress**

The goal is to make learning frontend engineering feel closer to working through real development problems than passively consuming tutorials.

## Current capabilities

The platform currently includes work across several learning and engineering workflows, including:

- Structured frontend lessons and exercises
- Interactive in-browser coding experiences
- Monaco-based code editing
- Exercise validation and progression gating
- Guided learning and feedback flows
- Code review and debugging workflows
- AI-assisted mentoring experiences
- Technical interview practice
- Learner progress tracking
- Curriculum and prerequisite planning

Forge is still being actively developed, so the feature set will continue to evolve.

## Tech Stack

### Frontend

- React
- TypeScript
- TanStack Start
- TanStack Router
- Tailwind CSS
- Framer Motion
- Monaco Editor

### Application & State

- TanStack Query
- Zustand
- React Hook Form
- Zod

### AI & Developer Experience

- Google Gemini API
- Monaco Editor
- ESLint
- Prettier
- Vite

## Architecture

Forge uses a React and TypeScript application architecture with TanStack Start for the application/server layer. Interactive coding experiences are built around Monaco Editor, while application state and server data are handled through dedicated state and data-fetching layers.

The platform also contains server-side mentor and evaluation workflows for AI-assisted learning experiences.

## Development

### Requirements

- Node.js
- npm or Bun

### Install

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Environment variables

Forge uses environment variables for server-side services. See `.env.example` for the variables required by the current development environment.

Never commit private API keys or other secrets to the repository.

## Project status

Forge is an active personal product under continuous development. Some areas are intentionally evolving as the learning model, curriculum, validation system, and product architecture mature.

The live application is available at:

**https://forge2-gamma.vercel.app/**

## Author

**Henry Mosiali**

Full-Stack Web Developer

- Portfolio: https://henrymosiali.vercel.app
- GitHub: https://github.com/destro-code
