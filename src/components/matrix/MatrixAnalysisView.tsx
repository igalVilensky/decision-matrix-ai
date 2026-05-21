import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, CheckCircle2, SlidersHorizontal, Table2 } from "lucide-react";
import { inspectCriteriaQuality } from "../../services/criteriaQuality";
import { calculateMatrixResults, clampWeight, getScore } from "../../services/scoring";
import type { Criterion, DecisionMatrix } from "../../types/matrix";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";

type MatrixAnalysisViewProps = {
  matrix: DecisionMatrix;
};

type TableMode = "raw" | "weighted";

const tableModes: Array<{ id: TableMode; label: string }> = [
  { id: "raw", label: "Raw scores" },
  { id: "weighted", label: "Weighted scores" }
];

const missingScoreLabel = "—";

const getCriterionLabel = (criterion: Criterion): string =>
  criterion.category ? `${criterion.category} / ${criterion.name}` : criterion.name;

export const MatrixAnalysisView = ({ matrix }: MatrixAnalysisViewProps) => {
  const [tableMode, setTableMode] = useState<TableMode>("raw");
  const [selectedCriterionId, setSelectedCriterionId] = useState<string>(
    matrix.criteria[0]?.id ?? ""
  );
  const selectedCriterion =
    matrix.criteria.find((criterion) => criterion.id === selectedCriterionId) ?? matrix.criteria[0];
  const [temporaryWeight, setTemporaryWeight] = useState(() =>
    clampWeight(selectedCriterion?.weight ?? 3)
  );
  const results = useMemo(() => calculateMatrixResults(matrix), [matrix]);
  const qualityWarnings = useMemo(
    () => inspectCriteriaQuality(matrix.criteria),
    [matrix.criteria]
  );
  const whatIfMatrix = useMemo<DecisionMatrix>(
    () =>
      selectedCriterion
        ? {
            ...matrix,
            criteria: matrix.criteria.map((criterion) =>
              criterion.id === selectedCriterion.id
                ? { ...criterion, weight: temporaryWeight }
                : criterion
            )
          }
        : matrix,
    [matrix, selectedCriterion, temporaryWeight]
  );
  const whatIfResults = useMemo(() => calculateMatrixResults(whatIfMatrix), [whatIfMatrix]);
  const currentWinner = results.winner?.option.name;
  const whatIfWinner = whatIfResults.winner?.option.name;
  const winnerChanged = Boolean(currentWinner && whatIfWinner && currentWinner !== whatIfWinner);

  useEffect(() => {
    if (!selectedCriterion) return;
    setTemporaryWeight(clampWeight(selectedCriterion.weight));
  }, [selectedCriterion?.id, selectedCriterion?.weight]);

  if (matrix.options.length === 0 || matrix.criteria.length === 0) {
    return (
      <EmptyState
        title="Matrix view needs options and criteria"
        description="Add the choices and criteria first, then use this view to inspect raw and weighted scores."
      />
    );
  }

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Table2 className="h-5 w-5 text-brand-600" />
              <h3 className="text-lg font-bold text-ink-900">Score matrix</h3>
            </div>
            <p className="mt-1 text-sm leading-6 text-ink-500">
              Inspect the underlying decision table. Raw scores show judgment from 0 to 5;
              weighted scores multiply each score by the criterion weight.
            </p>
          </div>
          <div className="inline-flex rounded-lg border border-ink-200 bg-white p-1">
            {tableModes.map((mode) => (
              <button
                key={mode.id}
                className={`rounded-md px-3 py-2 text-sm font-bold transition ${
                  tableMode === mode.id
                    ? "bg-ink-900 text-white"
                    : "text-ink-600 hover:bg-ink-100"
                }`}
                onClick={() => setTableMode(mode.id)}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto matrix-scrollbar">
          <table className="min-w-[900px] w-full border-collapse">
            <thead className="bg-ink-50 text-left text-xs uppercase tracking-wider text-ink-500">
              <tr>
                <th className="sticky left-0 z-10 w-72 bg-ink-50 px-4 py-3">Criterion</th>
                <th className="w-40 px-4 py-3">Category</th>
                <th className="w-24 px-4 py-3">Weight</th>
                {matrix.options.map((option) => (
                  <th key={option.id} className="min-w-40 px-4 py-3">
                    {option.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {matrix.criteria.map((criterion) => (
                <tr key={criterion.id}>
                  <td className="sticky left-0 z-10 bg-white px-4 py-4 font-bold text-ink-900">
                    {criterion.name}
                  </td>
                  <td className="px-4 py-4 text-sm text-ink-600">
                    {criterion.category || "General"}
                  </td>
                  <td className="px-4 py-4">
                    <Badge>{clampWeight(criterion.weight)}x</Badge>
                  </td>
                  {matrix.options.map((option) => {
                    const score = getScore(matrix.scores, option.id, criterion.id);
                    const displayValue = score
                      ? tableMode === "weighted"
                        ? score.value * clampWeight(criterion.weight)
                        : score.value
                      : missingScoreLabel;

                    return (
                      <td key={option.id} className="px-4 py-4 text-sm font-semibold text-ink-800">
                        {displayValue}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {tableMode === "weighted" ? (
                <tr className="bg-brand-50">
                  <td className="sticky left-0 z-10 bg-brand-50 px-4 py-4 font-black text-ink-900">
                    Total
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-ink-700">All categories</td>
                  <td className="px-4 py-4" />
                  {matrix.options.map((option) => {
                    const result = results.rankings.find((ranking) => ranking.option.id === option.id);
                    return (
                      <td key={option.id} className="px-4 py-4 font-black text-brand-700">
                        {result?.totalScore ?? 0}
                      </td>
                    );
                  })}
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-brand-600" />
            <h3 className="text-lg font-bold text-ink-900">Total score comparison</h3>
          </div>
          <div className="space-y-4">
            {results.rankings.map((result) => (
              <div key={result.option.id} className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-bold text-ink-900">{result.option.name}</span>
                  <span className="shrink-0 font-bold text-brand-700">
                    {Math.round(result.percentageFit)}% | {result.totalScore} pts
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full rounded-full bg-brand-600"
                    style={{ width: `${Math.min(100, result.percentageFit)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            {qualityWarnings.length > 0 ? (
              <AlertTriangle className="h-5 w-5 text-amber-800" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-brand-600" />
            )}
            <h3 className="text-lg font-bold text-ink-900">Criteria quality checks</h3>
          </div>
          {qualityWarnings.length > 0 ? (
            <div className="space-y-3">
              {qualityWarnings.map((warning) => (
                <div
                  key={warning.criterionId}
                  className="rounded-lg border border-amber-200 bg-amber-50 p-4"
                >
                  <Badge tone="amber">{warning.criterionName}</Badge>
                  <div className="mt-3 text-sm font-bold text-amber-800">{warning.issue}</div>
                  <p className="mt-1 text-sm leading-6 text-ink-700">{warning.suggestion}</p>
                  <p className="mt-1 text-sm leading-6 text-ink-500">{warning.explanation}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-6 text-ink-600">
              Criteria direction looks clear: higher scores appear to mean better outcomes.
            </p>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-ink-900">Category performance</h3>
          <p className="mt-1 text-sm leading-6 text-ink-500">
            Compare where each option is strong or exposed within each criterion category.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {results.categoryNames.map((category) => (
            <div key={category} className="rounded-lg border border-ink-100 bg-ink-50 p-4">
              <h4 className="font-bold text-ink-900">{category}</h4>
              <div className="mt-3 space-y-3">
                {results.rankings.map((result) => {
                  const categoryScore = result.categoryScores.find(
                    (score) => score.category === category
                  );
                  const percentage = categoryScore?.percentage ?? 0;

                  return (
                    <div key={result.option.id} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate font-semibold text-ink-700">
                          {result.option.name}
                        </span>
                        <span className="font-bold text-ink-900">{Math.round(percentage)}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white">
                        <div
                          className="h-full rounded-full bg-coral-500"
                          style={{ width: `${Math.min(100, percentage)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {selectedCriterion ? (
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-brand-600" />
            <h3 className="text-lg font-bold text-ink-900">What-if weight check</h3>
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-ink-700">Criterion</span>
                <select
                  className="min-h-11 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-900 shadow-sm"
                  value={selectedCriterion.id}
                  onChange={(event) => setSelectedCriterionId(event.target.value)}
                >
                  {matrix.criteria.map((criterion) => (
                    <option key={criterion.id} value={criterion.id}>
                      {getCriterionLabel(criterion)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink-700">
                  Temporary weight: {temporaryWeight}
                </span>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={temporaryWeight}
                  className="w-full accent-brand-600"
                  onChange={(event) => setTemporaryWeight(clampWeight(Number(event.target.value)))}
                />
                <span className="block text-xs font-semibold text-ink-500">
                  Current saved weight is {clampWeight(selectedCriterion.weight)}. This check does
                  not save changes.
                </span>
              </label>
            </div>
            <div className="rounded-lg border border-ink-100 bg-ink-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={winnerChanged ? "amber" : "green"}>
                  {winnerChanged ? "Winner changes" : "Winner unchanged"}
                </Badge>
                <Badge>{selectedCriterion.name}</Badge>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-white p-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-ink-500">
                    Current winner
                  </div>
                  <div className="mt-1 font-bold text-ink-900">{currentWinner ?? "None yet"}</div>
                </div>
                <div className="rounded-lg bg-white p-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-ink-500">
                    What-if winner
                  </div>
                  <div className="mt-1 font-bold text-ink-900">{whatIfWinner ?? "None yet"}</div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {whatIfResults.rankings.map((result) => (
                  <div
                    key={result.option.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm"
                  >
                    <span className="font-semibold text-ink-800">
                      #{result.rank} {result.option.name}
                    </span>
                    <span className="font-bold text-brand-700">
                      {result.totalScore} pts | {Math.round(result.percentageFit)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
};
