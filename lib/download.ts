import type { ExportFile } from "@/lib/api";

function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Saves an export payload from the API to the user's machine. */
export function downloadExport(file: ExportFile) {
  const mimeType = file.mimeType || "text/plain;charset=utf-8";
  const blob =
    file.format === "pdf"
      ? new Blob([base64ToBytes(file.content)], { type: mimeType })
      : new Blob([file.content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
