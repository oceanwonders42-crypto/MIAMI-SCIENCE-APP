import { PageSkeleton } from "@/components/ui/PageSkeleton";

export default function OrdersLoading() {
  return (
    <PageSkeleton
      title="Orders"
      subtitle="Order history & shipment tracking"
      cards={4}
    />
  );
}
