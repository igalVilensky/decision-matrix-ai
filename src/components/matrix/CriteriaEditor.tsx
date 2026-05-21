import { Plus, Trash2 } from "lucide-react";
import type { Criterion, DecisionMatrix } from "../../types/matrix";
import { WEIGHT_LABELS, clampWeight } from "../../services/scoring";
import { createId } from "../../utils/ids";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";

type CriteriaEditorProps = {
  matrix: DecisionMatrix;
  onChange: (matrix: DecisionMatrix) => void;
};

const createCriterion = (): Criterion => ({
  id: createId("criterion"),
  category: "General",
  name: "New criterion",
  description: "",
  weight: 3,
  isMustHave: false
});

export const CriteriaEditor = ({ matrix, onChange }: CriteriaEditorProps) => {
  const updateCriterion = (criterionId: string, updates: Partial<Criterion>) => {
    onChange({
      ...matrix,
      criteria: matrix.criteria.map((criterion) =>
        criterion.id === criterionId ? { ...criterion, ...updates } : criterion
      )
    });
  };

  const deleteCriterion = (criterionId: string) => {
    onChange({
      ...matrix,
      criteria: matrix.criteria.filter((criterion) => criterion.id !== criterionId),
      scores: matrix.scores.filter((score) => score.criterionId !== criterionId)
    });
  };

  const addCriterion = () => {
    onChange({
      ...matrix,
      criteria: [...matrix.criteria, createCriterion()]
    });
  };

  const groupedCriteria = matrix.criteria.reduce<Record<string, Criterion[]>>((groups, criterion) => {
    const category = criterion.category || "General";
    return {
      ...groups,
      [category]: [...(groups[category] ?? []), criterion]
    };
  }, {});

  if (matrix.criteria.length === 0) {
    return (
      <EmptyState
        title="No criteria yet"
        description="Criteria are the lens for the decision. Add your own or ask AI to suggest practical criteria based on your goal."
        action={
          <Button icon={<Plus className="h-4 w-4" />} onClick={addCriterion}>
            Add criterion
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button icon={<Plus className="h-4 w-4" />} onClick={addCriterion}>
          Add criterion
        </Button>
      </div>
      {Object.entries(groupedCriteria).map(([category, criteria]) => (
        <section key={category} className="space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-ink-500">
              {category}
            </h3>
            <Badge>{criteria.length} criteria</Badge>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {criteria.map((criterion) => (
              <Card key={criterion.id} className="p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-ink-900">{criterion.name || "Unnamed criterion"}</h4>
                    {criterion.isMustHave ? <Badge tone="amber">Must-have</Badge> : null}
                    {criterion.aiGenerated ? <Badge tone="blue">AI-generated</Badge> : null}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    icon={<Trash2 className="h-4 w-4" />}
                    onClick={() => deleteCriterion(criterion.id)}
                  >
                    Delete criterion
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Category"
                    value={criterion.category}
                    onChange={(event) =>
                      updateCriterion(criterion.id, { category: event.target.value })
                    }
                  />
                  <Input
                    label="Name"
                    value={criterion.name}
                    onChange={(event) =>
                      updateCriterion(criterion.id, { name: event.target.value })
                    }
                  />
                  <div className="md:col-span-2">
                    <Textarea
                      label="Description"
                      value={criterion.description ?? ""}
                      onChange={(event) =>
                        updateCriterion(criterion.id, { description: event.target.value })
                      }
                    />
                  </div>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-ink-700">Weight</span>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={criterion.weight}
                      className="w-full accent-brand-600"
                      onChange={(event) =>
                        updateCriterion(criterion.id, {
                          weight: clampWeight(Number(event.target.value))
                        })
                      }
                    />
                    <span className="block text-xs font-semibold text-ink-500">
                      {criterion.weight} = {WEIGHT_LABELS[criterion.weight]}
                    </span>
                  </label>
                  <label className="flex items-center gap-3 rounded-lg border border-ink-200 bg-ink-50 px-3 py-3 text-sm font-semibold text-ink-700">
                    <input
                      type="checkbox"
                      checked={Boolean(criterion.isMustHave)}
                      className="h-4 w-4 rounded border-ink-300 text-brand-600"
                      onChange={(event) =>
                        updateCriterion(criterion.id, { isMustHave: event.target.checked })
                      }
                    />
                    Must-have criterion
                  </label>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
