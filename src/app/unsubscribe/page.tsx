import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Email preferences",
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; e?: string }>;
}) {
  const sp = await searchParams;
  const ok = sp.ok === "1";
  const err = sp.e;

  let message: { tone: "ok" | "err" | "neutral"; title: string; body: string } = {
    tone: "neutral",
    title: "Unsubscribe",
    body: "Use the link in your email to manage email preferences.",
  };

  if (ok) {
    message = {
      tone: "ok",
      title: "You’re unsubscribed",
      body: "We’ve turned off notification emails for your account. You can turn them back on anytime from the app’s Account tab.",
    };
  } else if (err === "missing") {
    message = {
      tone: "err",
      title: "Link incomplete",
      body: "This unsubscribe link is missing required information. Use the link from your latest email.",
    };
  } else if (err === "invalid") {
    message = {
      tone: "err",
      title: "Link expired or invalid",
      body: "We couldn’t verify this unsubscribe link. Use the link from a recent email, or sign in and re-enable emails from Account settings.",
    };
  } else if (err === "server") {
    message = {
      tone: "err",
      title: "Something went wrong",
      body: "Please try again later or sign in to update your preferences from the app.",
    };
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full rounded-xl border border-zinc-800 bg-zinc-950/80 p-8 shadow-lg">
        <h1 className="text-xl font-semibold text-zinc-100 mb-2">{message.title}</h1>
        <p
          className={
            message.tone === "ok"
              ? "text-zinc-300 text-sm leading-relaxed"
              : message.tone === "err"
                ? "text-red-300/90 text-sm leading-relaxed"
                : "text-zinc-400 text-sm leading-relaxed"
          }
        >
          {message.body}
        </p>
        <p className="mt-6 text-sm">
          <Link href={ROUTES.login} className="text-primary-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
