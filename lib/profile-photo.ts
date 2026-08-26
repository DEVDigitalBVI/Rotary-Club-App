export const PROFILE_PHOTOS_BUCKET = "profile-photos";
export const PROFILE_PHOTO_MAX_BYTES = 3 * 1024 * 1024;
export const PROFILE_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export function validateProfilePhoto(file: File) {
  if (!PROFILE_PHOTO_TYPES.includes(file.type as (typeof PROFILE_PHOTO_TYPES)[number])) {
    return "Choose a JPEG, PNG, or WebP image.";
  }
  if (file.size > PROFILE_PHOTO_MAX_BYTES) {
    return "Choose an image smaller than 3 MB.";
  }
  return null;
}

export function profilePhotoExtension(type: string) {
  if (type === "image/png") return ".png";
  if (type === "image/webp") return ".webp";
  return ".jpg";
}

export function profilePhotoStoragePath(publicUrl: string | null | undefined) {
  if (!publicUrl) return null;
  const marker = `/storage/v1/object/public/${PROFILE_PHOTOS_BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(publicUrl.slice(index + marker.length));
}
