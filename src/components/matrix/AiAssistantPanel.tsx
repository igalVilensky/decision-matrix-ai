import { useState } from "react";
import {
  ClipboardCheck,
  Lightbulb,
  ListChecks,
  MessageSquareText,
  Sparkles
} from "lucide-react";
import * as aiClient from "../../services/aiClient";
import { calculateMatrixResults, clampScore, clampWeight } from "../../services/scoring";
import type {
  CriteriaSuggestion,
  DecisionMatrix,
  MatrixReview,
  OptionSuggestion,
  Recommendation,
  ScoreSuggestion
} from "../../types/matrix";
import { currentTimestamp } from "../../utils/dates";
import { createId } from "../../utils/ids";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Textarea } from "../ui/Textarea";
import { AiSuggestionsReview, type ReviewedSuggestion } from "./AiSuggestionsReview";

type AiAssistantPanelProps = {
  matrix: DecisionMatrix;
  onChange: (matrix: DecisionMatrix) => void;
};

type AiActionKey =
  | "generateCriteria"
  | "suggestOptions"
  | "suggestScores"
  | "reviewMatrix"
  | "generateRecommendation";

const normalize = (value: string) => value.trim().toLowerCase();

export const AiAssistantPanel = ({ matrix, onChange }: AiAssistantPanelProps) => {
  const [extraInstructions, setExtraInstructions] = useState("");
  const [loadingAction, setLoadingAction] = useState<AiActionKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<ReviewedSuggestion | undefined>();

  const createSuggestion = <TData,>(
    type: ReviewedSuggestion["type"],
    data: TData
  ): ReviewedSuggestion => ({
    id: createId("suggestion"),
    type,
    data,
    createdAt: currentTimestamp()
  } as ReviewedSuggestion);

  const runAction = async (action: AiActionKey) => {
    setLoadingAction(action);
    setError(null);

    try {
      if (action === "generateCriteria") {
        const data = await aiClient.generateCriteria(matrix, extraInstructions);
        setSuggestion(createSuggestion<CriteriaSuggestion>("criteria", data));
      }
      if (action === "suggestOptions") {
        const data = await aiClient.suggestOptions(matrix, extraInstructions);
        setSuggestion(createSuggestion<OptionSuggestion>("options", data));
      }
      if (action === "suggestScores") {
        const data = await aiClient.suggestScores(matrix, extraInstructions);
        setSuggestion(createSuggestion<ScoreSuggestion>("scores", data));
      }
      if (action === "reviewMatrix") {
        const data = await aiClient.reviewMatrix(matrix, extraInstructions);
        setSuggestion(createSuggestion<MatrixReview>("quality-review", data));
      }
      if (action === "generateRecommendation") {
        const results = calculateMatrixResults(matrix);
        const data = await aiClient.generateRecommendation(matrix, results, extraInstructions);
        setSuggestion(createSuggestion<Recommendation>("summary", data));
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "The AI request failed.");
    } finally {
      setLoadingAction(null);
    }
  };

  const acceptSuggestion = (acceptedSuggestion: ReviewedSuggestion) => {
    const suggestion = acceptedSuggestion;

    if (suggestion.type === "criteria") {
      onChange({
        ...matrix,
        criteria: [
          ...matrix.criteria,
          ...suggestion.data.criteria.map((criterion) => ({
            id: createId("criterion"),
            category: criterion.category || "General",
            name: criterion.name,
            description: criterion.description,
            weight: clampWeight(criterion.weight),
            isMustHave: Boolean(criterion.isMustHave),
            aiGenerated: true
          }))
        ]
      });
      setSuggestion(undefined);
      return;
    }

    if (suggestion.type === "options") {
      onChange({
        ...matrix,
        options: [
          ...matrix.options,
          ...suggestion.data.options.map((option) => ({
            id: createId("option"),
            name: option.name,
            description: option.description,
            notes: "",
            aiGenerated: true
          }))
        ]
      });
      setSuggestion(undefined);
      return;
    }

    if (suggestion.type === "scores") {
      const optionByName = new Map(matrix.options.map((option) => [normalize(option.name), option]));
      const criterionByName = new Map(
        matrix.criteria.map((criterion) => [normalize(criterion.name), criterion])
      );

      const nextScores = [...matrix.scores];
      suggestion.data.scores.forEach((scoreSuggestion) => {
        const option = optionByName.get(normalize(scoreSuggestion.optionName));
        const criterion = criterionByName.get(normalize(scoreSuggestion.criterionName));
        if (!option || !criterion) return;

        const existingIndex = nextScores.findIndex(
          (score) => score.optionId === option.id && score.criterionId === criterion.id
        );
        const nextScore = {
          optionId: option.id,
          criterionId: criterion.id,
          value: clampScore(scoreSuggestion.value),
          note: scoreSuggestion.note,
          confidence: scoreSuggestion.confidence ?? "medium",
          aiGenerated: true
        };

        if (existingIndex >= 0) {
          nextScores[existingIndex] = nextScore;
        } else {
          nextScores.push(nextScore);
        }
      });

      onChange({ ...matrix, scores: nextScores });
      setSuggestion(undefined);
      return;
    }

    if (suggestion.type === "summary") {
      const summary = [
        suggestion.data.summary,
        suggestion.data.whyWinner.length > 0
          ? `Why: ${suggestion.data.whyWinner.join("; ")}`
          : "",
        suggestion.data.tradeoffs.length > 0
          ? `Tradeoffs: ${suggestion.data.tradeoffs.join("; ")}`
          : "",
        suggestion.data.risks.length > 0 ? `Risks: ${suggestion.data.risks.join("; ")}` : "",
        suggestion.data.nextSteps.length > 0
          ? `Next steps: ${suggestion.data.nextSteps.join("; ")}`
          : ""
      ]
        .filter(Boolean)
        .join("\n\n");

      onChange({ ...matrix, aiSummary: summary });
      setSuggestion(undefined);
      return;
    }

    setSuggestion(undefined);
  };

  const hasScoringBase = matrix.options.length > 0 && matrix.criteria.length > 0;

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.7fr)]">
          <div>
            <Badge tone="blue">AI assistant</Badge>
            <h3 className="mt-3 text-2xl font-bold text-ink-900">
              Turn vague tradeoffs into structured choices
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">
              AI can draft criteria, options, scores, quality feedback, and recommendations. You
              stay in control: nothing is applied until you accept it.
            </p>
            {error ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            ) : null}
          </div>
          <Textarea
            label="Extra instructions"
            placeholder="Optional: emphasize budget, avoid generic criteria, score cautiously, focus on family needs..."
            value={extraInstructions}
            onChange={(event) => setExtraInstructions(event.target.value)}
          />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Button
            variant="outline"
            icon={<ListChecks className="h-4 w-4" />}
            isLoading={loadingAction === "generateCriteria"}
            onClick={() => void runAction("generateCriteria")}
          >
            Generate criteria
          </Button>
          <Button
            variant="outline"
            icon={<Lightbulb className="h-4 w-4" />}
            isLoading={loadingAction === "suggestOptions"}
            onClick={() => void runAction("suggestOptions")}
          >
            Suggest options
          </Button>
          <Button
            variant="outline"
            icon={<ClipboardCheck className="h-4 w-4" />}
            isLoading={loadingAction === "suggestScores"}
            disabled={!hasScoringBase}
            onClick={() => void runAction("suggestScores")}
          >
            Suggest scores
          </Button>
          <Button
            variant="outline"
            icon={<Sparkles className="h-4 w-4" />}
            isLoading={loadingAction === "reviewMatrix"}
            onClick={() => void runAction("reviewMatrix")}
          >
            Review matrix quality
          </Button>
          <Button
            icon={<MessageSquareText className="h-4 w-4" />}
            isLoading={loadingAction === "generateRecommendation"}
            disabled={!hasScoringBase}
            onClick={() => void runAction("generateRecommendation")}
          >
            Generate recommendation
          </Button>
        </div>
      </Card>
      <AiSuggestionsReview
        suggestion={suggestion}
        onAccept={acceptSuggestion}
        onReject={() => setSuggestion(undefined)}
      />
    </div>
  );
};
