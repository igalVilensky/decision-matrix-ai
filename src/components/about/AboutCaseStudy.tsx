import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

type CaseStudySection = {
  title: string;
  body: string;
};

const sections: CaseStudySection[] = [
  {
    title: "Problem",
    body: "High-stakes choices often start as messy tradeoffs: unclear options, vague priorities, and no shared way to compare them. Blank spreadsheets make that worse for first-time users."
  },
  {
    title: "Solution",
    body: "Decision Matrix AI turns an uncertain choice into a guided workflow: describe the decision, add options, define weighted criteria, score tradeoffs, and review explainable results."
  },
  {
    title: "How it works",
    body: "The app guides users through setup step by step, then lets them edit options, criteria, weights, scores, notes, and AI suggestions before anything is applied."
  },
  {
    title: "AI architecture",
    body: "Groq calls go through Netlify Functions so the API key is never exposed in frontend code. AI can suggest options, criteria, scores, reviews, and recommendations."
  },
  {
    title: "Data and persistence",
    body: "Firebase Anonymous Auth creates a private workspace per browser or user. Firestore stores matrices under users/{uid}/matrices, with debounced saves for normal edits."
  },
  {
    title: "Decision logic",
    body: "Weighted scoring ranks options, highlights must-have failures, explains category performance, and adds decision insights such as stability, confidence, key drivers, and weak spots."
  },
  {
    title: "Trust and safety choices",
    body: "Zod validates imported data and AI responses. AI suggestions stay editable and must be reviewed before being applied. Anonymous users have daily AI request limits."
  },
  {
    title: "Future improvements",
    body: "Next steps could include shareable read-only links, named accounts, collaboration, richer sensitivity analysis, and deeper scenario planning."
  }
];

const techStack = [
  "React",
  "Vite",
  "TypeScript",
  "Tailwind",
  "Firebase Auth",
  "Firestore",
  "Netlify Functions",
  "Groq",
  "Zod"
];

export const AboutCaseStudy = () => (
  <div className="space-y-5">
    <div className="rounded-lg border border-brand-100 bg-brand-50 p-5">
      <Badge tone="green">Portfolio case study</Badge>
      <h3 className="mt-3 text-2xl font-bold text-ink-900">Decision Matrix AI</h3>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-ink-700">
        A full-stack decision-support app for turning complex choices into structured,
        explainable comparisons with human-reviewed AI assistance.
      </p>
    </div>

    <div className="grid gap-4 md:grid-cols-2">
      {sections.map((section) => (
        <Card key={section.title} className="p-4">
          <h4 className="font-bold text-ink-900">{section.title}</h4>
          <p className="mt-2 text-sm leading-6 text-ink-500">{section.body}</p>
        </Card>
      ))}
    </div>

    <Card className="p-4">
      <h4 className="font-bold text-ink-900">Tech stack</h4>
      <div className="mt-3 flex flex-wrap gap-2">
        {techStack.map((item) => (
          <Badge key={item} tone="blue">
            {item}
          </Badge>
        ))}
      </div>
    </Card>
  </div>
);
