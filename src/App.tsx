import { useEffect, useMemo, useRef, useState } from "react";
import { AppLayout } from "./components/layout/AppLayout";
import { CreateMatrixForm } from "./components/matrix/CreateMatrixForm";
import { Card } from "./components/ui/Card";
import { Modal } from "./components/ui/Modal";
import { useFirebaseAuth } from "./hooks/useFirebaseAuth";
import { HomePage } from "./pages/HomePage";
import { MatrixPage } from "./pages/MatrixPage";
import {
  deleteMatrix,
  duplicateMatrix,
  saveMatrix,
  seedSampleMatricesIfNeeded,
  subscribeToMatrices
} from "./services/matrixRepository";
import type { DecisionMatrix } from "./types/matrix";
import { currentTimestamp } from "./utils/dates";

type Route = { name: "home" } | { name: "matrix"; id: string };
type SaveStatus = "idle" | "saving" | "saved" | "error";

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
  const { uid, isAuthReady, isSigningIn, authError } = useFirebaseAuth();
  const [route, setRoute] = useState<Route>(() => parseRoute());
  const [matrices, setMatrices] = useState<DecisionMatrix[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | undefined>();
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

  useEffect(() => {
    if (!isAuthReady) return undefined;

    if (authError) {
      setIsDataLoading(false);
      setDataError(authError);
      return undefined;
    }

    if (!uid) {
      setIsDataLoading(false);
      setDataError("Firebase anonymous auth did not return a user id.");
      return undefined;
    }

    let isActive = true;
    let unsubscribe: (() => void) | undefined;

    setIsDataLoading(true);
    setDataError(undefined);

    void seedSampleMatricesIfNeeded(uid)
      .catch((error: unknown) => {
        if (!isActive) return;
        setDataError(
          error instanceof Error
            ? `Sample data could not be seeded: ${error.message}`
            : "Sample data could not be seeded."
        );
      })
      .finally(() => {
        if (!isActive) return;

        try {
          unsubscribe = subscribeToMatrices(
            uid,
            (nextMatrices) => {
              if (!isActive) return;
              setMatrices(nextMatrices);
              setDataError(undefined);
              setIsDataLoading(false);
            },
            (error) => {
              if (!isActive) return;
              setDataError(error.message);
              setIsDataLoading(false);
            }
          );
        } catch (error) {
          setDataError(
            error instanceof Error ? error.message : "Could not subscribe to matrices."
          );
          setIsDataLoading(false);
        }
      });

    return () => {
      isActive = false;
      unsubscribe?.();
    };
  }, [authError, isAuthReady, uid]);

  const activeMatrix = useMemo(
    () => (route.name === "matrix" ? matrices.find((matrix) => matrix.id === route.id) : undefined),
    [matrices, route]
  );

  const markSavedSoon = () => {
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => setSaveStatus("saved"), 120);
    window.setTimeout(() => setSaveStatus("idle"), 1600);
  };

  const handleSaveMatrix = async (matrix: DecisionMatrix) => {
    if (!uid) {
      setDataError("Cannot save until Firebase authentication is ready.");
      setSaveStatus("error");
      return;
    }

    setSaveStatus("saving");
    const optimisticMatrix = { ...matrix, updatedAt: currentTimestamp() };
    setMatrices((current) =>
      current
        .map((item) => (item.id === optimisticMatrix.id ? optimisticMatrix : item))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    );

    try {
      await saveMatrix(uid, optimisticMatrix);
      markSavedSoon();
    } catch (error) {
      setSaveStatus("error");
      setDataError(error instanceof Error ? error.message : "Could not save matrix.");
    }
  };

  const handleCreateMatrix = async (matrix: DecisionMatrix) => {
    if (!uid) {
      setDataError("Cannot create a matrix until Firebase authentication is ready.");
      return;
    }

    setSaveStatus("saving");
    try {
      const saved = await saveMatrix(uid, matrix);
      setIsCreateOpen(false);
      navigateMatrix(saved.id);
      markSavedSoon();
    } catch (error) {
      setSaveStatus("error");
      setDataError(error instanceof Error ? error.message : "Could not create matrix.");
    }
  };

  const handleDuplicateMatrix = async (id: string) => {
    if (!uid) {
      setDataError("Cannot duplicate until Firebase authentication is ready.");
      return;
    }

    setSaveStatus("saving");
    try {
      const duplicate = await duplicateMatrix(uid, id);
      markSavedSoon();
      if (!duplicate) return;
      navigateMatrix(duplicate.id);
    } catch (error) {
      setSaveStatus("error");
      setDataError(error instanceof Error ? error.message : "Could not duplicate matrix.");
    }
  };

  const handleDeleteMatrix = async (id: string) => {
    if (!uid) {
      setDataError("Cannot delete until Firebase authentication is ready.");
      return;
    }

    const shouldDelete = window.confirm("Delete this matrix from your Firebase workspace?");
    if (!shouldDelete) return;

    setSaveStatus("saving");
    try {
      await deleteMatrix(uid, id);
      markSavedSoon();
      if (route.name === "matrix" && route.id === id) {
        navigateHome();
      }
    } catch (error) {
      setSaveStatus("error");
      setDataError(error instanceof Error ? error.message : "Could not delete matrix.");
    }
  };

  const handleImportMatrix = async (matrix: DecisionMatrix) => {
    if (!uid) {
      throw new Error("Cannot import until Firebase authentication is ready.");
    }

    setSaveStatus("saving");
    try {
      const saved = await saveMatrix(uid, matrix);
      navigateMatrix(saved.id);
      markSavedSoon();
    } catch (error) {
      setSaveStatus("error");
      const message = error instanceof Error ? error.message : "Could not import matrix.";
      setDataError(message);
      throw new Error(message);
    }
  };

  const activeMatrixId = route.name === "matrix" ? route.id : undefined;
  const isLoading = !isAuthReady || isSigningIn || isDataLoading;
  const blockingError =
    authError || (!isLoading && dataError && matrices.length === 0 ? dataError : undefined);
  const inlineDataError = !blockingError ? dataError : undefined;

  return (
    <AppLayout
      matrices={matrices}
      activeMatrixId={activeMatrixId}
      saveStatus={saveStatus}
      onHome={navigateHome}
      onNewMatrix={() => setIsCreateOpen(true)}
      onOpenMatrix={navigateMatrix}
    >
      {isLoading ? (
        <div className="mx-auto max-w-3xl">
          <Card className="p-8 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
            <h1 className="text-2xl font-bold text-ink-900">Preparing your workspace</h1>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Signing in anonymously and loading your cloud-saved decision matrices.
            </p>
          </Card>
        </div>
      ) : blockingError ? (
        <div className="mx-auto max-w-3xl">
          <Card className="p-6">
            <h1 className="text-2xl font-bold text-ink-900">Firebase setup needs attention</h1>
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {blockingError}
            </p>
            <p className="mt-4 text-sm leading-6 text-ink-500">
              Add the required Vite Firebase environment variables and enable Anonymous
              Authentication in Firebase, then restart the dev server.
            </p>
          </Card>
        </div>
      ) : route.name === "home" ? (
        <>
          {inlineDataError ? (
            <div className="mx-auto mb-5 max-w-7xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {inlineDataError}
            </div>
          ) : null}
          <HomePage
            matrices={matrices}
            onCreateNew={() => setIsCreateOpen(true)}
            onOpenMatrix={navigateMatrix}
            onDuplicateMatrix={(id) => void handleDuplicateMatrix(id)}
            onDeleteMatrix={(id) => void handleDeleteMatrix(id)}
          />
        </>
      ) : (
        <>
          {inlineDataError ? (
            <div className="mx-auto mb-5 max-w-7xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {inlineDataError}
            </div>
          ) : null}
          <MatrixPage
            matrix={activeMatrix}
            matrices={matrices}
            onChange={(matrix) => void handleSaveMatrix(matrix)}
            onImportMatrix={handleImportMatrix}
            onBackHome={navigateHome}
          />
        </>
      )}
      <Modal
        title="Create new decision matrix"
        description="Start blank or use a practical template. Everything can be edited later."
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      >
        <CreateMatrixForm onCreate={(matrix) => void handleCreateMatrix(matrix)} />
      </Modal>
    </AppLayout>
  );
};
