"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CartItemWithProduct } from "@/lib/cart";
import { formatPrice } from "@/lib/products";
import { ROUTES } from "@/lib/constants";
import { submitCheckoutAction } from "./actions";
import type { CheckoutFormData } from "@/lib/checkout";

interface CheckoutFormProps {
  items: CartItemWithProduct[];
  defaultEmail: string;
}

const defaultForm: CheckoutFormData = {
  billing_first_name: "",
  billing_last_name: "",
  billing_address_1: "",
  billing_city: "",
  billing_state: "",
  billing_postcode: "",
  billing_country: "US",
  billing_email: "",
  billing_phone: "",
  shipping_same_as_billing: true,
  shipping_first_name: "",
  shipping_last_name: "",
  shipping_address_1: "",
  shipping_city: "",
  shipping_state: "",
  shipping_postcode: "",
  shipping_country: "US",
  coupon_code: "",
};

export function CheckoutForm({ items, defaultEmail }: CheckoutFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<CheckoutFormData>({
    ...defaultForm,
    billing_email: defaultEmail,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: true; message: string; order_number?: string } | { ok: false; error: string } | null>(null);

  const subtotalCents = items.reduce(
    (sum, i) => sum + (i.product.price_cents ?? 0) * i.quantity,
    0
  );

  function update(f: Partial<CheckoutFormData>) {
    setForm((prev) => ({ ...prev, ...f }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const r = await submitCheckoutAction(form);
    setLoading(false);
    setResult(r);
    if (r.ok) {
      const params = new URLSearchParams({ order_id: r.order_id });
      if (r.order_number) params.set("order_number", r.order_number);
      router.push(`${ROUTES.checkoutSuccess}?${params.toString()}`);
      return;
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-100">
          Order summary
        </h2>
        <ul className="border border-zinc-800 rounded-lg divide-y divide-zinc-800">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between px-4 py-2 text-sm">
              <span className="text-zinc-300">
                {item.product.name} × {item.quantity}
              </span>
              <span>
                {formatPrice((item.product.price_cents ?? 0) * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-sm font-medium text-zinc-300">
          Subtotal (estimate): {formatPrice(subtotalCents)}
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-100">
          Billing
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            placeholder="First name"
            value={form.billing_first_name}
            onChange={(e) => update({ billing_first_name: e.target.value })}
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
          />
          <input
            type="text"
            placeholder="Last name"
            value={form.billing_last_name}
            onChange={(e) => update({ billing_last_name: e.target.value })}
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
          />
        </div>
        <input
          type="email"
          placeholder="Email"
          value={form.billing_email}
          onChange={(e) => update({ billing_email: e.target.value })}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
        />
        <input
          type="tel"
          placeholder="Phone"
          value={form.billing_phone}
          onChange={(e) => update({ billing_phone: e.target.value })}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
        />
        <input
          type="text"
          placeholder="Address"
          value={form.billing_address_1}
          onChange={(e) => update({ billing_address_1: e.target.value })}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            type="text"
            placeholder="City"
            value={form.billing_city}
            onChange={(e) => update({ billing_city: e.target.value })}
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
          />
          <input
            type="text"
            placeholder="State"
            value={form.billing_state}
            onChange={(e) => update({ billing_state: e.target.value })}
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
          />
          <input
            type="text"
            placeholder="Postcode"
            value={form.billing_postcode}
            onChange={(e) => update({ billing_postcode: e.target.value })}
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
          />
        </div>
        <input
          type="text"
          placeholder="Country"
          value={form.billing_country}
          onChange={(e) => update({ billing_country: e.target.value })}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
        />
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.shipping_same_as_billing}
            onChange={(e) => update({ shipping_same_as_billing: e.target.checked })}
            className="rounded border-zinc-700"
          />
          Shipping same as billing
        </label>
        {!form.shipping_same_as_billing && (
          <div className="grid gap-3 pt-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder="First name"
                value={form.shipping_first_name}
                onChange={(e) => update({ shipping_first_name: e.target.value })}
                className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
              />
              <input
                type="text"
                placeholder="Last name"
                value={form.shipping_last_name}
                onChange={(e) => update({ shipping_last_name: e.target.value })}
                className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
              />
            </div>
            <input
              type="text"
              placeholder="Address"
              value={form.shipping_address_1}
              onChange={(e) => update({ shipping_address_1: e.target.value })}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                type="text"
                placeholder="City"
                value={form.shipping_city}
                onChange={(e) => update({ shipping_city: e.target.value })}
                className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
              />
              <input
                type="text"
                placeholder="State"
                value={form.shipping_state}
                onChange={(e) => update({ shipping_state: e.target.value })}
                className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
              />
              <input
                type="text"
                placeholder="Postcode"
                value={form.shipping_postcode}
                onChange={(e) => update({ shipping_postcode: e.target.value })}
                className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
              />
            </div>
            <input
              type="text"
              placeholder="Country"
              value={form.shipping_country}
              onChange={(e) => update({ shipping_country: e.target.value })}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">
          Coupon (optional)
        </label>
        <input
          type="text"
          placeholder="Coupon code"
          value={form.coupon_code}
          onChange={(e) => update({ coupon_code: e.target.value })}
          className="w-full max-w-xs rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
        />
      </div>

      {result && !result.ok && (
        <p className="text-sm text-red-600 dark:text-red-400">{result.error}</p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="rounded-lg bg-primary-500 hover:bg-primary-400 text-zinc-900 font-semibold py-2.5 px-4 text-sm disabled:opacity-50 min-w-[10rem] transition-colors"
        >
          {loading ? "Creating order…" : "Place order"}
        </button>
        <Link
          href={ROUTES.cart}
          className="rounded-lg border border-zinc-700 py-2.5 px-4 text-sm font-medium text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          Back to cart
        </Link>
      </div>
    </form>
  );
}
