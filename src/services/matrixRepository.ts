import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  writeBatch,
  type Unsubscribe
} from "firebase/firestore";
import { sampleMatrices } from "../data/sampleMatrices";
import { decisionMatrixSchema } from "../schemas/matrixSchemas";
import type { DecisionMatrix } from "../types/matrix";
import { currentTimestamp } from "../utils/dates";
import { createId } from "../utils/ids";
import { getFirebaseServices } from "./firebase";

type MatrixSubscriber = (matrices: DecisionMatrix[]) => void;
type RepositoryErrorHandler = (error: Error) => void;

type AppMetadata = {
  samplesSeeded?: boolean;
  seededAt?: string;
};

const sortByUpdatedAt = (matrices: DecisionMatrix[]): DecisionMatrix[] =>
  [...matrices].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

const toFirestoreMatrix = (matrix: DecisionMatrix): DecisionMatrix =>
  JSON.parse(JSON.stringify(matrix)) as DecisionMatrix;

const matrixCollectionPath = (uid: string) => ["users", uid, "matrices"] as const;

const matrixDocumentPath = (uid: string, matrixId: string) =>
  ["users", uid, "matrices", matrixId] as const;

const appMetaDocumentPath = (uid: string) => ["users", uid, "meta", "app"] as const;

const parseMatrix = (data: unknown, fallbackId?: string): DecisionMatrix => {
  const withFallbackId =
    typeof data === "object" && data !== null && fallbackId
      ? { id: fallbackId, ...data }
      : data;
  return decisionMatrixSchema.parse(withFallbackId);
};

const cloneMatrixWithIds = (matrix: DecisionMatrix, title: string): DecisionMatrix => {
  const timestamp = currentTimestamp();
  const duplicate: DecisionMatrix = {
    ...matrix,
    id: createId("matrix"),
    title,
    createdAt: timestamp,
    updatedAt: timestamp,
    options: matrix.options.map((option) => ({ ...option, id: createId("option") })),
    criteria: matrix.criteria.map((criterion) => ({ ...criterion, id: createId("criterion") })),
    scores: []
  };

  const optionMap = new Map(
    matrix.options.map((option, index) => [option.id, duplicate.options[index].id])
  );
  const criterionMap = new Map(
    matrix.criteria.map((criterion, index) => [criterion.id, duplicate.criteria[index].id])
  );

  duplicate.scores = matrix.scores
    .map((score) => {
      const optionId = optionMap.get(score.optionId);
      const criterionId = criterionMap.get(score.criterionId);
      if (!optionId || !criterionId) return undefined;
      return { ...score, optionId, criterionId };
    })
    .filter((score): score is DecisionMatrix["scores"][number] => Boolean(score));

  if (matrix.actionChecklist) {
    const generatedForOptionId = matrix.actionChecklist.generatedForOptionId
      ? optionMap.get(matrix.actionChecklist.generatedForOptionId)
      : undefined;

    duplicate.actionChecklist = {
      ...matrix.actionChecklist,
      id: createId("checklist"),
      generatedForOptionId,
      items: matrix.actionChecklist.items.map((item) => ({
        ...item,
        id: createId("action")
      })),
      createdAt: timestamp,
      updatedAt: timestamp
    };
  }

  return duplicate;
};

export const subscribeToMatrices = (
  uid: string,
  callback: MatrixSubscriber,
  onError?: RepositoryErrorHandler
): Unsubscribe => {
  const { db } = getFirebaseServices();
  const matricesQuery = query(collection(db, ...matrixCollectionPath(uid)), orderBy("updatedAt", "desc"));

  return onSnapshot(
    matricesQuery,
    (snapshot) => {
      const matrices: DecisionMatrix[] = [];
      snapshot.docs.forEach((snapshotDoc) => {
        const parsed = decisionMatrixSchema.safeParse({
          id: snapshotDoc.id,
          ...snapshotDoc.data()
        });

        if (parsed.success) {
          matrices.push(parsed.data);
          return;
        }

        onError?.(new Error(`Saved matrix ${snapshotDoc.id} has an unexpected shape.`));
      });

      callback(sortByUpdatedAt(matrices));
    },
    (error) => {
      onError?.(new Error(`Could not load matrices: ${error.message}`));
    }
  );
};

export const getMatrix = async (uid: string, id: string): Promise<DecisionMatrix | undefined> => {
  const { db } = getFirebaseServices();
  const snapshot = await getDoc(doc(db, ...matrixDocumentPath(uid, id)));
  if (!snapshot.exists()) return undefined;
  return parseMatrix(snapshot.data(), snapshot.id);
};

export const saveMatrix = async (
  uid: string,
  matrix: DecisionMatrix
): Promise<DecisionMatrix> => {
  const { db } = getFirebaseServices();
  const savedMatrix = decisionMatrixSchema.parse({
    ...matrix,
    updatedAt: currentTimestamp()
  });
  await setDoc(doc(db, ...matrixDocumentPath(uid, savedMatrix.id)), toFirestoreMatrix(savedMatrix));
  return savedMatrix;
};

export const deleteMatrix = async (uid: string, id: string): Promise<void> => {
  const { db } = getFirebaseServices();
  await deleteDoc(doc(db, ...matrixDocumentPath(uid, id)));
};

export const duplicateMatrix = async (
  uid: string,
  id: string
): Promise<DecisionMatrix | undefined> => {
  const matrix = await getMatrix(uid, id);
  if (!matrix) return undefined;

  const duplicate = cloneMatrixWithIds(matrix, `${matrix.title} copy`);
  return saveMatrix(uid, duplicate);
};

export const seedSampleMatricesIfNeeded = async (uid: string): Promise<void> => {
  const { db } = getFirebaseServices();
  const metaRef = doc(db, ...appMetaDocumentPath(uid));
  const metaSnapshot = await getDoc(metaRef);
  const metadata = metaSnapshot.exists() ? (metaSnapshot.data() as AppMetadata) : undefined;

  if (metadata?.samplesSeeded) return;

  const existingSamples = await getDocs(collection(db, ...matrixCollectionPath(uid)));
  const existingIds = new Set(existingSamples.docs.map((snapshotDoc) => snapshotDoc.id));
  const batch = writeBatch(db);
  const timestamp = currentTimestamp();

  sampleMatrices.forEach((matrix) => {
    if (existingIds.has(matrix.id)) return;
    const seededMatrix = decisionMatrixSchema.parse({
      ...matrix,
      createdAt: matrix.createdAt || timestamp,
      updatedAt: timestamp
    });
    batch.set(doc(db, ...matrixDocumentPath(uid, seededMatrix.id)), toFirestoreMatrix(seededMatrix));
  });

  batch.set(metaRef, {
    samplesSeeded: true,
    seededAt: timestamp
  });

  await batch.commit();
};
