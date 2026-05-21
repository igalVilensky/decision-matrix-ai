import type { DecisionMatrix } from "../types/matrix";
import { currentTimestamp } from "../utils/dates";

const now = currentTimestamp();

const createScores = (
  optionIds: string[],
  criterionIds: string[],
  values: number[][]
): DecisionMatrix["scores"] =>
  optionIds.flatMap((optionId, optionIndex) =>
    criterionIds.map((criterionId, criterionIndex) => ({
      optionId,
      criterionId,
      value: values[optionIndex][criterionIndex],
      note: undefined
    }))
  );

export const sampleMatrices: DecisionMatrix[] = [
  {
    id: "sample_ai_chatbot",
    title: "AI chatbot comparison",
    category: "Software tools",
    goal: "Choose a general-purpose AI chatbot for daily research, drafting, and analysis.",
    constraints: "Must be dependable for work use, easy to adopt, and transparent about limitations.",
    createdAt: now,
    updatedAt: now,
    options: [
      {
        id: "chatgpt",
        name: "ChatGPT",
        description: "A broad AI assistant for writing, coding, research, and multimodal work."
      },
      {
        id: "claude",
        name: "Claude",
        description: "A conversational AI assistant known for long-context analysis and writing."
      },
      {
        id: "perplexity",
        name: "Perplexity",
        description: "An answer engine with a strong research and citation workflow."
      }
    ],
    criteria: [
      {
        id: "chatbot_reasoning",
        category: "Capability",
        name: "Reasoning quality",
        description: "How well the tool handles nuanced analysis and multi-step tasks.",
        weight: 5,
        isMustHave: true
      },
      {
        id: "chatbot_research",
        category: "Research",
        name: "Source-backed research",
        description: "How useful the tool is when facts, citations, and recency matter.",
        weight: 4
      },
      {
        id: "chatbot_workflow",
        category: "Workflow",
        name: "Daily usability",
        description: "How quickly the tool fits into everyday work.",
        weight: 4
      },
      {
        id: "chatbot_cost",
        category: "Cost",
        name: "Plan value",
        description: "How strong the value is for the expected subscription cost.",
        weight: 3
      },
      {
        id: "chatbot_trust",
        category: "Risk",
        name: "Trust and transparency",
        description: "How well limitations, uncertainty, and generated content are surfaced.",
        weight: 5,
        isMustHave: true
      }
    ],
    scores: createScores(
      ["chatgpt", "claude", "perplexity"],
      ["chatbot_reasoning", "chatbot_research", "chatbot_workflow", "chatbot_cost", "chatbot_trust"],
      [
        [5, 4, 5, 4, 4],
        [5, 3, 4, 4, 5],
        [3, 5, 4, 4, 4]
      ]
    ),
    aiSummary:
      "ChatGPT has the strongest overall fit for this use case because it balances reasoning, workflow breadth, and source-aware research. Perplexity remains useful as a dedicated research companion."
  },
  {
    id: "sample_travel_destination",
    title: "Travel destination comparison",
    category: "Travel",
    goal: "Pick a two-week remote-work-friendly trip for September with a mix of food, culture, and manageable logistics.",
    constraints: "Prefer walkable cities, reliable internet, and a total budget under $4,000.",
    createdAt: now,
    updatedAt: now,
    options: [
      {
        id: "lisbon",
        name: "Lisbon",
        description: "Sunny coastal capital with strong food, transit, and coworking options."
      },
      {
        id: "kyoto",
        name: "Kyoto",
        description: "Historic city with remarkable culture, food, and slower travel rhythm."
      },
      {
        id: "mexico_city",
        name: "Mexico City",
        description: "Large cultural hub with excellent dining, neighborhoods, and museums."
      }
    ],
    criteria: [
      {
        id: "travel_budget",
        category: "Budget",
        name: "Total trip cost",
        description: "Expected cost across flights, lodging, food, transport, and activities.",
        weight: 5,
        isMustHave: true
      },
      {
        id: "travel_remote",
        category: "Work setup",
        name: "Remote work reliability",
        description: "Internet, workspaces, time-zone fit, and quiet lodging options.",
        weight: 4,
        isMustHave: true
      },
      {
        id: "travel_food",
        category: "Experience",
        name: "Food and culture",
        description: "Strength of local food, history, arts, and distinctive experiences.",
        weight: 5
      },
      {
        id: "travel_walkability",
        category: "Logistics",
        name: "Walkability and transit",
        description: "How easy it is to get around without a car.",
        weight: 3
      },
      {
        id: "travel_weather",
        category: "Comfort",
        name: "September comfort",
        description: "Likely weather, crowd levels, and day-to-day comfort.",
        weight: 3
      }
    ],
    scores: createScores(
      ["lisbon", "kyoto", "mexico_city"],
      ["travel_budget", "travel_remote", "travel_food", "travel_walkability", "travel_weather"],
      [
        [4, 5, 4, 4, 4],
        [2, 3, 5, 5, 3],
        [5, 4, 5, 3, 4]
      ]
    )
  },
  {
    id: "sample_job_offer",
    title: "Job offer comparison",
    category: "Career",
    goal: "Choose between three job opportunities based on growth, compensation, team quality, and sustainable work style.",
    constraints: "Hybrid or remote preferred. Role must support deep product engineering work.",
    createdAt: now,
    updatedAt: now,
    options: [
      {
        id: "startup_platform",
        name: "Series B platform startup",
        description: "Senior full-stack role on a small product engineering team."
      },
      {
        id: "enterprise_ai",
        name: "Enterprise AI company",
        description: "Frontend platform role with mature engineering processes."
      },
      {
        id: "consulting_studio",
        name: "Product consulting studio",
        description: "Varied client work with high design involvement and frequent context switching."
      }
    ],
    criteria: [
      {
        id: "job_learning",
        category: "Growth",
        name: "Learning curve",
        description: "Expected opportunity to grow technical, product, and leadership skills.",
        weight: 5
      },
      {
        id: "job_comp",
        category: "Compensation",
        name: "Total compensation",
        description: "Salary, equity, benefits, and realistic upside.",
        weight: 4
      },
      {
        id: "job_team",
        category: "People",
        name: "Team quality",
        description: "Confidence in manager, peers, collaboration, and engineering culture.",
        weight: 5,
        isMustHave: true
      },
      {
        id: "job_balance",
        category: "Sustainability",
        name: "Work-life sustainability",
        description: "Likelihood the role remains healthy and focused over time.",
        weight: 4,
        isMustHave: true
      },
      {
        id: "job_impact",
        category: "Role",
        name: "Product impact",
        description: "How much influence the role has on user-facing decisions.",
        weight: 4
      }
    ],
    scores: createScores(
      ["startup_platform", "enterprise_ai", "consulting_studio"],
      ["job_learning", "job_comp", "job_team", "job_balance", "job_impact"],
      [
        [5, 4, 4, 3, 5],
        [4, 5, 5, 4, 3],
        [4, 3, 4, 3, 4]
      ]
    )
  }
];
