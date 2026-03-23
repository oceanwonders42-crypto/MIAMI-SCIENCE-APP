import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { ROUTES, STORE_ORDERS_URL } from "@/lib/constants";

interface PageProps {
  searchParams: Promise<{ order_id?: string; order_number?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);

  const params = await searchParams;
  const order_id = params.order_id?.trim();
  const order_number = params.order_number?.trim();

  if (!order_id) {
    redirect(ROUTES.orders);
  }

  return (
    <>
      <Header title="Order confirmed" subtitle="Thank you" />
      <div className="px-4 md:px-6 space-y-6 pb-8">
        <Section title="Confirmation">
          <Card className="border-emerald-800/60 bg-emerald-950/30">
            <CardContent className="py-6 space-y-4">
              <p className="font-semibold text-emerald-300">
                Order {order_number ? `#${order_number}` : order_id} was created successfully.
              </p>
              <p className="text-sm text-zinc-400">
                It appears in Your Orders below. Complete payment when you receive the invoice or at the store. If the store uses Square or another payment flow, follow the instructions sent to you.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href={ROUTES.orders}
                  className="inline-flex items-center justify-center rounded-lg bg-primary-500 hover:bg-primary-400 text-zinc-900 font-semibold py-2.5 px-4 text-sm transition-colors"
                >
                  View your orders
                </Link>
                <a
                  href={STORE_ORDERS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-200 font-medium py-2.5 px-4 text-sm transition-colors"
                >
                  Open store account
                </a>
                <Link
                  href={ROUTES.catalog}
                  className="inline-flex items-center justify-center rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-200 font-medium py-2.5 px-4 text-sm transition-colors"
                >
                  Continue shopping
                </Link>
              </div>
            </CardContent>
          </Card>
        </Section>
        <p className="text-sm">
          <Link href={ROUTES.dashboard} className="text-primary-400 hover:text-primary-300 transition-colors">
            ← Back to dashboard
          </Link>
        </p>
      </div>
    </>
  );
}
