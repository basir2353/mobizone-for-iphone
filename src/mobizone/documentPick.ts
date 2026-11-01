import type { MobizoneDocumentAttachment } from "./types";
import { pickAnyDocument } from "./mediaCapture";

function newId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  return `doc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function pickReferenceDocuments(
  existing: MobizoneDocumentAttachment[],
): Promise<MobizoneDocumentAttachment[]> {
  if (existing.length >= 8) {
    throw new Error("Maximum 8 attachments");
  }
  const picked = await pickAnyDocument();
  if (!picked) return existing;
  return [
    ...existing,
    {
      id: newId(),
      fileName: picked.fileName,
      mimeType: picked.mimeType,
      sizeBytes: picked.sizeBytes,
      dataUrl: picked.dataUrl,
      uploadedAt: new Date().toISOString(),
    },
  ];
}
