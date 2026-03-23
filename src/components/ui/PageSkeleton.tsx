import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/Card";

interface PageSkeletonProps {
  title: string;
  subtitle?: string;
  /** Number of skeleton cards to show (default 3). */
  cards?: number;
}

export function PageSkeleton({ title, subtitle, cards = 3 }: PageSkeletonProps) {
  return (
    <>
      <Header title={title} subtitle={subtitle} />
      <div className="px-4 md:px-6 space-y-6 pb-8">
        {Array.from({ length: cards }).map((_, i) => (
          <Card key={i}>
            <CardContent className="py-4">
              <div className="flex gap-3">
                <div className="w-16 h-16 rounded-lg bg-zinc-700 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-zinc-700 rounded animate-pulse" />
                  <div className="h-3 w-full bg-zinc-700 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-zinc-700 rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
