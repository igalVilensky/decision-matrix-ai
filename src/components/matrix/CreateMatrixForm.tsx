import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, FilePlus2, Plus, Trash2 } from "lucide-react";
import type { Criterion, DecisionMatrix, MatrixOption } from "../../types/matrix";
import { currentTimestamp } from "../../utils/dates";
import { createId } from "../../utils/ids";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
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

type CreateStep = 0 | 1 | 2 | 3 | 4;
type StartMode = "guided" | "template";

const stepLabels = ["Decision", "Category", "Options", "Priorities", "Start"];
const optionPlaceholders = ["Lisbon", "Barcelona", "Athens"];

const createTitleFromDescription = (description: string, comparisonType: string): string => {
  const compactDescription = description.trim().replace(/\s+/g, " ");
  const firstSentence = compactDescription.split(/[.!?]/)[0]?.trim() ?? "";

  if (firstSentence) {
    const title = firstSentence.length > 78 ? `${firstSentence.slice(0, 75).trim()}...` : firstSentence;
    return title.charAt(0).toUpperCase() + title.slice(1);
  }

  const compactComparison = comparisonType.trim().replace(/\s+/g, " ");
  return compactComparison ? `${compactComparison} decision` : "Untitled decision";
};

export const CreateMatrixForm = ({ onCreate }: CreateMatrixFormProps) => {
  const [step, setStep] = useState<CreateStep>(0);
  const [decisionDescription, setDecisionDescription] = useState("");
  const [comparisonType, setComparisonType] = useState("");
  const [initialOptions, setInitialOptions] = useState(["", "", ""]);
  const [priorities, setPriorities] = useState("");
  const [startMode, setStartMode] = useState<StartMode>("guided");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id ?? "");
  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId),
    [selectedTemplateId]
  );

  const canContinue =
    (step === 0 && decisionDescription.trim().length > 0) ||
    (step === 1 && comparisonType.trim().length > 0) ||
    step === 2 ||
    step === 3 ||
    step === 4;

  const goNext = () => {
    if (!canContinue || step === 4) return;
    setStep((currentStep) => Math.min(currentStep + 1, 4) as CreateStep);
  };

  const goBack = () => {
    setStep((currentStep) => Math.max(currentStep - 1, 0) as CreateStep);
  };

  const createMatrix = () => {
    const timestamp = currentTimestamp();
    const template = startMode === "template" ? selectedTemplate : undefined;
    const options =
      template?.options.map((option) => ({
        ...option,
        id: createId("option"),
        notes: ""
      })) ??
      initialOptions
        .map((option) => option.trim())
        .filter(Boolean)
        .map((name) => ({
          id: createId("option"),
          name,
          description: "",
          notes: ""
        }));
    const criteria =
      template?.criteria.map((criterion) => ({
        ...criterion,
        id: createId("criterion"),
        aiGenerated: false
      })) ?? [];

    onCreate({
      id: createId("matrix"),
      title: createTitleFromDescription(decisionDescription, comparisonType),
      category: comparisonType.trim() || template?.category || "General",
      goal: decisionDescription.trim() || template?.goal || "",
      constraints: priorities.trim() || template?.constraints || "",
      createdAt: timestamp,
      updatedAt: timestamp,
      options,
      criteria,
      scores: []
    });
  };

  const renderStep = () => {
    if (step === 0) {
      return (
        <div className="space-y-4">
          <Textarea
            label="What decision are you trying to make?"
            placeholder="Example: I need to choose a laptop for software development, travel, and photo editing without overspending."
            helperText="Write this naturally. The app will use it to guide setup and AI suggestions."
            className="min-h-40"
            value={decisionDescription}
            onChange={(event) => setDecisionDescription(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {[
              "Choose a remote work city",
              "Pick between job offers",
              "Select a CRM for a small team"
            ].map((example) => (
              <button
                key={example}
                className="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-600 transition hover:border-brand-500 hover:text-brand-700"
                onClick={() => setDecisionDescription(example)}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (step === 1) {
      return (
        <Input
          label="What type of things are you comparing?"
          placeholder="Examples: travel destinations, laptops, job offers, software tools"
          helperText="This is the category, not the actual options. You will add the actual choices in the next step."
          value={comparisonType}
          onChange={(event) => setComparisonType(event.target.value)}
        />
      );
    }

    if (step === 2) {
      const updateInitialOption = (index: number, value: string) => {
        setInitialOptions((currentOptions) =>
          currentOptions.map((option, optionIndex) =>
            optionIndex === index ? value : option
          )
        );
      };

      const addInitialOption = () => {
        setInitialOptions((currentOptions) => [...currentOptions, ""]);
      };

      const removeInitialOption = (index: number) => {
        setInitialOptions((currentOptions) =>
          currentOptions.filter((_, optionIndex) => optionIndex !== index)
        );
      };

      return (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-ink-900">Add any options you already have</h3>
            <p className="mt-1 text-sm leading-6 text-ink-500">
              These are the choices you want to compare. You can skip this and ask AI to suggest
              options later.
            </p>
          </div>
          {initialOptions.length > 0 ? (
            <>
              <div className="space-y-3">
                {initialOptions.map((option, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Input
                      label={index === 0 ? "Option names" : undefined}
                      placeholder={optionPlaceholders[index] ?? "Another option"}
                      value={option}
                      onChange={(event) => updateInitialOption(index, event.target.value)}
                    />
                    <Button
                      className={index === 0 ? "mt-7" : ""}
                      variant="ghost"
                      size="icon"
                      icon={<Trash2 className="h-4 w-4" />}
                      onClick={() => removeInitialOption(index)}
                    >
                      Remove option field
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" icon={<Plus className="h-4 w-4" />} onClick={addInitialOption}>
                Add another option
              </Button>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-ink-200 bg-white p-5">
              <h4 className="font-bold text-ink-900">No options added yet.</h4>
              <p className="mt-1 max-w-xl text-sm leading-6 text-ink-500">
                You can skip this step and ask AI to suggest options later, or add one now.
              </p>
              <Button
                className="mt-4"
                variant="outline"
                icon={<Plus className="h-4 w-4" />}
                onClick={addInitialOption}
              >
                Add option
              </Button>
            </div>
          )}
        </div>
      );
    }

    if (step === 3) {
      return (
        <Textarea
          label="What matters most?"
          placeholder="Budget, beginner friendliness, privacy, timeline, must-haves, risks, people affected..."
          helperText="Optional, but helpful. You can edit priorities later."
          className="min-h-40"
          value={priorities}
          onChange={(event) => setPriorities(event.target.value)}
        />
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            className={`rounded-lg border p-4 text-left transition hover:border-brand-500 ${
              startMode === "guided"
                ? "border-brand-500 bg-brand-50"
                : "border-ink-200 bg-white"
            }`}
            onClick={() => setStartMode("guided")}
          >
            <FilePlus2 className="mb-3 h-5 w-5 text-brand-600" />
            <div className="font-bold text-ink-900">Start with my setup</div>
            <p className="mt-1 text-sm leading-6 text-ink-500">
              Use your description and any options you added, then guide you through criteria,
              scores, and review.
            </p>
          </button>
          <button
            className={`rounded-lg border p-4 text-left transition hover:border-brand-500 ${
              startMode === "template"
                ? "border-brand-500 bg-brand-50"
                : "border-ink-200 bg-white"
            }`}
            onClick={() => setStartMode("template")}
          >
            <Check className="mb-3 h-5 w-5 text-brand-600" />
            <div className="font-bold text-ink-900">Start from template</div>
            <p className="mt-1 text-sm leading-6 text-ink-500">
              Preload practical options and criteria, then edit them for your decision.
            </p>
          </button>
        </div>

        {startMode === "template" ? (
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-ink-500">
                Choose a template
              </h3>
              <Badge>{selectedTemplate?.name ?? "Template"}</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  className={`rounded-lg border p-4 text-left transition hover:border-brand-500 ${
                    selectedTemplateId === template.id
                      ? "border-brand-500 bg-brand-50"
                      : "border-ink-200 bg-white"
                  }`}
                  onClick={() => setSelectedTemplateId(template.id)}
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
        ) : null}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {stepLabels.map((label, index) => {
          const isActive = step === index;
          const isComplete = step > index;

          return (
            <span
              key={label}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                isActive
                  ? "bg-ink-900 text-white"
                  : isComplete
                    ? "bg-brand-100 text-brand-700"
                    : "bg-ink-100 text-ink-500"
              }`}
            >
              {isComplete ? <Check className="h-3.5 w-3.5" /> : index + 1}
              {label}
            </span>
          );
        })}
      </div>

      <div className="rounded-lg border border-ink-100 bg-ink-50/70 p-5">
        {renderStep()}
      </div>

      <div className="flex flex-col gap-3 border-t border-ink-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-ink-500">
          AI can help draft suggestions later, and you can edit everything before accepting it.
        </p>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          {step > 0 ? (
            <Button variant="outline" icon={<ArrowLeft className="h-4 w-4" />} onClick={goBack}>
              Back
            </Button>
          ) : null}
          {step < 4 ? (
            <Button
              icon={<ArrowRight className="h-4 w-4" />}
              disabled={!canContinue}
              onClick={goNext}
            >
              Continue
            </Button>
          ) : (
            <Button onClick={createMatrix}>
              Create decision matrix
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
