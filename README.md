# Decision Matrix AI

Decision Matrix AI is a portfolio-quality React app for comparing complex choices with an AI-assisted weighted decision matrix. It can compare software tools, products, jobs, apartments, travel destinations, courses, vendors, business ideas, universities, laptops, cities, or any other decision with meaningful tradeoffs.

The app turns a vague decision into options, criteria, adjustable weights, manual or AI-suggested scores, ranked results, category breakdowns, must-have failures, and an explainable recommendation.

## Features

- Create blank matrices or start from templates.
- Compare any type of option, not only software tools.
- Add, edit, duplicate, and delete locally saved matrices.
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
- Review, accept, or reject AI suggestions before they affect the matrix.
- Store matrices in `localStorage` for the MVP.

## Tech Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- Netlify Functions
- Groq API
- localStorage

## Install

```bash
npm install
```

## Local Development

AI calls go through Netlify Functions, so use Netlify CLI for local development:

```bash
npm install -g netlify-cli
cp .env.example .env
```

Add your Groq key to `.env`:

```bash
GROQ_API_KEY=your_groq_api_key_here
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

5. Add this environment variable in Netlify:

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

- `GROQ_API_KEY`: Required. Groq API key used by the Netlify Function.
- `GROQ_MODEL`: Optional. Defaults to `llama-3.3-70b-versatile`.

## Future Improvements

- Add import and export for matrix JSON.
- Add shareable read-only links with a database-backed version.
- Add collaboration and user accounts.
- Add richer sensitivity analysis for weight changes.
- Add per-suggestion editing before accepting AI suggestions.
- Add scenario planning and side-by-side recommendation narratives.
