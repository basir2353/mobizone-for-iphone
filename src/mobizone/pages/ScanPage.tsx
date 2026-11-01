import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MzAttachStrip, type AttachBundle } from "../components/MzAttachStrip";
import { MzImeiScanField } from "../components/MzImeiScan";
import { MzCard, MzChip, MzPrimaryButton, MzScreenTitle } from "../components/ui";
import { MzShell } from "../MzShell";
import { normalizeImeiScan } from "../normalizeImei";
import { findDeviceByImei, formatPkr } from "../storeCore";
import { useMobizoneDb } from "../useMobizone";

type Mode = "imei" | "cnic" | "photo";

export function ScanPage() {
  const nav = useNavigate();
  const { branchCode, refresh } = useMobizoneDb();
  const [mode, setMode] = useState<Mode>("imei");
  const [imeiDraft, setImeiDraft] = useState("");
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [attach, setAttach] = useState<AttachBundle>({
    photoDataUrl: null,
    cnicFrontDataUrl: null,
    cnicBackDataUrl: null,
  });

  const found = useMemo(() => {
    if (!lastScan) return null;
    return findDeviceByImei(branchCode, lastScan) ?? null;
  }, [branchCode, lastScan]);

  function applyImei(raw: string): void {
    const imei = normalizeImeiScan(raw);
    if (!imei) {
      window.alert("Could not read a valid IMEI from that scan.");
      return;
    }
    setImeiDraft(imei);
    setLastScan(imei);
    refresh();
    const device = findDeviceByImei(branchCode, imei);
    if (device) {
      if (window.confirm(`${device.brand} ${device.model}\n${imei}\n\nOpen sell?`)) {
        nav(`/sale?imei=${encodeURIComponent(imei)}`);
      }
    } else if (window.confirm(`${imei}\nNot in stock — open Buy to add?`)) {
      nav(`/purchase?imei=${encodeURIComponent(imei)}`);
    }
  }

  return (
    <MzShell>
      <div className="mz-page">
        <MzScreenTitle title="Scan & capture" subtitle="IMEI barcode · CNIC · face photo" />
        <div className="mz-chip-row">
          {(
            [
              ["imei", "IMEI"],
              ["cnic", "CNIC"],
              ["photo", "Photo"],
            ] as const
          ).map(([id, label]) => (
            <MzChip key={id} label={label} active={mode === id} onClick={() => setMode(id)} />
          ))}
        </div>

        {mode === "imei" ? (
          <MzCard className="mz-stack">
            <strong>IMEI / barcode scanner</strong>
            <p className="mz-muted">Scan barcode/QR, then open Sell (in stock) or Buy (new phone).</p>
            <MzImeiScanField value={imeiDraft} onChange={setImeiDraft} onApply={applyImei} />
            <MzPrimaryButton label="Save IMEI" onClick={() => applyImei(imeiDraft)} />
            {lastScan ? (
              <div className="mz-last-scan">
                <p className="mz-eyebrow light">LAST SCAN</p>
                <p className="mz-mono">{lastScan}</p>
                {found ? (
                  <p className="mz-muted">
                    {found.brand} {found.model} · ask {formatPkr(found.salePricePkr ?? 0)}
                  </p>
                ) : (
                  <p className="mz-muted">Not in stock</p>
                )}
              </div>
            ) : null}
          </MzCard>
        ) : null}

        {mode === "cnic" ? (
          <MzCard className="mz-stack">
            <strong>CNIC camera</strong>
            <p className="mz-muted">Capture front and back ID photos for Buy / Sell forms.</p>
            <MzAttachStrip value={attach} onChange={setAttach} photoLabel="Optional selfie" />
          </MzCard>
        ) : null}

        {mode === "photo" ? (
          <MzCard className="mz-stack">
            <strong>Face photo</strong>
            <p className="mz-muted">Front camera portrait for buyer / seller.</p>
            <MzAttachStrip value={attach} onChange={setAttach} photoLabel="Face photo" />
          </MzCard>
        ) : null}
      </div>
    </MzShell>
  );
}
