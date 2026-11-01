import { useCallback, useEffect, useState } from "react";
import {
  getMobizoneDashboard,
  loadMobizoneDb,
  seedFriendlyDefaults,
  type MobizoneDb,
} from "./storeCore";
import { hydrateMobizoneStorage } from "./storage";
import type { MobizoneDashboard } from "./types";

const BRANCH = "MAIN";

export function useMobizoneBranchCode(): string {
  return BRANCH;
}

export function useMobizoneDb(): {
  branchCode: string;
  db: MobizoneDb;
  ready: boolean;
  refresh: () => void;
  dashboard: MobizoneDashboard | null;
} {
  const branchCode = useMobizoneBranchCode();
  const [tick, setTick] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      await hydrateMobizoneStorage(branchCode);
      if (!alive) return;
      seedFriendlyDefaults(branchCode);
      if (!alive) return;
      setReady(true);
      setTick((n) => n + 1);
    })();
    return () => {
      alive = false;
    };
  }, [branchCode]);

  const refresh = useCallback(() => setTick((n) => n + 1), []);
  const db = ready ? loadMobizoneDb(branchCode) : loadMobizoneDb("__empty__");
  const dashboard = ready ? getMobizoneDashboard(branchCode) : null;
  void tick;

  return { branchCode, db, ready, refresh, dashboard };
}
