export const APP_NAME = "Miami Science Tracker";

/** When true, hide Admin from nav and any customer-facing admin entry points (App Store build). */
export const isAppStoreBuild =
  process.env.NEXT_PUBLIC_APP_STORE_BUILD === "true";

export const DISCLAIMER =
  "This app is for informational and self-tracking purposes only and does not provide medical advice. Always follow the guidance of your licensed healthcare professional.";

/** Stack/supply/BMI: no dosing, no recommendations. */
export const STACK_DISCLAIMER =
  "For self-tracking only. Not medical advice. This app does not prescribe, recommend, or calculate what you should take. Enter protocol targets only if provided by your clinician or for your own reference.";

/** Store URL (Miami Science store at mia-science.com, Droplet-hosted). Sync boundary: lib/integrations/store-config and store-sync. */
export const SHOP_REFILL_URL = process.env.NEXT_PUBLIC_STORE_URL ?? process.env.NEXT_PUBLIC_SHOP_REFILL_URL ?? "https://mia-science.com";

export const FITNESS_GOALS = [
  { value: "general_fitness", label: "General fitness" },
  { value: "strength", label: "Strength" },
  { value: "endurance", label: "Endurance" },
  { value: "recovery", label: "Recovery & wellness" },
  { value: "other", label: "Other" },
] as const;

export const PREFERRED_UNITS = [
  { value: "metric", label: "Metric (kg, cm)" },
  { value: "imperial", label: "Imperial (lb, in)" },
] as const;

/** Profile gender for body diagram (empty = neutral silhouette). */
export const PROFILE_GENDER_OPTIONS = [
  { value: "", label: "Not set (neutral figure)" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export const WORKOUT_TYPES = [
  "Strength",
  "Cardio",
  "HIIT",
  "Recovery",
  "Sports",
  "Other",
] as const;

/** Fixed redemption options. Points are deducted from balance via `redeem_reward_points` RPC. */
export const REDEMPTION_OPTIONS = [
  {
    id: "free_shipping",
    points: 50,
    label: "Free shipping on next order",
    description: "Waive standard shipping on your next qualifying order.",
  },
  {
    id: "10off",
    points: 100,
    label: "$10 off next order",
    description: "Redeem for a discount on your next purchase.",
  },
  {
    id: "off_15_next",
    points: 150,
    label: "15% off next order",
    description: "Percentage discount applied to your next order subtotal.",
  },
  {
    id: "free_sample",
    points: 200,
    label: "Free product sample",
    description: "Complimentary sample added to your next shipment (subject to availability).",
  },
  {
    id: "25off",
    points: 250,
    label: "$25 off next order",
    description: "Redeem for a larger discount on your next purchase.",
  },
  {
    id: "vip_early",
    points: 300,
    label: "VIP early access to new products",
    description: "Get early access when new products drop.",
  },
  {
    id: "off_30_6months",
    points: 500,
    label: "30% off all orders for 6 months",
    description:
      "Redeem for 30% off all qualifying orders for six months from redemption (program terms apply).",
  },
] as const;

export type RedemptionOptionId = (typeof REDEMPTION_OPTIONS)[number]["id"];

export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  /** Public page: must match Supabase email redirect & handle recovery session (hash or ?code=). */
  resetPassword: "/reset-password",
  onboarding: "/onboarding",
  dashboard: "/dashboard",
  training: "/training",
  trainingBrowse: "/training/browse",
  trainingWorkout: (id: string) => `/training/workout/${id}`,
  trainingExercise: (slug: string) => `/training/exercise/${slug}`,
  progress: "/progress",
  stack: "/stack",
  orders: "/orders",
  orderShipmentAddToStack: (shipmentId: string) => `/orders/shipment/${shipmentId}/add-to-stack`,
  rewards: "/rewards",
  affiliate: "/affiliate",
  community: "/community",
  account: "/account",
  help: "/help",
  catalog: "/catalog",
  cart: "/cart",
  checkout: "/checkout",
  checkoutSuccess: "/checkout/success",
  admin: "/admin",
  adminIntegrations: "/admin/integrations",
  adminAnnouncements: "/admin/announcements",
  adminRewards: "/admin/rewards",
} as const;

/** Store order history / account (WooCommerce my-account). Use for payment handoff. */
export const STORE_ORDERS_URL =
  process.env.NEXT_PUBLIC_STORE_ORDERS_URL ||
  `${SHOP_REFILL_URL.replace(/\/$/, "")}/my-account/orders`;
