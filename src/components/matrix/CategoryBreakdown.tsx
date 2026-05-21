import type { OptionResult } from "../../types/matrix";
import { Card } from "../ui/Card";

type CategoryBreakdownProps = {
  rankings: OptionResult[];
};

export const CategoryBreakdown = ({ rankings }: CategoryBreakdownProps) => {
  const categoryNames = Array.from(
    new Set(rankings.flatMap((result) => result.categoryScores.map((score) => score.category)))
  );

  return (
    <Card className="p-5">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-ink-900">Category breakdown</h3>
        <p className="mt-1 text-sm text-ink-500">Where each option is strong or exposed.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {categoryNames.map((category) => (
          <div key={category} className="rounded-lg border border-ink-100 bg-ink-50 p-4">
            <h4 className="font-bold text-ink-900">{category}</h4>
            <div className="mt-3 space-y-3">
              {rankings.map((result) => {
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
  );
};
