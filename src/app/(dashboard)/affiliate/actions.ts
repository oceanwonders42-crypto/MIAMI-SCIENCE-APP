"use server";

import { createServerClient } from "@/lib/supabase/server";
import { updateAffiliatePayoutByUserId } from "@/lib/affiliates";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/constants";

export type PayoutMethodId = "cash_app" | "venmo" | "paypal" | "zelle" | "bank";

const METHODS: PayoutMethodId[] = ["cash_app", "venmo", "paypal", "zelle", "bank"];

function sanitize(s: unknown): string {
  return typeof s === "string" ? s.trim() : "";
}

export async function saveAffiliatePayoutAction(
  _prevState: { ok: boolean; message: string },
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const raw = sanitize(formData.get("payout_method"));
  if (!METHODS.includes(raw as PayoutMethodId)) {
    return { ok: false, message: "Select a valid payout method." };
  }
  const payout_method = raw as PayoutMethodId;

  let payout_details: Record<string, unknown> = {};

  switch (payout_method) {
    case "cash_app": {
      const cashtag = sanitize(formData.get("cashtag")).replace(/^\$+/, "");
      if (!cashtag) return { ok: false, message: "Enter your $Cashtag." };
      payout_details = { cashtag: cashtag.startsWith("$") ? cashtag : `$${cashtag}` };
      break;
    }
    case "venmo": {
      const handle = sanitize(formData.get("venmo_handle")).replace(/^@+/, "");
      if (!handle) return { ok: false, message: "Enter your Venmo @handle." };
      payout_details = { handle: `@${handle}` };
      break;
    }
    case "paypal": {
      const email = sanitize(formData.get("paypal_email"));
      if (!email || !email.includes("@")) return { ok: false, message: "Enter a valid PayPal email." };
      payout_details = { email };
      break;
    }
    case "zelle": {
      const zelle = sanitize(formData.get("zelle_destination"));
      if (!zelle) return { ok: false, message: "Enter a phone number or email for Zelle." };
      payout_details = { destination: zelle };
      break;
    }
    case "bank": {
      const routing = sanitize(formData.get("bank_routing"));
      const account = sanitize(formData.get("bank_account"));
      const holder = sanitize(formData.get("account_holder"));
      if (!routing || !account || !holder) {
        return { ok: false, message: "Fill in routing, account, and account holder name." };
      }
      payout_details = {
        routing_number: routing,
        account_number: account,
        account_holder: holder,
      };
      break;
    }
    default:
      return { ok: false, message: "Invalid method." };
  }

  const { error } = await updateAffiliatePayoutByUserId(supabase, user.id, {
    payout_method,
    payout_details,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath(ROUTES.affiliate);
  return { ok: true, message: "Payment info saved." };
}
