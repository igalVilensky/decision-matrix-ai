import { doc, getDoc, setDoc } from "firebase/firestore";
import { currentTimestamp } from "../utils/dates";
import { getFirebaseServices } from "./firebase";

export const ANONYMOUS_DAILY_AI_LIMIT = 20;

type DailyAiUsageDocument = {
  count?: number;
  date?: string;
  updatedAt?: string;
};

const usageDocumentPath = (uid: string, dateKey: string) =>
  ["users", uid, "usage", dateKey] as const;

export const getDailyUsageDateKey = (date = new Date()): string => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
};

const readCount = (data: DailyAiUsageDocument | undefined): number => {
  if (typeof data?.count !== "number" || !Number.isFinite(data.count)) return 0;
  return Math.max(0, Math.floor(data.count));
};

export const getDailyAiUsage = async (uid: string, dateKey: string): Promise<number> => {
  const { db } = getFirebaseServices();
  const snapshot = await getDoc(doc(db, ...usageDocumentPath(uid, dateKey)));

  if (!snapshot.exists()) return 0;

  return readCount(snapshot.data() as DailyAiUsageDocument);
};

export const incrementDailyAiUsage = async (
  uid: string,
  dateKey: string,
  limit: number
): Promise<number> => {
  const { db } = getFirebaseServices();
  const documentRef = doc(db, ...usageDocumentPath(uid, dateKey));
  const snapshot = await getDoc(documentRef);
  const currentCount = snapshot.exists()
    ? readCount(snapshot.data() as DailyAiUsageDocument)
    : 0;

  if (currentCount >= limit) {
    throw new Error(`You have used ${currentCount} of ${limit} AI requests today.`);
  }

  const nextCount = currentCount + 1;
  await setDoc(
    documentRef,
    {
      count: nextCount,
      date: dateKey,
      updatedAt: currentTimestamp()
    },
    { merge: true }
  );

  return nextCount;
};
