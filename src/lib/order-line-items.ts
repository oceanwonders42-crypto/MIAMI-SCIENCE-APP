import type { SupabaseClient } from "@supabase/supabase-js";
import type { Order } from "@/types";

export type OrderLineItemDisplay = {
  name: string;
  quantity: number;
  product_id: string | null;
};

/** Normalize Woo-style line items for JSON metadata storage. */
export function compactLineItemsForMetadata(raw: unknown): OrderLineItemDisplay[] | null {
  if (!Array.isArray(raw)) return null;
  const out: OrderLineItemDisplay[] = [];
  for (const item of raw.slice(0, 80)) {
    if (item == null || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const name = typeof o.name === "string" && o.name.trim() ? o.name.trim() : "Item";
    const q = o.quantity != null ? Number(o.quantity) : 1;
    const quantity = Number.isFinite(q) && q > 0 ? Math.floor(q) : 1;
    const pid =
      o.product_id != null ? String(o.product_id) : o.id != null ? String(o.id) : null;
    out.push({ name, quantity, product_id: pid });
  }
  return out.length ? out : null;
}

/** Read line items from order.metadata (webhook / backfill). */
export function parseOrderLineItems(order: Order): OrderLineItemDisplay[] {
  const m = order.metadata;
  if (!m || typeof m !== "object") return [];
  const li = (m as Record<string, unknown>).line_items;
  if (!Array.isArray(li)) return [];
  return compactLineItemsForMetadata(li) ?? [];
}

export type EnrichedOrderLineItem = OrderLineItemDisplay & {
  image_url: string | null;
  /** From catalog when product_id matches */
  catalog_name: string | null;
};

/**
 * Batch-load product images/names from `products.external_id` (Woo product id) for line items.
 */
export async function enrichOrderLineItemsWithProducts(
  supabase: SupabaseClient,
  items: OrderLineItemDisplay[]
): Promise<EnrichedOrderLineItem[]> {
  if (items.length === 0) return [];
  const ids = [...new Set(items.map((i) => i.product_id).filter((x): x is string => Boolean(x)))];
  if (ids.length === 0) {
    return items.map((i) => ({ ...i, image_url: null, catalog_name: null }));
  }
  const { data, error } = await supabase
    .from("products")
    .select("external_id, image_url, name")
    .in("external_id", ids);
  if (error || !data?.length) {
    return items.map((i) => ({ ...i, image_url: null, catalog_name: null }));
  }
  const byExt = new Map(
    (data as { external_id: string | null; image_url: string | null; name: string }[]).map((p) => [
      p.external_id,
      p,
    ])
  );
  return items.map((i) => {
    const p = i.product_id ? byExt.get(i.product_id) : undefined;
    return {
      ...i,
      image_url: p?.image_url ?? null,
      catalog_name: p?.name ?? null,
    };
  });
}
