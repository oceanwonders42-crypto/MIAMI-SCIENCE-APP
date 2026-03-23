"use client";

import Link from "next/link";
import { useState } from "react";
import type { CartItemWithProduct } from "@/lib/cart";
import { formatPrice } from "@/lib/products";
import { ROUTES } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/Card";
import { updateCartQuantityAction, removeFromCartAction } from "./actions";

interface CartItemListProps {
  items: CartItemWithProduct[];
}

export function CartItemList({ items: initialItems }: CartItemListProps) {
  const [items, setItems] = useState(initialItems);
  const [updating, setUpdating] = useState<string | null>(null);

  async function handleQuantityChange(productId: string, newQuantity: number) {
    if (newQuantity < 1) {
      const ok = await removeFromCartAction(productId);
      if (ok.ok) setItems((prev) => prev.filter((i) => i.product_id !== productId));
      return;
    }
    setUpdating(productId);
    const result = await updateCartQuantityAction(productId, newQuantity);
    setUpdating(null);
    if (result.ok) {
      setItems((prev) =>
        prev.map((i) =>
          i.product_id === productId ? { ...i, quantity: newQuantity } : i
        )
      );
    }
  }

  async function handleRemove(productId: string) {
    const ok = await removeFromCartAction(productId);
    if (ok.ok) setItems((prev) => prev.filter((i) => i.product_id !== productId));
  }

  return (
    <Card>
      <CardContent className="p-0 divide-y divide-zinc-200 dark:divide-zinc-700">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex gap-3 p-4"
          >
            <div className="shrink-0 w-16 h-16 rounded-lg bg-zinc-800 overflow-hidden relative">
              {item.product.image_url ? (
                <img
                  src={item.product.image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-zinc-400 text-xs">
                  No image
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`${ROUTES.catalog}/${item.product_id}`}
                className="font-medium text-zinc-100 hover:text-primary-400 transition-colors"
              >
                {item.product.name ?? "Product"}
              </Link>
              <p className="text-sm text-zinc-400 mt-0.5">
                {formatPrice(item.product.price_cents)} × {item.quantity}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center rounded-lg border border-zinc-700">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                    disabled={updating === item.product_id}
                    className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                    disabled={updating === item.product_id}
                    className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(item.product_id)}
                  disabled={updating === item.product_id}
                  className="text-sm text-zinc-500 hover:text-red-600 dark:hover:text-red-400"
                >
                  Remove
                </button>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-medium text-zinc-100">
                {formatPrice(
                  (item.product.price_cents ?? 0) * item.quantity
                ) ?? "—"}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
