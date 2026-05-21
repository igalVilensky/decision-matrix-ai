import { useMemo, useState } from "react";
import {
  BarChart3,
  Bot,
  CheckSquare,
  Columns3,
  FileText,
  ListPlus,
  SlidersHorizontal
} from "lucide-react";
import type { DecisionMatrix } from "../types/matrix";
import { calculateMatrixResults } from "../services/scoring";
import { AiAssistantPanel } from "../components/matrix/AiAssistantPanel";
import { CriteriaEditor } from "../components/matrix/CriteriaEditor";
import { OptionEditor } from "../components/matrix/OptionEditor";
import { OverviewEditor } from "../components/matrix/OverviewEditor";
import { ResultsDashboard } from "../components/matrix/ResultsDashboard";
import { ScoringTable } from "../components/matrix/ScoringTable";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";

type MatrixPageProps = {
  matrix?: DecisionMatrix;
  onChange: (matrix: DecisionMatrix) => void;
  onBackHome: () => void;
};

type TabKey = "overview" | "options" | "criteria" | "scoring" | "results" | "ai";

const tabs: Array<{
  id: TabKey;
  label: string;
  icon: typeof FileText;
}> = [
  { id: "overview", label: "Overview", icon: FileText },
  { id: "options", label: "Options", icon: Columns3 },
  { id: "criteria", label: "Criteria", icon: SlidersHorizontal },
  { id: "scoring", label: "Scoring", icon: CheckSquare },
  { id: "results", label: "Results", icon: BarChart3 },
  { id: "ai", label: "AI Assistant", icon: Bot }
];

export const MatrixPage = ({ matrix, onChange, onBackHome }: MatrixPageProps) => {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const results = useMemo(() => (matrix ? calculateMatrixResults(matrix) : undefined), [matrix]);

  if (!matrix) {
    return (
      <div className="mx-auto max-w-4xl">
        <EmptyState
          title="Matrix not found"
          description="The matrix may have been deleted from local storage."
          action={
            <Button onClick={onBackHome}>
              Back home
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <Card className="p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="green">{matrix.category || "General"}</Badge>
              {matrix.aiSummary ? <Badge tone="blue">AI summary saved</Badge> : null}
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-normal text-ink-900">
              {matrix.title || "Untitled decision"}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-500">
              {matrix.goal || "Add context so the decision has a clear objective."}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:min-w-[420px]">
            <div className="rounded-lg bg-ink-50 p-3">
              <div className="text-2xl font-bold text-ink-900">{matrix.options.length}</div>
              <div className="text-xs font-semibold text-ink-500">Options</div>
            </div>
            <div className="rounded-lg bg-ink-50 p-3">
              <div className="text-2xl font-bold text-ink-900">{matrix.criteria.length}</div>
              <div className="text-xs font-semibold text-ink-500">Criteria</div>
            </div>
            <div className="rounded-lg bg-brand-50 p-3">
              <div className="truncate text-2xl font-bold text-brand-700">
                {results?.winner ? Math.round(results.winner.percentageFit) : 0}%
              </div>
              <div className="text-xs font-semibold text-brand-700">Top fit</div>
            </div>
          </div>
        </div>
      </Card>

      <div className="overflow-x-auto rounded-xl border border-ink-200 bg-white p-2 shadow-sm matrix-scrollbar">
        <div className="flex min-w-max gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-bold transition ${
                  isActive
                    ? "bg-ink-900 text-white"
                    : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "overview" ? <OverviewEditor matrix={matrix} onChange={onChange} /> : null}
      {activeTab === "options" ? <OptionEditor matrix={matrix} onChange={onChange} /> : null}
      {activeTab === "criteria" ? <CriteriaEditor matrix={matrix} onChange={onChange} /> : null}
      {activeTab === "scoring" ? <ScoringTable matrix={matrix} onChange={onChange} /> : null}
      {activeTab === "results" ? <ResultsDashboard matrix={matrix} /> : null}
      {activeTab === "ai" ? <AiAssistantPanel matrix={matrix} onChange={onChange} /> : null}

      {activeTab !== "ai" && matrix.options.length > 0 && matrix.criteria.length > 0 ? (
        <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between" tone="soft">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-brand-600 shadow-sm">
              <ListPlus className="h-5 w-5" />
            </span>
            <div>
              <div className="font-bold text-ink-900">Need another perspective?</div>
              <div className="text-sm text-ink-500">
                Ask AI to review criteria, draft scores, or generate a recommendation.
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={() => setActiveTab("ai")}>
            Open AI Assistant
          </Button>
        </Card>
      ) : null}
    </div>
  );
};
