import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { clampScore, clampWeight } from "../../services/scoring";
import type {
  ActionChecklistSuggestion,
  ActionPriority,
  AiSuggestion,
  CriteriaSuggestion,
  MatrixReview,
  OptionSuggestion,
  Recommendation,
  ScoreConfidence,
  ScoreSuggestion
} from "../../types/matrix";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";

export type ReviewedSuggestion =
  | (AiSuggestion<CriteriaSuggestion> & { type: "criteria" })
  | (AiSuggestion<OptionSuggestion> & { type: "options" })
  | (AiSuggestion<ScoreSuggestion> & { type: "scores" })
  | (AiSuggestion<MatrixReview> & { type: "quality-review" })
  | (AiSuggestion<Recommendation> & { type: "summary" })
  | (AiSuggestion<ActionChecklistSuggestion> & { type: "action-checklist" });

type AiSuggestionsReviewProps = {
  suggestion?: ReviewedSuggestion;
  onAccept: (suggestion: ReviewedSuggestion) => void;
  onReject: () => void;
};

const confidenceOptions: ScoreConfidence[] = ["low", "medium", "high"];
const priorityOptions: ActionPriority[] = ["low", "medium", "high"];
const priorityTone: Record<ActionPriority, "default" | "amber" | "red"> = {
  low: "default",
  medium: "amber",
  high: "red"
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
  const [editableSuggestion, setEditableSuggestion] = useState<ReviewedSuggestion | undefined>(
    suggestion
  );

  useEffect(() => {
    setEditableSuggestion(suggestion);
  }, [suggestion]);

  if (!editableSuggestion) {
    return (
      <EmptyState
        title="AI suggestions will appear here"
        description="Run an assistant action to get structured suggestions. You can edit, accept, or reject them before anything changes."
      />
    );
  }

  if (editableSuggestion.type === "criteria") {
    const updateCriterion = (
      index: number,
      updates: Partial<CriteriaSuggestion["criteria"][number]>
    ) => {
      setEditableSuggestion({
        ...editableSuggestion,
        data: {
          criteria: editableSuggestion.data.criteria.map((criterion, criterionIndex) =>
            criterionIndex === index ? { ...criterion, ...updates } : criterion
          )
        }
      });
    };

    const removeCriterion = (index: number) => {
      setEditableSuggestion({
        ...editableSuggestion,
        data: {
          criteria: editableSuggestion.data.criteria.filter((_, criterionIndex) => criterionIndex !== index)
        }
      });
    };

    return (
      <Card className="p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge tone="blue">AI-generated criteria</Badge>
            <h3 className="mt-2 text-lg font-bold text-ink-900">Review and edit criteria</h3>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onReject}>
              Reject
            </Button>
            <Button
              disabled={editableSuggestion.data.criteria.length === 0}
              onClick={() => onAccept(editableSuggestion)}
            >
              Accept all
            </Button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {editableSuggestion.data.criteria.map((criterion, index) => (
            <div
              key={`${criterion.category}-${criterion.name}-${index}`}
              className="rounded-lg border border-ink-100 bg-ink-50 p-4"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{criterion.category || "General"}</Badge>
                  <Badge tone={criterion.isMustHave ? "amber" : "default"}>
                    Weight {criterion.weight}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={() => removeCriterion(index)}
                >
                  Remove criterion suggestion
                </Button>
              </div>
              <div className="space-y-3">
                <Input
                  label="Name"
                  value={criterion.name}
                  onChange={(event) => updateCriterion(index, { name: event.target.value })}
                />
                <Input
                  label="Category"
                  value={criterion.category}
                  onChange={(event) => updateCriterion(index, { category: event.target.value })}
                />
                <Textarea
                  label="Description"
                  value={criterion.description ?? ""}
                  onChange={(event) =>
                    updateCriterion(index, { description: event.target.value })
                  }
                />
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-ink-700">Weight</span>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={criterion.weight}
                    className="w-full accent-brand-600"
                    onChange={(event) =>
                      updateCriterion(index, {
                        weight: clampWeight(Number(event.target.value))
                      })
                    }
                  />
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-ink-200 bg-white px-3 py-3 text-sm font-semibold text-ink-700">
                  <input
                    type="checkbox"
                    checked={Boolean(criterion.isMustHave)}
                    className="h-4 w-4 rounded border-ink-300 text-brand-600"
                    onChange={(event) =>
                      updateCriterion(index, { isMustHave: event.target.checked })
                    }
                  />
                  Must-have
                </label>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (editableSuggestion.type === "options") {
    const updateOption = (
      index: number,
      updates: Partial<OptionSuggestion["options"][number]>
    ) => {
      setEditableSuggestion({
        ...editableSuggestion,
        data: {
          options: editableSuggestion.data.options.map((option, optionIndex) =>
            optionIndex === index ? { ...option, ...updates } : option
          )
        }
      });
    };

    const removeOption = (index: number) => {
      setEditableSuggestion({
        ...editableSuggestion,
        data: {
          options: editableSuggestion.data.options.filter((_, optionIndex) => optionIndex !== index)
        }
      });
    };

    return (
      <Card className="p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge tone="blue">AI-generated options</Badge>
            <h3 className="mt-2 text-lg font-bold text-ink-900">Review and edit options</h3>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onReject}>
              Reject
            </Button>
            <Button
              disabled={editableSuggestion.data.options.length === 0}
              onClick={() => onAccept(editableSuggestion)}
            >
              Accept all
            </Button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {editableSuggestion.data.options.map((option, index) => (
            <div
              key={`${option.name}-${index}`}
              className="rounded-lg border border-ink-100 bg-ink-50 p-4"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <Badge tone="blue">AI draft</Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={() => removeOption(index)}
                >
                  Remove option suggestion
                </Button>
              </div>
              <div className="space-y-3">
                <Input
                  label="Name"
                  value={option.name}
                  onChange={(event) => updateOption(index, { name: event.target.value })}
                />
                <Textarea
                  label="Description"
                  value={option.description ?? ""}
                  onChange={(event) => updateOption(index, { description: event.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (editableSuggestion.type === "scores") {
    const updateScore = (
      index: number,
      updates: Partial<ScoreSuggestion["scores"][number]>
    ) => {
      setEditableSuggestion({
        ...editableSuggestion,
        data: {
          scores: editableSuggestion.data.scores.map((score, scoreIndex) =>
            scoreIndex === index ? { ...score, ...updates } : score
          )
        }
      });
    };

    const removeScore = (index: number) => {
      setEditableSuggestion({
        ...editableSuggestion,
        data: {
          scores: editableSuggestion.data.scores.filter((_, scoreIndex) => scoreIndex !== index)
        }
      });
    };

    return (
      <Card className="p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge tone="blue">AI-generated scores</Badge>
            <h3 className="mt-2 text-lg font-bold text-ink-900">Review and edit score suggestions</h3>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onReject}>
              Reject
            </Button>
            <Button
              disabled={editableSuggestion.data.scores.length === 0}
              onClick={() => onAccept(editableSuggestion)}
            >
              Apply suggestions
            </Button>
          </div>
        </div>
        <div className="space-y-3">
          {editableSuggestion.data.scores.map((score, index) => (
            <div
              key={`${score.optionName}-${score.criterionName}-${index}`}
              className="grid gap-3 rounded-lg border border-ink-100 bg-ink-50 p-4 xl:grid-cols-[1fr_1fr_120px_160px_2fr_auto]"
            >
              <Input
                label="Option"
                value={score.optionName}
                onChange={(event) => updateScore(index, { optionName: event.target.value })}
              />
              <Input
                label="Criterion"
                value={score.criterionName}
                onChange={(event) => updateScore(index, { criterionName: event.target.value })}
              />
              <label className="space-y-1.5">
                <span className="text-sm font-semibold text-ink-700">Score</span>
                <select
                  className="min-h-11 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-900 shadow-sm"
                  value={score.value}
                  onChange={(event) =>
                    updateScore(index, { value: clampScore(Number(event.target.value)) })
                  }
                >
                  {[0, 1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-semibold text-ink-700">Confidence</span>
                <select
                  className="min-h-11 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-900 shadow-sm"
                  value={score.confidence ?? "medium"}
                  onChange={(event) =>
                    updateScore(index, {
                      confidence: event.target.value as ScoreConfidence
                    })
                  }
                >
                  {confidenceOptions.map((confidence) => (
                    <option key={confidence} value={confidence}>
                      {confidence}
                    </option>
                  ))}
                </select>
              </label>
              <Input
                label="Note"
                value={score.note ?? ""}
                onChange={(event) => updateScore(index, { note: event.target.value })}
              />
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="icon"
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={() => removeScore(index)}
                >
                  Remove score suggestion
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (editableSuggestion.type === "quality-review") {
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
            {renderList(editableSuggestion.data.strengths, "No strengths returned.")}
          </div>
          <div className="rounded-lg bg-coral-50 p-4">
            <h4 className="font-bold text-coral-600">Issues</h4>
            {renderList(editableSuggestion.data.issues, "No issues returned.")}
          </div>
          <div className="rounded-lg bg-ink-50 p-4">
            <h4 className="font-bold text-ink-900">Suggestions</h4>
            {renderList(editableSuggestion.data.suggestions, "No suggestions returned.")}
          </div>
        </div>
      </Card>
    );
  }

  if (editableSuggestion.type === "action-checklist") {
    const updateChecklist = (updates: Partial<ActionChecklistSuggestion>) => {
      setEditableSuggestion({
        ...editableSuggestion,
        data: {
          ...editableSuggestion.data,
          ...updates
        }
      });
    };

    const updateAction = (
      index: number,
      updates: Partial<ActionChecklistSuggestion["actions"][number]>
    ) => {
      updateChecklist({
        actions: editableSuggestion.data.actions.map((action, actionIndex) =>
          actionIndex === index ? { ...action, ...updates } : action
        )
      });
    };

    const removeAction = (index: number) => {
      updateChecklist({
        actions: editableSuggestion.data.actions.filter((_, actionIndex) => actionIndex !== index)
      });
    };

    const removeValidationCheck = (index: number) => {
      updateChecklist({
        validationChecks: editableSuggestion.data.validationChecks.filter(
          (_, checkIndex) => checkIndex !== index
        )
      });
    };

    const removeRisk = (index: number) => {
      updateChecklist({
        risksToWatch: editableSuggestion.data.risksToWatch.filter(
          (_, riskIndex) => riskIndex !== index
        )
      });
    };

    const phases = Array.from(new Set(editableSuggestion.data.actions.map((action) => action.phase)));
    const isShortChecklist =
      editableSuggestion.data.actions.length > 0 && editableSuggestion.data.actions.length < 3;

    return (
      <Card className="p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge tone="blue">Decision-to-action agent</Badge>
            <h3 className="mt-2 text-lg font-bold text-ink-900">
              Review and edit action checklist
            </h3>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onReject}>
              Reject
            </Button>
            <Button
              disabled={editableSuggestion.data.actions.length === 0}
              onClick={() => onAccept(editableSuggestion)}
            >
              Save checklist
            </Button>
          </div>
        </div>
        {isShortChecklist ? (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            Short checklist: you removed most generated actions. You can still save it.
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="space-y-3 rounded-lg border border-ink-100 bg-ink-50 p-4">
            <Badge>{editableSuggestion.data.checklistType.replace(/_/g, " ")}</Badge>
            <Input
              label="Title"
              value={editableSuggestion.data.title}
              onChange={(event) => updateChecklist({ title: event.target.value })}
            />
            <Textarea
              label="Summary"
              value={editableSuggestion.data.summary}
              onChange={(event) => updateChecklist({ summary: event.target.value })}
            />
          </div>

          <div className="space-y-4">
            {phases.map((phase) => (
              <div key={phase} className="rounded-lg border border-ink-100 bg-ink-50 p-4">
                <h4 className="font-bold text-ink-900">{phase}</h4>
                <div className="mt-3 space-y-3">
                  {editableSuggestion.data.actions.map((action, index) =>
                    action.phase === phase ? (
                      <div key={`${phase}-${index}`} className="rounded-lg bg-white p-3">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <Badge tone={priorityTone[action.priority]}>{action.priority} priority</Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            icon={<Trash2 className="h-4 w-4" />}
                            onClick={() => removeAction(index)}
                          >
                            Remove action item
                          </Button>
                        </div>
                        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px]">
                          <Input
                            label="Task"
                            value={action.task}
                            onChange={(event) => updateAction(index, { task: event.target.value })}
                          />
                          <label className="space-y-1.5">
                            <span className="text-sm font-semibold text-ink-700">Priority</span>
                            <select
                              className="min-h-11 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-900 shadow-sm"
                              value={action.priority}
                              onChange={(event) =>
                                updateAction(index, {
                                  priority: event.target.value as ActionPriority
                                })
                              }
                            >
                              {priorityOptions.map((priority) => (
                                <option key={priority} value={priority}>
                                  {priority}
                                </option>
                              ))}
                            </select>
                          </label>
                          <div className="md:col-span-2">
                            <Textarea
                              label="Reason"
                              value={action.reason}
                              onChange={(event) =>
                                updateAction(index, { reason: event.target.value })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-brand-50 p-4">
            <h4 className="font-bold text-brand-700">Validation checks</h4>
            {editableSuggestion.data.validationChecks.length > 0 ? (
              <div className="mt-3 space-y-2">
                {editableSuggestion.data.validationChecks.map((check, index) => (
                  <div
                    key={`${check}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm text-ink-700"
                  >
                    <span>{check}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      icon={<Trash2 className="h-4 w-4" />}
                      onClick={() => removeValidationCheck(index)}
                    >
                      Remove validation check
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-ink-500">No validation checks included.</p>
            )}
          </div>
          <div className="rounded-lg bg-coral-50 p-4">
            <h4 className="font-bold text-coral-600">Risks to watch</h4>
            {editableSuggestion.data.risksToWatch.length > 0 ? (
              <div className="mt-3 space-y-2">
                {editableSuggestion.data.risksToWatch.map((risk, index) => (
                  <div
                    key={`${risk}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm text-ink-700"
                  >
                    <span>{risk}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      icon={<Trash2 className="h-4 w-4" />}
                      onClick={() => removeRisk(index)}
                    >
                      Remove risk
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-ink-500">No risks included.</p>
            )}
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
            {editableSuggestion.data.winner || "Recommendation"}
          </h3>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onReject}>
            Reject
          </Button>
          <Button onClick={() => onAccept(editableSuggestion)}>Save summary</Button>
        </div>
      </div>
      <p className="rounded-lg bg-brand-50 p-4 text-sm leading-7 text-ink-700">
        {editableSuggestion.data.summary}
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-ink-50 p-4">
          <h4 className="font-bold text-ink-900">Why it leads</h4>
          {renderList(editableSuggestion.data.whyWinner, "No reasons returned.")}
        </div>
        <div className="rounded-lg bg-ink-50 p-4">
          <h4 className="font-bold text-ink-900">Tradeoffs</h4>
          {renderList(editableSuggestion.data.tradeoffs, "No tradeoffs returned.")}
        </div>
        <div className="rounded-lg bg-ink-50 p-4">
          <h4 className="font-bold text-ink-900">Risks</h4>
          {renderList(editableSuggestion.data.risks, "No risks returned.")}
        </div>
        <div className="rounded-lg bg-ink-50 p-4">
          <h4 className="font-bold text-ink-900">Next steps</h4>
          {renderList(editableSuggestion.data.nextSteps, "No next steps returned.")}
        </div>
      </div>
    </Card>
  );
};
