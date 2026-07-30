import type { ExportFile } from "@/lib/api";

/** Saves an export payload from the API to the user's machine. */
export function downloadExport(file: ExportFile) {
  const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
