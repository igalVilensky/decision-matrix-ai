import { z } from "zod";

export const scoreConfidenceSchema = z.enum(["low", "medium", "high"]);
export const actionChecklistTypeSchema = z.enum([
  "purchase_checklist",
  "trial_rollout_plan",
  "booking_plan",
  "negotiation_plan",
  "viewing_contract_plan",
  "proof_of_concept_plan",
  "learning_plan",
  "implementation_plan",
  "general_action_plan"
]);
export const actionPrioritySchema = z.enum(["low", "medium", "high"]);
export const actionStatusSchema = z.enum(["todo", "done"]);

export const matrixOptionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  notes: z.string().optional(),
  aiGenerated: z.boolean().optional()
});

export const criterionSchema = z.object({
  id: z.string().min(1),
  category: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  weight: z.number().int().min(1).max(5),
  isMustHave: z.boolean().optional(),
  aiGenerated: z.boolean().optional()
});

export const scoreSchema = z.object({
  optionId: z.string().min(1),
  criterionId: z.string().min(1),
  value: z.number().int().min(0).max(5),
  note: z.string().optional(),
  aiGenerated: z.boolean().optional(),
  confidence: scoreConfidenceSchema.optional()
});

export const actionChecklistItemSchema = z.object({
  id: z.string().min(1),
  phase: z.string().min(1),
  task: z.string().min(1),
  reason: z.string().min(1),
  priority: actionPrioritySchema,
  status: actionStatusSchema
});

export const actionChecklistSchema = z.object({
  id: z.string().min(1),
  type: actionChecklistTypeSchema,
  title: z.string().min(1),
  summary: z.string().min(1),
  generatedForOptionId: z.string().optional(),
  generatedForOptionName: z.string().optional(),
  items: z.array(actionChecklistItemSchema),
  validationChecks: z.array(z.string()),
  risksToWatch: z.array(z.string()),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  aiGenerated: z.boolean()
});

export const decisionMatrixSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: z.string().min(1),
  goal: z.string(),
  constraints: z.string().optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  options: z.array(matrixOptionSchema),
  criteria: z.array(criterionSchema),
  scores: z.array(scoreSchema),
  aiSummary: z.string().optional(),
  actionChecklist: actionChecklistSchema.optional()
});

export const criteriaSuggestionSchema = z.object({
  criteria: z.array(
    z.object({
      category: z.string().min(1),
      name: z.string().min(1),
      description: z.string().optional(),
      weight: z.number().int().min(1).max(5),
      isMustHave: z.boolean().optional()
    })
  )
});

export const optionSuggestionSchema = z.object({
  options: z.array(
    z.object({
      name: z.string().min(1),
      description: z.string().optional()
    })
  )
});

export const scoreSuggestionSchema = z.object({
  scores: z.array(
    z.object({
      optionName: z.string().min(1),
      criterionName: z.string().min(1),
      value: z.number().int().min(0).max(5),
      note: z.string().optional(),
      confidence: scoreConfidenceSchema.optional()
    })
  )
});

export const matrixReviewSchema = z.object({
  strengths: z.array(z.string()),
  issues: z.array(z.string()),
  suggestions: z.array(z.string())
});

export const recommendationSchema = z.object({
  summary: z.string().min(1),
  winner: z.string(),
  whyWinner: z.array(z.string()),
  tradeoffs: z.array(z.string()),
  risks: z.array(z.string()),
  nextSteps: z.array(z.string())
});

export const actionChecklistSuggestionSchema = z.object({
  checklistType: actionChecklistTypeSchema,
  title: z.string().min(1),
  summary: z.string().min(1),
  actions: z
    .array(
      z.object({
        phase: z.string().min(1),
        task: z.string().min(1),
        reason: z.string().min(1),
        priority: actionPrioritySchema
      })
    )
    .min(3)
    .max(12),
  validationChecks: z.array(z.string()).max(8),
  risksToWatch: z.array(z.string()).max(8)
});

export const aiResponseDataSchemas = {
  generateCriteria: criteriaSuggestionSchema,
  suggestOptions: optionSuggestionSchema,
  suggestScores: scoreSuggestionSchema,
  reviewMatrix: matrixReviewSchema,
  generateRecommendation: recommendationSchema,
  generateActionChecklist: actionChecklistSuggestionSchema
};

export type DecisionMatrixInput = z.infer<typeof decisionMatrixSchema>;
