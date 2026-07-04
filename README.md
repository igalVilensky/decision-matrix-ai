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

Screenshots can be added here later:

```md
![Decision Matrix AI home screen](./docs/screenshots/home.png)
![Matrix scoring view](./docs/screenshots/scoring.png)
![AI recommendation view](./docs/screenshots/recommendation.png)
![Action checklist view](./docs/screenshots/checklist.png)
```

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
```

AI requests use a separate serverless path:

```text
React Frontend
        |
        | POST /.netlify/functions/groqChat
        |
        v
Netlify Function
        |
        | Adds system prompt, validates action, keeps API key server-side
        |
        v
Groq API
        |
        | Returns structured JSON
        |
        v
Zod Validation
        |
        | Validates AI response before frontend uses it
        |
        v
User reviews AI suggestion
```

The Groq API key is only used inside the Netlify Function and is never exposed to frontend code.

The `VITE_FIREBASE_*` values are Firebase Web App config values. They are expected to be present in frontend builds and are protected by Firebase Authentication plus Firestore security rules.

---

## AI Features

Decision Matrix AI supports several AI-assisted actions:

```text
generateCriteria
suggestOptions
suggestScores
reviewMatrix
generateRecommendation
generateActionChecklist
```

The AI is designed to support the user, not make the final decision.

The app asks the model to return structured JSON only. Responses are validated before being used in the UI. If an AI response does not match the expected schema, the app returns an error instead of silently accepting bad data.

---

## Example Use Cases

Decision Matrix AI can help compare:

- job offers
- apartments
- SaaS tools
- laptops
- cities
- courses
- travel destinations
- vendors
- business ideas
- technical architecture options
- personal decisions with multiple tradeoffs

Example:

```text
Decision: Choose the best laptop for development

Options:
- MacBook Air
- ThinkPad T14
- Dell XPS 13

Criteria:
- Price
- Performance
- Battery life
- Linux compatibility
- Portability
- Build quality
```

The app calculates weighted results and can generate an explanation, risks, tradeoffs, and a checklist before committing to the winning option.

---

## Core User Flow

1. Create a new decision matrix.
2. Add options manually or ask AI for suggestions.
3. Add criteria manually or ask AI to generate them.
4. Set weights for each criterion.
5. Mark critical criteria as must-have.
6. Score each option.
7. Review weighted results and category breakdowns.
8. Ask AI to review the matrix quality.
9. Generate an explainable recommendation.
10. Turn the winning option into an action checklist.
11. Export the matrix as a JSON backup if needed.

---

## Install

```bash
npm install
```

---

## Local Development

AI calls go through Netlify Functions, and persistence uses Firebase. Use Netlify CLI for local development:

```bash
npm install -g netlify-cli
cp .env.example .env
```

Add Firebase and Groq configuration to `.env`:

```bash
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

Then run:

```bash
netlify dev
```

The frontend calls:

```text
/.netlify/functions/groqChat
```

If Firebase env vars are missing, the app shows a setup error instead of silently falling back to local storage.

---

## Available Scripts

```bash
npm run dev
```

Starts the Vite development server.

```bash
npm run build
```

Runs TypeScript build checks and creates the production build.

```bash
npm run preview
```

Previews the production build locally.

```bash
npm run typecheck
```

Runs TypeScript type checking.

---

## Build

```bash
npm run build
```

---

## Netlify Deployment

1. Push the project to a Git provider.
2. Create a new Netlify site from the repository.
3. Set the build command to:

```bash
npm run build
```

4. Set the publish directory to:

```text
dist
```

5. Add these Firebase environment variables in Netlify:

```bash
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

6. Add this server-side Groq environment variable in Netlify:

```bash
GROQ_API_KEY=your_groq_api_key_here
```

Optional:

```bash
GROQ_MODEL=llama-3.3-70b-versatile
```

The included `netlify.toml` already configures:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[functions]
  directory = "netlify/functions"
```

---

## Firebase Setup

1. Create a Firebase project.
2. Add a Firebase Web App and copy the web config values into `.env`.
3. Enable Authentication.
4. Enable Anonymous sign-in under Authentication providers.
5. Create a Firestore database.
6. Publish Firestore security rules that restrict each anonymous user to their own documents.

Firestore document paths:

```text
users/{uid}/matrices/{matrixId}
users/{uid}/meta/app
users/{uid}/usage/{YYYY-MM-DD}
```

Security rules:

```text
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/matrices/{matrixId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /users/{userId}/meta/{documentId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /users/{userId}/usage/{dateKey} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## AI Function Contract

Endpoint:

```text
POST /.netlify/functions/groqChat
```

Request:

```json
{
  "action": "generateCriteria",
  "matrix": {},
  "extraInstructions": "optional user instruction"
}
```

Supported AI actions:

```text
generateCriteria
suggestOptions
suggestScores
reviewMatrix
generateRecommendation
generateActionChecklist
```

Success:

```json
{
  "success": true,
  "action": "generateCriteria",
  "data": {}
}
```

Failure:

```json
{
  "success": false,
  "error": "Useful error message"
}
```

---

## Environment Variables

- `VITE_FIREBASE_API_KEY`: Required. Firebase Web App API key.
- `VITE_FIREBASE_AUTH_DOMAIN`: Required. Firebase auth domain.
- `VITE_FIREBASE_PROJECT_ID`: Required. Firebase project id.
- `VITE_FIREBASE_STORAGE_BUCKET`: Required. Firebase storage bucket.
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Required. Firebase messaging sender id.
- `VITE_FIREBASE_APP_ID`: Required. Firebase app id.
- `GROQ_API_KEY`: Required. Server-only Groq API key used by the Netlify Function.
- `GROQ_MODEL`: Optional server-side model override. Defaults to `llama-3.3-70b-versatile`.

---

## Import and Export

Each matrix can be exported as JSON from the matrix header.

Imported JSON is validated with Zod, assigned a new matrix id, and saved as a new Firestore document so existing matrices are not overwritten.

Saved AI summaries and action checklists are included in exports.

---

## Project Structure

```text
src/
  components/
    about/
    layout/
    matrix/
    ui/
  hooks/
  pages/
  schemas/
  services/
  types/
  utils/

netlify/
  functions/
    groqChat.ts
```

---

## What This Project Demonstrates

This project demonstrates:

- building a real React + TypeScript application
- structuring a product-like frontend
- using Firebase Anonymous Authentication
- saving user-specific data in Firestore
- integrating LLMs through serverless functions
- keeping API keys server-side
- validating AI output with Zod
- designing user-controlled AI suggestions
- handling import/export workflows
- deploying a full-stack app on Netlify

---

## Future Improvements

- Add shareable read-only links with a database-backed version.
- Add collaboration and user accounts.
- Add richer sensitivity analysis for weight changes.
- Add per-suggestion editing before accepting AI suggestions.
- Add scenario planning and side-by-side recommendation narratives.
- Add automated tests for scoring logic.
- Add GitHub Actions for typecheck and build.
- Add more examples and templates.
- Add screenshots and a short demo GIF to the README.

---

## Repository Metadata Suggestions

Recommended GitHub repository description:

```text
AI-assisted decision matrix app for comparing options with weighted criteria, Groq-powered recommendations, Firebase persistence, and Netlify Functions.
```

Recommended website:

```text
https://decision-matrix-ai.netlify.app/
```

Recommended topics:

```text
react
typescript
vite
tailwindcss
firebase
firestore
netlify-functions
groq
llm
ai-tools
decision-support
portfolio-project
```
