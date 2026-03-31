"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { authErrorHint, logAuthError } from "@/lib/auth-errors";
import { ROUTES } from "@/lib/constants";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [wpLoading, setWpLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signInError) {
      logAuthError("signInWithPassword", signInError);
      const hint = authErrorHint(signInError.message);
      setError(
        hint ? `${signInError.message}\n\n${hint}` : signInError.message
      );
      return;
    }
    router.push(ROUTES.dashboard);
    router.refresh();
  }

  async function handleWordPressSignIn() {
    setError(null);
    const identifier = email.trim();
    if (!identifier || !password) {
      setError("Enter your WordPress email/username and password.");
      return;
    }
    setWpLoading(true);
    try {
      const res = await fetch("/api/auth/wordpress-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string; email?: string; otp?: string }
        | null;
      if (!res.ok || !json?.ok || !json.email || !json.otp) {
        setError(json?.error || "WordPress sign-in failed.");
        return;
      }
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.verifyOtp({
        email: json.email,
        token: json.otp,
        type: "magiclink",
      });
      if (otpError) {
        setError(`WordPress login succeeded, but session sign-in failed: ${otpError.message}`);
        return;
      }
      router.push(ROUTES.dashboard);
      router.refresh();
    } catch {
      setError("WordPress sign-in is temporarily unavailable.");
    } finally {
      setWpLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-950/40 border border-red-900/50 text-red-400 text-sm p-3 whitespace-pre-line">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-primary-500 hover:bg-primary-400 text-zinc-900 font-semibold py-2.5 text-sm disabled:opacity-50 transition-colors"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
      <button
        type="button"
        onClick={handleWordPressSignIn}
        disabled={wpLoading}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-100 font-semibold py-2.5 text-sm disabled:opacity-50 transition-colors"
      >
        {wpLoading ? "Connecting to WordPress…" : "Continue with WordPress"}
      </button>
    </form>
  );
}
