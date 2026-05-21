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

const callAi = async <T>(
  action: AiAction,
  matrix: DecisionMatrix,
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

  const payload = (await response.json()) as AiResponse<T>;

  if (!response.ok || !payload.success) {
    const error = payload.success ? "The AI request failed." : payload.error;
    throw new Error(error);
  }

  return payload.data;
};

export const generateCriteria = (
  matrix: DecisionMatrix,
  extraInstructions?: string
): Promise<CriteriaSuggestion> => callAi("generateCriteria", matrix, extraInstructions);

export const suggestOptions = (
  matrix: DecisionMatrix,
  extraInstructions?: string
): Promise<OptionSuggestion> => callAi("suggestOptions", matrix, extraInstructions);

export const suggestScores = (
  matrix: DecisionMatrix,
  extraInstructions?: string
): Promise<ScoreSuggestion> => callAi("suggestScores", matrix, extraInstructions);

export const reviewMatrix = (
  matrix: DecisionMatrix,
  extraInstructions?: string
): Promise<MatrixReview> => callAi("reviewMatrix", matrix, extraInstructions);

export const generateRecommendation = (
  matrix: DecisionMatrix,
  ranking: MatrixResults,
  extraInstructions?: string
): Promise<Recommendation> =>
  callAi("generateRecommendation", matrix, extraInstructions, ranking);
