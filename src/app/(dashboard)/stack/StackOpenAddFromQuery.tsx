"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

const OPEN_ADD_EVENT = "stack-open-add-supply";

export function StackOpenAddFromQuery() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const openAdd = searchParams.get("openAdd") === "1";

  useEffect(() => {
    if (!openAdd) return;
    window.dispatchEvent(new CustomEvent(OPEN_ADD_EVENT));
    const u = new URL(pathname, window.location.origin);
    router.replace(u.pathname);
  }, [openAdd, pathname, router]);

  return null;
}
