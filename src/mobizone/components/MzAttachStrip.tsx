import { useRef, useState } from "react";
import { captureWithCamera, pickFromGallery, type CaptureKind } from "../mediaCapture";

export type AttachBundle = {
  photoDataUrl: string | null;
  cnicFrontDataUrl: string | null;
  cnicBackDataUrl: string | null;
  otherPhotoDataUrl?: string | null;
};

type Slot = {
  key: keyof AttachBundle;
  kind: CaptureKind;
  label: string;
  hint: string;
};

const SLOTS: Slot[] = [
  { key: "photoDataUrl", kind: "photo", label: "Face photo", hint: "Camera" },
  { key: "cnicFrontDataUrl", kind: "cnic-front", label: "CNIC front", hint: "ID" },
  { key: "cnicBackDataUrl", kind: "cnic-back", label: "CNIC back", hint: "ID" },
  { key: "otherPhotoDataUrl", kind: "photo", label: "Other", hint: "Any" },
];

export function MzAttachStrip({
  value,
  onChange,
  photoLabel = "Face photo",
}: {
  value: AttachBundle;
  onChange: (next: AttachBundle) => void;
  photoLabel?: string;
}) {
  const [busy, setBusy] = useState<CaptureKind | null>(null);
  const galleryRef = useRef<{ slot: Slot } | null>(null);

  async function capture(slot: Slot, fromGallery = false): Promise<void> {
    setBusy(slot.kind);
    try {
      const dataUrl = fromGallery
        ? await pickFromGallery(slot.kind)
        : await captureWithCamera(slot.kind);
      if (!dataUrl) return;
      onChange({ ...value, [slot.key]: dataUrl });
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Could not open camera/gallery");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mz-attach">
      <p className="mz-attach-label">Photos · tap camera · long-press gallery</p>
      <div className="mz-attach-grid">
        {SLOTS.map((slot) => {
          const uri = value[slot.key] ?? null;
          const label = slot.key === "photoDataUrl" ? photoLabel : slot.label;
          const loading = busy === slot.kind;
          return (
            <button
              key={slot.key}
              type="button"
              className="mz-attach-slot"
              onClick={() => void capture(slot, false)}
              onContextMenu={(e) => {
                e.preventDefault();
                galleryRef.current = { slot };
                void capture(slot, true);
              }}
            >
              {uri ? (
                <img src={uri} alt={label} className="mz-attach-img" />
              ) : (
                <div className="mz-attach-placeholder">{loading ? "…" : "📷"}</div>
              )}
              <span className="mz-attach-title">{uri ? `${label} ✓` : label}</span>
              <span className="mz-attach-hint">{slot.hint}</span>
              {uri ? (
                <span
                  className="mz-attach-clear"
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange({ ...value, [slot.key]: null });
                  }}
                >
                  ×
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
