import { useMemo, useState } from "react";
import { Check, FilePlus2 } from "lucide-react";
import type { Criterion, DecisionMatrix, MatrixOption } from "../../types/matrix";
import { currentTimestamp } from "../../utils/dates";
import { createId } from "../../utils/ids";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";

type Template = {
  id: string;
  name: string;
  category: string;
  goal: string;
  constraints: string;
  options: Array<Pick<MatrixOption, "name" | "description">>;
  criteria: Array<Omit<Criterion, "id">>;
};

const templates: Template[] = [
  {
    id: "ai-chatbot",
    name: "AI chatbot comparison",
    category: "Software tools",
    goal: "Choose an AI chatbot for research, writing, analysis, and day-to-day productivity.",
    constraints: "Prioritize reliability, privacy fit, workflow breadth, and plan value.",
    options: [
      { name: "ChatGPT", description: "General-purpose AI assistant." },
      { name: "Claude", description: "Conversational assistant for long-form work." },
      { name: "Perplexity", description: "Research-oriented answer engine." }
    ],
    criteria: [
      {
        category: "Capability",
        name: "Reasoning quality",
        description: "Handles nuanced, multi-step requests well.",
        weight: 5,
        isMustHave: true
      },
      {
        category: "Workflow",
        name: "Ease of adoption",
        description: "Fits naturally into everyday work.",
        weight: 4
      },
      {
        category: "Risk",
        name: "Trust and transparency",
        description: "Surfaces uncertainty and limitations clearly.",
        weight: 5,
        isMustHave: true
      }
    ]
  },
  {
    id: "travel",
    name: "Travel destination comparison",
    category: "Travel",
    goal: "Pick a destination that balances budget, logistics, comfort, and memorable experiences.",
    constraints: "Keep total cost realistic and account for seasonality.",
    options: [
      { name: "Lisbon", description: "Coastal city with strong food and transit." },
      { name: "Kyoto", description: "Historic city with deep cultural appeal." },
      { name: "Mexico City", description: "Large cultural hub with excellent dining." }
    ],
    criteria: [
      {
        category: "Budget",
        name: "Total trip cost",
        description: "Flights, lodging, food, transport, and activities.",
        weight: 5,
        isMustHave: true
      },
      {
        category: "Experience",
        name: "Food and culture",
        description: "Depth of distinctive local experiences.",
        weight: 5
      },
      {
        category: "Logistics",
        name: "Ease of getting around",
        description: "Walkability, public transit, and route simplicity.",
        weight: 3
      }
    ]
  },
  {
    id: "job",
    name: "Job offer comparison",
    category: "Career",
    goal: "Compare job opportunities by compensation, growth, team quality, and sustainability.",
    constraints: "Must support the work style and growth path you want next.",
    options: [
      { name: "Offer A", description: "First job opportunity." },
      { name: "Offer B", description: "Second job opportunity." },
      { name: "Offer C", description: "Third job opportunity." }
    ],
    criteria: [
      {
        category: "Growth",
        name: "Learning curve",
        description: "Technical, product, and leadership growth.",
        weight: 5
      },
      {
        category: "People",
        name: "Team quality",
        description: "Manager, peers, collaboration, and culture.",
        weight: 5,
        isMustHave: true
      },
      {
        category: "Sustainability",
        name: "Work-life sustainability",
        description: "Likelihood the role stays healthy over time.",
        weight: 4,
        isMustHave: true
      }
    ]
  },
  {
    id: "laptop",
    name: "Laptop comparison",
    category: "Consumer products",
    goal: "Choose a laptop that fits performance, portability, display, battery, and budget needs.",
    constraints: "Must handle the primary workload comfortably for several years.",
    options: [
      { name: "Laptop A", description: "Primary candidate." },
      { name: "Laptop B", description: "Alternative candidate." },
      { name: "Laptop C", description: "Budget or specialist candidate." }
    ],
    criteria: [
      {
        category: "Performance",
        name: "Workload performance",
        description: "Speed for the apps and tasks you actually use.",
        weight: 5,
        isMustHave: true
      },
      {
        category: "Mobility",
        name: "Battery and portability",
        description: "Realistic battery life, weight, and travel comfort.",
        weight: 4
      },
      {
        category: "Value",
        name: "Price-to-longevity",
        description: "Whether the cost is justified over expected useful life.",
        weight: 4
      }
    ]
  },
  {
    id: "apartment",
    name: "Apartment comparison",
    category: "Housing",
    goal: "Compare apartments using cost, commute, livability, risk, and fit for daily life.",
    constraints: "Must fit budget and non-negotiable location needs.",
    options: [
      { name: "Apartment A", description: "First unit or neighborhood." },
      { name: "Apartment B", description: "Second unit or neighborhood." },
      { name: "Apartment C", description: "Third unit or neighborhood." }
    ],
    criteria: [
      {
        category: "Budget",
        name: "All-in monthly cost",
        description: "Rent, utilities, fees, commute, and likely hidden costs.",
        weight: 5,
        isMustHave: true
      },
      {
        category: "Location",
        name: "Commute and neighborhood fit",
        description: "Daily convenience, safety, noise, and nearby essentials.",
        weight: 5,
        isMustHave: true
      },
      {
        category: "Quality",
        name: "Space and condition",
        description: "Layout, light, storage, maintenance, and building quality.",
        weight: 4
      }
    ]
  },
  {
    id: "course",
    name: "Course comparison",
    category: "Education",
    goal: "Choose a course by learning outcomes, credibility, cost, effort, and practical fit.",
    constraints: "Must fit available schedule and produce usable skills.",
    options: [
      { name: "Course A", description: "First course candidate." },
      { name: "Course B", description: "Second course candidate." },
      { name: "Course C", description: "Third course candidate." }
    ],
    criteria: [
      {
        category: "Outcome",
        name: "Skill relevance",
        description: "How directly the course supports your goal.",
        weight: 5,
        isMustHave: true
      },
      {
        category: "Quality",
        name: "Instruction quality",
        description: "Teaching clarity, assignments, feedback, and depth.",
        weight: 4
      },
      {
        category: "Fit",
        name: "Schedule and effort fit",
        description: "Whether the course fits your available time and energy.",
        weight: 4,
        isMustHave: true
      }
    ]
  }
];

type CreateMatrixFormProps = {
  onCreate: (matrix: DecisionMatrix) => void;
};

export const CreateMatrixForm = ({ onCreate }: CreateMatrixFormProps) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("blank");
  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId),
    [selectedTemplateId]
  );
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [goal, setGoal] = useState("");
  const [constraints, setConstraints] = useState("");

  const applyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;
    setTitle(template.name);
    setCategory(template.category);
    setGoal(template.goal);
    setConstraints(template.constraints);
  };

  const createMatrix = (withTemplate: boolean) => {
    const timestamp = currentTimestamp();
    const template = withTemplate ? selectedTemplate : undefined;
    const options =
      template?.options.map((option) => ({
        ...option,
        id: createId("option"),
        notes: ""
      })) ?? [];
    const criteria =
      template?.criteria.map((criterion) => ({
        ...criterion,
        id: createId("criterion"),
        aiGenerated: false
      })) ?? [];

    onCreate({
      id: createId("matrix"),
      title: title.trim() || template?.name || "Untitled decision",
      category: category.trim() || template?.category || "General",
      goal: goal.trim(),
      constraints: constraints.trim(),
      createdAt: timestamp,
      updatedAt: timestamp,
      options,
      criteria,
      scores: []
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Decision title"
          placeholder="Which laptop should I buy?"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <Input
          label="What are you comparing?"
          placeholder="Laptops, apartments, vendors, cities..."
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        />
        <Textarea
          label="Goal/context"
          placeholder="Describe the decision, who it affects, and what a good outcome looks like."
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
        />
        <Textarea
          label="Constraints or priorities"
          placeholder="Budget, deadlines, must-haves, preferences, unknowns..."
          value={constraints}
          onChange={(event) => setConstraints(event.target.value)}
        />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-ink-500">
            Start from a template
          </h3>
          <Badge>{selectedTemplate ? selectedTemplate.name : "Blank matrix"}</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <button
            className={`rounded-lg border p-4 text-left transition hover:border-brand-500 ${
              selectedTemplateId === "blank"
                ? "border-brand-500 bg-brand-50"
                : "border-ink-200 bg-white"
            }`}
            onClick={() => setSelectedTemplateId("blank")}
          >
            <FilePlus2 className="mb-3 h-5 w-5 text-brand-600" />
            <div className="font-bold text-ink-900">Blank matrix</div>
            <p className="mt-1 text-sm text-ink-500">Start clean and add your own structure.</p>
          </button>
          {templates.map((template) => (
            <button
              key={template.id}
              className={`rounded-lg border p-4 text-left transition hover:border-brand-500 ${
                selectedTemplateId === template.id
                  ? "border-brand-500 bg-brand-50"
                  : "border-ink-200 bg-white"
              }`}
              onClick={() => applyTemplate(template.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-ink-900">{template.name}</div>
                  <p className="mt-1 text-sm text-ink-500">{template.category}</p>
                </div>
                {selectedTemplateId === template.id ? (
                  <Check className="h-5 w-5 text-brand-600" />
                ) : null}
              </div>
            </button>
          ))}
        </div>
      </div>

      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between" tone="soft">
        <p className="text-sm leading-6 text-ink-600">
          You can use AI after creation to generate more criteria, suggest options, or draft
          scores for review.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => createMatrix(false)}>
            Create blank matrix
          </Button>
          <Button onClick={() => createMatrix(true)}>
            {selectedTemplate ? "Create from template" : "Create matrix"}
          </Button>
        </div>
      </Card>
    </div>
  );
};
