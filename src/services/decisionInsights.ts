import type {
  Criterion,
  DecisionMatrix,
  MatrixResults,
  MustHaveFailure,
  OptionResult,
  Score
} from "../types/matrix";
import { clampScore, clampWeight, getScore } from "./scoring";

export type StabilityLevel = "stable" | "moderate" | "sensitive" | "unknown";
export type ConfidenceLevel = "high" | "medium" | "low";

export type WinnerMarginInsight = {
  winner?: OptionResult;
  runnerUp?: OptionResult;
  pointDifference: number;
  percentagePointDifference: number;
  stabilityLevel: StabilityLevel;
};

export type OptionMustHaveRisk = {
  optionId: string;
  optionName: string;
  failureCount: number;
  failedCriteria: MustHaveFailure[];
};

export type ConfidenceInsight = {
  level: ConfidenceLevel;
  reasons: string[];
  filledScorePercentage: number;
  lowConfidenceScorePercentage: number;
  aiGeneratedScorePercentage: number;
  highWeightNotePercentage: number;
};

export type CriterionContribution = {
  criterionId: string;
  criterionName: string;
  category: string;
  score: number;
  weight: number;
  weightedScore: number;
  note?: string;
};

export type DecisionInsights = {
  winnerMargin: WinnerMarginInsight;
  confidence: ConfidenceInsight;
  mustHaveRisks: OptionMustHaveRisk[];
  topScoringOptionFailsMustHave: boolean;
  saferHighRankingOption?: OptionResult;
  keyDrivers: CriterionContribution[];
  weakSpots: CriterionContribution[];
};

const percentage = (value: number): number => Math.round(value * 100);

const getStabilityLevel = (percentagePointDifference: number, optionCount: number): StabilityLevel => {
  if (optionCount < 2) return "unknown";
  if (percentagePointDifference >= 15) return "stable";
  if (percentagePointDifference >= 5) return "moderate";
  return "sensitive";
};

const hasText = (value: string | undefined): boolean => Boolean(value?.trim());

const getValidScores = (matrix: DecisionMatrix): Score[] => {
  const optionIds = new Set(matrix.options.map((option) => option.id));
  const criterionIds = new Set(matrix.criteria.map((criterion) => criterion.id));

  return matrix.scores.filter(
    (score) => optionIds.has(score.optionId) && criterionIds.has(score.criterionId)
  );
};

const getCriterionContribution = (
  criterion: Criterion,
  score: Score | undefined
): CriterionContribution => {
  const scoreValue = clampScore(score?.value ?? 0);
  const weight = clampWeight(criterion.weight);

  return {
    criterionId: criterion.id,
    criterionName: criterion.name,
    category: criterion.category || "General",
    score: scoreValue,
    weight,
    weightedScore: scoreValue * weight,
    note: score?.note
  };
};

const calculateConfidence = (matrix: DecisionMatrix): ConfidenceInsight => {
  const totalScoreSlots = matrix.options.length * matrix.criteria.length;
  const validScores = getValidScores(matrix);
  const filledScoreRate = totalScoreSlots === 0 ? 0 : validScores.length / totalScoreSlots;
  const lowConfidenceRate =
    validScores.length === 0
      ? 0
      : validScores.filter((score) => score.confidence === "low").length / validScores.length;
  const aiGeneratedRate =
    validScores.length === 0
      ? 0
      : validScores.filter((score) => score.aiGenerated).length / validScores.length;
  const highWeightCriteria = matrix.criteria.filter((criterion) => clampWeight(criterion.weight) >= 4);
  const highWeightCriterionIds = new Set(highWeightCriteria.map((criterion) => criterion.id));
  const highWeightScores = validScores.filter((score) =>
    highWeightCriterionIds.has(score.criterionId)
  );
  const highWeightNoteRate =
    highWeightScores.length === 0
      ? 0
      : highWeightScores.filter((score) => hasText(score.note)).length / highWeightScores.length;
  const reasons: string[] = [];
  let downgrades = 0;

  if (filledScoreRate < 0.5) {
    downgrades += 2;
    reasons.push("Many option and criterion pairs have not been scored yet.");
  } else if (filledScoreRate < 0.85) {
    downgrades += 1;
    reasons.push("Some scores are still missing.");
  }

  if (lowConfidenceRate > 0.4) {
    downgrades += 2;
    reasons.push("Many filled scores are marked low confidence.");
  } else if (lowConfidenceRate > 0.2) {
    downgrades += 1;
    reasons.push("Several filled scores are marked low confidence.");
  }

  if (aiGeneratedRate > 0.75) {
    downgrades += 1;
    reasons.push("Most filled scores are AI-generated, so they may need human review.");
  }

  if (highWeightScores.length > 0 && highWeightNoteRate < 0.5) {
    downgrades += 1;
    reasons.push("High-weight criteria have limited score notes or evidence.");
  }

  if (reasons.length === 0) {
    reasons.push("Most scores are filled, confidence markers look healthy, and key scores have supporting notes.");
  }

  return {
    level: downgrades >= 3 ? "low" : downgrades >= 1 ? "medium" : "high",
    reasons,
    filledScorePercentage: percentage(filledScoreRate),
    lowConfidenceScorePercentage: percentage(lowConfidenceRate),
    aiGeneratedScorePercentage: percentage(aiGeneratedRate),
    highWeightNotePercentage: percentage(highWeightNoteRate)
  };
};

export const calculateDecisionInsights = (
  matrix: DecisionMatrix,
  results: MatrixResults
): DecisionInsights => {
  const winner = results.winner;
  const runnerUp = results.rankings[1];
  const pointDifference = winner && runnerUp ? winner.totalScore - runnerUp.totalScore : 0;
  const percentagePointDifference =
    winner && runnerUp ? winner.percentageFit - runnerUp.percentageFit : 0;
  const topScoringOptionFailsMustHave = Boolean(winner?.mustHaveFailures.length);
  const saferHighRankingOption = topScoringOptionFailsMustHave
    ? results.rankings.find((result) => result.mustHaveFailures.length === 0)
    : undefined;
  const winnerScoreByCriterion = winner
    ? matrix.criteria.map((criterion) =>
        getCriterionContribution(criterion, getScore(matrix.scores, winner.option.id, criterion.id))
      )
    : [];

  return {
    winnerMargin: {
      winner,
      runnerUp,
      pointDifference,
      percentagePointDifference,
      stabilityLevel: getStabilityLevel(percentagePointDifference, results.rankings.length)
    },
    confidence: calculateConfidence(matrix),
    mustHaveRisks: results.rankings.map((result) => ({
      optionId: result.option.id,
      optionName: result.option.name,
      failureCount: result.mustHaveFailures.length,
      failedCriteria: result.mustHaveFailures
    })),
    topScoringOptionFailsMustHave,
    saferHighRankingOption,
    keyDrivers: [...winnerScoreByCriterion]
      .filter((contribution) => contribution.weightedScore > 0)
      .sort((a, b) => b.weightedScore - a.weightedScore)
      .slice(0, 3),
    weakSpots: winnerScoreByCriterion
      .filter((contribution) => contribution.score <= 2 && contribution.weight >= 3)
      .sort((a, b) => b.weight - a.weight || a.score - b.score)
      .slice(0, 3)
  };
};
