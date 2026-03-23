"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LoginPasswordResetBannerInner() {
  const searchParams = useSearchParams();
  if (searchParams.get("reset") !== "success") return null;
  return (
    <div
      role="status"
      className="rounded-[1.25rem] bg-emerald-950/40 border border-emerald-800/45 text-emerald-100 text-sm p-4 text-center leading-snug shadow-lg shadow-emerald-950/15"
    >
      <p className="font-semibold text-emerald-50">Password updated</p>
      <p className="mt-1 text-emerald-200/90">
        Sign in with your new password.
      </p>
    </div>
  );
}

export function LoginPasswordResetBanner() {
  return (
    <Suspense fallback={null}>
      <LoginPasswordResetBannerInner />
    </Suspense>
  );
}
