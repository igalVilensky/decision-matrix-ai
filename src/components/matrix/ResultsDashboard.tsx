import type { DecisionMatrix } from "../../types/matrix";
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

export const ResultsDashboard = ({ matrix }: ResultsDashboardProps) => {
  const results = calculateMatrixResults(matrix);
  const winner = results.winner;

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
      <WinnerCard winner={winner} />
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
