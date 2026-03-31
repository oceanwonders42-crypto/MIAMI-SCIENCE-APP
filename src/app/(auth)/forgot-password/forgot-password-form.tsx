"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPasswordResetRedirectTo } from "@/lib/password-reset";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your email address.");
      return;
    }
    setLoading(true);
    let redirectTo: string;
    try {
      redirectTo = getPasswordResetRedirectTo();
    } catch (err) {
      setLoading(false);
      setError(
        err instanceof Error
          ? err.message
          : "App URL is not configured. Set NEXT_PUBLIC_SITE_URL."
      );
      return;
    }

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      trimmed,
      { redirectTo }
    );
    setLoading(false);
    if (resetError) {
      const msg = resetError.message.toLowerCase();
      if (msg.includes("rate") || msg.includes("too many")) {
        setError("Too many attempts. Wait a few minutes and try again.");
      } else if (msg.includes("redirect") || msg.includes("url")) {
        setError(
          "Reset link URL is not allowed. Add your site URL and /reset-password to Supabase Auth → URL Configuration → Redirect URLs."
        );
      } else {
        setError(resetError.message);
      }
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <div className="rounded-[1.25rem] bg-emerald-950/40 border border-emerald-800/45 text-emerald-100 text-sm p-5 leading-relaxed shadow-lg shadow-emerald-950/15">
          <p className="font-semibold text-emerald-50 mb-2">Check your email</p>
          <p>
            If an account exists for{" "}
            <span className="text-emerald-200 font-medium">{email.trim()}</span>
            , we sent a link to reset your password. It may take a minute to
            arrive.
          </p>
          <p className="mt-3 text-emerald-200/85 text-xs">
            Didn&apos;t get it? Check spam, or request another link below.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setError(null);
          }}
          className="w-full min-h-[48px] rounded-xl border border-zinc-600 bg-zinc-800/60 text-zinc-200 font-medium text-sm hover:bg-zinc-800 touch-manipulation"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl bg-red-950/40 border border-red-900/50 text-red-300 text-sm p-3 leading-snug">
          {error}
        </div>
      )}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-zinc-300 mb-1.5"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full min-h-[48px] rounded-xl border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-base text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          placeholder="you@example.com"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm disabled:opacity-50 shadow-md shadow-emerald-900/25 transition-all active:scale-[0.98] touch-manipulation"
      >
        {loading ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
