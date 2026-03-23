"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ROUTES } from "@/lib/constants";
import {
  mapPasswordUpdateError,
  mapRecoverySessionError,
} from "@/lib/password-reset";

type Phase = "checking" | "ready" | "error" | "success";

function ResetPasswordFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [phase, setPhase] = useState<Phase>("checking");
  const [banner, setBanner] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const fail = (msg: string) => {
      if (cancelled) return;
      setBanner(msg);
      setPhase("error");
    };

    const succeed = () => {
      if (cancelled) return;
      setPhase("ready");
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (
        session?.user &&
        (event === "PASSWORD_RECOVERY" ||
          event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED")
      ) {
        succeed();
      }
    });

    (async () => {
      try {
        if (code) {
          const { error: exchangeErr } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeErr) {
            fail(mapRecoverySessionError(exchangeErr.message));
            return;
          }
          if (typeof window !== "undefined") {
            window.history.replaceState(null, "", ROUTES.resetPassword);
          }
        }

        const {
          data: { session },
          error: sessionErr,
        } = await supabase.auth.getSession();
        if (cancelled) return;
        if (sessionErr) {
          fail(mapRecoverySessionError(sessionErr.message));
          return;
        }
        if (session?.user) {
          succeed();
          if (typeof window !== "undefined" && window.location.hash) {
            window.history.replaceState(null, "", ROUTES.resetPassword);
          }
          return;
        }

        for (let i = 0; i < 20; i++) {
          await new Promise((r) => setTimeout(r, 80));
          if (cancelled) return;
          const { data: d2 } = await supabase.auth.getSession();
          if (d2.session?.user) {
            succeed();
            if (typeof window !== "undefined" && window.location.hash) {
              window.history.replaceState(null, "", ROUTES.resetPassword);
            }
            return;
          }
        }

        fail(
          "This reset link is invalid or has expired. Request a new one from Forgot password."
        );
      } catch {
        fail(
          "Something went wrong. Try opening the link again or request a new reset."
        );
      }
    })();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [code]);

  useEffect(() => {
    if (phase !== "success") return;
    const t = setTimeout(() => {
      router.push(`${ROUTES.login}?reset=success`);
    }, 2200);
    return () => clearTimeout(t);
  }, [phase, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    if (password !== confirm) {
      setBanner("Passwords don’t match.");
      return;
    }
    if (password.length < 8) {
      setBanner("Use at least 8 characters for your password.");
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      setBanner(mapPasswordUpdateError(error.message));
      return;
    }
    setPhase("success");
    await supabase.auth.signOut();
  }

  if (phase === "checking") {
    return (
      <div className="rounded-[1.25rem] border border-white/[0.08] bg-gradient-to-br from-zinc-900/90 via-zinc-900/80 to-emerald-950/20 px-4 py-10 text-center text-sm text-zinc-400 shadow-lg shadow-black/20">
        Verifying your reset link…
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="space-y-4">
        <div className="rounded-[1.25rem] bg-red-950/35 border border-red-900/45 text-red-200 text-sm p-4 leading-relaxed">
          {banner}
        </div>
        <Link
          href={ROUTES.forgotPassword}
          className="flex min-h-[48px] items-center justify-center w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 font-semibold text-sm text-white shadow-md shadow-emerald-900/25 active:scale-[0.98] touch-manipulation"
        >
          Request a new link
        </Link>
        <p className="text-center text-sm pt-1">
          <Link
            href={ROUTES.login}
            className="text-zinc-500 hover:text-zinc-400 transition-colors"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  if (phase === "success") {
    return (
      <div className="rounded-[1.25rem] bg-emerald-950/40 border border-emerald-700/35 text-emerald-100 text-sm p-6 text-center space-y-2 shadow-lg shadow-emerald-950/20">
        <p className="font-semibold text-base">Password updated</p>
        <p className="text-emerald-200/90">Redirecting to sign in…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {banner && (
        <div className="rounded-xl bg-amber-950/35 border border-amber-900/40 text-amber-100 text-sm p-3 leading-snug">
          {banner}
        </div>
      )}
      <div>
        <label
          htmlFor="new-password"
          className="block text-sm font-medium text-zinc-300 mb-1.5"
        >
          New password
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full min-h-[48px] rounded-xl border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-base text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          placeholder="At least 8 characters"
        />
      </div>
      <div>
        <label
          htmlFor="confirm-password"
          className="block text-sm font-medium text-zinc-300 mb-1.5"
        >
          Confirm password
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
          className="w-full min-h-[48px] rounded-xl border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-base text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          placeholder="Re-enter password"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm disabled:opacity-50 shadow-md shadow-emerald-900/25 transition-all active:scale-[0.98] touch-manipulation"
      >
        {submitting ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}

export function ResetPasswordForm() {
  return (
    <Suspense
      fallback={
        <div className="rounded-[1.25rem] border border-zinc-700 bg-zinc-900/50 px-4 py-10 text-center text-sm text-zinc-400">
          Loading…
        </div>
      }
    >
      <ResetPasswordFormInner />
    </Suspense>
  );
}
