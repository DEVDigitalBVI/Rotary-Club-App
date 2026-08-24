export const EVENT_MATERIALS_BUCKET = "event-materials";
export const EVENT_MATERIAL_MAX_BYTES = 10 * 1024 * 1024;

export type EventMaterialKind = "flyer" | "agenda";

const MIME_EXTENSIONS: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

const ALLOWED_MIME_TYPES: Record<EventMaterialKind, ReadonlySet<string>> = {
  flyer: new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"]),
  agenda: new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]),
};

export function validateEventMaterial(
  file: Pick<File, "size" | "type">,
  kind: EventMaterialKind
): string | null {
  if (file.size === 0) return "Choose a file first.";
  if (file.size > EVENT_MATERIAL_MAX_BYTES) return "Files must be 10 MB or smaller.";
  if (!ALLOWED_MIME_TYPES[kind].has(file.type)) {
    return kind === "flyer"
      ? "Flyers must be PNG, JPEG, WebP, GIF, or SVG images."
      : "Agendas must be PDF, DOC, or DOCX files.";
  }
  return null;
}

export function eventMaterialExtension(mimeType: string) {
  return MIME_EXTENSIONS[mimeType] ?? "";
}

export function eventMaterialStoragePath(publicUrl: string | null | undefined) {
  if (!publicUrl) return null;

  try {
    const pathname = new URL(publicUrl).pathname;
    const marker = `/storage/v1/object/public/${EVENT_MATERIALS_BUCKET}/`;
    const markerIndex = pathname.indexOf(marker);
    if (markerIndex === -1) return null;
    return decodeURIComponent(pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}
