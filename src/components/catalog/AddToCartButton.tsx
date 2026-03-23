"use client";

import { useState } from "react";
import { addToCartAction } from "@/app/(dashboard)/cart/actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  quantity?: number;
  variant?: "default" | "primary";
  size?: "sm" | "md";
  className?: string;
}

export function AddToCartButton({
  productId,
  productName,
  quantity = 1,
  variant = "default",
  size = "md",
  className,
}: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleAdd() {
    setLoading(true);
    const result = await addToCartAction(productId, quantity);
    setLoading(false);
    if (result.ok) {
      router.refresh();
    }
  }

  const sizeClass = size === "sm" ? "py-1.5 px-3 text-xs" : "py-2.5 px-4 text-sm";
  const variantClass =
    variant === "primary"
      ? "bg-primary-500 hover:bg-primary-400 text-zinc-900 font-semibold"
      : "border border-zinc-700 hover:bg-zinc-800 text-zinc-200";

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={loading}
      className={cn(
        "rounded-lg font-medium transition-colors disabled:opacity-50",
        sizeClass,
        variantClass,
        className
      )}
      aria-label={`Add ${productName} to cart`}
    >
      {loading ? "Adding…" : "Add to cart"}
    </button>
  );
}
