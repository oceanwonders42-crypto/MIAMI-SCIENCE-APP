import Link from "next/link";
import { ResetPasswordForm } from "./reset-password-form";
import { ROUTES } from "@/lib/constants";

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
          Choose a new password
        </h1>
        <p className="text-sm text-zinc-500 px-1">
          Enter a new password for your account. This page opens from the link
          in your email.
        </p>
      </div>
      <ResetPasswordForm />
      <p className="text-center text-sm">
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
