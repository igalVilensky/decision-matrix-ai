import type {
  AiAction,
  CriteriaSuggestion,
  DecisionMatrix,
  MatrixReview,
  MatrixResults,
  OptionSuggestion,
  Recommendation,
  ScoreSuggestion
} from "../types/matrix";
import {
  criteriaSuggestionSchema,
  matrixReviewSchema,
  optionSuggestionSchema,
  recommendationSchema,
  scoreSuggestionSchema
} from "../schemas/matrixSchemas";
import type { z } from "zod";

type AiSuccessResponse<T> = {
  success: true;
  action: AiAction;
  data: T;
};

type AiErrorResponse = {
  success: false;
  error: string;
};

type AiResponse<T> = AiSuccessResponse<T> | AiErrorResponse;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getErrorMessage = (payload: unknown, fallback: string): string => {
  if (!isRecord(payload)) return fallback;
  return typeof payload.error === "string" ? payload.error : fallback;
};

const callAi = async <T>(
  action: AiAction,
  matrix: DecisionMatrix,
  schema: z.ZodType<T>,
  extraInstructions?: string,
  ranking?: MatrixResults
): Promise<T> => {
  const response = await fetch("/.netlify/functions/groqChat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action,
      matrix,
      extraInstructions,
      ranking
    })
  });

  let payload: unknown;

  try {
    payload = (await response.json()) as unknown;
  } catch {
    throw new Error("The AI service returned an invalid response.");
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "The AI request failed."));
  }

  if (!isRecord(payload)) {
    throw new Error("The AI service returned an invalid response.");
  }

  if (payload.success === false) {
    throw new Error(getErrorMessage(payload, "The AI request failed."));
  }

  if (payload.success !== true) {
    throw new Error("The AI service returned an invalid response.");
  }

  if (!("data" in payload)) {
    throw new Error("The AI service returned no usable data.");
  }

  const parsedData = schema.safeParse(payload.data);

  if (!parsedData.success) {
    throw new Error("The AI service returned data in an unexpected format.");
  }

  return parsedData.data;
};

export const generateCriteria = (
  matrix: DecisionMatrix,
  extraInstructions?: string
): Promise<CriteriaSuggestion> =>
  callAi("generateCriteria", matrix, criteriaSuggestionSchema, extraInstructions);

export const suggestOptions = (
  matrix: DecisionMatrix,
  extraInstructions?: string
): Promise<OptionSuggestion> =>
  callAi("suggestOptions", matrix, optionSuggestionSchema, extraInstructions);

export const suggestScores = (
  matrix: DecisionMatrix,
  extraInstructions?: string
): Promise<ScoreSuggestion> =>
  callAi("suggestScores", matrix, scoreSuggestionSchema, extraInstructions);

export const reviewMatrix = (
  matrix: DecisionMatrix,
  extraInstructions?: string
): Promise<MatrixReview> =>
  callAi("reviewMatrix", matrix, matrixReviewSchema, extraInstructions);

export const generateRecommendation = (
  matrix: DecisionMatrix,
  ranking: MatrixResults,
  extraInstructions?: string
): Promise<Recommendation> =>
  callAi("generateRecommendation", matrix, recommendationSchema, extraInstructions, ranking);
