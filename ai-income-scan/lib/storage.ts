const SCAN_ID_KEY = "ais_scan_id";
const ANSWERS_KEY = "ais_answers";
const RESULT_KEY = "ais_result";

function safeGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // sessionStorage kan geblokkeerd zijn (bv. privénavigatie) — dan verliezen
    // we alleen refresh-resilience, de scan blijft verder gewoon werken.
  }
}

function safeRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // no-op
  }
}

export const scanStorage = {
  getScanId: () => safeGet(SCAN_ID_KEY),
  setScanId: (id: string) => safeSet(SCAN_ID_KEY, id),

  getAnswers: (): Record<string, string> => {
    const raw = safeGet(ANSWERS_KEY);
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  },
  setAnswers: (answers: Record<string, string>) =>
    safeSet(ANSWERS_KEY, JSON.stringify(answers)),

  getResult: <T,>(): T | null => {
    const raw = safeGet(RESULT_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  setResult: (result: unknown) => safeSet(RESULT_KEY, JSON.stringify(result)),

  clearScan: () => {
    safeRemove(SCAN_ID_KEY);
    safeRemove(ANSWERS_KEY);
    safeRemove(RESULT_KEY);
  },
};
