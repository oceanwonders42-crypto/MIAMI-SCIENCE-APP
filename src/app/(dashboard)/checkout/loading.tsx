import { PageSkeleton } from "@/components/ui/PageSkeleton";

export default function CheckoutLoading() {
  return <PageSkeleton title="Checkout" subtitle="Review and place order" cards={4} />;
}
