import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { exportMatrixAsJson, parseMatrixImportFile } from "../../services/matrixImportExport";
import type { DecisionMatrix } from "../../types/matrix";
import { Button } from "../ui/Button";

type MatrixActionsProps = {
  matrix: DecisionMatrix;
  matrices: DecisionMatrix[];
  onImportMatrix: (matrix: DecisionMatrix) => Promise<void> | void;
};

export const MatrixActions = ({ matrix, matrices, onImportMatrix }: MatrixActionsProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async (file: File | undefined) => {
    if (!file) return;

    setIsImporting(true);
    setError(undefined);
    setMessage(undefined);

    try {
      const importedMatrix = await parseMatrixImportFile(file, matrices);
      await onImportMatrix(importedMatrix);
      setMessage(`Imported "${importedMatrix.title}".`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not import this matrix JSON file."
      );
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          icon={<Download className="h-4 w-4" />}
          onClick={() => {
            exportMatrixAsJson(matrix);
            setMessage("Exported JSON backup.");
            setError(undefined);
          }}
        >
          Export JSON
        </Button>
        <Button
          variant="outline"
          icon={<Upload className="h-4 w-4" />}
          isLoading={isImporting}
          onClick={() => fileInputRef.current?.click()}
        >
          Import JSON
        </Button>
        <input
          ref={fileInputRef}
          className="sr-only"
          type="file"
          accept="application/json,.json"
          onChange={(event) => void handleImport(event.target.files?.[0])}
        />
      </div>
      {message ? <p className="text-xs font-semibold text-brand-700">{message}</p> : null}
      {error ? <p className="text-xs font-semibold text-red-700">{error}</p> : null}
    </div>
  );
};
