import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { ROUTES } from "@/lib/constants";

const QA_AREAS = [
  {
    title: "Orders",
    description: "Order list, shipment display, add to stack from delivery.",
    links: [
      { label: "Orders page (as user)", href: ROUTES.orders },
      { label: "Customer mappings (linked/unmatched)", href: "/admin/mappings" },
    ],
    checks: ["Orders load for test user", "Shipments show carrier/tracking", "Unmatched orders visible in admin"],
  },
  {
    title: "Shipments",
    description: "ShipStation sync, webhook ingestion, status on orders.",
    links: [
      { label: "Sync & status (run ShipStation sync)", href: "/admin/sync" },
      { label: "Integrations (last sync result)", href: "/admin/integrations" },
    ],
    checks: ["ShipStation configured and callable", "Sync runs and updates counts", "Webhook route responds"],
  },
  {
    title: "Rewards",
    description: "Points balance, ledger, redemption.",
    links: [
      { label: "Rewards page (as user)", href: ROUTES.rewards },
    ],
    checks: ["Balance displays", "Redemption records", "No double-spend"],
  },
  {
    title: "Notifications",
    description: "Email delivery, cron job, preferences.",
    links: [
      { label: "Notification test", href: "/admin/notifications" },
      { label: "Recent sends (log)", href: "/admin/notifications" },
    ],
    checks: ["Test send works", "Cron secret set", "Recent sends visible"],
  },
  {
    title: "Affiliate",
    description: "Profiles, stats, referred orders.",
    links: [
      { label: "Affiliates list", href: "/admin/affiliates" },
      { label: "Affiliate dashboard (as affiliate)", href: ROUTES.affiliate },
    ],
    checks: ["Affiliate profile loads", "Stats and referred orders show"],
  },
  {
    title: "Customer mappings",
    description: "Store–app linkage, backfill, manual mapping.",
    links: [
      { label: "Mappings & diagnostics", href: "/admin/mappings" },
      { label: "WooCommerce backfill", href: "/admin/backfill" },
    ],
    checks: ["Order diagnostics show linked/unmatched", "Backfill creates mappings", "Manual mapping works"],
  },
  {
    title: "Checkout",
    description: "Cart, checkout flow, order creation in WooCommerce.",
    links: [
      { label: "Catalog (add to cart)", href: ROUTES.catalog },
      { label: "Cart", href: ROUTES.cart },
      { label: "Checkout", href: ROUTES.checkout },
    ],
    checks: ["Add to cart persists", "Checkout creates order in store", "Success page and Orders show new order"],
  },
];

export default function AdminQAPage() {
  return (
    <>
      <Header title="QA & launch readiness" subtitle="Internal checklist and links" />
      <div className="px-4 md:px-6 space-y-6 pb-8">
        <Section title="QA areas">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Use these links and checks before launch. See docs/LAUNCH_CHECKLIST.md for the full list.
          </p>
          <div className="space-y-4">
            {QA_AREAS.map((area) => (
              <Card key={area.title}>
                <CardHeader>
                  <CardTitle className="text-base">{area.title}</CardTitle>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {area.description}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Links</p>
                    <ul className="flex flex-wrap gap-2">
                      {area.links.map((l) => (
                        <li key={l.href}>
                          <Link
                            href={l.href}
                            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                          >
                            {l.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Checks</p>
                    <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-0.5">
                      {area.checks.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>
        <p className="text-sm">
          <Link href={ROUTES.admin} className="text-primary-600 dark:text-primary-400 hover:underline">
            ← Back to admin
          </Link>
        </p>
      </div>
    </>
  );
}
