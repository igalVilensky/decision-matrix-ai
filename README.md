# Decision Matrix AI

AI-assisted decision matrix app for comparing complex choices with weighted criteria, explainable recommendations, and practical next steps.

[Live Demo](https://decision-matrix-ai.netlify.app/) · [Repository](https://github.com/igalVilensky/decision-matrix-ai)

---

## Overview

Decision Matrix AI helps users make structured decisions when there are several options, competing priorities, and tradeoffs.

Instead of asking AI for a direct answer, the app combines a traditional weighted decision matrix with AI-assisted support. Users stay in control: they define or edit options, criteria, weights, must-have requirements, and scores. AI can suggest criteria, options, scores, matrix improvements, final recommendations, and action checklists, but every suggestion can be reviewed before it affects the decision.

The app can be used to compare software tools, products, jobs, apartments, travel destinations, courses, vendors, business ideas, universities, laptops, cities, or any other decision with meaningful tradeoffs.

---

## Why I Built This

I built Decision Matrix AI to explore how LLMs can support practical decision-making without replacing human judgment.

The goal was to build a real product-style application that combines structured decision logic, user-controlled AI suggestions, explainable recommendations, cloud persistence, safe server-side LLM integration, and schema validation for AI responses.

This project demonstrates how AI can be used as a decision-support layer instead of a black-box answer generator.

---

## Screenshots

### Home / Dashboard

![Decision Matrix AI home screen](./docs/screenshots/home.png)

### Matrix Overview

![Decision Matrix AI matrix overview](./docs/screenshots/natrix.png)

### Matrix Scoring

![Matrix scoring view](./docs/screenshots/scoring.png)

### AI Review

![AI review panel](./docs/screenshots/ai-review.png)

---

## Key Features

- Create blank decision matrices or start from templates.
- Compare any type of option, not only software tools.
- Add, edit, duplicate, and delete cloud-saved matrices.
- Define weighted criteria from 1 to 5.
- Mark important criteria as must-have requirements.
- Score each option from 0 to 5 with optional notes.
- Calculate weighted totals, percentage fit, winner, category breakdowns, strengths, weaknesses, and must-have gaps.
- Use Groq-powered AI through Netlify Functions for:
  - criteria generation
  - option suggestions
  - score suggestions
  - matrix quality review
  - final recommendation generation
  - decision-to-action checklist generation
- Review, edit, partially accept, or reject AI suggestions before they affect the matrix.
- Turn a winning option into an action checklist for purchase checks, rollouts, bookings, negotiation, implementation, or learning plans.
- Store each user's matrices in Firestore under `users/{uid}/matrices/{matrixId}`.
- Sign users in with Firebase Anonymous Authentication.
- Import and export matrix JSON backups.

---

## Demo

Live app:

[https://decision-matrix-ai.netlify.app/](https://decision-matrix-ai.netlify.app/)

---

## Tech Stack

### Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- Lucide React

### Backend / Serverless

- Netlify Functions
- Groq API

### Data / Auth

- Firebase Authentication
- Firebase Anonymous Authentication
- Firestore

### Validation / Reliability

- Zod
- TypeScript type checking
- Server-side AI response validation

---

## Architecture

The app uses a lightweight full-stack architecture:

```text
React + Vite Frontend
        |
        | User creates, edits, scores, imports, and exports matrices
        |
        v
Firebase Anonymous Authentication
        |
        | Provides lightweight user identity
        |
        v
Firestore
        |
        | Stores each user's matrices
        |
        v
users/{uid}/matrices/{matrixId}
