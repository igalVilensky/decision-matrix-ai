import { ChevronRight } from "lucide-react";
import type { DecisionMatrix } from "../../types/matrix";
import { formatRelativeDate } from "../../utils/dates";
import { Button } from "../ui/Button";

type SidebarProps = {
  matrices: DecisionMatrix[];
  activeMatrixId?: string;
  onOpenMatrix: (id: string) => void;
};

export const Sidebar = ({ matrices, activeMatrixId, onOpenMatrix }: SidebarProps) => (
  <aside className="hidden w-72 shrink-0 border-r border-ink-200 bg-white/70 lg:block">
    <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-4 matrix-scrollbar">
      <div className="mb-3 px-2 text-xs font-bold uppercase tracking-wider text-ink-400">
        Saved matrices
      </div>
      <div className="space-y-2">
        {matrices.slice(0, 12).map((matrix) => {
          const isActive = matrix.id === activeMatrixId;
          return (
            <Button
              key={matrix.id}
              variant="ghost"
              className={`h-auto w-full justify-between px-3 py-3 text-left ${
                isActive ? "bg-brand-50 text-brand-700" : ""
              }`}
              onClick={() => onOpenMatrix(matrix.id)}
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold">{matrix.title}</span>
                <span className="mt-1 block text-xs font-normal text-ink-500">
                  {matrix.options.length} options - {matrix.criteria.length} criteria -{" "}
                  {formatRelativeDate(matrix.updatedAt)}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </Button>
          );
        })}
      </div>
    </div>
  </aside>
);
