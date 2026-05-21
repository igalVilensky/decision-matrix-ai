import type { OptionResult } from "../../types/matrix";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

type RankingListProps = {
  rankings: OptionResult[];
};

export const RankingList = ({ rankings }: RankingListProps) => (
  <Card className="p-5">
    <div className="mb-4">
      <h3 className="text-lg font-bold text-ink-900">Ranking</h3>
      <p className="mt-1 text-sm text-ink-500">Total weighted score by option.</p>
    </div>
    <div className="space-y-4">
      {rankings.map((result) => (
        <div key={result.option.id} className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-900 text-sm font-bold text-white">
                {result.rank}
              </span>
              <div className="min-w-0">
                <div className="truncate font-bold text-ink-900">{result.option.name}</div>
                <div className="text-xs text-ink-500">
                  {result.totalScore} of {result.maxPossibleScore} weighted points
                </div>
              </div>
            </div>
            <Badge tone={result.rank === 1 ? "green" : "default"}>
              {Math.round(result.percentageFit)}%
            </Badge>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-brand-600 transition-all"
              style={{ width: `${Math.min(100, result.percentageFit)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  </Card>
);
