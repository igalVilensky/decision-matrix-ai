import { Copy, ExternalLink, Trash2 } from "lucide-react";
import type { DecisionMatrix } from "../../types/matrix";
import { formatRelativeDate } from "../../utils/dates";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

type MatrixCardProps = {
  matrix: DecisionMatrix;
  onOpen: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
};

export const MatrixCard = ({ matrix, onOpen, onDuplicate, onDelete }: MatrixCardProps) => (
  <Card className="flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
    <div className="min-w-0">
      <Badge tone="green">{matrix.category || "General"}</Badge>
      <h3 className="mt-3 truncate text-lg font-bold text-ink-900">{matrix.title}</h3>
    </div>
    <p className="mt-3 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-ink-500">
      {matrix.goal || "Start by adding the choices you want to compare."}
    </p>
    <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
      <div className="rounded-lg bg-ink-50 p-3">
        <div className="font-bold text-ink-900">{matrix.options.length}</div>
        <div className="text-xs text-ink-500">Options</div>
      </div>
      <div className="rounded-lg bg-ink-50 p-3">
        <div className="font-bold text-ink-900">{matrix.criteria.length}</div>
        <div className="text-xs text-ink-500">Criteria</div>
      </div>
      <div className="rounded-lg bg-ink-50 p-3">
        <div className="font-bold text-ink-900">{formatRelativeDate(matrix.updatedAt)}</div>
        <div className="text-xs text-ink-500">Updated</div>
      </div>
    </div>
    <div className="mt-5 flex flex-wrap gap-2">
      <Button
        className="flex-1"
        icon={<ExternalLink className="h-4 w-4" />}
        onClick={() => onOpen(matrix.id)}
      >
        Open
      </Button>
      <Button
        variant="outline"
        icon={<Copy className="h-4 w-4" />}
        onClick={() => onDuplicate(matrix.id)}
      >
        Duplicate
      </Button>
      <Button
        variant="danger"
        icon={<Trash2 className="h-4 w-4" />}
        onClick={() => onDelete(matrix.id)}
      >
        Delete
      </Button>
    </div>
  </Card>
);
