export interface FAQEntry {
  id: string;
  question: string;
  answer: string;
  category?: "about" | "app" | "orders" | "rewards" | "stack" | "account" | "general";
}

export const FAQ_ENTRIES: FAQEntry[] = [
  {
    id: "what-is-mia",
    category: "about",
    question: "What is Mia Science?",
    answer:
      "Mia Science (mia-science.com) offers research-use peptides and related products with a focus on transparency, quality, and community. Products are for research use only. The tracker app helps you log workouts, track supply, view orders, and earn rewards — it does not provide medical or dosing advice.",
  },
  {
    id: "research-use",
    category: "about",
    question: "What does research-use mean?",
    answer:
      "Products are positioned for research and educational use. Always follow your clinician’s guidance and product labeling. Mia Science emphasizes transparent sourcing and quality; the app supports tracking and ordering only.",
  },
  {
    id: "what-is-tracker",
    category: "app",
    question: "What is the Miami Science Tracker?",
    answer:
      "The tracker is a companion app for Mia Science customers. Log workouts, track supply, see orders and shipments, earn and redeem reward points. It does not provide medical or dosing advice.",
  },
  {
    id: "how-check-in",
    category: "app",
    question: "How do daily check-ins work?",
    answer:
      "On the dashboard, use the Daily check-in card to log whether you did your routine and worked out today. Optional notes help you track energy or mood. Check in each day to build a streak.",
  },
  {
    id: "where-orders",
    category: "orders",
    question: "Where do my orders come from?",
    answer:
      "Orders are synced from the Miami Science store when you place an order on the website. If you don’t see an order, check that you’re logged in with the same account and allow a short delay for sync.",
  },
  {
    id: "track-shipment",
    category: "orders",
    question: "How do I track a shipment?",
    answer:
      "Open Orders and expand the order. Shipment status, carrier, and tracking number (when available) are shown. For delivered shipments, you can use “Add to supply” to update your stack.",
  },
  {
    id: "how-rewards",
    category: "rewards",
    question: "How do I earn reward points?",
    answer:
      "Points are earned on qualifying purchases at the Miami Science store. Your balance and history appear on the Rewards page. Redeem points for discounts when you have enough; redemptions are logged and may be applied at checkout or via a code sent to you.",
  },
  {
    id: "redeem-points",
    category: "rewards",
    question: "How do I redeem points?",
    answer:
      "On the Rewards page, open the Redeem section and choose an option. Your balance is deducted and the redemption is recorded. Contact Miami Science support if you need a discount code or help at checkout.",
  },
  {
    id: "stack-supply",
    category: "stack",
    question: "What is My Stack?",
    answer:
      "My Stack is where you track your supplement supply: product name, quantity, unit, and optional daily use. Set an alert threshold to get low-supply reminders. The app estimates days left and runout dates when you enter daily use.",
  },
  {
    id: "refill-timing",
    category: "stack",
    question: "When should I reorder?",
    answer:
      "The app shows refill timing on the dashboard and Stack: items below your threshold, running low soon, and estimated runout. A recommended “order by” date is shown so you can reorder in time. Use “Buy again” or “Shop refill” to open the store.",
  },
  {
    id: "account-settings",
    category: "account",
    question: "How do I update my profile?",
    answer:
      "Go to Account to edit your display name, fitness goal, units, and timezone. Email and role are shown but managed by your account provider.",
  },
  {
    id: "contact-support",
    category: "general",
    question: "How do I contact support?",
    answer:
      "For orders, shipments, reward codes, or account issues, contact Miami Science support through the store website or the contact details provided there. The app does not provide medical or dosing advice.",
  },
];

export function getFAQByCategory(): Map<string, FAQEntry[]> {
  const map = new Map<string, FAQEntry[]>();
  const order = ["about", "app", "orders", "rewards", "stack", "account", "general"];
  for (const cat of order) {
    map.set(cat, FAQ_ENTRIES.filter((e) => e.category === cat));
  }
  return map;
}
