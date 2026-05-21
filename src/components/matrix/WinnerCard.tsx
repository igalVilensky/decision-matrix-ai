import { Trophy } from "lucide-react";
import type { OptionResult } from "../../types/matrix";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

type WinnerCardProps = {
  winner?: OptionResult;
};

export const WinnerCard = ({ winner }: WinnerCardProps) => {
  if (!winner) return null;

  return (
    <Card className="overflow-hidden border-brand-100 bg-white">
      <div className="bg-brand-50 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Trophy className="h-5 w-5" />
          </span>
          <div>
            <div className="text-sm font-semibold text-brand-700">Current winner</div>
            <h3 className="text-2xl font-bold text-ink-900">{winner.option.name}</h3>
          </div>
        </div>
      </div>
      <div className="grid gap-4 p-5 md:grid-cols-3">
        <div>
          <div className="text-3xl font-bold text-ink-900">
            {Math.round(winner.percentageFit)}%
          </div>
          <div className="text-sm text-ink-500">fit score</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-ink-900">
            {winner.totalScore}/{winner.maxPossibleScore}
          </div>
          <div className="text-sm text-ink-500">weighted points</div>
        </div>
        <div className="flex flex-wrap content-start gap-2">
          {winner.mustHaveFailures.length > 0 ? (
            <Badge tone="red">{winner.mustHaveFailures.length} must-have gaps</Badge>
          ) : (
            <Badge tone="green">No must-have gaps</Badge>
          )}
        </div>
      </div>
    </Card>
  );
};
