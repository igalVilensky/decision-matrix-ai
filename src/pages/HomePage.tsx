import { Plus } from "lucide-react";
import type { DecisionMatrix } from "../types/matrix";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { MatrixCard } from "../components/matrix/MatrixCard";

type HomePageProps = {
  matrices: DecisionMatrix[];
  onCreateNew: () => void;
  onOpenMatrix: (id: string) => void;
  onDuplicateMatrix: (id: string) => void;
  onDeleteMatrix: (id: string) => void;
};

export const HomePage = ({
  matrices,
  onCreateNew,
  onOpenMatrix,
  onDuplicateMatrix,
  onDeleteMatrix
}: HomePageProps) => (
  <div className="mx-auto max-w-7xl space-y-8">
    <section className="grid gap-6 rounded-2xl border border-white bg-white/75 p-6 shadow-soft backdrop-blur md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-8">
      <div>
        <h1 className="text-4xl font-black tracking-normal text-ink-900 sm:text-5xl">
          Decision Matrix AI
        </h1>
        <p className="mt-3 text-xl font-semibold text-ink-600">
          Compare anything. Decide with clarity.
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-500">
          Turn a fuzzy choice into options, criteria, weighted scores, explainable rankings, and
          an AI-assisted recommendation you can still edit.
        </p>
      </div>
      <Button size="lg" icon={<Plus className="h-5 w-5" />} onClick={onCreateNew}>
        Create new matrix
      </Button>
    </section>

    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-ink-900">Saved matrices</h2>
          <p className="mt-1 text-sm text-ink-500">
            Stored locally in this browser for the MVP.
          </p>
        </div>
      </div>

      {matrices.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {matrices.map((matrix) => (
            <MatrixCard
              key={matrix.id}
              matrix={matrix}
              onOpen={onOpenMatrix}
              onDuplicate={onDuplicateMatrix}
              onDelete={onDeleteMatrix}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No saved matrices"
          description="Create a decision matrix to start comparing options with weighted criteria."
          action={
            <Button icon={<Plus className="h-4 w-4" />} onClick={onCreateNew}>
              Create new matrix
            </Button>
          }
        />
      )}
    </section>
  </div>
);
