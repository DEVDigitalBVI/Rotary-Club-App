import { PROFILE_PHOTO_MAX_BYTES } from "@/lib/profile-photo";

const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
const MAX_DIMENSION = 1600;

export async function prepareProfilePhoto(source: File): Promise<File> {
  if (!source.type.startsWith("image/")) throw new Error("Choose an image from your photo library.");
  if (source.size > MAX_SOURCE_BYTES) throw new Error("That photo is unusually large. Choose one smaller than 25 MB.");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });
  } catch {
    throw new Error("This image format can’t be processed. Try a JPEG, PNG, or WebP photo.");
  }

  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    let width = Math.max(1, Math.round(bitmap.width * scale));
    let height = Math.max(1, Math.round(bitmap.height * scale));
    let quality = 0.86;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Your browser couldn’t prepare this photo.");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(bitmap, 0, 0, width, height);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (!blob) throw new Error("Your browser couldn’t prepare this photo.");
      if (blob.size <= PROFILE_PHOTO_MAX_BYTES) {
        const baseName = source.name.replace(/\.[^.]+$/, "") || "profile-photo";
        return new File([blob], `${baseName}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
      }

      quality = Math.max(0.68, quality - 0.06);
      width = Math.max(1, Math.round(width * 0.82));
      height = Math.max(1, Math.round(height * 0.82));
    }
  } finally {
    bitmap.close();
  }

  throw new Error("This photo couldn’t be reduced enough. Try a different image.");
}
