import { useEffect, useMemo, useRef, useState } from "react";
import { AboutCaseStudy } from "./components/about/AboutCaseStudy";
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

const MATRIX_SAVE_DEBOUNCE_MS = 700;

const sortMatricesByUpdatedAt = (items: DecisionMatrix[]): DecisionMatrix[] =>
  [...items].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

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
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const debounceSaveTimer = useRef<number | undefined>();
  const saveStatusTimer = useRef<number | undefined>();
  const pendingSaveMatrix = useRef<DecisionMatrix | undefined>();
  const saveVersion = useRef(0);
  const inFlightSave = useRef<Promise<void> | undefined>();
  const inFlightSaveMatrixId = useRef<string | undefined>();
  const isMounted = useRef(true);

  useEffect(() => {
    const onHashChange = () => setRoute(parseRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(
    () => {
      isMounted.current = true;

      return () => {
        isMounted.current = false;
        if (debounceSaveTimer.current) {
          window.clearTimeout(debounceSaveTimer.current);
        }
        if (saveStatusTimer.current) {
          window.clearTimeout(saveStatusTimer.current);
        }
      };
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
              const pendingMatrix = pendingSaveMatrix.current;
              if (!pendingMatrix) {
                setMatrices(nextMatrices);
              } else {
                setMatrices(
                  sortMatricesByUpdatedAt(
                    nextMatrices.some((matrix) => matrix.id === pendingMatrix.id)
                      ? nextMatrices.map((matrix) =>
                          matrix.id === pendingMatrix.id ? pendingMatrix : matrix
                        )
                      : [pendingMatrix, ...nextMatrices]
                  )
                );
              }
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

  const clearDebouncedSaveTimer = () => {
    if (debounceSaveTimer.current) {
      window.clearTimeout(debounceSaveTimer.current);
      debounceSaveTimer.current = undefined;
    }
  };

  const clearSaveStatusTimer = () => {
    if (saveStatusTimer.current) {
      window.clearTimeout(saveStatusTimer.current);
      saveStatusTimer.current = undefined;
    }
  };

  const hasOutstandingEditSave = () =>
    Boolean(pendingSaveMatrix.current || debounceSaveTimer.current || inFlightSave.current);

  const markSaving = () => {
    clearSaveStatusTimer();
    if (!isMounted.current) return;
    setSaveStatus("saving");
  };

  const markSavedSoon = () => {
    clearSaveStatusTimer();
    if (!isMounted.current) return;

    if (hasOutstandingEditSave()) {
      setSaveStatus("saving");
      return;
    }

    setSaveStatus("saved");
    saveStatusTimer.current = window.setTimeout(() => {
      if (!isMounted.current || hasOutstandingEditSave()) return;
      setSaveStatus("idle");
    }, 1600);
  };

  const setOptimisticMatrix = (matrix: DecisionMatrix) => {
    setMatrices((current) =>
      sortMatricesByUpdatedAt(
        current.map((item) => (item.id === matrix.id ? matrix : item))
      )
    );
  };

  const waitForInFlightSave = async (matrixId?: string) => {
    const savePromise = inFlightSave.current;
    if (!savePromise) return;
    if (matrixId && inFlightSaveMatrixId.current !== matrixId) return;

    await savePromise;
  };

  const flushPendingMatrixSave = async (
    matrixId?: string,
    shouldMarkSaved = true
  ): Promise<void> => {
    if (!uid) {
      setDataError("Cannot save until Firebase authentication is ready.");
      setSaveStatus("error");
      return;
    }

    if (matrixId && pendingSaveMatrix.current?.id !== matrixId) {
      await waitForInFlightSave(matrixId);
      return;
    }

    clearDebouncedSaveTimer();
    await waitForInFlightSave(matrixId);
    if (!isMounted.current) return;

    const matrixToSave = pendingSaveMatrix.current;
    if (!matrixToSave) return;
    if (matrixId && matrixToSave.id !== matrixId) return;

    clearDebouncedSaveTimer();
    const versionToSave = saveVersion.current;
    const savePromise = (async () => {
      let didSaveLatestMatrix = false;

      try {
        const saved = await saveMatrix(uid, matrixToSave);
        if (!isMounted.current) return;

        const isLatestSave =
          versionToSave === saveVersion.current &&
          pendingSaveMatrix.current?.id === saved.id;

        if (!isLatestSave) return;

        pendingSaveMatrix.current = undefined;
        setMatrices((current) =>
          sortMatricesByUpdatedAt(
            current.map((item) => (item.id === saved.id ? saved : item))
          )
        );
        didSaveLatestMatrix = true;
      } catch (error) {
        if (!isMounted.current || versionToSave !== saveVersion.current) return;
        clearSaveStatusTimer();
        setSaveStatus("error");
        setDataError(error instanceof Error ? error.message : "Could not save matrix.");
      } finally {
        inFlightSave.current = undefined;
        inFlightSaveMatrixId.current = undefined;
      }

      if (didSaveLatestMatrix && shouldMarkSaved) {
        markSavedSoon();
      }
    })();

    inFlightSave.current = savePromise;
    inFlightSaveMatrixId.current = matrixToSave.id;

    await savePromise;
  };

  const discardPendingMatrixSave = (matrixId: string) => {
    if (pendingSaveMatrix.current?.id !== matrixId) return;

    clearDebouncedSaveTimer();
    pendingSaveMatrix.current = undefined;
    saveVersion.current += 1;
  };

  const handleSaveMatrix = (matrix: DecisionMatrix) => {
    if (!uid) {
      setDataError("Cannot save until Firebase authentication is ready.");
      setSaveStatus("error");
      return;
    }

    const optimisticMatrix = { ...matrix, updatedAt: currentTimestamp() };
    pendingSaveMatrix.current = optimisticMatrix;
    saveVersion.current += 1;
    markSaving();
    setOptimisticMatrix(optimisticMatrix);
    clearDebouncedSaveTimer();
    debounceSaveTimer.current = window.setTimeout(() => {
      void flushPendingMatrixSave();
    }, MATRIX_SAVE_DEBOUNCE_MS);
  };

  const handleCreateMatrix = async (matrix: DecisionMatrix) => {
    if (!uid) {
      setDataError("Cannot create a matrix until Firebase authentication is ready.");
      return;
    }

    markSaving();
    try {
      const saved = await saveMatrix(uid, matrix);
      if (!isMounted.current) return;
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

    markSaving();
    try {
      await flushPendingMatrixSave(id, false);
      if (!isMounted.current) return;
      const duplicate = await duplicateMatrix(uid, id);
      if (!isMounted.current) return;
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

    const shouldDelete = window.confirm("Delete this matrix? This cannot be undone.");
    if (!shouldDelete) return;

    markSaving();
    discardPendingMatrixSave(id);
    await waitForInFlightSave(id);
    if (!isMounted.current) return;

    try {
      await deleteMatrix(uid, id);
      if (!isMounted.current) return;
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

    markSaving();
    try {
      const saved = await saveMatrix(uid, matrix);
      if (!isMounted.current) return;
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
      onAbout={() => setIsAboutOpen(true)}
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
            uid={uid}
            onChange={(matrix) => void handleSaveMatrix(matrix)}
            onImportMatrix={handleImportMatrix}
            onBackHome={navigateHome}
          />
        </>
      )}
      <Modal
        title="Create new decision matrix"
        description="Answer a few quick prompts, then start guided setup or preload a template."
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      >
        <CreateMatrixForm onCreate={(matrix) => void handleCreateMatrix(matrix)} />
      </Modal>
      <Modal
        title="About this project"
        description="A concise portfolio case study for Decision Matrix AI."
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      >
        <AboutCaseStudy />
      </Modal>
    </AppLayout>
  );
};
