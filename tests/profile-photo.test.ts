import { describe, expect, it } from "vitest";
import {
  PROFILE_PHOTO_MAX_BYTES,
  profilePhotoExtension,
  profilePhotoStoragePath,
  validateProfilePhoto,
} from "../lib/profile-photo";

describe("profile photos", () => {
  it("accepts supported images within the size limit", () => {
    expect(validateProfilePhoto(new File(["photo"], "photo.jpg", { type: "image/jpeg" }))).toBeNull();
  });

  it("rejects unsupported and oversized files", () => {
    expect(validateProfilePhoto(new File(["file"], "photo.gif", { type: "image/gif" }))).toMatch(/JPEG/);
    expect(validateProfilePhoto(new File([new Uint8Array(PROFILE_PHOTO_MAX_BYTES + 1)], "photo.png", { type: "image/png" }))).toMatch(/3 MB/);
  });

  it("maps MIME types and extracts owned storage paths", () => {
    expect(profilePhotoExtension("image/webp")).toBe(".webp");
    expect(profilePhotoStoragePath("https://example.supabase.co/storage/v1/object/public/profile-photos/member/avatar.jpg")).toBe("member/avatar.jpg");
    expect(profilePhotoStoragePath("https://example.com/avatar.jpg")).toBeNull();
  });
});
