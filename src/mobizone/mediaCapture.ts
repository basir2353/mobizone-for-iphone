export type CaptureKind = "photo" | "cnic-front" | "cnic-back";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read photo"));
    reader.readAsDataURL(file);
  });
}

function pickViaInput(opts: { capture?: "user" | "environment" }): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    if (opts.capture) input.setAttribute("capture", opts.capture);
    input.style.display = "none";
    document.body.appendChild(input);
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      document.body.removeChild(input);
      if (!file) {
        resolve(null);
        return;
      }
      void readFileAsDataUrl(file).then(resolve).catch(() => resolve(null));
    });
    input.click();
  });
}

/** Prefer camera on mobile Safari; falls back to file picker. */
export async function captureWithCamera(kind: CaptureKind): Promise<string | null> {
  const isCnic = kind === "cnic-front" || kind === "cnic-back";
  return pickViaInput({ capture: isCnic ? "environment" : "user" });
}

export async function pickFromGallery(_kind: CaptureKind): Promise<string | null> {
  return pickViaInput({});
}

export async function pickAnyDocument(): Promise<{
  fileName: string;
  mimeType: string | null;
  sizeBytes: number;
  dataUrl: string;
} | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "*/*";
    input.style.display = "none";
    document.body.appendChild(input);
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      document.body.removeChild(input);
      if (!file) {
        resolve(null);
        return;
      }
      void readFileAsDataUrl(file)
        .then((dataUrl) =>
          resolve({
            fileName: file.name,
            mimeType: file.type || null,
            sizeBytes: file.size,
            dataUrl,
          }),
        )
        .catch(() => resolve(null));
    });
    input.click();
  });
}
