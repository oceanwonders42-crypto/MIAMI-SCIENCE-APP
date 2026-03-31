"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ROUTES } from "@/lib/constants";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const normalizedEmail = email.trim().toLowerCase();
      const { error: supabaseError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (!supabaseError) {
        router.push(ROUTES.dashboard);
        router.refresh();
        return;
      }

      // Fall back to WordPress-backed auth bridge with same credentials.
      const res = await fetch("/api/auth/wordpress-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: normalizedEmail, password }),
      });
      if (res.ok) {
        const json = (await res.json().catch(() => null)) as
          | { ok?: boolean; email?: string; otp?: string }
          | null;
        if (json?.ok && json.email && json.otp) {
          const { error: otpError } = await supabase.auth.verifyOtp({
            email: json.email,
            token: json.otp,
            type: "magiclink",
          });
          if (!otpError) {
            router.push(ROUTES.dashboard);
            router.refresh();
            return;
          }
        }
      }

      setError("Invalid email or password.");
    } catch {
      setError("Sign in is temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
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
    </form>
  );
}
