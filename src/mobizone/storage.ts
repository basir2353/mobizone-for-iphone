const memory = new Map<string, string>();
let hydrated = false;

export function mzStorageGet(key: string): string | null {
  return memory.has(key) ? (memory.get(key) as string) : null;
}

export function mzStorageSet(key: string, value: string): void {
  memory.set(key, value);
  try {
    localStorage.setItem(key, value);
  } catch {
    /* quota / private mode */
  }
}

export function mzStorageRemove(key: string): void {
  memory.delete(key);
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export async function hydrateMobizoneStorage(branchCode: string): Promise<void> {
  const keys = [`mobizone-db-v2:${branchCode}`, `mobizone-db-v1:${branchCode}`];
  for (const key of keys) {
    try {
      if (memory.has(key)) continue;
      const raw = localStorage.getItem(key);
      if (raw && !memory.has(key)) memory.set(key, raw);
    } catch {
      /* ignore */
    }
  }
  // Also hydrate receipt settings key into memory if present
  try {
    const receiptKey = `mobizone-receipt-settings-v1:${branchCode || "MAIN"}`;
    if (!memory.has(receiptKey)) {
      const raw = localStorage.getItem(receiptKey);
      if (raw) memory.set(receiptKey, raw);
    }
  } catch {
    /* ignore */
  }
  hydrated = true;
}

export function isMobizoneStorageHydrated(): boolean {
  return hydrated;
}
