import { cn } from "@/lib/utils";

type StripVariant = "heroSkyline" | "midCity" | "scienceShore";

const BACKGROUNDS: Record<StripVariant, string> = {
  heroSkyline:
    "bg-[radial-gradient(120%_90%_at_20%_10%,rgba(244,114,182,0.35),transparent_58%),radial-gradient(90%_80%_at_80%_20%,rgba(99,102,241,0.35),transparent_60%),linear-gradient(120deg,rgba(24,24,27,1),rgba(39,39,42,0.98))]",
  midCity:
    "bg-[radial-gradient(110%_85%_at_85%_20%,rgba(34,197,94,0.25),transparent_60%),radial-gradient(100%_85%_at_15%_15%,rgba(14,165,233,0.25),transparent_58%),linear-gradient(115deg,rgba(17,24,39,1),rgba(15,23,42,0.98))]",
  scienceShore:
    "bg-[radial-gradient(95%_80%_at_20%_25%,rgba(168,85,247,0.28),transparent_58%),radial-gradient(95%_80%_at_78%_18%,rgba(236,72,153,0.25),transparent_58%),linear-gradient(120deg,rgba(9,9,11,1),rgba(24,24,27,0.98))]",
};

export function BrandAtmosphereStrip({
  variant,
  className,
  overlay = "strong",
}: {
  variant: StripVariant;
  className?: string;
  overlay?: "strong" | "soft";
}) {
  const overlayClass =
    overlay === "strong"
      ? "bg-gradient-to-r from-zinc-950/85 via-zinc-950/40 to-zinc-950/70"
      : "bg-gradient-to-b from-zinc-950/55 via-transparent to-zinc-950/55";

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden shrink-0",
        BACKGROUNDS[variant],
        className
      )}
      aria-hidden
    >
      <div className={cn("absolute inset-0", overlayClass)} />
    </div>
  );
}
