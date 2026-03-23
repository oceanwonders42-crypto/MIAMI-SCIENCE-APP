"use client";

import { useActionState, useMemo } from "react";
import { saveAffiliatePayoutAction } from "@/app/(dashboard)/affiliate/actions";
import type { AffiliateProfile } from "@/types";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const METHODS = [
  { id: "cash_app" as const, label: "Cash App", hint: "$Cashtag" },
  { id: "venmo" as const, label: "Venmo", hint: "@handle" },
  { id: "paypal" as const, label: "PayPal", hint: "Email" },
  { id: "zelle" as const, label: "Zelle", hint: "Phone or email" },
  { id: "bank" as const, label: "Bank transfer", hint: "Routing + account" },
];

const METHOD_LABELS: Record<string, string> = Object.fromEntries(
  METHODS.map((m) => [m.id, m.label])
);

function detailsDefaults(profile: AffiliateProfile | null): Record<string, string> {
  const d = (profile?.payout_details ?? {}) as Record<string, unknown>;
  const str = (k: string) => (typeof d[k] === "string" ? d[k] : "");
  return {
    cashtag: str("cashtag"),
    venmo_handle: str("handle").replace(/^@/, ""),
    paypal_email: str("email"),
    zelle_destination: str("destination"),
    bank_routing: str("routing_number"),
    bank_account: str("account_number"),
    account_holder: str("account_holder"),
  };
}

export function AffiliatePayoutForm({ profile }: { profile: AffiliateProfile | null }) {
  const initial = useMemo(() => detailsDefaults(profile), [profile]);
  const [state, formAction, pending] = useActionState(saveAffiliatePayoutAction, {
    ok: false,
    message: "",
  });

  if (!profile) return null;

  const selected = profile.payout_method ?? "cash_app";

  const methodLabel = profile.payout_method
    ? METHOD_LABELS[profile.payout_method] ?? profile.payout_method
    : null;

  return (
    <Card className="border-zinc-800 bg-zinc-950/40">
      <CardContent className="pt-6">
        <p className="text-sm text-zinc-500 mb-4">
          Choose how you want to receive commissions: Cash App ($Cashtag), Venmo (@handle), PayPal (email),
          Zelle (phone/email), or bank transfer. You can update this anytime.
        </p>
        {methodLabel && (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-950/25 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500/90">
              Current saved payout method
            </p>
            <p className="text-sm font-semibold text-emerald-100 mt-1">{methodLabel}</p>
            <p className="text-xs text-zinc-500 mt-1">Details below — save again to update.</p>
          </div>
        )}
        <form key={profile.updated_at} action={formAction} className="space-y-6">
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-zinc-300 mb-2">Payout method</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {METHODS.map((m) => (
                <label
                  key={m.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                    selected === m.id
                      ? "border-amber-500/50 bg-amber-500/10"
                      : "border-zinc-800 hover:border-zinc-600"
                  )}
                >
                  <input
                    type="radio"
                    name="payout_method"
                    value={m.id}
                    defaultChecked={selected === m.id}
                    className="accent-amber-500"
                  />
                  <span>
                    <span className="block text-sm font-medium text-zinc-100">{m.label}</span>
                    <span className="text-xs text-zinc-500">{m.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Details</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-xs text-zinc-400">Cash App — $Cashtag</span>
                <input
                  name="cashtag"
                  defaultValue={initial.cashtag}
                  placeholder="$yourtag"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs text-zinc-400">Venmo — @handle</span>
                <input
                  name="venmo_handle"
                  defaultValue={initial.venmo_handle}
                  placeholder="username"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs text-zinc-400">PayPal — email</span>
                <input
                  name="paypal_email"
                  type="email"
                  defaultValue={initial.paypal_email}
                  placeholder="you@email.com"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-xs text-zinc-400">Zelle — phone or email</span>
                <input
                  name="zelle_destination"
                  defaultValue={initial.zelle_destination}
                  placeholder="+1… or email"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs text-zinc-400">Bank — routing</span>
                <input
                  name="bank_routing"
                  defaultValue={initial.bank_routing}
                  placeholder="9 digits"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs text-zinc-400">Bank — account #</span>
                <input
                  name="bank_account"
                  defaultValue={initial.bank_account}
                  placeholder="Account number"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-xs text-zinc-400">Account holder name</span>
                <input
                  name="account_holder"
                  defaultValue={initial.account_holder}
                  placeholder="Name on account"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                />
              </label>
            </div>
            <p className="text-xs text-zinc-600">
              Only the fields for your selected method need to be filled. Other fields are ignored.
            </p>
          </div>

          {state?.message && (
            <p
              className={cn(
                "text-sm font-medium",
                state.ok ? "text-emerald-400" : "text-red-400"
              )}
              role="status"
            >
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full sm:w-auto rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-3 px-8 text-sm disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save payment info"}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
