import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getCartWithItems } from "@/lib/cart";
import { getCustomerMappingByUserId } from "@/lib/customer-mapping";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { ROUTES } from "@/lib/constants";
import { CheckoutForm } from "./CheckoutForm";

export default async function CheckoutPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);

  const [cartData, mapping] = await Promise.all([
    getCartWithItems(supabase, user.id),
    getCustomerMappingByUserId(supabase, user.id),
  ]);

  if (!cartData || cartData.items.length === 0) {
    redirect(ROUTES.cart);
  }

  const defaultEmail =
    user.email ?? mapping?.customer_email ?? "";

  return (
    <>
      <Header title="Checkout" subtitle="Review and place order" />
      <div className="px-4 md:px-6 space-y-6 pb-8">
        <Section title="Order details">
          <Card>
            <CardContent className="py-4">
              <CheckoutForm items={cartData.items} defaultEmail={defaultEmail} />
            </CardContent>
          </Card>
        </Section>
        <p className="text-sm">
          <Link href={ROUTES.cart} className="text-primary-400 hover:text-primary-300 transition-colors">
            ← Back to cart
          </Link>
        </p>
      </div>
    </>
  );
}
