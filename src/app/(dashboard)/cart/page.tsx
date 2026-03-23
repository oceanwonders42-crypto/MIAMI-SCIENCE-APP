import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getCartWithItems } from "@/lib/cart";
import { formatPrice } from "@/lib/products";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { ROUTES } from "@/lib/constants";
import { CartItemList } from "./CartItemList";

export default async function CartPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);

  const cartData = await getCartWithItems(supabase, user.id);
  const items = cartData?.items ?? [];
  const subtotalCents = items.reduce(
    (sum, i) => sum + (i.product.price_cents ?? 0) * i.quantity,
    0
  );

  return (
    <>
      <Header
        title="Cart"
        subtitle={items.length > 0 ? `${items.length} item(s)` : "Empty"}
      />
      <div className="px-4 md:px-6 space-y-6 pb-8">
        <Section title="Items">
          {items.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center space-y-4">
                <p className="text-sm text-zinc-400">
                  Your cart is empty. Add products from the catalog.
                </p>
                <Link
                  href={ROUTES.catalog}
                  className="inline-block rounded-lg bg-primary-500 hover:bg-primary-400 text-zinc-900 font-semibold py-2.5 px-4 text-sm transition-colors"
                >
                  Continue shopping
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              <CartItemList items={items} />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4">
                <p className="text-sm font-medium text-zinc-300">
                  Subtotal (estimate): {formatPrice(subtotalCents) ?? "—"}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={ROUTES.catalog}
                    className="rounded-lg border border-zinc-700 py-2.5 px-4 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    Continue shopping
                  </Link>
                  <Link
                    href={ROUTES.checkout}
                    className="rounded-lg bg-primary-500 hover:bg-primary-400 text-zinc-900 font-semibold py-2.5 px-4 text-sm transition-colors"
                  >
                    Proceed to checkout
                  </Link>
                </div>
              </div>
            </>
          )}
        </Section>
        <p className="text-sm">
          <Link href={ROUTES.catalog} className="text-primary-400 hover:text-primary-300 transition-colors">
            ← Back to catalog
          </Link>
        </p>
      </div>
    </>
  );
}
