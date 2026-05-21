import type { DecisionMatrix, Score } from "../../types/matrix";
import { SCORE_LABELS, clampScore, getScore } from "../../services/scoring";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";

type ScoringTableProps = {
  matrix: DecisionMatrix;
  onChange: (matrix: DecisionMatrix) => void;
};

const scoreValues = [0, 1, 2, 3, 4, 5];

export const ScoringTable = ({ matrix, onChange }: ScoringTableProps) => {
  const upsertScore = (
    optionId: string,
    criterionId: string,
    updates: Partial<Score>
  ) => {
    const existing = getScore(matrix.scores, optionId, criterionId);
    const nextScore: Score = {
      optionId,
      criterionId,
      value: clampScore(updates.value ?? existing?.value ?? 0),
      note: updates.note ?? existing?.note,
      aiGenerated: updates.aiGenerated ?? existing?.aiGenerated,
      confidence: updates.confidence ?? existing?.confidence
    };

    onChange({
      ...matrix,
      scores: existing
        ? matrix.scores.map((score) =>
            score.optionId === optionId && score.criterionId === criterionId
              ? nextScore
              : score
          )
        : [...matrix.scores, nextScore]
    });
  };

  if (matrix.options.length === 0 || matrix.criteria.length === 0) {
    return (
      <EmptyState
        title="Add options and criteria first"
        description="Scoring unlocks once there is at least one option and one criterion. You can score manually or ask AI to draft suggestions for review."
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-ink-100 px-5 py-4">
        <h3 className="text-lg font-bold text-ink-900">Weighted scoring</h3>
        <p className="mt-1 text-sm text-ink-500">
          Score every option from 0 to 5. Weights are applied automatically in the results.
        </p>
      </div>
      <div className="overflow-x-auto matrix-scrollbar">
        <table className="min-w-[900px] w-full border-collapse">
          <thead className="bg-ink-50 text-left text-xs uppercase tracking-wider text-ink-500">
            <tr>
              <th className="sticky left-0 z-10 w-72 bg-ink-50 px-4 py-3">Criterion</th>
              {matrix.options.map((option) => (
                <th key={option.id} className="min-w-56 px-4 py-3">
                  {option.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {matrix.criteria.map((criterion) => (
              <tr key={criterion.id} className="align-top">
                <td className="sticky left-0 z-10 bg-white px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-ink-900">{criterion.name}</span>
                    <Badge>{criterion.weight}x</Badge>
                    {criterion.isMustHave ? <Badge tone="amber">Must-have</Badge> : null}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-ink-500">
                    {criterion.category}
                    {criterion.description ? ` - ${criterion.description}` : ""}
                  </p>
                </td>
                {matrix.options.map((option) => {
                  const score = getScore(matrix.scores, option.id, criterion.id);
                  return (
                    <td key={option.id} className="px-4 py-4">
                      <div className="space-y-2">
                        <label className="block">
                          <span className="sr-only">Score for {option.name}</span>
                          <select
                            className="min-h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm font-semibold text-ink-900"
                            value={score?.value ?? 0}
                            onChange={(event) =>
                              upsertScore(option.id, criterion.id, {
                                value: Number(event.target.value),
                                aiGenerated: false
                              })
                            }
                          >
                            {scoreValues.map((value) => (
                              <option key={value} value={value}>
                                {value} = {SCORE_LABELS[value]}
                              </option>
                            ))}
                          </select>
                        </label>
                        <input
                          className="min-h-9 w-full rounded-lg border border-ink-200 bg-white px-3 text-xs text-ink-700 placeholder:text-ink-400"
                          value={score?.note ?? ""}
                          placeholder="Optional note"
                          onChange={(event) =>
                            upsertScore(option.id, criterion.id, {
                              note: event.target.value,
                              value: score?.value ?? 0,
                              aiGenerated: false
                            })
                          }
                        />
                        <div className="flex min-h-6 flex-wrap gap-1">
                          {score?.aiGenerated ? <Badge tone="blue">AI draft</Badge> : null}
                          {score?.confidence ? <Badge>{score.confidence} confidence</Badge> : null}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
