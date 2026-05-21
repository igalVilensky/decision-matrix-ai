import { useEffect, useMemo, useRef, useState } from "react";
import {
  ClipboardCheck,
  ClipboardList,
  Lightbulb,
  ListChecks,
  MessageSquareText,
  Sparkles
} from "lucide-react";
import * as aiClient from "../../services/aiClient";
import { calculateDecisionInsights } from "../../services/decisionInsights";
import { getAiActionReadiness } from "../../services/aiReadiness";
import {
  ANONYMOUS_DAILY_AI_LIMIT,
  getDailyAiUsage,
  getDailyUsageDateKey,
  incrementDailyAiUsage
} from "../../services/aiUsageRepository";
import { calculateMatrixResults, clampScore, clampWeight } from "../../services/scoring";
import type {
  ActionChecklistSuggestion,
  AiAction,
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

type AiActionRequest = {
  id: string;
  action: AiAction;
};

type AiAssistantPanelProps = {
  matrix: DecisionMatrix;
  uid?: string;
  onChange: (matrix: DecisionMatrix) => void;
  requestedAction?: AiActionRequest;
  onRequestedActionHandled?: () => void;
};

type AiActionConfig = {
  action: AiAction;
  label: string;
  icon: JSX.Element;
  variant: "primary" | "outline";
};

const AI_GUIDANCE_MAX_LENGTH = 1000;
const AI_COOLDOWN_MS = 5_000;

const actionConfigs: AiActionConfig[] = [
  {
    action: "generateCriteria",
    label: "Generate criteria",
    icon: <ListChecks className="h-4 w-4" />,
    variant: "outline"
  },
  {
    action: "suggestOptions",
    label: "Suggest options",
    icon: <Lightbulb className="h-4 w-4" />,
    variant: "outline"
  },
  {
    action: "suggestScores",
    label: "Suggest scores",
    icon: <ClipboardCheck className="h-4 w-4" />,
    variant: "outline"
  },
  {
    action: "reviewMatrix",
    label: "Review matrix quality",
    icon: <Sparkles className="h-4 w-4" />,
    variant: "outline"
  },
  {
    action: "generateRecommendation",
    label: "Generate recommendation",
    icon: <MessageSquareText className="h-4 w-4" />,
    variant: "primary"
  },
  {
    action: "generateActionChecklist",
    label: "Generate action checklist",
    icon: <ClipboardList className="h-4 w-4" />,
    variant: "primary"
  }
];

const normalize = (value: string) => value.trim().toLowerCase();

export const AiAssistantPanel = ({
  matrix,
  uid,
  onChange,
  requestedAction,
  onRequestedActionHandled
}: AiAssistantPanelProps) => {
  const [extraInstructions, setExtraInstructions] = useState("");
  const [loadingAction, setLoadingAction] = useState<AiAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<ReviewedSuggestion | undefined>();
  const [usageCount, setUsageCount] = useState(0);
  const [isUsageLoading, setIsUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState<string | undefined>();
  const [cooldownUntil, setCooldownUntil] = useState<number | undefined>();
  const [now, setNow] = useState(() => Date.now());
  const handledRequestIds = useRef(new Set<string>());
  const dateKey = useMemo(() => getDailyUsageDateKey(), []);

  const cooldownRemainingMs = cooldownUntil ? Math.max(0, cooldownUntil - now) : 0;
  const cooldownSeconds = Math.ceil(cooldownRemainingMs / 1000);
  const isCoolingDown = cooldownRemainingMs > 0;
  const isUsageLimitReached = usageCount >= ANONYMOUS_DAILY_AI_LIMIT;

  useEffect(() => {
    if (!uid) {
      setUsageCount(0);
      setUsageError(undefined);
      setIsUsageLoading(false);
      return undefined;
    }

    let isActive = true;
    setIsUsageLoading(true);
    setUsageError(undefined);

    void getDailyAiUsage(uid, dateKey)
      .then((count) => {
        if (!isActive) return;
        setUsageCount(count);
      })
      .catch((caughtError: unknown) => {
        if (!isActive) return;
        setUsageError(
          caughtError instanceof Error
            ? `AI usage could not be checked: ${caughtError.message}`
            : "AI usage could not be checked."
        );
      })
      .finally(() => {
        if (!isActive) return;
        setIsUsageLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [dateKey, uid]);

  useEffect(() => {
    if (!cooldownUntil) return undefined;

    const intervalId = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(intervalId);
  }, [cooldownUntil]);

  useEffect(() => {
    if (cooldownUntil && cooldownRemainingMs === 0) {
      setCooldownUntil(undefined);
    }
  }, [cooldownRemainingMs, cooldownUntil]);

  const createSuggestion = <TData,>(
    type: ReviewedSuggestion["type"],
    data: TData
  ): ReviewedSuggestion => ({
    id: createId("suggestion"),
    type,
    data,
    createdAt: currentTimestamp()
  } as ReviewedSuggestion);

  const getUnavailableReason = (action: AiAction): string | undefined => {
    const readiness = getAiActionReadiness(action, matrix);

    if (!readiness.isReady) return readiness.reason;
    if (!uid) return "AI usage tracking needs an authenticated workspace first.";
    if (usageError) return usageError;
    if (isUsageLimitReached) {
      return `You have used ${usageCount} of ${ANONYMOUS_DAILY_AI_LIMIT} AI requests today.`;
    }
    if (isCoolingDown) {
      return `Wait ${cooldownSeconds} seconds before the next AI request.`;
    }

    return undefined;
  };

  const runAction = async (action: AiAction) => {
    if (loadingAction) return;

    const unavailableReason = getUnavailableReason(action);
    if (unavailableReason) {
      setError(unavailableReason);
      return;
    }

    if (!uid) {
      setError("AI usage tracking needs an authenticated workspace first.");
      return;
    }

    setLoadingAction(action);
    setError(null);
    let didSendAiRequest = false;

    try {
      const nextUsageCount = await incrementDailyAiUsage(
        uid,
        dateKey,
        ANONYMOUS_DAILY_AI_LIMIT
      );
      setUsageCount(nextUsageCount);
      didSendAiRequest = true;

      const guidance = extraInstructions.trim();

      if (action === "generateCriteria") {
        const data = await aiClient.generateCriteria(matrix, guidance);
        setSuggestion(createSuggestion<CriteriaSuggestion>("criteria", data));
      }
      if (action === "suggestOptions") {
        const data = await aiClient.suggestOptions(matrix, guidance);
        setSuggestion(createSuggestion<OptionSuggestion>("options", data));
      }
      if (action === "suggestScores") {
        const data = await aiClient.suggestScores(matrix, guidance);
        setSuggestion(createSuggestion<ScoreSuggestion>("scores", data));
      }
      if (action === "reviewMatrix") {
        const data = await aiClient.reviewMatrix(matrix, guidance);
        setSuggestion(createSuggestion<MatrixReview>("quality-review", data));
      }
      if (action === "generateRecommendation") {
        const results = calculateMatrixResults(matrix);
        const data = await aiClient.generateRecommendation(matrix, results, guidance);
        setSuggestion(createSuggestion<Recommendation>("summary", data));
      }
      if (action === "generateActionChecklist") {
        const results = calculateMatrixResults(matrix);
        const insights = calculateDecisionInsights(matrix, results);
        const data = await aiClient.generateActionChecklist(matrix, results, insights, guidance);
        setSuggestion(createSuggestion<ActionChecklistSuggestion>("action-checklist", data));
      }
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "The AI request failed. Try again in a moment.";

      if (message.includes("AI requests today")) {
        setUsageCount(ANONYMOUS_DAILY_AI_LIMIT);
      }

      setError(message);
    } finally {
      if (didSendAiRequest) {
        setNow(Date.now());
        setCooldownUntil(Date.now() + AI_COOLDOWN_MS);
      }
      setLoadingAction(null);
    }
  };

  useEffect(() => {
    if (!requestedAction) return;
    if (handledRequestIds.current.has(requestedAction.id)) return;

    handledRequestIds.current.add(requestedAction.id);
    void runAction(requestedAction.action);
    onRequestedActionHandled?.();
  }, [requestedAction?.id]);

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

    if (suggestion.type === "action-checklist") {
      const results = calculateMatrixResults(matrix);
      const winner = results.winner;
      const timestamp = currentTimestamp();

      onChange({
        ...matrix,
        actionChecklist: {
          id: createId("checklist"),
          type: suggestion.data.checklistType,
          title: suggestion.data.title,
          summary: suggestion.data.summary,
          generatedForOptionId: winner?.option.id,
          generatedForOptionName: winner?.option.name,
          items: suggestion.data.actions.map((action) => ({
            id: createId("action"),
            phase: action.phase,
            task: action.task,
            reason: action.reason,
            priority: action.priority,
            status: "todo"
          })),
          validationChecks: suggestion.data.validationChecks,
          risksToWatch: suggestion.data.risksToWatch,
          createdAt: timestamp,
          updatedAt: timestamp,
          aiGenerated: true
        }
      });
      setSuggestion(undefined);
      return;
    }

    setSuggestion(undefined);
  };

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.7fr)]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="blue">AI assistant</Badge>
              <Badge>{isUsageLoading ? "Checking usage" : `${usageCount} / ${ANONYMOUS_DAILY_AI_LIMIT} today`}</Badge>
            </div>
            <h3 className="mt-3 text-2xl font-bold text-ink-900">
              Get structured help without writing a perfect prompt
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">
              AI uses the matrix title, goal, options, criteria, and constraints. Extra guidance is
              optional, and nothing is applied until you review and accept it.
            </p>
            <p className="mt-3 text-sm font-semibold text-ink-600">
              You have used {usageCount} of {ANONYMOUS_DAILY_AI_LIMIT} AI requests today.
            </p>
            {usageError ? (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                {usageError}
              </div>
            ) : null}
            {error ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            ) : null}
          </div>
          <Textarea
            label="Optional guidance for AI"
            placeholder="Example: prioritize budget and beginner friendliness."
            helperText={`${extraInstructions.length}/${AI_GUIDANCE_MAX_LENGTH} characters`}
            maxLength={AI_GUIDANCE_MAX_LENGTH}
            value={extraInstructions}
            onChange={(event) =>
              setExtraInstructions(event.target.value.slice(0, AI_GUIDANCE_MAX_LENGTH))
            }
          />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {actionConfigs.map((config) => {
            const unavailableReason = getUnavailableReason(config.action);
            const isCurrentActionLoading = loadingAction === config.action;
            const isDisabled = Boolean(unavailableReason) || Boolean(loadingAction);

            return (
              <div key={config.action} className="space-y-2">
                <Button
                  variant={config.variant}
                  icon={config.icon}
                  isLoading={isCurrentActionLoading}
                  disabled={isDisabled}
                  onClick={() => void runAction(config.action)}
                >
                  {config.label}
                </Button>
                {!loadingAction && unavailableReason ? (
                  <p className="text-xs font-semibold leading-5 text-ink-500">
                    {unavailableReason}
                  </p>
                ) : null}
              </div>
            );
          })}
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
