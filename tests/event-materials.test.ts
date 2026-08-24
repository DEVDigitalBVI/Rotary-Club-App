import { describe, expect, it } from "vitest";
import {
  EVENT_MATERIAL_MAX_BYTES,
  eventMaterialExtension,
  eventMaterialStoragePath,
  validateEventMaterial,
} from "../lib/event-materials";

describe("event material validation", () => {
  it("accepts supported flyer and agenda types", () => {
    expect(validateEventMaterial({ size: 1, type: "image/png" }, "flyer")).toBeNull();
    expect(validateEventMaterial({ size: 1, type: "application/pdf" }, "agenda")).toBeNull();
  });

  it("rejects empty, oversized, and mismatched files", () => {
    expect(validateEventMaterial({ size: 0, type: "image/png" }, "flyer")).toMatch(/choose/i);
    expect(
      validateEventMaterial({ size: EVENT_MATERIAL_MAX_BYTES + 1, type: "image/png" }, "flyer")
    ).toMatch(/10 mb/i);
    expect(validateEventMaterial({ size: 1, type: "text/html" }, "flyer")).toMatch(/flyers/i);
    expect(validateEventMaterial({ size: 1, type: "image/png" }, "agenda")).toMatch(/agendas/i);
  });

  it("derives storage extensions from trusted MIME types", () => {
    expect(eventMaterialExtension("image/jpeg")).toBe(".jpg");
    expect(eventMaterialExtension("application/pdf")).toBe(".pdf");
    expect(eventMaterialExtension("text/html")).toBe("");
  });
});

describe("event material cleanup paths", () => {
  it("extracts and decodes paths only from the configured public bucket", () => {
    expect(
      eventMaterialStoragePath(
        "https://example.supabase.co/storage/v1/object/public/event-materials/event-1/agenda%20file.pdf"
      )
    ).toBe("event-1/agenda file.pdf");
    expect(eventMaterialStoragePath("https://example.com/unrelated/file.pdf")).toBeNull();
    expect(eventMaterialStoragePath(null)).toBeNull();
  });
});
