import type { ReactNode } from "react";
import { MzBottomNav } from "./MzBottomNav";
import { useMobizoneDb } from "./useMobizone";

export function MzShell({ children }: { children: ReactNode }) {
  const { ready } = useMobizoneDb();

  return (
    <div className="mz-shell">
      <main className="mz-main">
        {!ready ? (
          <div className="mz-loading">
            <div className="mz-spinner" />
            <p>Loading shop data…</p>
          </div>
        ) : (
          children
        )}
      </main>
      <MzBottomNav />
    </div>
  );
}
