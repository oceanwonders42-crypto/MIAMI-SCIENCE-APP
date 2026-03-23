/**
 * Database types for Miami Science Tracker (Supabase).
 * Keep in sync with supabase/migrations.
 */

export type UserRole = "customer" | "affiliate" | "admin";

export type ExerciseImageVariant = "men" | "women";

/** Stored on profiles.gender; null = not set (neutral body diagram). */
export type ProfileGender = "male" | "female" | "prefer_not_to_say";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  fitness_goal: string | null;
  preferred_units: string | null;
  timezone: string | null;
  exercise_image_variant: ExerciseImageVariant | null;
  last_customer_auto_link_attempt_at: string | null;
  height_cm: number | null;
  /** Target weight in kg (self-reported goal). */
  goal_weight_kg?: number | null;
  /** Target body fat % (self-reported goal). */
  goal_body_fat_percent?: number | null;
  /** When true, the first-time dashboard tutorial has been completed or skipped. */
  onboarding_tutorial_completed?: boolean | null;
  /** Drives body measurement diagram silhouette; null or omitted = neutral. */
  gender?: ProfileGender | null;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRow {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  name: string | null;
  workout_type: string | null;
  started_at: string;
  completed_at: string | null;
  duration_minutes: number | null;
  bodyweight_kg: number | null;
  energy_score: number | null;
  recovery_score: number | null;
  notes: string | null;
  created_at: string;
}

export interface WorkoutEntry {
  id: string;
  workout_id: string;
  exercise_name: string;
  sets: number | null;
  reps: number | null;
  weight: number | null;
  notes: string | null;
}

export type ExerciseDifficulty = "beginner" | "intermediate" | "advanced";

export interface Exercise {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  category: string | null;
  muscle_group: string | null;
  description: string | null;
  display_order: number | null;
  /** Numbered how-to steps from DB JSONB */
  steps: string[] | null;
  form_tips: string[] | null;
  common_mistakes: string[] | null;
  primary_muscles: string[] | null;
  secondary_muscles: string[] | null;
  difficulty: ExerciseDifficulty | null;
  equipment: string[] | null;
  created_at: string;
}

export interface BodyMetric {
  id: string;
  user_id: string;
  recorded_at: string;
  weight_kg: number | null;
  body_fat_percent?: number | null;
  /** Linear measurements stored in cm: chest_cm, waist_cm, hips_cm, arm_cm, leg_cm */
  measurements: Record<string, number> | null;
  created_at: string;
}

export interface ProgressPhoto {
  id: string;
  user_id: string;
  recorded_at: string;
  storage_path: string;
  created_at: string;
}

export interface Protocol {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface ProtocolLog {
  id: string;
  protocol_id: string;
  logged_at: string;
  adherence: "completed" | "partial" | "skipped";
  notes: string | null;
  created_at: string;
}

export interface Supply {
  id: string;
  user_id: string;
  product_id: string | null;
  name: string;
  unit: string;
  current_count: number;
  starting_quantity: number | null;
  threshold_alert: number | null;
  daily_use_estimate: number | null;
  label_strength: string | null;
  notes: string | null;
  updated_at: string;
}

export interface Product {
  id: string;
  external_id: string | null;
  name: string;
  slug: string;
  image_url: string | null;
  shop_url: string | null;
  description: string | null;
  price_cents: number | null;
  category: string | null;
  created_at: string;
}

export interface UserFavorite {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface Cart {
  id: string;
  user_id: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
}

export interface ProductLink {
  id: string;
  product_id: string;
  label: string;
  url: string;
  sort_order: number;
}

export type CustomerMappingMatchSource = "email" | "manual" | "woo_customer_id" | "imported" | "auto_email";

export interface CustomerMapping {
  id: string;
  user_id: string;
  woo_customer_id: number;
  customer_email: string;
  match_source: CustomerMappingMatchSource;
  matched_at: string;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string | null;
  external_id: string | null;
  order_number: string | null;
  status: string;
  total_cents: number | null;
  currency: string | null;
  item_count: number | null;
  shop_url: string | null;
  metadata: Record<string, unknown> | null;
  referred_by_user_id: string | null;
  customer_email: string | null;
  woo_customer_id: number | null;
  created_at: string;
}

export interface Shipment {
  id: string;
  order_id: string;
  external_id: string | null;
  carrier: string | null;
  tracking_number: string | null;
  status: string;
  shipped_at: string | null;
  estimated_delivery: string | null;
  delivered_at: string | null;
  inventory_updated_at: string | null;
  inventory_updated_by: string | null;
  created_at: string;
}

export interface RewardPointsLedgerEntry {
  id: string;
  user_id: string;
  amount_delta: number;
  reason: string;
  description: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface AffiliateProfile {
  id: string;
  user_id: string;
  referral_code: string;
  coupon_code: string | null;
  referral_link: string | null;
  payout_status: string | null;
  /** User-selected payout channel (app-managed). */
  payout_method: string | null;
  /** JSON details for the selected payout method. */
  payout_details: Record<string, unknown> | null;
  /** SliceWP REST affiliate id (string); optional admin-set for faster API match */
  slicewp_affiliate_id: string | null;
  status: "active" | "paused" | "suspended";
  created_at: string;
  updated_at: string;
}

export interface AffiliateStatsCache {
  id: string;
  user_id: string;
  period: string;
  clicks: number;
  conversions: number;
  commission_cents: number;
  updated_at: string;
}

export interface ChatRoom {
  id: string;
  slug: string;
  name: string;
  is_affiliate_only: boolean;
  created_at: string;
}

export interface ChatRoomMember {
  id: string;
  room_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
  edited_at: string | null;
  is_pinned: boolean;
  is_admin_message: boolean;
}

export interface ChatReadReceipt {
  user_id: string;
  room_id: string;
  last_read_at: string;
  updated_at: string;
}

export interface ChatReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface ChatRoomPresence {
  room_id: string;
  user_id: string;
  last_seen_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
}

export interface ModerationReport {
  id: string;
  reporter_id: string;
  message_id: string;
  room_id: string | null;
  reason: string;
  status: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
}

export interface CheckIn {
  id: string;
  user_id: string;
  check_in_date: string;
  routine_done: boolean;
  worked_out: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  reorder_reminders: boolean;
  comeback_reminders: boolean;
  weekly_recap: boolean;
  announcements: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  /** Secret token for one-click unsubscribe links in notification emails (server-only; never expose to client). */
  email_unsubscribe_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: string;
  created_at: string;
  updated_at: string;
}

export type NotificationLogType =
  | "reorder_reminder"
  | "comeback_reminder"
  | "weekly_recap"
  | "low_supply_alert";

export interface SupplyDailyLog {
  id: string;
  user_id: string;
  supply_id: string;
  log_date: string;
  taken: boolean;
  created_at: string;
  updated_at: string;
}
export type NotificationLogChannel = "email" | "push";
export type NotificationLogStatus = "sent" | "skipped" | "failed";

export interface NotificationLogRow {
  id: string;
  user_id: string;
  notification_type: NotificationLogType;
  channel: NotificationLogChannel;
  status: NotificationLogStatus;
  reason: string | null;
  sent_at: string | null;
  created_at: string;
}
