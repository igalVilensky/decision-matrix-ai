import { useEffect, useMemo, useRef, useState } from "react";
import { AppLayout } from "./components/layout/AppLayout";
import { CreateMatrixForm } from "./components/matrix/CreateMatrixForm";
import { Modal } from "./components/ui/Modal";
import { HomePage } from "./pages/HomePage";
import { MatrixPage } from "./pages/MatrixPage";
import type { DecisionMatrix } from "./types/matrix";
import {
  deleteMatrix,
  duplicateMatrix,
  getAllMatrices,
  saveMatrix
} from "./services/storage";

type Route = { name: "home" } | { name: "matrix"; id: string };
type SaveStatus = "idle" | "saving" | "saved";

const parseRoute = (): Route => {
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (hash.startsWith("matrix/")) {
    return { name: "matrix", id: hash.replace("matrix/", "") };
  }
  return { name: "home" };
};

const navigateHome = () => {
  window.location.hash = "/";
};

const navigateMatrix = (id: string) => {
  window.location.hash = `/matrix/${id}`;
};

export const App = () => {
  const [route, setRoute] = useState<Route>(() => parseRoute());
  const [matrices, setMatrices] = useState<DecisionMatrix[]>(() => getAllMatrices());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimer = useRef<number | undefined>();

  useEffect(() => {
    const onHashChange = () => setRoute(parseRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(
    () => () => {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
      }
    },
    []
  );

  const activeMatrix = useMemo(
    () => (route.name === "matrix" ? matrices.find((matrix) => matrix.id === route.id) : undefined),
    [matrices, route]
  );

  const refreshMatrices = () => setMatrices(getAllMatrices());

  const handleSaveMatrix = (matrix: DecisionMatrix) => {
    setSaveStatus("saving");
    const saved = saveMatrix(matrix);
    setMatrices((current) =>
      current
        .map((item) => (item.id === saved.id ? saved : item))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    );
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => setSaveStatus("saved"), 120);
    window.setTimeout(() => setSaveStatus("idle"), 1600);
  };

  const handleCreateMatrix = (matrix: DecisionMatrix) => {
    const saved = saveMatrix(matrix);
    refreshMatrices();
    setIsCreateOpen(false);
    navigateMatrix(saved.id);
  };

  const handleDuplicateMatrix = (id: string) => {
    const duplicate = duplicateMatrix(id);
    refreshMatrices();
    if (duplicate) {
      navigateMatrix(duplicate.id);
    }
  };

  const handleDeleteMatrix = (id: string) => {
    const shouldDelete = window.confirm("Delete this matrix from local storage?");
    if (!shouldDelete) return;
    deleteMatrix(id);
    refreshMatrices();
    if (route.name === "matrix" && route.id === id) {
      navigateHome();
    }
  };

  const activeMatrixId = route.name === "matrix" ? route.id : undefined;

  return (
    <AppLayout
      matrices={matrices}
      activeMatrixId={activeMatrixId}
      saveStatus={saveStatus}
      onHome={navigateHome}
      onNewMatrix={() => setIsCreateOpen(true)}
      onOpenMatrix={navigateMatrix}
    >
      {route.name === "home" ? (
        <HomePage
          matrices={matrices}
          onCreateNew={() => setIsCreateOpen(true)}
          onOpenMatrix={navigateMatrix}
          onDuplicateMatrix={handleDuplicateMatrix}
          onDeleteMatrix={handleDeleteMatrix}
        />
      ) : (
        <MatrixPage
          matrix={activeMatrix}
          onChange={handleSaveMatrix}
          onBackHome={navigateHome}
        />
      )}
      <Modal
        title="Create new decision matrix"
        description="Start blank or use a practical template. Everything can be edited later."
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      >
        <CreateMatrixForm onCreate={handleCreateMatrix} />
      </Modal>
    </AppLayout>
  );
};
