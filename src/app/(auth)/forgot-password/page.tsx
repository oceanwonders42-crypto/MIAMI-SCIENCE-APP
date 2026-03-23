import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";
import { ROUTES } from "@/lib/constants";

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
          Forgot password
        </h1>
        <p className="text-sm text-zinc-500">
          Enter your email and we&apos;ll send you a link to choose a new password
        </p>
      </div>
      <ForgotPasswordForm />
      <p className="text-center text-sm">
        <Link href={ROUTES.login} className="text-zinc-500 hover:text-zinc-400 transition-colors">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
