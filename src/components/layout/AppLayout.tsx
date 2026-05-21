import type { ReactNode } from "react";
import type { DecisionMatrix } from "../../types/matrix";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

type AppLayoutProps = {
  children: ReactNode;
  matrices: DecisionMatrix[];
  activeMatrixId?: string;
  saveStatus?: "idle" | "saving" | "saved" | "error";
  onHome: () => void;
  onNewMatrix: () => void;
  onOpenMatrix: (id: string) => void;
};

export const AppLayout = ({
  children,
  matrices,
  activeMatrixId,
  saveStatus,
  onHome,
  onNewMatrix,
  onOpenMatrix
}: AppLayoutProps) => (
  <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d6f7ee_0,#f5f7fb_32rem)] text-ink-900">
    <Header onHome={onHome} onNewMatrix={onNewMatrix} saveStatus={saveStatus} />
    <div className="flex">
      <Sidebar
        matrices={matrices}
        activeMatrixId={activeMatrixId}
        onOpenMatrix={onOpenMatrix}
      />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  </div>
);
