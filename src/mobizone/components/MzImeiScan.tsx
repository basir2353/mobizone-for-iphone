import { useEffect, useRef, useState } from "react";
import { normalizeImeiScan } from "../normalizeImei";

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

declare global {
  interface Window {
    BarcodeDetector?: new (opts?: { formats?: string[] }) => BarcodeDetectorLike;
  }
}

export function MzImeiScanField({
  value,
  onChange,
  onApply,
  placeholder = "Enter or scan IMEI",
}: {
  value: string;
  onChange: (v: string) => void;
  onApply?: (imei: string) => void;
  placeholder?: string;
}) {
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorOk = typeof window !== "undefined" && !!window.BarcodeDetector;

  useEffect(() => {
    if (!scanning) return;
    let cancelled = false;
    let raf = 0;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        if (!window.BarcodeDetector) return;
        const detector = new window.BarcodeDetector({
          formats: ["qr_code", "code_128", "ean_13", "code_39"],
        });
        const tick = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const raw = codes[0]?.rawValue;
            if (raw) {
              const imei = normalizeImeiScan(raw);
              if (imei) {
                onChange(imei);
                onApply?.(imei);
                setScanning(false);
                return;
              }
            }
          } catch {
            /* keep scanning */
          }
          raf = requestAnimationFrame(() => void tick());
        };
        raf = requestAnimationFrame(() => void tick());
      } catch {
        window.alert("Camera unavailable — type IMEI manually.");
        setScanning(false);
      }
    }

    void start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [scanning, onApply, onChange]);

  return (
    <div className="mz-imei-scan">
      <div className="mz-row-gap">
        <input
          className="mz-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode="numeric"
          autoCapitalize="off"
          autoCorrect="off"
        />
        {detectorOk ? (
          <button type="button" className="mz-btn-navy" onClick={() => setScanning(true)}>
            Scan
          </button>
        ) : null}
        {onApply ? (
          <button
            type="button"
            className="mz-btn-primary"
            onClick={() => onApply(normalizeImeiScan(value))}
          >
            Find
          </button>
        ) : null}
      </div>
      {scanning ? (
        <div className="mz-scan-overlay">
          <video ref={videoRef} playsInline muted className="mz-scan-video" />
          <button type="button" className="mz-btn-ghost" onClick={() => setScanning(false)}>
            Close camera
          </button>
          <p className="mz-muted">Point at barcode / QR. Or type IMEI above.</p>
        </div>
      ) : null}
    </div>
  );
}
