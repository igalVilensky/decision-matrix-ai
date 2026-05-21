import type {
  AiSuggestion,
  CriteriaSuggestion,
  MatrixReview,
  OptionSuggestion,
  Recommendation,
  ScoreSuggestion
} from "../../types/matrix";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";

export type ReviewedSuggestion =
  | (AiSuggestion<CriteriaSuggestion> & { type: "criteria" })
  | (AiSuggestion<OptionSuggestion> & { type: "options" })
  | (AiSuggestion<ScoreSuggestion> & { type: "scores" })
  | (AiSuggestion<MatrixReview> & { type: "quality-review" })
  | (AiSuggestion<Recommendation> & { type: "summary" });

type AiSuggestionsReviewProps = {
  suggestion?: ReviewedSuggestion;
  onAccept: () => void;
  onReject: () => void;
};

const renderList = (items: string[], emptyText: string) =>
  items.length > 0 ? (
    <ul className="mt-2 space-y-2 text-sm leading-6 text-ink-700">
      {items.map((item) => (
        <li key={item} className="rounded-lg bg-white px-3 py-2">
          {item}
        </li>
      ))}
    </ul>
  ) : (
    <p className="mt-2 text-sm text-ink-500">{emptyText}</p>
  );

export const AiSuggestionsReview = ({
  suggestion,
  onAccept,
  onReject
}: AiSuggestionsReviewProps) => {
  if (!suggestion) {
    return (
      <EmptyState
        title="AI suggestions will appear here"
        description="Run an assistant action to get structured suggestions. You can review, edit after accepting, or reject them."
      />
    );
  }

  if (suggestion.type === "criteria") {
    return (
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <Badge tone="blue">AI-generated criteria</Badge>
            <h3 className="mt-2 text-lg font-bold text-ink-900">Review criteria</h3>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onReject}>
              Reject
            </Button>
            <Button onClick={onAccept}>Accept all</Button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {suggestion.data.criteria.map((criterion) => (
            <div key={`${criterion.category}-${criterion.name}`} className="rounded-lg border border-ink-100 bg-ink-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{criterion.category}</Badge>
                <Badge tone={criterion.isMustHave ? "amber" : "default"}>
                  Weight {criterion.weight}
                </Badge>
              </div>
              <h4 className="mt-3 font-bold text-ink-900">{criterion.name}</h4>
              <p className="mt-1 text-sm leading-6 text-ink-500">
                {criterion.description ?? "No description provided."}
              </p>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (suggestion.type === "options") {
    return (
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <Badge tone="blue">AI-generated options</Badge>
            <h3 className="mt-2 text-lg font-bold text-ink-900">Review options</h3>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onReject}>
              Reject
            </Button>
            <Button onClick={onAccept}>Accept all</Button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {suggestion.data.options.map((option) => (
            <div key={option.name} className="rounded-lg border border-ink-100 bg-ink-50 p-4">
              <h4 className="font-bold text-ink-900">{option.name}</h4>
              <p className="mt-1 text-sm leading-6 text-ink-500">
                {option.description ?? "No description provided."}
              </p>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (suggestion.type === "scores") {
    return (
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <Badge tone="blue">AI-generated scores</Badge>
            <h3 className="mt-2 text-lg font-bold text-ink-900">Review score suggestions</h3>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onReject}>
              Reject
            </Button>
            <Button onClick={onAccept}>Apply suggestions</Button>
          </div>
        </div>
        <div className="overflow-x-auto matrix-scrollbar">
          <table className="min-w-[720px] w-full text-left text-sm">
            <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-3 py-2">Option</th>
                <th className="px-3 py-2">Criterion</th>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Confidence</th>
                <th className="px-3 py-2">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {suggestion.data.scores.map((score) => (
                <tr key={`${score.optionName}-${score.criterionName}`}>
                  <td className="px-3 py-3 font-semibold text-ink-900">{score.optionName}</td>
                  <td className="px-3 py-3 text-ink-700">{score.criterionName}</td>
                  <td className="px-3 py-3 font-bold text-ink-900">{score.value}/5</td>
                  <td className="px-3 py-3">
                    <Badge>{score.confidence ?? "medium"}</Badge>
                  </td>
                  <td className="px-3 py-3 text-ink-500">{score.note ?? "No note."}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  if (suggestion.type === "quality-review") {
    return (
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <Badge tone="blue">AI quality review</Badge>
            <h3 className="mt-2 text-lg font-bold text-ink-900">Matrix quality review</h3>
          </div>
          <Button variant="outline" onClick={onReject}>
            Dismiss
          </Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg bg-brand-50 p-4">
            <h4 className="font-bold text-brand-700">Strengths</h4>
            {renderList(suggestion.data.strengths, "No strengths returned.")}
          </div>
          <div className="rounded-lg bg-coral-50 p-4">
            <h4 className="font-bold text-coral-600">Issues</h4>
            {renderList(suggestion.data.issues, "No issues returned.")}
          </div>
          <div className="rounded-lg bg-ink-50 p-4">
            <h4 className="font-bold text-ink-900">Suggestions</h4>
            {renderList(suggestion.data.suggestions, "No suggestions returned.")}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <Badge tone="blue">AI recommendation</Badge>
          <h3 className="mt-2 text-lg font-bold text-ink-900">
            {suggestion.data.winner || "Recommendation"}
          </h3>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onReject}>
            Reject
          </Button>
          <Button onClick={onAccept}>Save summary</Button>
        </div>
      </div>
      <p className="rounded-lg bg-brand-50 p-4 text-sm leading-7 text-ink-700">
        {suggestion.data.summary}
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-ink-50 p-4">
          <h4 className="font-bold text-ink-900">Why it leads</h4>
          {renderList(suggestion.data.whyWinner, "No reasons returned.")}
        </div>
        <div className="rounded-lg bg-ink-50 p-4">
          <h4 className="font-bold text-ink-900">Tradeoffs</h4>
          {renderList(suggestion.data.tradeoffs, "No tradeoffs returned.")}
        </div>
        <div className="rounded-lg bg-ink-50 p-4">
          <h4 className="font-bold text-ink-900">Risks</h4>
          {renderList(suggestion.data.risks, "No risks returned.")}
        </div>
        <div className="rounded-lg bg-ink-50 p-4">
          <h4 className="font-bold text-ink-900">Next steps</h4>
          {renderList(suggestion.data.nextSteps, "No next steps returned.")}
        </div>
      </div>
    </Card>
  );
};
