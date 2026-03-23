import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { getFAQByCategory } from "@/lib/faq";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { SHOP_REFILL_URL } from "@/lib/constants";

const CATEGORY_LABELS: Record<string, string> = {
  about: "About Mia Science",
  app: "Using the app",
  orders: "Orders & shipments",
  rewards: "Rewards & points",
  stack: "My Stack & refill",
  account: "Account",
  general: "General",
};

export default function HelpPage() {
  const byCategory = getFAQByCategory();

  return (
    <>
      <Header title="Help" subtitle="FAQ & support" />
      <div className="px-4 md:px-6 space-y-6 pb-8">
        <Section title="Mia Science">
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="py-5 space-y-4">
              <p className="text-sm text-zinc-300">
                Research-use products, transparency, and community. Shop and learn more at mia-science.com.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={SHOP_REFILL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-medium py-2.5 px-4 text-sm"
                >
                  Shop at mia-science.com
                </a>
                <a
                  href="https://mia-science.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-zinc-600 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  Visit mia-science.com
                </a>
              </div>
            </CardContent>
          </Card>
        </Section>
        <Section title="Frequently asked questions">
          {Array.from(byCategory.entries()).map(([cat, entries]) => {
            if (entries.length === 0) return null;
            return (
              <Card key={cat}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {CATEGORY_LABELS[cat] ?? cat}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {entries.map((entry) => (
                    <div key={entry.id} className="border-b border-zinc-100 dark:border-zinc-700 last:border-0 pb-4 last:pb-0">
                      <p className="font-medium text-sm text-zinc-100">
                        {entry.question}
                      </p>
                      <p className="text-sm text-zinc-400 mt-1 whitespace-pre-wrap">
                        {entry.answer}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </Section>
        <Disclaimer compact className="text-center" />
      </div>
    </>
  );
}
