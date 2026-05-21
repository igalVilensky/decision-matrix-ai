import type { DecisionMatrix } from "../../types/matrix";
import {
  calculateDecisionInsights,
  type ConfidenceLevel,
  type StabilityLevel
} from "../../services/decisionInsights";
import { calculateMatrixResults } from "../../services/scoring";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { RankingList } from "./RankingList";
import { WinnerCard } from "./WinnerCard";

type ResultsDashboardProps = {
  matrix: DecisionMatrix;
};

type BadgeTone = "default" | "green" | "amber" | "red" | "blue";

const stabilityLabel: Record<StabilityLevel, string> = {
  stable: "Stable decision",
  moderate: "Moderately stable decision",
  sensitive: "Sensitive decision",
  unknown: "Stability not available"
};

const stabilityTone: Record<StabilityLevel, BadgeTone> = {
  stable: "green",
  moderate: "amber",
  sensitive: "red",
  unknown: "default"
};

const confidenceTone: Record<ConfidenceLevel, BadgeTone> = {
  high: "green",
  medium: "amber",
  low: "red"
};

const formatPercentagePoints = (value: number): string => `${value.toFixed(1)} pp`;

export const ResultsDashboard = ({ matrix }: ResultsDashboardProps) => {
  const results = calculateMatrixResults(matrix);
  const winner = results.winner;
  const insights = calculateDecisionInsights(matrix, results);
  const risksWithFailures = insights.mustHaveRisks.filter((risk) => risk.failureCount > 0);

  if (matrix.options.length === 0 || matrix.criteria.length === 0) {
    return (
      <EmptyState
        title="Results need a decision structure"
        description="Add options and criteria to turn your decision into an explainable ranking."
      />
    );
  }

  return (
    <div className="space-y-5">
      <WinnerCard
        winner={winner}
        saferOptionName={insights.saferHighRankingOption?.option.name}
      />

      <Card className="p-5">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-ink-900">Decision insights</h3>
          <p className="mt-1 text-sm leading-6 text-ink-500">
            Use these signals to judge whether the top score is decisive, risky, or worth a closer
            review.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-ink-100 bg-ink-50 p-4">
            <Badge tone={stabilityTone[insights.winnerMargin.stabilityLevel]}>
              {stabilityLabel[insights.winnerMargin.stabilityLevel]}
            </Badge>
            {insights.winnerMargin.runnerUp ? (
              <>
                <div className="mt-3 text-2xl font-bold text-ink-900">
                  {formatPercentagePoints(insights.winnerMargin.percentagePointDifference)}
                </div>
                <p className="mt-1 text-sm leading-6 text-ink-600">
                  {insights.winnerMargin.winner?.option.name} leads{" "}
                  {insights.winnerMargin.runnerUp.option.name} by{" "}
                  {insights.winnerMargin.pointDifference} weighted points.
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm leading-6 text-ink-600">
                Add at least two options to see whether the top result is stable.
              </p>
            )}
            <p className="mt-3 text-sm leading-6 text-ink-500">
              {insights.winnerMargin.stabilityLevel === "sensitive"
                ? "Small score or weight changes may change the winner."
                : insights.winnerMargin.stabilityLevel === "moderate"
                  ? "The lead is meaningful, but still worth reviewing key assumptions."
                  : insights.winnerMargin.stabilityLevel === "stable"
                    ? "The top option has a strong lead over the runner-up."
                    : "Stability needs a runner-up for comparison."}
            </p>
          </div>

          <div className="rounded-lg border border-ink-100 bg-ink-50 p-4">
            <Badge tone={confidenceTone[insights.confidence.level]}>
              Confidence: {insights.confidence.level.charAt(0).toUpperCase()}
              {insights.confidence.level.slice(1)}
            </Badge>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-white p-3">
                <div className="font-bold text-ink-900">
                  {insights.confidence.filledScorePercentage}%
                </div>
                <div className="text-xs text-ink-500">Scores filled</div>
              </div>
              <div className="rounded-lg bg-white p-3">
                <div className="font-bold text-ink-900">
                  {insights.confidence.aiGeneratedScorePercentage}%
                </div>
                <div className="text-xs text-ink-500">AI-generated</div>
              </div>
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-ink-600">
              {insights.confidence.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-ink-100 bg-ink-50 p-4">
            <Badge tone={insights.topScoringOptionFailsMustHave ? "red" : "green"}>
              {insights.topScoringOptionFailsMustHave
                ? "Highest score, but fails must-have"
                : "Must-have risks"}
            </Badge>
            {risksWithFailures.length > 0 ? (
              <div className="mt-3 space-y-2">
                {risksWithFailures.map((risk) => (
                  <div key={risk.optionId} className="rounded-lg bg-white p-3 text-sm">
                    <div className="font-bold text-ink-900">
                      {risk.optionName}: {risk.failureCount} gap
                      {risk.failureCount === 1 ? "" : "s"}
                    </div>
                    <p className="mt-1 leading-5 text-ink-500">
                      {risk.failedCriteria.map((failure) => failure.criterionName).join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-ink-600">
                No options currently fail must-have criteria.
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-brand-100 bg-brand-50 p-4">
            <h4 className="font-bold text-brand-700">Key drivers</h4>
            {insights.keyDrivers.length > 0 ? (
              <div className="mt-3 space-y-2">
                {insights.keyDrivers.map((driver) => (
                  <div key={driver.criterionId} className="rounded-lg bg-white px-3 py-2 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-ink-800">{driver.criterionName}</span>
                      <Badge>{driver.weightedScore} points</Badge>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-ink-500">
                      Score {driver.score} x weight {driver.weight} in {driver.category}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-ink-600">
                Key drivers appear once the winner has positive scores.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-coral-50 bg-coral-50 p-4">
            <h4 className="font-bold text-coral-600">Weak spots</h4>
            {insights.weakSpots.length > 0 ? (
              <div className="mt-3 space-y-2">
                {insights.weakSpots.map((weakSpot) => (
                  <div key={weakSpot.criterionId} className="rounded-lg bg-white px-3 py-2 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-ink-800">{weakSpot.criterionName}</span>
                      <Badge tone="red">Score {weakSpot.score}</Badge>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-ink-500">
                      High-weight criterion with weight {weakSpot.weight}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-ink-600">
                No high-weight weak spots are visible for the top-scoring option.
              </p>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <RankingList rankings={results.rankings} />
        <Card className="p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-ink-900">Explainability</h3>
              <p className="mt-1 text-sm text-ink-500">Important signals behind the top result.</p>
            </div>
            {winner ? <Badge tone="green">{winner.option.name}</Badge> : null}
          </div>
          {winner ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-brand-50 p-4">
                <h4 className="font-bold text-brand-700">Strengths</h4>
                {winner.strengths.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm text-ink-700">
                    {winner.strengths.map((strength) => (
                      <li key={strength}>{strength}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-ink-500">
                    Strongest criteria will appear here as scores improve.
                  </p>
                )}
              </div>
              <div className="rounded-lg bg-coral-50 p-4">
                <h4 className="font-bold text-coral-600">Weaknesses</h4>
                {winner.weaknesses.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm text-ink-700">
                    {winner.weaknesses.map((weakness) => (
                      <li key={weakness}>{weakness}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-ink-500">
                    No high-weight weak spots are visible for the current winner.
                  </p>
                )}
              </div>
            </div>
          ) : null}
          <div className="mt-4 rounded-lg border border-ink-100 bg-ink-50 p-4">
            <h4 className="font-bold text-ink-900">Must-have failures</h4>
            {results.mustHaveFailures.length > 0 ? (
              <div className="mt-3 space-y-2">
                {results.mustHaveFailures.map((failure) => (
                  <div
                    key={`${failure.optionId}-${failure.criterionId}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm"
                  >
                    <span className="font-semibold text-ink-700">
                      {failure.optionName}: {failure.criterionName}
                    </span>
                    <Badge tone="red">Score {failure.score}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-ink-500">
                No must-have criteria are currently failing.
              </p>
            )}
          </div>
        </Card>
      </div>
      <CategoryBreakdown rankings={results.rankings} />
      {matrix.aiSummary ? (
        <Card className="p-5" tone="accent">
          <div className="mb-2 flex items-center gap-2">
            <Badge tone="blue">AI recommendation</Badge>
          </div>
          <p className="text-sm leading-7 text-ink-700">{matrix.aiSummary}</p>
        </Card>
      ) : null}
    </div>
  );
};
