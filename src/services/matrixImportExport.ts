import { decisionMatrixSchema } from "../schemas/matrixSchemas";
import type { DecisionMatrix } from "../types/matrix";
import { currentTimestamp } from "../utils/dates";
import { createId } from "../utils/ids";

const sanitizeFileName = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "decision-matrix";

export const exportMatrixAsJson = (matrix: DecisionMatrix): void => {
  const blob = new Blob([JSON.stringify(matrix, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${sanitizeFileName(matrix.title)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const parseMatrixImportFile = async (
  file: File,
  existingMatrices: DecisionMatrix[]
): Promise<DecisionMatrix> => {
  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(await file.text()) as unknown;
  } catch {
    throw new Error("Imported file is not valid JSON.");
  }

  const parsedMatrix = decisionMatrixSchema.safeParse(parsedJson);
  if (!parsedMatrix.success) {
    throw new Error("Imported JSON is not a valid decision matrix.");
  }

  const existingTitles = new Set(
    existingMatrices.map((matrix) => matrix.title.trim().toLowerCase())
  );
  const timestamp = currentTimestamp();
  const shouldRename = existingTitles.has(parsedMatrix.data.title.trim().toLowerCase());

  return {
    ...parsedMatrix.data,
    id: createId("matrix"),
    title: shouldRename ? `${parsedMatrix.data.title} imported` : parsedMatrix.data.title,
    createdAt: timestamp,
    updatedAt: timestamp
  };
};
