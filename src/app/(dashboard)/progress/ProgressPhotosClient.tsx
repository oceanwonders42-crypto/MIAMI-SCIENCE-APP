"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PROGRESS_PHOTOS_BUCKET } from "@/lib/progress-constants";
import { registerProgressPhotoAction, deleteProgressPhotoAction } from "./actions";
import { pickProgressPhotoDataUrl } from "@/lib/capacitor/pick-progress-photo";
import { isNativeCapacitor } from "@/lib/capacitor/native-push";
import type { ProgressPhotoSigned } from "@/lib/progress-photos";

function extFromMime(mime: string) {
  const t = mime.split("/")[1]?.toLowerCase() ?? "jpeg";
  if (t === "jpeg") return "jpg";
  return t.replace("heif", "heic");
}

export function ProgressPhotosClient({ photos }: { photos: ProgressPhotoSigned[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [recordedAt, setRecordedAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<ProgressPhotoSigned | null>(null);

  async function uploadBlob(blob: Blob, isoRecorded: string) {
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be signed in.");
      return;
    }
    const ext = extFromMime(blob.type || "image/jpeg");
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from(PROGRESS_PHOTOS_BUCKET).upload(path, blob, {
      contentType: blob.type || "image/jpeg",
      upsert: false,
    });
    if (upErr) {
      setError(upErr.message);
      return;
    }
    const reg = await registerProgressPhotoAction({
      storagePath: path,
      recorded_at: new Date(isoRecorded).toISOString(),
    });
    if (!reg.success) {
      setError(reg.error);
      return;
    }
    router.refresh();
  }

  async function onPickNative() {
    setLoading(true);
    setError(null);
    const dataUrl = await pickProgressPhotoDataUrl();
    if (!dataUrl) {
      setError("Could not get photo. Check camera / photo permissions.");
      setLoading(false);
      return;
    }
    try {
      const blob = await fetch(dataUrl).then((r) => r.blob());
      await uploadBlob(blob, new Date(recordedAt).toISOString());
    } catch {
      setError("Upload failed.");
    }
    setLoading(false);
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setLoading(true);
    setError(null);
    try {
      await uploadBlob(f, new Date(recordedAt).toISOString());
    } catch {
      setError("Upload failed.");
    }
    setLoading(false);
  }

  async function onDelete(id: string) {
    setError(null);
    const res = await deleteProgressPhotoAction(id);
    if (!res.success) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  const native = typeof window !== "undefined" && isNativeCapacitor();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="block text-[11px] text-zinc-500 mb-1">Photo date</label>
          <input
            type="datetime-local"
            value={recordedAt}
            onChange={(e) => setRecordedAt(e.target.value)}
            className="rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2 text-sm text-zinc-100"
          />
        </div>
        {native && (
          <button
            type="button"
            disabled={loading}
            onClick={() => void onPickNative()}
            className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold px-4 py-2.5 text-sm min-h-[44px] disabled:opacity-50"
          >
            {loading ? "…" : "Camera / library"}
          </button>
        )}
        <button
          type="button"
          disabled={loading}
          onClick={() => fileRef.current?.click()}
          className="rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-zinc-100 font-semibold px-4 py-2.5 text-sm min-h-[44px] disabled:opacity-50"
        >
          {loading ? "…" : "Choose file"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void onFileChange(e)}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {photos.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/[0.1] bg-zinc-900/30 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-zinc-300">Your visual timeline starts here</p>
          <p className="text-sm text-zinc-500 mt-2 max-w-md mx-auto">
            Progress photos help you see change beyond the scale. Add your first shot — front, side, or any angle you
            repeat over time.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {photos.map((p) => (
            <li
              key={p.id}
              className="rounded-2xl border border-white/[0.08] overflow-hidden bg-zinc-900/50 shadow-lg shadow-black/20"
            >
              {p.signedUrl ? (
                <button
                  type="button"
                  onClick={() => setLightbox(p)}
                  className="block w-full text-left focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.signedUrl} alt="" className="w-full aspect-[3/4] object-cover active:opacity-90" />
                </button>
              ) : (
                <div className="aspect-[3/4] flex items-center justify-center text-xs text-zinc-500 p-2">
                  Could not load preview
                </div>
              )}
              <div className="p-2 flex items-center justify-between gap-1">
                <span className="text-[11px] font-semibold text-zinc-400 truncate">
                  {new Date(p.recorded_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <button
                  type="button"
                  onClick={() => void onDelete(p.id)}
                  className="text-[10px] font-bold text-red-400/90 shrink-0 uppercase tracking-wide"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {lightbox?.signedUrl && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/92 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal
          onClick={() => setLightbox(null)}
        >
          <div className="max-h-[85vh] max-w-full overflow-auto" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.signedUrl}
              alt=""
              className="max-h-[82vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
            />
            <p className="mt-3 text-center text-sm font-semibold text-zinc-300">
              {new Date(lightbox.recorded_at).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
            <p className="mt-2 text-center text-xs text-zinc-500">Tap outside to close</p>
          </div>
        </div>
      )}
    </div>
  );
}
