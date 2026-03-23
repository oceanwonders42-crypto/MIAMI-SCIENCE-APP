import { PageSkeleton } from "@/components/ui/PageSkeleton";

export default function CartLoading() {
  return <PageSkeleton title="Cart" subtitle="Loading…" cards={3} />;
}
