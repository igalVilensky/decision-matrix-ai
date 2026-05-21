import type { AiAction, DecisionMatrix } from "../types/matrix";

export type AiActionReadiness = {
  isReady: boolean;
  reason?: string;
};

const genericTitles = new Set([
  "untitled decision",
  "new decision",
  "new decision matrix",
  "decision matrix"
]);

const genericCategories = new Set(["general", ""]);
const genericOptionNames = new Set(["new option", "option"]);
const genericCriterionNames = new Set(["new criterion", "criterion"]);

const normalize = (value: string | undefined): string => value?.trim().toLowerCase() ?? "";

const hasMeaningfulText = (
  value: string | undefined,
  genericValues: Set<string> = new Set()
): boolean => {
  const normalized = normalize(value);
  return normalized.length >= 3 && !genericValues.has(normalized);
};

export const hasDecisionContext = (matrix: DecisionMatrix): boolean =>
  hasMeaningfulText(matrix.title, genericTitles) ||
  hasMeaningfulText(matrix.goal) ||
  hasMeaningfulText(matrix.constraints) ||
  hasMeaningfulText(matrix.category, genericCategories);

export const countReadyOptions = (matrix: DecisionMatrix): number =>
  matrix.options.filter((option) => hasMeaningfulText(option.name, genericOptionNames)).length;

export const countReadyCriteria = (matrix: DecisionMatrix): number =>
  matrix.criteria.filter((criterion) =>
    hasMeaningfulText(criterion.name, genericCriterionNames)
  ).length;

export const hasAnyUsableScore = (matrix: DecisionMatrix): boolean => {
  const optionIds = new Set(matrix.options.map((option) => option.id));
  const criterionIds = new Set(matrix.criteria.map((criterion) => criterion.id));

  return matrix.scores.some(
    (score) => optionIds.has(score.optionId) && criterionIds.has(score.criterionId)
  );
};

export const getAiActionReadiness = (
  action: AiAction,
  matrix: DecisionMatrix
): AiActionReadiness => {
  const readyOptionCount = countReadyOptions(matrix);
  const readyCriterionCount = countReadyCriteria(matrix);

  if (action === "suggestOptions" || action === "generateCriteria") {
    return hasDecisionContext(matrix)
      ? { isReady: true }
      : {
          isReady: false,
          reason: "Add a decision description first so AI knows what you are comparing."
        };
  }

  if (action === "suggestScores") {
    return readyOptionCount >= 2 && readyCriterionCount >= 3
      ? { isReady: true }
      : {
          isReady: false,
          reason: "Add at least 2 options and 3 criteria before asking AI to score."
        };
  }

  if (action === "generateRecommendation") {
    if (readyOptionCount < 2 || readyCriterionCount < 3) {
      return {
        isReady: false,
        reason: "Add at least 2 options and 3 criteria before asking AI for a recommendation."
      };
    }

    return hasAnyUsableScore(matrix)
      ? { isReady: true }
      : {
          isReady: false,
          reason: "Add or suggest some scores before asking AI for a recommendation."
        };
  }

  if (action === "generateActionChecklist") {
    return readyOptionCount >= 2 && readyCriterionCount >= 3 && hasAnyUsableScore(matrix)
      ? { isReady: true }
      : {
          isReady: false,
          reason:
            "Add at least 2 options, 3 criteria, and some scores before generating an action checklist."
        };
  }

  if (action === "reviewMatrix") {
    return readyOptionCount >= 1 || readyCriterionCount >= 1
      ? { isReady: true }
      : {
          isReady: false,
          reason: "Add at least one option or criterion before asking AI to review the matrix."
        };
  }

  return { isReady: true };
};
