import type { DecisionMatrix } from "../../types/matrix";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";

type OverviewEditorProps = {
  matrix: DecisionMatrix;
  onChange: (matrix: DecisionMatrix) => void;
};

export const OverviewEditor = ({ matrix, onChange }: OverviewEditorProps) => (
  <Card className="p-5">
    <div className="grid gap-4 lg:grid-cols-2">
      <Input
        label="Decision title"
        value={matrix.title}
        onChange={(event) => onChange({ ...matrix, title: event.target.value })}
      />
      <Input
        label="What are you comparing?"
        value={matrix.category}
        onChange={(event) => onChange({ ...matrix, category: event.target.value })}
      />
      <Textarea
        label="Goal/context"
        value={matrix.goal}
        onChange={(event) => onChange({ ...matrix, goal: event.target.value })}
      />
      <Textarea
        label="Constraints or priorities"
        value={matrix.constraints ?? ""}
        onChange={(event) => onChange({ ...matrix, constraints: event.target.value })}
      />
    </div>
  </Card>
);
