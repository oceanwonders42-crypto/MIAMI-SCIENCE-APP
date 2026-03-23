"use client";

/**
 * Pick an image from camera or photo library on native (Capacitor).
 * Returns a data URL suitable for fetch().then(r => r.blob()).
 */
export async function pickProgressPhotoDataUrl(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.getPlatform() === "web") return null;
    const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
    const photo = await Camera.getPhoto({
      quality: 88,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt,
    });
    return photo.dataUrl ?? null;
  } catch {
    return null;
  }
}
