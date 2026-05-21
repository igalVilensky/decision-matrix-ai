import type {
  CategoryScore,
  DecisionMatrix,
  MatrixResults,
  MustHaveFailure,
  OptionResult,
  Score
} from "../types/matrix";

export const SCORE_LABELS: Record<number, string> = {
  0: "Does not meet",
  1: "Poor",
  2: "Weak",
  3: "Acceptable",
  4: "Strong",
  5: "Excellent"
};

export const WEIGHT_LABELS: Record<number, string> = {
  1: "Low importance",
  2: "Useful",
  3: "Important",
  4: "Very important",
  5: "Critical"
};

export const clampScore = (value: number): number =>
  Math.min(5, Math.max(0, Math.round(value)));

export const clampWeight = (value: number): number =>
  Math.min(5, Math.max(1, Math.round(value)));

export const getScore = (
  scores: Score[],
  optionId: string,
  criterionId: string
): Score | undefined =>
  scores.find((score) => score.optionId === optionId && score.criterionId === criterionId);

export const calculateMatrixResults = (matrix: DecisionMatrix): MatrixResults => {
  const maxPossibleScore = matrix.criteria.reduce(
    (total, criterion) => total + clampWeight(criterion.weight) * 5,
    0
  );
  const categoryNames = Array.from(
    new Set(matrix.criteria.map((criterion) => criterion.category || "General"))
  );

  const results: OptionResult[] = matrix.options.map((option) => {
    let totalScore = 0;
    const mustHaveFailures: MustHaveFailure[] = [];
    const scoredCriteria = matrix.criteria.map((criterion) => {
      const score = getScore(matrix.scores, option.id, criterion.id);
      const value = clampScore(score?.value ?? 0);
      const weightedScore = clampWeight(criterion.weight) * value;
      totalScore += weightedScore;

      if (criterion.isMustHave && value < 3) {
        mustHaveFailures.push({
          criterionId: criterion.id,
          criterionName: criterion.name,
          optionId: option.id,
          optionName: option.name,
          score: value
        });
      }

      return {
        criterion,
        value,
        weightedScore
      };
    });

    const categoryScores: CategoryScore[] = categoryNames.map((category) => {
      const criteriaInCategory = scoredCriteria.filter(
        (entry) => (entry.criterion.category || "General") === category
      );
      const score = criteriaInCategory.reduce((sum, entry) => sum + entry.weightedScore, 0);
      const maxScore = criteriaInCategory.reduce(
        (sum, entry) => sum + clampWeight(entry.criterion.weight) * 5,
        0
      );

      return {
        category,
        score,
        maxScore,
        percentage: maxScore === 0 ? 0 : (score / maxScore) * 100
      };
    });

    const strengths = scoredCriteria
      .filter((entry) => entry.value >= 4 && entry.criterion.weight >= 3)
      .sort((a, b) => b.weightedScore - a.weightedScore)
      .slice(0, 3)
      .map((entry) => entry.criterion.name);

    const weaknesses = scoredCriteria
      .filter((entry) => entry.value <= 2 && entry.criterion.weight >= 3)
      .sort((a, b) => b.criterion.weight - a.criterion.weight)
      .slice(0, 3)
      .map((entry) => entry.criterion.name);

    return {
      option,
      totalScore,
      maxPossibleScore,
      percentageFit: maxPossibleScore === 0 ? 0 : (totalScore / maxPossibleScore) * 100,
      rank: 0,
      categoryScores,
      mustHaveFailures,
      strengths,
      weaknesses
    };
  });

  const rankings = results
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((result, index) => ({ ...result, rank: index + 1 }));

  return {
    rankings,
    winner: rankings[0],
    maxPossibleScore,
    categoryNames,
    mustHaveFailures: rankings.flatMap((result) => result.mustHaveFailures)
  };
};
