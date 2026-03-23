import Image from "next/image";
import { cn } from "@/lib/utils";

/** Minimal barbell mark for placeholder (inline SVG). */
function GymMark({ className }: { className?: string }) {
  return (
    <svg
      className={cn("text-primary-400/40", className)}
      viewBox="0 0 64 32"
      fill="none"
      aria-hidden
    >
      <path
        d="M4 16h8M52 16h8M12 14v4M48 14v4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="12" y="12" width="40" height="8" rx="2" fill="currentColor" opacity="0.15" />
      <rect x="8" y="10" width="4" height="12" rx="1" fill="currentColor" opacity="0.35" />
      <rect x="52" y="10" width="4" height="12" rx="1" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

export function ProductImageOrPlaceholder({
  imageUrl,
  name,
  className,
  priority,
}: {
  imageUrl: string | null;
  name: string;
  className?: string;
  priority?: boolean;
}) {
  if (imageUrl?.trim()) {
    return (
      <div className={cn("relative overflow-hidden bg-zinc-900", className)}>
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes="(max-width: 768px) 50vw, 33vw"
          className="object-cover"
          unoptimized
          priority={priority}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800/90 via-zinc-900 to-zinc-950 p-4 text-center",
        className
      )}
    >
      <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(ellipse_at_30%_20%,_var(--tw-gradient-stops))] from-primary-300 via-transparent to-transparent" />
      <GymMark className="relative z-[1] h-10 w-20 shrink-0" />
      <p className="relative z-[1] mt-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500 line-clamp-3 leading-snug">
        {name}
      </p>
    </div>
  );
}
