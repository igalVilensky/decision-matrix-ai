import { Plus, Trash2 } from "lucide-react";
import type { DecisionMatrix, MatrixOption } from "../../types/matrix";
import { createId } from "../../utils/ids";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";

type OptionEditorProps = {
  matrix: DecisionMatrix;
  onChange: (matrix: DecisionMatrix) => void;
};

const createOption = (): MatrixOption => ({
  id: createId("option"),
  name: "New option",
  description: "",
  notes: ""
});

export const OptionEditor = ({ matrix, onChange }: OptionEditorProps) => {
  const updateOption = (optionId: string, updates: Partial<MatrixOption>) => {
    onChange({
      ...matrix,
      options: matrix.options.map((option) =>
        option.id === optionId ? { ...option, ...updates } : option
      )
    });
  };

  const deleteOption = (optionId: string) => {
    onChange({
      ...matrix,
      options: matrix.options.filter((option) => option.id !== optionId),
      scores: matrix.scores.filter((score) => score.optionId !== optionId)
    });
  };

  const addOption = () => {
    onChange({
      ...matrix,
      options: [...matrix.options, createOption()]
    });
  };

  if (matrix.options.length === 0) {
    return (
      <EmptyState
        title="No options yet"
        description="Add the choices you want to compare. They can be products, jobs, apartments, cities, vendors, courses, or anything else."
        action={
          <Button icon={<Plus className="h-4 w-4" />} onClick={addOption}>
            Add option
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button icon={<Plus className="h-4 w-4" />} onClick={addOption}>
          Add option
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {matrix.options.map((option) => (
          <Card key={option.id} className="p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-ink-900">{option.name || "Unnamed option"}</h3>
                <p className="mt-1 text-sm text-ink-500">Choice to compare in this matrix.</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                icon={<Trash2 className="h-4 w-4" />}
                onClick={() => deleteOption(option.id)}
              >
                Delete option
              </Button>
            </div>
            <div className="space-y-4">
              <Input
                label="Name"
                value={option.name}
                onChange={(event) => updateOption(option.id, { name: event.target.value })}
              />
              <Textarea
                label="Description"
                value={option.description ?? ""}
                onChange={(event) =>
                  updateOption(option.id, { description: event.target.value })
                }
              />
              <Textarea
                label="Notes"
                value={option.notes ?? ""}
                onChange={(event) => updateOption(option.id, { notes: event.target.value })}
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
