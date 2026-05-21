import {
  BarChart3,
  ClipboardCheck,
  Lightbulb,
  ListChecks,
  Plus,
  Sparkles
} from "lucide-react";
import { getAiActionReadiness } from "../../services/aiReadiness";
import type { AiAction, Criterion, DecisionMatrix, MatrixOption } from "../../types/matrix";
import { createId } from "../../utils/ids";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

type GuidedMatrixSetupProps = {
  matrix: DecisionMatrix;
  onChange: (matrix: DecisionMatrix) => void;
  onOpenOptions: () => void;
  onOpenCriteria: () => void;
  onOpenScoring: () => void;
  onOpenResults: () => void;
  onRequestAiAction: (action: AiAction) => void;
};

type AiSetupButtonProps = {
  action: AiAction;
  children: string;
  icon: JSX.Element;
  matrix: DecisionMatrix;
  onRequestAiAction: (action: AiAction) => void;
};

const createOption = (): MatrixOption => ({
  id: createId("option"),
  name: "New option",
  description: "",
  notes: ""
});

const createCriterion = (): Criterion => ({
  id: createId("criterion"),
  category: "General",
  name: "New criterion",
  description: "",
  weight: 3,
  isMustHave: false
});

const AiSetupButton = ({
  action,
  children,
  icon,
  matrix,
  onRequestAiAction
}: AiSetupButtonProps) => {
  const readiness = getAiActionReadiness(action, matrix);

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        icon={icon}
        disabled={!readiness.isReady}
        onClick={() => onRequestAiAction(action)}
      >
        {children}
      </Button>
      {!readiness.isReady && readiness.reason ? (
        <p className="max-w-sm text-xs font-semibold leading-5 text-ink-500">
          {readiness.reason}
        </p>
      ) : null}
    </div>
  );
};

export const GuidedMatrixSetup = ({
  matrix,
  onChange,
  onOpenOptions,
  onOpenCriteria,
  onOpenScoring,
  onOpenResults,
  onRequestAiAction
}: GuidedMatrixSetupProps) => {
  const addOption = () => {
    onChange({
      ...matrix,
      options: [...matrix.options, createOption()]
    });
    onOpenOptions();
  };

  const addCriterion = () => {
    onChange({
      ...matrix,
      criteria: [...matrix.criteria, createCriterion()]
    });
    onOpenCriteria();
  };

  if (matrix.options.length === 0) {
    return (
      <Card className="p-6" tone="accent">
        <Badge tone="green">Guided setup</Badge>
        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <h2 className="text-2xl font-bold text-ink-900">Step 1: Add options</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">
              Options are the choices you want to compare. Start by adding the choices you already
              know, or ask AI for a draft list you can edit.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <AiSetupButton
              action="suggestOptions"
              icon={<Lightbulb className="h-4 w-4" />}
              matrix={matrix}
              onRequestAiAction={onRequestAiAction}
            >
              Suggest options with AI
            </AiSetupButton>
            <Button icon={<Plus className="h-4 w-4" />} onClick={addOption}>
              Add option manually
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (matrix.criteria.length === 0) {
    return (
      <Card className="p-6" tone="accent">
        <Badge tone="green">Guided setup</Badge>
        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <h2 className="text-2xl font-bold text-ink-900">Step 2: Add criteria</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">
              Criteria are the factors used to judge each option. Once you add criteria, the app
              can calculate weighted results.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <AiSetupButton
              action="generateCriteria"
              icon={<ListChecks className="h-4 w-4" />}
              matrix={matrix}
              onRequestAiAction={onRequestAiAction}
            >
              Generate criteria with AI
            </AiSetupButton>
            <Button icon={<Plus className="h-4 w-4" />} onClick={addCriterion}>
              Add criterion manually
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (matrix.scores.length === 0) {
    return (
      <Card className="p-6" tone="accent">
        <Badge tone="green">Guided setup</Badge>
        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <h2 className="text-2xl font-bold text-ink-900">Step 3: Score your options</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">
              Score each option from 0 to 5 for every criterion. AI can draft scores, but you
              review and edit them before they change the matrix.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <AiSetupButton
              action="suggestScores"
              icon={<ClipboardCheck className="h-4 w-4" />}
              matrix={matrix}
              onRequestAiAction={onRequestAiAction}
            >
              Suggest scores with AI
            </AiSetupButton>
            <Button icon={<ClipboardCheck className="h-4 w-4" />} onClick={onOpenScoring}>
              Score manually
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6" tone="accent">
      <Badge tone="green">Guided setup</Badge>
      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <h2 className="text-2xl font-bold text-ink-900">Step 4: Review your results</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">
            Your matrix has enough structure to compare the options. Review the ranking, then ask
            AI for a recommendation if you want a written second pass.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
          <Button icon={<BarChart3 className="h-4 w-4" />} onClick={onOpenResults}>
            View results
          </Button>
          <AiSetupButton
            action="generateRecommendation"
            icon={<Sparkles className="h-4 w-4" />}
            matrix={matrix}
            onRequestAiAction={onRequestAiAction}
          >
            Generate AI recommendation
          </AiSetupButton>
        </div>
      </div>
    </Card>
  );
};
