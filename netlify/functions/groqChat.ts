import type { Handler, HandlerEvent } from "@netlify/functions";
import { aiResponseDataSchemas } from "../../src/schemas/matrixSchemas";

type AiAction =
  | "generateCriteria"
  | "suggestOptions"
  | "suggestScores"
  | "reviewMatrix"
  | "generateRecommendation"
  | "generateActionChecklist";

type IncomingRequest = {
  action: AiAction;
  matrix: Record<string, unknown>;
  extraInstructions?: string;
  ranking?: unknown;
  results?: unknown;
  insights?: unknown;
};

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

type GroqChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";

const jsonHeaders = {
  "Content-Type": "application/json"
};

const actions: AiAction[] = [
  "generateCriteria",
  "suggestOptions",
  "suggestScores",
  "reviewMatrix",
  "generateRecommendation",
  "generateActionChecklist"
];

const systemPrompt = `You are an expert decision analyst helping users build weighted decision matrices. The app can compare anything: products, tools, jobs, apartments, travel destinations, vendors, courses, business ideas, universities, laptops, cities, or personal decisions. Generate practical, relevant, non-generic criteria. Be neutral, transparent, and decision-focused. Do not invent hard facts when uncertain. If the available information is limited, use cautious language, especially when scoring based only on user-provided information. The user remains in control and AI suggestions are not final decisions. Return valid JSON only. Do not include markdown. Do not include explanations outside the JSON object.`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isAction = (value: unknown): value is AiAction =>
  typeof value === "string" && actions.includes(value as AiAction);

const response = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: jsonHeaders,
  body: JSON.stringify(body)
});

const parseRequest = (event: HandlerEvent): IncomingRequest => {
  if (!event.body) {
    throw new Error("Missing request body.");
  }

  const parsed = JSON.parse(event.body) as unknown;
  if (!isRecord(parsed)) {
    throw new Error("Request body must be a JSON object.");
  }

  if (!isAction(parsed.action)) {
    throw new Error("Invalid action.");
  }

  if (!isRecord(parsed.matrix)) {
    throw new Error("Request body must include a matrix object.");
  }

  if (
    parsed.extraInstructions !== undefined &&
    typeof parsed.extraInstructions !== "string"
  ) {
    throw new Error("extraInstructions must be a string when provided.");
  }

  return {
    action: parsed.action,
    matrix: parsed.matrix,
    extraInstructions: parsed.extraInstructions,
    ranking: parsed.ranking ?? parsed.results,
    results: parsed.results,
    insights: parsed.insights
  };
};

const getActionPrompt = ({
  action,
  matrix,
  extraInstructions,
  ranking,
  insights
}: IncomingRequest) => {
  const compactMatrix = JSON.stringify(matrix, null, 2);
  const instructions = extraInstructions?.trim()
    ? `\nExtra user instructions:\n${extraInstructions.trim()}`
    : "";

  if (action === "generateCriteria") {
    return `Generate evaluation criteria for this generic decision matrix. Use the matrix title, category, goal, constraints, existing options, and existing criteria. Avoid duplicates. Favor criteria that are concrete enough to score from 0 to 5. Use weights from 1 to 5 where 5 is critical. Return this exact JSON shape:
{
  "criteria": [
    {
      "category": "Cost",
      "name": "Initial cost",
      "description": "How expensive the option is upfront.",
      "weight": 4,
      "isMustHave": false
    }
  ]
}

Matrix:
${compactMatrix}${instructions}`;
  }

  if (action === "suggestOptions") {
    return `Suggest relevant options for this decision matrix. Avoid options already present unless a renamed variant is clearly useful. Keep descriptions short and practical. Return this exact JSON shape:
{
  "options": [
    {
      "name": "Option name",
      "description": "Short explanation of why this option is relevant."
    }
  ]
}

Matrix:
${compactMatrix}${instructions}`;
  }

  if (action === "suggestScores") {
    return `Suggest scores for every option and criterion in this decision matrix. Scores are suggestions only. Use cautious language when information is limited. Do not imply certainty. Use values from 0 to 5 where 0 means does not meet or not applicable and 5 means excellent. Use optionName and criterionName exactly as provided in the matrix when possible. Return this exact JSON shape:
{
  "scores": [
    {
      "optionName": "Option A",
      "criterionName": "Cost",
      "value": 4,
      "note": "Short reason for the score.",
      "confidence": "medium"
    }
  ]
}

Matrix:
${compactMatrix}${instructions}`;
  }

  if (action === "reviewMatrix") {
    return `Review the quality of this decision matrix. Focus on whether criteria are useful, weights express priorities, must-haves are appropriate, and scoring coverage is sufficient. Return this exact JSON shape:
{
  "strengths": [
    "The criteria cover both practical and long-term factors."
  ],
  "issues": [
    "Most criteria have the same weight, which may reduce decision quality."
  ],
  "suggestions": [
    "Consider marking your non-negotiable criteria as must-have."
  ]
}

Matrix:
${compactMatrix}${instructions}`;
  }

  if (action === "generateActionChecklist") {
    return `Generate a practical decision-to-action checklist for this matrix. Classify the decision into exactly one checklistType:
- purchase_checklist for consumer/product buying decisions
- trial_rollout_plan for tool, vendor, or SaaS selections
- booking_plan for travel or event booking decisions
- negotiation_plan for job offers or agreement decisions
- viewing_contract_plan for apartment, housing, or lease decisions
- proof_of_concept_plan for technical architecture or engineering decisions
- learning_plan for course or education decisions
- implementation_plan for operational or project decisions
- general_action_plan when no specific type fits

Use the current winner, score results, must-have failures, weak spots, constraints, and confidence/stability context. Generate 3 to 12 concrete actions that help the user act on the winning option without blindly trusting the score. Include validation checks before commitment and risks to watch. If the result is sensitive, low-confidence, or the winner fails must-have criteria, include caution and validation steps before committing. Do not give generic advice. Do not say "do more research" unless you specify exactly what to check.

Return this exact JSON shape:
{
  "checklistType": "booking_plan",
  "title": "Book Lisbon with confidence",
  "summary": "Lisbon is the current winner, but validate accommodation, internet, and total cost before committing.",
  "actions": [
    {
      "phase": "Before committing",
      "task": "Check accommodation prices for your exact dates.",
      "reason": "Budget is a high-weight criterion and prices can change quickly.",
      "priority": "high"
    }
  ],
  "validationChecks": [
    "Confirm reliable Wi-Fi or coworking access near the accommodation."
  ],
  "risksToWatch": [
    "Final cost may exceed the budget if accommodation prices rise."
  ]
}

Matrix:
${compactMatrix}

Calculated results:
${JSON.stringify(ranking ?? null, null, 2)}

Decision insights:
${JSON.stringify(insights ?? null, null, 2)}${instructions}`;
  }

  return `Generate an explainable recommendation using the full matrix and calculated ranking. Respect the weighted score results, but call out tradeoffs, risks, and validation steps. The user remains responsible for the final decision. Return this exact JSON shape:
{
  "summary": "Short recommendation paragraph.",
  "winner": "Option name",
  "whyWinner": [
    "Reason 1",
    "Reason 2"
  ],
  "tradeoffs": [
    "Tradeoff 1",
    "Tradeoff 2"
  ],
  "risks": [
    "Risk 1"
  ],
  "nextSteps": [
    "Validate the weakest high-weight criterion before making the final decision."
  ]
}

Matrix:
${compactMatrix}

Calculated ranking:
${JSON.stringify(ranking ?? null, null, 2)}${instructions}`;
};

const parseJsonContent = (content: string): unknown => {
  try {
    return JSON.parse(content) as unknown;
  } catch {
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(content.slice(start, end + 1)) as unknown;
    }
    throw new Error("AI returned a response that was not valid JSON.");
  }
};

const validateAiData = (action: AiAction, data: unknown) => {
  const validation = aiResponseDataSchemas[action].safeParse(data);

  if (validation.success) {
    return { success: true as const, data: validation.data };
  }

  const details =
    process.env.NODE_ENV === "development"
      ? validation.error.issues.slice(0, 5).map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      : undefined;

  return {
    success: false as const,
    details
  };
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return response(405, {
      success: false,
      error: "Only POST requests are supported."
    });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return response(500, {
      success: false,
      error: "GROQ_API_KEY is not configured."
    });
  }

  let request: IncomingRequest;
  try {
    request = parseRequest(event);
  } catch (error) {
    return response(400, {
      success: false,
      error: error instanceof Error ? error.message : "Invalid request."
    });
  }

  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: getActionPrompt(request) }
  ];

  try {
    const groqResponse = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        max_tokens: 2200,
        response_format: { type: "json_object" }
      })
    });

    const groqPayload = (await groqResponse.json()) as GroqChatResponse;

    if (!groqResponse.ok) {
      return response(groqResponse.status, {
        success: false,
        error: groqPayload.error?.message ?? "Groq API request failed."
      });
    }

    const content = groqPayload.choices?.[0]?.message?.content;
    if (!content) {
      return response(502, {
        success: false,
        error: "Groq returned an empty response."
      });
    }

    let parsedContent: unknown;
    try {
      parsedContent = parseJsonContent(content);
    } catch {
      return response(502, {
        success: false,
        error: "AI returned an unexpected response format."
      });
    }
    const validated = validateAiData(request.action, parsedContent);

    if (!validated.success) {
      return response(502, {
        success: false,
        error: "AI returned an unexpected response format.",
        ...(validated.details ? { details: validated.details } : {})
      });
    }

    return response(200, {
      success: true,
      action: request.action,
      data: validated.data
    });
  } catch (error) {
    return response(500, {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected AI service error."
    });
  }
};
