# Decision Matrix AI

Decision Matrix AI is a portfolio-quality React app for comparing complex choices with an AI-assisted weighted decision matrix. It can compare software tools, products, jobs, apartments, travel destinations, courses, vendors, business ideas, universities, laptops, cities, or any other decision with meaningful tradeoffs.

The app turns a vague decision into options, criteria, adjustable weights, manual or AI-suggested scores, ranked results, category breakdowns, must-have failures, and an explainable recommendation.

## Features

- Create blank matrices or start from templates.
- Compare any type of option, not only software tools.
- Add, edit, duplicate, and delete cloud-saved matrices.
- Define weighted criteria from 1 to 5.
- Mark criteria as must-have.
- Score each option from 0 to 5 with optional notes.
- Calculate weighted totals, percentage fit, winner, category breakdowns, strengths, weaknesses, and must-have gaps.
- Use Groq-powered AI through Netlify Functions for:
  - criteria generation
  - option suggestions
  - score suggestions
  - matrix quality review
  - final recommendation generation
- Review, edit, partially accept, or reject AI suggestions before they affect the matrix.
- Store each user's matrices in Firestore under `users/{uid}/matrices/{matrixId}`.
- Sign users in with Firebase Anonymous Authentication.
- Import and export matrix JSON backups.

## Tech Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- Netlify Functions
- Groq API
- Firebase Authentication
- Firestore
- Zod

## Install

```bash
npm install
```

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

The Groq API key is read only on the serverless function side and is never exposed to frontend code.

The `VITE_FIREBASE_*` values are Firebase Web App config values. They are expected to be present in frontend builds and are protected by Firebase Auth plus Firestore security rules.

If Firebase env vars are missing, the app shows a setup error instead of silently falling back to local storage.

## Build

```bash
npm run build
```

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

## Environment Variables

- `VITE_FIREBASE_API_KEY`: Required. Firebase Web App API key.
- `VITE_FIREBASE_AUTH_DOMAIN`: Required. Firebase auth domain.
- `VITE_FIREBASE_PROJECT_ID`: Required. Firebase project id.
- `VITE_FIREBASE_STORAGE_BUCKET`: Required. Firebase storage bucket.
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Required. Firebase messaging sender id.
- `VITE_FIREBASE_APP_ID`: Required. Firebase app id.
- `GROQ_API_KEY`: Required. Server-only Groq API key used by the Netlify Function.
- `GROQ_MODEL`: Optional server-side model override. Defaults to `llama-3.3-70b-versatile`.

## Import and Export

Each matrix can be exported as JSON from the matrix header. Imported JSON is validated with Zod, assigned a new matrix id, and saved as a new Firestore document so existing matrices are not overwritten.

## Future Improvements

- Add shareable read-only links with a database-backed version.
- Add collaboration and user accounts.
- Add richer sensitivity analysis for weight changes.
- Add per-suggestion editing before accepting AI suggestions.
- Add scenario planning and side-by-side recommendation narratives.
