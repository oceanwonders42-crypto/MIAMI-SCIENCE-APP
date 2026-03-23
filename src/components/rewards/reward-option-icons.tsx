import type { LucideIcon } from "lucide-react";
import {
  Crown,
  Gift,
  PercentCircle,
  Tag,
  TicketPercent,
  Truck,
  BadgePercent,
} from "lucide-react";
import type { RedemptionOptionId } from "@/lib/constants";

const ICONS: Record<RedemptionOptionId, LucideIcon> = {
  free_shipping: Truck,
  "10off": Tag,
  off_15_next: PercentCircle,
  free_sample: Gift,
  "25off": TicketPercent,
  vip_early: Crown,
  off_30_6months: BadgePercent,
};

export function getRewardOptionIcon(optionId: string): LucideIcon {
  return ICONS[optionId as RedemptionOptionId] ?? Gift;
}
